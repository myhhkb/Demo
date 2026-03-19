// ==================== 本地配置文件 ====================
// 此文件已在 .gitignore 中忽略，不会提交到 Git 仓库
// API Key 仅存储在浏览器 localStorage 中，不硬编码在源码里

// ==================== 模型配置 ====================
// 纯文字对话模型：响应速度快、成本低
const MODEL_TEXT   = 'qwen-plus';
// 图文多模态模型：支持视觉语言理解
const MODEL_VISION = 'qwen-vl-plus';

// ==================== API Key 初始化 ====================
// 由 index.js 的 DOMContentLoaded 统一调用，不在此处重复监听
function initializeLocalConfig() {
    const stored = localStorage.getItem('LINGXI_API_KEY');
    if (stored) {
        console.log('✅ 使用已保存的 API Key');
        return;
    }
    // 没有存储的 Key 时，提示用户手动输入
    const key = prompt(
        '请输入阿里云百炼 API Key\n' +
        '（获取地址：https://bailian.console.aliyun.com）\n\n' +
        '输入后将仅保存在本地浏览器，不会上传到任何服务器。'
    );
    if (key && key.trim()) {
        localStorage.setItem('LINGXI_API_KEY', key.trim());
        console.log('✅ API Key 已保存到 localStorage');
    } else {
        console.warn('⚠️ 未设置 API Key，发送消息时将提示错误');
    }
}
