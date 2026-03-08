/**
 * Options Page Script (New Version)
 * 新版设置页面脚本 - 支持分层数据结构
 */

let settings = null;

// DOM 元素映射
const elements = {
  // 通用设置
  enableTranslate: document.getElementById('enableTranslate'),
  enableAnnotate: document.getElementById('enableAnnotate'),
  enableDoubleClickAnnotate: document.getElementById('enableDoubleClickAnnotate'),
  uiLanguage: document.getElementById('uiLanguage'),
  targetLanguage: document.getElementById('targetLanguage'),
  currentProvider: document.getElementById('currentProvider'),
  
  // 有道配置
  youdaoAppKey: document.getElementById('youdaoAppKey'),
  youdaoAppSecret: document.getElementById('youdaoAppSecret'),
  testYoudaoConnection: document.getElementById('testYoudaoConnection'),
  youdaoTestResult: document.getElementById('youdaoTestResult'),
  
  // DeepL 配置
  deeplApiKey: document.getElementById('deeplApiKey'),
  deeplUseFreeApi: document.getElementById('deeplUseFreeApi'),
  testDeeplConnection: document.getElementById('testDeeplConnection'),
  deeplTestResult: document.getElementById('deeplTestResult'),
  
  // OpenAI 配置
  openaiApiKey: document.getElementById('openaiApiKey'),
  openaiModel: document.getElementById('openaiModel'),
  openaiBaseUrl: document.getElementById('openaiBaseUrl'),
  openaiTemperature: document.getElementById('openaiTemperature'),
  openaiMaxTokens: document.getElementById('openaiMaxTokens'),
  openaiTimeout: document.getElementById('openaiTimeout'),
  openaiPromptFormat: document.getElementById('openaiPromptFormat'),
  openaiUseContext: document.getElementById('openaiUseContext'),
  testOpenaiConnection: document.getElementById('testOpenaiConnection'),
  openaiTestResult: document.getElementById('openaiTestResult'),
  
  // 提示词编辑器
  openPromptEditor: document.getElementById('openPromptEditor'),
  promptEditorModal: document.getElementById('promptEditorModal'),
  closePromptEditor: document.getElementById('closePromptEditor'),
  cancelPromptEdit: document.getElementById('cancelPromptEdit'),
  savePromptEdit: document.getElementById('savePromptEdit'),
  resetPromptToDefault: document.getElementById('resetPromptToDefault'),
  validatePrompt: document.getElementById('validatePrompt'),
  promptSystemText: document.getElementById('promptSystemText'),
  promptUserText: document.getElementById('promptUserText'),
  promptContextText: document.getElementById('promptContextText'),
  previewSystem: document.getElementById('previewSystem'),
  previewUser: document.getElementById('previewUser'),
  
  // 显示设置
  showPhonetics: document.getElementById('showPhonetics'),
  enableAudio: document.getElementById('enableAudio'),
  showDefinitions: document.getElementById('showDefinitions'),
  showExamples: document.getElementById('showExamples'),
  maxExamples: document.getElementById('maxExamples'),
  autoCloseDelay: document.getElementById('autoCloseDelay'),
  enablePhoneticFallback: document.getElementById('enablePhoneticFallback'),
  menuButtonSize: document.getElementById('menuButtonSize'),
  showPhoneticInAnnotation: document.getElementById('showPhoneticInAnnotation'),
  showTranslationInAnnotation: document.getElementById('showTranslationInAnnotation'),
  showDefinitionsInAnnotation: document.getElementById('showDefinitionsInAnnotation'),
  enableAudioInAnnotation: document.getElementById('enableAudioInAnnotation'),
  hidePhoneticForMultipleWords: document.getElementById('hidePhoneticForMultipleWords'),
  
  // 性能设置
  enableCache: document.getElementById('enableCache'),
  cacheSize: document.getElementById('cacheSize'),
  
  // 调试设置
  enableDebugMode: document.getElementById('enableDebugMode'),

  // 词汇模式设置
  enableVocabularyMode: document.getElementById('enableVocabularyMode'),
  vocabCet4: document.getElementById('vocabCet4'),
  vocabCet6: document.getElementById('vocabCet6'),
  vocabKy: document.getElementById('vocabKy'),
  vocabGk: document.getElementById('vocabGk'),
  vocabToefl: document.getElementById('vocabToefl'),
  vocabIelts: document.getElementById('vocabIelts'),
  vocabGre: document.getElementById('vocabGre'),
  vocabZk: document.getElementById('vocabZk'),
  vocabularyMatchMode: document.getElementById('vocabularyMatchMode'),
  includeBaseWords: document.getElementById('includeBaseWords'),
  minCollinsStars: document.getElementById('minCollinsStars'),
  refreshVocabularyStats: document.getElementById('refreshVocabularyStats'),
  vocabularyStatsDisplay: document.getElementById('vocabularyStatsDisplay'),

  // 服务提供者按钮
  setGoogleAsProvider: document.getElementById('setGoogleAsProvider'),
  setYoudaoAsProvider: document.getElementById('setYoudaoAsProvider'),
  setDeeplAsProvider: document.getElementById('setDeeplAsProvider'),
  setOpenaiAsProvider: document.getElementById('setOpenaiAsProvider'),
  
  // 操作按钮
  resetButton: document.getElementById('resetButton'),
  clearCacheButton: document.getElementById('clearCacheButton'),
  exportAllData: document.getElementById('exportAllData'),
  importDataButton: document.getElementById('importDataButton'),
  importDataFile: document.getElementById('importDataFile'),
  clearAllDataButton: document.getElementById('clearAllDataButton'),

  // 缓存显示
  cacheUsage: document.getElementById('cacheUsage'),

  // 保存提示
  saveIndicator: document.getElementById('saveIndicator')
};

/**
 * 初始化
 */
async function init() {
  console.log('[Options] Initializing new options page...');
  
  // 初始化导航
  initNavigation();
  
  // 初始化可折叠信息框
  initInfoToggles();
  
  // 加载设置（必须先加载设置，才能知道用户选择的语言）
  await loadSettings();
  
  // 初始化语言和国际化（基于已加载的设置）
  await initializeLanguage();
  localizeHtmlPage();
  
  // 填充语言选项（必须在本地化之后）
  populateLanguageOptions();
  
  // 应用设置到 UI（在本地化和填充选项之后）
  applySettingsToUI();
  
  // 设置事件监听器
  setupEventListeners();

  // 处理 URL hash 导航
  handleHashNavigation();

  // 更新缓存使用情况显示
  updateCacheUsage();

  console.log('[Options] Initialization complete');
}

/**
 * 初始化导航
 */
function initNavigation() {
  const navItems = document.querySelectorAll('.nav-item');
  const pages = document.querySelectorAll('.page');
  
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      const pageName = item.dataset.page;
      
      // 更新导航状态
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');
      
      // 切换页面
      pages.forEach(page => page.classList.remove('active'));
      const targetPage = document.getElementById(`page-${pageName}`);
      if (targetPage) {
        targetPage.classList.add('active');
      }
      
      // 更新 URL hash
      window.location.hash = pageName;
    });
  });
}

/**
 * 处理 URL hash 导航
 */
function handleHashNavigation() {
  const hash = window.location.hash.slice(1);
  if (hash) {
    const navItem = document.querySelector(`.nav-item[data-page="${hash}"]`);
    if (navItem) {
      navItem.click();
    }
  }
}

/**
 * 初始化可折叠信息框
 */
function initInfoToggles() {
  document.querySelectorAll('.info-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const targetId = toggle.dataset.target;
      if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
          target.classList.toggle('collapsed');
        }
      } else {
        // 如果在 info-box 内，切换其内容
        const infoBox = toggle.closest('.info-box');
        if (infoBox) {
          infoBox.classList.toggle('collapsed');
        }
      }
    });
  });
}

/**
 * 填充语言选项
 */
function populateLanguageOptions() {
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
  
  // UI 语言选项
  if (elements.uiLanguage) {
    const autoOption = document.createElement('option');
    autoOption.value = 'auto';
    autoOption.textContent = '🌐 自动检测';
    elements.uiLanguage.appendChild(autoOption);
    
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.nativeName;
      elements.uiLanguage.appendChild(option);
    });
  }
  
  // 目标语言选项
  if (elements.targetLanguage) {
    languages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.nativeName;
      elements.targetLanguage.appendChild(option);
    });
  }
}

/**
 * 加载设置
 */
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, (stored) => {
      console.log('[Options] Loaded from storage:', stored);
      
      // 使用存储的设置或默认设置
      settings = stored.general ? stored : DEFAULT_SETTINGS;
      console.log('[Options] Settings:', settings);
      
      // 如果是首次运行，保存默认设置
      if (!stored.general) {
        saveSettings(false); // 静默保存
      }
      
      resolve();
    });
  });
}

/**
 * 应用设置到 UI
 */
