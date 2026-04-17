import Koa from 'koa';
import Router from '@koa/router';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import { initDatabase } from './database/init.js';
import authRoutes from './routes/auth.js';
import dashboardRoutes from './routes/dashboard.js';
import courseRoutes from './routes/courses.js';
import studentRoutes from './routes/students.js';
import summaryRoutes from './routes/summary.js';
import staticRoutes from './routes/static.js';

// 在 ES Module 环境下没有内置的 __dirname，
// 所以这里手动从当前文件 URL 计算出文件路径和目录路径。
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 创建 Koa 应用和总路由对象。
const app = new Koa();
const router = new Router();

// 应用启动时初始化数据库和种子数据。
initDatabase();

// 允许跨域请求，并支持携带凭证。
app.use(cors({ credentials: true }));

// 解析请求体中的 JSON 数据。
app.use(bodyParser());

// 全局错误处理中间件。
// 这样后面任意路由抛出错误，都能在这里统一格式化返回。
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    const status = err.status || 500;
    ctx.status = status;
    ctx.body = { code: status, msg: err.message || '服务器内部错误', data: null };
    console.error(`[${new Date().toISOString()}] ${err.message}`);
  }
});

// 挂载各个业务模块的路由。
router.use('/api/auth', authRoutes.routes());
router.use('/api/dashboard', dashboardRoutes.routes());
router.use('/api/courses', courseRoutes.routes());
router.use('/api/students', studentRoutes.routes());
router.use('/api/summary', summaryRoutes.routes());
router.use('/api/static', staticRoutes.routes());

app.use(router.routes());
app.use(router.allowedMethods());

// 提供前端构建后的静态资源文件。
const clientPath = join(__dirname, '../../client/dist');
app.use(serve(clientPath));

// SPA 路由回退：
// 如果访问的不是 /api 开头的接口，且静态资源也没匹配到，
// 就统一返回前端的 index.html，让前端路由接管页面渲染。
app.use(async (ctx) => {
  if (ctx.status === 404 && !ctx.path.startsWith('/api')) {
    ctx.type = 'text/html';
    ctx.body = readFileSync(join(clientPath, 'index.html'), 'utf-8');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务端已启动: http://localhost:${PORT}`);
});
