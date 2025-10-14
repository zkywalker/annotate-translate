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
  
  // DeepL API settings
  deeplApiKey: '',
  deeplUseFreeApi: true,
  
  // OpenAI API settings
  openaiApiKey: '',
  openaiModel: 'gpt-3.5-turbo',
  openaiBaseUrl: 'https://api.openai.com/v1',
  
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
  
  // Menu button size settings
  menuButtonSize: 'small', // 'small', 'medium', 'large'
  
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
  deeplApiKey: document.getElementById('deeplApiKey'),
  deeplUseFreeApi: document.getElementById('deeplUseFreeApi'),
  deeplConfigSection: document.getElementById('deeplConfigSection'),
  openaiApiKey: document.getElementById('openaiApiKey'),
  openaiModel: document.getElementById('openaiModel'),
  openaiBaseUrl: document.getElementById('openaiBaseUrl'),
  openaiConfigSection: document.getElementById('openaiConfigSection'),
  enablePhoneticFallback: document.getElementById('enablePhoneticFallback'),
  enableAudio: document.getElementById('enableAudio'),
  showPhonetics: document.getElementById('showPhonetics'),
  showDefinitions: document.getElementById('showDefinitions'),
  showExamples: document.getElementById('showExamples'),
  maxExamples: document.getElementById('maxExamples'),
  autoCloseDelay: document.getElementById('autoCloseDelay'),
  showPhoneticInAnnotation: document.getElementById('showPhoneticInAnnotation'),
  enableAudio: document.getElementById('enableAudio'),
  menuButtonSize: document.getElementById('menuButtonSize'),
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
    
    // DeepL API settings
    elements.deeplApiKey.value = settings.deeplApiKey || '';
    elements.deeplUseFreeApi.checked = settings.deeplUseFreeApi !== false;
    
    // OpenAI API settings
    elements.openaiApiKey.value = settings.openaiApiKey || '';
    elements.openaiModel.value = settings.openaiModel || 'gpt-3.5-turbo';
    elements.openaiBaseUrl.value = settings.openaiBaseUrl || 'https://api.openai.com/v1';
    
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
  elements.menuButtonSize.value = settings.menuButtonSize || 'small';
    
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
    
    // DeepL API settings
    deeplApiKey: elements.deeplApiKey.value.trim(),
    deeplUseFreeApi: elements.deeplUseFreeApi.checked,
    
    // OpenAI API settings
    openaiApiKey: elements.openaiApiKey.value.trim(),
    openaiModel: elements.openaiModel.value,
    openaiBaseUrl: elements.openaiBaseUrl.value.trim() || 'https://api.openai.com/v1',
    
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
  menuButtonSize: elements.menuButtonSize.value,
    
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
  
  // Show/hide DeepL config section
  if (provider === 'deepl') {
    elements.deeplConfigSection.style.display = 'block';
  } else {
    elements.deeplConfigSection.style.display = 'none';
  }
  
  // Show/hide OpenAI config section
  if (provider === 'openai') {
    elements.openaiConfigSection.style.display = 'block';
  } else {
    elements.openaiConfigSection.style.display = 'none';
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
 * Show number input dialog
 */
function showNumberInputDialog(options) {
  const { title, label, currentValue, min, max, step = 1, unit = '', onSave } = options;
  
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>${title}</h3>
      <button class="dialog-close" aria-label="Close">×</button>
    </div>
    <div class="dialog-body">
      <label class="dialog-label">${label}</label>
      <div class="dialog-input-group">
        <input type="number" class="dialog-input" value="${currentValue}" min="${min}" max="${max}" step="${step}">
        ${unit ? `<span class="dialog-unit">${unit}</span>` : ''}
      </div>
      <div class="dialog-hint">范围：${min} - ${max}</div>
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary dialog-cancel">取消</button>
      <button class="btn btn-primary dialog-save">保存</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  const input = dialog.querySelector('.dialog-input');
  const closeBtn = dialog.querySelector('.dialog-close');
  const cancelBtn = dialog.querySelector('.dialog-cancel');
  const saveBtn = dialog.querySelector('.dialog-save');
  
  // Focus input and select
  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);
  
  // Close dialog function
  const closeDialog = () => {
    overlay.classList.add('closing');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 200);
  };
  
  // Validate input
  const validateInput = () => {
    let value = parseInt(input.value, 10);
    if (isNaN(value)) value = currentValue;
    if (value < min) value = min;
    if (value > max) value = max;
    input.value = value;
    return value;
  };
  
  // Event listeners
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });
  
  saveBtn.addEventListener('click', () => {
    const value = validateInput();
    onSave(value);
    closeDialog();
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const value = validateInput();
      onSave(value);
      closeDialog();
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  });
  
  input.addEventListener('blur', validateInput);
  
  // Show overlay with animation
  setTimeout(() => overlay.classList.add('show'), 10);
}

