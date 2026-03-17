// ==================== 配置和常量 ====================
const API_KEY_STORAGE = 'LINGXI_API_KEY';
const THEME_STORAGE = 'LINGXI_THEME';
const ALIYUN_API_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

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
const themeBtn        = document.getElementById('themeBtn');   // 欢迎页主题按钮
const suggestionCards = document.querySelectorAll('.suggestion-card');

// ==================== 状态管理 ====================
let conversationHistory    = [];
let isGenerating           = false;
let currentAbortController = null;
let uploadedImages         = [];

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    setupEventListeners();
});

// ==================== 主题管理 ====================
function initTheme() {
    const saved      = localStorage.getItem(THEME_STORAGE);
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark     = saved ? saved === 'dark' : preferDark;
    document.documentElement.classList.toggle('dark', isDark);
    applyThemeStyles(isDark);
    syncThemeIcons();
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_STORAGE, isDark ? 'dark' : 'light');
    applyThemeStyles(isDark);
    syncThemeIcons();
}

function applyThemeStyles(isDark) {
    const body      = document.body;
    const inputPill = document.querySelector('.theme-input-pill');
    const btns      = document.querySelectorAll('#themeBtn, #clearBtn');
    const inputArea = document.querySelector('.theme-input-area');
    const hdr       = document.getElementById('chatHeader');
    const msgInput  = document.getElementById('messageInput');
    const subtitle  = document.querySelector('.welcome-subtitle');
    const disclaimer = document.querySelector('.footer-disclaimer');
    const uploadLabel = document.querySelector('.upload-label');

    if (isDark) {
        body.style.background      = '#0f1423';
        body.style.color           = '#f1f5f9';
        if (inputArea) inputArea.style.background = '#0f1423';
        if (hdr)       hdr.style.background       = '#0f1423';
        if (msgInput)  msgInput.style.color        = '#f1f5f9';
        if (subtitle)  subtitle.style.color        = '#ffffff';
        if (disclaimer) disclaimer.style.color     = 'rgba(255,255,255,0.6)';
        if (uploadLabel) uploadLabel.style.color   = '#ffffff';
        document.querySelectorAll('.theme-card').forEach(el => {
            el.style.background = '#1e293b';
            const p = el.querySelector('p');
            if (p) p.style.color = '#ffffff';
        });
        btns.forEach(b => { b.style.background = '#1e293b'; b.style.color = '#ffffff'; });
        if (inputPill) inputPill.style.background = '#1e293b';
    } else {
        body.style.background      = '#f8fafc';
        body.style.color           = '#1a1a1a';
        if (inputArea) inputArea.style.background = '#f8fafc';
        if (hdr)       hdr.style.background       = '#f8fafc';
        if (msgInput)  msgInput.style.color        = '#1a1a1a';
        if (subtitle)  subtitle.style.color        = '#1a1a1a';
        if (disclaimer) disclaimer.style.color     = 'rgba(26,26,26,0.5)';
        if (uploadLabel) uploadLabel.style.color   = '#1a1a1a';
        document.querySelectorAll('.theme-card').forEach(el => {
            el.style.background = '#ffffff';
            const p = el.querySelector('p');
            if (p) p.style.color = '#1a1a1a';
        });
        btns.forEach(b => { b.style.background = '#e2e8f0'; b.style.color = '#1a1a1a'; });
        if (inputPill) inputPill.style.background = '#e2e8f0';
    }
}

function syncThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    themeBtn.querySelector('.sun-icon').classList.toggle('hidden', isDark);
    themeBtn.querySelector('.moon-icon').classList.toggle('hidden', !isDark);
}

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
    // 不清除历史，只是回到欢迎界面
    chatSection.classList.add('hidden');
    chatSection.classList.remove('flex');
    chatHeader.classList.add('hidden');
    chatHeader.classList.remove('flex');
    welcomeSection.classList.remove('hidden');
    welcomeSection.classList.add('animate-fadeIn');
    // 重置动画
    welcomeSection.style.animation = 'none';
    requestAnimationFrame(() => { welcomeSection.style.animation = ''; });
}

// ==================== API Key ====================
function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

