// ==================== 配置和常量 ====================
const API_KEY_STORAGE = 'LINGXI_API_KEY';
const THEME_STORAGE   = 'LINGXI_THEME';
const ALIYUN_API_URL  = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// ==================== DOM 元素 ====================
const welcomeSection  = document.getElementById('welcomeSection');
const chatSection     = document.getElementById('chatSection');
const chatHeader      = document.getElementById('chatHeader');
const chatMessages    = document.getElementById('chatMessages');
const messageInput    = document.getElementById('messageInput');
const sendBtn         = document.getElementById('sendBtn');
const stopBtn         = document.getElementById('stopBtn');
const clearBtn        = document.getElementById('clearBtn');
const backBtn         = document.getElementById('backBtn');
const imageUpload     = document.getElementById('imageUpload');
const imagePreview    = document.getElementById('imagePreview');
const themeBtn        = document.getElementById('themeBtn');
const suggestionCards = document.querySelectorAll('.suggestion-card');

// ==================== 状态管理 ====================
let conversationHistory    = [];
let isGenerating           = false;
let currentAbortController = null;
let uploadedImages         = [];
let userScrolledUp         = false;

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
});

// ==================== 事件监听 ====================
function setupEventListeners() {
    themeBtn.addEventListener('click', toggleTheme);
    sendBtn.addEventListener('click', sendMessage);
    stopBtn.addEventListener('click', stopGeneration);
    clearBtn.addEventListener('click', clearConversation);
    backBtn.addEventListener('click', goHome);
    imageUpload.addEventListener('change', handleImageUpload);

    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendBtnVisibility();
    });

    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            messageInput.value = card.dataset.prompt;
            updateSendBtnVisibility();
            autoResizeTextarea();
            sendMessage();
        });
    });

    // 滚动监听（智能跟随）
    chatSection.addEventListener('scroll', () => {
        const distFromBottom = chatSection.scrollHeight - chatSection.scrollTop - chatSection.clientHeight;
        userScrolledUp = distFromBottom > 60;
    });
}

// ==================== 页面状态切换 ====================
function enterChat() {
    welcomeSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    chatSection.classList.add('flex');
    chatHeader.classList.remove('hidden');
    chatHeader.classList.add('flex');
}

function goHome() {
    chatSection.classList.add('hidden');
    chatSection.classList.remove('flex');
    chatHeader.classList.add('hidden');
    chatHeader.classList.remove('flex');
    welcomeSection.classList.remove('hidden');
    welcomeSection.classList.add('animate-fadeIn');
    welcomeSection.style.animation = 'none';
    requestAnimationFrame(() => { welcomeSection.style.animation = ''; });
}

// ==================== 消息发送 ====================
function sendMessage() {
    const message   = messageInput.value.trim();
    const hasImages = uploadedImages.length > 0;
    if (!message && !hasImages) return;
    if (isGenerating) return;

    if (!getApiKey()) {
        const key = prompt(
            '未检测到 API Key，请输入阿里云百炼 API Key\n' +
            '（获取地址：https://bailian.console.aliyun.com）\n\n' +
            '输入后将仅保存在本地浏览器，不会上传到任何服务器。'
        );
        if (key && key.trim()) {
            localStorage.setItem(API_KEY_STORAGE, key.trim());
            showToast('API Key 设置成功', 'success');
        } else {
            showToast('未设置 API Key，请刷新页面或重新发送消息以重新输入', 'warning');
            return;
        }
    }

    if (!welcomeSection.classList.contains('hidden')) enterChat();

    // 构建用户消息内容（统一数组格式，符合 VL 模型规范）
    const userContent = hasImages
        ? [
            ...uploadedImages.map(img => ({ type: 'image_url', image_url: { url: img.data } })),
            { type: 'text', text: message || '请描述这张图片的内容。' }
          ]
        : [{ type: 'text', text: message }];

    addMessage('user', message || '（图片）', uploadedImages.slice());

    messageInput.value     = '';
    uploadedImages         = [];
    imagePreview.innerHTML = '';
    updateTextareaPadding();
    updateSendBtnVisibility();
    autoResizeTextarea();

    conversationHistory.push({ role: 'user', content: userContent });
    generateAIResponse(hasImages);
}

// ==================== 清除对话 ====================
function clearConversation() {
    if (!confirm('确定要清除所有对话吗？')) return;
    conversationHistory    = [];
    chatMessages.innerHTML = '';
    uploadedImages         = [];
    imagePreview.innerHTML = '';
    messageInput.value     = '';
    goHome();
    updateSendBtnVisibility();
}
