// Popup JavaScript for Annotate Translate Extension

document.addEventListener('DOMContentLoaded', async function() {
  // Initialize language and localize the page
  await initializeLanguage();
  localizeHtmlPage();
  
  // Populate language select with localized options
  populateLanguageSelect();
  
  // Populate translation provider select with localized options
  populateProviderSelect();
  
  // Load saved settings
  loadSettings();

  // Save settings button
  document.getElementById('save-settings').addEventListener('click', saveSettings);

  // Clear annotations button
  document.getElementById('clear-annotations').addEventListener('click', clearAnnotations);

  // Open settings page button
  document.getElementById('open-settings').addEventListener('click', openSettingsPage);
});

// Open settings page
function openSettingsPage() {
  chrome.runtime.openOptionsPage();
}

// Populate language select with localized options
function populateLanguageSelect() {
  const select = document.getElementById('target-language');
  if (!select) return;
  
  const languages = [
    { value: 'zh-CN', labelKey: 'langChineseSimplified' },
    { value: 'zh-TW', labelKey: 'langChineseTraditional' },
    { value: 'en', labelKey: 'langEnglish' },
    { value: 'ja', labelKey: 'langJapanese' },
    { value: 'ko', labelKey: 'langKorean' },
    { value: 'es', labelKey: 'langSpanish' },
    { value: 'fr', labelKey: 'langFrench' },
    { value: 'de', labelKey: 'langGerman' }
  ];
  
  languages.forEach(lang => {
    const option = document.createElement('option');
    option.value = lang.value;
    option.textContent = i18n(lang.labelKey);
    select.appendChild(option);
  });
}

// Populate translation provider select with localized options
function populateProviderSelect() {
  const select = document.getElementById('translation-provider');
  if (!select) return;
  
  const providers = [
    { value: 'google', labelKey: 'googleTranslate', logo: 'icons/icon_logo_google.svg' },
    { value: 'youdao', labelKey: 'youdaoTranslate', logo: 'icons/icon_logo_youdao.svg' },
    { value: 'deepl', labelKey: 'deeplTranslate', logo: 'icons/icon_logo_deepl.svg' }
  ];
  
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.value;
    option.textContent = i18n(provider.labelKey);
    option.dataset.logo = provider.logo;
    select.appendChild(option);
  });
  
  // Add event listener to update icon when provider changes
  select.addEventListener('change', updateProviderIcon);
}

// Update provider icon based on selected provider
function updateProviderIcon() {
  const select = document.getElementById('translation-provider');
  const icon = document.getElementById('provider-select-icon');
  if (!select || !icon) return;
  
  const selectedOption = select.options[select.selectedIndex];
  const logoPath = selectedOption.dataset.logo;
  
  if (logoPath) {
    icon.src = chrome.runtime.getURL(logoPath);
    icon.alt = selectedOption.textContent;
    icon.style.display = 'block';
  } else {
    icon.style.display = 'none';
  }
}

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
    enableTranslate: false,  // 默认关闭翻译功能
    enableAnnotate: true,
    targetLanguage: 'en',
    translationProvider: 'google'
  }, function(items) {
    document.getElementById('enable-translate').checked = items.enableTranslate;
    document.getElementById('enable-annotate').checked = items.enableAnnotate;
    document.getElementById('target-language').value = items.targetLanguage;
    document.getElementById('translation-provider').value = items.translationProvider;
    
    // Update provider icon after loading settings
    updateProviderIcon();
  });
}

// Save settings to storage
function saveSettings() {
  const settings = {
    enableTranslate: document.getElementById('enable-translate').checked,
    enableAnnotate: document.getElementById('enable-annotate').checked,
    targetLanguage: document.getElementById('target-language').value,
    translationProvider: document.getElementById('translation-provider').value
  };

  chrome.storage.sync.set(settings, function() {
    // Update status to let user know settings were saved
    const status = document.getElementById('status');
    status.textContent = i18n('settingsSaved');
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
        status.textContent = i18n('cannotClearOnThisPage');
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
          status.textContent = i18n('contentScriptNotAvailable');
          status.className = 'status error';
        } else if (response && response.success) {
          status.textContent = i18n('allAnnotationsCleared');
          status.className = 'status success';
        } else {
          status.textContent = i18n('failedToClear');
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