// ==================== 消息发送 ====================
function sendMessage() {
    const message = messageInput.value.trim();
    const hasImages = uploadedImages.length > 0;
    if (!message && !hasImages) return;
    if (isGenerating) return;

    if (!getApiKey()) {
        alert('API Key 未设置，请检查 js/config.js 文件');
        return;
    }

    if (!welcomeSection.classList.contains('hidden')) enterChat();

    // 构建用户消息内容（支持多模态）
    let userContent;
    if (hasImages) {
        // 使用 content 数组格式（视觉模型格式）
        userContent = [];
        // 先放图片
        uploadedImages.forEach(img => {
            userContent.push({
                type: 'image_url',
                image_url: { url: img.data }
            });
        });
        // 再放文字
        if (message) {
            userContent.push({ type: 'text', text: message });
        } else {
            userContent.push({ type: 'text', text: '请描述这张图片的内容。' });
        }
    } else {
        userContent = message;
    }

    // 显示用户消息气泡（文字 + 图片缩略图）
    addMessage('user', message || '（图片）', uploadedImages.slice());

    messageInput.value = '';
    uploadedImages     = [];
    imagePreview.innerHTML = '';
    updateTextareaPadding();
    updateSendBtnVisibility();
    autoResizeTextarea();

    conversationHistory.push({ role: 'user', content: userContent });
    generateAIResponse(hasImages);
}

function addMessage(role, content, images) {
    const wrap = document.createElement('div');
    wrap.className = `flex gap-3 message-slide ${role === 'user' ? 'justify-end' : 'justify-start'}`;

    if (role === 'ai') {
        const avatar = document.createElement('div');
        avatar.className = 'ai-avatar flex-shrink-0 mt-1';

        const avatarImg = document.createElement('img');
        avatarImg.src = './assets/linxi.png';
        avatarImg.alt = '灵犀';
        avatarImg.className = 'ai-avatar-img';
        avatar.appendChild(avatarImg);

        const bubble = document.createElement('div');
        bubble.className = 'ai-content max-w-[75%] bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 text-sm border border-slate-200 dark:border-slate-700';
        bubble.innerHTML = content;

        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        // 将头像元素挂到 wrap 上方便后续控制旋转
        wrap._avatar = avatar;
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'max-w-[75%] flex flex-col gap-2 items-end';

        // 文字气泡（先渲染）
        if (content && content !== '（图片）') {
            const textBubble = document.createElement('div');
            textBubble.className = 'user-text-bubble';
            textBubble.textContent = content;
            bubble.appendChild(textBubble);
        }

        // 图片（若有，展示在文字下方）
        if (images && images.length > 0) {
            images.forEach(img => {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'user-img-bubble';

                // 加载占位
                const placeholder = document.createElement('div');
                placeholder.className = 'user-img-placeholder';
                imgWrap.appendChild(placeholder);

                const imgEl = document.createElement('img');
                imgEl.alt   = img.name;
                imgEl.className = 'user-img';
                imgEl.style.opacity = '0';
                imgEl.onload = () => {
                    placeholder.style.display = 'none';
                    imgEl.style.opacity = '1';
                };
                imgEl.src = img.data;

                // 点击放大
                imgEl.addEventListener('click', () => openImageLightbox(img.data));

                imgWrap.appendChild(imgEl);
                bubble.appendChild(imgWrap);
            });
        }

        wrap.appendChild(bubble);
    }

    chatMessages.appendChild(wrap);
    scrollToBottom();
    return wrap;
}

// ==================== AI 响应生成 ====================
async function generateAIResponse(hasImages) {
    isGenerating = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    resetScrollState(); // 新消息开始，重置滚动状态

    const msgWrap = addMessage('ai', '');
    const bubble  = msgWrap.querySelector('.ai-content');
    const avatar  = msgWrap._avatar;
    if (avatar) avatar.classList.add('ai-avatar-spin');

    // 显示「思考中...」占位
    bubble.innerHTML = '<span class="thinking-dots">思考中<span class="dots">...</span></span>';

    let fullContent = '';
    let firstChunk  = true; // 标记是否收到第一块有效数据

    // 有图片时使用视觉模型
    const model = hasImages ? 'qwen-vl-plus' : 'qwen-plus';

    try {
        currentAbortController = new AbortController();

        const response = await fetch(ALIYUN_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model,
                messages: conversationHistory,
                stream: true
            }),
            signal: currentAbortController.signal
        });

        if (!response.ok) {
            const errText = await response.text();
            let errMsg = `HTTP ${response.status}`;
            try { errMsg = JSON.parse(errText).error?.message || errMsg; } catch (_) {}
            throw new Error(errMsg);
        }

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let   buffer  = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed || trimmed === 'data: [DONE]') continue;
                if (trimmed.startsWith('data:')) {
                    try {
                        const data  = JSON.parse(trimmed.slice(5).trim());
                        const delta = data.choices?.[0]?.delta?.content;
                        if (delta) {
                            // 收到第一块有效内容时清除「思考中...」
                            if (firstChunk) {
                                bubble.innerHTML = '';
                                firstChunk = false;
                            }
                            fullContent += delta;
                            bubble.innerHTML = marked.parse(fullContent);
                            bubble.querySelectorAll('pre code:not(.hljs)').forEach(addCodeBlockHeader);
                            scrollToBottom();
                        }
                    } catch (_) { /* 忽略不完整的 JSON 片段 */ }
                }
            }
        }

        conversationHistory.push({ role: 'assistant', content: fullContent });

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('生成响应出错:', error);
            bubble.innerHTML = `<p class="text-red-400">错误：${error.message}</p>`;
        } else {
            // 用户手动停止：若仍在「思考中」状态则清除
            if (firstChunk) bubble.innerHTML = '<p style="color:rgba(255,255,255,0.4)">已停止</p>';
        }
    } finally {
        isGenerating = false;
        if (avatar) avatar.classList.remove('ai-avatar-spin');
        updateSendBtnVisibility();
        stopBtn.style.display = 'none';
        currentAbortController = null;
    }
}

