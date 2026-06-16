import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const collabRouter = Router();

// GET /api/collab/:caseId - 获取协同编辑初始数据
collabRouter.get('/:caseId', async (req: Request, res: Response) => {
  try {
    const [[writing]] = await pool.query(
      'SELECT * FROM sys_writing WHERE case_id = ? ORDER BY id DESC LIMIT 1',
      [req.params.caseId]
    ) as any;

    if (!writing) {
      return res.status(404).json({ code: -1, message: '未找到撰写记录' });
    }

    res.json({ code: 0, data: writing });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// POST /api/collab/version - 保存版本快照
collabRouter.post('/version', async (req: Request, res: Response) => {
  try {
    const { case_id, content_snapshot, editor_name, version_no } = req.body;
    await pool.query(
      'INSERT INTO sys_writing_version (case_id, version_no, content_snapshot, editor_name) VALUES (?, ?, ?, ?)',
      [case_id, version_no, content_snapshot, editor_name]
    );
    res.json({ code: 0, message: '版本已保存' });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
