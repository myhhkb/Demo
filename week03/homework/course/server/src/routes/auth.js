import Router from '@koa/router';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from '../database/db.js';
import { JWT_SECRET, authenticateToken } from '../middleware/auth.js';
import { success, fail } from '../utils/response.js';

const router = new Router();

// 登录接口。
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;

  // 用户名和密码是登录的最基本输入。
  if (!username || !password) {
    return fail(ctx, 400, '请输入用户名和密码');
  }

  // 根据用户名查询数据库中的用户记录。
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user) {
    return fail(ctx, 401, '用户名或密码错误');
  }

  // 使用 bcrypt 校验明文密码和数据库中的哈希密码是否匹配。
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    return fail(ctx, 401, '用户名或密码错误');
  }

  // 登录成功后，生成一个 7 天有效期的 JWT。
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  // 返回用户信息时，要把 password 字段去掉，避免泄露给前端。
  const { password: _, ...userInfo } = user;
  success(ctx, { token, user: userInfo });
});

// 获取当前登录用户信息。
router.get('/me', authenticateToken, async (ctx) => {
  // authenticateToken 校验通过后，会把用户 id 放在 ctx.state.user 里。
  const user = db.prepare('SELECT id, username, name, role, avatar, created_at FROM users WHERE id = ?').get(ctx.state.user.id);
  if (!user) {
    return fail(ctx, 404, '用户不存在');
  }
  success(ctx, user);
});

export default router;
