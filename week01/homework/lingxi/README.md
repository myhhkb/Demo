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
    ├── config.js       # 模型常量 + API Key 初始化
    ├── theme.js        # 主题管理模块
    ├── ui.js           # UI 渲染模块
    ├── api.js          # API 通信模块
    └── index.js        # 核心调度层
```

---

## 已完成功能清单

### 首页

- 四色宽域静态渐变标题「嗨，我是灵犀」（粉→紫→蓝→绿）
- 4 张快捷建议卡片，2×4 网格排列，点击直接发送问题
- 底部胶囊形输入框，内置回形针、图片预览圆圈、发送/停止按钮
- 右侧外置主题切换按钮 + 清除对话按钮
- 页脚免责声明

### 对话页

- 顶部导航栏：左侧返回按钮 + 右侧 Logo
- AI 消息靠左，用户消息靠右，与输入框对齐
- AI 头像回答时旋转 + 光晕动画，「思考中...」占位气泡
- 流式输出打字机效果，Markdown 实时渲染（节流 80ms）
- 代码块：语法高亮 + 语言标识 + 一键复制
- 用户消息图片气泡：shimmer 加载 → 淡入，点击灯箱全屏预览
- 分类错误提示（网络/API Key/频率/服务器）

### 输入区

- 多行文本自动扩展（最大 120px）
- Enter 发送，Shift+Enter 换行
- 最多同时上传 5 张图片
- 自定义 Tooltip（毛玻璃背景）覆盖所有可交互按钮

### 安全与体验

- XSS 防护：`sanitizeHTML()` 递归清理危险标签和属性
- marked 配置 `html: false` 禁止 HTML 直通
- AI 输出时用户可自由上滑查看历史，回底部自动恢复跟随
- 返回主页不清除对话历史，继续上下文
- 主题切换状态 localStorage 持久化

### 多模态 AI

- 纯文字使用 `qwen-plus`，上传图片自动切换 `qwen-vl-plus`
- 支持图片 + 文字混合发送，多轮对话保持上下文

---

## 核心技术实现

### 1. 模块化架构

代码按职责拆分为 5 个模块，加载顺序：`config.js` → `theme.js` → `ui.js` → `api.js` → `index.js`

| 模块 | 职责 |
|------|------|
| `config.js` | 模型常量、API Key 初始化（prompt 弹窗存入 localStorage）|
| `theme.js` | 主题初始化、切换、图标同步（纯 CSS 变量驱动）|
| `ui.js` | 消息气泡、Markdown 渲染、代码块、灯箱、Toast、图片预览 |
| `api.js` | XSS 防护、流式 SSE 响应、错误处理、图片上传 |
| `index.js` | DOM 引用、状态、事件监听、页面切换、消息发送 |

### 2. 主题系统（CSS 变量驱动）

```css
:root {
    --bg-base: #0f1423;
    --bg-card: #1e293b;
    --text-primary: #f1f5f9;
}
html:not(.dark) {
    --bg-base: #f8fafc;
    --bg-card: #ffffff;
    --text-primary: #1a1a1a;
}
```

`theme.js` 只切换 `html.dark` 类，所有样式由 CSS 变量自动响应，消除 JS inline style 双轨驱动。

### 3. 流式响应 + 节流渲染

```javascript
// 节流：80ms 内多个 delta 合并为一次渲染
function scheduleRender() {
    if (renderTimer) return;
    renderTimer = setTimeout(() => {
        renderTimer = null;
        renderMarkdown(bubble, fullContent);
        scrollToBottom();
    }, 80);
}
// 流式结束后强制完整渲染
if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
if (fullContent) { renderMarkdown(bubble, fullContent); }
```

### 4. 多模态消息构建

| 场景 | 模型 | 理由 |
|------|------|------|
| 纯文字 | `qwen-plus` | 速度快、成本低 |
| 图文混合 | `qwen-vl-plus` | 支持视觉语言理解 |

```javascript
const userContent = hasImages
    ? [...imageItems, { type: 'text', text: message }]
    : [{ type: 'text', text: message }];
```

### 5. API Key 安全

API Key 不写入源码，仅存于浏览器 localStorage。首次访问通过 `prompt()` 引导输入，`config.js` 已从 `.gitignore` 中移除（文件中无任何敏感信息）。

### 6. XSS 防护

```javascript
const DANGEROUS_TAGS = new Set(['script','iframe','object','embed',...]);
const DANGEROUS_ATTRS = /^(on\w+|javascript:|data:text\/html)/i;

function sanitizeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // 递归清理危险标签和属性
    return doc.body.innerHTML;
}
```

---

## 使用说明

### 配置 API Key

首次打开页面会弹出输入框，填入阿里云百炼 API Key 即可。Key 仅保存在本地浏览器，不会上传到任何服务器。

> 获取地址：[阿里云百炼控制台](https://bailian.console.aliyun.com)，新用户通常有免费额度。

### 启动项目

使用 VS Code Live Server 插件打开 `index.html` 即可，无需任何构建步骤。

---

## 注意事项

1. 首次加载需联网拉取 CDN 资源（Tailwind、marked、highlight.js）
2. 建议使用 Chrome / Edge 等现代浏览器
3. 图片上传后以 base64 格式存于内存，刷新页面后清空
4. API Key 存于 localStorage，请勿在公共设备使用

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

*最后更新：2026-03-18*
