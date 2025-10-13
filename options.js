/**
 * Options page script for Annotate Translate
 * Handles loading, saving, and resetting settings
 */

// Default settings
const DEFAULT_SETTINGS = {
  // Feature toggles
  enableTranslate: true,
  enableAnnotate: true,
  
  // UI settings
  uiLanguage: 'auto', // 'auto' means follow browser language
  
  // Translation settings
  translationProvider: 'google',
  targetLanguage: 'zh-CN',
  
  // Youdao API settings
  youdaoAppKey: '',
  youdaoAppSecret: '',
  enablePhoneticFallback: true, // 默认启用音标补充
  
  // UI settings
  enableAudio: true,
  showPhonetics: true,
  showDefinitions: true,
  showExamples: true,
  maxExamples: 3,
  autoCloseDelay: 10,
  
  // Annotation settings
  showPhoneticInAnnotation: true,
  enableAudio: true,
  
  // Performance settings
  enableCache: true,
  cacheSize: 100,
  
  // Debug settings
  enableDebugMode: false
};

// DOM elements
const elements = {
  enableTranslate: document.getElementById('enableTranslate'),
  enableAnnotate: document.getElementById('enableAnnotate'),
  uiLanguage: document.getElementById('uiLanguage'),
  targetLanguage: document.getElementById('targetLanguage'),
  youdaoAppKey: document.getElementById('youdaoAppKey'),
  youdaoAppSecret: document.getElementById('youdaoAppSecret'),
  youdaoConfigSection: document.getElementById('youdaoConfigSection'),
  enablePhoneticFallback: document.getElementById('enablePhoneticFallback'),
  enableAudio: document.getElementById('enableAudio'),
  showPhonetics: document.getElementById('showPhonetics'),
  showDefinitions: document.getElementById('showDefinitions'),
  showExamples: document.getElementById('showExamples'),
  maxExamples: document.getElementById('maxExamples'),
  autoCloseDelay: document.getElementById('autoCloseDelay'),
  showPhoneticInAnnotation: document.getElementById('showPhoneticInAnnotation'),
  enableAudio: document.getElementById('enableAudio'),
  enableCache: document.getElementById('enableCache'),
  cacheSize: document.getElementById('cacheSize'),
  enableDebugMode: document.getElementById('enableDebugMode'),
  debugProviderOption: document.getElementById('debugProviderOption'),
  debugProviderDesc: document.getElementById('debugProviderDesc'),
  statusMessage: document.getElementById('statusMessage'),
  saveButton: document.getElementById('saveButton'),
  resetButton: document.getElementById('resetButton'),
  clearCacheButton: document.getElementById('clearCacheButton')
};

/**
 * Initialize the options page
 */
async function init() {
  console.log('[Options] Initializing options page...');
  
  // Initialize i18n (load user-selected language first)
  await initializeLanguage();
  localizeHtmlPage();
  
  // Populate language select with localized options
  populateLanguageSelect();
  
  // Load settings
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('[Options] Options page initialized');
}

/**
 * Populate language select with localized options
 */
function populateLanguageSelect() {
  const targetSelect = elements.targetLanguage;
  const uiSelect = elements.uiLanguage;
  
  const languages = [
    { value: 'zh-CN', labelKey: 'langChineseSimplified', nativeName: '中文（简体）' },
    { value: 'zh-TW', labelKey: 'langChineseTraditional', nativeName: '中文（繁體）' },
    { value: 'en', labelKey: 'langEnglish', nativeName: 'English' },
    { value: 'ja', labelKey: 'langJapanese', nativeName: '日本語' },
    { value: 'ko', labelKey: 'langKorean', nativeName: '한국어' },
    { value: 'es', labelKey: 'langSpanish', nativeName: 'Español' },
    { value: 'fr', labelKey: 'langFrench', nativeName: 'Français' },
    { value: 'de', labelKey: 'langGerman', nativeName: 'Deutsch' },
    { value: 'ru', labelKey: 'langRussian', nativeName: 'Русский' }
  ];
  
  // Populate target language select
  if (targetSelect) {
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = i18n(lang.labelKey);
      targetSelect.appendChild(option);
    });
  }
  
  // Populate UI language select
  if (uiSelect) {
    // Add "Auto" option
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = i18n('autoDetect') || '🌐 Auto Detect';
    uiSelect.appendChild(autoOption);
    
    // Add language options (using native names for better recognition)
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.nativeName;
      uiSelect.appendChild(option);
    });
  }
}

