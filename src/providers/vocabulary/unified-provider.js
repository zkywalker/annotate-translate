/**
 * UnifiedVocabularyProvider - 统一格式词库Provider
 *
 * 支持的数据格式：
 * {
 *   "words": {
 *     "abandon": {
 *       "tags": ["cet4", "cet6", "ky", "toefl", "ielts", "gre"],
 *       "frequency": 5234,
 *       "collins": 4
 *     }
 *   }
 * }
 *
 * 特点：
 * - 零数据冗余（每个词只存一次）
 * - 完整标签信息（所有标签都保留）
 * - 分层加载（core + advanced）
 * - 灵活查询（支持多标签组合）
 */
class UnifiedVocabularyProvider {
  constructor(name = 'unified') {
    this.name = name;
    this.initialized = false;

    // 词库数据结构: Map<word, {tags, frequency, collins}>
    this.vocabulary = new Map();

    // 已加载的层级
    this.loadedLayers = new Set();

    // 标签统计
    this.tagStats = {};
  }

  /**
   * 初始化词库数据（加载核心词库）
   */
  async initialize() {
    if (this.initialized) {
      console.log('[UnifiedProvider] Already initialized');
      return;
    }

    try {
      // 加载核心词库
      await this.loadLayer('core');

      this.initialized = true;
      console.log(`[UnifiedProvider] Initialized with ${this.vocabulary.size} words`);
    } catch (error) {
      console.error('[UnifiedProvider] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 加载指定层级的词库
   * @param {string} layer - 'core' | 'advanced' | 'frequency'
   */
  async loadLayer(layer) {
    if (this.loadedLayers.has(layer)) {
      console.log(`[UnifiedProvider] Layer "${layer}" already loaded`);
      return;
    }

    try {
      const dataUrl = chrome.runtime.getURL(`src/data/vocabularies/vocabulary-${layer}.json`);
      const response = await fetch(dataUrl);

      if (!response.ok) {
        throw new Error(`Failed to load vocabulary layer "${layer}": ${response.status}`);
      }

      const data = await response.json();

      // 合并到词汇表
      if (data.words) {
        for (const [word, metadata] of Object.entries(data.words)) {
          this.vocabulary.set(word.toLowerCase(), metadata);

          // 统计标签
          if (metadata.tags) {
            metadata.tags.forEach(tag => {
              this.tagStats[tag] = (this.tagStats[tag] || 0) + 1;
            });
          }
        }
      }

      this.loadedLayers.add(layer);
      console.log(`[UnifiedProvider] Loaded layer "${layer}" with ${Object.keys(data.words || {}).length} words`);
    } catch (error) {
      console.error(`[UnifiedProvider] Failed to load layer "${layer}":`, error);
      throw error;
    }
  }

  /**
   * 确保高级词库已加载
   */
  async ensureAdvancedLoaded() {
    if (!this.loadedLayers.has('advanced')) {
      await this.loadLayer('advanced');
    }
  }

  /**
   * 判断词是否需要标注
   * @param {string} word - 要检查的词
   * @param {Object} options - 配置选项
   * @param {string[]} options.targetTags - 目标标签，例如 ['cet6', 'toefl']
   * @param {string} options.mode - 'any' | 'all' | 'exact'
   *   - any: 包含任一目标标签即标注（默认）
   *   - all: 包含所有目标标签才标注
   *   - exact: 标签完全匹配才标注
   * @param {boolean} options.includeBase - 是否包含基础级别（默认false）
   * @param {number} options.minCollins - 最小柯林斯星级（默认0）
   * @returns {boolean}
   */
  shouldAnnotate(word, options = {}) {
    this.ensureInitialized();

    const normalizedWord = this.normalizeWord(word);
    const metadata = this.vocabulary.get(normalizedWord);

    // 如果词不在词库中，不标注
    if (!metadata) {
      return false;
    }

    const {
      targetTags = [],
      mode = 'any',
      includeBase = false,
      minCollins = 0
    } = options;

    // 柯林斯星级过滤
    if (minCollins > 0 && (metadata.collins || 0) < minCollins) {
      return false;
    }

    // 如果没有指定目标标签，根据是否有标签决定
    if (targetTags.length === 0) {
      return metadata.tags && metadata.tags.length > 0;
    }

    const wordTags = metadata.tags || [];

    // 基础级别过滤
    if (!includeBase) {
      const baseTags = ['cet4'];
      // 如果词只有基础标签，不标注
      if (wordTags.every(tag => baseTags.includes(tag))) {
        return false;
      }
    }

    // 标签匹配逻辑
    switch (mode) {
      case 'any':
        // 包含任一目标标签
        return wordTags.some(tag => targetTags.includes(tag));

      case 'all':
        // 包含所有目标标签
        return targetTags.every(tag => wordTags.includes(tag));

      case 'exact':
        // 标签完全匹配
        return wordTags.length === targetTags.length &&
               wordTags.every(tag => targetTags.includes(tag));

      default:
        return false;
    }
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
      tags: metadata.tags || [],
      frequency: metadata.frequency || null,
      collins: metadata.collins || 0,
      oxford: metadata.oxford || 0,
      provider: this.name
    };
  }

  /**
   * 检查词是否包含指定标签
   * @param {string} word - 词
   * @param {string} tag - 标签
   * @returns {boolean}
   */
  hasTag(word, tag) {
    const metadata = this.vocabulary.get(this.normalizeWord(word));
    if (!metadata || !metadata.tags) return false;
    return metadata.tags.includes(tag);
  }

  /**
   * 获取词的所有标签
   * @param {string} word - 词
   * @returns {string[]}
   */
  getTags(word) {
    const metadata = this.vocabulary.get(this.normalizeWord(word));
    return metadata?.tags || [];
  }

  /**
   * 获取支持的配置选项
   */
  getSupportedOptions() {
    return {
      targetTags: {
        type: 'array',
        default: [],
        options: ['cet4', 'cet6', 'ky', 'gk', 'toefl', 'ielts', 'gre'],
        description: 'Target vocabulary tags to annotate'
      },
      mode: {
        type: 'string',
        default: 'any',
        options: ['any', 'all', 'exact'],
        description: 'Tag matching mode'
      },
      includeBase: {
        type: 'boolean',
        default: false,
        description: 'Include base level (CET-4) words'
      },
      minCollins: {
        type: 'number',
        default: 0,
        description: 'Minimum Collins star rating (0-5)'
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
      wordCount: this.vocabulary.size,
      loadedLayers: Array.from(this.loadedLayers),
      tagStats: this.tagStats
    };

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
      throw new Error('UnifiedVocabularyProvider is not initialized. Call initialize() first.');
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UnifiedVocabularyProvider;
}
