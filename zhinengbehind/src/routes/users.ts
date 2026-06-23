import { Router, Request, Response } from 'express';

export const usersRouter = Router();

const mockUsers = [
  { id: 1, username: 'admin', display_name: '管理员', role: 'manager', status: 1, email: 'admin@vast.com', phone: '13800000001', create_time: '2026-01-01T00:00:00.000Z' },
  { id: 2, username: 'zhangming', display_name: '张明', role: 'manager', status: 1, email: 'zhangming@vast.com', phone: '13800000002', create_time: '2026-01-01T00:00:00.000Z' },
  { id: 3, username: 'lisi', display_name: '李四', role: 'engineer', status: 1, email: 'lisi@vast.com', phone: '13800000003', create_time: '2026-01-01T00:00:00.000Z' },
  { id: 4, username: 'wangwu', display_name: '王五', role: 'engineer', status: 1, email: 'wangwu@vast.com', phone: '13800000004', create_time: '2026-01-01T00:00:00.000Z' },
  { id: 5, username: 'liuxiaoshou', display_name: '刘销售', role: 'sales', status: 1, email: 'sales@vast.com', phone: '13800000005', create_time: '2026-01-01T00:00:00.000Z' },
];

// GET /api/users - 用户列表
usersRouter.get('/', async (req: Request, res: Response) => {
  let list = mockUsers;
  if (req.query.role) {
    list = list.filter(u => u.role === req.query.role);
  }
  if (req.query.status !== undefined && req.query.status !== '') {
    list = list.filter(u => String(u.status) === req.query.status);
  }
  if (req.query.keyword) {
    const kw = String(req.query.keyword).toLowerCase();
    list = list.filter(u => u.username.toLowerCase().includes(kw) || (u.display_name && u.display_name.toLowerCase().includes(kw)));
  }
  res.json({ code: 0, data: list });
});

// GET /api/users/:id - 用户详情
usersRouter.get('/:id', async (req: Request, res: Response) => {
  const user = mockUsers.find(u => String(u.id) === req.params.id);
  if (!user) {
    return res.status(404).json({ code: -1, message: '用户不存在' });
  }
  res.json({ code: 0, data: user });
});

// POST /api/users - 创建用户
usersRouter.post('/', async (req: Request, res: Response) => {
  const newUser = { id: mockUsers.length + 1, ...req.body, create_time: new Date().toISOString() };
  mockUsers.push(newUser);
  res.json({ code: 0, data: newUser });
});

// PUT /api/users/:id - 更新用户
usersRouter.put('/:id', async (req: Request, res: Response) => {
  const idx = mockUsers.findIndex(u => String(u.id) === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ code: -1, message: '用户不存在' });
  }
  mockUsers[idx] = { ...mockUsers[idx], ...req.body };
  res.json({ code: 0, data: mockUsers[idx] });
});

// DELETE /api/users/:id - 删除用户
usersRouter.delete('/:id', async (req: Request, res: Response) => {
  const idx = mockUsers.findIndex(u => String(u.id) === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ code: -1, message: '用户不存在' });
  }
  mockUsers.splice(idx, 1);
  res.json({ code: 0, message: '删除成功' });
});
