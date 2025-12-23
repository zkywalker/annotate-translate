// Content Script for Annotate Translate Extension
// Note: Utility functions (safeGetMessage, isExtensionContextValid) are now imported from message-helper.js

// 深度合并两个对象
function deepMerge(target, source) {
  const result = { ...target };

  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        // 递归合并对象
        result[key] = deepMerge(target[key] || {}, source[key]);
      } else {
        // 直接赋值（包括数组和基本类型）
        result[key] = source[key];
      }
    }
  }

  return result;
}

// 全局设置对象 - 使用新的扁平化结构
let settings = {
  general: {
    enableTranslate: true,
    enableAnnotate: true,
    uiLanguage: 'auto',
    targetLanguage: 'zh-CN',
    showFloatingButton: true,
    enableContextMenu: true,
    phoneticDisplay: 'both',
    enablePhoneticFallback: true
  },
  annotation: {
    showPhonetics: true,
    showTranslation: true,
    showDefinitions: false,
    enableAudio: true,
    hidePhoneticForMultipleWords: false
  },
  translationCard: {
    showPhonetics: true,
    enableAudio: true,
    showDefinitions: true,
    showExamples: true,
    maxExamples: 3,
    autoCloseDelay: 10
  },
  providers: {
    current: 'google',
    google: { enabled: true },
    youdao: { enabled: false, appKey: '', appSecret: '', connectionStatus: null },
    deepl: { enabled: false, apiKey: '', useFreeApi: true, connectionStatus: null },
    openai: { enabled: false, apiKey: '', model: 'gpt-3.5-turbo', baseUrl: 'https://api.openai.com/v1', temperature: 0.3, maxTokens: 500, timeout: 30, connectionStatus: null }
  },
  display: {
    menu: { buttonSize: 'small' }
  },
  performance: {
    enableCache: true,
    cacheSize: 100
  },
  debug: {
    enableDebugMode: false
  },
  vocabulary: {
    enabled: false,
    provider: 'cet',
    providers: {
      cet: {
        levels: ['cet6'],
        mode: 'above',
        includeBase: false
      },
      frequency: {
        threshold: 5000,
        mode: 'below'
      },
      custom: {
        wordList: [],
        source: 'user'
      }
    },
    scanning: {
      mode: 'manual',
      autoScanDelay: 1000,
      scanDynamicContent: true
    },
    annotationStyle: {
      showPhonetic: true,
      showTranslation: true,
      showLevel: true,
      style: 'ruby'
    }
  }
};

// 设置访问辅助函数 - 简化代码
const $ = {
  get enableTranslate() { return settings.general?.enableTranslate ?? true; },
  get enableAnnotate() { return settings.general?.enableAnnotate ?? true; },
  get targetLanguage() { return settings.general?.targetLanguage ?? 'zh-CN'; },
  get translationProvider() { return settings.providers?.current ?? 'google'; },
  set translationProvider(val) { if (settings.providers) settings.providers.current = val; },
  get youdaoAppKey() { return settings.providers?.youdao?.appKey ?? ''; },
  get youdaoAppSecret() { return settings.providers?.youdao?.appSecret ?? ''; },
  get deeplApiKey() { return settings.providers?.deepl?.apiKey ?? ''; },
  get deeplUseFreeApi() { return settings.providers?.deepl?.useFreeApi ?? true; },
  // 获取当前选中的 AI 提供商配置
  get currentAIProvider() {
    const currentId = settings.providers?.currentAIProvider;
    const aiProviders = settings.providers?.aiProviders || [];
    const provider = aiProviders.find(p => p.id === currentId);

    // 如果找不到，回退到旧的 openai 配置
    if (!provider) {
      return {
        apiKey: settings.providers?.openai?.apiKey ?? '',
        model: settings.providers?.openai?.model ?? 'gpt-3.5-turbo',
        baseUrl: settings.providers?.openai?.baseUrl ?? 'https://api.openai.com/v1',
        temperature: settings.providers?.openai?.temperature ?? 0.3,
        maxTokens: settings.providers?.openai?.maxTokens ?? 500,
        timeout: settings.providers?.openai?.timeout ?? 30,
        promptFormat: settings.providers?.openai?.promptFormat ?? 'jsonFormat',
        useContext: settings.providers?.openai?.useContext ?? true
      };
    }

    return provider;
  },
  get openaiApiKey() { return this.currentAIProvider.apiKey ?? ''; },
  get openaiModel() { return this.currentAIProvider.model ?? 'gpt-3.5-turbo'; },
  get openaiBaseUrl() { return this.currentAIProvider.baseUrl ?? 'https://api.openai.com/v1'; },
  get openaiTemperature() { return this.currentAIProvider.temperature ?? 0.3; },
  get openaiMaxTokens() { return this.currentAIProvider.maxTokens ?? 500; },
  get openaiTimeout() { return this.currentAIProvider.timeout ?? 30; },
  get openaiPromptFormat() { return this.currentAIProvider.promptFormat ?? 'jsonFormat'; },
  get openaiUseContext() { return this.currentAIProvider.useContext ?? true; },
  get enableAudio() { return settings.translationCard?.enableAudio ?? true; },
  get showPhonetics() { return settings.translationCard?.showPhonetics ?? true; },
  get showDefinitions() { return settings.translationCard?.showDefinitions ?? true; },
  get showExamples() { return settings.translationCard?.showExamples ?? true; },
  get maxExamples() { return settings.translationCard?.maxExamples ?? 3; },
  get autoCloseDelay() { return settings.translationCard?.autoCloseDelay ?? 10; },
  get enablePhoneticFallback() { return settings.general?.enablePhoneticFallback ?? true; },
  get showPhoneticInAnnotation() { return settings.annotation?.showPhonetics ?? true; },
  get showTranslationInAnnotation() { return settings.annotation?.showTranslation ?? true; },
  get showDefinitionsInAnnotation() { return settings.annotation?.showDefinitions ?? false; },
  get enableAudioInAnnotation() { return settings.annotation?.enableAudio ?? true; },
  get hidePhoneticForMultipleWords() { return settings.annotation?.hidePhoneticForMultipleWords ?? false; },
  get menuButtonSize() { return settings.display?.menu?.buttonSize ?? 'small'; },
  get enableCache() { return settings.performance?.enableCache ?? true; },
  get cacheSize() { return settings.performance?.cacheSize ?? 100; },
  get debugMode() { return settings.debug?.enableDebugMode ?? false; },
  get showConsoleLogs() { return settings.debug?.enableDebugMode ?? false; },
  // 词库标注相关
  get vocabularyEnabled() { return settings.vocabulary?.enabled ?? false; },
  get vocabularyProvider() { return settings.vocabulary?.provider ?? 'cet'; },
  get vocabularyCETLevels() { return settings.vocabulary?.providers?.cet?.levels ?? ['cet6']; },
  get vocabularyCETMode() { return settings.vocabulary?.providers?.cet?.mode ?? 'above'; },
  get vocabularyCETIncludeBase() { return settings.vocabulary?.providers?.cet?.includeBase ?? false; },
  get vocabularyFrequencyThreshold() { return settings.vocabulary?.providers?.frequency?.threshold ?? 5000; },
  get vocabularyFrequencyMode() { return settings.vocabulary?.providers?.frequency?.mode ?? 'below'; },
  get vocabularyScanMode() { return settings.vocabulary?.scanning?.mode ?? 'manual'; },
  get vocabularyShowPhonetic() { return settings.vocabulary?.annotationStyle?.showPhonetic ?? true; },
  get vocabularyShowTranslation() { return settings.vocabulary?.annotationStyle?.showTranslation ?? true; },
  get vocabularyShowLevel() { return settings.vocabulary?.annotationStyle?.showLevel ?? true; }
};

let annotations = new Map();
let lastSelection = null; // 保存最后一次选择的Range
let translationUI = null; // TranslationUI实例
let currentTooltip = null; // 当前显示的翻译卡片
let annotationScanner = null; // AnnotationScanner实例

// Initialize the extension
init();

