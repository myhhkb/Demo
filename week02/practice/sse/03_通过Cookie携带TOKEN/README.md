# SSE - 通过 Cookie 携带 Token

## 📋 项目结构

```
03_通过Cookie携带TOKEN/
├── server.js      # 服务端代码
├── package.json   # 项目配置
└── README.md      # 说明文档
```

## 🚀 快速开始

### 1. 启动服务器

```bash
node server.js
```

服务器会在 `http://localhost:3002` 启动

### 2. 打开浏览器

访问 `http://localhost:3002`

### 3. 操作流程

1. 点击"登录"按钮 - 获取 Token（设置到 Cookie）
2. 点击"连接 SSE"按钮 - 建立 SSE 连接（自动携带 Cookie 中的 Token）
3. 接收服务器消息
4. 点击"登出"按钮 - 清除 Token

---

## 🔐 核心原理

### 问题背景

原生 `EventSource` 有一个限制：**无法通过请求头携带 Token**

```javascript
// ❌ EventSource 不支持自定义请求头
const eventSource = new EventSource('/api/sse', {
  headers: {
    'Authorization': 'Bearer token123'  // 这样不行！
  }
});
```

### 解决方案：使用 Cookie

Cookie 会自动包含在所有请求中，包括 SSE 请求。

---

## 📝 实现步骤

### 1️⃣ 服务端 - 设置 Cookie

**登录接口：** 返回 Set-Cookie 响应头

```javascript
if (req.url === '/login' && req.method === 'POST') {
  res.writeHead(200, {
    'Set-Cookie': `token=${VALID_TOKEN}; Path=/; HttpOnly`
  });
  res.end(JSON.stringify({ success: true }));
}
```

**关键点：**
- `HttpOnly` - 防止 JavaScript 访问（安全性）
- `Path=/` - 所有路径都包含这个 Cookie
- `token=value` - Cookie 的名称和值

### 2️⃣ 服务端 - 验证 Cookie 中的 Token

**SSE 接口：** 从请求头中提取 Cookie

```javascript
if (req.url === '/api/sse') {
  // 从 Cookie 中提取 token
  const cookies = req.headers.cookie || '';
  const tokenMatch = cookies.match(/token=([^;]*)/);
  const token = tokenMatch ? tokenMatch[1] : null;

  // 验证 token
  if (token !== VALID_TOKEN) {
    res.writeHead(401);
    res.end(JSON.stringify({ error: '未授权' }));
    return;
  }

  // Token 验证成功，建立 SSE 连接
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8'
  });
  // ... 发送消息
}
```

### 3️⃣ 前端 - 登录获取 Cookie

```javascript
async function login() {
  const response = await fetch('/login', {
    method: 'POST',
    credentials: 'include'  // 重要：允许发送和接收 Cookie
  });
  // Cookie 会自动保存到浏览器
}
```

**关键点：**
- `credentials: 'include'` - 允许浏览器发送和接收 Cookie

### 4️⃣ 前端 - 建立 SSE 连接

```javascript
function connectSSE() {
  // EventSource 会自动携带 Cookie
  eventSource = new EventSource('/api/sse');
  
  eventSource.onmessage = (event) => {
    console.log('收到消息:', event.data);
  };
}
```

**自动过程：**
1. 浏览器创建 EventSource 连接
2. 浏览器自动在请求头中包含 Cookie
3. 服务器验证 Cookie 中的 Token
4. 验证成功后建立 SSE 连接

---

## 🔄 完整流程图

```
前端                          服务端
  |                             |
  |--- POST /login ------------->|
  |                             |
  |<--- Set-Cookie: token -------|
  |                             |
  |[浏览器保存 Cookie]           |
  |                             |
  |--- GET /api/sse ------------->|
  |[自动包含 Cookie]             |
  |                             |
  |<--- 验证 Cookie 中的 Token ---|
  |                             |
  |<--- 200 OK (SSE) ------------|
  |                             |
  |<--- data: 消息 \n\n ---------|
  |                             |
  |--- POST /logout ------------->|
  |                             |
  |<--- Set-Cookie: (清除) -------|
  |                             |
  |[浏览器删除 Cookie]           |
```

---

## 🎯 实验步骤

1. **启动服务器**
   ```bash
   node server.js
   ```

2. **打开浏览器**
   访问 `http://localhost:3002`

3. **点击"登录"按钮**
   - 状态变为"已登录"
   - Cookie 被设置到浏览器

4. **点击"连接 SSE"按钮**
   - 状态变为"已连接"
   - 开始接收消息
   - 服务器验证了 Cookie 中的 Token

5. **观察消息流**
   - 每秒收到一条消息
   - 10 条消息后自动断开

6. **点击"登出"按钮**
   - 状态变为"已登出"
   - Cookie 被清除
   - SSE 连接断开

7. **尝试不登录直接连接**
   - 点击"连接 SSE"（不登录）
   - 会收到 401 未授权错误

---

## 🔍 浏览器开发者工具调试

### 查看 Cookie

1. 打开 DevTools (F12)
2. 切换到 Application 标签
3. 左侧选择 Cookies
4. 选择 `http://localhost:3002`
5. 可以看到 `token` Cookie

### 查看网络请求

1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 点击"连接 SSE"
4. 找到 `/api/sse` 请求
5. 查看 Request Headers，可以看到 `Cookie: token=...`

### 查看控制台日志

1. 打开 DevTools (F12)
2. 切换到 Console 标签
3. 可以看到所有的日志输出

---

## ⚠️ 安全注意事项

### 1. 使用 HttpOnly 标志

```javascript
// ✅ 正确 - 防止 XSS 攻击
res.writeHead(200, {
  'Set-Cookie': `token=${VALID_TOKEN}; Path=/; HttpOnly`
});

// ❌ 错误 - 容易被 XSS 攻击
res.writeHead(200, {
  'Set-Cookie': `token=${VALID_TOKEN}; Path=/`
});
```

### 2. 使用 Secure 标志（HTTPS）

```javascript
// 在生产环境中应该使用 Secure 标志
res.writeHead(200, {
  'Set-Cookie': `token=${VALID_TOKEN}; Path=/; HttpOnly; Secure`
});
```

### 3. 使用 SameSite 标志

```javascript
// 防止 CSRF 攻击
res.writeHead(200, {
  'Set-Cookie': `token=${VALID_TOKEN}; Path=/; HttpOnly; SameSite=Strict`
});
```

---

## 📊 Cookie vs Header 对比

| 特性 | Cookie | Header |
|------|--------|--------|
| EventSource 支持 | ✅ 自动包含 | ❌ 不支持 |
| 安全性 | 需要 HttpOnly | 更安全 |
| 跨域 | 需要特殊配置 | 需要 CORS |
| 自动过期 | ✅ 支持 | ❌ 不支持 |
| 存储大小 | 4KB 限制 | 无限制 |

---

## 💡 何时使用 Cookie

- ✅ 使用原生 EventSource
- ✅ 需要自动过期机制
- ✅ 简单的身份验证

## 💡 何时使用 Header

- ✅ 使用 fetch-event-source 库
- ✅ 需要更灵活的控制
- ✅ 复杂的身份验证

---

## 🚀 下一步学习

- 通过 Header 携带 Token（使用 fetch-event-source）
- 实现 Token 刷新机制
- 集成 JWT 认证
- 实现重连机制
