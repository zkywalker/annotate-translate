/**
 * i18n Helper Module
 * 
 * 该模块提供国际化（i18n）辅助函数，用于在扩展的各个部分获取本地化文本。
 * 
 * 使用方法：
 * 1. 在HTML中：使用 data-i18n 属性
 * 2. 在JavaScript中：调用 i18n() 或 chrome.i18n.getMessage()
 * 
 * @example
 * // HTML中使用
 * <h1 data-i18n="settings"></h1>
 * <button data-i18n="saveSettings" data-i18n-title="saveSettings"></button>
 * 
 * @example
 * // JavaScript中使用
 * const text = i18n('settings');
 * const withPlaceholder = i18n('foundOccurrences', ['5', 'hello']);
 */

// Custom messages loaded from user-selected language
let customMessages = null;

/**
 * 获取本地化消息（简化版）
 * 支持用户自定义语言选择
 * @param {string} key - 消息键名
 * @param {string[]} substitutions - 替换参数数组
 * @returns {string} 本地化后的文本
 */
function i18n(key, substitutions = []) {
  // First check custom messages (user-selected language)
  if (customMessages && customMessages[key]) {
    let message = customMessages[key].message;
    // Simple placeholder replacement
    if (substitutions && substitutions.length > 0) {
      substitutions.forEach((sub, index) => {
        const placeholder = `$${index + 1}`;
        message = message.replace(new RegExp(`\\$${index + 1}\\$`, 'g'), sub);
      });
    }
    return message;
  }
  
  // Fall back to Chrome i18n API (uses default_locale from manifest)
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    const message = chrome.i18n.getMessage(key, substitutions);
    if (message) return message;
  }
  
  // Last resort: return the key itself (better than nothing)
  console.warn(`[i18n] Missing translation for key: ${key}`);
  return key;
}

/**
 * 加载用户选择的语言
 * @param {string} langCode - 语言代码（如 'zh-CN'）
 * @returns {Promise<void>}
 */
async function loadCustomLanguage(langCode) {
  if (!langCode || langCode === 'auto') {
    customMessages = null;
    return;
  }
  
  try {
    // Convert langCode to locale format (zh-CN -> zh_CN)
    const locale = langCode.replace('-', '_');
    const url = chrome.runtime.getURL(`_locales/${locale}/messages.json`);
    const response = await fetch(url);
    customMessages = await response.json();
    console.log(`[i18n] Loaded custom language: ${langCode}`);
  } catch (error) {
    console.error(`[i18n] Failed to load language ${langCode}:`, error);
    customMessages = null;
  }
}

/**
 * 初始化语言设置
 * 根据用户设置加载对应语言
 * @returns {Promise<void>}
 */
async function initializeLanguage() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(null, async (stored) => {
      // 使用新的分层结构
      let uiLanguage = stored.general?.uiLanguage || 'auto';
      
      // 如果是 auto，尝试使用浏览器语言
      if (uiLanguage === 'auto') {
        const browserLang = chrome.i18n.getUILanguage();
        console.log('[i18n] Browser language:', browserLang);
        
        // 将浏览器语言转换为我们支持的格式
        if (browserLang.startsWith('zh')) {
          uiLanguage = browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
        } else if (browserLang.startsWith('ja')) {
          uiLanguage = 'ja';
        } else if (browserLang.startsWith('ko')) {
          uiLanguage = 'ko';
        } else if (browserLang.startsWith('es')) {
          uiLanguage = 'es';
        } else if (browserLang.startsWith('fr')) {
          uiLanguage = 'fr';
        } else if (browserLang.startsWith('de')) {
          uiLanguage = 'de';
        } else {
          uiLanguage = 'en'; // 默认使用英文
        }
        
        console.log('[i18n] Detected language:', uiLanguage);
      }
      
      // 加载自定义语言（包括英文）
      // 注意：即使是英文也需要显式加载，以确保不受浏览器默认语言影响
      if (uiLanguage && uiLanguage !== 'auto') {
        await loadCustomLanguage(uiLanguage);
      } else {
        // 如果是 auto 但已检测到语言，也需要加载
        customMessages = null;
      }
      resolve();
    });
  });
}