async function init() {
  console.log('[Annotate-Translate] Content script loaded on:', window.location.href);

  // 检查扩展上下文
  if (!isExtensionContextValid()) {
    console.error('[Annotate-Translate] Extension context is invalid, script will not initialize');
    return;
  }

  // 检查翻译服务是否可用
  if (typeof translationService === 'undefined') {
    console.error('[Annotate-Translate] Translation service not loaded!');
    return;
  }

  console.log('[Annotate-Translate] Translation service available:', translationService);

  // 初始化语言设置（从 i18n-helper.js）
  if (typeof initializeLanguage !== 'undefined') {
    await initializeLanguage();
    console.log('[Annotate-Translate] Language initialized');
  }

  // Load settings from storage - FIX: Wait for settings to load before proceeding
  try {
    const items = await new Promise((resolve, reject) => {
      chrome.storage.sync.get(null, function(items) {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(items);
        }
      });
    });

    // 如果有存储的设置，合并到默认设置（保留新增字段）
    if (items.general) {
      // 深度合并：保留默认settings中的字段，用storage中的值覆盖
      settings = deepMerge(settings, items);
      console.log('[Annotate-Translate] Settings loaded from storage');
      console.log('[Annotate-Translate] Merged settings:', settings);
    } else {
      console.log('[Annotate-Translate] No settings found, using defaults');
    }

    // 应用设置到翻译服务 - Now happens BEFORE event listeners are registered
    applyTranslationSettings();

    // 初始化TranslationUI - After settings are loaded
    initializeTranslationUI();

    // 初始化词库服务 - After settings are loaded
    await initializeVocabularyService();

    // 初始化AnnotationScanner - After vocabulary service is initialized
    initializeAnnotationScanner();

    // 设置页面卸载监听器
    setupPageUnloadHandler();

    // Listen for text selection - Only after settings are loaded
    document.addEventListener('mouseup', handleTextSelection);

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener(handleMessage);

    console.log('[Annotate-Translate] Initialization complete');
  } catch (error) {
    console.error('[Annotate-Translate] Failed to load settings:', error);
    // Continue with defaults even if settings loading fails
    applyTranslationSettings();
    initializeTranslationUI();
    await initializeVocabularyService();
    initializeAnnotationScanner();
    setupPageUnloadHandler();
    document.addEventListener('mouseup', handleTextSelection);
    chrome.runtime.onMessage.addListener(handleMessage);
  }
}

// 初始化TranslationUI
function initializeTranslationUI() {
  if (typeof TranslationUI === 'undefined') {
    console.error('[Annotate-Translate] TranslationUI not loaded!');
    return;
  }

  translationUI = new TranslationUI({
    showPhonetics: $.showPhonetics,
    showDefinitions: $.showDefinitions,
    showExamples: $.showExamples,
    maxExamples: $.maxExamples,
    enableAudio: $.enableAudio
  });

  console.log('[Annotate-Translate] TranslationUI initialized');
}

// 初始化词库服务
async function initializeVocabularyService() {
  console.log('[VocabularyService] Starting initialization...');
  console.log('[VocabularyService] vocabularyService defined?', typeof vocabularyService !== 'undefined');
  console.log('[VocabularyService] settings.vocabulary:', settings.vocabulary);

  if (typeof vocabularyService === 'undefined') {
    console.warn('[Annotate-Translate] VocabularyService not loaded, vocabulary features will be unavailable');
    return;
  }

  try {
    // 注册统一词库（新 - 推荐使用）
    if (typeof UnifiedVocabularyProvider !== 'undefined') {
      const unifiedProvider = new UnifiedVocabularyProvider('unified');
      vocabularyService.registerProvider('unified', unifiedProvider);
      console.log('[VocabularyService] Unified provider registered');
    } else {
      console.warn('[VocabularyService] UnifiedVocabularyProvider not defined');
    }

    // 注册CET词库（旧 - 向后兼容）
    if (typeof CETVocabularyProvider !== 'undefined') {
      const cetProvider = new CETVocabularyProvider();
      vocabularyService.registerProvider('cet', cetProvider);
      console.log('[VocabularyService] CET provider registered');
    } else {
      console.warn('[VocabularyService] CETVocabularyProvider not defined');
    }

    // 注册词频词库（旧 - 向后兼容）
    if (typeof FrequencyVocabularyProvider !== 'undefined') {
      const frequencyProvider = new FrequencyVocabularyProvider();
      vocabularyService.registerProvider('frequency', frequencyProvider);
      console.log('[VocabularyService] Frequency provider registered');
    } else {
      console.warn('[VocabularyService] FrequencyVocabularyProvider not defined');
    }

    // 设置活跃provider
    // 优先使用 unified，如果设置中是 cet/frequency 则自动升级
    let providerName = $.vocabularyProvider || 'unified';
    let providerOptions = {};

    // 自动升级旧配置并转换选项格式
    if (providerName === 'cet' && typeof UnifiedVocabularyProvider !== 'undefined') {
      console.log('[VocabularyService] Auto-upgrading from "cet" to "unified" provider');

      // 将 CET 配置转换为 Unified 格式
      const cetConfig = settings.vocabulary?.providers?.cet || {};
      providerOptions = {
        targetTags: cetConfig.levels || ['cet6'],  // CET levels as target tags
        mode: 'any',  // 'any' tag match (CET-6 or higher)
        includeBase: cetConfig.includeBase || false,
        minCollins: 0
      };

      providerName = 'unified';
      console.log('[VocabularyService] Converted CET options to unified format:', providerOptions);
    } else if (providerName === 'unified') {
      // Unified provider 使用默认配置
      providerOptions = settings.vocabulary?.providers?.unified || {
        targetTags: ['cet6', 'toefl', 'ielts'],  // 默认标注 CET-6/TOEFL/IELTS
        mode: 'any',
        includeBase: false,
        minCollins: 0
      };
    } else {
      // 其他 provider 使用原始配置
      providerOptions = settings.vocabulary?.providers?.[providerName] || {};
    }

    console.log('[VocabularyService] About to set active provider:', providerName, providerOptions);

    await vocabularyService.setActiveProvider(providerName, providerOptions);
    console.log(`[VocabularyService] Active provider set to: ${providerName}`, providerOptions);

    if ($.vocabularyEnabled) {
      console.log('[VocabularyService] Vocabulary annotation feature is ENABLED');
    } else {
      console.log('[VocabularyService] Vocabulary annotation feature is DISABLED (can be enabled in settings)');
    }

    console.log('[Annotate-Translate] Vocabulary service initialized successfully');
  } catch (error) {
    console.error('[VocabularyService] Initialization failed:', error);
    console.error('[VocabularyService] Error stack:', error.stack);
  }
}

// 初始化AnnotationScanner
function initializeAnnotationScanner() {
  if (typeof AnnotationScanner === 'undefined') {
    console.warn('[Annotate-Translate] AnnotationScanner not loaded, vocabulary annotation features will be unavailable');
    return;
  }

  if (typeof vocabularyService === 'undefined') {
    console.warn('[Annotate-Translate] VocabularyService not available, cannot initialize AnnotationScanner');
    return;
  }

  annotationScanner = new AnnotationScanner(vocabularyService, translationService);
  console.log('[Annotate-Translate] AnnotationScanner initialized');
}

// 设置页面卸载监听器，在页面刷新或关闭时中断翻译任务
function setupPageUnloadHandler() {
  window.addEventListener('beforeunload', () => {
    if (annotationScanner) {
      const aborted = annotationScanner.abort();
      if (aborted) {
        console.log('[Annotate-Translate] Aborted translation tasks due to page unload');
      }
    }
  });

  // 也监听 pagehide 事件（用于更好的支持移动端和 bfcache）
  window.addEventListener('pagehide', () => {
    if (annotationScanner) {
      annotationScanner.abort();
    }
  });

  console.log('[Annotate-Translate] Page unload handlers set up');
}