function stopGeneration() {
    currentAbortController?.abort();
}

// ==================== 图片灯箱（点击放大）====================
function openImageLightbox(src) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:9999;cursor:zoom-out;backdrop-filter:blur(4px)';

    const img = document.createElement('img');
    img.src = src;
    img.style.cssText = 'max-width:90vw;max-height:90vh;border-radius:12px;box-shadow:0 24px 64px rgba(0,0,0,0.6);object-fit:contain;transition:transform 0.2s ease';

    overlay.appendChild(img);
    overlay.addEventListener('click', () => overlay.remove());
    document.body.appendChild(overlay);
}

// ==================== 代码块高亮 + 复制 ====================
function addCodeBlockHeader(codeBlock) {
    const pre = codeBlock.parentElement;
    if (pre.previousElementSibling?.classList.contains('code-block-header')) return;

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

    try { hljs.highlightElement(codeBlock); } catch (_) {}
    pre.parentElement.insertBefore(header, pre);
}

// ==================== 图片上传 ====================
function handleImageUpload(e) {
    Array.from(e.target.files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedImages.push({ name: file.name, data: ev.target.result });
            renderImagePreview();
        };
        reader.readAsDataURL(file);
    });
    imageUpload.value = '';
}

function renderImagePreview() {
    imagePreview.innerHTML = '';
    uploadedImages.forEach((img, idx) => {
        const thumb = document.createElement('div');
        thumb.className = 'img-thumb';
        thumb.innerHTML = `
            <img src="${img.data}" alt="${img.name}">
            <button class="img-remove" title="删除">×</button>
        `;
        thumb.querySelector('.img-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            uploadedImages.splice(idx, 1);
            renderImagePreview();
        });
        imagePreview.appendChild(thumb);
    });
    updateTextareaPadding();
}

// 根据控制组实际宽度动态更新 textarea 右侧 padding，防止文字被遮挡
function updateTextareaPadding() {
    requestAnimationFrame(() => {
        const controlGroup = document.querySelector('.theme-input-pill .absolute');
        if (!controlGroup) return;
        const groupWidth = controlGroup.offsetWidth;
        // 右侧 padding = 控制组宽度 + 右边距(12) + 额外间距(8)
        messageInput.style.paddingRight = (groupWidth + 20) + 'px';
    });
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

// ==================== UI 辅助 ====================
function updateSendBtnVisibility() {
    const has = messageInput.value.trim().length > 0;
    sendBtn.style.display = (has && !isGenerating) ? 'flex' : 'none';
}

function autoResizeTextarea() {
    // 基准高度 = padding-top(12) + 单行内容(21) + padding-bottom(12) = 45px
    const BASE_HEIGHT = 45;
    messageInput.style.height = BASE_HEIGHT + 'px';
    const newHeight = Math.min(Math.max(messageInput.scrollHeight, BASE_HEIGHT), BASE_HEIGHT + 120);
    messageInput.style.height = newHeight + 'px';
    messageInput.style.overflowY = newHeight >= BASE_HEIGHT + 120 ? 'auto' : 'hidden';
}

// 用户是否钉在底部（距底部 60px 以内视为「在底部」）
let userScrolledUp = false;

chatSection.addEventListener('scroll', () => {
    const distFromBottom = chatSection.scrollHeight - chatSection.scrollTop - chatSection.clientHeight;
    userScrolledUp = distFromBottom > 60;
});

function scrollToBottom() {
    // 只有用户没有主动上滚时才自动跟随
    if (userScrolledUp) return;
    requestAnimationFrame(() => {
        chatSection.scrollTop = chatSection.scrollHeight;
    });
}

// 新消息开始生成时，重置滚动状态并滚到底部
function resetScrollState() {
    userScrolledUp = false;
    requestAnimationFrame(() => {
        chatSection.scrollTop = chatSection.scrollHeight;
    });
}
