# AI 智能单词本

## 项目基本信息

- **姓名**: 杨畅
- **学校**: 中南民族大学
- **学号**: 2024120443

## 开发任务索引

- [x] 用户注册/登录（JWT 鉴权）
- [x] 智能查询单词（调用阿里百炼云 AI 接口，支持通义千问/DeepSeek 模型选择）
- [x] 手动保存单词到个人单词本
- [x] 获取单词列表（支持分页）
- [x] 删除单词（软删除）
- [x] 前后端分离架构（Vite + React / Go + Gin）
- [x] Docker Compose 一键部署
- [x] Nginx 反向代理（生产环境跨域解决）
- [x] Vite Proxy（开发环境跨域解决）
- [x] 完整文档（README、API 文档、数据库设计文档）

## 项目简介

本项目是一个辅助英语学习的前后端分离 Web 应用。用户可以通过前端页面查询单词，后端系统会调用 AI 大模型（通义千问或 DeepSeek）生成该单词的精准释义和 3 条例句。查询结果返回前端展示后，用户可以手动点击"保存"按钮，将该单词记录持久化到个人的单词本中，方便日后复习。

### 架构图

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser   │────▶│   Nginx      │────▶│  Backend    │
│  (React)    │◀────│  (frontend)  │◀────│  (Go+Gin)   │
└─────────────┘     │  Port: 80    │     │  Port: 8080 │
                    └──────────────┘     └──────┬──────┘
                                                │
                                         ┌──────▼──────┐
                                         │   MySQL     │
                                         │  Port: 3306 │
                                         └──────┬──────┘
                                                │
                                         ┌──────▼──────┐
                                         │  阿里百炼云  │
                                         │  AI API     │
                                         └─────────────┘
```

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端框架 | Go 1.21 + Gin |
| 前端框架 | Vite 5 + React 18 |
| 数据库 | MySQL 8.0 + GORM |
| 身份验证 | JWT (golang-jwt/jwt) |
| 配置管理 | Viper |
| AI 接口 | 阿里百炼云 (通义千问 / DeepSeek) |
| 容器化 | Docker + Docker Compose |
| Web 服务器 | Nginx (生产环境反向代理) |

## 运行指南

### 前置依赖

- [Docker](https://www.docker.com/) (>= 20.10)
- [Docker Compose](https://docs.docker.com/compose/) (>= 2.0)

### 配置 AI API Key

API Key 已在 `docker-compose.yml` 和 `backend/.env` 中配置好。如需更换，请修改以下位置：

1. `backend/.env` 文件中的 `AI_API_KEY`
2. `docker-compose.yml` 中 `backend` 服务的 `AI_API_KEY` 环境变量

### 一键启动

```bash
cd week05/homework/docker-gin
docker-compose up -d
```

### 访问应用

- **前端页面**: http://localhost (Nginx, 端口 80)
- **后端 API**: http://localhost/api (通过 Nginx 反向代理)

### 停止服务

```bash
docker-compose down
```

### 清除数据

```bash
docker-compose down -v
```

### 开发环境

#### 后端开发

```bash
cd backend
# 确保本地有 MySQL 并修改 .env 中的 DB_HOST 为 localhost
go run main.go
```

#### 前端开发

```bash
cd frontend
npm install
npm run dev
```

前端开发服务器默认在 `http://localhost:5173`，已通过 `vite.config.js` 中的 proxy 配置将 `/api` 请求代理到后端 `http://localhost:8080`。

## 跨域处理说明

本项目**严格遵循**不在后端 Go 代码中配置任何 CORS 中间件的要求：

- **开发环境**: 通过 Vite 的 `server.proxy` 配置代理 `/api` 请求
- **生产环境**: 通过 Nginx 反向代理统一入口，前端静态资源和后端 API 同源