// 应用翻译设置
function applyTranslationSettings() {
  if (typeof translationService === 'undefined') {
    console.error('[Annotate-Translate] Translation service not available');
    return;
  }
  
  // 打印所有已注册的 providers
  console.log('[Annotate-Translate] Registered providers:', Array.from(translationService.providers.keys()));
  console.log('[Annotate-Translate] Requested provider:', $.translationProvider);
  
  // 设置活跃的翻译提供商
  if ($.translationProvider) {
    // 检查 provider 是否存在
    if (!translationService.providers.has($.translationProvider)) {
      console.warn(`[Annotate-Translate] Provider "${$.translationProvider}" not found, falling back to google`);
      $.translationProvider = 'google';
      if (isExtensionContextValid()) {
        try {
          chrome.storage.sync.get(['providers'], (result) => {
            const providers = result.providers || {};
            providers.current = 'google';
            chrome.storage.sync.set({ providers }, function() {
              if (chrome.runtime.lastError) {
                console.warn('[Annotate-Translate] Failed to update provider:', chrome.runtime.lastError.message);
              }
            });
          });
        } catch (error) {
          console.warn('[Annotate-Translate] Failed to update provider:', error.message);
        }
      }
    }
    
    try {
      translationService.setActiveProvider($.translationProvider);
      console.log('[Annotate-Translate] Provider set to:', $.translationProvider);
    } catch (error) {
      console.error('[Annotate-Translate] Failed to set provider:', error);
      // 出错时回退到 google
      $.translationProvider = 'google';
      translationService.setActiveProvider('google');
      if (isExtensionContextValid()) {
        try {
          chrome.storage.sync.get(['providers'], (result) => {
            const providers = result.providers || {};
            providers.current = 'google';
            chrome.storage.sync.set({ providers }, function() {
              if (chrome.runtime.lastError) {
                console.warn('[Annotate-Translate] Failed to update provider:', chrome.runtime.lastError.message);
              }
            });
          });
        } catch (error) {
          console.warn('[Annotate-Translate] Failed to update provider:', error.message);
        }
      }
    }
    
    // 如果是 Google 提供商，更新其配置
    if ($.translationProvider === 'google') {
      const googleProvider = translationService.providers.get('google');
      if (googleProvider) {
        googleProvider.showPhoneticInAnnotation = $.showPhoneticInAnnotation !== false;
        googleProvider.showTranslationInAnnotation = $.showTranslationInAnnotation !== false;
        googleProvider.showDefinitionsInAnnotation = $.showDefinitionsInAnnotation === true;
        console.log('[Annotate-Translate] Google provider configured - annotation settings:', {
          showPhonetics: googleProvider.showPhoneticInAnnotation,
          showTranslation: googleProvider.showTranslationInAnnotation,
          showDefinitions: googleProvider.showDefinitionsInAnnotation
        });
      }
    }
    
    // 如果是 Debug 提供商，更新其配置
    if ($.translationProvider === 'debug') {
      const debugProvider = translationService.providers.get('debug');
      if (debugProvider) {
        debugProvider.showPhoneticInAnnotation = $.showPhoneticInAnnotation !== false;
        debugProvider.showTranslationInAnnotation = $.showTranslationInAnnotation !== false;
        debugProvider.showDefinitionsInAnnotation = $.showDefinitionsInAnnotation === true;
        console.log('[Annotate-Translate] Debug provider configured - annotation settings:', {
          showPhonetics: debugProvider.showPhoneticInAnnotation,
          showTranslation: debugProvider.showTranslationInAnnotation,
          showDefinitions: debugProvider.showDefinitionsInAnnotation
        });
      }
    }
    
    // 如果是 Youdao 提供商，更新其 API 配置
    if ($.translationProvider === 'youdao') {
      const youdaoProvider = translationService.providers.get('youdao');
      if (youdaoProvider) {
        youdaoProvider.updateConfig(
          $.youdaoAppKey, 
          $.youdaoAppSecret
        );
        youdaoProvider.showPhoneticInAnnotation = $.showPhoneticInAnnotation !== false;
        youdaoProvider.showTranslationInAnnotation = $.showTranslationInAnnotation !== false;
        youdaoProvider.showDefinitionsInAnnotation = $.showDefinitionsInAnnotation === true;
        console.log('[Annotate-Translate] Youdao provider configured:');
        console.log('  - AppKey:', $.youdaoAppKey ? 'Set' : 'Not set');
        console.log('  - Annotation settings:', {
          showPhonetics: youdaoProvider.showPhoneticInAnnotation,
          showTranslation: youdaoProvider.showTranslationInAnnotation,
          showDefinitions: youdaoProvider.showDefinitionsInAnnotation
        });
      }
    }
    
    // 如果是 DeepL 提供商，更新其 API 配置
    if ($.translationProvider === 'deepl') {
      const deeplProvider = translationService.providers.get('deepl');
      if (deeplProvider) {
        deeplProvider.updateConfig(
          $.deeplApiKey,
          $.deeplUseFreeApi
        );
        deeplProvider.showPhoneticInAnnotation = $.showPhoneticInAnnotation !== false;
        deeplProvider.showTranslationInAnnotation = $.showTranslationInAnnotation !== false;
        deeplProvider.showDefinitionsInAnnotation = $.showDefinitionsInAnnotation === true;
        console.log('[Annotate-Translate] DeepL provider configured:');
        console.log('  - API Key:', $.deeplApiKey ? 'Set' : 'Not set');
        console.log('  - Use Free API:', $.deeplUseFreeApi);
        console.log('  - Annotation settings:', {
          showPhonetics: deeplProvider.showPhoneticInAnnotation,
          showTranslation: deeplProvider.showTranslationInAnnotation,
          showDefinitions: deeplProvider.showDefinitionsInAnnotation
        });
      }
    }
    
    // 如果是 OpenAI 提供商，更新其 API 配置
    if ($.translationProvider === 'openai') {
      const openaiProvider = translationService.providers.get('openai');
      if (openaiProvider) {
        const aiProviderConfig = $.currentAIProvider;

        openaiProvider.updateConfig({
          apiKey: aiProviderConfig.apiKey,
          model: aiProviderConfig.model,
          baseURL: aiProviderConfig.baseUrl,
          temperature: aiProviderConfig.temperature,
          maxTokens: aiProviderConfig.maxTokens,
          timeout: aiProviderConfig.timeout,
          promptFormat: aiProviderConfig.promptFormat,
          useContext: aiProviderConfig.useContext,
          customTemplates: aiProviderConfig.customTemplates,
          providerName: aiProviderConfig.name || 'OpenAI', // 传递用户自定义的提供商名称
          showPhoneticInAnnotation: $.showPhoneticInAnnotation !== false,
          showTranslationInAnnotation: $.showTranslationInAnnotation !== false,
          showDefinitionsInAnnotation: $.showDefinitionsInAnnotation === true
        });

        console.log('[Annotate-Translate] AI provider configured:');
        console.log('  - Provider:', aiProviderConfig.name || 'OpenAI');
        console.log('  - API Key:', aiProviderConfig.apiKey ? 'Set' : 'Not set');
        console.log('  - Model:', aiProviderConfig.model);
        console.log('  - Base URL:', aiProviderConfig.baseUrl);
        console.log('  - Temperature:', aiProviderConfig.temperature);
        console.log('  - Max Tokens:', aiProviderConfig.maxTokens);
        console.log('  - Prompt Format:', aiProviderConfig.promptFormat);
        console.log('  - Use Context:', aiProviderConfig.useContext);
        console.log('  - Annotation settings:', {
          showPhonetics: openaiProvider.showPhoneticInAnnotation,
          showTranslation: openaiProvider.showTranslationInAnnotation,
          showDefinitions: openaiProvider.showDefinitionsInAnnotation
        });
      }
    }
  }
  
  // 🆕 配置翻译服务的通用设置
  if ($.showPhoneticInAnnotation !== undefined) {
    translationService.showPhoneticInAnnotation = $.showPhoneticInAnnotation;
    console.log('[Annotate-Translate] Show phonetic in annotation:', $.showPhoneticInAnnotation ? 'Enabled' : 'Disabled');
  }
  
  if ($.showTranslationInAnnotation !== undefined) {
    translationService.showTranslationInAnnotation = $.showTranslationInAnnotation;
    console.log('[Annotate-Translate] Show translation in annotation:', $.showTranslationInAnnotation ? 'Enabled' : 'Disabled');
  }
  
  if ($.showDefinitionsInAnnotation !== undefined) {
    translationService.showDefinitionsInAnnotation = $.showDefinitionsInAnnotation;
    console.log('[Annotate-Translate] Show definitions in annotation:', $.showDefinitionsInAnnotation ? 'Enabled' : 'Disabled');
  }
  
  if ($.enablePhoneticFallback !== undefined) {
    translationService.enablePhoneticFallback = $.enablePhoneticFallback;
    console.log('[Annotate-Translate] Phonetic fallback:', $.enablePhoneticFallback ? 'Enabled' : 'Disabled');
  }
  
  // 配置缓存
  if ($.enableCache) {
    translationService.enableCache($.cacheSize || 100);
  } else {
    translationService.disableCache();
  }
  
  // 重新初始化UI（如果设置改变）
  if (translationUI) {
    translationUI = new TranslationUI({
      showPhonetics: $.showPhonetics,
      showDefinitions: $.showDefinitions,
      showExamples: $.showExamples,
      maxExamples: $.maxExamples,
      enableAudio: $.enableAudio
    });
  }
}

// Handle text selection events
function handleTextSelection(event) {
  // 如果点击在悬浮窗内，不处理
  if (event.target.closest('.annotate-translate-menu')) {
    return;
  }
  
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText && ($.enableTranslate || $.enableAnnotate)) {
    // 保存当前选择的Range
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      lastSelection = selection.getRangeAt(0).cloneRange();
    }
    showContextMenu(event.pageX, event.pageY, selectedText);
  } else {
    hideContextMenu();
    lastSelection = null;
  }
}

// Show context menu for selected text
function showContextMenu(x, y, text) {
  hideContextMenu();
  
  const menu = document.createElement('div');
  menu.id = 'annotate-translate-menu';
  menu.className = 'annotate-translate-menu';
  
  // Apply size class based on settings
  const menuSize = $.menuButtonSize || 'small';
  console.log('[Annotate-Translate] Menu button size:', menuSize, 'Settings:', settings);
  if (menuSize !== 'small') {
    menu.classList.add(`size-${menuSize}`);
  }
  console.log('[Annotate-Translate] Menu classes:', menu.className);
  
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  if ($.enableTranslate) {
    const translateBtn = document.createElement('button');
    translateBtn.textContent = 'T';
    translateBtn.className = 'menu-button';
    translateBtn.title = safeGetMessage('translate', null, 'Translate');
    translateBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault();  // 阻止默认行为
      console.log('[Annotate-Translate] Translate button clicked');
      hideContextMenu();
      translateText(text);
    });
    menu.appendChild(translateBtn);
  }

  if ($.enableAnnotate) {
    // 标注按钮
    const annotateBtn = document.createElement('button');
    annotateBtn.textContent = 'A';
    annotateBtn.className = 'menu-button';
    annotateBtn.title = safeGetMessage('annotate', null, 'Annotate');
    annotateBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('[Annotate-Translate] Annotate button clicked');
      hideContextMenu();
      // 直接标注用户选择的文本，使用保存的 Range
      annotateSelectedText(text);
    });
    menu.appendChild(annotateBtn);
  }

  document.body.appendChild(menu);

  // 阻止菜单本身的点击事件冒泡
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Hide menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 100);
}

