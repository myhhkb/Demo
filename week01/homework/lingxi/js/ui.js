// ==================== UI 渲染模块 ====================

// ---------- 消息气泡 ----------
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
        avatarImg.onerror = () => {
            avatarImg.style.display = 'none';
            const fallback = document.createElement('div');
            fallback.className = 'ai-avatar-img ai-avatar-fallback';
            fallback.textContent = '灵';
            avatar.appendChild(fallback);
        };
        avatar.appendChild(avatarImg);

        const bubble = document.createElement('div');
        bubble.className = 'ai-content max-w-[80%] text-sm';
        bubble.innerHTML = content;

        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        wrap._avatar = avatar;
    } else {
        const bubble = document.createElement('div');
        bubble.className = 'max-w-[75%] flex flex-col gap-2 items-end';

        if (content && content !== '（图片）') {
            const textBubble = document.createElement('div');
            textBubble.className = 'user-text-bubble';
            textBubble.textContent = content;
            bubble.appendChild(textBubble);
        }

        if (images && images.length > 0) {
            images.forEach(img => {
                const imgWrap = document.createElement('div');
                imgWrap.className = 'user-img-bubble';

                const placeholder = document.createElement('div');
                placeholder.className = 'user-img-placeholder';
                imgWrap.appendChild(placeholder);

                const imgEl = document.createElement('img');
                imgEl.alt = img.name;
                imgEl.className = 'user-img';
                imgEl.style.opacity = '0';
                imgEl.onload = () => {
                    placeholder.style.display = 'none';
                    imgEl.style.opacity = '1';
                };
                imgEl.src = img.data;
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

// ---------- Markdown 渲染 + 代码块 ----------
function renderMarkdown(bubble, fullContent) {
    bubble.innerHTML = sanitizeHTML(marked.parse(fullContent));
    // 表格外层加可横向滚动的 wrapper
    bubble.querySelectorAll('table:not(.wrapped)').forEach(table => {
        table.classList.add('wrapped');
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        table.parentNode.insertBefore(wrapper, table);
        wrapper.appendChild(table);
    });
    // 只处理尚未高亮的代码块，避免流式阶段重复高亮
    bubble.querySelectorAll('pre code:not(.hljs):not(.highlight-pending)').forEach(codeBlock => {
        codeBlock.classList.add('highlight-pending');
        addCodeBlockHeader(codeBlock);
    });
}

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

// ---------- 图片灯箱 ----------
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

// ---------- Toast 通知 ----------
function showToast(message, type = 'info') {
    const colors = {
        error:   'background:rgba(239,68,68,0.15);border-color:rgba(239,68,68,0.35);color:#fca5a5',
        warning: 'background:rgba(251,146,60,0.15);border-color:rgba(251,146,60,0.35);color:#fdba74',
        success: 'background:rgba(34,197,94,0.15);border-color:rgba(34,197,94,0.35);color:#86efac',
        info:    'background:rgba(96,165,250,0.15);border-color:rgba(96,165,250,0.35);color:#93c5fd',
    };
    const icons = {
        error:   '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
        warning: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
        success: '<polyline points="20 6 9 17 4 12"/>',
        info:    '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    };
    const toast = document.createElement('div');
    toast.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%) translateY(16px);padding:10px 16px;border-radius:12px;border:1px solid;font-size:13px;display:flex;align-items:center;gap:8px;z-index:9999;opacity:0;transition:opacity 0.25s ease,transform 0.25s ease;white-space:nowrap;backdrop-filter:blur(8px);box-shadow:0 4px 16px rgba(0,0,0,0.3);${colors[type] || colors.info}`;
    toast.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">${icons[type] || icons.info}</svg><span>${message}</span>`;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
    });
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(8px)';
        setTimeout(() => toast.remove(), 300);
    }, 1000);
}

// ---------- 图片预览 ----------
function renderImagePreview() {
    imagePreview.innerHTML = '';
    uploadedImages.forEach((img) => {
        const thumb = document.createElement('div');
        thumb.className = 'img-thumb';
        thumb.dataset.id = img.id;
        thumb.innerHTML = `
            <img src="${img.data}" alt="${img.name}">
            <button class="img-remove" title="删除">×</button>
        `;
        thumb.querySelector('.img-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            const targetId = thumb.dataset.id;
            uploadedImages = uploadedImages.filter(i => i.id !== targetId);
            renderImagePreview();
            updateSendBtnVisibility();
        });
        imagePreview.appendChild(thumb);
    });
    updateTextareaPadding();
}

// ---------- 输入区辅助 ----------
function updateSendBtnVisibility() {
    const has = messageInput.value.trim().length > 0 || uploadedImages.length > 0;
    sendBtn.style.display = (has && !isGenerating) ? 'flex' : 'none';
}

function updateTextareaPadding() {
    requestAnimationFrame(() => {
        const controlGroup = document.querySelector('.theme-input-pill .absolute');
        if (!controlGroup) return;
        const groupWidth = controlGroup.offsetWidth;
        messageInput.style.paddingRight = (groupWidth + 20) + 'px';
    });
}

function autoResizeTextarea() {
    const BASE_HEIGHT = 45;
    messageInput.style.height = BASE_HEIGHT + 'px';
    const newHeight = Math.min(Math.max(messageInput.scrollHeight, BASE_HEIGHT), BASE_HEIGHT + 120);
    messageInput.style.height = newHeight + 'px';
    messageInput.style.overflowY = newHeight >= BASE_HEIGHT + 120 ? 'auto' : 'hidden';
    // 输入框高度变化后，重新滚动到底部，防止最后一条消息被遮挡
    scrollToBottom();
}

// ---------- 滚动控制 ----------
function scrollToBottom() {
    if (userScrolledUp) return;
    requestAnimationFrame(() => {
        chatSection.scrollTop = chatSection.scrollHeight;
    });
}

function resetScrollState() {
    userScrolledUp = false;
    requestAnimationFrame(() => {
        chatSection.scrollTop = chatSection.scrollHeight;
    });
}