/**
 * 自动本地化页面中所有带 data-i18n 属性的元素
 * 
 * 支持的属性：
 * - data-i18n: 设置元素的 textContent
 * - data-i18n-placeholder: 设置元素的 placeholder
 * - data-i18n-title: 设置元素的 title
 * - data-i18n-value: 设置元素的 value
 * - data-i18n-html: 设置元素的 innerHTML（谨慎使用）
 * 
 * @example
 * // 在 DOMContentLoaded 中调用
 * document.addEventListener('DOMContentLoaded', async function() {
 *   await initializeLanguage(); // 先加载用户选择的语言
 *   localizeHtmlPage();
 * });
 */
function localizeHtmlPage() {
  // 本地化所有带 data-i18n 属性的元素
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.getAttribute('data-i18n');
    if (key) {
      element.textContent = i18n(key);
    }
  });

  // 本地化带 data-i18n-html 属性的元素（支持HTML内容）
  document.querySelectorAll('[data-i18n-html]').forEach(element => {
    const key = element.getAttribute('data-i18n-html');
    if (key) {
      element.innerHTML = i18n(key);
    }
  });

  // 本地化 placeholder
  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const key = element.getAttribute('data-i18n-placeholder');
    if (key) {
      element.placeholder = i18n(key);
    }
  });

  // 本地化 title
  document.querySelectorAll('[data-i18n-title]').forEach(element => {
    const key = element.getAttribute('data-i18n-title');
    if (key) {
      element.title = i18n(key);
    }
  });

  // 本地化 value
  document.querySelectorAll('[data-i18n-value]').forEach(element => {
    const key = element.getAttribute('data-i18n-value');
    if (key) {
      element.value = i18n(key);
    }
  });
}

/**
 * 获取本地化的语言名称
 * @param {string} langCode - 语言代码（如 'en', 'zh-CN'）
 * @returns {string} 本地化的语言名称
 */
function getLocalizedLanguageName(langCode) {
  const langKeyMap = {
    'en': 'langEnglish',
    'zh-CN': 'langChineseSimplified',
    'zh-TW': 'langChineseTraditional',
    'ja': 'langJapanese',
    'ko': 'langKorean',
    'es': 'langSpanish',
    'fr': 'langFrench',
    'de': 'langGerman',
    'ru': 'langRussian'
  };
  
  const key = langKeyMap[langCode];
  return key ? i18n(key) : langCode;
}

/**
 * 获取当前浏览器的UI语言
 * @returns {string} 语言代码（如 'en', 'zh-CN'）
 */
function getCurrentLanguage() {
  if (typeof chrome !== 'undefined' && chrome.i18n) {
    return chrome.i18n.getUILanguage();
  }
  return navigator.language || 'en';
}

/**
 * 获取扩展支持的所有语言
 * @returns {Array<{code: string, name: string}>} 语言列表
 */
function getSupportedLanguages() {
  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh-CN', name: '中文（简体）' },
    { code: 'zh-TW', name: '中文（繁體）' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'ru', name: 'Русский' }
  ];
  
  // 添加本地化的语言名称
  return languages.map(lang => ({
    ...lang,
    localizedName: getLocalizedLanguageName(lang.code)
  }));
}

/**
 * 动态创建带本地化文本的元素
 * @param {string} tagName - HTML标签名
 * @param {string} i18nKey - 国际化键名
 * @param {Object} options - 可选配置
 * @returns {HTMLElement} 创建的元素
 * 
 * @example
 * const button = createLocalizedElement('button', 'saveSettings', {
 *   className: 'btn-primary',
 *   title: 'saveSettings'
 * });
 */
