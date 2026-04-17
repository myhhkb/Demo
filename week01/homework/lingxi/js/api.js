// ==================== API 通信模块 ====================
// 这个文件主要负责：
// 1. 清理 AI 返回内容里的危险 HTML
// 2. 读取 API Key
// 3. 发送请求到大模型接口
// 4. 处理流式响应
// 5. 处理图片上传

// ---------- XSS 防护 ----------
// 下面这些标签和属性如果直接注入页面，可能会带来安全风险。
// 比如 script 标签可能执行恶意脚本，所以要先过滤掉。
const DANGEROUS_TAGS  = new Set(['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'style', 'base', 'applet']);
const DANGEROUS_ATTRS = /^(on\w+|javascript:|data:text\/html)/i;

// sanitizeHTML 用来清理不安全的 HTML 内容。
// 作用可以理解为：
// “先让浏览器帮我们把字符串解析成 DOM，再递归检查每个节点，把危险内容删掉”。
function sanitizeHTML(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    function clean(node) {
        Array.from(node.childNodes).forEach(child => {
            // 只处理元素节点，普通文本节点不用管。
            if (child.nodeType !== Node.ELEMENT_NODE) return;

            // 如果碰到危险标签，直接整块删除。
            if (DANGEROUS_TAGS.has(child.tagName.toLowerCase())) {
                child.remove();
                return;
            }

            // 再检查当前元素上的每一个属性。
            Array.from(child.attributes).forEach(attr => {
                if (DANGEROUS_ATTRS.test(attr.name) || DANGEROUS_ATTRS.test(attr.value)) {
                    child.removeAttribute(attr.name);
                }
            });

            // 继续递归清理子节点。
            clean(child);
        });
    }

    clean(doc.body);
    return doc.body.innerHTML;
}

// 配置 marked：
// - breaks: true 表示普通换行也尽量保留显示效果
// - gfm: true 表示启用 GitHub 风格 Markdown
// - html: false 表示不允许 Markdown 原样插入 HTML
marked.setOptions({ breaks: true, gfm: true, html: false });

// ---------- API Key ----------
// getApiKey 用来从浏览器本地存储中读取 API Key。
function getApiKey() {
    return localStorage.getItem(API_KEY_STORAGE);
}

// ---------- 流式 AI 响应 ----------
// generateAIResponse 会向大模型发起请求，并以“流式输出”的方式逐步显示回复内容。
//
// hasImages 参数表示这次请求里是否带了图片：
// - true：使用图文模型
// - false：使用纯文本模型
async function generateAIResponse(hasImages) {
    isGenerating = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    resetScrollState();

    // 先在页面中插入一个空的 AI 消息气泡，后面再不断往里面填内容。
    const msgWrap = addMessage('ai', '');
    const bubble  = msgWrap.querySelector('.ai-content');
    const avatar  = msgWrap._avatar;
    if (avatar) avatar.classList.add('ai-avatar-spin');

    // 在真正的内容返回前，先显示“思考中”。
    bubble.innerHTML = '<span class="thinking-dots">思考中<span class="dots">...</span></span>';

    let fullContent = '';
    let firstChunk  = true;
    const model = hasImages ? MODEL_VISION : MODEL_TEXT;

    try {
        // AbortController 可以理解为“请求遥控器”，
        // 后面点击停止按钮时，可以用它中断当前请求。
        currentAbortController = new AbortController();

        const response = await fetch(ALIYUN_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getApiKey()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ model, messages: conversationHistory, stream: true }),
            signal: currentAbortController.signal
        });

        // 如果 HTTP 状态码不是成功，就尝试把错误信息提取出来。
        if (!response.ok) {
            const errText = await response.text();
            let errMsg = `HTTP ${response.status}`;
            try {
                errMsg = JSON.parse(errText).error?.message || errMsg;
            } catch (_) {}
            const err = new Error(errMsg);
            err.status = response.status;
            throw err;
        }

        const reader  = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let renderTimer = null;

        // scheduleRender 用来“节流渲染”。
        // 因为流式响应可能非常碎，如果每收到一点内容就立刻完整重渲染，性能会变差。
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
                        const data = JSON.parse(trimmed.slice(5).trim());
                        const delta = data.choices?.[0]?.delta?.content;

                        if (delta) {
                            // 第一次收到真实内容时，把“思考中”替换掉。
                            if (firstChunk) {
                                bubble.innerHTML = '';
                                firstChunk = false;
                            }

                            fullContent += delta;
                            scheduleRender();
                        }
                    } catch (_) {
                        // 流式数据可能存在一小段不完整 JSON，这里直接忽略即可。
                    }
                }
            }
        }

        // 把 AI 完整回复保存到对话历史里，方便后续多轮对话继续带上下文。
        conversationHistory.push({ role: 'assistant', content: fullContent });

        // 流结束后，做一次最终完整渲染，确保页面显示的是最终版本。
        if (renderTimer) {
            clearTimeout(renderTimer);
            renderTimer = null;
        }
        if (fullContent) {
            renderMarkdown(bubble, fullContent);
            scrollToBottom();
        }
    } catch (error) {
        // 如果是用户手动点击“停止生成”，就显示停止提示，而不是报错。
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

            // 下面这些判断是为了把底层错误信息转换成更容易理解的用户提示。
            if (!navigator.onLine || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                friendlyMsg = '网络连接失败，请检查网络后重试';
            } else if (error.status === 401 || msg.includes('401') || msg.includes('Unauthorized') || (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('key'))) {
                // 如果 API Key 无效，就先删除旧 Key，再提示用户重新输入。
                localStorage.removeItem(API_KEY_STORAGE);
                const newKey = prompt(
                    'API Key 无效或已过期，请重新输入阿里云百炼 API Key\n' +
                    '（获取地址：https://bailian.console.aliyun.com）'
                );
                if (newKey && newKey.trim()) {
                    localStorage.setItem(API_KEY_STORAGE, newKey.trim());
                    showToast('API Key 已更新，请重新发送消息', 'success');
                } else {
                    showToast('未设置 API Key，请重新发送消息以重新输入', 'warning');
                }
                friendlyMsg = 'API Key 无效或已过期，已清除旧 Key，请重新发送消息';
            } else if (error.status === 429 || msg.includes('429') || msg.includes('rate limit')) {
                friendlyMsg = '请求过于频繁，请稍后再试';
            } else if (error.status >= 500 || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
                friendlyMsg = '服务器暂时不可用，请稍后重试';
            } else if (msg.includes('timeout') || msg.includes('Timeout')) {
                friendlyMsg = '请求超时，请检查网络后重试';
            }

            console.error('生成响应出错:', error);
            bubble.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div style="display:flex;align-items:center;gap:8px;color:#f87171">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span style="font-size:13px;font-weight:500">${friendlyMsg}</span>
                    </div>
                    <span style="font-size:11px;color:rgba(128,128,128,0.7)">${msg}</span>
                </div>`;

            showToast(friendlyMsg, 'error');
        }
    } finally {
        // 无论成功还是失败，最后都要把页面状态恢复正常。
        isGenerating = false;
        if (avatar) avatar.classList.remove('ai-avatar-spin');
        updateSendBtnVisibility();
        stopBtn.style.display = 'none';
        currentAbortController = null;
    }
}

// stopGeneration 用来中止当前正在进行的流式请求。
function stopGeneration() {
    currentAbortController?.abort();
}

// ---------- 图片上传 ----------
// 限制最多同时上传 5 张图片。
const MAX_IMAGES = 5;

// 单张图片最大 4MB。
// 图片转成 base64 后体积通常还会膨胀，所以这里先卡一下，避免请求太大。
const MAX_IMG_SIZE = 4 * 1024 * 1024;

// handleImageUpload 负责处理用户选择图片后的逻辑。
function handleImageUpload(e) {
    const files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
    const remaining = MAX_IMAGES - uploadedImages.length;

    if (remaining <= 0) {
        showToast(`最多上传 ${MAX_IMAGES} 张图片`, 'warning');
        imageUpload.value = '';
        return;
    }

    if (files.length > remaining) {
        showToast(`已达上限，仅添加前 ${remaining} 张图片`, 'warning');
    }

    files.slice(0, remaining).forEach(file => {
        // 如果图片太大，就直接跳过。
        if (file.size > MAX_IMG_SIZE) {
            showToast(`「${file.name}」超过 4MB 限制，已跳过`, 'warning');
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
            uploadedImages.push({
                id: `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                name: file.name,
                data: ev.target.result
            });

            // 每读完一张，就刷新预览区。
            renderImagePreview();
        };
        reader.readAsDataURL(file);
    });

    // 清空 input 的值，方便用户后面再次选择同一张图片时也能触发 change 事件。
    imageUpload.value = '';
}