/**
 * Show text input dialog
 */
function showTextInputDialog(options) {
  const { title, label, currentValue, placeholder = '', type = 'text', hint = '', onSave } = options;
  
  // Create dialog overlay
  const overlay = document.createElement('div');
  overlay.className = 'dialog-overlay';
  
  // Create dialog
  const dialog = document.createElement('div');
  dialog.className = 'dialog';
  dialog.innerHTML = `
    <div class="dialog-header">
      <h3>${title}</h3>
      <button class="dialog-close" aria-label="Close">×</button>
    </div>
    <div class="dialog-body">
      <label class="dialog-label">${label}</label>
      <input type="${type}" class="dialog-input dialog-input-text" value="${currentValue}" placeholder="${placeholder}">
      ${hint ? `<div class="dialog-hint">${hint}</div>` : ''}
    </div>
    <div class="dialog-footer">
      <button class="btn btn-secondary dialog-cancel">取消</button>
      <button class="btn btn-primary dialog-save">保存</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  
  const input = dialog.querySelector('.dialog-input');
  const closeBtn = dialog.querySelector('.dialog-close');
  const cancelBtn = dialog.querySelector('.dialog-cancel');
  const saveBtn = dialog.querySelector('.dialog-save');
  
  // Focus input and select
  setTimeout(() => {
    input.focus();
    input.select();
  }, 100);
  
  // Close dialog function
  const closeDialog = () => {
    overlay.classList.add('closing');
    setTimeout(() => {
      document.body.removeChild(overlay);
    }, 200);
  };
  
  // Event listeners
  closeBtn.addEventListener('click', closeDialog);
  cancelBtn.addEventListener('click', closeDialog);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeDialog();
  });
  
  saveBtn.addEventListener('click', () => {
    onSave(input.value);
    closeDialog();
  });
  
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      onSave(input.value);
      closeDialog();
    } else if (e.key === 'Escape') {
      closeDialog();
    }
  });
  
  // Show overlay with animation
  setTimeout(() => overlay.classList.add('show'), 10);
}

/**
 * Show auto-save indicator
 */
function showAutoSaveIndicator(message = '已自动保存') {
  const statusEl = document.getElementById('autoSaveStatus');
  if (statusEl) {
    statusEl.textContent = message;
    statusEl.classList.add('show');
    
    // Hide after 2 seconds
    setTimeout(() => {
      statusEl.classList.remove('show');
    }, 2000);
  }
}

/**
 * Auto-save settings (for checkboxes, radios, and selects)
 */
function autoSaveSettings() {
  // Get all current settings
  const settings = {
    // Feature toggles
    enableTranslate: elements.enableTranslate.checked,
    enableAnnotate: elements.enableAnnotate.checked,
    
    // UI language
    uiLanguage: elements.uiLanguage.value,
    
    // Translation provider
    translationProvider: document.querySelector('input[name="provider"]:checked').value,
    targetLanguage: elements.targetLanguage.value,
    
    // Youdao API settings (keep existing values from storage)
    youdaoAppKey: elements.youdaoAppKey.value,
    youdaoAppSecret: elements.youdaoAppSecret.value,
    
    // DeepL API settings
    deeplApiKey: elements.deeplApiKey.value,
    deeplUseFreeApi: elements.deeplUseFreeApi.checked,
    
    // UI toggles
    enableAudio: elements.enableAudio.checked,
    showPhonetics: elements.showPhonetics.checked,
    showDefinitions: elements.showDefinitions.checked,
    showExamples: elements.showExamples.checked,
    
    // Number settings (keep existing values)
    maxExamples: parseInt(elements.maxExamples.value, 10),
    autoCloseDelay: parseInt(elements.autoCloseDelay.value, 10),
    
    // Phonetic settings
    enablePhoneticFallback: elements.enablePhoneticFallback.checked,
    showPhoneticInAnnotation: elements.showPhoneticInAnnotation.checked,
    
    // Performance settings
    enableCache: elements.enableCache.checked,
    cacheSize: parseInt(elements.cacheSize.value, 10),
    
    // Debug settings
    enableDebugMode: elements.enableDebugMode.checked
  };
  
  // Save to storage
  chrome.storage.sync.set(settings, () => {
    console.log('[Options] Settings auto-saved:', settings);
    showAutoSaveIndicator();
  });
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Save button (manual save, now optional)
  elements.saveButton.addEventListener('click', saveSettings);
  
  // Reset button
  elements.resetButton.addEventListener('click', resetSettings);
  
  // Clear cache button
  elements.clearCacheButton.addEventListener('click', clearCache);
  
  // ============ Auto-save for checkboxes ============
  const autoSaveCheckboxes = [
    'enableTranslate',
    'enableAnnotate', 
    'enableAudio',
    'showPhonetics',
    'showDefinitions',
    'showExamples',
    'enablePhoneticFallback',
    'showPhoneticInAnnotation',
    'enableCache',
    'deeplUseFreeApi'
  ];
  
  autoSaveCheckboxes.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', autoSaveSettings);
    }
  });
  
  // Debug mode toggle (special handling for UI update)
  elements.enableDebugMode.addEventListener('change', (e) => {
    updateDebugProviderVisibility(e.target.checked);
    autoSaveSettings();
  });
  
  // ============ Auto-save for radio buttons ============
  // Provider radio buttons
  document.querySelectorAll('input[name="provider"]').forEach((radio) => {
    radio.addEventListener('change', (e) => {
      updateProviderSelection(e.target.value);
      autoSaveSettings();
    });
  });
  
  // ============ Auto-save for select dropdowns ============
  if (elements.uiLanguage) {
    elements.uiLanguage.addEventListener('change', autoSaveSettings);
  }
  if (elements.targetLanguage) {
    elements.targetLanguage.addEventListener('change', autoSaveSettings);
  }
  if (elements.menuButtonSize) {
    elements.menuButtonSize.addEventListener('change', autoSaveSettings);
  }
  
  // ============ Auto-save for text inputs (with debounce) ============
  if (elements.openaiModel) {
    let modelInputTimeout;
    elements.openaiModel.addEventListener('input', () => {
      clearTimeout(modelInputTimeout);
      modelInputTimeout = setTimeout(() => {
        autoSaveSettings();
      }, 1000); // 1秒延迟，避免每次输入都保存
    });
    // 失去焦点时立即保存
    elements.openaiModel.addEventListener('blur', () => {
      clearTimeout(modelInputTimeout);
      autoSaveSettings();
    });
  }
  
  if (elements.openaiBaseUrl) {
    let baseUrlInputTimeout;
    elements.openaiBaseUrl.addEventListener('input', () => {
      clearTimeout(baseUrlInputTimeout);
      baseUrlInputTimeout = setTimeout(() => {
        autoSaveSettings();
      }, 1000);
    });
    elements.openaiBaseUrl.addEventListener('blur', () => {
      clearTimeout(baseUrlInputTimeout);
      autoSaveSettings();
    });
  }
  
  // Radio item click handlers
  document.querySelectorAll('.radio-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.tagName !== 'INPUT') {
        const radio = item.querySelector('input[type="radio"]');
        if (radio && !radio.checked) {
          radio.checked = true;
          updateProviderSelection(radio.value);
          autoSaveSettings();
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
          // Auto-save after checkbox change
          autoSaveSettings();
        }
      }
    });
  });
  
  // Validate number inputs (but don't auto-save yet - they need dialog)
  // Click to edit number inputs with dialog
  const maxExamplesWrapper = elements.maxExamples.closest('.setting-item');
  if (maxExamplesWrapper) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.maxExamples.readOnly = true;
    elements.maxExamples.style.cursor = 'pointer';
    elements.maxExamples.parentElement.style.position = 'relative';
    elements.maxExamples.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showNumberInputDialog({
        title: '最大示例数量',
        label: '设置要显示的例句数量',
        currentValue: parseInt(elements.maxExamples.value, 10),
        min: 1,
        max: 10,
        unit: '条',
        onSave: (value) => {
          elements.maxExamples.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.maxExamples.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  const autoCloseDelayWrapper = elements.autoCloseDelay.closest('.setting-item');
  if (autoCloseDelayWrapper) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.autoCloseDelay.readOnly = true;
    elements.autoCloseDelay.style.cursor = 'pointer';
    elements.autoCloseDelay.parentElement.style.position = 'relative';
    elements.autoCloseDelay.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showNumberInputDialog({
        title: '自动关闭延迟',
        label: '设置翻译弹窗自动关闭的延迟时间',
        currentValue: parseInt(elements.autoCloseDelay.value, 10),
        min: 0,
        max: 60,
        unit: '秒',
        onSave: (value) => {
          elements.autoCloseDelay.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.autoCloseDelay.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  const cacheSizeWrapper = elements.cacheSize.closest('.setting-item');
  if (cacheSizeWrapper) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.cacheSize.readOnly = true;
    elements.cacheSize.style.cursor = 'pointer';
    elements.cacheSize.parentElement.style.position = 'relative';
    elements.cacheSize.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showNumberInputDialog({
        title: '缓存大小',
        label: '设置缓存的最大翻译条目数',
        currentValue: parseInt(elements.cacheSize.value, 10),
        min: 10,
        max: 500,
        unit: '条',
        onSave: (value) => {
          elements.cacheSize.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.cacheSize.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  // Click to edit text inputs (API keys) with dialog
  if (elements.youdaoAppKey) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.youdaoAppKey.readOnly = true;
    elements.youdaoAppKey.style.cursor = 'pointer';
    elements.youdaoAppKey.parentElement.style.position = 'relative';
    elements.youdaoAppKey.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showTextInputDialog({
        title: '有道 App Key',
        label: '输入您的有道 App Key',
        currentValue: elements.youdaoAppKey.value,
        placeholder: '请输入 App Key',
        type: 'text',
        hint: '从有道 AI 开放平台获取',
        onSave: (value) => {
          elements.youdaoAppKey.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.youdaoAppKey.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  if (elements.youdaoAppSecret) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.youdaoAppSecret.readOnly = true;
    elements.youdaoAppSecret.style.cursor = 'pointer';
    elements.youdaoAppSecret.type = 'password';
    elements.youdaoAppSecret.parentElement.style.position = 'relative';
    elements.youdaoAppSecret.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showTextInputDialog({
        title: '有道 App Secret',
        label: '输入您的有道 App Secret',
        currentValue: elements.youdaoAppSecret.value,
        placeholder: '请输入 App Secret',
        type: 'password',
        hint: '密钥将安全存储在本地',
        onSave: (value) => {
          elements.youdaoAppSecret.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.youdaoAppSecret.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  if (elements.deeplApiKey) {
    const editIcon = document.createElement('i');
    editIcon.setAttribute('data-lucide', 'edit-3');
    editIcon.className = 'input-edit-icon';
    editIcon.title = '点击编辑';
    
    elements.deeplApiKey.readOnly = true;
    elements.deeplApiKey.style.cursor = 'pointer';
    elements.deeplApiKey.type = 'password';
    elements.deeplApiKey.parentElement.style.position = 'relative';
    elements.deeplApiKey.parentElement.appendChild(editIcon);
    
    const openDialog = () => {
      showTextInputDialog({
        title: 'DeepL API Key',
        label: '输入您的 DeepL API Key',
        currentValue: elements.deeplApiKey.value,
        placeholder: '请输入 API Key',
        type: 'password',
        hint: 'API Key 将安全存储在本地',
        onSave: (value) => {
          elements.deeplApiKey.value = value;
          autoSaveSettings();
        }
      });
    };
    
    elements.deeplApiKey.addEventListener('click', openDialog);
    editIcon.addEventListener('click', openDialog);
  }
  
  // Initialize Lucide icons after adding edit icons
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);
