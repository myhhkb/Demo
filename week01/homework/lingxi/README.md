# 灵犀 AI 对话助手

## 项目基本信息

- **姓名**：杨畅
- **学校**：中南民族大学
- **学号**：2024120443
- **开发时间**：2026 年 3 月
- **项目类型**：全栈训练营 Week01 作业

---

## 项目简介

这是一个仿 WPS 灵犀风格的 AI 对话助手，接入阿里云百炼大模型 API，实现真实的流式 AI 对话功能。项目采用原生 HTML + CSS + JavaScript 开发，无需任何构建工具，具备深色/浅色主题切换、流式响应、Markdown 渲染、代码高亮、图片上传识别等完整特性。

---

## 项目结构

```
lingxi/
├── index.html          # 主页面
├── README.md           # 项目文档
├── assets/
│   ├── linxi.png       # AI 头像
│   └── logo.png        # 灵犀 Logo
├── css/
│   └── index.css       # 全局样式
└── js/
    ├── constants.js    # 全局常量（最先加载）
    ├── theme.js        # 主题管理
    ├── ui.js           # UI 渲染
    ├── api.js          # API 通信
    └── index.js        # 核心调度
```

---

## 核心技术实现

### 1. 流式输出 + 打字机效果

AI 回复采用 Server-Sent Events（SSE）流式接收，每收到一个文字片段（delta）立即追加显示，实现逐字输出的打字机效果。

```javascript
const response = await fetch(ALIYUN_API_URL, {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${getApiKey()}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({ model, messages, stream: true })
});

const reader  = response.body.getReader();
const decoder = new TextDecoder();
let   buffer  = '';

while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop(); // 保留最后不完整的行，等待下一个 chunk 拼接

    for (const line of lines) {
        if (!line.trim() || line.trim() === 'data: [DONE]') continue;
        if (line.startsWith('data:')) {
            const data  = JSON.parse(line.slice(5).trim());
            const delta = data.choices?.[0]?.delta?.content;
            if (delta) {
                fullContent += delta;
                scheduleRender(); // 节流渲染，避免每个 delta 都重建 DOM
            }
        }
    }
}
```

为减少 DOM 重建开销，引入 **80ms 节流渲染**，多个 delta 合并为一次 Markdown 解析，流式结束后强制完整渲染：

```javascript
function scheduleRender() {
    if (renderTimer) return;
    renderTimer = setTimeout(() => {
        renderTimer = null;
        renderMarkdown(bubble, fullContent);
        scrollToBottom();
    }, 80);
}

// 流式结束：清除计时器，强制完整渲染
if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
if (fullContent)  { renderMarkdown(bubble, fullContent); }
```

---

### 2. Markdown 渲染

使用 **marked.js** 实时解析 AI 回复的 Markdown 文本，配合 **highlight.js** 实现代码语法高亮，并对渲染结果进行 XSS 过滤。

```javascript
// 配置 marked：禁用原始 HTML 直通（XSS 防护）
marked.setOptions({ breaks: true, gfm: true, html: false });

function renderMarkdown(bubble, fullContent) {
    bubble.innerHTML = sanitizeHTML(marked.parse(fullContent));

    // 超长表格外层包裹横向滚动容器
    bubble.querySelectorAll('table:not(.wrapped)').forEach(table => {
        table.classList.add('wrapped');
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });

    // 代码块：语言标识 + 一键复制 + 语法高亮
    bubble.querySelectorAll('pre code:not(.hljs):not(.highlight-pending)').forEach(codeBlock => {
        codeBlock.classList.add('highlight-pending');
        addCodeBlockHeader(codeBlock);
    });
}

function addCodeBlockHeader(codeBlock) {
    const lang = (codeBlock.className.match(/language-(\w+)/) || [])[1] || 'code';
    const header = document.createElement('div');
    header.className = 'code-block-header';
    header.innerHTML = `<span>${lang}</span><button class="copy-code-btn">复制</button>`;
    header.querySelector('.copy-code-btn').addEventListener('click', (e) => {
        navigator.clipboard.writeText(codeBlock.textContent).then(() => {
            e.target.textContent = '已复制';
            setTimeout(() => { e.target.textContent = '复制'; }, 2000);
        });
    });
    hljs.highlightElement(codeBlock);
    codeBlock.parentElement.parentElement.insertBefore(header, codeBlock.parentElement);
}
```

