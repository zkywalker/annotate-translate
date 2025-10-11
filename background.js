// Background Service Worker for Annotate Translate Extension

// Initialize extension on install
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Annotate Translate extension installed');
    
    // Set default settings
    chrome.storage.sync.set({
      enableTranslate: false,  // 默认关闭翻译功能
      enableAnnotate: true,
      targetLanguage: 'en'
    });

    // Create context menu items
    createContextMenus();
  } else if (details.reason === 'update') {
    console.log('Annotate Translate extension updated');
    createContextMenus();
  }
});

// Create context menus on startup as well
chrome.runtime.onStartup.addListener(() => {
  console.log('Annotate Translate extension started');
  createContextMenus();
});

// Create context menu items
function createContextMenus() {
  // Remove existing menus first to avoid duplicates
  chrome.contextMenus.removeAll(() => {
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
    console.log('[Annotate-Translate BG] Context menus created');
  });
}

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('[Annotate-Translate BG] Context menu clicked:', info.menuItemId, 'Text:', info.selectionText);
  
  // Ensure content script is injected before sending message
  try {
    await ensureContentScriptInjected(tab.id);
  } catch (error) {
    console.error('[Annotate-Translate BG] Failed to inject content script:', error);
    return;
  }
  
  if (info.menuItemId === 'translate-text') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'translate',
      text: info.selectionText
    }, function(response) {
      // Handle potential errors when content script is not available
      if (chrome.runtime.lastError) {
        console.error('[Annotate-Translate BG] Could not send translate message:', chrome.runtime.lastError.message);
      } else {
        console.log('[Annotate-Translate BG] Translate message sent successfully');
      }
    });
  } else if (info.menuItemId === 'annotate-text') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'annotate',
      text: info.selectionText
    }, function(response) {
      // Handle potential errors when content script is not available
      if (chrome.runtime.lastError) {
        console.error('[Annotate-Translate BG] Could not send annotate message:', chrome.runtime.lastError.message);
      } else {
        console.log('[Annotate-Translate BG] Annotate message sent successfully');
      }
    });
  }
});

// Ensure content script is injected into the tab
async function ensureContentScriptInjected(tabId) {
  try {
    // Try to ping the content script
    const response = await chrome.tabs.sendMessage(tabId, { action: 'ping' });
    if (response && response.pong) {
      console.log('[Annotate-Translate BG] Content script already injected');
      return;
    }
  } catch (error) {
    // Content script not injected, inject it now
    console.log('[Annotate-Translate BG] Injecting content script...');
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ['content.js']
      });
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ['content.css']
      });
      console.log('[Annotate-Translate BG] Content script injected successfully');
      // Wait a bit for the script to initialize
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (injectError) {
      console.error('[Annotate-Translate BG] Failed to inject content script:', injectError);
      throw injectError;
    }
  }
}

// Handle messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSettings') {
    chrome.storage.sync.get({
      enableTranslate: false,  // 默认关闭翻译功能
      enableAnnotate: true,
      targetLanguage: 'en'
    }, (settings) => {
      sendResponse({settings: settings});
    });
    return true; // Keep message channel open for async response
  }
  
  // Handle clear cache request from options page
  if (request.action === 'clearCache') {
    console.log('[Annotate-Translate BG] Clearing translation cache...');
    
    // Send message to all tabs to clear their caches
    chrome.tabs.query({}, (tabs) => {
      let clearedCount = 0;
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'clearCache'
        }, (response) => {
          if (!chrome.runtime.lastError && response && response.success) {
            clearedCount++;
          }
        });
      });
      
      // Wait a bit and respond
      setTimeout(() => {
        console.log(`[Annotate-Translate BG] Cache cleared in ${clearedCount} tabs`);
        sendResponse({ success: true, count: clearedCount });
      }, 100);
    });
    
    return true; // Keep message channel open for async response
  }
  
  // Handle Youdao translation request (to bypass CORS)
  if (request.action === 'youdaoTranslate') {
    console.log('[Annotate-Translate BG] Handling Youdao translation request...');
    handleYoudaoTranslate(request.params)
      .then(data => {
        console.log('[Annotate-Translate BG] Youdao translation successful');
        sendResponse({ success: true, data: data });
      })
      .catch(error => {
        console.error('[Annotate-Translate BG] Youdao translation failed:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

/**
 * Handle Youdao translation API request in background script (bypasses CORS)
 * @param {Object} params - Request parameters (url, method, headers, body)
 * @returns {Promise<Object>} Response data
 */
async function handleYoudaoTranslate(params) {
  try {
    const response = await fetch(params.url, {
      method: params.method || 'POST',
      headers: params.headers || {},
      body: params.body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Annotate-Translate BG] Fetch error:', error);
    throw error;
  }
}

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Content script is automatically injected via manifest
    console.log('Tab updated:', tab.url);
  }
});
