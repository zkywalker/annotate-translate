/**
 * AI Translation Service
 * 
 * 统一的AI翻译服务接口，管理不同的AI提供商
 * 提供翻译、缓存、错误处理等功能
 */

class AITranslationService {
  constructor() {
    this.provider = null;
    this.currentProviderName = null;
    this.cache = new Map();
    this.cacheMaxSize = 100;
    this.requestQueue = [];
    this.isProcessing = false;
    
    console.log('[AI Translation Service] Initialized');
  }

  /**
   * 初始化AI提供商
   * @param {string} providerName - 提供商名称 ('openai', 'anthropic', 'gemini')
   * @param {Object} config - 配置对象
   * @returns {Promise<void>}
   */
  async initialize(providerName, config) {
    console.log(`[AI Translation Service] Initializing provider: ${providerName}`);
    
    try {
      switch(providerName.toLowerCase()) {
        case 'openai':
          this.provider = new OpenAIProvider(config);
          break;
        
        // 未来添加更多提供商
        // case 'anthropic':
        //   this.provider = new AnthropicProvider(config);
        //   break;
        // case 'gemini':
        //   this.provider = new GeminiProvider(config);
        //   break;
        
        default:
          throw new Error(`Unknown AI provider: ${providerName}`);
      }
      
      this.currentProviderName = providerName;
      
      // 验证配置
      const isValid = await this.provider.validateConfig();
      if (!isValid) {
        throw new Error('Provider configuration validation failed');
      }
      
      console.log(`[AI Translation Service] Provider ${providerName} initialized successfully`);
      
    } catch (error) {
      console.error('[AI Translation Service] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @param {Object} options - 额外选项
   * @returns {Promise<AITranslationResult>}
   */
  async translate(text, sourceLang, targetLang, options = {}) {
    if (!this.provider) {
      throw new Error('AI provider not initialized. Call initialize() first.');
    }

    // 验证输入
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid text input');
    }

    if (text.length > 5000) {
      throw new Error('Text too long. Maximum 5000 characters.');
    }

    // 检查缓存
    const cacheKey = this.getCacheKey(text, sourceLang, targetLang);
    if (this.cache.has(cacheKey) && !options.skipCache) {
      console.log('[AI Translation Service] Returning cached result');
      return this.cache.get(cacheKey);
    }

    try {
      console.log(`[AI Translation Service] Translating: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
      
      // 调用提供商进行翻译
      const result = await this.provider.translate(text, sourceLang, targetLang);
      
      // 缓存结果
      this.cacheResult(cacheKey, result);
      
      return result;
      
    } catch (error) {
      console.error('[AI Translation Service] Translation failed:', error);
      throw error;
    }
  }

  /**
   * 批量翻译（带队列管理）
   * @param {Array<{text: string, sourceLang: string, targetLang: string}>} items - 翻译项数组
   * @param {Object} options - 选项
   * @returns {Promise<Array<AITranslationResult>>}
   */
  async translateBatch(items, options = {}) {
    const { concurrency = 3, delayMs = 1000 } = options;
    const results = [];
    
    console.log(`[AI Translation Service] Batch translating ${items.length} items`);
    
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      
      const batchResults = await Promise.all(
        batch.map(item => 
          this.translate(item.text, item.sourceLang, item.targetLang)
            .catch(error => ({
              error: true,
              message: error.message,
              originalText: item.text
            }))
        )
      );
      
      results.push(...batchResults);
      
      // 延迟避免速率限制
      if (i + concurrency < items.length) {
        await this.sleep(delayMs);
      }
    }
    
    return results;
  }

  /**
   * 带重试的翻译
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @param {number} maxRetries - 最大重试次数
   * @returns {Promise<AITranslationResult>}
   */
  async translateWithRetry(text, sourceLang, targetLang, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        console.log(`[AI Translation Service] Attempt ${i + 1}/${maxRetries}`);
        return await this.translate(text, sourceLang, targetLang);
      } catch (error) {
        lastError = error;
        console.error(`[AI Translation Service] Attempt ${i + 1} failed:`, error);
        
        // 如果是配置错误，不重试
        if (error.message.includes('Invalid API key') || 
            error.message.includes('not initialized')) {
          throw error;
        }
        
        // 指数退避
        if (i < maxRetries - 1) {
          const delay = Math.pow(2, i) * 1000;
          console.log(`[AI Translation Service] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }

  /**
   * 获取缓存键
   * @param {string} text - 文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {string}
   * @private
   */
  getCacheKey(text, sourceLang, targetLang) {
    return `${sourceLang}-${targetLang}-${text}`;
  }

  /**
   * 缓存结果
   * @param {string} key - 缓存键
   * @param {AITranslationResult} result - 翻译结果
   * @private
   */
  cacheResult(key, result) {
    // 如果缓存已满，删除最早的条目
    if (this.cache.size >= this.cacheMaxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, result);
    console.log(`[AI Translation Service] Cached result. Cache size: ${this.cache.size}`);
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[AI Translation Service] Cache cleared');
  }

  /**
   * 获取缓存统计
   * @returns {Object}
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.cacheMaxSize,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * 获取当前提供商信息
   * @returns {Object|null}
   */
  getProviderInfo() {
    if (!this.provider) {
      return null;
    }
    
    return this.provider.getProviderInfo();
  }

  /**
   * 检查服务是否就绪
   * @returns {boolean}
   */
  isReady() {
    return this.provider !== null;
  }

  /**
   * 获取支持的提供商列表
   * @returns {Array<string>}
   */
  static getSupportedProviders() {
    return [
      'openai',
      // 未来添加
      // 'anthropic',
      // 'gemini'
    ];
  }

  /**
   * 获取提供商的配置要求
   * @param {string} providerName - 提供商名称
   * @returns {Object}
   */
  static getProviderRequirements(providerName) {
    const requirements = {
      openai: {
        name: 'OpenAI',
        requiredFields: ['apiKey'],
        optionalFields: ['model', 'temperature', 'maxTokens'],
        defaultModel: 'gpt-3.5-turbo',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-4o-mini'],
        documentation: 'https://platform.openai.com/docs'
      }
    };

    return requirements[providerName] || null;
  }

  /**
   * 延迟函数
   * @param {number} ms - 毫秒数
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.provider = null;
    this.currentProviderName = null;
    this.clearCache();
    console.log('[AI Translation Service] Destroyed');
  }
}

// 如果在浏览器环境中，导出到全局
if (typeof window !== 'undefined') {
  window.AITranslationService = AITranslationService;
}

// 如果在Node.js环境中，使用module.exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AITranslationService;
}
