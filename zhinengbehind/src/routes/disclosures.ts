import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const disclosuresRouter = Router();

// GET /api/disclosures - 交底书列表
disclosuresRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { stage, status, keyword, page = '1', pageSize = '20' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (stage && stage !== 'all') {
      conditions.push('d.m06_stage = ?');
      params.push(stage);
    }
    if (status && status !== 'all') {
      conditions.push('d.m06_status = ?');
      params.push(status);
    }
    if (keyword) {
      conditions.push('(c.case_name LIKE ? OR d.case_id LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const [rows] = await pool.query(
      `SELECT d.*, c.case_name, c.patent_type, c.tech_field, c.engineer, c.sales_person, c.service_rep, c.source_type
       FROM sys_disclosure d
       JOIN sys_case c ON d.case_id = c.case_id
       ${where}
       ORDER BY d.create_time DESC
       LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sys_disclosure d JOIN sys_case c ON d.case_id = c.case_id ${where}`,
      params
    ) as any;

    res.json({ code: 0, data: { list: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/disclosures/stats - 交底书统计
disclosuresRouter.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) as total FROM sys_disclosure') as any;
    const [byStage] = await pool.query(
      'SELECT m06_stage, COUNT(*) as count FROM sys_disclosure GROUP BY m06_stage'
    );
    const [byStatus] = await pool.query(
      'SELECT m06_status, COUNT(*) as count FROM sys_disclosure GROUP BY m06_status'
    );
    const [byRisk] = await pool.query(
      'SELECT risk_level, COUNT(*) as count FROM sys_disclosure GROUP BY risk_level'
    );

    res.json({ code: 0, data: { total, byStage, byStatus, byRisk } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/disclosures/:id - 交底书详情
disclosuresRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const [[row]] = await pool.query(
      `SELECT d.*, c.case_name, c.patent_type, c.tech_field, c.engineer, c.sales_person, c.service_rep
       FROM sys_disclosure d
       JOIN sys_case c ON d.case_id = c.case_id
       WHERE d.id = ?`,
      [req.params.id]
    ) as any;
    if (!row) {
      return res.status(404).json({ code: -1, message: '交底书不存在' });
    }
    res.json({ code: 0, data: row });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/disclosures/:id - 更新交底书
disclosuresRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { m06_stage, m06_status, risk_level, quality_score, ai_generate_content, ai_suggest, source_content } = req.body;
    const fields = ['m06_stage', 'm06_status', 'risk_level', 'quality_score', 'ai_generate_content', 'ai_suggest', 'source_content'];
    const sets: string[] = [];
    const params: any[] = [];

    for (const f of fields) {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push(req.body[f]);
      }
    }
    if (sets.length === 0) return res.json({ code: 0, message: '无变更' });

    params.push(req.params.id);
    await pool.query(`UPDATE sys_disclosure SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ code: 0, message: '更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/disclosures - 创建交底书（从M05转入M06）
disclosuresRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { case_id, source_content } = req.body;
    await pool.query(
      'INSERT INTO sys_disclosure (case_id, source_content, m06_stage, m06_status) VALUES (?, ?, ?, ?)',
      [case_id, source_content || '', 'DECOMPOSITION', 'IN_PROGRESS']
    );
    await pool.query(
      "UPDATE sys_case SET case_status = '撰写中' WHERE case_id = ?",
      [case_id]
    );
    await pool.query(
      'INSERT INTO sys_operation_log (case_id, opt_type, opt_user, opt_content, opt_module) VALUES (?, ?, ?, ?, ?)',
      [case_id, '交底', '系统', '案件转入M06交底书引擎', 'M06']
    );
    res.json({ code: 0, message: '交底书创建成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
