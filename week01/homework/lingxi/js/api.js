// ==================== API 通信模块 ====================

// ---------- XSS 防护 ----------
const DANGEROUS_TAGS  = new Set(['script','iframe','object','embed','form','input','button','meta','link','style','base','applet']);
const DANGEROUS_ATTRS = /^(on\w+|javascript:|data:text\/html)/i;

function sanitizeHTML(html) {
    const parser = new DOMParser();
    const doc    = parser.parseFromString(html, 'text/html');
    function clean(node) {
        Array.from(node.childNodes).forEach(child => {
            if (child.nodeType !== Node.ELEMENT_NODE) return;
            if (DANGEROUS_TAGS.has(child.tagName.toLowerCase())) { child.remove(); return; }
            Array.from(child.attributes).forEach(attr => {
                if (DANGEROUS_ATTRS.test(attr.name) || DANGEROUS_ATTRS.test(attr.value))
                    child.removeAttribute(attr.name);
            });
            clean(child);
        });
    }
    clean(doc.body);
    return doc.body.innerHTML;
}

// 配置 marked：禁用 HTML 直通
marked.setOptions({ breaks: true, gfm: true, html: false });

// ---------- API Key ----------
function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

// ---------- 流式 AI 响应 ----------
async function generateAIResponse(hasImages) {
    isGenerating = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    resetScrollState();

    const msgWrap = addMessage('ai', '');
    const bubble  = msgWrap.querySelector('.ai-content');
    const avatar  = msgWrap._avatar;
    if (avatar) avatar.classList.add('ai-avatar-spin');

    bubble.innerHTML = '<span class="thinking-dots">思考中<span class="dots">...</span></span>';

    let fullContent = '';
    let firstChunk  = true;
    const model = hasImages ? MODEL_VISION : MODEL_TEXT;

    try {
        currentAbortController = new AbortController();

        const response = await fetch(ALIYUN_API_URL, {
            method:  'POST',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type':  'application/json'
            },
            body:   JSON.stringify({ model, messages: conversationHistory, stream: true }),
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
        let   renderTimer = null;

        // 节流渲染：流式阶段最多每 80ms 完整解析一次 Markdown
        // 避免每个 delta 都重建 DOM，减少长回复时的性能损耗
        function scheduleRender() {
            if (renderTimer) return;
            renderTimer = setTimeout(() => {
                renderTimer = null;
                renderMarkdown(bubble, fullContent);
                scrollToBottom();
            }, 80);
        }

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
                            if (firstChunk) { bubble.innerHTML = ''; firstChunk = false; }
                            fullContent += delta;
                            scheduleRender();
                        }
                    } catch (_) { /* 忽略不完整 JSON */ }
                }
            }
        }

        conversationHistory.push({ role: 'assistant', content: fullContent });
        // 流式结束后清除节流计时器，强制完整渲染最终内容
        if (renderTimer) { clearTimeout(renderTimer); renderTimer = null; }
        if (fullContent) { renderMarkdown(bubble, fullContent); scrollToBottom(); }

    } catch (error) {
        if (error.name === 'AbortError') {
            if (firstChunk) {
                bubble.innerHTML = `
                    <div class="stop-mark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        <span>已停止生成</span>
                    </div>`;
            } else {
                const stopMark = document.createElement('div');
                stopMark.className = 'stop-mark stop-mark-divider';
                stopMark.innerHTML = `
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    <span>已停止生成</span>`;
                bubble.appendChild(stopMark);
            }
        } else {
            let friendlyMsg = '请求失败，请稍后重试';
            const msg = error.message || '';
            if (!navigator.onLine || msg.includes('Failed to fetch') || msg.includes('NetworkError'))
                friendlyMsg = '网络连接失败，请检查网络后重试';
            else if (msg.includes('401') || msg.includes('Unauthorized'))
                friendlyMsg = 'API Key 无效或已过期，请重新配置';
            else if (msg.includes('429') || msg.includes('rate limit'))
                friendlyMsg = '请求过于频繁，请稍后再试';
            else if (msg.includes('500') || msg.includes('502') || msg.includes('503'))
                friendlyMsg = '服务器暂时不可用，请稍后重试';
            else if (msg.includes('timeout') || msg.includes('Timeout'))
                friendlyMsg = '请求超时，请检查网络后重试';

            console.error('生成响应出错:', error);
            bubble.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div style="display:flex;align-items:center;gap:8px;color:#f87171">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span style="font-size:13px;font-weight:500">${friendlyMsg}</span>
                    </div>
                    <span style="font-size:11px;color:rgba(255,255,255,0.3)">${msg}</span>
                </div>`;
            showToast(friendlyMsg, 'error');
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

// ---------- 图片上传 ----------
const MAX_IMAGES = 5;

function handleImageUpload(e) {
    const files     = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - uploadedImages.length;
    if (remaining <= 0) {
        showToast(`最多上传 ${MAX_IMAGES} 张图片`, 'warning');
        imageUpload.value = '';
        return;
    }
    if (files.length > remaining) showToast(`已达上限，仅添加前 ${remaining} 张图片`, 'warning');
    files.slice(0, remaining).forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedImages.push({
                id:   `img_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
                name: file.name,
                data: ev.target.result
            });
            renderImagePreview();
        };
        reader.readAsDataURL(file);
    });
    imageUpload.value = '';
}
