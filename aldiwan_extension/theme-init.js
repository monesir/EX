// This script runs at document_start to immediately apply the theme and prevent FOUC (Flash of Unstyled Content)
chrome.storage.local.get(['aldiwan_enabled'], (res) => {
    if (res.aldiwan_enabled === false) return; // Extension is disabled

    // Inject CSS manually since we removed it from manifest to allow toggling
    let cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = chrome.runtime.getURL('dark-mode.css');
    
    if (document.head) {
        document.head.appendChild(cssLink);
    } else {
        document.documentElement.appendChild(cssLink);
    }

    const savedTheme = localStorage.getItem('aldiwan_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
});
