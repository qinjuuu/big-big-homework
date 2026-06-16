import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const casesRouter = Router();

// GET /api/cases - 案件列表（支持筛选）
casesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, m05_status, keyword, page = '1', pageSize = '20' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      conditions.push('c.case_status = ?');
      params.push(status);
    }
    if (m05_status && m05_status !== 'all') {
      conditions.push('c.m05_status = ?');
      params.push(m05_status);
    }
    if (keyword) {
      conditions.push('(c.case_name LIKE ? OR c.case_id LIKE ? OR c.client_name LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const [rows] = await pool.query(
      `SELECT c.* FROM sys_case c ${where} ORDER BY c.update_time DESC LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sys_case c ${where}`,
      params
    ) as any;

    res.json({ code: 0, data: { list: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/cases/stats - 案件统计
casesRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM sys_case') as any;
    const [[{ pendingDisclosure }]] = await pool.query(
      "SELECT COUNT(*) as pendingDisclosure FROM sys_case WHERE case_status = '待交底'"
    ) as any;
    const [[{ writing }]] = await pool.query(
      "SELECT COUNT(*) as writing FROM sys_case WHERE case_status = '撰写中'"
    ) as any;
    const [[{ pendingReview }]] = await pool.query(
      "SELECT COUNT(*) as pendingReview FROM sys_case WHERE case_status = '待质检'"
    ) as any;
    const [[{ archived }]] = await pool.query(
      "SELECT COUNT(*) as archived FROM sys_case WHERE case_status = '已归档'"
    ) as any;

    // 按M05状态分组
    const [m05Stats] = await pool.query(
      `SELECT m05_status, COUNT(*) as count FROM sys_case GROUP BY m05_status`
    );

    res.json({
      code: 0,
      data: {
        total,
        pendingDisclosure,
        writing,
        pendingReview,
        archived,
        m05Stats,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/cases/:id - 案件详情（联查所有子表）
casesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [[caseData]] = await pool.query(
      'SELECT * FROM sys_case WHERE case_id = ?',
      [req.params.id]
    ) as any;
    if (!caseData) {
      return res.status(404).json({ code: -1, message: '案件不存在' });
    }

    const [[disclosure]] = await pool.query(
      'SELECT * FROM sys_disclosure WHERE case_id = ?',
      [req.params.id]
    ) as any;
    const [[writing]] = await pool.query(
      'SELECT * FROM sys_writing WHERE case_id = ?',
      [req.params.id]
    ) as any;
    const [[review]] = await pool.query(
      'SELECT * FROM sys_quality_check WHERE case_id = ? ORDER BY id DESC LIMIT 1',
      [req.params.id]
    ) as any;
    const [logs] = await pool.query(
      'SELECT * FROM sys_operation_log WHERE case_id = ? ORDER BY opt_time DESC',
      [req.params.id]
    );

    res.json({
      code: 0,
      data: { ...caseData, disclosure: disclosure || null, writing: writing || null, review: review || null, logs },
    });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/cases - 创建案件
casesRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { case_name, patent_type, tech_field, creator_name, client_name, contact_person, sales_person, service_rep, priority, source_type } = req.body;
    const caseId = `CASE${Date.now()}`;

    await pool.query(
      `INSERT INTO sys_case (case_id, case_name, patent_type, tech_field, creator_name, client_name, contact_person, sales_person, service_rep, priority, source_type, m05_status, case_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'assigning', '待交底')`,
      [caseId, case_name, patent_type, tech_field, creator_name, client_name, contact_person, sales_person, service_rep, priority || 'normal', source_type || 'filed']
    );

    // 记录操作日志
    await pool.query(
      'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
      [caseId, '立案', creator_name, `新建案件：${case_name}`, 'M05']
    );

    res.json({ code: 0, data: { case_id: caseId }, message: '创建成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/cases/:id - 更新案件
casesRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const fields = ['case_name', 'patent_type', 'tech_field', 'case_status', 'm05_status', 'client_name', 'contact_person', 'sales_person', 'service_rep', 'engineer', 'priority'];
    const sets: string[] = [];
    const params: any[] = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }

    if (sets.length === 0) {
      return res.json({ code: 0, message: '无变更' });
    }

    params.push(req.params.id);
    await pool.query(`UPDATE sys_case SET ${sets.join(', ')} WHERE case_id = ?`, params);

    if (req.body.opt_user) {
      await pool.query(
        'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, '更新', req.body.opt_user, JSON.stringify(req.body), 'M05']
      );
    }

    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/cases/:id/status - 更新案件状态
casesRouter.put('/:id/status', async (req: Request, res: Response) => {
  try {
    const { case_status, m05_status, opt_user } = req.body;
    await pool.query(
      'UPDATE sys_case SET case_status = COALESCE(?, case_status), m05_status = COALESCE(?, m05_status) WHERE case_id = ?',
      [case_status, m05_status, req.params.id]
    );
    if (opt_user) {
      await pool.query(
        'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
        [req.params.id, '状态变更', opt_user, `状态更新为 ${case_status || m05_status}`, 'M05']
      );
    }
    res.json({ code: 0, message: '状态更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