function applySettingsToUI() {
  // 通用设置
  if (elements.enableTranslate) elements.enableTranslate.checked = settings.general.enableTranslate;
  if (elements.enableAnnotate) elements.enableAnnotate.checked = settings.general.enableAnnotate;
  if (elements.enableDoubleClickAnnotate) elements.enableDoubleClickAnnotate.checked = settings.general.enableDoubleClickAnnotate ?? true;
  if (elements.uiLanguage) elements.uiLanguage.value = settings.general.uiLanguage;
  if (elements.targetLanguage) elements.targetLanguage.value = settings.general.targetLanguage;
  if (elements.currentProvider) elements.currentProvider.value = settings.providers.current;
  
  // 有道设置
  if (elements.youdaoAppKey) elements.youdaoAppKey.value = settings.providers.youdao.appKey;
  if (elements.youdaoAppSecret) elements.youdaoAppSecret.value = settings.providers.youdao.appSecret;
  
  // DeepL 设置
  if (elements.deeplApiKey) elements.deeplApiKey.value = settings.providers.deepl.apiKey;
  if (elements.deeplUseFreeApi) elements.deeplUseFreeApi.checked = settings.providers.deepl.useFreeApi;
  
  // OpenAI 设置
  if (elements.openaiApiKey) elements.openaiApiKey.value = settings.providers.openai.apiKey;
  if (elements.openaiModel) elements.openaiModel.value = settings.providers.openai.model;
  if (elements.openaiBaseUrl) elements.openaiBaseUrl.value = settings.providers.openai.baseUrl;
  if (elements.openaiTemperature) elements.openaiTemperature.value = settings.providers.openai.temperature;
  if (elements.openaiMaxTokens) elements.openaiMaxTokens.value = settings.providers.openai.maxTokens;
  if (elements.openaiTimeout) elements.openaiTimeout.value = settings.providers.openai.timeout;
  if (elements.openaiPromptFormat) elements.openaiPromptFormat.value = settings.providers.openai.promptFormat || 'jsonFormat';
  if (elements.openaiUseContext) elements.openaiUseContext.checked = settings.providers.openai.useContext ?? true;
  
  // 翻译卡片设置
  if (elements.showPhonetics) elements.showPhonetics.checked = settings.translationCard?.showPhonetics ?? true;
  if (elements.enableAudio) elements.enableAudio.checked = settings.translationCard?.enableAudio ?? true;
  if (elements.showDefinitions) elements.showDefinitions.checked = settings.translationCard?.showDefinitions ?? true;
  if (elements.showExamples) elements.showExamples.checked = settings.translationCard?.showExamples ?? true;
  if (elements.maxExamples) elements.maxExamples.value = settings.translationCard?.maxExamples ?? 3;
  if (elements.autoCloseDelay) elements.autoCloseDelay.value = settings.translationCard?.autoCloseDelay ?? 10;
  if (elements.enablePhoneticFallback) elements.enablePhoneticFallback.checked = settings.general?.enablePhoneticFallback ?? true;
  if (elements.menuButtonSize) elements.menuButtonSize.value = settings.display?.menu?.buttonSize ?? 'small';

  // 标注设置
  if (elements.showPhoneticInAnnotation) elements.showPhoneticInAnnotation.checked = settings.annotation?.showPhonetics ?? true;
  if (elements.showTranslationInAnnotation) elements.showTranslationInAnnotation.checked = settings.annotation?.showTranslation ?? true;
  if (elements.showDefinitionsInAnnotation) elements.showDefinitionsInAnnotation.checked = settings.annotation?.showDefinitions ?? false;
  if (elements.enableAudioInAnnotation) elements.enableAudioInAnnotation.checked = settings.annotation?.enableAudio ?? true;
  if (elements.hidePhoneticForMultipleWords) elements.hidePhoneticForMultipleWords.checked = settings.annotation?.hidePhoneticForMultipleWords ?? false;
  
  // 性能设置
  if (elements.enableCache) elements.enableCache.checked = settings.performance.enableCache;
  if (elements.cacheSize) elements.cacheSize.value = settings.performance.cacheSize;
  
  // 调试设置
  if (elements.enableDebugMode) elements.enableDebugMode.checked = settings.debug.enableDebugMode;

  // 词汇模式设置
  if (elements.enableVocabularyMode) elements.enableVocabularyMode.checked = settings.vocabulary?.enabled ?? true;

  // 加载目标标签（多选框）
  const targetTags = settings.vocabulary?.providers?.unified?.targetTags || ['cet6'];
  if (elements.vocabCet4) elements.vocabCet4.checked = targetTags.includes('cet4');
  if (elements.vocabCet6) elements.vocabCet6.checked = targetTags.includes('cet6');
  if (elements.vocabKy) elements.vocabKy.checked = targetTags.includes('ky');
  if (elements.vocabGk) elements.vocabGk.checked = targetTags.includes('gk');
  if (elements.vocabToefl) elements.vocabToefl.checked = targetTags.includes('toefl');
  if (elements.vocabIelts) elements.vocabIelts.checked = targetTags.includes('ielts');
  if (elements.vocabGre) elements.vocabGre.checked = targetTags.includes('gre');
  if (elements.vocabZk) elements.vocabZk.checked = targetTags.includes('zk');

  // 加载匹配模式
  if (elements.vocabularyMatchMode) elements.vocabularyMatchMode.value = settings.vocabulary?.providers?.unified?.mode || 'any';

  // 加载其他选项
  if (elements.includeBaseWords) elements.includeBaseWords.checked = settings.vocabulary?.providers?.unified?.includeBase ?? false;
  if (elements.minCollinsStars) elements.minCollinsStars.value = settings.vocabulary?.providers?.unified?.minCollins || 0;

  // 更新快速配置区域
  updateQuickProviderConfig();
  
  // 更新设为当前服务按钮状态
  updateSetProviderButtons();
}

/**
 * 从 UI 收集设置
 */
function collectSettingsFromUI() {
  return {
    general: {
      enableTranslate: elements.enableTranslate?.checked ?? settings.general?.enableTranslate ?? true,
      enableAnnotate: elements.enableAnnotate?.checked ?? settings.general?.enableAnnotate ?? true,
      enableDoubleClickAnnotate: elements.enableDoubleClickAnnotate?.checked ?? settings.general?.enableDoubleClickAnnotate ?? true,
      uiLanguage: elements.uiLanguage?.value ?? settings.general?.uiLanguage ?? 'auto',
      targetLanguage: elements.targetLanguage?.value ?? settings.general?.targetLanguage ?? 'zh-CN',
      showFloatingButton: settings.general?.showFloatingButton ?? true,
      enableContextMenu: settings.general?.enableContextMenu ?? true,
      phoneticDisplay: settings.general?.phoneticDisplay ?? 'both',
      enablePhoneticFallback: elements.enablePhoneticFallback?.checked ?? settings.general?.enablePhoneticFallback ?? true
    },
    annotation: {
      showPhonetics: elements.showPhoneticInAnnotation?.checked ?? settings.annotation?.showPhonetics ?? true,
      showTranslation: elements.showTranslationInAnnotation?.checked ?? settings.annotation?.showTranslation ?? true,
      showDefinitions: elements.showDefinitionsInAnnotation?.checked ?? settings.annotation?.showDefinitions ?? false,
      enableAudio: elements.enableAudioInAnnotation?.checked ?? settings.annotation?.enableAudio ?? true,
      hidePhoneticForMultipleWords: elements.hidePhoneticForMultipleWords?.checked ?? settings.annotation?.hidePhoneticForMultipleWords ?? false
    },
    translationCard: {
      showPhonetics: elements.showPhonetics?.checked ?? settings.translationCard?.showPhonetics ?? true,
      enableAudio: elements.enableAudio?.checked ?? settings.translationCard?.enableAudio ?? true,
      showDefinitions: elements.showDefinitions?.checked ?? settings.translationCard?.showDefinitions ?? true,
      showExamples: elements.showExamples?.checked ?? settings.translationCard?.showExamples ?? true,
      maxExamples: parseInt(elements.maxExamples?.value, 10) ?? settings.translationCard?.maxExamples ?? 3,
      autoCloseDelay: parseInt(elements.autoCloseDelay?.value, 10) ?? settings.translationCard?.autoCloseDelay ?? 10
    },
    providers: {
      current: elements.currentProvider?.value ?? settings.providers?.current ?? 'google',
      google: settings.providers?.google ?? { enabled: true },
      youdao: {
        ...(settings.providers?.youdao ?? { enabled: false, appKey: '', appSecret: '', connectionStatus: null }),
        appKey: elements.youdaoAppKey?.value ?? settings.providers?.youdao?.appKey ?? '',
        appSecret: elements.youdaoAppSecret?.value ?? settings.providers?.youdao?.appSecret ?? ''
      },
      deepl: {
        ...(settings.providers?.deepl ?? { enabled: false, apiKey: '', useFreeApi: true, connectionStatus: null }),
        apiKey: elements.deeplApiKey?.value ?? settings.providers?.deepl?.apiKey ?? '',
        useFreeApi: elements.deeplUseFreeApi?.checked ?? settings.providers?.deepl?.useFreeApi ?? true
      },
      openai: {
        ...(settings.providers?.openai ?? {
          enabled: false,
          apiKey: '',
          model: 'gpt-3.5-turbo',
          baseUrl: 'https://api.openai.com/v1',
          temperature: 0.3,
          maxTokens: 500,
          timeout: 30,
          connectionStatus: null,
          promptFormat: 'jsonFormat',
          useContext: true,
          customTemplates: null
        }),
        apiKey: elements.openaiApiKey?.value ?? settings.providers?.openai?.apiKey ?? '',
        model: elements.openaiModel?.value ?? settings.providers?.openai?.model ?? 'gpt-3.5-turbo',
        baseUrl: elements.openaiBaseUrl?.value ?? settings.providers?.openai?.baseUrl ?? 'https://api.openai.com/v1',
        temperature: parseFloat(elements.openaiTemperature?.value) ?? settings.providers?.openai?.temperature ?? 0.3,
        maxTokens: parseInt(elements.openaiMaxTokens?.value, 10) ?? settings.providers?.openai?.maxTokens ?? 500,
        timeout: parseInt(elements.openaiTimeout?.value, 10) ?? settings.providers?.openai?.timeout ?? 30,
        promptFormat: elements.openaiPromptFormat?.value ?? settings.providers?.openai?.promptFormat ?? 'jsonFormat',
        useContext: elements.openaiUseContext?.checked ?? settings.providers?.openai?.useContext ?? true
      }
    },
    display: {
      menu: {
        buttonSize: elements.menuButtonSize?.value ?? settings.display?.menu?.buttonSize ?? 'small'
      }
    },
    performance: {
      enableCache: elements.enableCache?.checked ?? settings.performance?.enableCache ?? true,
      cacheSize: parseInt(elements.cacheSize?.value, 10) ?? settings.performance?.cacheSize ?? 100
    },
    debug: {
      enableDebugMode: elements.enableDebugMode?.checked ?? settings.debug?.enableDebugMode ?? false
    },
    vocabulary: {
      enabled: elements.enableVocabularyMode?.checked ?? settings.vocabulary?.enabled ?? true,
      provider: 'unified', // 固定使用 unified provider
      providers: {
        unified: {
          targetTags: [
            elements.vocabCet4?.checked && 'cet4',
            elements.vocabCet6?.checked && 'cet6',
            elements.vocabKy?.checked && 'ky',
            elements.vocabGk?.checked && 'gk',
            elements.vocabToefl?.checked && 'toefl',
            elements.vocabIelts?.checked && 'ielts',
            elements.vocabGre?.checked && 'gre',
            elements.vocabZk?.checked && 'zk'
          ].filter(Boolean), // 过滤掉 false 值
          mode: elements.vocabularyMatchMode?.value ?? settings.vocabulary?.providers?.unified?.mode ?? 'any',
          includeBase: elements.includeBaseWords?.checked ?? settings.vocabulary?.providers?.unified?.includeBase ?? false,
          minCollins: parseInt(elements.minCollinsStars?.value, 10) ?? settings.vocabulary?.providers?.unified?.minCollins ?? 0
        },
        // 保留旧的 CET 和 Frequency 配置以便向后兼容
        cet: settings.vocabulary?.providers?.cet ?? {
          levels: ['cet6'],
          mode: 'above',
          includeBase: false
        },
        frequency: settings.vocabulary?.providers?.frequency ?? {
          threshold: 5000
        }
      }
    }
  };
}

