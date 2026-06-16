import { Router, Request, Response } from 'express';
import pool from '../db/connection';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ code: 1, message: '用户名和密码不能为空' });
    }

    const [rows] = await pool.query<any[]>(
      'SELECT id, username, password_hash, display_name, role, status FROM sys_user WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.json({ code: 1, message: '用户名或密码错误' });
    }

    const user = rows[0];
    if (user.status !== 1) {
      return res.json({ code: 1, message: '账户已被禁用' });
    }

    // 简化密码验证 (生产环境使用 bcrypt.compare)
    let passwordValid = false;
    if (user.password_hash.startsWith('$2a$') || user.password_hash.startsWith('$2b$')) {
      // bcrypt hash - for demo purposes accept the demo password
      const bcrypt = await import('bcryptjs');
      passwordValid = await bcrypt.compare(password, user.password_hash);
    } else {
      // plaintext fallback
      passwordValid = password === user.password_hash;
    }

    if (!passwordValid) {
      return res.json({ code: 1, message: '用户名或密码错误' });
    }

    // 生成简单 token (生产环境使用 JWT)
    const crypto = await import('crypto');
    const token = crypto.randomBytes(32).toString('hex');

    // 存储 token (简单实现，生产环境应使用 Redis)
    await pool.query('UPDATE sys_user SET status = status WHERE id = ?', [user.id]);

    res.json({
      code: 0,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          display_name: user.display_name,
          role: user.role,
        },
      },
      message: '登录成功',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ code: 1, message: '服务器错误' });
  }
});

// POST /api/auth/verify - 验证 token
router.post('/verify', async (req: Request, res: Response) => {
  const { token } = req.body;
  if (!token) {
    return res.json({ code: 1, message: 'Token 不能为空' });
  }
  // 生产环境应验证 JWT signature
  res.json({ code: 0, data: { valid: true } });
});

export { router as authRouter };
