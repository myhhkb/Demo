const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // 处理 SSE 连接
  if (req.url === '/api/sse') {
    // 设置 SSE 响应头
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    console.log('新客户端连接');

    // 发送欢迎消息
    res.write('event: welcome\n');
    res.write('data: 欢迎连接到 SSE 服务器\n\n');

    let count = 0;
    const interval = setInterval(() => {
      count++;

      // 根据计数发送不同类型的事件
      if (count % 3 === 1) {
        // 发送消息事件
        res.write('event: message\n');
        res.write(`data: 这是第 ${count} 条消息\n\n`);
      } else if (count % 3 === 2) {
        // 发送通知事件
        res.write('event: notification\n');
        res.write(`data: 🔔 您有一条新通知 (${count})\n\n`);
      } else {
        // 发送心跳事件
        res.write('event: heartbeat\n');
        res.write(`data: 心跳信号 - ${new Date().toLocaleTimeString()}\n\n`);
      }

      // 15 条消息后断开连接
      if (count >= 15) {
        clearInterval(interval);
        res.write('event: close\n');
        res.write('data: 连接即将关闭\n\n');
        res.end();
      }
    }, 1000);

    // 客户端断开连接时清理
    req.on('close', () => {
      clearInterval(interval);
      console.log('客户端断开连接');
    });
  }
  // 处理静态文件请求
  else if (req.url === '/style.css') {
    const filePath = path.join(__dirname, 'style.css');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }
      res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8' });
      res.end(data);
    });
  }
  // 提供 HTML 页面
  else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSE 最佳实践</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div class="container">
          <h1>SSE 最佳实践演示</h1>
          
          <div class="control-panel">
            <div id="status" class="status disconnected">状态: 未连接</div>
            <button onclick="connectSSE()" class="btn btn-connect">连接</button>
            <button onclick="disconnectSSE()" class="btn btn-disconnect">断开</button>
            <button onclick="clearMessages()" class="btn btn-clear">清空消息</button>
          </div>

          <div class="content">
            <div class="messages-section">
              <h2>所有消息</h2>
              <div id="allMessages" class="messages-container"></div>
            </div>

            <div class="stats-section">
              <h2>事件统计</h2>
              <div class="stats">
                <div class="stat-item">
                  <span class="stat-label">欢迎事件:</span>
                  <span id="welcomeCount" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">消息事件:</span>
                  <span id="messageCount" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">通知事件:</span>
                  <span id="notificationCount" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">心跳事件:</span>
                  <span id="heartbeatCount" class="stat-value">0</span>
                </div>
                <div class="stat-item">
                  <span class="stat-label">关闭事件:</span>
                  <span id="closeCount" class="stat-value">0</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <script>
          let eventSource = null;
          const stats = {
            welcome: 0,
            message: 0,
            notification: 0,
            heartbeat: 0,
            close: 0
          };

          function connectSSE() {
            if (eventSource) {
              eventSource.close();
            }

            eventSource = new EventSource('/api/sse');

            // 监听连接打开
            eventSource.onopen = () => {
              console.log('SSE 连接已打开');
              updateStatus(true);
              clearMessages();
              resetStats();
            };

            // 监听欢迎事件
            eventSource.addEventListener('welcome', (event) => {
              stats.welcome++;
              addMessage('welcome', event.data);
              updateStats();
            });

            // 监听消息事件
            eventSource.addEventListener('message', (event) => {
              stats.message++;
              addMessage('message', event.data);
              updateStats();
            });

            // 监听通知事件
            eventSource.addEventListener('notification', (event) => {
              stats.notification++;
              addMessage('notification', event.data);
              updateStats();
            });

            // 监听心跳事件
            eventSource.addEventListener('heartbeat', (event) => {
              stats.heartbeat++;
              addMessage('heartbeat', event.data);
              updateStats();
            });

            // 监听关闭事件
            eventSource.addEventListener('close', (event) => {
              stats.close++;
              addMessage('close', event.data);
              updateStats();
            });

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

          function addMessage(type, message) {
            const container = document.getElementById('allMessages');
            const messageEl = document.createElement('div');
            messageEl.className = 'message message-' + type;
            messageEl.innerHTML = \`
              <span class="message-time">[\${new Date().toLocaleTimeString()}]</span>
              <span class="message-type">\${type}</span>
              <span class="message-content">\${message}</span>
            \`;
            container.appendChild(messageEl);
            container.scrollTop = container.scrollHeight;
          }

          function clearMessages() {
            document.getElementById('allMessages').innerHTML = '';
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

          function updateStats() {
            document.getElementById('welcomeCount').textContent = stats.welcome;
            document.getElementById('messageCount').textContent = stats.message;
            document.getElementById('notificationCount').textContent = stats.notification;
            document.getElementById('heartbeatCount').textContent = stats.heartbeat;
            document.getElementById('closeCount').textContent = stats.close;
          }

          function resetStats() {
            stats.welcome = 0;
            stats.message = 0;
            stats.notification = 0;
            stats.heartbeat = 0;
            stats.close = 0;
            updateStats();
          }

          // 页面卸载时关闭连接（最佳实践）
          window.addEventListener('beforeunload', () => {
            if (eventSource) {
              eventSource.close();
            }
          });
        </script>
      </body>
      </html>
    `);
  }
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`SSE 最佳实践服务器运行在 http://localhost:${PORT}`);
});