// Hide context menu
function hideContextMenu() {
  const menu = document.getElementById('annotate-translate-menu');
  if (menu) {
    menu.remove();
  }
}

// Translate selected text
/**
 * 提取选中文本周围的上下文（基于句子边界）
 * @param {Selection|Range} selectionOrRange - 浏览器的 Selection 对象或 Range 对象
 * @param {number} maxLength - 上下文最大长度（默认 300 字符）
 * @param {string} text - 选中的文本（可选，用于定位）
 * @returns {string} 包含选中文本的完整上下文
 */
function extractContext(selectionOrRange, maxLength = CONTEXT_MAX_LENGTH, text = '') {
  console.log('[Annotate-Translate] extractContext called with:', {
    type: selectionOrRange?.constructor?.name,
    maxLength,
    text,
    rangeCount: selectionOrRange instanceof Selection ? selectionOrRange.rangeCount : 'N/A'
  });
  
  try {
    // 判断是 Selection 还是 Range
    let range;
    let selectedText = text;
    
    if (selectionOrRange instanceof Selection) {
      if (!selectionOrRange || selectionOrRange.rangeCount === 0) {
        console.warn('[Annotate-Translate] extractContext: selection has no ranges');
        return '';
      }
      range = selectionOrRange.getRangeAt(0);
      selectedText = selectedText || selectionOrRange.toString();
      console.log('[Annotate-Translate] Using Selection, selectedText:', selectedText);
    } else if (selectionOrRange instanceof Range) {
      range = selectionOrRange;
      selectedText = selectedText || range.toString();
      console.log('[Annotate-Translate] Using Range, selectedText:', selectedText);
    } else {
      console.warn('[Annotate-Translate] extractContext: invalid parameter type:', typeof selectionOrRange);
      return '';
    }
    
    const container = range.commonAncestorContainer;
    console.log('[Annotate-Translate] Range container:', container, 'nodeType:', container.nodeType);
    
    // 获取包含选中文本的父元素
    const parentElement = container.nodeType === Node.TEXT_NODE 
      ? container.parentElement 
      : container;
    
    if (!parentElement) {
      console.warn('[Annotate-Translate] extractContext: no parent element');
      return '';
    }
    
    console.log('[Annotate-Translate] Parent element:', parentElement.tagName, 'textLength:', parentElement.textContent?.length);
    
    if (!parentElement) {
      console.warn('[Annotate-Translate] extractContext: no parent element');
      return '';
    }

    // 获取足够大的文本范围（向上查找父元素）
    let fullText = parentElement.textContent || '';
    let currentElement = parentElement;
    
    console.log('[Annotate-Translate] Initial fullText length:', fullText.length);
    
    // 向上查找直到获得足够的文本或到达根元素
    while (fullText.length < maxLength * 2 && currentElement.parentElement) {
      currentElement = currentElement.parentElement;
      const parentText = currentElement.textContent || '';
      if (parentText.length > fullText.length) {
        fullText = parentText;
        console.log('[Annotate-Translate] Expanded to parent, new length:', fullText.length);
      } else {
        break; // 不再增长，停止向上查找
      }
    }

    console.log('[Annotate-Translate] Final fullText length:', fullText.length, 'Preview:', fullText.substring(0, 100));

    if (!selectedText || !fullText) {
      console.warn('[Annotate-Translate] extractContext: no text to extract, selectedText:', selectedText, 'fullText length:', fullText.length);
      return '';
    }

    // 查找选中文本在完整文本中的位置
    const selectedIndex = fullText.indexOf(selectedText);
    
    console.log('[Annotate-Translate] Looking for selectedText:', selectedText, 'found at index:', selectedIndex);
    
    if (selectedIndex === -1) {
      console.warn('[Annotate-Translate] extractContext: selected text not found in context');
      // 降级：返回开头部分
      const fallback = fullText.substring(0, maxLength).trim();
      console.log('[Annotate-Translate] Using fallback context, length:', fallback.length);
      return fallback;
    }

    // 策略：提取包含选中文本的完整句子及其前后句
    console.log('[Annotate-Translate] Calling extractSentenceContext with selectedIndex:', selectedIndex, 'length:', selectedText.length);
    const context = extractSentenceContext(fullText, selectedIndex, selectedText.length, maxLength);
    
    console.log('[Annotate-Translate] Extracted context length:', context.length, 
                'Preview:', context.substring(0, 60) + (context.length > 60 ? '...' : ''));
    return context;
    
  } catch (error) {
    console.warn('[Annotate-Translate] Failed to extract context:', error);
    return '';
  }
}

/**
 * 基于句子边界提取上下文
 * @param {string} fullText - 完整文本
 * @param {number} targetIndex - 目标文本在完整文本中的起始位置
 * @param {number} targetLength - 目标文本的长度
 * @param {number} maxLength - 最大上下文长度
 * @returns {string} 提取的上下文
 */
function extractSentenceContext(fullText, targetIndex, targetLength, maxLength) {
  // 句子结束标记（支持中英文）
  const sentenceEnders = /[.!?。！？；;]\s*/g;
  
  // 目标文本的范围
  const targetStart = targetIndex;
  const targetEnd = targetIndex + targetLength;
  
  // 查找所有句子边界
  const sentenceBoundaries = [];
  sentenceBoundaries.push(0); // 开始位置
  
  let match;
  sentenceEnders.lastIndex = 0;
  while ((match = sentenceEnders.exec(fullText)) !== null) {
    sentenceBoundaries.push(match.index + match[0].length);
  }
  sentenceBoundaries.push(fullText.length); // 结束位置
  
  // 找到包含目标文本的句子
  let targetSentenceStart = 0;
  let targetSentenceEnd = fullText.length;
  
  for (let i = 0; i < sentenceBoundaries.length - 1; i++) {
    const start = sentenceBoundaries[i];
    const end = sentenceBoundaries[i + 1];
    
    // 检查目标文本是否在这个句子范围内
    if (start <= targetStart && targetEnd <= end) {
      targetSentenceStart = start;
      targetSentenceEnd = end;
      break;
    }
  }
  
  // 提取当前句子
  let contextStart = targetSentenceStart;
  let contextEnd = targetSentenceEnd;
  let currentContext = fullText.substring(contextStart, contextEnd).trim();
  
  // 如果当前句子已经超过最大长度，使用字符截取策略
  if (currentContext.length > maxLength) {
    return extractByCharacterLimit(fullText, targetIndex, targetLength, maxLength);
  }
  
  // 尝试向前扩展一个句子
  let prevSentenceIndex = sentenceBoundaries.indexOf(targetSentenceStart) - 1;
  if (prevSentenceIndex >= 0) {
    const prevStart = sentenceBoundaries[prevSentenceIndex];
    const withPrevSentence = fullText.substring(prevStart, contextEnd).trim();
    
    if (withPrevSentence.length <= maxLength) {
      contextStart = prevStart;
      currentContext = withPrevSentence;
    }
  }
  
  // 尝试向后扩展一个句子
  let nextSentenceIndex = sentenceBoundaries.indexOf(targetSentenceEnd) + 1;
  if (nextSentenceIndex < sentenceBoundaries.length) {
    const nextEnd = sentenceBoundaries[nextSentenceIndex];
    const withNextSentence = fullText.substring(contextStart, nextEnd).trim();
    
    if (withNextSentence.length <= maxLength) {
      contextEnd = nextEnd;
      currentContext = withNextSentence;
    }
  }
  
  return currentContext;
}

/**
 * 基于字符限制提取上下文（降级策略）
 * @param {string} fullText - 完整文本
 * @param {number} targetIndex - 目标文本起始位置
 * @param {number} targetLength - 目标文本长度
 * @param {number} maxLength - 最大长度
 * @returns {string} 提取的上下文
 */
function extractByCharacterLimit(fullText, targetIndex, targetLength, maxLength) {
  const targetEnd = targetIndex + targetLength;
  
  // 单词边界正则（英文）
  const wordBoundary = /[\s\-,;:]/;
  
  // 计算可用的前后空间
  const availableSpace = maxLength - targetLength;
  let beforeChars = Math.floor(availableSpace / 2);
  let afterChars = availableSpace - beforeChars;
  
  // 向前查找，尽量在单词边界停止
  let contextStart = Math.max(0, targetIndex - beforeChars);
  
  // 调整到单词边界（向前找最多 20 个字符）
  for (let i = 0; i < 20 && contextStart > 0; i++) {
    if (wordBoundary.test(fullText[contextStart]) || /[\u4e00-\u9fa5]/.test(fullText[contextStart])) {
      contextStart++; // 跳过边界字符本身
      break;
    }
    contextStart--;
  }
  
  // 向后查找，尽量在单词边界停止
  let contextEnd = Math.min(fullText.length, targetEnd + afterChars);
  
  // 调整到单词边界（向后找最多 20 个字符）
  for (let i = 0; i < 20 && contextEnd < fullText.length; i++) {
    if (wordBoundary.test(fullText[contextEnd]) || /[\u4e00-\u9fa5]/.test(fullText[contextEnd])) {
      break;
    }
    contextEnd++;
  }
  
  return fullText.substring(contextStart, contextEnd).trim();
}

