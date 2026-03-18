// ==================== 主题管理模块 ====================

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
    const body       = document.body;
    const inputPill  = document.querySelector('.theme-input-pill');
    const btns       = document.querySelectorAll('#themeBtn, #clearBtn');
    const inputArea  = document.querySelector('.theme-input-area');
    const hdr        = document.getElementById('chatHeader');
    const msgInput   = document.getElementById('messageInput');
    const subtitle   = document.querySelector('.welcome-subtitle');
    const disclaimer = document.querySelector('.footer-disclaimer');
    const uploadLabel = document.querySelector('.upload-label');

    if (isDark) {
        body.style.background      = '#0f1423';
        body.style.color           = '#f1f5f9';
        if (inputArea)   inputArea.style.background  = '#0f1423';
        if (hdr)         hdr.style.background        = '#0f1423';
        if (msgInput)    msgInput.style.color         = '#f1f5f9';
        if (subtitle)    subtitle.style.color         = '#ffffff';
        if (disclaimer)  disclaimer.style.color       = 'rgba(255,255,255,0.6)';
        if (uploadLabel) uploadLabel.style.color      = '#ffffff';
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
        if (inputArea)   inputArea.style.background  = '#f8fafc';
        if (hdr)         hdr.style.background        = '#f8fafc';
        if (msgInput)    msgInput.style.color         = '#1a1a1a';
        if (subtitle)    subtitle.style.color         = '#1a1a1a';
        if (disclaimer)  disclaimer.style.color       = 'rgba(26,26,26,0.5)';
        if (uploadLabel) uploadLabel.style.color      = '#1a1a1a';
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
    // 深色模式：显示太阳（点击切回浅色）
    // 浅色模式：显示月亮（点击切换深色）
    themeBtn.querySelector('.sun-icon').classList.toggle('hidden', !isDark);
    themeBtn.querySelector('.moon-icon').classList.toggle('hidden', isDark);
}
