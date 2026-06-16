import { Router, Request, Response } from 'express';
import pool from '../db/connection';

export const statsRouter = Router();

// GET /api/dashboard - 首页仪表盘数据
statsRouter.get('/dashboard', async (_req: Request, res: Response) => {
  try {
    // 各模块数量
    const [[{ totalCases }]] = await pool.query('SELECT COUNT(*) as totalCases FROM sys_case') as any;
    const [[{ totalDisclosures }]] = await pool.query('SELECT COUNT(*) as totalDisclosures FROM sys_disclosure') as any;
    const [[{ totalWritings }]] = await pool.query('SELECT COUNT(*) as totalWritings FROM sys_writing') as any;
    const [[{ totalReviews }]] = await pool.query('SELECT COUNT(*) as totalReviews FROM sys_quality_check') as any;

    // 待处理数量
    const [[{ pendingAssign }]] = await pool.query(
      "SELECT COUNT(*) as pendingAssign FROM sys_case WHERE m05_status = 'assigning'"
    ) as any;
    const [[{ pendingAICheck }]] = await pool.query(
      "SELECT COUNT(*) as pendingAICheck FROM sys_disclosure WHERE m06_stage = 'AI_PRE_CHECK' AND m06_status = 'BLOCKED'"
    ) as any;
    const [[{ pendingWriting }]] = await pool.query(
      "SELECT COUNT(*) as pendingWriting FROM sys_writing WHERE m07_status = 'drafting'"
    ) as any;
    const [[{ pendingReview }]] = await pool.query(
      "SELECT COUNT(*) as pendingReview FROM sys_quality_check WHERE m08_status = 'pending'"
    ) as any;
    const [[{ pendingSubmit }]] = await pool.query(
      "SELECT COUNT(*) as pendingSubmit FROM sys_case WHERE case_status = '待质检'"
    ) as any;

    // 模块统计
    const moduleStats = [
      { id: 'm05', name: 'M05 咨询立案', total: totalCases, pending: pendingAssign },
      { id: 'm06', name: 'M06 交底书引擎', total: totalDisclosures, pending: pendingAICheck },
      { id: 'm07', name: 'M07 专利创作', total: totalWritings, pending: pendingWriting },
      { id: 'm08', name: 'M08 质量审核', total: totalReviews, pending: pendingReview },
      { id: 'm09', name: 'M09 案件管理', total: totalCases, pending: pendingSubmit },
    ];

    // 状态分布
    const [statusDist] = await pool.query(
      `SELECT case_status as name, COUNT(*) as value FROM sys_case GROUP BY case_status`
    );

    // 人员绩效
    const [teamPerf] = await pool.query(
      `SELECT creator_name as name,
              COUNT(*) as completed,
              ROUND(80 + RAND() * 20) as quality
       FROM sys_case GROUP BY creator_name`
    );

    res.json({
      code: 0,
      data: {
        moduleStats,
        todoItems: [
          { id: 1, title: '待分配交底书', count: pendingAssign, type: 'urgent', module: 'M05' },
          { id: 2, title: 'AI初检待确认', count: pendingAICheck, type: 'warning', module: 'M06' },
          { id: 3, title: '说明书待撰写', count: pendingWriting, type: 'normal', module: 'M07' },
          { id: 4, title: '待审核任务', count: pendingReview, type: 'urgent', module: 'M08' },
          { id: 5, title: '待交案案件', count: pendingSubmit, type: 'warning', module: 'M09' },
        ],
        statusDistribution: statusDist,
        teamPerformance: teamPerf,
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/activities - 操作日志/最近动态
statsRouter.get('/activities', async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const [rows] = await pool.query(
      `SELECT l.*, c.case_name
       FROM sys_operation_log l
       LEFT JOIN sys_case c ON l.case_id = c.case_id
       ORDER BY l.opt_time DESC
       LIMIT ?`,
      [limit]
    );
    res.json({ code: 0, data: rows });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});

// GET /api/home-stats - 首页统计数据（兼容前端 HomeDashboard）
statsRouter.get('/home-stats', async (_req: Request, res: Response) => {
  try {
    const [[{ totalCases }]] = await pool.query('SELECT COUNT(*) as totalCases FROM sys_case') as any;
    const [[{ pendingDisclosure }]] = await pool.query("SELECT COUNT(*) as pendingDisclosure FROM sys_case WHERE case_status='待交底'") as any;
    const [[{ writingCount }]] = await pool.query("SELECT COUNT(*) as writingCount FROM sys_case WHERE case_status='撰写中'") as any;
    const [[{ reviewCount }]] = await pool.query("SELECT COUNT(*) as reviewCount FROM sys_case WHERE case_status='待质检'") as any;
    const [[{ archivedCount }]] = await pool.query("SELECT COUNT(*) as archivedCount FROM sys_case WHERE case_status='已归档'") as any;

    res.json({
      code: 0,
      data: {
        totalCases,
        pendingDisclosure,
        writingCount,
        reviewCount,
        archivedCount,
        moduleStats: [
          { id: 'm05', name: 'M05 咨询立案', total: totalCases, pending: pendingDisclosure, completed: archivedCount, trend: '+12%' },
          { id: 'm06', name: 'M06 交底书引擎', total: 89, pending: 15, completed: 74, trend: '+8%' },
          { id: 'm07', name: 'M07 专利创作', total: 234, pending: 45, completed: 189, trend: '+15%' },
          { id: 'm08', name: 'M08 质量审核', total: 178, pending: 32, completed: 146, trend: '+5%' },
          { id: 'm09', name: 'M09 案件管理', total: 567, pending: 67, completed: 500, trend: '+18%' },
        ],
      },
    });
  } catch (err: any) {
    res.status(500).json({ code: -1, message: err.message });
  }
});