Markdown 渲染样式覆盖标题（H1 渐变色、H2 分割线）、段落、有序/无序列表、代码块、引用块、表格、链接等全部元素，深色/浅色模式各有独立配色。

---

### 3. 主题切换

以 `html.dark` 类为核心驱动，CSS 变量统一响应配色变化，JavaScript 只负责类名切换和状态持久化。

```css
/* 深色模式（默认） */
:root {
    --bg-base: #0f1423;
    --bg-card: #1e293b;
    --text-primary: #f1f5f9;
}
/* 浅色模式 */
html:not(.dark) {
    --bg-base: #f8fafc;
    --bg-card: #ffffff;
    --text-primary: #1a1a1a;
}
```

```javascript
function initTheme() {
    const saved      = localStorage.getItem(THEME_STORAGE);
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark     = saved ? saved === 'dark' : preferDark; // 优先读 localStorage
    document.documentElement.classList.toggle('dark', isDark);
    applyThemeStyles(isDark);
    syncThemeIcons();
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_STORAGE, isDark ? 'dark' : 'light'); // 持久化
    applyThemeStyles(isDark);
    syncThemeIcons();
}

function syncThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    // 深色显示太阳（点击切浅色），浅色显示月亮（点击切深色）
    themeBtn.querySelector('.sun-icon').classList.toggle('hidden', !isDark);
    themeBtn.querySelector('.moon-icon').classList.toggle('hidden', isDark);
}
```

---

### 4. 图片上传与多模态识别

用户可上传图片，通过 **FileReader** 转为 base64 格式后与文字消息一同发送给视觉语言模型分析。

```javascript
const MAX_IMAGES   = 5;               // 最多同时上传 5 张
const MAX_IMG_SIZE = 4 * 1024 * 1024; // 单张限 4MB

function handleImageUpload(e) {
    files.forEach(file => {
        if (file.size > MAX_IMG_SIZE) {
            showToast(`「${file.name}」超过 4MB 限制，已跳过`, 'warning');
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedImages.push({
                id:   `img_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
                name: file.name,
                data: ev.target.result // base64 data URL
            });
            renderImagePreview();
        };
        reader.readAsDataURL(file);
    });
}
```

发送时根据是否携带图片自动切换模型，并构建符合 OpenAI Vision 规范的消息格式：

```javascript
// 有图片用视觉模型，否则用文字模型
const model = hasImages ? MODEL_VISION : MODEL_TEXT;
// MODEL_TEXT = 'qwen-plus'，MODEL_VISION = 'qwen-vl-plus'

const userContent = hasImages
    ? [
        ...uploadedImages.map(img => ({
            type: 'image_url',
            image_url: { url: img.data } // base64 data URL
        })),
        { type: 'text', text: message || '请描述这张图片的内容。' }
      ]
    : [{ type: 'text', text: message }];
```

图片在输入框内实时预览，发送后展示在对话气泡中，支持点击全屏灯箱查看。多轮对话中图片上下文随 `conversationHistory` 保持，AI 可在后续对话中继续引用。

---

## 使用说明

### 启动项目

使用 VS Code / Cursor 的 **Live Server** 插件打开 `index.html`，必须通过 `http://` 协议访问（直接双击用 `file://` 打开会因 CORS 限制导致 API 请求失败）。

### 配置 API Key

首次发送消息时自动弹出输入框，填入阿里云百炼 API Key 即可，Key 仅保存在本地浏览器 localStorage，不会上传到任何服务器。需要更换时点击输入框右侧的钥匙图标按钮。

> 获取地址：[阿里云百炼控制台](https://bailian.console.aliyun.com)，新用户通常有免费额度。

---

## 技术栈

| 分类 | 技术 |
|------|------|
| 结构 | HTML5 语义化标签 |
| 样式 | CSS3（变量、Flexbox、Grid、动画）+ Tailwind CSS CDN |
| 脚本 | 原生 JavaScript ES6+（Fetch、Async/Await、AbortController）|
| AI 接口 | 阿里云百炼 OpenAI 兼容接口（qwen-plus / qwen-vl-plus）|
| Markdown | marked.js |
| 代码高亮 | highlight.js（atom-one-dark 主题）|
| 字体 | Noto Sans SC（Google Fonts）|

---

*最后更新：2026-03-19*
