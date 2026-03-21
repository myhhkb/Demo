# SSE 集成方案

## 🚀 快速开始

```bash
node server.js
```

访问 `http://localhost:3004`

---

## 📝 两种集成方案

### 方案 1️⃣ EventSource Polyfill

**优点：**
- 支持自定义 Header
- 兼容 IE
- 使用简单

**缺点：**
- 不支持 POST 请求
- 不支持自定义 Body

**使用方式：**

```html
<script src="https://cdn.jsdelivr.net/npm/event-source-polyfill@1.0.31/src/eventsource.min.js"></script>

<script>
  const eventSource = new EventSourcePolyfill('/api/sse', {
    headers: {
      'Authorization': 'Bearer token-12345'
    }
  });

  eventSource.addEventListener('event-type', (event) => {
    console.log(event.data);
  });
</script>
```

---

### 方案 2️⃣ @microsoft/fetch-event-source

**优点：**
- 支持自定义 Header
- 支持 POST 请求
- 支持自定义 Body
- 更灵活

**缺点：**
- 需要 npm 安装
- 需要打包工具

**安装：**

```bash
npm install @microsoft/fetch-event-source
```

**使用方式：**

```javascript
import { fetchEventSource } from '@microsoft/fetch-event-source';

fetchEventSource('/api/sse', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer token-12345'
  },
  body: JSON.stringify({ userId: 123 }),
  onmessage(event) {
    console.log(event.data);
  }
});
```

---

## 🎯 本示例特点

1. **使用 EventSource Polyfill** - 支持自定义 Header
2. **多事件类型** - 演示不同类型事件的处理
3. **闪烁动画** - 消息更新时的视觉反馈
4. **Token 认证** - 通过 Header 传递 Token

---

## 📊 对比表

| 特性 | 原生 EventSource | Polyfill | fetch-event-source |
|------|-----------------|----------|-------------------|
| 自定义 Header | ❌ | ✅ | ✅ |
| POST 请求 | ❌ | ❌ | ✅ |
| 自定义 Body | ❌ | ❌ | ✅ |
| IE 兼容 | ❌ | ✅ | ✅ |
| 文件大小 | 小 | 中 | 中 |

---

## 🔍 浏览器开发者工具

### 查看网络请求
1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 点击"连接"按钮
4. 找到 `/api/sse` 请求
5. 查看 Request Headers，可以看到 `Authorization` Header

### 查看控制台日志
1. 打开 DevTools (F12)
2. 切换到 Console 标签
3. 可以看到连接和错误日志

---

## 💡 何时使用哪个方案

**使用 EventSource Polyfill：**
- 需要支持 IE
- 只需要 GET 请求
- 项目不使用打包工具

**使用 fetch-event-source：**
- 需要 POST 请求
- 需要自定义 Body
- 项目已使用 npm 和打包工具
- 需要更多控制

---

## 🚀 下一步

- 实现重连机制
- 实现指数退避
- 集成 JWT 认证
- 实现心跳检测