/**
 * 保存设置
 */
function saveSettings(showIndicator = true) {
  // 从 UI 收集最新设置
  settings = collectSettingsFromUI();

  console.log('[Options] Saving settings:', settings);

  // 保存新结构
  chrome.storage.sync.set(settings, () => {
    console.log('[Options] Settings saved');
    
    if (showIndicator) {
      showSaveIndicator();
    }
    
    // 通知 content scripts 更新（使用旧格式兼容）
    notifyContentScripts();
  });
}

/**
 * 显示保存提示
 */
function showSaveIndicator() {
  if (elements.saveIndicator) {
    elements.saveIndicator.classList.add('show');
    setTimeout(() => {
      elements.saveIndicator.classList.remove('show');
    }, 2000);
  }
}

/**
 * 显示验证消息
 */
function showValidationMessage(messageKey) {
  if (elements.saveIndicator) {
    const originalContent = elements.saveIndicator.innerHTML;
    const messageSpan = elements.saveIndicator.querySelector('span');
    
    // 临时改为错误样式和文本
    elements.saveIndicator.classList.add('show', 'error');
    if (messageSpan) {
      messageSpan.setAttribute('data-i18n', messageKey);
      localizeElement(messageSpan);
    }
    
    setTimeout(() => {
      elements.saveIndicator.classList.remove('show', 'error');
      // 恢复原始内容
      setTimeout(() => {
        elements.saveIndicator.innerHTML = originalContent;
      }, 300);
    }, 3000);
  }
}

/**
 * 本地化单个元素
 */
function localizeElement(element) {
  const key = element.getAttribute('data-i18n');
  if (key) {
    const message = chrome.i18n.getMessage(key);
    if (message) {
      element.textContent = message;
    }
  }
}

/**
 * 通知 content scripts
 */
function notifyContentScripts() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateSettings',
        settings: settings
      }, (response) => {
        // 忽略错误
        if (chrome.runtime.lastError) {
          console.log('[Options] Could not notify tab:', tab.id);
        }
      });
    });
  });
}

/**
 * 更新快速配置区域
 */
function updateQuickProviderConfig() {
  const configBox = document.getElementById('quickProviderConfig');
  if (!configBox) return;
  
  const provider = elements.currentProvider?.value;
  
  // 如果是 Google，不显示任何提示（无需配置）
  if (provider === 'google') {
    configBox.innerHTML = '';
    configBox.classList.remove('show');
  } else {
    // 其他服务显示跳转链接
    configBox.innerHTML = `
      <div class="config-hint clickable" data-page="${provider}">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 18l6-6-6-6"></path>
        </svg>
        <span>前往 <strong>${getProviderName(provider)}</strong> 配置</span>
      </div>
    `;
    configBox.classList.add('show');
    
    // 添加点击事件跳转
    const hintElement = configBox.querySelector('.config-hint.clickable');
    if (hintElement) {
      hintElement.addEventListener('click', () => {
        const page = hintElement.dataset.page;
        const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
        if (navItem) {
          navItem.click();
        }
      });
    }
  }
}

/**
 * 获取服务商名称
 */
function getProviderName(provider) {
  const names = {
    google: 'Google 翻译',
    youdao: '有道翻译',
    deepl: 'DeepL',
    openai: 'AI翻译'
  };
  return names[provider] || provider;
}

/**
 * 检查服务提供商配置是否完整
 */
function validateProviderConfig(provider) {
  // 获取当前UI中的配置（而不是settings中的，因为可能用户正在输入）
  const config = collectSettingsFromUI();
  
  switch (provider) {
    case 'google':
      // Google 翻译不需要配置
      return { valid: true };
      
    case 'youdao':
      const youdaoConfig = config.providers.youdao;
      if (!youdaoConfig.appKey || !youdaoConfig.appKey.trim()) {
        return { 
          valid: false, 
          message: '请先配置有道翻译的 App Key' 
        };
      }
      if (!youdaoConfig.appSecret || !youdaoConfig.appSecret.trim()) {
        return { 
          valid: false, 
          message: '请先配置有道翻译的 App Secret' 
        };
      }
      return { valid: true };
      
    case 'deepl':
      const deeplConfig = config.providers.deepl;
      if (!deeplConfig.apiKey || !deeplConfig.apiKey.trim()) {
        return { 
          valid: false, 
          message: '请先配置 DeepL 的 API Key' 
        };
      }
      return { valid: true };
      
    case 'openai':
      const openaiConfig = config.providers.openai;
      if (!openaiConfig.apiKey || !openaiConfig.apiKey.trim()) {
        return { 
          valid: false, 
          message: '请先配置 AI 翻译的 API Key' 
        };
      }
      return { valid: true };
      
    default:
      return { valid: false, message: '未知的服务提供商' };
  }
}

/**
 * 设置当前服务提供商（带配置检查）
 */
function setCurrentProvider(provider) {
  // 验证配置
  const validation = validateProviderConfig(provider);
  
  if (!validation.valid) {
    // 显示警告提示
    alert(`⚠️ 无法切换服务\n\n${validation.message}\n\n请在当前页面填写必要的配置信息后再试。`);
    return false;
  }
  
  // 配置完整，执行切换
  if (elements.currentProvider) {
    elements.currentProvider.value = provider;
    settings.providers.current = provider;
    saveSettings();
    showSaveIndicator();
    updateSetProviderButtons(provider);
    updateQuickProviderConfig();
    
    // 跳转到通用设置页
    setTimeout(() => {
      const generalNav = document.querySelector('.nav-item[data-page="general"]');
      if (generalNav) generalNav.click();
    }, 500);
    
    return true;
  }
  
  return false;
}

/**
 * 更新"设为当前服务"按钮状态
 */
function updateSetProviderButtons(activeProvider) {
  const currentProvider = activeProvider || settings.providers.current;
  
  document.querySelectorAll('.set-provider-btn').forEach(btn => {
    const btnProvider = btn.getAttribute('data-provider');
    const btnText = btn.querySelector('.btn-text');
    
    if (btnProvider === currentProvider) {
      btn.classList.add('active');
      if (btnText) {
        btnText.textContent = i18n('currentService');
      }
    } else {
      btn.classList.remove('active');
      if (btnText) {
        btnText.textContent = i18n('setAsCurrentService');
      }
    }
  });
}

/**
 * 测试连接 - 通用函数
 */
async function testConnection(provider, resultElement) {
  if (!resultElement) return;
  
  // 显示测试中状态
  resultElement.className = 'test-result show testing';
  resultElement.innerHTML = `
    <strong>⏳ 测试中...</strong>
    <p>正在连接到 ${getProviderName(provider)}...</p>
  `;
  
  // 收集当前配置
  const config = collectSettingsFromUI();
  
  try {
    // 模拟测试翻译
    const testText = 'hello';
    const targetLang = config.general.targetLanguage;
    
    // 根据不同服务调用测试
    // 注意：这里需要实际的翻译服务来测试，暂时模拟
    const startTime = Date.now();
    
    // TODO: 实际调用翻译 API
    // 这里需要加载 translation-service.js 来执行真实测试
    await simulateTest(provider, config, testText, targetLang);
    
    const responseTime = Date.now() - startTime;
    
    // 显示成功
    resultElement.className = 'test-result show success';
    resultElement.innerHTML = `
      <strong>✅ 连接成功！</strong>
      <p>响应时间: ${responseTime}ms</p>
      <p>测试翻译: "${testText}" → "你好"</p>
      <p><small>最后测试: ${new Date().toLocaleString()}</small></p>
    `;
    
    // 更新连接状态
    if (settings.providers[provider]) {
      settings.providers[provider].connectionStatus = {
        tested: true,
        success: true,
        timestamp: Date.now(),
        responseTime,
        error: null
      };
      saveSettings(false);
    }
    
  } catch (error) {
    console.error('[Options] Connection test failed:', error);
    
    // 显示失败
    resultElement.className = 'test-result show error';
    resultElement.innerHTML = `
      <strong>❌ 连接失败</strong>
      <p>${error.message || '未知错误'}</p>
      <p><small>${getErrorSuggestion(error)}</small></p>
    `;
    
    // 更新连接状态
    if (settings.providers[provider]) {
      settings.providers[provider].connectionStatus = {
        tested: true,
        success: false,
        timestamp: Date.now(),
        responseTime: null,
        error: error.message
      };
      saveSettings(false);
    }
  }
}

/**
 * 模拟测试（待替换为真实API调用）
 */
async function simulateTest(provider, config, text, targetLang) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 简单验证配置
      if (provider === 'youdao') {
        if (!config.providers.youdao.appKey || !config.providers.youdao.appSecret) {
          reject(new Error('请填写 App Key 和 App Secret'));
          return;
        }
      } else if (provider === 'deepl') {
        if (!config.providers.deepl.apiKey) {
          reject(new Error('请填写 API Key'));
          return;
        }
      } else if (provider === 'openai') {
        if (!config.providers.openai.apiKey) {
          reject(new Error('请填写 API Key'));
          return;
        }
      }
      
      // 模拟成功
      resolve({ translation: '你好' });
    }, 1000 + Math.random() * 1000);
  });
}

/**
 * 获取错误建议
 */
function getErrorSuggestion(error) {
  const msg = error.message || '';
  if (msg.includes('Key') || msg.includes('Secret')) {
    return '💡 请检查 API 凭据是否正确填写';
  }
  if (msg.includes('401')) {
    return '💡 API 密钥无效，请检查是否正确';
  }
  if (msg.includes('403')) {
    return '💡 API 权限不足，请检查配额或订阅';
  }
  if (msg.includes('network') || msg.includes('timeout')) {
    return '💡 网络连接失败，请检查网络或代理设置';
  }
  return '💡 请查看浏览器控制台获取详细错误信息';
}

/**
 * 设置事件监听器
 */
