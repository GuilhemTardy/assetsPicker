// When the user clicks the extension icon, toggle the floating panel.
// If the content script isn't injected yet (tab was open before the extension
// was loaded), inject it first then send the toggle message.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  } catch {
    // Content script missing — inject it, then toggle
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/content.js'],
    });
    await chrome.tabs.sendMessage(tab.id, { action: 'toggle' });
  }
});
