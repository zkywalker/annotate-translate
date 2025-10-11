/**
 * Options page script for Annotate Translate
 * Handles loading, saving, and resetting settings
 */

// Default settings
const DEFAULT_SETTINGS = {
  // Feature toggles
  enableTranslate: true,
  enableAnnotate: true,
  
  // Translation settings
  translationProvider: 'debug',
  targetLanguage: 'zh-CN',
  
  // UI settings
  enableAudio: true,
  showPhonetics: true,
  showDefinitions: true,
  showExamples: true,
  maxExamples: 3,
  autoCloseDelay: 10,
  
  // Performance settings
  enableCache: true,
  cacheSize: 100,
  
  // Debug settings
  enableDebugMode: false,
  showConsoleLog: false
};

// DOM elements
const elements = {
  enableTranslate: document.getElementById('enableTranslate'),
  enableAnnotate: document.getElementById('enableAnnotate'),
  targetLanguage: document.getElementById('targetLanguage'),
  enableAudio: document.getElementById('enableAudio'),
  showPhonetics: document.getElementById('showPhonetics'),
  showDefinitions: document.getElementById('showDefinitions'),
  showExamples: document.getElementById('showExamples'),
  maxExamples: document.getElementById('maxExamples'),
  autoCloseDelay: document.getElementById('autoCloseDelay'),
  enableCache: document.getElementById('enableCache'),
  cacheSize: document.getElementById('cacheSize'),
  enableDebugMode: document.getElementById('enableDebugMode'),
  showConsoleLog: document.getElementById('showConsoleLog'),
  statusMessage: document.getElementById('statusMessage'),
  saveButton: document.getElementById('saveButton'),
  resetButton: document.getElementById('resetButton'),
  clearCacheButton: document.getElementById('clearCacheButton')
};

/**
 * Initialize the options page
 */
function init() {
  console.log('[Options] Initializing options page...');
  
  // Load settings
  loadSettings();
  
  // Set up event listeners
  setupEventListeners();
  
  console.log('[Options] Options page initialized');
}

/**
 * Load settings from chrome.storage
 */
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    console.log('[Options] Loaded settings:', settings);
    
    // Feature toggles
    elements.enableTranslate.checked = settings.enableTranslate;
    elements.enableAnnotate.checked = settings.enableAnnotate;
    
    // Translation provider
    const providerRadio = document.querySelector(`input[name="provider"][value="${settings.translationProvider}"]`);
    if (providerRadio) {
      providerRadio.checked = true;
      updateProviderSelection(settings.translationProvider);
    }
    
    // Language settings
    elements.targetLanguage.value = settings.targetLanguage;
    
    // UI settings
    elements.enableAudio.checked = settings.enableAudio;
    elements.showPhonetics.checked = settings.showPhonetics;
    elements.showDefinitions.checked = settings.showDefinitions;
    elements.showExamples.checked = settings.showExamples;
    elements.maxExamples.value = settings.maxExamples;
    elements.autoCloseDelay.value = settings.autoCloseDelay;
    
    // Performance settings
    elements.enableCache.checked = settings.enableCache;
    elements.cacheSize.value = settings.cacheSize;
    
    // Debug settings
    elements.enableDebugMode.checked = settings.enableDebugMode;
    elements.showConsoleLog.checked = settings.showConsoleLog;
  });
}

/**
 * Save settings to chrome.storage
 */
function saveSettings() {
  const settings = {
    // Feature toggles
    enableTranslate: elements.enableTranslate.checked,
    enableAnnotate: elements.enableAnnotate.checked,
    
    // Translation provider
    translationProvider: document.querySelector('input[name="provider"]:checked').value,
    targetLanguage: elements.targetLanguage.value,
    
    // UI settings
    enableAudio: elements.enableAudio.checked,
    showPhonetics: elements.showPhonetics.checked,
    showDefinitions: elements.showDefinitions.checked,
    showExamples: elements.showExamples.checked,
    maxExamples: parseInt(elements.maxExamples.value, 10),
    autoCloseDelay: parseInt(elements.autoCloseDelay.value, 10),
    
    // Performance settings
    enableCache: elements.enableCache.checked,
    cacheSize: parseInt(elements.cacheSize.value, 10),
    
    // Debug settings
    enableDebugMode: elements.enableDebugMode.checked,
    showConsoleLog: elements.showConsoleLog.checked
  };

  console.log('[Options] Saving settings:', settings);

  chrome.storage.sync.set(settings, () => {
    console.log('[Options] Settings saved successfully');
    showStatus('Settings saved successfully! ✓', 'success');
    
    // Notify content scripts to reload settings
    notifyContentScripts(settings);
  });
}

/**
 * Reset settings to defaults
 */
function resetSettings() {
  if (confirm('Are you sure you want to reset all settings to defaults?')) {
    console.log('[Options] Resetting to default settings...');
    
    chrome.storage.sync.set(DEFAULT_SETTINGS, () => {
      console.log('[Options] Settings reset successfully');
      showStatus('Settings reset to defaults! 🔄', 'success');
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
  if (confirm('Are you sure you want to clear the translation cache?')) {
    console.log('[Options] Clearing cache...');
    
    // Send message to background script to clear cache
    chrome.runtime.sendMessage({
      action: 'clearCache'
    }, (response) => {
      if (response && response.success) {
        console.log('[Options] Cache cleared successfully');
        showStatus('Cache cleared successfully! 🗑️', 'success');
      } else {
        console.error('[Options] Failed to clear cache');
        showStatus('Failed to clear cache', 'error');
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
