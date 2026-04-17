import jwt from 'jsonwebtoken';

// JWT_SECRET 是签发和校验 JWT 时使用的密钥。
// 真实项目里通常会放到环境变量中，而不是直接写在代码里。
const JWT_SECRET = 'homework_secret_key_2024';

export { JWT_SECRET };

// authenticateToken 是鉴权中间件。
// 它会从请求头中读取 Bearer Token，并校验是否合法。
export function authenticateToken(ctx, next) {
  const authHeader = ctx.headers['authorization'];

  // Authorization 的常见格式是：Bearer xxxxxxx
  // 这里取空格后的第二段，也就是真正的 token。
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    ctx.status = 401;
    ctx.body = { code: 401, msg: '未提供认证令牌', data: null };
    return;
  }

  try {
    // verify 会校验 token 是否正确，以及是否过期。
    const user = jwt.verify(token, JWT_SECRET);

    // 把解析出来的用户信息挂到 ctx.state 上，
    // 这样后续路由就可以直接使用。
    ctx.state.user = user;
    return next();
  } catch {
    ctx.status = 401;
    ctx.body = { code: 401, msg: '令牌无效或已过期', data: null };
  }
}
