# SSE 基本流程实现

## 📋 项目结构

```
01_基本流程/
├── server.js      # 服务端代码
├── client.js      # 前端客户端代码
├── package.json   # 项目配置
└── README.md      # 说明文档
```

## 🚀 快速开始

### 1. 启动服务器

```bash
node server.js
```

服务器会在 `http://localhost:3000` 启动

### 2. 打开浏览器

访问 `http://localhost:3000`，你会看到一个简单的界面

### 3. 点击"连接"按钮

开始接收来自服务器的消息

---

## 🔔 服务端流程详解

### server.js 核心部分

#### 1️⃣ 开启 HTTP 服务
```javascript
const server = http.createServer((req, res) => {
  // 处理请求
});
server.listen(3000);
```

#### 2️⃣ 定义 GET 接口
```javascript
if (req.url === '/api/sse') {
  // SSE 逻辑
}
```

#### 3️⃣ 设置正确的响应头
```javascript
res.writeHead(200, {
  'Content-Type': 'text/event-stream; charset=utf-8',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*'
});
```

**关键点：** `Content-Type` 必须是 `text/event-stream; charset=utf-8`

#### 4️⃣ 发送消息
```javascript
res.write('data: 消息内容\n\n');
```

**重要：** 必须严格按照 `data: 内容\n\n` 格式（两个换行符）

#### 5️⃣ 断开连接
```javascript
res.end();
```

调用 `res.end()` 后，浏览器会认为这是"意外断线"，会自动重连

---

## 🔔 前端流程详解

### client.js 核心部分

#### 1️⃣ 创建 EventSource 对象
```javascript
eventSource = new EventSource('/api/sse');
```

#### 2️⃣ 监听连接打开
```javascript
eventSource.onopen = () => {
  console.log('连接已打开');
};
```

#### 3️⃣ 监听消息
```javascript
eventSource.onmessage = (event) => {
  console.log('收到消息:', event.data);
};
```

#### 4️⃣ 监听错误
```javascript
eventSource.onerror = (error) => {
  console.error('连接错误:', error);
};
```

#### 5️⃣ 断开连接
```javascript
eventSource.close();
```

---

## ⚠️ 重要注意点

### 1. 消息格式必须严格
```javascript
// ✅ 正确
res.write('data: 消息内容\n\n');

// ❌ 错误（缺少换行符）
res.write('data: 消息内容\n');

// ❌ 错误（格式不对）
res.write('消息内容\n\n');
```

### 2. 服务端断开后的自动重连
- 当服务端调用 `res.end()` 时，浏览器会认为连接意外断开
- 浏览器会自动在几秒后重新发起请求
- 这是 EventSource 的默认行为

### 3. 前端主动断开
```javascript
eventSource.close();
// 之后需要重新创建新的 EventSource 实例才能重连
eventSource = new EventSource('/api/sse');
```

### 4. 连接状态检查
```javascript
if (eventSource.readyState === EventSource.CONNECTING) {
  // 连接中
}
if (eventSource.readyState === EventSource.OPEN) {
  // 已连接
}
if (eventSource.readyState === EventSource.CLOSED) {
  // 已断开
}
```

---

## 📊 工作流程图

```
前端                          服务端
  |                             |
  |--- 创建 EventSource ------->|
  |                             |
  |<---- onopen 触发 ----------|
  |                             |
  |<---- data: msg1 \n\n ------|
  |                             |
  |<---- onmessage 触发 --------|
  |                             |
  |<---- data: msg2 \n\n ------|
  |                             |
  |<---- onmessage 触发 --------|
  |                             |
  |<---- res.end() ------------|
  |                             |
  |<---- onerror 触发 ---------|
  |                             |
  |--- 自动重连 (几秒后) ------>|
```

---

## 🎯 实验步骤

1. **启动服务器**
   ```bash
   node server.js
   ```

2. **打开浏览器**
   访问 `http://localhost:3000`

3. **点击"连接"按钮**
   - 观察状态变为"已连接"
   - 开始接收消息

4. **观察消息流**
   - 每秒收到一条消息
   - 10 条消息后服务端断开

5. **观察自动重连**
   - 服务端断开后，几秒内会自动重连
   - 重新开始接收消息

6. **手动断开**
   - 点击"断开"按钮
   - 状态变为"未连接"
   - 需要再次点击"连接"才能重新连接

---

## 🔍 浏览器开发者工具调试

### 查看网络请求
1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 点击"连接"按钮
4. 找到 `/api/sse` 请求
5. 查看 Response 标签，可以看到实时的消息流

### 查看控制台日志
1. 打开 DevTools (F12)
2. 切换到 Console 标签
3. 可以看到所有的日志输出

---

## 💡 下一步学习

- 使用自定义 event 类型
- 通过 Header 携带 Token
- 使用 Cookie 进行身份验证
- 集成 EventSource Polyfill
- 使用 @microsoft/fetch-event-source 库
