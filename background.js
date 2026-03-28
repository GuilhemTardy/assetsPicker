// When the user clicks the extension icon, toggle the floating panel
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
});
