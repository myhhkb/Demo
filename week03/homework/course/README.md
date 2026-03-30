# 在线学习管理平台

基于 React + TypeScript + Koa 的全栈在线学习管理系统。

## 开发环境

### 启动后端服务
```bash
cd server
npm i
npm start
```
后端服务运行在 `http://localhost:3000`

### 启动前端开发服务
```bash
cd client
npm i
npm run dev
```
前端开发服务运行在 `http://localhost:5173`

访问 `http://localhost:5173` 即可开发，Vite 会自动代理 `/api` 请求到后端。

## 生产环境

### 前端构建
```bash
cd client
npm i
npm run build
```
前端构建输出到 `client/dist` 目录

### 后端启动
```bash
cd server
npm i
npm start
```
后端服务运行在 `http://localhost:3000`，会自动提供 `client/dist` 中的静态文件

访问 `http://localhost:3000` 即可使用完整应用

## 默认账号
- 用户名：admin
- 密码：admin123

## 项目结构

```
course/
├── client/              # React 前端应用
│   ├── src/            # 源代码
│   ├── dist/           # 构建输出（生产环境使用）
│   └── package.json
├── server/             # Koa 后端应用
│   ├── src/            # 源代码
│   ├── data/           # 数据库和资源
│   └── package.json
└── README.md
```

## 功能模块

- **工作台** - 统计数据和数据可视化
- **课程管理** - 课程的增删改查和状态管理
- **学生管理** - 学生信息和选课管理
- **学习总结** - Markdown 格式的学习内容

## 技术栈

**后端**
- Node.js + Koa
- better-sqlite3
- jsonwebtoken

**前端**
- React 18 + TypeScript
- Vite
- Ant Design + Tailwind CSS
- Recharts（数据可视化）

## API 文档

详见 `server/API.md`