/**
 * Load settings from chrome.storage
 */
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    console.log('[Options] Loaded settings:', settings);
    
    // 检查并修正状态不一致：如果 debug 模式关闭但提供者是 debug，则切换到 google
    if (settings.translationProvider === 'debug' && !settings.enableDebugMode) {
      console.log('[Options] Debug mode is off but provider is debug, switching to google');
      settings.translationProvider = 'google';
      // 更新存储
      chrome.storage.sync.set({ translationProvider: 'google' });
    }
    
    // Feature toggles
    elements.enableTranslate.checked = settings.enableTranslate;
    elements.enableAnnotate.checked = settings.enableAnnotate;
    
    // Debug settings (must be set first to determine provider visibility)
    elements.enableDebugMode.checked = settings.enableDebugMode;
    updateDebugProviderVisibility(settings.enableDebugMode);
    
    // Translation provider
    const providerRadio = document.querySelector(`input[name="provider"][value="${settings.translationProvider}"]`);
    if (providerRadio) {
      providerRadio.checked = true;
      updateProviderSelection(settings.translationProvider);
    }
    
    // Language settings
    elements.uiLanguage.value = settings.uiLanguage || 'auto';
    // Store current value to detect changes
    elements.uiLanguage.dataset.previousValue = settings.uiLanguage || 'auto';
    elements.targetLanguage.value = settings.targetLanguage;
    
    // Youdao API settings
    elements.youdaoAppKey.value = settings.youdaoAppKey || '';
    elements.youdaoAppSecret.value = settings.youdaoAppSecret || '';
    elements.enablePhoneticFallback.checked = settings.enablePhoneticFallback !== false;
    
    // UI settings
    elements.enableAudio.checked = settings.enableAudio;
    elements.showPhonetics.checked = settings.showPhonetics;
    elements.showDefinitions.checked = settings.showDefinitions;
    elements.showExamples.checked = settings.showExamples;
    elements.maxExamples.value = settings.maxExamples;
    elements.autoCloseDelay.value = settings.autoCloseDelay;
    
  // Annotation settings
  elements.showPhoneticInAnnotation.checked = settings.showPhoneticInAnnotation;
  elements.enableAudio.checked = settings.enableAudio;
    
    // Performance settings
    elements.enableCache.checked = settings.enableCache;
    elements.cacheSize.value = settings.cacheSize;
  });
}

/**
 * Save settings to chrome.storage
 */
function saveSettings() {
  const previousUiLanguage = elements.uiLanguage.dataset.previousValue || 'auto';
  const newUiLanguage = elements.uiLanguage.value;
  const languageChanged = previousUiLanguage !== newUiLanguage;
  
  // 获取选中的翻译提供者
  let selectedProvider = document.querySelector('input[name="provider"]:checked').value;
  const debugModeEnabled = elements.enableDebugMode.checked;
  
  // 如果 debug 模式关闭但选中的是 debug 提供者，则强制切换到 google
  if (selectedProvider === 'debug' && !debugModeEnabled) {
    console.log('[Options] Cannot select debug provider when debug mode is off, switching to google');
    selectedProvider = 'google';
    // 更新 UI
    const googleRadio = document.querySelector('input[name="provider"][value="google"]');
    if (googleRadio) {
      googleRadio.checked = true;
      updateProviderSelection('google');
    }
  }
  
  const settings = {
    // Feature toggles
    enableTranslate: elements.enableTranslate.checked,
    enableAnnotate: elements.enableAnnotate.checked,
    
    // UI language
    uiLanguage: newUiLanguage,
    
    // Translation provider
    translationProvider: selectedProvider,
    targetLanguage: elements.targetLanguage.value,
    
    // Youdao API settings
    youdaoAppKey: elements.youdaoAppKey.value.trim(),
    youdaoAppSecret: elements.youdaoAppSecret.value.trim(),
    enablePhoneticFallback: elements.enablePhoneticFallback.checked,
    
    // UI settings
    enableAudio: elements.enableAudio.checked,
    showPhonetics: elements.showPhonetics.checked,
    showDefinitions: elements.showDefinitions.checked,
    showExamples: elements.showExamples.checked,
    maxExamples: parseInt(elements.maxExamples.value, 10),
    autoCloseDelay: parseInt(elements.autoCloseDelay.value, 10),
    
  // Annotation settings
  showPhoneticInAnnotation: elements.showPhoneticInAnnotation.checked,
  enableAudio: elements.enableAudio.checked,
    
    // Performance settings
    enableCache: elements.enableCache.checked,
    cacheSize: parseInt(elements.cacheSize.value, 10),
    
    // Debug settings
    enableDebugMode: elements.enableDebugMode.checked
  };

  console.log('[Options] Saving settings:', settings);

  chrome.storage.sync.set(settings, () => {
    console.log('[Options] Settings saved successfully');
    
    // If language changed, show reload message
    if (languageChanged) {
      showStatus(i18n('languageChangedReload') || 'Language changed! Reloading page...', 'success');
      
      // Store the new language value
      elements.uiLanguage.dataset.previousValue = newUiLanguage;
      
      // Reload the page after a short delay to apply new language
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      showStatus(i18n('settingsSaved'), 'success');
    }
    
    // Notify content scripts to reload settings
    notifyContentScripts(settings);
  });
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  // Use i18n for confirm message (note: confirm dialogs are system-level and don't support i18n, but we try)
  const confirmMessage = i18n('confirmReset') || 'Are you sure you want to reset all settings to defaults?';
  if (confirm(confirmMessage)) {
    console.log('[Options] Resetting to default settings...');
    
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      console.log('[Options] Settings reset successfully');
      showStatus(i18n('settingsReset'), 'success');
      loadSettings();
      
      // Notify content scripts
      notifyContentScripts(DEFAULT_SETTINGS);
    });
  }
}

