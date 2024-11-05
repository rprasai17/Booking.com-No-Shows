// background.js
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.action.onClicked.addListener((tab) => {
    chrome.sidePanel.open({ windowId: tab.windowId });
});

// Listen for messages from the side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'getTabCount') {
        chrome.tabs.query({
            url: "https://admin.booking.com/hotel/hoteladmin/extranet_ng/manage/booking.html*"
        }, (tabs) => {
            sendResponse({ count: tabs.length });
        });
        return true; // Will respond asynchronously
    }
});