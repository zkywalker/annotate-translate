/**
 * FrequencyVocabularyProvider - 基于词频的Provider
 *
 * 根据词频数据判断词汇难度
 * 词频排名越低（数字越大），词汇越生僻，越需要标注
 */
class FrequencyVocabularyProvider {
  constructor() {
    this.name = 'frequency';
    this.initialized = false;

    // 词库数据结构: { word: { rank: 1234, frequency: 98765 } }
    this.vocabulary = new Map();
  }

  /**
   * 初始化词库数据
   */
  async initialize() {
    if (this.initialized) {
      console.log('[FrequencyProvider] Already initialized');
      return;
    }

    try {
      // 加载词频数据文件
      const dataUrl = chrome.runtime.getURL('src/data/vocabularies/frequency-coca.json');
      const response = await fetch(dataUrl);

      if (!response.ok) {
        throw new Error(`Failed to load vocabulary data: ${response.status}`);
      }

      const data = await response.json();

      // 构建词汇映射
      if (data.words) {
        for (const [word, metadata] of Object.entries(data.words)) {
          this.vocabulary.set(word.toLowerCase(), metadata);
        }
      }

      this.initialized = true;
      console.log(`[FrequencyProvider] Initialized with ${this.vocabulary.size} words`);
    } catch (error) {
      console.error('[FrequencyProvider] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 判断词是否需要标注
   * @param {string} word - 要检查的词
   * @param {Object} options - 配置选项
   * @param {number} options.threshold - 词频排名阈值（默认5000）
   * @param {string} options.mode - 'below' | 'above'
   *   - below: 排名低于阈值的词需要标注（排名数字大，词汇生僻）
   *   - above: 排名高于阈值的词需要标注（排名数字小，词汇常见）
   * @returns {boolean}
   */
  shouldAnnotate(word, options = {}) {
    this.ensureInitialized();

    const normalizedWord = this.normalizeWord(word);
    const metadata = this.vocabulary.get(normalizedWord);

    // 如果词不在词库中，认为是生僻词，需要标注
    if (!metadata) {
      return true;
    }

    const {
      threshold = 5000,
      mode = 'below'
    } = options;

    const rank = metadata.rank;

    if (mode === 'below') {
      // 排名数字大于阈值的词需要标注（生僻词）
      return rank > threshold;
    } else if (mode === 'above') {
      // 排名数字小于阈值的词需要标注（常见词）
      return rank < threshold;
    }

    return false;
  }

  /**
   * 批量检查（优化版本）
   */
  batchCheck(words, options = {}) {
    this.ensureInitialized();

    const results = new Map();

    for (const word of words) {
      const normalizedWord = this.normalizeWord(word);
      results.set(normalizedWord, this.shouldAnnotate(normalizedWord, options));
    }

    return results;
  }

  /**
   * 获取词汇元数据
   */
  getMetadata(word) {
    this.ensureInitialized();

    const normalizedWord = this.normalizeWord(word);
    const metadata = this.vocabulary.get(normalizedWord);

    if (!metadata) {
      return null;
    }

    return {
      word: normalizedWord,
      rank: metadata.rank,
      frequency: metadata.frequency || null,
      provider: this.name
    };
  }

  /**
   * 获取支持的配置选项
   */
  getSupportedOptions() {
    return {
      threshold: {
        type: 'number',
        default: 5000,
        min: 1,
        max: 60000,
        description: 'Frequency rank threshold'
      },
      mode: {
        type: 'string',
        default: 'below',
        options: ['below', 'above'],
        description: 'Annotation mode (below = rare words, above = common words)'
      }
    };
  }

  /**
   * 获取统计信息
   */
  getStats() {
    const stats = {
      name: this.name,
      initialized: this.initialized,
      wordCount: this.vocabulary.size
    };

    if (this.initialized && this.vocabulary.size > 0) {
      // 计算词频范围
      let minRank = Infinity;
      let maxRank = 0;

      for (const metadata of this.vocabulary.values()) {
        const rank = metadata.rank;
        if (rank < minRank) minRank = rank;
        if (rank > maxRank) maxRank = rank;
      }

      stats.rankRange = { min: minRank, max: maxRank };
    }

    return stats;
  }

  /**
   * 标准化单词
   */
  normalizeWord(word) {
    return word.toLowerCase().trim();
  }

  /**
   * 确保已初始化
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error('FrequencyVocabularyProvider is not initialized. Call initialize() first.');
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FrequencyVocabularyProvider;
}
