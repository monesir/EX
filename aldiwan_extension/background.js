chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "diwan_quote_image",
        title: "تصميم اقتباس (الديوان)",
        contexts: ["selection"],
        documentUrlPatterns: ["*://*.aldiwan.net/*"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "diwan_quote_image") {
        chrome.tabs.sendMessage(tab.id, {
            action: "generate_image",
            text: info.selectionText
        });
    }
});