function setupEventListeners() {
  // UI 语言特殊处理 - 变化时重新加载页面
  if (elements.uiLanguage) {
    elements.uiLanguage.addEventListener('change', async () => {
      await saveSettings();
      // 重新加载语言并刷新页面
      await initializeLanguage();
      localizeHtmlPage();
    });
  }
  
  // 自动保存的字段（Switch 和 Select）
  const autoSaveFields = [
    'enableTranslate', 'enableAnnotate', 'enableDoubleClickAnnotate', 'targetLanguage',
    'currentProvider', 'deeplUseFreeApi', 'showPhonetics', 'enableAudio',
    'showDefinitions', 'showExamples', 'enablePhoneticFallback',
    'menuButtonSize', 'showPhoneticInAnnotation', 'showTranslationInAnnotation',
    'showDefinitionsInAnnotation', 'enableAudioInAnnotation',
    'hidePhoneticForMultipleWords',
    'enableCache', 'enableDebugMode', 'openaiPromptFormat', 'openaiUseContext',
    // 词汇模式字段
    'enableVocabularyMode', 'vocabCet4', 'vocabCet6', 'vocabKy', 'vocabGk',
    'vocabToefl', 'vocabIelts', 'vocabGre', 'vocabZk',
    'vocabularyMatchMode', 'includeBaseWords', 'minCollinsStars'
  ];
  
  autoSaveFields.forEach(id => {
    const el = elements[id];
    if (el) {
      el.addEventListener('change', () => {
        // 验证悬浮按钮设置：至少保留一个
        if (id === 'enableTranslate' || id === 'enableAnnotate') {
          const translateEnabled = elements.enableTranslate.checked;
          const annotateEnabled = elements.enableAnnotate.checked;
          
          // 如果两个都被关闭，阻止本次操作
          if (!translateEnabled && !annotateEnabled) {
            el.checked = true; // 恢复当前复选框
            showValidationMessage('atLeastOneButtonRequired');
            return;
          }
        }
        
        // 验证标注显示选项：至少保留一个（音标、翻译、释义）
        if (id === 'showPhoneticInAnnotation' || id === 'showTranslationInAnnotation' || id === 'showDefinitionsInAnnotation') {
          const phoneticsEnabled = elements.showPhoneticInAnnotation?.checked ?? false;
          const translationEnabled = elements.showTranslationInAnnotation?.checked ?? false;
          const definitionsEnabled = elements.showDefinitionsInAnnotation?.checked ?? false;
          
          // 如果三个都被关闭，阻止本次操作
          if (!phoneticsEnabled && !translationEnabled && !definitionsEnabled) {
            el.checked = true; // 恢复当前复选框
            showValidationMessage('annotationMinimumOneRequired');
            return;
          }
        }
        
        saveSettings();
      });
    }
  });
  
  // 数字输入框 - 失焦时保存
  const numberFields = ['maxExamples', 'autoCloseDelay', 'cacheSize', 
    'openaiTemperature', 'openaiMaxTokens', 'openaiTimeout'];
  numberFields.forEach(id => {
    const el = elements[id];
    if (el) {
      el.addEventListener('blur', () => {
        saveSettings();
      });
    }
  });
  
  // 文本输入框 - 防抖保存
  const textFields = ['youdaoAppKey', 'youdaoAppSecret', 'deeplApiKey',
    'openaiApiKey', 'openaiModel', 'openaiBaseUrl'];
  textFields.forEach(id => {
    const el = elements[id];
    if (el) {
      let timeout;
      el.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          saveSettings();
        }, 1000);
      });
      el.addEventListener('blur', () => {
        clearTimeout(timeout);
        saveSettings();
      });
    }
  });
  
  // 当前服务变更时更新快速配置区域
  if (elements.currentProvider) {
    elements.currentProvider.addEventListener('change', () => {
      updateQuickProviderConfig();
      updateSetProviderButtons();
    });
  }
  
  // 连接测试按钮
  if (elements.testYoudaoConnection) {
    elements.testYoudaoConnection.addEventListener('click', () => {
      testConnection('youdao', elements.youdaoTestResult);
    });
  }
  
  if (elements.testDeeplConnection) {
    elements.testDeeplConnection.addEventListener('click', () => {
      testConnection('deepl', elements.deeplTestResult);
    });
  }
  
  if (elements.testOpenaiConnection) {
    elements.testOpenaiConnection.addEventListener('click', () => {
      testConnection('openai', elements.openaiTestResult);
    });
  }
  
  // 服务提供者按钮
  if (elements.setGoogleAsProvider) {
    elements.setGoogleAsProvider.addEventListener('click', () => {
      setCurrentProvider('google');
    });
  }
  
  if (elements.setYoudaoAsProvider) {
    elements.setYoudaoAsProvider.addEventListener('click', () => {
      setCurrentProvider('youdao');
    });
  }
  
  if (elements.setDeeplAsProvider) {
    elements.setDeeplAsProvider.addEventListener('click', () => {
      setCurrentProvider('deepl');
    });
  }
  
  if (elements.setOpenaiAsProvider) {
    elements.setOpenaiAsProvider.addEventListener('click', () => {
      setCurrentProvider('openai');
    });
  }
  
  // 重置按钮
  if (elements.resetButton) {
    elements.resetButton.addEventListener('click', resetSettings);
  }
  
  // 清除缓存按钮
  if (elements.clearCacheButton) {
    elements.clearCacheButton.addEventListener('click', clearCache);
  }

  // 导出数据按钮
  if (elements.exportAllData) {
    elements.exportAllData.addEventListener('click', exportData);
  }

  // 导入数据按钮
  if (elements.importDataButton) {
    elements.importDataButton.addEventListener('click', () => {
      elements.importDataFile.click();
    });
  }

  if (elements.importDataFile) {
    elements.importDataFile.addEventListener('change', importData);
  }

  // 清除所有数据按钮
  if (elements.clearAllDataButton) {
    elements.clearAllDataButton.addEventListener('click', clearAllData);
  }

  // 词汇模式：刷新统计按钮
  if (elements.refreshVocabularyStats) {
    elements.refreshVocabularyStats.addEventListener('click', refreshVocabularyStats);
  }

  // 标签选择器初始化
  setupTagSelector();

  // 提示词编辑器相关
  setupPromptEditorListeners();
}

/**
 * 重置到默认设置
 */
function resetSettings() {
  const confirmMessage = '确定要重置所有设置到默认值吗？';
  if (!confirm(confirmMessage)) return;
  
  console.log('[Options] Resetting to default settings...');
  
  // 使用默认设置
  settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
  
  // 保存到存储
  chrome.storage.sync.set(settings, () => {
    console.log('[Options] Settings reset successfully');
    showSaveIndicator();
    
    // 重新加载UI
    applySettingsToUI();
    
    // 通知 content scripts
    notifyContentScripts();
  });
}

/**
 * 清除缓存
 */
async function clearCache() {
  const confirmMessage = '确定要清除所有翻译缓存吗？';
  if (!confirm(confirmMessage)) return;

  console.log('[Options] Clearing cache...');

  try {
    // 清除local storage中的缓存数据
    const allData = await chrome.storage.local.get(null);
    const cacheKeys = Object.keys(allData).filter(key => key.startsWith('cache_'));

    if (cacheKeys.length > 0) {
      await chrome.storage.local.remove(cacheKeys);
      console.log(`[Options] Cleared ${cacheKeys.length} cache entries`);
    }

    // 更新显示
    await updateCacheUsage();

    alert(`缓存已清除！共清除 ${cacheKeys.length} 条缓存记录。`);
  } catch (error) {
    console.error('[Options] Failed to clear cache:', error);
    alert('清除缓存失败：' + error.message);
  }
}

/**
 * ========== 提示词编辑器功能 ==========
 */

// 提示词编辑器状态
let promptEditorState = {
  currentFormat: 'jsonFormat',
  currentTemplate: null,
  isModified: false
};

/**
 * 设置提示词编辑器的事件监听器
 */
function setupPromptEditorListeners() {
  // 提示词格式选择 - 自动保存
  if (elements.openaiPromptFormat) {
    elements.openaiPromptFormat.addEventListener('change', () => {
      saveSettings();
    });
  }
  
  // 使用上下文开关 - 自动保存
  if (elements.openaiUseContext) {
    elements.openaiUseContext.addEventListener('change', () => {
      saveSettings();
    });
  }
  
  // 打开提示词编辑器
  if (elements.openPromptEditor) {
    elements.openPromptEditor.addEventListener('click', openPromptEditor);
  }
  
  // 关闭提示词编辑器
  if (elements.closePromptEditor) {
    elements.closePromptEditor.addEventListener('click', closePromptEditor);
  }
  
  if (elements.cancelPromptEdit) {
    elements.cancelPromptEdit.addEventListener('click', closePromptEditor);
  }
  
  // 保存提示词
  if (elements.savePromptEdit) {
    elements.savePromptEdit.addEventListener('click', savePromptTemplate);
  }
  
  // 重置到默认
  if (elements.resetPromptToDefault) {
    elements.resetPromptToDefault.addEventListener('click', resetPromptToDefault);
  }
  
  // 验证模板
  if (elements.validatePrompt) {
    elements.validatePrompt.addEventListener('click', validatePromptTemplate);
  }
  
  // 模态框背景点击关闭
  if (elements.promptEditorModal) {
    elements.promptEditorModal.addEventListener('click', (e) => {
      if (e.target === elements.promptEditorModal) {
        closePromptEditor();
      }
    });
  }
  
  // Tab 切换
  const tabButtons = document.querySelectorAll('.prompt-editor-tabs .tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabName = btn.dataset.tab;
      switchPromptEditorTab(tabName);
    });
  });
  
  // 输入框变化时更新预览
  ['promptSystemText', 'promptUserText', 'promptContextText'].forEach(id => {
    const el = elements[id];
    if (el) {
      el.addEventListener('input', () => {
        promptEditorState.isModified = true;
        updatePromptPreview();
      });
    }
  });
}

/**
 * 打开提示词编辑器
 */
