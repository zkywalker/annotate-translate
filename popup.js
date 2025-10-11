// Popup JavaScript for Annotate Translate Extension

document.addEventListener('DOMContentLoaded', function() {
  // Load saved settings
  loadSettings();

  // Save settings button
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Clear annotations button
  document.getElementById('clear-annotations').addEventListener('click', clearAnnotations);
});

// Check if the tab URL is valid for content scripts
function isValidTabUrl(url) {
  if (!url) return false;
  
  // List of URL schemes that don't support content scripts
  const invalidSchemes = [
    'chrome://',
    'chrome-extension://',
    'edge://',
    'about:',
    'view-source:',
    'data:',
    'javascript:',
    'file://'
  ];
  
  return !invalidSchemes.some(scheme => url.startsWith(scheme));
}

// Load settings from storage
function loadSettings() {
  chrome.storage.sync.get({
    enableTranslate: true,
    enableAnnotate: true,
    targetLanguage: 'en'
  }, function(items) {
    document.getElementById('enable-translate').checked = items.enableTranslate;
    document.getElementById('enable-annotate').checked = items.enableAnnotate;
    document.getElementById('target-language').value = items.targetLanguage;
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    enableTranslate: document.getElementById('enable-translate').checked,
    enableAnnotate: document.getElementById('enable-annotate').checked,
    targetLanguage: document.getElementById('target-language').value
  };

  chrome.storage.sync.set(settings, function() {
    // Update status to let user know settings were saved
    const status = document.getElementById('status');
    status.textContent = 'Settings saved successfully!';
    status.className = 'status success';
    
    // Send message to content script to apply new settings
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && isValidTabUrl(tabs[0].url)) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settings
        }, function(response) {
          // Handle potential errors when content script is not available
          if (chrome.runtime.lastError) {
            console.log('Could not update content script settings:', chrome.runtime.lastError.message);
          }
        });
      }
    });

    setTimeout(function() {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  });
}

// Clear all annotations
function clearAnnotations() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      // Check if the tab URL is valid for content scripts
      if (!isValidTabUrl(tabs[0].url)) {
        const status = document.getElementById('status');
        status.textContent = 'Cannot clear annotations on this page.';
        status.className = 'status error';
        
        setTimeout(function() {
          status.textContent = '';
          status.className = 'status';
        }, 3000);
        return;
      }
      
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'clearAnnotations'
      }, function(response) {
        const status = document.getElementById('status');
        
        // Check for connection errors
        if (chrome.runtime.lastError) {
          console.log('Could not send message to content script:', chrome.runtime.lastError.message);
          status.textContent = 'Content script not available on this page.';
          status.className = 'status error';
        } else if (response && response.success) {
          status.textContent = 'All annotations cleared!';
          status.className = 'status success';
        } else {
          status.textContent = 'Failed to clear annotations.';
          status.className = 'status error';
        }
        
        setTimeout(function() {
          status.textContent = '';
          status.className = 'status';
        }, 3000);
      });
    }
  });
}
