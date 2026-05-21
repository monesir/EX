document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('open-aldiwan');
    btn.addEventListener('click', function() {
        chrome.tabs.create({ url: 'https://www.aldiwan.net/' });
    });
});