function createLocalizedElement(tagName, i18nKey, options = {}) {
  const element = document.createElement(tagName);
  element.textContent = i18n(i18nKey);
  
  if (options.className) {
    element.className = options.className;
  }
  
  if (options.title) {
    element.title = i18n(options.title);
  }
  
  if (options.placeholder) {
    element.placeholder = i18n(options.placeholder);
  }
  
  return element;
}

/**
 * 更新元素的本地化文本
 * @param {HTMLElement} element - 要更新的元素
 * @param {string} i18nKey - 国际化键名
 * @param {string[]} substitutions - 替换参数数组
 * 
 * @example
 * updateElementText(statusDiv, 'settingsSaved');
 * updateElementText(counterDiv, 'foundOccurrences', ['5', 'hello']);
 */
function updateElementText(element, i18nKey, substitutions = []) {
  if (element) {
    element.textContent = i18n(i18nKey, substitutions);
  }
}

/**
 * 批量更新元素文本
 * @param {Object} updates - 键值对对象，键为选择器，值为i18n键名
 * 
 * @example
 * updateMultipleElements({
 *   '#title': 'settings',
 *   '#saveBtn': 'saveSettings',
 *   '#cancelBtn': 'cancel'
 * });
 */
function updateMultipleElements(updates) {
  Object.entries(updates).forEach(([selector, i18nKey]) => {
    const element = document.querySelector(selector);
    if (element) {
      element.textContent = i18n(i18nKey);
    }
  });
}

/**
 * 创建本地化的选项列表（用于 <select> 元素）
 * @param {string} selectId - select元素的ID
 * @param {Array<{value: string, labelKey: string}>} options - 选项数组
 * 
 * @example
 * createLocalizedSelectOptions('targetLanguage', [
 *   { value: 'en', labelKey: 'langEnglish' },
 *   { value: 'zh-CN', labelKey: 'langChineseSimplified' }
 * ]);
 */
function createLocalizedSelectOptions(selectId, options) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  // 清空现有选项
  select.innerHTML = '';
  
  // 添加本地化选项
  options.forEach(opt => {
    const option = document.createElement('option');
    option.value = opt.value;
    option.textContent = i18n(opt.labelKey);
    select.appendChild(option);
  });
}

/**
 * 格式化带占位符的消息
 * @param {string} key - 消息键名
 * @param {Object} placeholders - 占位符对象
 * @returns {string} 格式化后的文本
 * 
 * @example
 * const text = formatMessage('foundOccurrences', {
 *   count: '5',
 *   text: 'hello'
 * });
 * // 返回: "Found 5 occurrences of "hello""
 */
function formatMessage(key, placeholders = {}) {
  let message = i18n(key);
  
  // 替换占位符
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    const pattern = new RegExp(`\\$${placeholder}\\$`, 'gi');
    message = message.replace(pattern, value);
  });
  
  return message;
}

// 导出函数（用于模块化环境）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    i18n,
    localizeHtmlPage,
    getLocalizedLanguageName,
    getCurrentLanguage,
    getSupportedLanguages,
    createLocalizedElement,
    updateElementText,
    updateMultipleElements,
    createLocalizedSelectOptions,
    formatMessage
  };
}

// 全局导出（用于浏览器环境）
if (typeof window !== 'undefined') {
  window.i18n = i18n;
  window.localizeHtmlPage = localizeHtmlPage;
  window.initializeLanguage = initializeLanguage;
  window.loadCustomLanguage = loadCustomLanguage;
  window.getLocalizedLanguageName = getLocalizedLanguageName;
  window.getCurrentLanguage = getCurrentLanguage;
  window.getSupportedLanguages = getSupportedLanguages;
  window.createLocalizedElement = createLocalizedElement;
  window.updateElementText = updateElementText;
  window.updateMultipleElements = updateMultipleElements;
  window.createLocalizedSelectOptions = createLocalizedSelectOptions;
  window.formatMessage = formatMessage;
}