async function translateText(text) {
  hideContextMenu();
  
  // 移除之前的翻译卡片
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
  
  // 创建加载提示
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'annotate-translate-tooltip loading';
  loadingTooltip.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <span>${safeGetMessage('translating', null, 'Translating...')}</span>
    </div>
  `;
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    loadingTooltip.style.left = (rect.left + window.scrollX) + 'px';
    loadingTooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  }
  
  document.body.appendChild(loadingTooltip);
  currentTooltip = loadingTooltip;

  try {
    // 使用翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    if ($.debugMode && $.showConsoleLogs) {
      console.log('[Annotate-Translate] Translating:', text, 'to', $.targetLanguage);
    }
    
    // 提取上下文信息（使用默认 300 字符限制）
    const context = extractContext(selection, 300, text);
    
    console.log('[Annotate-Translate] Context:', context || '(empty)');
    
    // 调用翻译服务，传递上下文
    const result = await translationService.translate(
      text,
      $.targetLanguage || 'zh-CN',
      'auto',
      { context }  // 传递上下文作为 options
    );
    
    if ($.debugMode && $.showConsoleLogs) {
      console.log('[Annotate-Translate] Translation result:', result);
    }
    
    // 移除加载提示
    loadingTooltip.remove();
    
    // 使用TranslationUI渲染结果
    if (!translationUI) {
      initializeTranslationUI();
    }
    
    // 根据文本长度选择UI模式
    const element = text.length > 50 
      ? translationUI.renderSimple(result)
      : translationUI.render(result);
    
    // 定位翻译卡片
    element.className += ' annotate-translate-tooltip';
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      element.style.left = (rect.left + window.scrollX) + 'px';
      element.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    }
    
    document.body.appendChild(element);
    currentTooltip = element;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'translation-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = safeGetMessage('close', null, 'Close');
    closeBtn.addEventListener('click', () => {
      element.remove();
      currentTooltip = null;
    });
    element.appendChild(closeBtn);

    // 添加清除标注按钮
    const clearBtn = document.createElement('button');
    clearBtn.className = 'translation-clear-btn';
    clearBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 6h18"/>
        <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
        <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
        <line x1="10" x2="10" y1="11" y2="17"/>
        <line x1="14" x2="14" y1="11" y2="17"/>
      </svg>
    `;
    clearBtn.title = safeGetMessage('clearAnnotations', null, 'Clear annotations');
    clearBtn.addEventListener('click', () => {
      clearAnnotationsByText(result.originalText);
    });
    element.appendChild(clearBtn);

    // 自动关闭（如果配置了）
    if ($.autoCloseDelay && $.autoCloseDelay > 0) {
      setTimeout(() => {
        if (element.parentElement) {
          element.remove();
          if (currentTooltip === element) {
            currentTooltip = null;
          }
        }
      }, $.autoCloseDelay * 1000);
    }
    
    // 点击外部关闭
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!element.contains(e.target)) {
          element.remove();
          currentTooltip = null;
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);
    
  } catch (error) {
    console.error('[Annotate-Translate] Translation failed:', error);
    
    // 显示错误消息
    loadingTooltip.className = 'annotate-translate-tooltip error';
    loadingTooltip.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-message">
          <strong>${safeGetMessage('translationFailed', null, 'Translation failed')}</strong>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    
    // 3秒后自动关闭错误提示
    setTimeout(() => {
      if (loadingTooltip.parentElement) {
        loadingTooltip.remove();
      }
      if (currentTooltip === loadingTooltip) {
        currentTooltip = null;
      }
    }, 3000);
  }
}

// Annotate selected text
// 优化版本：直接使用保存的 Range，不再弹窗询问
function annotateSelectedText(text) {
  console.log('[Annotate-Translate] Annotating selected text:', text);
  console.log('[Annotate-Translate] lastSelection:', lastSelection);

  // 优先使用保存的 Range（用户真正选择的位置）
  if (lastSelection) {
    try {
      // 验证 Range 是否仍然有效
      const selectedText = lastSelection.toString();
      console.log('[Annotate-Translate] lastSelection.toString():', selectedText);
      console.log('[Annotate-Translate] lastSelection container:', lastSelection.commonAncestorContainer);

      // 比较时去除首尾空格，因为用户可能选择时多选了空格
      if (selectedText.trim() === text.trim()) {
        console.log('[Annotate-Translate] Using saved range - annotating exact user selection');
        promptAndAnnotate(lastSelection, text);
        return;
      } else {
        console.log('[Annotate-Translate] Saved range text mismatch:', selectedText.trim(), 'vs', text.trim());
      }
    } catch (e) {
      console.error('[Annotate-Translate] Saved range is invalid:', e);
    }
  }

  // 如果没有保存的 Range 或 Range 无效，显示错误
  console.warn('[Annotate-Translate] No valid saved range, cannot annotate');
  showTemporaryMessage(
    safeGetMessage('annotationFailed', null, 'Annotation failed') + ': ' +
    safeGetMessage('pleaseReselectText', null, 'Please select the text again'),
    'error'
  );
}

// 查找文本的第一个匹配项
function findFirstOccurrence(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script, style elements and existing annotations
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.closest('ruby.annotate-translate-ruby')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const node = walker.nextNode();
  if (node) {
    const index = node.nodeValue.indexOf(text);
    return { node, index, text };
  }

  return null;
}

// 标注页面所有相同文本（新功能：替代弹窗）
async function annotateAllOccurrences(text) {
  console.log('[Annotate-Translate] Annotating all occurrences of:', text);

  // 查找所有匹配项
  const matches = findAllOccurrences(text);

  if (matches.length === 0) {
    showTemporaryMessage(
      safeGetMessage('textNotFound', null, 'Could not find the text on the page.'),
      'error'
    );
    return;
  }

  console.log(`[Annotate-Translate] Found ${matches.length} occurrences`);

  // 显示进度提示
  const progressMsg = showTemporaryMessage(
    safeGetMessage('annotatingAll', [matches.length], `Annotating ${matches.length} occurrences...`),
    'loading',
    0 // 不自动关闭
  );

  try {
    // 先翻译一次（所有匹配项使用相同的翻译）
    const result = await translationService.translate(
      text,
      $.targetLanguage || 'zh-CN',
      'auto',
      { context: extractContextFromMatch(matches[0]) }
    );

    // 判断是否应该隐藏读音
    const shouldHidePhonetic = $.hidePhoneticForMultipleWords && isMultipleEnglishWords(text);

    // 使用翻译结果
    let annotationText;
    if (shouldHidePhonetic) {
      annotationText = result.translatedText;
    } else {
      annotationText = result.annotationText || result.translatedText;
    }

    // 批量标注所有匹配项（从后往前，避免 DOM 变化影响索引）
    let successCount = 0;
    for (let i = matches.length - 1; i >= 0; i--) {
      const match = matches[i];
      try {
        if (!document.contains(match.node)) {
          console.warn('[Annotate-Translate] Node no longer in document, skipping');
          continue;
        }

        const range = document.createRange();
        range.setStart(match.node, match.index);
        range.setEnd(match.node, match.index + match.text.length);
        createRubyAnnotation(range, text, annotationText, result);
        successCount++;
      } catch (e) {
        console.error('[Annotate-Translate] Failed to annotate match:', e);
      }
    }

    // 移除进度提示
    if (progressMsg && progressMsg.parentElement) {
      progressMsg.remove();
    }

    // 显示成功提示
    showTemporaryMessage(
      safeGetMessage('annotatedCount', [successCount, matches.length],
        `Successfully annotated ${successCount} of ${matches.length} occurrences`),
      'success'
    );

    console.log(`[Annotate-Translate] Successfully annotated ${successCount}/${matches.length} occurrences`);

  } catch (error) {
    console.error('[Annotate-Translate] Batch annotation failed:', error);

    // 移除进度提示
    if (progressMsg && progressMsg.parentElement) {
      progressMsg.remove();
    }

    // 显示错误
    showTemporaryMessage(
      safeGetMessage('annotationFailed', null, 'Annotation failed') + ': ' + error.message,
      'error'
    );
  }
}

// 查找所有匹配项
function findAllOccurrences(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (node.parentElement.tagName === 'SCRIPT' ||
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.closest('ruby.annotate-translate-ruby')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const matches = [];
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.nodeValue;
    let index = nodeText.indexOf(text);
    while (index !== -1) {
      matches.push({
        node: node,
        index: index,
        text: text
      });
      index = nodeText.indexOf(text, index + 1);
    }
  }

  return matches;
}