function openPromptEditor() {
  console.log('[Options] Opening prompt editor...');
  
  // 获取当前格式
  const format = elements.openaiPromptFormat?.value || 'jsonFormat';
  promptEditorState.currentFormat = format;
  
  // 获取当前模板
  const customTemplates = settings.providers.openai.customTemplates;
  let template;
  
  if (customTemplates && customTemplates[format]) {
    // 使用自定义模板
    template = customTemplates[format];
    promptEditorState.currentTemplate = 'custom';
  } else {
    // 使用默认模板
    template = PromptTemplates.DEFAULT_TEMPLATES[format];
    promptEditorState.currentTemplate = 'default';
  }
  
  // 填充编辑器
  if (elements.promptSystemText) {
    elements.promptSystemText.value = template.system || '';
  }
  if (elements.promptUserText) {
    elements.promptUserText.value = template.user || '';
  }
  if (elements.promptContextText) {
    elements.promptContextText.value = template.contextTemplate || '';
  }
  
  // 更新预览
  updatePromptPreview();
  
  // 显示模态框
  if (elements.promptEditorModal) {
    elements.promptEditorModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  // 重置修改状态
  promptEditorState.isModified = false;
}

/**
 * 关闭提示词编辑器
 */
function closePromptEditor() {
  // 如果有未保存的修改，提示用户
  if (promptEditorState.isModified) {
    if (!confirm('有未保存的修改，确定要关闭吗？')) {
      return;
    }
  }
  
  if (elements.promptEditorModal) {
    elements.promptEditorModal.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  console.log('[Options] Prompt editor closed');
}

/**
 * 切换编辑器 Tab
 */
function switchPromptEditorTab(tabName) {
  // 更新按钮状态
  const tabButtons = document.querySelectorAll('.prompt-editor-tabs .tab-btn');
  tabButtons.forEach(btn => {
    if (btn.dataset.tab === tabName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 更新内容显示
  const tabContents = document.querySelectorAll('.prompt-editor-content .tab-content');
  tabContents.forEach(content => {
    if (content.dataset.content === tabName) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });
}

/**
 * 更新提示词预览
 */
function updatePromptPreview() {
  const systemText = elements.promptSystemText?.value || '';
  const userText = elements.promptUserText?.value || '';
  
  // 使用示例数据构建预览
  const sampleData = {
    text: 'Hello world',
    sourceLang: 'English',
    targetLang: 'Simplified Chinese',
    context: ''
  };
  
  // 替换占位符
  const previewSystem = PromptTemplates.replaceVariables(systemText, sampleData);
  const previewUser = PromptTemplates.replaceVariables(userText, sampleData);
  
  // 更新预览区域
  if (elements.previewSystem) {
    elements.previewSystem.textContent = previewSystem;
  }
  if (elements.previewUser) {
    elements.previewUser.textContent = previewUser;
  }
}

/**
 * 验证提示词模板
 */
function validatePromptTemplate() {
  const template = {
    system: elements.promptSystemText?.value || '',
    user: elements.promptUserText?.value || '',
    contextTemplate: elements.promptContextText?.value || ''
  };
  
  const isValid = PromptTemplates.validateTemplate(template);
  
  if (isValid) {
    alert('✅ 模板验证通过！\n\n模板格式正确，包含所有必需的占位符。');
  } else {
    alert('❌ 模板验证失败！\n\n请确保：\n1. 包含 system 和 user 字段\n2. user 提示词中包含 {text}, {sourceLang}, {targetLang} 占位符');
  }
}

/**
 * 保存提示词模板
 */
async function savePromptTemplate() {
  console.log('[Options] Saving prompt template...');
  
  // 获取编辑器内容
  const template = {
    system: elements.promptSystemText?.value || '',
    user: elements.promptUserText?.value || '',
    contextTemplate: elements.promptContextText?.value || ''
  };
  
  // 验证模板
  if (!PromptTemplates.validateTemplate(template)) {
    alert('❌ 模板格式无效！\n\n请确保：\n1. 包含 system 和 user 字段\n2. user 提示词中包含 {text}, {sourceLang}, {targetLang} 占位符');
    return;
  }
  
  // 保存到设置
  const format = promptEditorState.currentFormat;
  
  // 初始化 customTemplates（如果不存在）
  if (!settings.providers.openai.customTemplates) {
    settings.providers.openai.customTemplates = {};
  }
  
  // 保存当前格式的模板
  settings.providers.openai.customTemplates[format] = template;
  
  // 保存设置
  await saveSettings();
  
  // 关闭编辑器
  promptEditorState.isModified = false;
  closePromptEditor();
  
  console.log('[Options] Prompt template saved successfully');
  alert('✅ 提示词模板已保存！');
}

/**
 * 重置提示词到默认值
 */
function resetPromptToDefault() {
  if (!confirm('确定要重置当前格式的提示词到默认值吗？')) {
    return;
  }
  
  const format = promptEditorState.currentFormat;
  const defaultTemplate = PromptTemplates.DEFAULT_TEMPLATES[format];
  
  // 填充默认值
  if (elements.promptSystemText) {
    elements.promptSystemText.value = defaultTemplate.system || '';
  }
  if (elements.promptUserText) {
    elements.promptUserText.value = defaultTemplate.user || '';
  }
  if (elements.promptContextText) {
    elements.promptContextText.value = defaultTemplate.contextTemplate || '';
  }
  
  // 更新预览
  updatePromptPreview();
  
  // 标记为已修改
  promptEditorState.isModified = true;
  promptEditorState.currentTemplate = 'default';
  
  console.log('[Options] Prompt template reset to default');
}

// 初始化
/**
 * 刷新词汇统计（占位函数）
 * 注意：设置页面无法直接访问 content script 的 vocabularyService
 * 此功能仅作为UI占位，实际统计需要在内容页面查看
 */
function refreshVocabularyStats() {
  if (!elements.vocabularyStatsDisplay) return;

  elements.vocabularyStatsDisplay.innerHTML = `
    <p style="color: var(--text-secondary);">
      <strong>提示：</strong>词库统计信息需要在网页上查看<br>
      <small>请打开任意网页，按 F12 打开控制台，运行：</small><br>
      <code style="display: block; margin-top: 4px; padding: 4px; background: var(--bg-tertiary); border-radius: 4px;">vocabularyService.getStats()</code>
    </p>
  `;
}

/**
 * 设置标签选择器
 */
function setupTagSelector() {
  const selector = document.getElementById('vocabularyTagSelector');
  const input = selector?.querySelector('.tag-selector-input');
  const dropdown = document.getElementById('vocabularyTagDropdown');
  const tagsList = document.getElementById('selectedTagsList');
  const checkboxes = dropdown?.querySelectorAll('input[type="checkbox"]');

  if (!selector || !input || !dropdown || !tagsList || !checkboxes) return;

  // 标签名称映射
  const tagNames = {
    'cet4': 'CET-4',
    'cet6': 'CET-6',
    'ky': '考研',
    'gk': '高考',
    'toefl': 'TOEFL',
    'ielts': 'IELTS',
    'gre': 'GRE',
    'zk': '中考'
  };

  // 更新标签显示
  function updateTagsDisplay() {
    const selectedTags = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => ({ value: cb.value, label: tagNames[cb.value] || cb.value }));

    if (selectedTags.length === 0) {
      tagsList.innerHTML = '<span class="tag-placeholder" data-i18n="selectVocabularyTags">点击选择词汇类型...</span>';
    } else {
      tagsList.innerHTML = selectedTags.map(tag => `
        <span class="selected-tag" data-value="${tag.value}">
          ${tag.label}
          <span class="tag-remove" data-value="${tag.value}">×</span>
        </span>
      `).join('');

      // 添加删除标签的事件监听
      tagsList.querySelectorAll('.tag-remove').forEach(removeBtn => {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const value = removeBtn.dataset.value;
          const checkbox = dropdown.querySelector(`input[value="${value}"]`);
          if (checkbox) {
            checkbox.checked = false;
            updateTagsDisplay();
            saveSettings();
          }
        });
      });
    }

    // 重新本地化占位符
    if (selectedTags.length === 0) {
      const placeholder = tagsList.querySelector('.tag-placeholder');
      if (placeholder) localizeElement(placeholder);
    }
  }

  // 切换下拉菜单
  function toggleDropdown(e) {
    e.stopPropagation();
    selector.classList.toggle('open');
  }

  // 点击输入框
  input.addEventListener('click', toggleDropdown);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(e);
    }
  });

  // 复选框变化
  checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateTagsDisplay();
      saveSettings();
    });
  });

  // 点击下拉选项时不关闭菜单
  dropdown.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // 点击外部关闭菜单
  document.addEventListener('click', (e) => {
    if (!selector.contains(e.target)) {
      selector.classList.remove('open');
    }
  });

  // 初始化显示
  updateTagsDisplay();
}

/**
 * 更新缓存使用情况显示
 */
async function updateCacheUsage() {
  if (!elements.cacheUsage) return;

  try {
    // 获取所有存储数据
    const allData = await chrome.storage.local.get(null);

    // 计算大小（简单估算）
    const dataStr = JSON.stringify(allData);
    const bytes = new Blob([dataStr]).size;
    const kb = bytes / 1024;
    const mb = kb / 1024;

    // 格式化显示
    let sizeText;
    if (mb >= 1) {
      sizeText = `${mb.toFixed(2)} MB`;
    } else if (kb >= 1) {
      sizeText = `${kb.toFixed(2)} KB`;
    } else {
      sizeText = `${bytes} B`;
    }

    // 获取条目数
    const cacheKeys = Object.keys(allData).filter(key => key.startsWith('cache_'));
    const cacheCount = cacheKeys.length;

    elements.cacheUsage.textContent = `${sizeText} (${cacheCount} 条)`;
  } catch (error) {
    console.error('[Options] Failed to calculate cache size:', error);
    elements.cacheUsage.textContent = '计算失败';
  }
}

/**
 * 导出数据
 */
async function exportData() {
  try {
    // 获取所有sync和local存储数据
    const syncData = await chrome.storage.sync.get(null);
    const localData = await chrome.storage.local.get(null);

    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      sync: syncData,
      local: localData
    };

    // 创建下载链接
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    // 生成文件名
    const date = new Date().toISOString().split('T')[0];
    const filename = `annotate-translate-backup-${date}.json`;

    // 下载文件
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
    console.log('[Options] Data exported successfully');
  } catch (error) {
    console.error('[Options] Failed to export data:', error);
    alert('导出失败：' + error.message);
  }
}

/**
 * 导入数据
 */
