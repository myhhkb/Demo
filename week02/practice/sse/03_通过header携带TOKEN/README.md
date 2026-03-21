# SSE - 通过 Header 携带 Token

## 🚀 快速开始

```bash
node server.js
```

访问 `http://localhost:3003`

---

## 📝 核心原理

原生 `EventSource` 不支持自定义请求头，所以通过 **URL 参数** 传递 Token：

```javascript
// 前端：通过 URL 参数传递 token
eventSource = new EventSource('/api/sse?token=' + token);
```

```javascript
// 服务端：从 URL 参数中提取 token
const url = new URL(req.url, 'http://localhost');
const token = url.searchParams.get('token');
```

---

## 🔄 流程

1. 输入 Token（默认：`Bearer token-12345`）
2. 点击"连接"按钮
3. 通过 URL 参数发送 Token
4. 服务端验证 Token
5. 验证成功建立 SSE 连接
6. 接收消息

---

## ⚠️ 注意

- URL 参数方式不如 Header 安全（Token 暴露在 URL 中）
- 生产环境建议使用 `fetch-event-source` 库支持自定义 Header
- 或者使用 Cookie 方式（见 `03_通过Cookie携带TOKEN`）

---

## 💡 更好的方案

使用 `@microsoft/fetch-event-source` 库可以支持自定义 Header：

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

fetchEventSource('/api/sse', {
  headers: {
    'Authorization': 'Bearer token-12345'
  },
  onmessage(event) {
    console.log(event.data);
  }
});
```
