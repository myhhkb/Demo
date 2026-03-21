const http = require('http');

// 模拟的有效 token
const VALID_TOKEN = 'user-token-12345';

const server = http.createServer((req, res) => {
  // 处理登录接口 - 设置 Cookie
  if (req.url === '/login' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': `token=${VALID_TOKEN}; Path=/; HttpOnly`
    });
    res.end(JSON.stringify({
      success: true,
      message: '登录成功，Token 已设置到 Cookie'
    }));
  }
  // 处理 SSE 连接
  else if (req.url === '/api/sse' && req.method === 'GET') {
    // 从 Cookie 中提取 token
    const cookies = req.headers.cookie || '';
    const tokenMatch = cookies.match(/token=([^;]*)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    // 验证 token
    if (token !== VALID_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify({
        error: '未授权',
        message: '无效的 Token 或未登录'
      }));
      return;
    }

    // Token 验证成功，建立 SSE 连接
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    console.log('✅ 客户端已认证，建立 SSE 连接');

    // 发送欢迎消息
    res.write('data: 认证成功，连接已建立\n\n');

    let count = 0;
    const interval = setInterval(() => {
      count++;
      res.write(`data: [认证用户] 消息 ${count}\n\n`);

      if (count >= 10) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    req.on('close', () => {
      clearInterval(interval);
      console.log('❌ 客户端断开连接');
    });
  }
  // 处理登出接口 - 清除 Cookie
  else if (req.url === '/logout' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'token=; Path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC'
    });
    res.end(JSON.stringify({
      success: true,
      message: '登出成功，Token 已清除'
    }));
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
        <title>SSE - Cookie Token 认证</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }

          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }

          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            max-width: 600px;
            width: 100%;
            padding: 40px;
          }

          h1 {
            color: #333;
            margin-bottom: 30px;
            text-align: center;
            font-size: 24px;
          }

          .auth-section {
            margin-bottom: 30px;
            padding-bottom: 30px;
            border-bottom: 2px solid #f0f0f0;
          }

          .auth-section h2 {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
          }

          .button-group {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
          }

          button {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-login {
            background: #28a745;
            color: white;
          }

          .btn-login:hover {
            background: #218838;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }

          .btn-logout {
            background: #dc3545;
            color: white;
          }

          .btn-logout:hover {
            background: #c82333;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          }

          .btn-connect {
            background: #007bff;
            color: white;
          }

          .btn-connect:hover {
            background: #0056b3;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
          }

          .btn-disconnect {
            background: #6c757d;
            color: white;
          }

          .btn-disconnect:hover {
            background: #5a6268;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 117, 125, 0.3);
          }

          .status {
            padding: 12px 16px;
            border-radius: 6px;
            margin-bottom: 15px;
            font-weight: 600;
            text-align: center;
          }

          .status-disconnected {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }

          .status-authenticated {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
          }

          .status-connected {
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
          }

          .status-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
          }

          .sse-section {
            margin-top: 30px;
          }

          .sse-section h2 {
            font-size: 16px;
            color: #666;
            margin-bottom: 15px;
          }

          .messages {
            border: 1px solid #e9ecef;
            border-radius: 6px;
            padding: 15px;
            height: 250px;
            overflow-y: auto;
            background: #fafbfc;
          }

          .message {
            padding: 8px 12px;
            margin-bottom: 8px;
            background: #e7f3ff;
            border-left: 3px solid #007bff;
            border-radius: 4px;
            font-size: 13px;
            color: #333;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-10px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          .empty-message {
            color: #999;
            text-align: center;
            padding: 40px 20px;
          }

          .info-box {
            background: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 12px 16px;
            border-radius: 4px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #0c5460;
          }

          .messages::-webkit-scrollbar {
            width: 6px;
          }

          .messages::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 3px;
          }

          .messages::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 3px;
          }

          .messages::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🔐 SSE - Cookie Token 认证</h1>

          <div class="info-box">
            💡 这个示例展示如何通过 Cookie 在 SSE 中进行身份验证。Token 会自动包含在请求头中。
          </div>

          <div class="auth-section">
            <h2>1️⃣ 身份认证</h2>
            <div id="authStatus" class="status status-disconnected">状态: 未登录</div>
            <div class="button-group">
              <button class="btn-login" onclick="login()">登录</button>
              <button class="btn-logout" onclick="logout()">登出</button>
            </div>
          </div>

          <div class="sse-section">
            <h2>2️⃣ SSE 连接</h2>
            <div id="sseStatus" class="status status-disconnected">状态: 未连接</div>
            <div class="button-group">
              <button class="btn-connect" onclick="connectSSE()">连接 SSE</button>
              <button class="btn-disconnect" onclick="disconnectSSE()">断开连接</button>
            </div>

            <h2 style="margin-top: 20px;">接收到的消息:</h2>
            <div id="messages" class="messages">
              <div class="empty-message">等待消息...</div>
            </div>
          </div>
        </div>

        <script>
          let eventSource = null;

          async function login() {
            try {
              const response = await fetch('/login', {
                method: 'POST',
                credentials: 'include'
              });
              const data = await response.json();
              
              if (response.ok) {
                updateAuthStatus(true, '已登录');
                console.log('✅ 登录成功');
              } else {
                updateAuthStatus(false, '登录失败');
              }
            } catch (error) {
              console.error('登录错误:', error);
              updateAuthStatus(false, '登录错误');
            }
          }

          async function logout() {
            try {
              const response = await fetch('/logout', {
                method: 'POST',
                credentials: 'include'
              });
              const data = await response.json();
              
              if (response.ok) {
                updateAuthStatus(false, '已登出');
                disconnectSSE();
                console.log('✅ 登出成功');
              }
            } catch (error) {
              console.error('登出错误:', error);
            }
          }

          function connectSSE() {
            if (eventSource) {
              eventSource.close();
            }

            eventSource = new EventSource('/api/sse');

            eventSource.onopen = () => {
              console.log('✅ SSE 连接已打开');
              updateSSEStatus(true, '已连接');
              clearMessages();
            };

            eventSource.onmessage = (event) => {
              console.log('📨 收到消息:', event.data);
              addMessage(event.data);
            };

            eventSource.onerror = (error) => {
              console.error('❌ SSE 连接错误:', error);
              if (eventSource.readyState === EventSource.CLOSED) {
                updateSSEStatus(false, '连接已关闭');
              }
            };
          }

          function disconnectSSE() {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
              updateSSEStatus(false, '未连接');
              console.log('❌ 手动断开连接');
            }
          }

          function addMessage(message) {
            const container = document.getElementById('messages');
            
            // 如果是第一条消息，清空占位符
            if (container.querySelector('.empty-message')) {
              container.innerHTML = '';
            }

            const messageEl = document.createElement('div');
            messageEl.className = 'message';
            messageEl.textContent = '[' + new Date().toLocaleTimeString() + '] ' + message;
            container.appendChild(messageEl);
            container.scrollTop = container.scrollHeight;
          }

          function clearMessages() {
            const container = document.getElementById('messages');
            container.innerHTML = '<div class="empty-message">等待消息...</div>';
          }

          function updateAuthStatus(isLoggedIn, text) {
            const status = document.getElementById('authStatus');
            if (isLoggedIn) {
              status.className = 'status status-authenticated';
              status.textContent = '状态: ' + text;
            } else {
              status.className = 'status status-disconnected';
              status.textContent = '状态: ' + text;
            }
          }

          function updateSSEStatus(isConnected, text) {
            const status = document.getElementById('sseStatus');
            if (isConnected) {
              status.className = 'status status-connected';
              status.textContent = '状态: ' + text;
            } else {
              status.className = 'status status-disconnected';
              status.textContent = '状态: ' + text;
            }
          }

          // 页面卸载时关闭连接
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

const PORT = 3002;
server.listen(PORT, () => {
  console.log(`🚀 SSE Cookie Token 认证服务器运行在 http://localhost:${PORT}`);
});