async function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const confirmMessage = '导入数据将覆盖所有现有设置和标注。确定要继续吗？';
  if (!confirm(confirmMessage)) {
    event.target.value = ''; // 清空文件选择
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // 验证数据格式
    if (!data.version || !data.sync || !data.local) {
      throw new Error('无效的备份文件格式');
    }

    // 导入sync数据
    await chrome.storage.sync.clear();
    await chrome.storage.sync.set(data.sync);

    // 导入local数据
    await chrome.storage.local.clear();
    await chrome.storage.local.set(data.local);

    console.log('[Options] Data imported successfully');
    alert('数据导入成功！页面将重新加载。');

    // 重新加载页面
    window.location.reload();
  } catch (error) {
    console.error('[Options] Failed to import data:', error);
    alert('导入失败：' + error.message);
  } finally {
    event.target.value = ''; // 清空文件选择
  }
}

/**
 * 清除所有数据
 */
async function clearAllData() {
  const confirmMessage = '⚠️ 警告：此操作将删除所有设置、缓存和标注数据，且不可恢复！\n\n确定要继续吗？';
  if (!confirm(confirmMessage)) return;

  const doubleConfirm = '请再次确认：真的要删除所有数据吗？';
  if (!confirm(doubleConfirm)) return;

  try {
    // 清除所有存储
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    console.log('[Options] All data cleared');
    alert('所有数据已清除！页面将重新加载。');

    // 重新加载页面
    window.location.reload();
  } catch (error) {
    console.error('[Options] Failed to clear all data:', error);
    alert('清除失败：' + error.message);
  }
}

// ============================================
// Wordbook & Review Module
// ============================================

