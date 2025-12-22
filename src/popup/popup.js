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

  // Add auto-save listeners to all settings controls
  document.getElementById('enable-translate').addEventListener('change', autoSaveSettings);
  document.getElementById('enable-annotate').addEventListener('change', autoSaveSettings);
  document.getElementById('translation-provider').addEventListener('change', autoSaveSettings);
  document.getElementById('target-language').addEventListener('change', autoSaveSettings);

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
    { value: 'google', labelKey: 'googleTranslate', logo: 'assets/icons/icon_logo_google.svg' },
    { value: 'youdao', labelKey: 'youdaoTranslate', logo: 'assets/icons/icon_logo_youdao.svg' },
    { value: 'deepl', labelKey: 'deeplTranslate', logo: 'assets/icons/icon_logo_deepl.svg' },
    { value: 'openai', labelKey: 'openaiTranslate', logo: 'assets/icons/icon_logo_ai.svg' }  // AI翻译
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
    icon.classList.remove('hidden');
  } else {
    icon.classList.add('hidden');
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
  chrome.storage.sync.get(null, function(items) {
    // 使用新的分层结构
    if (items.general) {
      document.getElementById('enable-translate').checked = items.general.enableTranslate ?? false;
      document.getElementById('enable-annotate').checked = items.general.enableAnnotate ?? true;
      document.getElementById('target-language').value = items.general.targetLanguage ?? 'en';
      document.getElementById('translation-provider').value = items.providers.current ?? 'google';
    } else {
      // 如果没有设置，使用默认值
      document.getElementById('enable-translate').checked = false;
      document.getElementById('enable-annotate').checked = true;
      document.getElementById('target-language').value = 'en';
      document.getElementById('translation-provider').value = 'google';
    }
    
    // Update provider icon after loading settings
    updateProviderIcon();
  });
}

// Auto-save settings when any control changes
function autoSaveSettings() {
  // 先读取现有设置
  chrome.storage.sync.get(null, function(stored) {
    // 使用新的分层结构
    if (!stored.general) {
      // 如果没有设置，初始化一个新结构
      stored = {
        general: {},
        providers: {},
        display: {},
        performance: {},
        debug: {}
      };
    }
    
    // 更新设置
    stored.general.enableTranslate = document.getElementById('enable-translate').checked;
    stored.general.enableAnnotate = document.getElementById('enable-annotate').checked;
    stored.general.targetLanguage = document.getElementById('target-language').value;
    stored.providers.current = document.getElementById('translation-provider').value;

    chrome.storage.sync.set(stored, function() {
      // 显示简短的保存提示
      const status = document.getElementById('status');
      status.textContent = i18n('settingsSaved');
      status.className = 'status success';
      
      // Send message to content script to apply new settings
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        if (tabs[0] && isValidTabUrl(tabs[0].url)) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'updateSettings',
            settings: stored
          }, function(response) {
            // Handle potential errors when content script is not available
            if (chrome.runtime.lastError) {
              console.log('Could not update content script settings:', chrome.runtime.lastError.message);
            }
          });
        }
      });

      // 更短的提示时间
      setTimeout(function() {
        status.textContent = '';
        status.className = 'status';
      }, 1500);
    });
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
