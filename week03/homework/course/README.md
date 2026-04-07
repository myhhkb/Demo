# 在线学习管理平台

## 一、项目基本信息

- **姓名**：杨畅
- **学校**：中南民族大学
- **学号**：2024120443
- **项目名称**：基于 React + TypeScript + Koa 的全栈在线学习管理系统

---

## 二、开发任务索引

我已完成以下核心功能模块及配套文档的开发：

### 1. 前端开发 (client)

- **登录模块**：基于 JWT 的认证流程，包含受保护路由拦截（React Router）。
- **工作台 (Dashboard)**：使用 Recharts 实现数据可视化，统计课程、学生分布及活跃度。
- **课程管理**：实现课程列表展示、状态切换（发布/草稿）、增删改查及筛选。
- **学生管理**：全功能 CRUD 接口对接，支持分页、班级筛选、关键字搜索及选课关联。
- **学习总结**：动态加载并渲染 Markdown 内容，支持代码高亮与静态图片显示。

### 2. 后端开发 (server)

- **Koa 架构搭建**：采用洋葱模型中间件，包含统一错误处理、CORS 及 BodyParser。
- **数据库设计**：使用 SQLite (better-sqlite3) 存储用户、课程、学生及学习记录数据。
- **认证中间件**：实现 JWT 签发与 Bearer Token 验证，保护敏感 API 路由。
- **RESTful API**：设计并实现了符合规范的课程、学生、工作台数据及总结内容接口。
- **静态服务**：配置 Koa 托管前端构建产物及服务端资源文件。

### 3. 文档与工程化

- **API 文档 (`server/API.md`)**：定义统一响应格式及各模块接口规范。
- **阶段总结 (`server/data/summary.md`)**：深度整理前端全栈开发的知识体系与实践思考。
- **工程化配置**：Vite 代理配置、TypeScript 类型约束、Git 版本控制规范。

---

## 三、核心技术实现

### 1. 全栈认证链路实现

- **逻辑思路**：前端登录请求通过后，后端使用 `jsonwebtoken` 生成 Token 并返回。前端将其存入 `localStorage`。后续通过 `axios` 请求拦截器在 Header 中注入 `Authorization: Bearer <token>`。后端 `auth` 中间件对非公开路由进行拦截校验，确保数据安全性。

### 2. 响应式数据流与状态管理

- **逻辑思路**：项目以局部状态 (`useState`) 为核心处理页面逻辑，通过 `useEffect` 配合 `async/await` 处理异步请求。在响应拦截器中统一处理 401 状态码，实现 Token 过期后的自动重定向。对于跨页面的用户基础信息，预留了 `Zustand` 或 `Context API` 的扩展接口。

### 3. 数据关联与逻辑更新

- **逻辑思路**：在学生管理模块中，学生与课程通过 `course_ids` (JSON 字符串形式存储于 SQLite) 实现多对多关联。每次学生增删或选课变更时，后端会自动触发 `updateCourseCounts` 函数，实时计算并更新课程表中的 `student_count` 字段，保证统计数据的一致性。

---

## 四、其他内容

1. **代码风格**：本项目严格遵循 React 组件化思维，前端采用了 Tailwind CSS 配合 Ant Design 进行了细致的样式打磨，力求界面简洁现代且具备良好的交互反馈。
2. **健壮性处理**：实现了统一的后端响应工具类（`success/fail`），并在前端配置了全局请求 loading 状态与错误提示（`message.error`），对常见的边界情况（如空数据、非法路径请求、图片 404 等）均做了针对性处理。
3. **学习心得**：在 `server/data/summary.md` 中，我详细记录了从 Git 环境搭建到 React 高阶开发的每一环节实践心得，这不仅是对作业的总结，更是我对前端全栈知识体系的深度重构。欢迎老师查阅并指导。

---

## 五、快速启动

### 启动后端

```bash
cd server && npm install && npm start
```

### 启动前端

```bash
cd client && npm install && npm run dev
```
### 拉取测试

```bash
cd week03/homework/course/server && npm start
```

测试账号：`admin` / `admin123`