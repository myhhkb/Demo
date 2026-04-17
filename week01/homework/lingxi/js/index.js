// ==================== DOM 元素 ====================
// 这里集中获取页面里需要频繁操作的元素，方便后面统一使用。
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
const apiKeyBtn       = document.getElementById('apiKeyBtn');
const suggestionCards = document.querySelectorAll('.suggestion-card');

// ==================== 状态管理 ====================
// 下面这些变量用来记录页面运行时的状态。

// conversationHistory：保存完整的多轮对话内容，发给 AI 时要带上它。
let conversationHistory = [];

// isGenerating：表示 AI 是否正在生成回复。
let isGenerating = false;

// currentAbortController：当前请求对应的中断控制器。
let currentAbortController = null;

// uploadedImages：当前输入区里已上传但还没发送的图片。
let uploadedImages = [];

// userScrolledUp：记录用户是否手动往上滚动查看历史消息。
let userScrolledUp = false;

// ==================== 初始化 ====================
// 等页面 DOM 加载完后，再初始化主题和事件监听。
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
});

// ==================== 事件监听 ====================
// setupEventListeners 统一绑定各种交互事件。
function setupEventListeners() {
    themeBtn.addEventListener('click', toggleTheme);
    apiKeyBtn.addEventListener('click', changeApiKey);
    sendBtn.addEventListener('click', sendMessage);
    stopBtn.addEventListener('click', stopGeneration);
    clearBtn.addEventListener('click', clearConversation);
    backBtn.addEventListener('click', goHome);
    imageUpload.addEventListener('change', handleImageUpload);

    // 输入框按下回车时发送消息；
    // 但如果按的是 Shift + Enter，就允许换行。
    messageInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // 输入框内容变化时：
    // - 自动调整高度
    // - 判断是否要显示发送按钮
    messageInput.addEventListener('input', () => {
        autoResizeTextarea();
        updateSendBtnVisibility();
    });

    // 点击建议卡片时，把卡片上的 prompt 填入输入框并直接发送。
    suggestionCards.forEach(card => {
        card.addEventListener('click', () => {
            messageInput.value = card.dataset.prompt;
            updateSendBtnVisibility();
            autoResizeTextarea();
            sendMessage();
        });
    });

    // 滚动监听：
    // 如果用户离底部比较远，就认为他正在看历史消息，此时暂停自动滚到底部。
    chatSection.addEventListener('scroll', () => {
        const distFromBottom = chatSection.scrollHeight - chatSection.scrollTop - chatSection.clientHeight;
        userScrolledUp = distFromBottom > 60;
    });
}

// ==================== 页面状态切换 ====================
// enterChat 用来从欢迎页切换到聊天页。
function enterChat() {
    welcomeSection.classList.add('hidden');
    chatSection.classList.remove('hidden');
    chatSection.classList.add('flex');
    chatHeader.classList.remove('hidden');
    chatHeader.classList.add('flex');
}

// goHome 用来回到首页欢迎页。
function goHome() {
    chatSection.classList.add('hidden');
    chatSection.classList.remove('flex');
    chatHeader.classList.add('hidden');
    chatHeader.classList.remove('flex');
    welcomeSection.classList.remove('hidden');
    welcomeSection.classList.add('animate-fadeIn');

    // 这里通过先清空再恢复 animation，强制重新触发淡入动画。
    welcomeSection.style.animation = 'none';
    requestAnimationFrame(() => {
        welcomeSection.style.animation = '';
    });
}

// ==================== 消息发送 ====================
// sendMessage 是“发送一条用户消息”的核心函数。
function sendMessage() {
    const message = messageInput.value.trim();
    const hasImages = uploadedImages.length > 0;

    // 文字和图片都没有时，不发送。
    if (!message && !hasImages) return;

    // 如果 AI 还在生成，就不要重复发送。
    if (isGenerating) return;

    // 如果还没有 API Key，就先弹窗让用户输入。
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

    // 如果当前还在欢迎页，就先切到聊天页。
    if (!welcomeSection.classList.contains('hidden')) enterChat();

    // 构建图片数组，让后端接口能识别多模态消息格式。
    const imageItems = uploadedImages.map(img => {
        // FileReader.readAsDataURL 生成的通常已经是标准 data:image/... 格式。
        const url = img.data.startsWith('data:image') ? img.data : `data:image/jpeg;base64,${img.data}`;
        return { type: 'image_url', image_url: { url } };
    });

    // 如果有图片，就把图片和文字一起组合成数组；
    // 如果没有图片，就只发纯文本。
    const userContent = hasImages
        ? [
            ...imageItems,
            { type: 'text', text: message || '请描述这张图片的内容。' }
          ]
        : [{ type: 'text', text: message }];

    // 先把用户消息立刻显示到页面上。
    addMessage('user', message || '（图片）', uploadedImages.slice());

    // 发送完成后，把输入区清空，准备下一次输入。
    messageInput.value = '';
    uploadedImages = [];
    imagePreview.innerHTML = '';
    updateTextareaPadding();
    updateSendBtnVisibility();
    autoResizeTextarea();

    // 把本条用户消息保存到对话历史。
    conversationHistory.push({ role: 'user', content: userContent });

    // 调用 AI 接口开始生成回复。
    generateAIResponse(hasImages);
}

// ==================== 清除对话 ====================
// clearConversation 用来清空当前聊天记录。
function clearConversation() {
    if (!confirm('确定要清除所有对话吗？')) return;

    conversationHistory = [];
    chatMessages.innerHTML = '';
    uploadedImages = [];
    imagePreview.innerHTML = '';
    messageInput.value = '';

    goHome();
    updateSendBtnVisibility();
}

// ==================== 更换 API Key ====================
// changeApiKey 用来手动修改本地保存的 API Key。
function changeApiKey() {
    const current = getApiKey();
    const newKey = prompt(
        (current ? '当前已设置 API Key，如需更换请输入新的 Key：' : '请输入阿里云百炼 API Key：') + '\n' +
        '（获取地址：https://bailian.console.aliyun.com）'
    );

    // 用户点取消时，prompt 会返回 null。
    if (newKey === null) return;

    if (newKey.trim()) {
        localStorage.setItem(API_KEY_STORAGE, newKey.trim());
        showToast('API Key 已更新', 'success');
    } else {
        showToast('输入为空，API Key 未修改', 'warning');
    }
}
