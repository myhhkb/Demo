// eventSource 用来保存当前的 SSE 连接对象。
// 先设为 null，表示一开始还没有连接。
let eventSource = null;

// connectSSE 用来建立 SSE 连接。
function connectSSE() {
  // 如果之前已经连过，为了避免重复连接，先断开旧连接。
  if (eventSource) {
    eventSource.close();
  }

  // 创建 EventSource 对象。
  // 浏览器会自动向 /api/sse 发起一个保持长连接的请求。
  eventSource = new EventSource('/api/sse');

  // onopen：连接建立成功时触发。
  eventSource.onopen = () => {
    console.log('SSE 连接已打开');
    updateStatus(true);
  };

  // onmessage：服务器每推送一条普通消息时触发。
  eventSource.onmessage = (event) => {
    console.log('收到消息:', event.data);
    addMessage(event.data);
  };

  // onerror：连接发生错误时触发。
  eventSource.onerror = (error) => {
    console.error('SSE 连接错误:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('连接已关闭');
      updateStatus(false);
    }
  };
}

// disconnectSSE 用来手动关闭当前连接。
function disconnectSSE() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    updateStatus(false);
    console.log('手动断开连接');
  }
}

// addMessage 用来把服务器推送的内容追加到页面消息列表中。
function addMessage(message) {
  const messagesDiv = document.getElementById('messages');
  const messageEl = document.createElement('div');
  messageEl.className = 'message';

  // 给消息加上当前时间，方便观察推送节奏。
  messageEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  messagesDiv.appendChild(messageEl);

  // 每加一条新消息后，自动滚动到底部。
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// updateStatus 用来更新页面上的连接状态显示。
function updateStatus(connected) {
  const statusDiv = document.getElementById('status');
  if (connected) {
    statusDiv.className = 'status connected';
    statusDiv.textContent = '状态: 已连接';
  } else {
    statusDiv.className = 'status disconnected';
    statusDiv.textContent = '状态: 未连接';
  }
}
