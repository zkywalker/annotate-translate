/**
 * Base AI Provider Interface
 * 
 * 所有AI翻译提供商的基类接口
 * 定义了AI翻译服务必须实现的核心方法
 */

class BaseAIProvider {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - API密钥
   * @param {string} [config.model] - 使用的模型名称
   * @param {string} [config.baseURL] - API基础URL（可选）
   */
  constructor(config) {
    if (!config.apiKey) {
      throw new Error('API key is required');
    }
    
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseURL = config.baseURL;
    this.providerName = 'base';
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {Promise<AITranslationResult>}
   */
  async translate(text, sourceLang, targetLang) {
    throw new Error('translate() method must be implemented by subclass');
  }

  /**
   * 验证配置是否有效
   * @returns {Promise<boolean>}
   */
  async validateConfig() {
    throw new Error('validateConfig() method must be implemented by subclass');
  }

  /**
   * 获取提供商信息
   * @returns {Object}
   */
  getProviderInfo() {
    return {
      name: this.providerName,
      model: this.model,
      hasValidKey: !!this.apiKey
    };
  }

  /**
   * 构建翻译提示词
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @param {Object} options - 额外选项
   * @returns {string}
   */
  buildTranslationPrompt(text, sourceLang, targetLang, options = {}) {
    const sourceLanguageName = this.getLanguageName(sourceLang);
    const targetLanguageName = this.getLanguageName(targetLang);
    
    return `You are a professional translator. Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.

Requirements:
1. Maintain the original tone and style
2. Preserve formatting and structure  
3. Be natural and fluent in the target language
4. Only return the translation, no explanations or notes

Text to translate:
${text}`;
  }

  /**
   * 获取语言的完整名称
   * @param {string} langCode - 语言代码
   * @returns {string}
   */
  getLanguageName(langCode) {
    const languageNames = {
      'en': 'English',
      'zh-CN': 'Simplified Chinese',
      'zh-TW': 'Traditional Chinese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic'
    };
    
    return languageNames[langCode] || langCode;
  }

  /**
   * 处理API错误
   * @param {Error} error - 错误对象
   * @returns {Error}
   */
  handleAPIError(error) {
    console.error(`[${this.providerName}] API Error:`, error);
    
    // 根据不同的错误类型返回友好的错误消息
    if (error.message.includes('401') || error.message.includes('403')) {
      return new Error('Invalid API key. Please check your configuration.');
    } else if (error.message.includes('429')) {
      return new Error('Rate limit exceeded. Please try again later.');
    } else if (error.message.includes('500') || error.message.includes('502') || error.message.includes('503')) {
      return new Error('Service temporarily unavailable. Please try again later.');
    } else if (error.message.includes('timeout')) {
      return new Error('Request timeout. Please check your network connection.');
    }
    
    return new Error(`Translation failed: ${error.message}`);
  }

  /**
   * 估算token数量（粗略估算）
   * @param {string} text - 文本
   * @returns {number}
   */
  estimateTokens(text) {
    // 粗略估算：英文约4个字符=1个token，中文约1.5个字符=1个token
    const hasChineseChars = /[\u4e00-\u9fa5]/.test(text);
    const divisor = hasChineseChars ? 1.5 : 4;
    return Math.ceil(text.length / divisor);
  }
}

/**
 * AI翻译结果数据结构
 * @typedef {Object} AITranslationResult
 * @property {string} translatedText - 翻译后的文本
 * @property {string} originalText - 原始文本
 * @property {string} sourceLang - 源语言代码
 * @property {string} targetLang - 目标语言代码
 * @property {string} provider - 提供商名称
 * @property {string} model - 使用的模型
 * @property {number} timestamp - 时间戳
 * @property {Object} [metadata] - 额外的元数据
 * @property {number} [metadata.tokensUsed] - 使用的token数量
 * @property {number} [metadata.cost] - 成本（如果适用）
 */

// 如果在浏览器环境中，导出到全局
if (typeof window !== 'undefined') {
  window.BaseAIProvider = BaseAIProvider;
}

// 如果在Node.js环境中，使用module.exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BaseAIProvider;
}
