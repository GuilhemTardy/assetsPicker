const RESTRICTED = ['chrome://', 'chrome-extension://', 'edge://', 'about:', 'data:'];

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.url || RESTRICTED.some(p => tab.url.startsWith(p))) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  } catch (e) {
    // Only inject when the content script is genuinely absent.
    // Other errors (e.g. page not fully loaded) should not trigger injection.
    if (!e.message?.includes('Receiving end does not exist')) return;

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content/content.js'],
      });
      await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
    } catch (e2) {
      console.error('[AssetsPicker]', e2.message);
    }
  }
});
