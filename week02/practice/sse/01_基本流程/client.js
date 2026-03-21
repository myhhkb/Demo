let eventSource = null;

function connectSSE() {
  // 如果已经连接，先断开
  if (eventSource) {
    eventSource.close();
  }

  // 创建 EventSource 对象
  eventSource = new EventSource('/api/sse');

  // 监听连接打开
  eventSource.onopen = () => {
    console.log('SSE 连接已打开');
    updateStatus(true);
  };

  // 监听消息
  eventSource.onmessage = (event) => {
    console.log('收到消息:', event.data);
    addMessage(event.data);
  };

  // 监听错误
  eventSource.onerror = (error) => {
    console.error('SSE 连接错误:', error);
    if (eventSource.readyState === EventSource.CLOSED) {
      console.log('连接已关闭');
      updateStatus(false);
    }
  };
}

function disconnectSSE() {
  if (eventSource) {
    eventSource.close();
    eventSource = null;
    updateStatus(false);
    console.log('手动断开连接');
  }
}

function addMessage(message) {
  const messagesDiv = document.getElementById('messages');
  const messageEl = document.createElement('div');
  messageEl.className = 'message';
  messageEl.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  messagesDiv.appendChild(messageEl);
  // 自动滚动到底部
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

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
