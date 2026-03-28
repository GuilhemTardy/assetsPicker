const RESTRICTED = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'data:'];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || RESTRICTED.some(p => tab.url.startsWith(p))) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  } catch {
    // Tab was open before the extension loaded — inject on demand
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js'],
    });
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  }
});
