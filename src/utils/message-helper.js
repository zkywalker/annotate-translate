/**
 * Message Helper Utility
 * Provides safe i18n message retrieval with fallback support
 * Prevents code duplication across content scripts and UI components
 */

/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 如果扩展上下文有效返回 true
 */
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}

/**
 * 安全获取 i18n 消息，避免扩展上下文失效错误
 * 优先使用 i18n-helper.js 提供的 i18n 函数
 * @param {string} key - 消息 key
 * @param {Array|string|null} substitutions - 替换参数
 * @param {string} fallback - 后备文本
 * @returns {string} 翻译后的消息或后备文本
 */
function safeGetMessage(key, substitutions = null, fallback = '') {
  try {
    // 优先使用 i18n-helper.js 提供的 i18n 函数
    if (typeof i18n !== 'undefined') {
      const subs = Array.isArray(substitutions) ? substitutions : (substitutions ? [substitutions] : []);
      const message = i18n(key, subs);
      return message || fallback;
    }

    // 回退到 chrome.i18n API
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
      const message = substitutions
        ? chrome.i18n.getMessage(key, substitutions)
        : chrome.i18n.getMessage(key);
      return message || fallback;
    }

    return fallback;
  } catch (e) {
    // 扩展上下文失效时返回后备文本
    console.warn('[Message-Helper] Extension context invalidated, using fallback text:', fallback);
    return fallback;
  }
}

/**
 * 批量获取多个 i18n 消息
 * @param {Object} keyMap - 键值对映射 { resultKey: { key, substitutions, fallback } }
 * @returns {Object} 翻译后的消息对象
 *
 * @example
 * const messages = getMessages({
 *   title: { key: 'appTitle', fallback: 'App' },
 *   description: { key: 'appDesc', substitutions: ['v1.0'], fallback: 'Version v1.0' }
 * });
 * // Returns: { title: 'App', description: 'Version v1.0' }
 */
function getMessages(keyMap) {
  const result = {};

  for (const [resultKey, config] of Object.entries(keyMap)) {
    result[resultKey] = safeGetMessage(
      config.key,
      config.substitutions || null,
      config.fallback || ''
    );
  }

  return result;
}

/**
 * 格式化消息，支持命名占位符
 * @param {string} template - 消息模板，如 "Hello {name}, you have {count} messages"
 * @param {Object} values - 值对象，如 { name: 'John', count: 5 }
 * @returns {string} 格式化后的消息
 */
function formatMessage(template, values) {
  if (!template || typeof template !== 'string') {
    return '';
  }

  return template.replace(/\{(\w+)\}/g, (match, key) => {
    return values.hasOwnProperty(key) ? values[key] : match;
  });
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    isExtensionContextValid,
    safeGetMessage,
    getMessages,
    formatMessage
  };
}
