// ==================== 主题管理模块 ====================
// 这个文件专门负责：
// 1. 初始化页面主题
// 2. 切换深色/浅色模式
// 3. 根据当前主题同步页面颜色和图标

// initTheme 在页面刚加载完成时调用。
// 它会优先读取用户之前保存的主题设置；
// 如果用户没保存过，就根据系统当前偏好来决定用深色还是浅色。
function initTheme() {
    const saved      = localStorage.getItem(THEME_STORAGE);
    const preferDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark     = saved ? saved === 'dark' : preferDark;

    // 给 html 根元素加上或移除 dark 类。
    // Tailwind 的深色模式很多时候就是依赖这个类名来工作的。
    document.documentElement.classList.toggle('dark', isDark);

    applyThemeStyles(isDark);
    syncThemeIcons();
}

// toggleTheme 在点击“主题切换按钮”时执行。
// 它的作用是：
// - 把当前主题从深色切到浅色，或者从浅色切到深色
// - 把结果保存到 localStorage
function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem(THEME_STORAGE, isDark ? 'dark' : 'light');
    applyThemeStyles(isDark);
    syncThemeIcons();
}

// applyThemeStyles 根据当前主题手动修改页面里一些关键元素的样式。
// 为什么这里还要手动改？
// 因为有些区域用了行内样式或动态样式，不能完全依赖 CSS 类自动切换。
function applyThemeStyles(isDark) {
    const body        = document.body;
    const inputPill   = document.querySelector('.theme-input-pill');
    const btns        = document.querySelectorAll('#themeBtn, #clearBtn, #apiKeyBtn');
    const inputArea   = document.querySelector('.theme-input-area');
    const hdr         = document.getElementById('chatHeader');
    const msgInput    = document.getElementById('messageInput');
    const subtitle    = document.querySelector('.welcome-subtitle');
    const disclaimer  = document.querySelector('.footer-disclaimer');
    const uploadLabel = document.querySelector('.upload-label');

    if (isDark) {
        // 深色模式下，把页面背景和文字改成偏深色系。
        body.style.background = '#0f1423';
        body.style.color = '#f1f5f9';

        if (inputArea)   inputArea.style.background = '#0f1423';
        if (hdr)         hdr.style.background = '#0f1423';
        if (msgInput)    msgInput.style.color = '#f1f5f9';
        if (subtitle)    subtitle.style.color = '#ffffff';
        if (disclaimer)  disclaimer.style.color = 'rgba(255,255,255,0.6)';
        if (uploadLabel) uploadLabel.style.color = '#ffffff';

        // 建议卡片颜色也要同步变深。
        document.querySelectorAll('.theme-card').forEach(el => {
            el.style.background = '#1e293b';
            const p = el.querySelector('p');
            if (p) p.style.color = '#ffffff';
        });

        // 底部按钮颜色统一调整。
        btns.forEach(b => {
            b.style.background = '#1e293b';
            b.style.color = '#ffffff';
        });

        if (inputPill) inputPill.style.background = '#1e293b';
    } else {
        // 浅色模式下，页面改成亮色背景和深色文字。
        body.style.background = '#f8fafc';
        body.style.color = '#1a1a1a';

        if (inputArea)   inputArea.style.background = '#f8fafc';
        if (hdr)         hdr.style.background = '#f8fafc';
        if (msgInput)    msgInput.style.color = '#1a1a1a';
        if (subtitle)    subtitle.style.color = '#1a1a1a';
        if (disclaimer)  disclaimer.style.color = 'rgba(26,26,26,0.5)';
        if (uploadLabel) uploadLabel.style.color = '#1a1a1a';

        document.querySelectorAll('.theme-card').forEach(el => {
            el.style.background = '#ffffff';
            const p = el.querySelector('p');
            if (p) p.style.color = '#1a1a1a';
        });

        btns.forEach(b => {
            b.style.background = '#e2e8f0';
            b.style.color = '#1a1a1a';
        });

        if (inputPill) inputPill.style.background = '#e2e8f0';
    }
}

// syncThemeIcons 用来同步主题按钮里的图标显示。
// 设计规则是：
// - 当前是深色模式时，显示“太阳”图标，提示用户点它可以切到亮色
// - 当前是浅色模式时，显示“月亮”图标，提示用户点它可以切到深色
function syncThemeIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    themeBtn.querySelector('.sun-icon').classList.toggle('hidden', !isDark);
    themeBtn.querySelector('.moon-icon').classList.toggle('hidden', isDark);
}
