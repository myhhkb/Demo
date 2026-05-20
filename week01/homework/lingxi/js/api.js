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
// hasImages：true → MODEL_VISION 图文模型；false → MODEL_TEXT 纯文本模型
async function generateAIResponse(hasImages) {
    isGenerating = true;                      // 标记正在生成，index.js 里 sendMessage 会据此禁止重复发送
    sendBtn.style.display = 'none';           // 生成中隐藏发送按钮
    stopBtn.style.display = 'flex';           // 显示停止按钮，可调用 stopGeneration → abort()
    resetScrollState();                       // 重置「用户是否上滑」标志，恢复自动滚到底（ui.js）

    const msgWrap = addMessage('ai', '');     // 插入一条空 AI 消息（含头像 + .ai-content 气泡）
    const bubble  = msgWrap.querySelector('.ai-content'); // 正文容器，流式内容最终写进这里
    const avatar  = msgWrap._avatar;          // ui.js 在 wrap 上挂的头像引用，用于加/去旋转动画
    if (avatar) avatar.classList.add('ai-avatar-spin'); // 生成中头像旋转 + 光晕（css 动画）

    bubble.innerHTML = '<span class="thinking-dots">思考中<span class="dots">...</span></span>'; // 首包前占位

    let fullContent = '';                     // 累积本条 assistant 回复的完整字符串
    let firstChunk  = true;                   // 是否尚未收到第一个 delta（用于清空「思考中」）
    const model = hasImages ? MODEL_VISION : MODEL_TEXT; // 按是否带图选择百炼模型名

    try {
        currentAbortController = new AbortController(); // 与 fetch 的 signal 绑定，abort() 可中断请求与读流

        const response = await fetch(ALIYUN_API_URL, { // 请求百炼 OpenAI 兼容 chat/completions 接口
            method: 'POST',                      // POST 提交对话 body
            headers: {
                'Authorization': `Bearer ${getApiKey()}`, // Bearer 鉴权，Key 来自 localStorage
                'Content-Type': 'application/json'       // body 为 JSON
            },
            body: JSON.stringify({ model, messages: conversationHistory, stream: true }), // stream:true 开启 SSE 流式
            signal: currentAbortController.signal // 中止时 fetch/read 抛 AbortError
        });

        if (!response.ok) {                   // 非 2xx：401/429/500 等，不进入读流
            const errText = await response.text(); // 读错误体（常为 JSON）
            let errMsg = `HTTP ${response.status}`; // 默认提示含状态码
            try {
                errMsg = JSON.parse(errText).error?.message || errMsg; // 优先用服务端 message 字段
            } catch (_) {}                      // 非 JSON 则保持默认 errMsg
            const err = new Error(errMsg);     // 统一走 catch 展示
            err.status = response.status;      // 供 catch 里按 401/429/5xx 分支
            throw err;                         // 抛出，跳过下方读流逻辑
        }

        const reader  = response.body.getReader(); // ReadableStream 默认阅读器，循环 read() 取块
        const decoder = new TextDecoder();         // Uint8Array → 字符串
        let buffer = '';                           // 未凑满一行的残留，下次 read 继续拼
        let renderTimer = null;                    // setTimeout id，实现 80ms 节流渲染

        function scheduleRender() {                // 合并高频 delta，避免每个字都 marked.parse 全量 DOM
            if (renderTimer) return;               // 已有待执行定时器则跳过（节流）
            renderTimer = setTimeout(() => {       // 80ms 后执行一次渲染
                renderTimer = null;                // 允许下一轮 schedule
                renderMarkdown(bubble, fullContent); // marked + 消毒 + 代码高亮（ui.js）
                scrollToBottom();                  // 智能滚底（用户上滑时不强拉）
            }, 80);
        }

        while (true) {                             // 持续读流直到 done===true
            const { done, value } = await reader.read(); // value 为本块二进制；done 表示流结束
            if (done) break;                       // 无更多数据，退出循环

            buffer += decoder.decode(value, { stream: true }); // 解码并追加（stream 处理截断的多字节 UTF-8）
            const lines = buffer.split('\n');      // SSE 按行分隔，每行多为 data: {...}
            buffer = lines.pop();                  // 最后一行可能半截 JSON，留到下一轮

            for (const line of lines) {            // 处理本批完整行
                const trimmed = line.trim();       // 去空白
                if (!trimmed || trimmed === 'data: [DONE]') continue; // 空行或流结束标记

                if (trimmed.startsWith('data:')) { // OpenAI 兼容 SSE 行前缀
                    try {
                        const data = JSON.parse(trimmed.slice(5).trim()); // 去掉 "data:" 后 JSON.parse
                        const delta = data.choices?.[0]?.delta?.content; // 本事件新增文本片段

                        if (delta) {               // 无 content 的事件（如 role）跳过
                            if (firstChunk) {      // 首个有效字：去掉「思考中」
                                bubble.innerHTML = ''; // 清空占位 HTML
                                firstChunk = false;    // 后续 chunk 不再清空
                            }

                            fullContent += delta;  // 拼接到完整回复
                            scheduleRender();      // 预约节流渲染（非立即）
                        }
                    } catch (_) {
                        // 半行/坏 JSON 忽略，等后续块补全
                    }
                }
            }
        }

        conversationHistory.push({ role: 'assistant', content: fullContent }); // 多轮上下文：记下 assistant 全文

        if (renderTimer) {                         // 取消尚未触发的最后一次节流渲染
            clearTimeout(renderTimer);             // 避免与下方最终 render 重复
            renderTimer = null;
        }
        if (fullContent) {                         // 流结束强制全量渲染一次（含未过期的 timer 内容）
            renderMarkdown(bubble, fullContent);
            scrollToBottom();
        }
    } catch (error) {
        if (error.name === 'AbortError') {         // stopGeneration → abort()，不是接口报错
            if (firstChunk) {                      // 从未收到 delta：整泡显示停止提示
                // 整段 innerHTML 替换为停止 UI（含 svg 图标）
                bubble.innerHTML = `
                    <div class="stop-mark">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                        <span>已停止生成</span>
                    </div>`;
            } else {                               // 已有部分内容：文末追加停止条，保留已生成文字
                const stopMark = document.createElement('div');
                stopMark.className = 'stop-mark stop-mark-divider';
                stopMark.innerHTML = `
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                    <span>已停止生成</span>`;
                bubble.appendChild(stopMark);      // append 不覆盖 bubble 内已有 Markdown
            }
        } else {                                   // 网络 / Key / 限流 / 服务器等错误
            let friendlyMsg = '请求失败，请稍后重试'; // 给用户看的短句
            const msg = error.message || '';       // 原始错误文本，用于匹配分支与灰字展示

            if (!navigator.onLine || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
                friendlyMsg = '网络连接失败，请检查网络后重试'; // 离线或 CORS/网络失败
            } else if (error.status === 401 || msg.includes('401') || msg.includes('Unauthorized') || (msg.toLowerCase().includes('invalid') && msg.toLowerCase().includes('key'))) {
                localStorage.removeItem(API_KEY_STORAGE); // Key 无效：删掉 localStorage 里的旧值
                const newKey = prompt(               // 弹窗收集新 Key
                    'API Key 无效或已过期，请重新输入阿里云百炼 API Key\n' +
                    '（获取地址：https://bailian.console.aliyun.com）'
                );
                if (newKey && newKey.trim()) {       // 用户提交了非空 Key
                    localStorage.setItem(API_KEY_STORAGE, newKey.trim());
                    showToast('API Key 已更新，请重新发送消息', 'success');
                } else {                             // 取消或未输入
                    showToast('未设置 API Key，请重新发送消息以重新输入', 'warning');
                }
                friendlyMsg = 'API Key 无效或已过期，已清除旧 Key，请重新发送消息';
            } else if (error.status === 429 || msg.includes('429') || msg.includes('rate limit')) {
                friendlyMsg = '请求过于频繁，请稍后再试';       // 限流
            } else if (error.status >= 500 || msg.includes('500') || msg.includes('502') || msg.includes('503')) {
                friendlyMsg = '服务器暂时不可用，请稍后重试';   // 服务端错误
            } else if (msg.includes('timeout') || msg.includes('Timeout')) {
                friendlyMsg = '请求超时，请检查网络后重试';     // 超时
            }

            console.error('生成响应出错:', error);  // 控制台保留完整 error 对象
            // 气泡内：红字友好提示 + 灰字原始 message
            bubble.innerHTML = `
                <div style="display:flex;flex-direction:column;gap:8px">
                    <div style="display:flex;align-items:center;gap:8px;color:#f87171">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                        <span style="font-size:13px;font-weight:500">${friendlyMsg}</span>
                    </div>
                    <span style="font-size:11px;color:rgba(128,128,128,0.7)">${msg}</span>
                </div>`;

            showToast(friendlyMsg, 'error');         // 底部 Toast 同步提示
        }
    } finally {
        isGenerating = false;                      // 无论 try/catch 结果，都结束「生成中」
        if (avatar) avatar.classList.remove('ai-avatar-spin'); // 去掉头像旋转
        updateSendBtnVisibility();                 // 刷新发送钮显隐
        stopBtn.style.display = 'none';            // 隐藏停止钮
        currentAbortController = null;             // 释放 AbortController
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
