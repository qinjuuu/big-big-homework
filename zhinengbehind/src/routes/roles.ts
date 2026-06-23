import { Router, Request, Response } from 'express';

export const rolesRouter = Router();

const mockRoles = [
  { id: 1, name: 'admin', display_name: '系统管理员', permissions: ['*'], user_count: 2 },
  { id: 2, name: 'sales', display_name: '销售', permissions: ['m05:read', 'm05:write'], user_count: 1 },
  { id: 3, name: 'engineer', display_name: '工程师', permissions: ['m06:read', 'm06:write', 'm07:read', 'm07:write'], user_count: 2 },
  { id: 4, name: 'reviewer', display_name: '审核员', permissions: ['m08:read', 'm08:write'], user_count: 0 },
  { id: 5, name: 'service', display_name: '客服', permissions: ['m05:read'], user_count: 0 },
];

// GET /api/roles - 角色列表
rolesRouter.get('/', async (_req: Request, res: Response) => {
  res.json({ code: 0, data: mockRoles });
});
