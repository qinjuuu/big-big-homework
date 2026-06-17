import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const terminologyRouter = Router();

// GET /api/terminology - 术语列表（按领域筛选 + 关键词搜索）
terminologyRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { domain, keyword, page = '1', pageSize = '50' } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];

    if (domain) {
      conditions.push('domain = ?');
      params.push(domain);
    }
    if (keyword) {
      conditions.push('(term LIKE ? OR definition LIKE ? OR aliases LIKE ?)');
      const kw = `%${keyword}%`;
      params.push(kw, kw, kw);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (Number(page) - 1) * Number(pageSize);

    const [rows] = await pool.query(
      `SELECT * FROM sys_terminology ${where} ORDER BY domain, term LIMIT ? OFFSET ?`,
      [...params, Number(pageSize), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) as total FROM sys_terminology ${where}`,
      params
    ) as any;

    res.json({ code: 0, data: { list: rows, total, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/terminology/domains - 获取所有领域列表
terminologyRouter.get('/domains', async (_req: Request, res: Response) => {
  try {
    const [rows] = await pool.query(
      'SELECT DISTINCT domain, COUNT(*) as count FROM sys_terminology GROUP BY domain ORDER BY domain'
    );
    res.json({ code: 0, data: rows });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/terminology - 新增术语
terminologyRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { domain, term, definition, aliases } = req.body;
    if (!domain || !term) {
      return res.status(400).json({ code: -1, message: 'domain 和 term 为必填项' });
    }
    const [result] = await pool.query(
      'INSERT INTO sys_terminology (domain, term, definition, aliases) VALUES (?, ?, ?, ?)',
      [domain, term, definition || '', aliases || '']
    ) as any;
    res.json({ code: 0, data: { id: result.insertId }, message: '术语添加成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// PUT /api/terminology/:id - 修改术语
terminologyRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const { domain, term, definition, aliases } = req.body;
    const fields = ['domain', 'term', 'definition', 'aliases'];
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
    await pool.query(`UPDATE sys_terminology SET ${sets.join(', ')} WHERE id = ?`, params);
    res.json({ code: 0, message: '术语更新成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// DELETE /api/terminology/:id - 删除术语
terminologyRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    await pool.query('DELETE FROM sys_terminology WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '术语删除成功' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
