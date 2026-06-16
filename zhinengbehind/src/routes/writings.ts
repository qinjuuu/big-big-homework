import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const writingsRouter = Router();

// GET /api/writings - 撰写任务列表
writingsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, keyword, page = '1', pageSize = '20' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push('w.m07_status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(c.case_name LIKE ? OR w.case_id LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const [rows] = await pool.query(
      `SELECT w.*, c.case_name, c.patent_type, c.tech_field, c.engineer
       FROM sys_writing w
       JOIN sys_case c ON w.case_id = c.case_id
       ${where}
       ORDER BY w.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sys_writing w JOIN sys_case c ON w.case_id = c.case_id ${where}`,
      params
    ) as any;

    res.json({ code: 0, data: { list: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/writings/stats - 撰写统计
writingsRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM sys_writing') as any;
    const [byStatus] = await pool.query(
      'SELECT m07_status, COUNT(*) as count FROM sys_writing GROUP BY m07_status'
    );
    res.json({ code: 0, data: { total, byStatus } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/writings/:id - 撰写详情
writingsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [[row]] = await pool.query(
      `SELECT w.*, c.case_name, c.patent_type, c.tech_field
       FROM sys_writing w
       JOIN sys_case c ON w.case_id = c.case_id
       WHERE w.id = ?`,
      [req.params.id]
    ) as any;
    if (!row) return res.status(404).json({ code: -1, message: '撰写记录不存在' });
    res.json({ code: 0, data: row });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/writings/:id - 更新撰写内容
writingsRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { spec_content, claim_content, five_books_content, repeat_check_info, ai_check_rate, m07_status, write_user } = req.body;
    const fields = ['spec_content', 'claim_content', 'five_books_content', 'repeat_check_info', 'ai_check_rate', 'm07_status', 'write_user'];
    const sets: string[] = [];
    const params: any[] = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }
    if (m07_status === 'submitted') sets.push('write_finish = NOW()');
    if (sets.length === 0) return res.json({ code: 0, message: '无变更' });

    params.push(req.params.id);
    await pool.query(`UPDATE sys_writing SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/writings - 创建撰写记录
writingsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { case_id, write_user } = req.body;
    await pool.query(
      'INSERT INTO sys_writing (case_id, write_user, m07_status) VALUES (?, ?, ?)',
      [case_id, write_user, 'drafting']
    );
    await pool.query(
      "UPDATE sys_case SET case_status = '撰写中' WHERE case_id = ?",
      [case_id]
    );
    await pool.query(
      'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
      [case_id, '撰写', write_user, '开始专利撰写', 'M07']
    );
    res.json({ code: 0, message: '撰写记录创建成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