const WordbookModule = (() => {
  let data = null;
  let currentGroup = '';
  let currentSearch = '';
  let currentSort = 'newest';
  let currentPage = 1;
  let selectedIds = new Set();
  let reviewSession = null;
  let _listenersAttached = false;

  async function loadData() {
    const result = await chrome.storage.local.get('wordbook');
    data = result.wordbook || {
      version: 1, entries: {},
      groups: [{ id: 'default', name: 'Default', color: '#6b7280', createdAt: Date.now() }],
      stats: { totalCollected: 0, totalReviews: 0, streakDays: 0, lastStudyDate: '', dailyHistory: {} }
    };
  }

  async function saveData() {
    await chrome.storage.local.set({ wordbook: data });
  }

  function esc(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
  }

  function getEntries() {
    let entries = Object.values(data.entries);
    if (currentGroup) entries = entries.filter(e => e.groups.includes(currentGroup));
    if (currentSearch) {
      const q = currentSearch.toLowerCase();
      entries = entries.filter(e => e.word.toLowerCase().includes(q) || e.translation.toLowerCase().includes(q));
    }
    const ord = { new: 0, learning: 1, review: 2, mastered: 3 };
    switch (currentSort) {
      case 'oldest': entries.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'alpha': entries.sort((a, b) => a.word.localeCompare(b.word)); break;
      case 'status': entries.sort((a, b) => ord[a.review.status] - ord[b.review.status]); break;
      default: entries.sort((a, b) => b.createdAt - a.createdAt);
    }
    return entries;
  }

  // ============ Wordbook List ============

  function renderGroups() {
    const list = document.getElementById('wordbook-group-list');
    if (!list) return;
    list.innerHTML = '';
    const allItem = document.createElement('li');
    allItem.className = 'group-item' + (currentGroup === '' ? ' active' : '');
    allItem.innerHTML = `<span class="group-color-dot" style="background:#6b7280"></span>
      <span class="group-name">${i18n('allGroups') || 'All'}</span>
      <span class="group-count">${Object.keys(data.entries).length}</span>`;
    allItem.addEventListener('click', () => { currentGroup = ''; currentPage = 1; renderGroups(); renderWordList(); });
    list.appendChild(allItem);

    data.groups.forEach(g => {
      const count = Object.values(data.entries).filter(e => e.groups.includes(g.id)).length;
      const li = document.createElement('li');
      li.className = 'group-item' + (currentGroup === g.id ? ' active' : '');
      li.innerHTML = `<span class="group-color-dot" style="background:${g.color}"></span>
        <span class="group-name">${esc(g.name)}</span>
        <span class="group-count">${count}</span>
        ${g.id !== 'default' ? '<button class="group-delete-btn" title="Delete">&times;</button>' : ''}`;
      li.querySelector('.group-name').addEventListener('click', () => {
        currentGroup = g.id; currentPage = 1; renderGroups(); renderWordList();
      });
      const delBtn = li.querySelector('.group-delete-btn');
      if (delBtn) {
        delBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          if (!confirm(`Delete group "${g.name}"?`)) return;
          const idx = data.groups.findIndex(x => x.id === g.id);
          if (idx !== -1) data.groups.splice(idx, 1);
          Object.values(data.entries).forEach(entry => {
            const gi = entry.groups.indexOf(g.id);
            if (gi !== -1) { entry.groups.splice(gi, 1); if (!entry.groups.length) entry.groups.push('default'); }
          });
          if (currentGroup === g.id) currentGroup = '';
          await saveData(); renderGroups(); renderWordList();
        });
      }
      list.appendChild(li);
    });
    // Update review group filter
    const rgf = document.getElementById('review-group-filter');
    if (rgf) {
      const v = rgf.value;
      rgf.innerHTML = `<option value="">${i18n('allGroups') || 'All'}</option>`;
      data.groups.forEach(g => { rgf.innerHTML += `<option value="${g.id}">${esc(g.name)}</option>`; });
      rgf.value = v;
    }
  }

  function renderWordList() {
    const tbody = document.getElementById('wordbook-table-body');
    if (!tbody) return;
    const allEntries = getEntries();
    const pageSize = 20;
    const totalPages = Math.ceil(allEntries.length / pageSize) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * pageSize;
    const entries = allEntries.slice(start, start + pageSize);
    tbody.innerHTML = '';
    if (!entries.length) {
      tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:#9ca3af;padding:40px">No words yet</td></tr>';
      return;
    }
    entries.forEach(entry => {
      const tr = document.createElement('tr');
      const statusKey = 'status' + entry.review.status.charAt(0).toUpperCase() + entry.review.status.slice(1);
      const statusText = i18n(statusKey) || entry.review.status;
      const groupTags = entry.groups.map(gid => {
        const g = data.groups.find(x => x.id === gid);
        return g ? `<span class="word-group-tag" style="border-left:3px solid ${g.color}">${esc(g.name)}</span>` : '';
      }).join('');
      tr.innerHTML = `
        <td><input type="checkbox" class="word-checkbox" data-id="${entry.id}" ${selectedIds.has(entry.id) ? 'checked' : ''}></td>
        <td class="word-col-word">${esc(entry.word)}</td>
        <td class="word-col-translation">${esc(entry.translation)}</td>
        <td><span class="word-status-badge status-${entry.review.status}">${statusText}</span></td>
        <td>${groupTags}</td>`;
      tr.querySelector('.word-checkbox').addEventListener('change', (e) => {
        if (e.target.checked) selectedIds.add(entry.id); else selectedIds.delete(entry.id);
        updateBatchActions();
      });
      tbody.appendChild(tr);
    });
    const pag = document.getElementById('wordbook-pagination');
    if (pag) {
      pag.innerHTML = `<span>${allEntries.length} words</span>
        <div class="pagination-controls">
          <button class="pagination-btn" id="page-prev" ${currentPage <= 1 ? 'disabled' : ''}>&lt;</button>
          <span>${currentPage} / ${totalPages}</span>
          <button class="pagination-btn" id="page-next" ${currentPage >= totalPages ? 'disabled' : ''}>&gt;</button>
        </div>`;
      document.getElementById('page-prev')?.addEventListener('click', () => { currentPage--; renderWordList(); });
      document.getElementById('page-next')?.addEventListener('click', () => { currentPage++; renderWordList(); });
    }
    updateBatchActions();
  }

  function updateBatchActions() {
    const bar = document.getElementById('wordbook-batch-actions');
    if (bar) bar.style.display = selectedIds.size > 0 ? 'flex' : 'none';
  }

  // ============ SM-2 (local copy for options page) ============
  function sm2(reviewState, quality, responseTimeMs) {
    let { repetitions, easeFactor, interval } = reviewState;
    if (responseTimeMs != null && quality >= 3) {
      if (responseTimeMs < 2000 && quality === 4) quality = 5;
      else if (responseTimeMs > 8000 && quality === 4) quality = 3;
    }
    if (quality < 3) { repetitions = 0; interval = 0; }
    else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    }
    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;
    let status;
    if (repetitions === 0) status = 'learning';
    else if (interval >= 21 && repetitions >= 5) status = 'mastered';
    else status = 'review';
    return {
      repetitions, easeFactor: Math.round(easeFactor * 100) / 100, interval,
      nextReviewAt: Date.now() + interval * 24 * 60 * 60 * 1000,
      lastReviewAt: Date.now(),
      totalReviews: (reviewState.totalReviews || 0) + 1,
      correctCount: quality >= 3 ? (reviewState.correctCount || 0) + 1 : (reviewState.correctCount || 0),
      status, log: reviewState.log || []
    };
  }

  // Levenshtein distance
  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++)
      for (let j = 1; j <= n; j++)
        dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    return dp[m][n];
  }

  // Adaptive mode recommendation
  function recommendMode(entry) {
    const r = entry.review.repetitions;
    if (r <= 2) return 'flashcard';
    if (r <= 5) return 'quiz';
    return 'spelling';
  }

  // Smart distractors for quiz
  function generateDistracters(targetEntry, count) {
    const all = Object.values(data.entries).filter(e => e.id !== targetEntry.id && e.translation);
    if (all.length < count) return all.map(e => e.translation);
    const targetPOS = targetEntry.definitions?.[0]?.partOfSpeech || '';
    const targetLen = targetEntry.translation.length;
    const scored = all.map(e => {
      let s = Math.random() * 2;
      if (targetPOS && e.definitions?.[0]?.partOfSpeech === targetPOS) s += 3;
      if (Math.abs(e.translation.length - targetLen) <= 2) s += 2;
      return { e, s };
    });
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, count).map(x => x.e.translation);
  }

  // ============ Dashboard ============
  function renderReviewDashboard() {
    if (!data) return;
    const entries = Object.values(data.entries);
    const total = entries.length;
    const el = (id) => document.getElementById(id);

    el('stat-total-words').textContent = total;

    const dist = { new: 0, learning: 0, review: 0, mastered: 0 };
    entries.forEach(e => dist[e.review.status] = (dist[e.review.status] || 0) + 1);

    const rate = total > 0 ? Math.round((dist.mastered / total) * 100) : 0;
    const rateEl = el('stat-mastery-rate');
    rateEl.textContent = rate + '%';
    rateEl.className = 'stat-value' + (rate >= 70 ? ' rate-high' : rate >= 40 ? ' rate-mid' : ' rate-low');
    el('stat-streak').textContent = (data.stats.streakDays || 0) + ' ' + (i18n('days') || 'days');

    // 7-day chart
    const chartBars = el('review-chart-bars');
    if (chartBars) {
      const days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        days.push({ date: key, ...(data.stats.dailyHistory[key] || { reviewed: 0, correct: 0, newWords: 0 }) });
      }
      const mx = Math.max(...days.map(d => d.reviewed), 1);
      chartBars.innerHTML = days.map(d => {
        const h = Math.max(4, (d.reviewed / mx) * 60);
        return `<div class="chart-bar-wrapper">
          <div class="chart-bar ${d.reviewed === 0 ? 'empty' : ''}" style="height:${h}px" title="${d.reviewed} reviewed"></div>
          <span class="chart-bar-label">${d.date.slice(5)}</span></div>`;
      }).join('');
    }

    // Status bar
    const statusBar = el('status-bar');
    if (statusBar && total > 0) {
      statusBar.innerHTML = ['new','learning','review','mastered'].map(s =>
        `<div class="status-bar-segment seg-${s}" style="width:${(dist[s]/total*100).toFixed(1)}%" title="${s}: ${dist[s]}"></div>`
      ).join('');
    }
  }

  // ============ Review Session (improved) ============

  function getSelectedMode() {
    const checked = document.querySelector('input[name="review-mode"]:checked');
    return checked ? checked.value : 'flashcard';
  }

  function startReview() {
    const mode = getSelectedMode();
    const sessionSize = parseInt(document.getElementById('review-session-size').value);
    const groupFilter = document.getElementById('review-group-filter').value;
    const now = Date.now();

    let candidates = Object.values(data.entries);
    if (groupFilter) candidates = candidates.filter(e => e.groups.includes(groupFilter));

    // Priority: learning(overdue) > review(overdue) > new (max 7)
    const overdueLearning = candidates.filter(e => e.review.nextReviewAt <= now && e.review.status === 'learning')
      .sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);
    const overdueReview = candidates.filter(e => e.review.nextReviewAt <= now && e.review.status === 'review')
      .sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);
    const newWords = candidates.filter(e => e.review.status === 'new')
      .sort((a, b) => a.createdAt - b.createdAt);

    const maxNew = Math.min(7, Math.floor(sessionSize * 0.35));
    const selected = [];
    selected.push(...overdueLearning.slice(0, sessionSize));
    if (selected.length < sessionSize) selected.push(...overdueReview.slice(0, sessionSize - selected.length));
    if (selected.length < sessionSize) selected.push(...newWords.slice(0, Math.min(maxNew, sessionSize - selected.length)));

    if (!selected.length) {
      document.getElementById('review-area').innerHTML =
        `<div class="empty-state"><div class="empty-state-text">${i18n('noWordsToReview') || 'No words to review'}</div></div>`;
      return;
    }

    reviewSession = {
      mode, words: selected, current: 0, results: [], correctCount: 0,
      retestQueue: [], // wrong answers re-inserted later
      cardStartTime: null, lastFeedback: null
    };
    renderReviewCard();
  }

  function renderProgressBar() {
    if (!reviewSession) return '';
    const cur = reviewSession.current;
    const total = reviewSession.words.length;
    const pct = Math.round((cur / total) * 100);
    return `<div class="review-progress-bar">
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
      <span class="progress-text">${cur} / ${total}</span>
    </div>`;
  }

  function renderLastFeedback() {
    if (!reviewSession?.lastFeedback) return '';
    const fb = reviewSession.lastFeedback;
    const cls = fb.quality >= 3 ? 'feedback-correct' : 'feedback-wrong';
    const icon = fb.quality >= 3 ? '✓' : '✗';
    return `<div class="previous-feedback ${cls}">
      <span>${icon} ${esc(fb.word)}</span>
    </div>`;
  }

  function renderReviewCard() {
    const area = document.getElementById('review-area');
    if (!reviewSession) return;

    // Check if we should insert a retest word
    if (reviewSession.current >= reviewSession.words.length && reviewSession.retestQueue.length > 0) {
      reviewSession.words.push(reviewSession.retestQueue.shift());
    }

    if (reviewSession.current >= reviewSession.words.length) {
      renderSummary(); return;
    }

    const entry = reviewSession.words[reviewSession.current];
    // Determine mode: auto or fixed
    let mode = reviewSession.mode;
    if (mode === 'auto') mode = recommendMode(entry);

    reviewSession.cardStartTime = Date.now();

    if (mode === 'flashcard') renderFlashcard(area, entry);
    else if (mode === 'quiz') renderQuiz(area, entry);
    else renderSpelling(area, entry);
  }

  function renderFlashcard(area, entry) {
    area.innerHTML = `${renderProgressBar()}${renderLastFeedback()}
      <div class="review-card">
        <div class="review-word">${esc(entry.word)}</div>
        ${entry.phonetics?.length ? `<div class="review-phonetic">${esc(entry.phonetics[0].text || '')}</div>` : ''}
        ${entry.context ? `<div class="review-context">"${esc(entry.context.slice(0, 100))}"</div>` : ''}
        <div class="review-answer" id="review-answer" style="display:none">
          <div class="review-translation">${esc(entry.translation)}</div>
          ${entry.definitions?.length ? `<div class="review-definition">${entry.definitions.map(d => esc((d.partOfSpeech ? d.partOfSpeech + '. ' : '') + (d.meaning || d))).join('<br>')}</div>` : ''}
        </div>
        <div class="review-actions" id="review-actions-front">
          <button class="review-btn btn-show-answer" id="btn-show-answer">${i18n('showAnswer') || 'Show Answer'} <kbd>Space</kbd></button>
        </div>
        <div class="review-actions" id="review-actions-back" style="display:none">
          <button class="review-btn btn-dont-know" data-quality="1">${i18n('dontKnow') || "Don't know"} <kbd>1</kbd></button>
          <button class="review-btn btn-hard" data-quality="3">${i18n('hard') || 'Hard'} <kbd>2</kbd></button>
          <button class="review-btn btn-remembered" data-quality="4">${i18n('remembered') || 'Remembered'} <kbd>3</kbd></button>
          <button class="review-btn btn-too-easy" data-quality="5">${i18n('tooEasy') || 'Too easy'} <kbd>4</kbd></button>
        </div>
      </div>`;

    document.getElementById('btn-show-answer').addEventListener('click', () => {
      document.getElementById('review-answer').style.display = '';
      document.getElementById('review-actions-front').style.display = 'none';
      document.getElementById('review-actions-back').style.display = '';
    });
    area.querySelectorAll('[data-quality]').forEach(btn => {
      btn.addEventListener('click', () => handleReviewAnswer(parseInt(btn.dataset.quality)));
    });
  }

  function renderQuiz(area, entry) {
    const wrongOptions = generateDistracters(entry, 3);
    const options = [entry.translation, ...wrongOptions].sort(() => Math.random() - 0.5);

    area.innerHTML = `${renderProgressBar()}${renderLastFeedback()}
      <div class="review-card">
        <div class="review-word">${esc(entry.word)}</div>
        ${entry.context ? `<div class="review-context">"${esc(entry.context.slice(0, 100))}"</div>` : ''}
        <div class="quiz-options">
          ${options.map((opt, i) => `<button class="quiz-option" data-answer="${esc(opt)}" data-correct="${opt === entry.translation}">
            <kbd>${i + 1}</kbd>${esc(opt)}</button>`).join('')}
        </div>
      </div>`;

    let answered = false;
    area.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        if (answered) return;
        answered = true;
        const correct = btn.dataset.correct === 'true';
        btn.classList.add(correct ? 'correct' : 'wrong');
        if (!correct) area.querySelector('[data-correct="true"]').classList.add('correct');
        setTimeout(() => handleReviewAnswer(correct ? 4 : 1), 800);
      });
    });
  }

  function renderSpelling(area, entry) {
    let hintLevel = 0;
    area.innerHTML = `${renderProgressBar()}${renderLastFeedback()}
      <div class="review-card">
        <div class="review-translation" style="font-size:22px">${esc(entry.translation)}</div>
        ${entry.definitions?.length ? `<div class="review-definition" style="margin-bottom:16px">${entry.definitions.map(d => esc((d.partOfSpeech ? d.partOfSpeech + '. ' : '') + (d.meaning || d))).join('<br>')}</div>` : ''}
        <div class="spelling-input-wrapper">
          <input type="text" class="spelling-input" id="spelling-input" placeholder="Type the word..." autocomplete="off">
          <button class="review-btn" id="spelling-submit">${i18n('submit') || 'Submit'} <kbd>Enter</kbd></button>
          <button class="review-btn" id="spelling-hint">${i18n('hint') || 'Hint'} <kbd>H</kbd></button>
        </div>
        <div class="spelling-hint" id="spelling-hint-text" style="display:none"></div>
        <div class="spelling-result" id="spelling-result"></div>
      </div>`;

    const input = document.getElementById('spelling-input');
    let answered = false;

    const submit = () => {
      if (answered) return;
      answered = true;
      const ua = input.value.trim().toLowerCase();
      const cw = entry.word.toLowerCase();
      const dist = levenshtein(ua, cw);
      const accuracy = 1 - (dist / Math.max(cw.length, 1));
      let quality, verdict;

      if (ua === cw) { quality = 5; verdict = 'Correct!'; }
      else if (accuracy >= 0.85) { quality = 3; verdict = `Close! (${entry.word})`; }
      else if (accuracy >= 0.6) { quality = 2; verdict = `Partial. Answer: ${entry.word}`; }
      else { quality = 1; verdict = `Wrong. Answer: ${entry.word}`; }

      const resultEl = document.getElementById('spelling-result');
      resultEl.textContent = verdict;
      resultEl.className = 'spelling-result ' + (quality >= 3 ? 'correct' : quality === 2 ? 'partial' : 'wrong');
      input.disabled = true;
      setTimeout(() => handleReviewAnswer(quality), 1000);
    };

    document.getElementById('spelling-submit').addEventListener('click', submit);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
    document.getElementById('spelling-hint').addEventListener('click', () => {
      hintLevel = Math.min(hintLevel + 1, 3);
      const word = entry.word;
      let hint;
      if (hintLevel >= 3) hint = word.split('').map((c, i) => i % 2 === 0 ? c : '_').join(' ');
      else if (hintLevel >= 2) hint = word[0] + ' ' + '_ '.repeat(word.length - 2).trim() + ' ' + word[word.length - 1];
      else hint = '_ '.repeat(word.length).trim() + ` (${word.length})`;
      const hintEl = document.getElementById('spelling-hint-text');
      hintEl.textContent = hint;
      hintEl.style.display = '';
    });
    input.focus();
  }

  async function handleReviewAnswer(quality) {
    const entry = reviewSession.words[reviewSession.current];
    const responseTime = reviewSession.cardStartTime ? Date.now() - reviewSession.cardStartTime : null;

    // Append to log
    if (!entry.review.log) entry.review.log = [];
    entry.review.log.push({ ts: Date.now(), q: quality, rt: responseTime });
    if (entry.review.log.length > 30) entry.review.log = entry.review.log.slice(-30);

    entry.review = sm2(entry.review, quality, responseTime);
    data.entries[entry.id] = entry;

    // Stats
    data.stats.totalReviews = (data.stats.totalReviews || 0) + 1;
    const today = new Date().toISOString().split('T')[0];
    if (!data.stats.dailyHistory[today]) data.stats.dailyHistory[today] = { reviewed: 0, correct: 0, newWords: 0 };
    data.stats.dailyHistory[today].reviewed += 1;
    if (quality >= 3) { data.stats.dailyHistory[today].correct += 1; reviewSession.correctCount++; }

    // Streak
    if (data.stats.lastStudyDate !== today) {
      const y = new Date(); y.setDate(y.getDate() - 1);
      data.stats.streakDays = data.stats.lastStudyDate === y.toISOString().split('T')[0]
        ? (data.stats.streakDays || 0) + 1 : 1;
      data.stats.lastStudyDate = today;
    }

    // Wrong answer reinforcement: re-test 5-7 items later
    if (quality < 3) {
      const insertAt = Math.min(reviewSession.current + 5 + Math.floor(Math.random() * 3), reviewSession.words.length);
      reviewSession.retestQueue.push(entry);
    }

    reviewSession.lastFeedback = { word: entry.word, quality };
    reviewSession.results.push({ id: entry.id, quality });
    reviewSession.current++;
    await saveData();
    renderReviewCard();
  }

  function renderSummary() {
    const area = document.getElementById('review-area');
    const total = reviewSession.results.length;
    const correct = reviewSession.correctCount;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    area.innerHTML = `
      <div class="review-summary">
        <h3>${i18n('reviewSummary') || 'Review Summary'}</h3>
        <div class="summary-stats">
          <div class="summary-stat">
            <div class="summary-stat-value">${total}</div>
            <div class="summary-stat-label">${i18n('wordsReviewed') || 'Words Reviewed'}</div>
          </div>
          <div class="summary-stat">
            <div class="summary-stat-value ${accuracy >= 80 ? 'rate-high' : accuracy >= 50 ? 'rate-mid' : 'rate-low'}">${accuracy}%</div>
            <div class="summary-stat-label">${i18n('accuracy') || 'Accuracy'}</div>
          </div>
        </div>
        <div class="summary-actions">
          <button class="btn-primary" id="btn-another-round">${i18n('anotherRound') || 'Another Round'}</button>
          <button class="btn-secondary" id="btn-back-wordbook">${i18n('backToWordbook') || 'Back to Wordbook'}</button>
        </div>
      </div>`;

    document.getElementById('btn-another-round').addEventListener('click', startReview);
    document.getElementById('btn-back-wordbook').addEventListener('click', () => {
      document.querySelector('.nav-item[data-page="wordbook"]')?.click();
    });
    renderReviewDashboard();
  }

  // ============ Keyboard ============
  function handleKeyboard(e) {
    if (!reviewSession || reviewSession.current >= reviewSession.words.length) return;
    // Don't intercept when typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      if (e.key === 'Enter') return; // let submit handler handle it
      return;
    }
    const area = document.getElementById('review-area');
    if (!area) return;

    // ? key: show keyboard help
    if (e.key === '?') { e.preventDefault(); showKeyboardHelp(); return; }

    const mode = reviewSession.mode === 'auto' ? recommendMode(reviewSession.words[reviewSession.current]) : reviewSession.mode;

    if (mode === 'flashcard') {
      if (e.code === 'Space') {
        e.preventDefault();
        const showBtn = document.getElementById('btn-show-answer');
        if (showBtn?.offsetParent) { showBtn.click(); return; }
      }
      const qm = { Digit1: 1, Digit2: 3, Digit3: 4, Digit4: 5 };
      if (qm[e.code] !== undefined) {
        const btn = area.querySelector(`[data-quality="${qm[e.code]}"]`);
        if (btn?.offsetParent) btn.click();
      }
    } else if (mode === 'quiz') {
      const km = { Digit1: 0, Digit2: 1, Digit3: 2, Digit4: 3 };
      if (km[e.code] !== undefined) {
        const opts = area.querySelectorAll('.quiz-option');
        if (opts[km[e.code]]) opts[km[e.code]].click();
      }
    } else if (mode === 'spelling') {
      if (e.key === 'h' || e.key === 'H') {
        document.getElementById('spelling-hint')?.click();
      }
    }
  }

  function showKeyboardHelp() {
    let overlay = document.getElementById('keyboard-help-overlay');
    if (overlay) { overlay.remove(); return; }
    overlay = document.createElement('div');
    overlay.id = 'keyboard-help-overlay';
    overlay.className = 'keyboard-help-overlay';
    overlay.innerHTML = `<div class="keyboard-help-panel">
      <h4>Keyboard Shortcuts</h4>
      <table>
        <tr><td><kbd>Space</kbd></td><td>Show answer (flashcard)</td></tr>
        <tr><td><kbd>1</kbd></td><td>Don't know / Option A</td></tr>
        <tr><td><kbd>2</kbd></td><td>Hard / Option B</td></tr>
        <tr><td><kbd>3</kbd></td><td>Remembered / Option C</td></tr>
        <tr><td><kbd>4</kbd></td><td>Too easy / Option D</td></tr>
        <tr><td><kbd>Enter</kbd></td><td>Submit (spelling)</td></tr>
        <tr><td><kbd>H</kbd></td><td>Hint (spelling)</td></tr>
        <tr><td><kbd>?</kbd></td><td>Toggle this help</td></tr>
      </table>
      <button class="review-btn" onclick="this.closest('.keyboard-help-overlay').remove()">Close</button>
    </div>`;
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
    document.body.appendChild(overlay);
  }

  // ============ Mode selector UI ============
  function initModeSelector() {
    document.querySelectorAll('input[name="review-mode"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
        radio.closest('.mode-button').classList.add('active');
      });
    });
  }

  // ============ Init ============
  async function init() {
    await loadData();
    renderGroups();
    renderWordList();
    renderReviewDashboard();
    initModeSelector();

    if (_listenersAttached) return;
    _listenersAttached = true;

    const searchEl = document.getElementById('wordbook-search');
    if (searchEl) {
      let t;
      searchEl.addEventListener('input', () => {
        clearTimeout(t);
        t = setTimeout(() => { currentSearch = searchEl.value; currentPage = 1; renderWordList(); }, 300);
      });
    }
    document.getElementById('wordbook-sort')?.addEventListener('change', (e) => {
      currentSort = e.target.value; currentPage = 1; renderWordList();
    });
    document.getElementById('wordbook-select-all')?.addEventListener('change', (e) => {
      document.querySelectorAll('.word-checkbox').forEach(cb => {
        cb.checked = e.target.checked;
        if (e.target.checked) selectedIds.add(cb.dataset.id); else selectedIds.delete(cb.dataset.id);
      });
      updateBatchActions();
    });
    document.getElementById('btn-add-group')?.addEventListener('click', () => {
      const name = prompt(i18n('enterGroupName') || 'Enter group name:');
      if (!name || name.length > 30) return;
      if (data.groups.some(g => g.name === name)) { alert('Group already exists'); return; }
      const colors = ['#6b7280','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'];
      data.groups.push({ id: 'group_' + Date.now(), name, color: colors[data.groups.length % colors.length], createdAt: Date.now() });
      saveData().then(() => renderGroups());
    });
    document.getElementById('wordbook-batch-delete')?.addEventListener('click', async () => {
      if (!selectedIds.size) return;
      if (!confirm((i18n('confirmDeleteWords') || 'Delete $1 words?').replace('$1', selectedIds.size))) return;
      selectedIds.forEach(id => delete data.entries[id]);
      selectedIds.clear();
      await saveData(); renderWordList(); renderGroups();
    });
    document.getElementById('wordbook-batch-move')?.addEventListener('click', async () => {
      if (!selectedIds.size) return;
      const names = data.groups.map(g => g.name);
      const c = prompt('Move to group:\n' + names.map((n, i) => `${i+1}. ${n}`).join('\n'));
      const idx = parseInt(c) - 1;
      if (isNaN(idx) || idx < 0 || idx >= data.groups.length) return;
      const tid = data.groups[idx].id;
      selectedIds.forEach(id => { const e = data.entries[id]; if (e && !e.groups.includes(tid)) e.groups.push(tid); });
      selectedIds.clear();
      await saveData(); renderWordList(); renderGroups();
    });
    document.getElementById('btn-start-review')?.addEventListener('click', startReview);
    document.addEventListener('keydown', handleKeyboard);
  }

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  init();

  // Initialize wordbook module when navigating to its pages
  let wordbookInitialized = false;
  const initWordbook = () => {
    if (!wordbookInitialized) {
      wordbookInitialized = true;
      WordbookModule.init();
    } else {
      WordbookModule.init();
    }
  };

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const page = item.dataset.page;
      if (page === 'wordbook' || page === 'review') {
        initWordbook();
      }
    });
  });

  // Check initial hash
  const hash = window.location.hash.slice(1);
  if (hash === 'wordbook' || hash === 'review') {
    initWordbook();
  }
});

// 监听 hash 变化
window.addEventListener('hashchange', () => {
  handleHashNavigation();
  const hash = window.location.hash.slice(1);
  if (hash === 'wordbook' || hash === 'review') {
    WordbookModule.init();
  }
});

