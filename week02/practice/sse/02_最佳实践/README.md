# SSE 最佳实践

## 📋 项目结构

```
02_最佳实践/
├── server.js      # 服务端代码
├── style.css      # 样式文件
├── package.json   # 项目配置
└── README.md      # 说明文档
```

## 🚀 快速开始

### 1. 启动服务器

```bash
node server.js
```

服务器会在 `http://localhost:3001` 启动

### 2. 打开浏览器

访问 `http://localhost:3001`

### 3. 点击"连接"按钮

开始接收来自服务器的不同类型事件

---

## 🎯 最佳实践详解

### 1️⃣ 使用自定义 Event 类型

**服务端：** 通过 `event:` 字段定义不同的事件类型

```javascript
// 发送欢迎事件
res.write('event: welcome\n');
res.write('data: 欢迎连接到 SSE 服务器\n\n');

// 发送消息事件
res.write('event: message\n');
res.write('data: 这是一条消息\n\n');

// 发送通知事件
res.write('event: notification\n');
res.write('data: 您有一条新通知\n\n');

// 发送心跳事件
res.write('event: heartbeat\n');
res.write('data: 心跳信号\n\n');
```

**前端：** 通过 `addEventListener` 监听特定事件

```javascript
// 监听欢迎事件
eventSource.addEventListener('welcome', (event) => {
  console.log('欢迎消息:', event.data);
});

// 监听消息事件
eventSource.addEventListener('message', (event) => {
  console.log('消息:', event.data);
});

// 监听通知事件
eventSource.addEventListener('notification', (event) => {
  console.log('通知:', event.data);
});

// 监听心跳事件
eventSource.addEventListener('heartbeat', (event) => {
  console.log('心跳:', event.data);
});
```

**优势：**
- 同一个接口可以承载多种功能
- 前端可以针对不同事件类型做不同处理
- 代码更清晰，易于维护

---

### 2️⃣ 组件卸载时关闭连接

**最佳实践：** 在页面卸载时关闭 SSE 连接

```javascript
// 页面卸载时关闭连接
window.addEventListener('beforeunload', () => {
  if (eventSource) {
    eventSource.close();
  }
});
```

**为什么重要：**
- 防止内存泄漏
- 避免浏览器保持不必要的连接
- 确保服务器资源被正确释放

**Vue 组件示例：**
```javascript
onUnmounted(() => {
  if (eventSource) {
    eventSource.close();
  }
});
```

**React 组件示例：**
```javascript
useEffect(() => {
  return () => {
    if (eventSource) {
      eventSource.close();
    }
  };
}, []);
```

---

### 3️⃣ 事件统计和监控

本示例展示了如何统计不同类型事件的数量：

```javascript
const stats = {
  welcome: 0,
  message: 0,
  notification: 0,
  heartbeat: 0,
  close: 0
};

eventSource.addEventListener('welcome', (event) => {
  stats.welcome++;
  updateStats();
});
```

**用途：**
- 监控连接健康状态
- 调试和性能分析
- 用户界面反馈

---

### 4️⃣ 错误处理

```javascript
eventSource.onerror = (error) => {
  console.error('SSE 连接错误:', error);
  
  // 检查连接状态
  if (eventSource.readyState === EventSource.CLOSED) {
    console.log('连接已关闭');
    updateStatus(false);
  }
};
```

**连接状态：**
- `EventSource.CONNECTING` (0) - 连接中
- `EventSource.OPEN` (1) - 已连接
- `EventSource.CLOSED` (2) - 已断开

---

### 5️⃣ 同一接口多功能复用

这个示例展示了如何在同一个 `/api/sse` 接口中处理多种功能：

```javascript
// 服务端
if (count % 3 === 1) {
  res.write('event: message\n');
  res.write(`data: 消息\n\n`);
} else if (count % 3 === 2) {
  res.write('event: notification\n');
  res.write(`data: 通知\n\n`);
} else {
  res.write('event: heartbeat\n');
  res.write(`data: 心跳\n\n`);
}
```

**优势：**
- 减少接口数量
- 统一连接管理
- 提高代码复用性

---

## 📊 事件流程图

```
前端                          服务端
  |                             |
  |--- 创建 EventSource ------->|
  |                             |
  |<---- event: welcome --------|
  |<---- onopen 触发 ----------|
  |                             |
  |<---- event: message --------|
  |<---- addEventListener -----|
  |                             |
  |<---- event: notification ---|
  |<---- addEventListener -----|
  |                             |
  |<---- event: heartbeat ------|
  |<---- addEventListener -----|
  |                             |
  |<---- event: close ---------|
  |                             |
  |<---- res.end() ------------|
  |                             |
  |<---- onerror 触发 ---------|
  |                             |
  |--- 自动重连 (几秒后) ------>|
```

---

## 🎨 UI 特性

- **实时消息显示** - 所有事件实时显示在消息区域
- **事件统计** - 右侧显示各类型事件的计数
- **颜色编码** - 不同事件类型用不同颜色区分
- **响应式设计** - 适配各种屏幕尺寸
- **平滑动画** - 消息滑入动画效果

---

## 🎯 实验步骤

1. **启动服务器**
   ```bash
   node server.js
   ```

2. **打开浏览器**
   访问 `http://localhost:3001`

3. **点击"连接"按钮**
   - 观察状态变为"已连接"
   - 开始接收不同类型的事件

4. **观察事件流**
   - 消息区域显示所有事件
   - 右侧统计各类型事件数量
   - 每种事件用不同颜色区分

5. **观察自动重连**
   - 15 条消息后服务端断开
   - 浏览器自动重新连接
   - 统计数据重置

6. **手动断开**
   - 点击"断开"按钮
   - 状态变为"未连接"
   - 需要再次点击"连接"才能重新连接

7. **清空消息**
   - 点击"清空消息"按钮
   - 消息区域被清空
   - 统计数据保留

---

## 💡 关键要点总结

| 特性 | 说明 |
|------|------|
| **自定义 Event** | 通过 `event:` 字段定义不同事件类型 |
| **事件监听** | 使用 `addEventListener` 监听特定事件 |
| **连接管理** | 页面卸载时必须关闭连接 |
| **错误处理** | 监听 `onerror` 事件处理连接错误 |
| **状态检查** | 通过 `readyState` 检查连接状态 |
| **接口复用** | 同一接口可承载多种功能 |

---

## 🔍 浏览器开发者工具调试

### 查看网络请求
1. 打开 DevTools (F12)
2. 切换到 Network 标签
3. 点击"连接"按钮
4. 找到 `/api/sse` 请求
5. 查看 Response 标签，可以看到实时的事件流

### 查看控制台日志
1. 打开 DevTools (F12)
2. 切换到 Console 标签
3. 可以看到所有的日志输出

---

## 📝 代码对比

### 基本流程 vs 最佳实践

| 方面 | 基本流程 | 最佳实践 |
|------|--------|--------|
| 事件类型 | 单一 | 多种 |
| 事件监听 | `onmessage` | `addEventListener` |
| 连接管理 | 基础 | 完整的生命周期管理 |
| 错误处理 | 简单 | 详细的状态检查 |
| UI 反馈 | 基础 | 完整的统计和监控 |

---

## 🚀 下一步学习

- 通过 Header 携带 Token 进行身份验证
- 使用 Cookie 进行身份验证
- 集成 EventSource Polyfill
- 使用 @microsoft/fetch-event-source 库
- 实现重连机制和指数退避
