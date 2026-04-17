// 引入 Node.js 内置模块。
// - http: 用来创建 Web 服务器
// - fs:   用来读文件
// - path: 用来处理文件路径
const http = require('http');
const fs = require('fs');
const path = require('path');

// 创建 HTTP 服务器。
const server = http.createServer((req, res) => {
  // 处理前端脚本 client.js 的请求。
  if (req.url === '/client.js') {
    const filePath = path.join(__dirname, 'client.js');
    fs.readFile(filePath, 'utf-8', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not Found');
        return;
      }

      res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
      res.end(data);
    });
  }
  // 处理 SSE 长连接请求。
  else if (req.url === '/api/sse') {
    // 设置 SSE 所需响应头。
    // 这些响应头的作用：
    // - text/event-stream：告诉浏览器这不是普通响应，而是 SSE 数据流
    // - no-cache：避免缓存
    // - keep-alive：保持连接不断开
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    // 先发送一条初始消息，表示连接已经建立成功。
    res.write('data: 连接成功\n\n');

    // 用定时器模拟服务器每秒推送一条消息。
    let count = 0;
    const interval = setInterval(() => {
      count++;
      res.write(`data: 这是第 ${count} 条消息\n\n`);

      // 推送 10 条后主动结束连接。
      if (count >= 10) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    // 如果客户端提前断开连接，记得清理定时器，避免资源浪费。
    req.on('close', () => {
      clearInterval(interval);
    });
  }
  // 处理首页请求，直接返回一个简单的演示 HTML 页面。
  else if (req.url === '/' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SSE 基本流程</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
          }
          #messages {
            border: 1px solid #ccc;
            padding: 10px;
            height: 300px;
            overflow-y: auto;
            background-color: #f9f9f9;
          }
          .message {
            padding: 5px;
            margin: 5px 0;
            background-color: #e3f2fd;
            border-left: 3px solid #2196F3;
          }
          button {
            padding: 10px 20px;
            margin: 10px 0;
            cursor: pointer;
          }
          .status {
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
          }
          .connected {
            background-color: #c8e6c9;
            color: #2e7d32;
          }
          .disconnected {
            background-color: #ffcdd2;
            color: #c62828;
          }
        </style>
      </head>
      <body>
        <h1>SSE 基本流程演示</h1>
        <div id="status" class="status disconnected">状态: 未连接</div>
        <button onclick="connectSSE()">连接</button>
        <button onclick="disconnectSSE()">断开</button>
        <h2>接收到的消息:</h2>
        <div id="messages"></div>
      </body>
      <script>
        let eventSource = null;

        function connectSSE() {
          if (eventSource) {
            eventSource.close();
          }

          eventSource = new EventSource('/api/sse');

          eventSource.onopen = () => {
            console.log('SSE 连接已打开');
            updateStatus(true);
          };

          eventSource.onmessage = (event) => {
            console.log('收到消息:', event.data);
            addMessage(event.data);
          };

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
          messageEl.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
          messagesDiv.appendChild(messageEl);
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
      </script>
      </html>
    `);
  }
  // 其他路径一律返回 404。
  else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// 指定服务运行端口。
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`SSE 服务器运行在 http://localhost:${PORT}`);
});
