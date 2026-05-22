document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('open-aldiwan');
    btn.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://www.aldiwan.net/' });
    });

    const toggle = document.getElementById('ext-toggle');
    const statusText = document.getElementById('ext-status');

    // Load initial state
    chrome.storage.local.get(['aldiwan_enabled'], (res) => {
        let isEnabled = res.aldiwan_enabled !== false; // Default true
        toggle.checked = isEnabled;
        updateUI(isEnabled);
    });

    toggle.addEventListener('change', (e) => {
        const isEnabled = e.target.checked;
        chrome.storage.local.set({ aldiwan_enabled: isEnabled }, () => {
            updateUI(isEnabled);
            
            // Reload the active tab if it's aldiwan.net so the extension starts/stops immediately
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                if (tabs[0] && tabs[0].url && tabs[0].url.includes('aldiwan.net')) {
                    chrome.tabs.reload(tabs[0].id);
                }
            });
        });
    });

    function updateUI(enabled) {
        if (enabled) {
            statusText.textContent = 'الإضافة تعمل';
            statusText.style.color = '#ebd197'; // Gold
        } else {
            statusText.textContent = 'الإضافة معطلة';
            statusText.style.color = '#a49c95'; // Gray
        }
    }
});
