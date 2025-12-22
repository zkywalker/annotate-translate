/**
 * VocabularyService - 词库服务核心
 *
 * 管理多个VocabularyProvider，提供统一的查询接口
 * 类似TranslationService的设计模式
 */
class VocabularyService {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.activeOptions = {};
    this.cache = new Map();
    this.maxCacheSize = 1000;
  }

  /**
   * 注册一个词库Provider
   * @param {string} name - Provider名称
   * @param {VocabularyProvider} provider - Provider实例
   */
  registerProvider(name, provider) {
    if (this.providers.has(name)) {
      console.warn(`[VocabularyService] Provider "${name}" already registered, overwriting`);
    }
    this.providers.set(name, provider);
    console.log(`[VocabularyService] Registered provider: ${name}`);
  }

  /**
   * 获取已注册的Provider
   * @param {string} name - Provider名称
   * @returns {VocabularyProvider|null}
   */
  getProvider(name) {
    return this.providers.get(name) || null;
  }

  /**
   * 设置当前活跃的Provider
   * @param {string} name - Provider名称
   * @param {Object} options - Provider的配置选项
   * @returns {Promise<void>}
   */
  async setActiveProvider(name, options = {}) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`[VocabularyService] Provider "${name}" not found`);
    }

    // 如果provider未初始化，先初始化
    if (!provider.initialized) {
      console.log(`[VocabularyService] Initializing provider: ${name}`);
      await provider.initialize();
    }

    this.activeProvider = provider;
    this.activeOptions = options;

    // 切换provider时清空缓存
    this.clearCache();

    console.log(`[VocabularyService] Active provider set to: ${name}`, options);
  }

  /**
   * 检查单个词是否需要标注
   * @param {string} word - 要检查的词
   * @param {Object} context - 上下文信息（可选）
   * @returns {boolean}
   */
  shouldAnnotate(word, context = {}) {
    if (!this.activeProvider) {
      console.warn('[VocabularyService] No active provider set');
      return false;
    }

    const normalizedWord = this.activeProvider.normalizeWord(word);

    // 检查缓存
    const cacheKey = this.getCacheKey(normalizedWord);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // 查询provider
    const result = this.activeProvider.shouldAnnotate(
      normalizedWord,
      this.activeOptions
    );

    // 写入缓存
    this.setCache(cacheKey, result);

    return result;
  }

  /**
   * 批量检查多个词
   * @param {string[]} words - 要检查的词列表
   * @param {Object} context - 上下文信息（可选）
   * @returns {Map<string, boolean>} 词 -> 是否需要标注
   */
  batchCheck(words, context = {}) {
    if (!this.activeProvider) {
      console.warn('[VocabularyService] No active provider set');
      return new Map();
    }

    const results = new Map();
    const uncachedWords = [];
    const normalizedMap = new Map(); // 原词 -> 标准化词

    // 先检查缓存
    for (const word of words) {
      const normalizedWord = this.activeProvider.normalizeWord(word);
      normalizedMap.set(word, normalizedWord);

      const cacheKey = this.getCacheKey(normalizedWord);
      if (this.cache.has(cacheKey)) {
        results.set(word, this.cache.get(cacheKey));
      } else {
        uncachedWords.push(normalizedWord);
      }
    }

    // 批量查询未缓存的词
    if (uncachedWords.length > 0) {
      const batchResults = this.activeProvider.batchCheck(
        uncachedWords,
        this.activeOptions
      );

      // 合并结果并更新缓存
      for (const [word, normalizedWord] of normalizedMap) {
        if (batchResults.has(normalizedWord)) {
          const result = batchResults.get(normalizedWord);
          results.set(word, result);

          // 写入缓存
          const cacheKey = this.getCacheKey(normalizedWord);
          this.setCache(cacheKey, result);
        }
      }
    }

    return results;
  }

  /**
   * 获取词汇元数据
   * @param {string} word - 要查询的词
   * @returns {Object|null}
   */
  getMetadata(word) {
    if (!this.activeProvider) {
      console.warn('[VocabularyService] No active provider set');
      return null;
    }

    const normalizedWord = this.activeProvider.normalizeWord(word);
    return this.activeProvider.getMetadata(normalizedWord);
  }

  /**
   * 组合多个Provider（高级功能）
   * @param {string[]} providerNames - Provider名称列表
   * @param {string} logic - 组合逻辑：'OR' | 'AND'
   * @param {Object} options - 各Provider的选项
   * @returns {Function} 检查函数
   */
  combineProviders(providerNames, logic = 'OR', options = {}) {
    const providers = providerNames.map(name => {
      const provider = this.providers.get(name);
      if (!provider) {
        throw new Error(`[VocabularyService] Provider "${name}" not found`);
      }
      return provider;
    });

    return (word) => {
      const results = providers.map((provider, index) => {
        const providerOptions = options[providerNames[index]] || {};
        return provider.shouldAnnotate(word, providerOptions);
      });

      if (logic === 'OR') {
        return results.some(r => r === true);
      } else if (logic === 'AND') {
        return results.every(r => r === true);
      } else {
        throw new Error(`[VocabularyService] Unknown logic: ${logic}`);
      }
    };
  }

  /**
   * 获取所有已注册的Provider名称
   * @returns {string[]}
   */
  getProviderNames() {
    return Array.from(this.providers.keys());
  }

  /**
   * 获取当前活跃Provider的统计信息
   * @returns {Object|null}
   */
  getStats() {
    if (!this.activeProvider) {
      return null;
    }
    return {
      ...this.activeProvider.getStats(),
      cacheSize: this.cache.size,
      maxCacheSize: this.maxCacheSize
    };
  }

  /**
   * 清空缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[VocabularyService] Cache cleared');
  }

  /**
   * 生成缓存键
   * @private
   */
  getCacheKey(word) {
    const providerName = this.activeProvider ? this.activeProvider.name : 'none';
    const optionsHash = JSON.stringify(this.activeOptions);
    return `${word}:${providerName}:${optionsHash}`;
  }

  /**
   * 设置缓存（LRU策略）
   * @private
   */
  setCache(key, value) {
    // 如果超过最大缓存数，删除最早的条目
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * 设置最大缓存大小
   * @param {number} size
   */
  setMaxCacheSize(size) {
    this.maxCacheSize = size;
    // 如果当前缓存超过新的限制，清空缓存
    if (this.cache.size > size) {
      this.clearCache();
    }
  }
}

// 创建全局单例
const vocabularyService = new VocabularyService();

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VocabularyService, vocabularyService };
}