/**
 * Clear translation cache
 */
function clearCache() {
  const confirmMessage = i18n('confirmClearCache') || 'Are you sure you want to clear the translation cache?';
  if (confirm(confirmMessage)) {
    console.log('[Options] Clearing cache...');
    
    // Send message to background script to clear cache
    chrome.runtime.sendMessage({
      action: 'clearCache'
    }, (response) => {
      if (response && response.success) {
        console.log('[Options] Cache cleared successfully');
        showStatus(i18n('cacheCleared'), 'success');
      } else {
        console.error('[Options] Failed to clear cache');
        showStatus(i18n('failedToClearCache') || 'Failed to clear cache', 'error');
      }
    });
  }
}

/**
 * Notify content scripts about settings change
 */
function notifyContentScripts(settings) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: settings
      }, (response) => {
        // Ignore errors for tabs that don't have content script
        if (chrome.runtime.lastError) {
          console.log('[Options] Could not notify tab:', tab.id);
        }
      });
    });
  });
}

/**
 * Show status message
 */
function showStatus(message, type = 'success') {
  elements.statusMessage.textContent = message;
  elements.statusMessage.className = `status-message ${type}`;
  
  setTimeout(() => {
    elements.statusMessage.className = 'status-message';
  }, 3000);
}

/**
 * Update provider selection UI
 */
function updateProviderSelection(provider) {
  document.querySelectorAll('.radio-item').forEach((item) => {
    item.classList.remove('selected');
  });
  
  const selectedItem = document.querySelector(`input[name="provider"][value="${provider}"]`);
  if (selectedItem) {
    selectedItem.closest('.radio-item').classList.add('selected');
  }
  
  // Show/hide Youdao config section
  if (provider === 'youdao') {
    elements.youdaoConfigSection.style.display = 'block';
  } else {
    elements.youdaoConfigSection.style.display = 'none';
  }
  
  // Show/hide debug provider description
  if (provider === 'debug') {
    elements.debugProviderDesc.style.display = 'block';
  } else {
    elements.debugProviderDesc.style.display = 'none';
  }
}

/**
 * Update debug provider visibility
 */
function updateDebugProviderVisibility(enabled) {
  if (enabled) {
    elements.debugProviderOption.style.display = 'flex';
  } else {
    elements.debugProviderOption.style.display = 'none';
    // If debug provider is currently selected, switch to google
    const debugRadio = document.querySelector('input[name="provider"][value="debug"]');
    if (debugRadio && debugRadio.checked) {
      const googleRadio = document.querySelector('input[name="provider"][value="google"]');
      if (googleRadio) {
        googleRadio.checked = true;
        updateProviderSelection('google');
      }
    }
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Save button
  elements.saveButton.addEventListener('click', saveSettings);
  
  // Reset button
  elements.resetButton.addEventListener('click', resetSettings);
  
  // Clear cache button
  elements.clearCacheButton.addEventListener('click', clearCache);
  
  // Debug mode toggle
  elements.enableDebugMode.addEventListener('change', (e) => {
    updateDebugProviderVisibility(e.target.checked);
  });
  
  // Provider radio buttons
  document.querySelectorAll('input[name="provider"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      updateProviderSelection(e.target.value);
    });
  });
  
  // Radio item click handlers
  document.querySelectorAll('.radio-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const radio = item.querySelector('input[type="radio"]');
        if (radio) {
          radio.checked = true;
          updateProviderSelection(radio.value);
        }
      }
    });
  });
  
  // Checkbox item click handlers
  document.querySelectorAll('.checkbox-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
          checkbox.checked = !checkbox.checked;
          // If it's the debug mode checkbox, trigger the visibility update
          if (checkbox.id === 'enableDebugMode') {
            updateDebugProviderVisibility(checkbox.checked);
          }
        }
      }
    });
  });
  
  // Validate number inputs
  elements.maxExamples.addEventListener('change', () => {
    const value = parseInt(elements.maxExamples.value, 10);
    if (value < 1) elements.maxExamples.value = 1;
    if (value > 10) elements.maxExamples.value = 10;
  });
  
  elements.autoCloseDelay.addEventListener('change', () => {
    const value = parseInt(elements.autoCloseDelay.value, 10);
    if (value < 0) elements.autoCloseDelay.value = 0;
    if (value > 60) elements.autoCloseDelay.value = 60;
  });
  
  elements.cacheSize.addEventListener('change', () => {
    const value = parseInt(elements.cacheSize.value, 10);
    if (value < 10) elements.cacheSize.value = 10;
    if (value > 500) elements.cacheSize.value = 500;
  });
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