// 从匹配项提取上下文
function extractContextFromMatch(match) {
  if (!match) return '';

  try {
    const range = document.createRange();
    range.setStart(match.node, match.index);
    range.setEnd(match.node, match.index + match.text.length);
    return extractContext(range, CONTEXT_MAX_LENGTH, match.text);
  } catch (e) {
    console.warn('[Annotate-Translate] Failed to extract context:', e);
    return '';
  }
}

// 显示临时消息（替代 alert）
function showTemporaryMessage(message, type = 'info', autoCloseMs = ERROR_MESSAGE_AUTO_CLOSE_MS) {
  const toast = document.createElement('div');
  toast.className = `annotate-translate-toast toast-${type}`;

  const icon = type === 'error' ? '⚠️' :
               type === 'success' ? '✅' :
               type === 'loading' ? '⏳' : 'ℹ️';

  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-message">${message}</span>
  `;

  document.body.appendChild(toast);

  // 添加显示动画
  requestAnimationFrame(() => {
    toast.classList.add('toast-visible');
  });

  // 自动关闭（如果设置了）
  if (autoCloseMs > 0) {
    setTimeout(() => {
      toast.classList.remove('toast-visible');
      setTimeout(() => {
        if (toast.parentElement) {
          toast.remove();
        }
      }, 300); // 等待淡出动画
    }, autoCloseMs);
  }

  return toast;
}

// 查找并标注文本（保留用于右键菜单或其他场景）
function findAndAnnotateText(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.closest('ruby.annotate-translate-ruby')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const matches = [];
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.nodeValue;
    let index = nodeText.indexOf(text);
    while (index !== -1) {
      matches.push({
        node: node,
        index: index,
        text: text
      });
      index = nodeText.indexOf(text, index + 1);
    }
  }
  
  if (matches.length === 0) {
    alert('Could not find the selected text on the page.');
    return;
  }
  
  console.log(`[Annotate-Translate] Found ${matches.length} match(es)`);
  
  // 如果只有一个匹配，直接标注
  if (matches.length === 1) {
    const match = matches[0];
    const range = document.createRange();
    range.setStart(match.node, match.index);
    range.setEnd(match.node, match.index + match.text.length);
    promptAndAnnotate(range, text);
  } else {
    // 多个匹配，询问用户
    promptForMultipleMatches(matches, text);
  }
}

// 处理多个匹配的情况
function promptForMultipleMatches(matches, text) {
  // 创建一个更友好的对话框
  const dialog = document.createElement('div');
  dialog.className = 'annotate-translate-dialog';
  const multipleMatchesText = safeGetMessage('multipleMatchesFound', null, 'Multiple matches found');
  const foundOccurrencesText = safeGetMessage('foundOccurrences', [matches.length.toString(), escapeHtml(text)], 
    `Found <strong>${matches.length}</strong> occurrences of "<strong>${escapeHtml(text)}</strong>"`);
  const annotateFirstText = safeGetMessage('annotateFirstOnly', null, 'Annotate First Only');
  const annotateAllText = safeGetMessage('annotateAll', [matches.length.toString()], `Annotate All (${matches.length})`);
  const cancelText = safeGetMessage('cancel', null, 'Cancel');
  
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>${multipleMatchesText}</h3>
      <p>${foundOccurrencesText}</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-primary" data-action="first">
          ${annotateFirstText}
        </button>
        <button class="dialog-btn dialog-btn-success" data-action="all">
          ${annotateAllText}
        </button>
        <button class="dialog-btn dialog-btn-secondary" data-action="cancel">
          ${cancelText}
        </button>
      </div>
    </div>
    <div class="dialog-overlay"></div>
  `;
  
  document.body.appendChild(dialog);
  
  // 处理按钮点击
  dialog.addEventListener('click', function(e) {
    const btn = e.target.closest('.dialog-btn');
    if (!btn) return;
    
    const action = btn.dataset.action;
    dialog.remove();
    
    if (action === 'first') {
      // 只标注第一个
      const match = matches[0];
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + match.text.length);
      promptAndAnnotate(range, text);
    } else if (action === 'all') {
      // 标注所有
      promptForBatchAnnotation(matches, text);
    }
  });
  
  // 点击遮罩层关闭
  dialog.querySelector('.dialog-overlay').addEventListener('click', function() {
    dialog.remove();
  });
}

// HTML转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 标注所有匹配项
function annotateAllMatches(matches, text, annotation) {
  let successCount = 0;
  
  // 从后往前标注，避免DOM变化影响后续的索引
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    try {
      // 重新验证节点是否仍然有效
      if (!document.contains(match.node)) {
        console.warn('[Annotate-Translate] Node no longer in document, skipping');
        continue;
      }
      
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + match.text.length);
      createRubyAnnotation(range, text, annotation);
      successCount++;
    } catch (e) {
      console.error('[Annotate-Translate] Failed to annotate match:', e);
    }
  }
  
  console.log(`[Annotate-Translate] Successfully annotated ${successCount}/${matches.length} occurrences`);
  
  if (successCount < matches.length) {
    alert(`Annotated ${successCount} out of ${matches.length} occurrences.\nSome annotations may have failed.`);
  }
}

// 批量自动翻译标注
async function promptForBatchAnnotation(matches, text) {
  // 创建加载提示
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'annotate-translate-tooltip loading';
  loadingTooltip.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <span>${safeGetMessage('annotating', null, 'Annotating...')}</span>
    </div>
  `;
  
  // 在第一个匹配项附近显示loading
  if (matches.length > 0) {
    const firstMatch = matches[0];
    const range = document.createRange();
    range.setStart(firstMatch.node, firstMatch.index);
    range.setEnd(firstMatch.node, firstMatch.index + firstMatch.text.length);
    const rect = range.getBoundingClientRect();
    loadingTooltip.style.left = (rect.left + window.scrollX) + 'px';
    loadingTooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  }
  
  document.body.appendChild(loadingTooltip);
  
  try {
    // 检查翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    console.log('[Annotate-Translate] Batch auto-annotating:', text, `(${matches.length} occurrences)`);
    
    // 提取第一个匹配项的上下文，直接使用 range
    let context = '';
    if (matches.length > 0) {
      const firstMatch = matches[0];
      const range = document.createRange();
      range.setStart(firstMatch.node, firstMatch.index);
      range.setEnd(firstMatch.node, firstMatch.index + firstMatch.text.length);
      
      // 直接使用 range 提取上下文（使用默认 300 字符）
      context = extractContext(range, 300, text);
      
      console.log('[Annotate-Translate] Context (batch):', context || '(empty)');
    }
    
    // 调用翻译服务，传递上下文
    const result = await translationService.translate(
      text,
      $.targetLanguage || 'zh-CN',
      'auto',
      { context }
    );
    
    // 移除加载提示
    loadingTooltip.remove();
    
    // 使用 annotationText（可能包含读音）或 translatedText 作为标注
    const annotationText = result.annotationText || result.translatedText;
    
    // 使用翻译结果标注所有匹配项
    annotateAllMatches(matches, text, annotationText);
    
    console.log('[Annotate-Translate] Batch auto-annotated with:', annotationText);
    
  } catch (error) {
    console.error('[Annotate-Translate] Auto-translate failed:', error);
    
    // 显示错误消息
    loadingTooltip.className = 'annotate-translate-tooltip error';
    loadingTooltip.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-message">
          <strong>${safeGetMessage('annotationFailed', null, 'Annotation failed')}</strong>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    
    // 3秒后自动关闭错误提示
    setTimeout(() => {
      if (loadingTooltip.parentElement) {
        loadingTooltip.remove();
      }
    }, 3000);
  }
}

// 自动翻译并标注
async function promptAndAnnotate(range, text) {
  // 创建加载提示
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'annotate-translate-tooltip loading';
  loadingTooltip.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <span>${safeGetMessage('annotating', null, 'Annotating...')}</span>
    </div>
  `;
  
  // 在选中的文本附近显示loading
  const rect = range.getBoundingClientRect();
  loadingTooltip.style.left = (rect.left + window.scrollX) + 'px';
  loadingTooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  
  document.body.appendChild(loadingTooltip);
  
  try {
    // 检查翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    console.log('[Annotate-Translate] Auto-annotating:', text);
    
    // 直接使用 range 对象提取上下文（使用默认 300 字符）
    const context = extractContext(range, 300, text);
    
    console.log('[Annotate-Translate] Context (annotate):', context || '(empty)');
    
    // 调用翻译服务，传递上下文
    const result = await translationService.translate(
      text,
      $.targetLanguage || 'zh-CN',
      'auto',
      { context }
    );
    
    // 移除加载提示
    loadingTooltip.remove();
    
    // 判断是否应该隐藏读音
    const shouldHidePhonetic = $.hidePhoneticForMultipleWords && isMultipleEnglishWords(text);
    
    // 使用 annotationText（可能包含读音）或 translatedText 作为标注
    // 如果设置为隐藏多个单词的读音，则只使用翻译文本
    let annotationText;
    if (shouldHidePhonetic) {
      // 多个单词且启用隐藏读音，只显示翻译
      annotationText = result.translatedText;
      console.log('[Annotate-Translate] Multiple words detected, hiding phonetics');
    } else {
      // 单个单词或未启用隐藏读音，可以显示读音
      annotationText = result.annotationText || result.translatedText;
    }
    
    createRubyAnnotation(range, text, annotationText, result);
    
    console.log('[Annotate-Translate] Auto-annotated with:', annotationText);
    
  } catch (error) {
    console.error('[Annotate-Translate] Auto-translate failed:', error);
    
    // 显示错误消息
    loadingTooltip.className = 'annotate-translate-tooltip error';
    loadingTooltip.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-message">
          <strong>${safeGetMessage('annotationFailed', null, 'Annotation failed')}</strong>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    
    // 3秒后自动关闭错误提示
    setTimeout(() => {
      if (loadingTooltip.parentElement) {
        loadingTooltip.remove();
      }
    }, 3000);
  }
}

