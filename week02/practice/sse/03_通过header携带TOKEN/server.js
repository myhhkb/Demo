const http = require('http');
const url = require('url');

const VALID_TOKEN = 'Bearer token-12345';

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // SSE 接口
  if (pathname === '/api/sse') {
    // 从 URL 参数中提取 token
    const token = query.token;

    // 验证 token
    if (token !== VALID_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '未授权' }));
      return;
    }

    // 建立 SSE 连接
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write('data: 认证成功，连接已建立\n\n');

    let count = 0;
    const interval = setInterval(() => {
      count++;
      res.write(`data: 消息 ${count}\n\n`);
      if (count >= 10) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => clearInterval(interval));
  }
  // HTML 页面
  else if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>SSE - Header Token 认证</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .status {
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-weight: bold;
          }
          .connected { background: #d4edda; color: #155724; }
          .disconnected { background: #f8d7da; color: #721c24; }
          button {
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            border: none;
            border-radius: 4px;
            background: #007bff;
            color: white;
          }
          button:hover { background: #0056b3; }
          #messages {
            border: 1px solid #ccc;
            padding: 10px;
            height: 300px;
            overflow-y: auto;
            background: #f9f9f9;
            margin-top: 10px;
          }
          .message {
            padding: 5px;
            margin: 5px 0;
            background: #e3f2fd;
            border-left: 3px solid #2196F3;
          }
        </style>
      </head>
      <body>
        <h1>🔐 SSE - Header Token 认证</h1>
        
        <div id="status" class="status disconnected">状态: 未连接</div>
        
        <div>
          <input type="text" id="token" placeholder="输入 Token" value="Bearer token-12345" style="width: 300px; padding: 8px;">
          <button onclick="connectSSE()">连接</button>
          <button onclick="disconnectSSE()">断开</button>
        </div>

        <h3>消息:</h3>
        <div id="messages"></div>

        <script>
          let eventSource = null;

          function connectSSE() {
            const token = document.getElementById('token').value;
            
            if (!token) {
              alert('请输入 Token');
              return;
            }

            if (eventSource) {
              eventSource.close();
            }

            // 使用 fetch-event-source 的思路：通过 URL 参数传递 token
            // 或者使用自定义 SSE 客户端
            // 这里演示通过 URL 参数的方式
            eventSource = new EventSource('/api/sse?token=' + encodeURIComponent(token));

            eventSource.onopen = () => {
              updateStatus(true);
              document.getElementById('messages').innerHTML = '';
            };

            eventSource.onmessage = (event) => {
              addMessage(event.data);
            };

            eventSource.onerror = () => {
              updateStatus(false);
            };
          }

          function disconnectSSE() {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
              updateStatus(false);
            }
          }

          function addMessage(msg) {
            const container = document.getElementById('messages');
            const el = document.createElement('div');
            el.className = 'message';
            el.textContent = '[' + new Date().toLocaleTimeString() + '] ' + msg;
            container.appendChild(el);
            container.scrollTop = container.scrollHeight;
          }

          function updateStatus(connected) {
            const status = document.getElementById('status');
            if (connected) {
              status.className = 'status connected';
              status.textContent = '状态: 已连接';
            } else {
              status.className = 'status disconnected';
              status.textContent = '状态: 未连接';
            }
          }

          window.addEventListener('beforeunload', () => {
            if (eventSource) eventSource.close();
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

const PORT = 3003;
server.listen(PORT, () => {
  console.log(`🚀 SSE Header Token 认证服务器运行在 http://localhost:${PORT}`);
});
