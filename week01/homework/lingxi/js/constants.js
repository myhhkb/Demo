// ==================== 全局常量 ====================
// 这个文件会最先加载。
// 这里集中放“全局都会用到的固定值”，方便统一管理和后续修改。

// API_KEY_STORAGE：浏览器本地存储里保存 API Key 的键名。
// localStorage 可以理解为“浏览器自带的小仓库”，刷新页面后数据还在。
const API_KEY_STORAGE = 'LINGXI_API_KEY';

// THEME_STORAGE：保存主题模式（深色 / 浅色）的键名。
const THEME_STORAGE   = 'LINGXI_THEME';

// ALIYUN_API_URL：阿里云百炼兼容 OpenAI 风格接口的地址。
// 前端发送对话请求时，会把消息发到这里。
const ALIYUN_API_URL  = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// MODEL_TEXT：纯文字对话模型。
// 当用户没有上传图片时，就使用这个模型。
const MODEL_TEXT      = 'qwen-plus';

// MODEL_VISION：图文多模态模型。
// 当用户上传了图片时，就切换为这个模型，让 AI 同时理解图片和文字。
const MODEL_VISION    = 'qwen-vl-plus';
