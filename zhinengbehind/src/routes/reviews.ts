import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const reviewsRouter = Router();

// GET /api/reviews - 审核任务列表
reviewsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, keyword, page = '1', pageSize = '20' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push('q.m08_status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(c.case_name LIKE ? OR q.case_id LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const [rows] = await pool.query(
      `SELECT q.*, c.case_name, c.patent_type, c.tech_field, c.engineer
       FROM sys_quality_check q
       JOIN sys_case c ON q.case_id = c.case_id
       ${where}
       ORDER BY q.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sys_quality_check q JOIN sys_case c ON q.case_id = c.case_id ${where}`,
      params
    ) as any;

    res.json({ code: 0, data: { list: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/reviews/stats - 审核统计
reviewsRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM sys_quality_check') as any;
    const [byResult] = await pool.query(
      'SELECT audit_result, COUNT(*) as count FROM sys_quality_check GROUP BY audit_result'
    );
    const [byStatus] = await pool.query(
      'SELECT m08_status, COUNT(*) as count FROM sys_quality_check GROUP BY m08_status'
    );
    res.json({ code: 0, data: { total, byResult, byStatus } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/reviews/:id - 审核详情
reviewsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [[row]] = await pool.query(
      `SELECT q.*, c.case_name, c.patent_type, c.tech_field
       FROM sys_quality_check q
       JOIN sys_case c ON q.case_id = c.case_id
       WHERE q.id = ?`,
      [req.params.id]
    ) as any;
    if (!row) return res.status(404).json({ code: -1, message: '审核记录不存在' });
    res.json({ code: 0, data: row });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/reviews/:id - 更新审核结果
reviewsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { audit_result, audit_remark, ai_advice, audit_user, m08_status } = req.body;
    await pool.query(
      `UPDATE sys_quality_check SET
        audit_result = COALESCE(?, audit_result),
        audit_remark = COALESCE(?, audit_remark),
        ai_advice = COALESCE(?, ai_advice),
        audit_user = COALESCE(?, audit_user),
        m08_status = COALESCE(?, m08_status),
        audit_time = IF(? IS NOT NULL, NOW(), audit_time)
       WHERE id = ?`,
      [audit_result, audit_remark, ai_advice, audit_user, m08_status, audit_result, req.params.id]
    );

    if (audit_result) {
      const [[row]] = await pool.query('SELECT case_id FROM sys_quality_check WHERE id = ?', [req.params.id]) as any;
      const newCaseStatus = audit_result === '通过' ? '已归档' : '撰写中';
      await pool.query('UPDATE sys_case SET case_status = ? WHERE case_id = ?', [newCaseStatus, row.case_id]);
      await pool.query(
        'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
        [row.case_id, '质检', audit_user, `审核${audit_result}：${audit_remark || ''}`, 'M08']
      );
    }

    res.json({ code: 0, message: '审核结果更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/reviews - 创建审核记录（从M07提交到M08）
reviewsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { case_id } = req.body;
    await pool.query(
      'INSERT INTO sys_quality_check (case_id, m08_status) VALUES (?, ?)',
      [case_id, 'pending']
    );
    await pool.query(
      "UPDATE sys_case SET case_status = '待质检' WHERE case_id = ?",
      [case_id]
    );
    await pool.query(
      'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
      [case_id, '质检', '系统', '提交M08审核', 'M08']
    );
    res.json({ code: 0, message: '审核记录创建成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
