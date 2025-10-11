// Background Service Worker for Annotate Translate Extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Annotate Translate extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      enableTranslate: true,
      enableAnnotate: true,
      targetLanguage: 'en'
    });

    // Create context menu items
    createContextMenus();
  } else if (details.reason === 'update') {
    console.log('Annotate Translate extension updated');
  }
});

// Create context menu items
function createContextMenus() {
  chrome.contextMenus.create({
    id: 'translate-text',
    title: 'Translate "%s"',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'annotate-text',
    title: 'Annotate "%s"',
    contexts: ['selection']
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'translate-text') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate',
      text: info.selectionText
    }, function(response) {
      // Handle potential errors when content script is not available
      if (chrome.runtime.lastError) {
        console.log('Could not send translate message:', chrome.runtime.lastError.message);
      }
    });
  } else if (info.menuItemId === 'annotate-text') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'annotate',
      text: info.selectionText
    }, function(response) {
      // Handle potential errors when content script is not available
      if (chrome.runtime.lastError) {
        console.log('Could not send annotate message:', chrome.runtime.lastError.message);
      }
    });
  }
});

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get({
      enableTranslate: true,
      enableAnnotate: true,
      targetLanguage: 'en'
    }, (settings) => {
      sendResponse({settings: settings});
    });
    return true; // Keep message channel open for async response
  }
});

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Content script is automatically injected via manifest
    console.log('Tab updated:', tab.url);
  }
});