/**
 * 检查文本是否包含多个英语单词
 * @param {string} text - 要检查的文本
 * @returns {boolean} 如果包含多个英语单词返回 true
 */
function isMultipleEnglishWords(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  // 去除首尾空格
  const trimmedText = text.trim();
  
  // 检查是否包含英文字符
  const hasEnglish = /[a-zA-Z]/.test(trimmedText);
  if (!hasEnglish) {
    return false;
  }
  
  // 分割单词（按空格、标点等分割）
  // 匹配连续的字母（可能包含连字符和撇号）
  const words = trimmedText.match(/[a-zA-Z]+(?:[-'][a-zA-Z]+)*/g);
  
  // 如果找到多于一个单词，返回 true
  return words && words.length > 1;
}

/**
 * 创建 Ruby 元素（不进行 DOM 操作）
 * 供 annotation-scanner 批量处理时使用
 * @param {string} baseText - 基础文本
 * @param {string} annotationText - 标注文本
 * @param {Object} result - 翻译结果对象
 * @returns {HTMLElement} ruby 元素
 */
function createRubyElement(baseText, annotationText, result = null) {
  // Create ruby element structure
  const ruby = document.createElement('ruby');
  ruby.className = 'annotate-translate-ruby';
  ruby.setAttribute('data-annotation', annotationText);
  ruby.setAttribute('data-base-text', baseText);

  // Add base text
  ruby.textContent = baseText;

  // Create rt (ruby text) element for annotation
  const rt = document.createElement('rt');
  rt.className = 'annotate-translate-rt';

  // 检查是否应该隐藏读音（当文本为多个英语单词且设置启用时）
  const shouldHidePhonetic = $.hidePhoneticForMultipleWords && isMultipleEnglishWords(baseText);

  // Add annotation text
  const textSpan = document.createElement('span');
  textSpan.textContent = annotationText;
  rt.appendChild(textSpan);

  // Add audio button if phonetics available and annotation audio is enabled
  // 如果设置为隐藏多个单词的读音，则不显示音频按钮
  if (result && result.phonetics && result.phonetics.length > 0 &&
      $.enableAudioInAnnotation && !shouldHidePhonetic) {
    const audioButton = createAudioButton(result.phonetics, baseText);
    rt.appendChild(audioButton);
  }

  ruby.appendChild(rt);

  // Store annotation with full result data
  annotations.set(ruby, {
    base: baseText,
    annotation: annotationText,
    phonetics: result ? result.phonetics : null,
    fullResult: result  // 保存完整的翻译结果
  });

  // Add click event to show detailed translation
  if (result && (result.definitions || result.examples)) {
    ruby.style.cursor = 'pointer';
    ruby.setAttribute('title', safeGetMessage('clickToViewDetails', null, 'Click to view detailed translation'));

    ruby.addEventListener('click', (e) => {
      // 如果点击的是音频按钮，不显示详细弹窗
      if (e.target.closest('.annotate-audio-button')) {
        return;
      }

      e.stopPropagation();
      showDetailedTranslation(ruby, result);
    });
  }

  return ruby;
}

// Create ruby tag annotation
function createRubyAnnotation(range, baseText, annotationText, result = null) {
  try {
    console.log('[Annotate-Translate] Creating ruby annotation for:', baseText, 'with:', annotationText);

    // Use the helper function to create ruby element
    const ruby = createRubyElement(baseText, annotationText, result);

    // Replace the selected text with the ruby element
    range.deleteContents();
    range.insertNode(ruby);

    // Save annotation to storage
    saveAnnotation(baseText, annotationText);

    // Clear selection
    window.getSelection().removeAllRanges();

    console.log('[Annotate-Translate] Ruby annotation created successfully');
  } catch (e) {
    console.error('[Annotate-Translate] Failed to create ruby annotation:', e);
    alert('Failed to annotate text. Please try selecting the text again.');
  }
}

/**
 * Clear annotations by text
 * Remove all ruby annotations that match the given text
 * @param {string} text - The base text to search for
 */
function clearAnnotationsByText(text) {
  console.log('[Annotate-Translate] Clearing annotations for text:', text);

  // Normalize text for comparison (trim and lowercase)
  const normalizedText = text.trim().toLowerCase();
  let removedCount = 0;

  // Find all ruby elements with matching text
  const rubyElements = document.querySelectorAll('.annotate-translate-ruby');

  rubyElements.forEach(ruby => {
    const baseText = ruby.getAttribute('data-base-text');

    if (baseText && baseText.trim().toLowerCase() === normalizedText) {
      try {
        // Get the original text content
        const textContent = ruby.textContent;

        // Create a text node with the original content
        const textNode = document.createTextNode(textContent);

        // Replace ruby element with plain text
        if (ruby.parentNode) {
          ruby.parentNode.replaceChild(textNode, ruby);

          // Remove from annotations map
          annotations.delete(ruby);

          removedCount++;
          console.log('[Annotate-Translate] Removed annotation for:', baseText);
        }
      } catch (error) {
        console.error('[Annotate-Translate] Failed to remove annotation:', error);
      }
    }
  });

  if (removedCount > 0) {
    console.log(`[Annotate-Translate] Removed ${removedCount} annotation(s)`);
    // Show a brief confirmation message
    showToast(safeGetMessage('annotationsCleared', null, `${removedCount} annotation(s) cleared`));
  } else {
    console.log('[Annotate-Translate] No annotations found for text:', text);
    showToast(safeGetMessage('noAnnotationsFound', null, 'No annotations found'));
  }
}

/**
 * Show a toast message
 * @param {string} message - Message to display
 */
function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'annotate-translate-toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  // Trigger fade-in
  setTimeout(() => toast.classList.add('show'), 10);

  // Auto remove after 2 seconds
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// Audio cache for better performance
const audioCache = new Map(); // Cache Audio objects
const audioCacheMaxSize = AUDIO_CACHE_MAX_SIZE; // Max cached audio files

// Create audio playback button
function createAudioButton(phonetics, text) {
  const button = document.createElement('button');
  button.className = 'annotate-audio-button';
  
  // 使用内联 SVG 图标（volume-2）
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
      <path d="M16 9a5 5 0 0 1 0 6"/>
      <path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>
    </svg>
  `;
  
  button.title = 'Play pronunciation';
  button.setAttribute('aria-label', 'Play pronunciation');
  
  // Prevent button click from triggering parent events
  button.addEventListener('click', async (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    try {
      button.classList.add('playing');
      await playPhoneticAudio(phonetics, text);
    } catch (error) {
      console.error('[Annotate-Translate] Audio playback error:', error);
      // Visual feedback for error
      button.style.color = '#d93025';
      setTimeout(() => {
        button.style.color = '';
        // 恢复图标
        button.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z"/>
            <path d="M16 9a5 5 0 0 1 0 6"/>
            <path d="M19.364 18.364a9 9 0 0 0 0-12.728"/>
          </svg>
        `;
      }, 1000);
    } finally {
      button.classList.remove('playing');
    }
  });
  
  return button;
}

// Play phonetic audio
async function playPhoneticAudio(phonetics, text) {
  console.log('[Annotate-Translate] Playing audio for:', text, phonetics);
  
  // Priority:
  // 1. audioUrl from phonetics
  // 2. Web Speech API (TTS)
  
  // Try to find phonetic with audioUrl
  const phoneticWithAudio = phonetics.find(p => p.audioUrl);
  
  if (phoneticWithAudio && phoneticWithAudio.audioUrl) {
    console.log('[Annotate-Translate] Playing from URL:', phoneticWithAudio.audioUrl);
    return playAudioFromUrl(phoneticWithAudio.audioUrl);
  }
  
  // Fallback to Web Speech API
  console.log('[Annotate-Translate] Using Web Speech API for:', text);
  return playTextToSpeech(text);
}

