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
    ├── theme.js        # 主题管理（初始化、切换、图标同步）
    ├── ui.js           # UI 渲染（消息气泡、Markdown、代码块、Toast）
    ├── api.js          # API 通信（流式 SSE、错误处理、图片上传）
    └── index.js        # 核心调度（常量、DOM、状态、事件、消息发送）
```

> 加载顺序：`theme.js` → `ui.js` → `api.js` → `index.js`，所有模块共享同一全局作用域。

---

## 已完成功能清单

### 首页

- 四色宽域静态渐变标题「嗨，我是灵犀」（粉→紫→蓝→绿）
- 4 张快捷建议卡片，2×4 网格排列，点击直接发送问题
- 底部胶囊形输入框，内置回形针图标、图片预览圆圈、发送/停止按钮
- 右侧外置：主题切换、清除对话、更换 API Key 三个圆形按钮
- 页脚免责声明「内容由 AI 大模型生成，请仔细甄别」

### 对话页

- 顶部导航栏：左侧「← 返回主页」+ 右侧 Logo
- AI 消息靠左，用户消息靠右，与输入框边缘对齐
- AI 头像回答时旋转 + 光晕动画；图片加载失败时显示「灵」字占位
- 「思考中...」三点呼吸动画占位气泡
- 流式输出打字机效果，Markdown 实时渲染（80ms 节流）
- 代码块：语法高亮（highlight.js）+ 语言标识 + 一键复制
- 用户消息图片气泡：shimmer 加载 → 淡入，点击灯箱全屏预览
- 分类错误气泡（网络失败 / API Key 无效 / 频率限制 / 服务器错误）
- API Key 无效时自动清除旧 Key 并弹窗引导重新输入

### 输入区

- 多行文本自动扩展（最大 120px），超出显示内部滚动条
- Enter 发送，Shift+Enter 换行
- 最多同时上传 5 张图片，单张限 4MB，超限跳过并提示
- 自定义 Tooltip（毛玻璃背景）覆盖所有可交互按钮

### 安全与体验

- XSS 防护：`marked` 配置 `html: false` + `sanitizeHTML()` 递归清理危险标签和属性
- AI 输出时用户可自由上滑查看历史，回底部附近自动恢复跟随
- 返回主页不清除对话历史，继续上下文
- 主题切换状态 localStorage 持久化
- 图片灯箱：全屏遮罩 + `backdrop-filter: blur` + 点击关闭

### 多模态 AI

- 纯文字使用 `qwen-plus`，上传图片自动切换 `qwen-vl-plus`
- 支持图片 + 文字混合发送，多轮对话保持上下文

---

## 核心技术实现

### 1. API Key 管理

API Key 不写入源码，仅存于浏览器 localStorage：

- **首次使用**：发送消息时检测无 Key，弹出 `prompt` 引导输入
- **主动更换**：点击输入框右侧钥匙图标按钮，随时更换
- **Key 无效**：收到 401 响应时，自动清除旧 Key 并弹窗重新引导输入

```javascript
// HTTP 状态码优先判断，避免错误消息字符串匹配失效
const err = new Error(errMsg);
err.status = response.status;
throw err;

// 错误处理
if (error.status === 401) {
    localStorage.removeItem(API_KEY_STORAGE);
    // 弹窗引导重新输入...
}
```

### 2. 流式响应 + 节流渲染

```javascript
// 80ms 内多个 delta 合并为一次 DOM 更新
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
renderMarkdown(bubble, fullContent);
```

### 3. 多模态消息构建

| 场景 | 模型 | 理由 |
|------|------|------|
| 纯文字 | `qwen-plus` | 速度快、成本低 |
| 图文混合 | `qwen-vl-plus` | 支持视觉语言理解 |

```javascript
const userContent = hasImages
    ? [...imageItems, { type: 'text', text: message }]
    : [{ type: 'text', text: message }];
```

### 4. XSS 防护

```javascript
// marked 禁止 HTML 直通
marked.setOptions({ html: false });

// sanitizeHTML 递归清理危险标签和属性
const DANGEROUS_TAGS = new Set(['script','iframe','object','embed',...]);
function sanitizeHTML(html) {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    // 递归遍历，移除危险标签和 on* 属性
    return doc.body.innerHTML;
}
```

### 5. 图片上传防护

```javascript
const MAX_IMAGES   = 5;              // 最多 5 张
const MAX_IMG_SIZE = 4 * 1024 * 1024; // 单张 4MB 上限

if (file.size > MAX_IMG_SIZE) {
    showToast(`「${file.name}」超过 4MB 限制，已跳过`, 'warning');
    return;
}
```

### 6. 智能滚动控制

```javascript
let userScrolledUp = false;
chatSection.addEventListener('scroll', () => {
    const dist = chatSection.scrollHeight - chatSection.scrollTop - chatSection.clientHeight;
    userScrolledUp = dist > 60; // 距底 60px 以内视为「在底部」
});
function scrollToBottom() {
    if (userScrolledUp) return; // 用户上滑时停止自动跟随
    requestAnimationFrame(() => { chatSection.scrollTop = chatSection.scrollHeight; });
}
```

---

## 使用说明

### 启动项目

使用 VS Code Live Server 插件打开 `index.html` 即可，无需任何构建步骤。

### 配置 API Key

首次发送消息时会自动弹出输入框，填入阿里云百炼 API Key 即可。Key 仅保存在本地浏览器，不会上传到任何服务器。

需要更换 Key 时，点击输入框右侧的钥匙图标按钮。

> 获取地址：[阿里云百炼控制台](https://bailian.console.aliyun.com)，新用户通常有免费额度。

---

## 注意事项

1. 首次加载需联网拉取 CDN 资源（Tailwind CSS、marked.js、highlight.js）
2. 建议使用 Chrome / Edge 等现代浏览器
3. 图片上传后以 base64 格式存于内存，刷新页面后清空
4. API Key 存于 localStorage，请勿在公共设备上长期保存

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
