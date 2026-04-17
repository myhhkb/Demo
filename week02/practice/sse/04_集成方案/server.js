const http = require('http');
const url = require('url');

// 演示用 token。
// 这里同时支持从 Header 或 URL 参数里读取它。
const VALID_TOKEN = 'Bearer token-12345';

// 创建 HTTP 服务器。
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // SSE 接口。
  if (pathname === '/api/sse') {
    // 同时支持两种取 token 的方式：
    // 1. 从 Authorization 请求头里取
    // 2. 从 URL 查询参数里取
    // 这样可以兼容更多接入场景。
    const authHeader = req.headers.authorization;
    const tokenParam = parsedUrl.query.token;
    const token = authHeader || tokenParam;

    // 先校验 token，未通过则拒绝建立连接。
    if (token !== VALID_TOKEN) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: '未授权' }));
      return;
    }

    // 校验通过后，建立 SSE 长连接。
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });

    console.log('✅ 客户端已连接');

    let count = 0;
    const interval = setInterval(() => {
      count++;

      // 推送不同类型的业务事件。
      // 真实项目里，前端通常会根据事件类型分别更新不同区域。
      if (count % 3 === 1) {
        res.write('event: 未读消息\n');
        res.write(`data: 您有 ${count} 条未读消息\n\n`);
      } else if (count % 3 === 2) {
        res.write('event: 订单更新\n');
        res.write(`data: 订单 #${count} 已更新\n\n`);
      } else {
        res.write('event: 系统通知\n');
        res.write(`data: 系统通知 - ${new Date().toLocaleTimeString()}\n\n`);
      }

      if (count >= 15) {
        clearInterval(interval);
        res.end();
      }
    }, 1000);

    // 客户端关闭连接时，顺手把定时器清理掉。
      clearInterval(interval);
      console.log('❌ 客户端断开连接');
    });
  }
  // HTML 页面
  else if (pathname === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html lang="zh-CN">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>SSE 集成方案</title>
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
            text-align: center;
            color: #333;
            margin-bottom: 30px;
            font-size: 24px;
          }

          .control {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
            flex-wrap: wrap;
          }

          button {
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
          }

          .btn-connect {
            background: #28a745;
            color: white;
          }

          .btn-connect:hover {
            background: #218838;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
          }

          .btn-disconnect {
            background: #dc3545;
            color: white;
          }

          .btn-disconnect:hover {
            background: #c82333;
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(220, 53, 69, 0.3);
          }

          .event-box {
            padding: 15px;
            margin-bottom: 15px;
            border-radius: 8px;
            border-left: 4px solid;
            min-height: 50px;
            display: flex;
            align-items: center;
            font-weight: 600;
            animation: slideIn 0.3s ease;
          }

          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateX(-20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }

          @keyframes flash {
            0% {
              opacity: 0.4;
              transform: scale(1.06);
            }
            50% {
              opacity: 1;
              transform: scale(0.98);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }

          .flash {
            animation: flash 0.6s ease-out;
          }

          .event-未读消息 {
            background: #d1ecf1;
            border-left-color: #0c5460;
            color: #0c5460;
          }

          .event-订单更新 {
            background: #d4edda;
            border-left-color: #155724;
            color: #155724;
          }

          .event-系统通知 {
            background: #fff3cd;
            border-left-color: #856404;
            color: #856404;
          }

          .info {
            background: #e7f3ff;
            border-left: 4px solid #007bff;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #0c5460;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🚀 SSE 集成方案</h1>

          <div class="info">
            💡 这个示例展示如何使用 EventSource Polyfill 支持自定义 Header 和 IE 兼容性
          </div>

          <div class="control">
            <button class="btn-connect" onclick="connectSSE()">连接</button>
            <button class="btn-disconnect" onclick="disconnectSSE()">断开</button>
          </div>

          <div id="未读消息" class="event-box event-未读消息">等待消息...</div>
          <div id="订单更新" class="event-box event-订单更新">等待消息...</div>
          <div id="系统通知" class="event-box event-系统通知">等待消息...</div>
        </div>

        <!-- EventSource Polyfill -->
        <script src="https://cdn.jsdelivr.net/npm/event-source-polyfill@1.0.31/src/eventsource.min.js"></script>

        <script>
          let eventSource = null;

          // 这里直接写死一个演示 token。
          // 真实项目中，通常会从登录接口或本地存储中获取。
          const token = 'Bearer token-12345';

          // connectSSE 使用 EventSource Polyfill 发起连接。
          // 这样就可以像普通请求一样携带自定义请求头。
            if (eventSource) {
              eventSource.close();
            }

            // EventSourcePolyfill 的优势是：
            // 原生 EventSource 不方便设置自定义 Header，
            // 而 polyfill 可以把 Authorization 这样的头带给后端。
            eventSource = new EventSourcePolyfill('/api/sse', {
              headers: {
                'Authorization': token
              }
            });

            eventSource.onopen = () => {
              console.log('✅ SSE 连接已打开');
            };

            // 监听不同类型的事件
            ['未读消息', '订单更新', '系统通知'].forEach((type) => {
              eventSource.addEventListener(type, (event) => {
                const el = document.getElementById(type);
                el.textContent = event.data;
                
                // 添加闪烁动画
                el.classList.remove('flash');
                void el.offsetWidth; // 触发重排
                el.classList.add('flash');
              });
            });

            eventSource.onerror = (error) => {
              console.error('❌ SSE 连接错误:', error);
            };
          }

          function disconnectSSE() {
            if (eventSource) {
              eventSource.close();
              eventSource = null;
              console.log('❌ 手动断开连接');
              
              // 重置显示
              ['未读消息', '订单更新', '系统通知'].forEach((type) => {
                document.getElementById(type).textContent = '等待消息...';
              });
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

const PORT = 3004;
server.listen(PORT, () => {
  console.log(`🚀 SSE 集成方案服务器运行在 http://localhost:${PORT}`);
});