// Play audio from URL with caching
function playAudioFromUrl(url) {
  return new Promise((resolve, reject) => {
    let audio;
    
    // Check if audio is cached
    if (audioCache.has(url)) {
      console.log('[Annotate-Translate] Using cached audio for:', url);
      audio = audioCache.get(url);
      // Reset audio to beginning
      audio.currentTime = 0;
    } else {
      console.log('[Annotate-Translate] Loading new audio for:', url);
      audio = new Audio(url);
      
      // Cache the audio object
      audioCache.set(url, audio);
      
      // Implement LRU cache - remove oldest if cache is full
      if (audioCache.size > audioCacheMaxSize) {
        const firstKey = audioCache.keys().next().value;
        console.log('[Annotate-Translate] Cache full, removing:', firstKey);
        audioCache.delete(firstKey);
      }
    }
    
    // Set up event listeners
    const onEnded = () => {
      console.log('[Annotate-Translate] Audio playback completed');
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      resolve();
    };
    
    const onError = (e) => {
      console.error('[Annotate-Translate] Audio playback error:', e);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      reject(new Error('Failed to load audio'));
    };
    
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    
    // Play the audio
    audio.play().catch(reject);
  });
}

// Play text using Web Speech API
// Note: TTS doesn't use cache as it's already fast and memory-efficient
function playTextToSpeech(text) {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US'; // Default to English
    utterance.rate = 0.9; // Slightly slower for clarity
    
    utterance.onend = () => {
      console.log('[Annotate-Translate] TTS playback completed');
      resolve();
    };
    
    utterance.onerror = (e) => {
      console.error('[Annotate-Translate] TTS error:', e);
      reject(new Error('Text-to-speech failed'));
    };
    
    window.speechSynthesis.speak(utterance);
  });
}

// Clear audio cache (useful for memory management)
function clearAudioCache() {
  console.log(`[Annotate-Translate] Clearing audio cache (${audioCache.size} items)`);
  audioCache.clear();
}

// Get audio cache stats
function getAudioCacheStats() {
  return {
    size: audioCache.size,
    maxSize: audioCacheMaxSize,
    urls: Array.from(audioCache.keys())
  };
}

// Save annotation to storage
function saveAnnotation(baseText, annotationText) {
  // Check if extension context is still valid
  if (!isExtensionContextValid()) {
    console.warn('[Annotate-Translate] Extension context invalidated, skipping annotation save');
    return;
  }
  
  try {
    chrome.storage.local.get({annotations: []}, function(result) {
      // Check for chrome.runtime.lastError
      if (chrome.runtime.lastError) {
        console.warn('[Annotate-Translate] Failed to save annotation:', chrome.runtime.lastError.message);
        return;
      }
      
      const annotations = result.annotations;
      annotations.push({
        baseText: baseText,
        annotationText: annotationText || '',
        timestamp: Date.now(),
        url: window.location.href
      });
      
      chrome.storage.local.set({annotations: annotations}, function() {
        if (chrome.runtime.lastError) {
          console.warn('[Annotate-Translate] Failed to save annotation:', chrome.runtime.lastError.message);
        }
      });
    });
  } catch (error) {
    // Silently handle extension context invalidation
    // The annotation is already created in the DOM, so this is not a critical error
    console.warn('[Annotate-Translate] Failed to save annotation:', error.message);
  }
}

// Handle messages from popup or background
function handleMessage(request, sender, sendResponse) {
  console.log('[Annotate-Translate] Received message:', request);
  
  if (request.action === 'ping') {
    // Respond to ping to confirm content script is loaded
    sendResponse({pong: true});
  } else if (request.action === 'updateSettings') {
    // 从 storage 重新加载所有设置（而不是只使用消息中的部分设置）
    if (!isExtensionContextValid()) {
      sendResponse({success: false, error: 'Extension context invalidated'});
      return true;
    }
    
    try {
      chrome.storage.sync.get(null, function(items) {
        if (chrome.runtime.lastError) {
          console.error('[Annotate-Translate] Failed to reload settings:', chrome.runtime.lastError.message);
          sendResponse({success: false, error: chrome.runtime.lastError.message});
          return;
        }
        
        settings = Object.assign({}, settings, items);
        console.log('[Annotate-Translate] Settings reloaded from storage:', settings);
        
        // 重新应用翻译设置
        applyTranslationSettings();
        
        sendResponse({success: true});
      });
    } catch (error) {
      console.error('[Annotate-Translate] Error reloading settings:', error.message);
      sendResponse({success: false, error: error.message});
    }
    // 返回 true 表示异步响应
    return true;
  } else if (request.action === 'clearCache') {
    // 清除翻译缓存
    if (typeof translationService !== 'undefined') {
      translationService.clearCache();
      console.log('[Annotate-Translate] Translation cache cleared');
      sendResponse({success: true});
    } else {
      sendResponse({success: false, error: 'Translation service not available'});
    }
  } else if (request.action === 'clearAnnotations') {
    clearAllAnnotations();
    sendResponse({success: true});
  } else if (request.action === 'annotate' && request.text) {
    // Handle annotate action from context menu
    console.log('[Annotate-Translate] Annotating text:', request.text);
    annotateSelectedText(request.text);
    sendResponse({success: true});
  } else if (request.action === 'translate' && request.text) {
    // Handle translate action from context menu
    console.log('[Annotate-Translate] Translating text:', request.text);
    translateText(request.text);
    sendResponse({success: true});
  } else if (request.action === 'annotate_page') {
    // Handle vocabulary annotation action
    console.log('[Annotate-Translate] Annotating page vocabulary');

    // 获取词汇配置信息
    const vocabularyConfig = {
      provider: vocabularyService.activeProvider ? vocabularyService.activeProvider.name : 'unknown',
      options: vocabularyService.activeOptions || {}
    };

    // 调试：打印扫描选项
    const scanOptions = {
      fetchTranslation: $.vocabularyShowTranslation,
      fetchPhonetic: $.vocabularyShowPhonetic,
      sourceLang: 'en',
      targetLang: $.targetLanguage,
      vocabularyConfig: vocabularyConfig  // 传递词汇配置信息
    };
    console.log('[Annotate-Translate] Scan options:', scanOptions);
    console.log('[Annotate-Translate] TranslationService available:', !!translationService);

    if (annotationScanner) {
      annotationScanner.scanPage(scanOptions).then(result => {
        console.log('[Annotate-Translate] Annotation result:', result);
        sendResponse(result);
      }).catch(error => {
        console.error('[Annotate-Translate] Annotation failed:', error);
        sendResponse({ status: 'error', error: error.message });
      });
    } else {
      console.error('[Annotate-Translate] AnnotationScanner not initialized');
      sendResponse({ status: 'error', error: 'AnnotationScanner not initialized' });
    }
    return true; // 异步响应
  } else if (request.action === 'remove_annotations') {
    // Handle remove annotations action
    console.log('[Annotate-Translate] Removing vocabulary annotations');
    if (annotationScanner) {
      const count = annotationScanner.removeAnnotations();
      console.log(`[Annotate-Translate] Removed ${count} annotations`);
      sendResponse({ status: 'success', count });
    } else {
      console.error('[Annotate-Translate] AnnotationScanner not initialized');
      sendResponse({ status: 'error', error: 'AnnotationScanner not initialized' });
    }
  }
  return true;
}

// Show detailed translation popup for annotation
function showDetailedTranslation(rubyElement, result) {
  console.log('[Annotate-Translate] Showing detailed translation for:', result.originalText);
  
  // 移除之前的翻译卡片
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
  
  // 初始化 TranslationUI（如果还没有）
  if (!translationUI) {
    initializeTranslationUI();
  }
  
  // 根据文本长度选择UI模式
  const element = result.originalText.length > 50 
    ? translationUI.renderSimple(result)
    : translationUI.render(result);
  
  // 定位翻译卡片到 ruby 元素下方
  element.className += ' annotate-translate-tooltip annotation-detail-popup';
  const rect = rubyElement.getBoundingClientRect();
  element.style.left = (rect.left + window.scrollX) + 'px';
  element.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  
  document.body.appendChild(element);
  currentTooltip = element;
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.className = 'translation-close-btn';
  closeBtn.innerHTML = '×';
  closeBtn.title = safeGetMessage('close', null, 'Close');
  closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    element.remove();
    currentTooltip = null;
  });
  element.appendChild(closeBtn);
  
  // 点击外部关闭
  setTimeout(() => {
    const closeHandler = (e) => {
      if (!element.contains(e.target) && !rubyElement.contains(e.target)) {
        element.remove();
        currentTooltip = null;
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }, 100);
  
  console.log('[Annotate-Translate] Detailed translation popup shown');
}

// Clear all annotations from the page
function clearAllAnnotations() {
  // Clear old style highlights
  const highlights = document.querySelectorAll('.annotate-translate-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    parent.removeChild(highlight);
  });
  
  // Clear ruby annotations
  const rubyElements = document.querySelectorAll('ruby.annotate-translate-ruby');
  rubyElements.forEach(ruby => {
    const baseText = ruby.getAttribute('data-base-text') || ruby.textContent;
    const textNode = document.createTextNode(baseText);
    ruby.parentNode.replaceChild(textNode, ruby);
  });
  
  annotations.clear();
  
  // Clear from storage
  if (isExtensionContextValid()) {
    try {
      chrome.storage.local.set({annotations: []}, function() {
        if (chrome.runtime.lastError) {
          console.warn('[Annotate-Translate] Failed to clear annotations from storage:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.warn('[Annotate-Translate] Failed to clear annotations from storage:', error.message);
    }
  }
}
