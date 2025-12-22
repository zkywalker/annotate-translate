/**
 * CETVocabularyProvider - 基于CET（大学英语四六级）词汇的Provider
 *
 * 支持的级别：
 * - cet4: 大学英语四级
 * - cet6: 大学英语六级
 * - tem4: 英语专业四级
 * - tem8: 英语专业八级
 */
class CETVocabularyProvider {
  constructor() {
    this.name = 'cet';
    this.initialized = false;

    // 词库数据结构: { word: { level: 'cet4', frequency: 1000 } }
    this.vocabulary = new Map();

    // 级别优先级（数字越大，级别越高）
    this.levelPriority = {
      'cet4': 1,
      'cet6': 2,
      'tem4': 3,
      'tem8': 4
    };
  }

  /**
   * 初始化词库数据
   */
  async initialize() {
    if (this.initialized) {
      console.log('[CETProvider] Already initialized');
      return;
    }

    try {
      // 加载词库数据文件
      const dataUrl = chrome.runtime.getURL('src/data/vocabularies/cet-combined.json');
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
      console.log(`[CETProvider] Initialized with ${this.vocabulary.size} words`);
    } catch (error) {
      console.error('[CETProvider] Failed to initialize:', error);
      throw error;
    }
  }

  /**
   * 判断词是否需要标注
   * @param {string} word - 要检查的词
   * @param {Object} options - 配置选项
   * @param {string[]} options.levels - 需要标注的级别，例如 ['cet6']
   * @param {string} options.mode - 'above' | 'exact' | 'below'
   *   - above: 标注此级别及以上的词（例如设置cet6，则cet6、tem4、tem8都会标注）
   *   - exact: 仅标注此级别的词
   *   - below: 标注此级别及以下的词
   * @param {boolean} options.includeBase - 是否包含基础级别（默认false）
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
      levels = ['cet6'],
      mode = 'above',
      includeBase = false
    } = options;

    // 如果不包含基础级别，且词是cet4级别，不标注
    if (!includeBase && metadata.level === 'cet4') {
      return false;
    }

    const wordLevelPriority = this.levelPriority[metadata.level] || 0;

    // 检查是否匹配任一指定级别
    for (const targetLevel of levels) {
      const targetPriority = this.levelPriority[targetLevel] || 0;

      if (mode === 'above') {
        // 标注此级别及以上
        if (wordLevelPriority >= targetPriority) {
          return true;
        }
      } else if (mode === 'exact') {
        // 仅标注此级别
        if (wordLevelPriority === targetPriority) {
          return true;
        }
      } else if (mode === 'below') {
        // 标注此级别及以下
        if (wordLevelPriority <= targetPriority) {
          return true;
        }
      }
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
      level: metadata.level,
      frequency: metadata.frequency || null,
      provider: this.name
    };
  }

  /**
   * 获取支持的配置选项
   */
  getSupportedOptions() {
    return {
      levels: {
        type: 'array',
        default: ['cet6'],
        options: ['cet4', 'cet6', 'tem4', 'tem8'],
        description: 'Target vocabulary levels'
      },
      mode: {
        type: 'string',
        default: 'above',
        options: ['above', 'exact', 'below'],
        description: 'Annotation mode'
      },
      includeBase: {
        type: 'boolean',
        default: false,
        description: 'Include base level (CET-4) words'
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

    if (this.initialized) {
      // 按级别统计词数
      const levelCounts = {};
      for (const metadata of this.vocabulary.values()) {
        const level = metadata.level;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      }
      stats.levelCounts = levelCounts;
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
      throw new Error('CETVocabularyProvider is not initialized. Call initialize() first.');
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CETVocabularyProvider;
}
