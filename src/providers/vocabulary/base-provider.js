/**
 * VocabularyProvider - 词库Provider抽象基类
 *
 * 所有词库实现都应该继承此类并实现相应的抽象方法
 */
class VocabularyProvider {
  /**
   * @param {string} name - Provider名称（唯一标识符）
   */
  constructor(name) {
    if (new.target === VocabularyProvider) {
      throw new TypeError('Cannot construct VocabularyProvider instances directly');
    }
    this.name = name;
    this.initialized = false;
  }

  /**
   * 初始化词库数据
   * 子类应该在这里加载词库文件、构建索引等
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize() must be implemented by subclass');
  }

  /**
   * 判断一个词是否需要标注
   * @param {string} word - 要检查的词
   * @param {Object} options - 查询选项（由具体Provider定义）
   * @returns {boolean} 是否需要标注
   */
  shouldAnnotate(word, options = {}) {
    throw new Error('shouldAnnotate() must be implemented by subclass');
  }

  /**
   * 批量检查多个词（性能优化）
   * 默认实现为逐个调用shouldAnnotate，子类可以重写以优化性能
   * @param {string[]} words - 要检查的词列表
   * @param {Object} options - 查询选项
   * @returns {Map<string, boolean>} 词 -> 是否需要标注的映射
   */
  batchCheck(words, options = {}) {
    const results = new Map();
    for (const word of words) {
      results.set(word, this.shouldAnnotate(word, options));
    }
    return results;
  }

  /**
   * 获取词汇的元数据
   * @param {string} word - 要查询的词
   * @returns {Object|null} 词汇元数据，如果词不存在则返回null
   */
  getMetadata(word) {
    throw new Error('getMetadata() must be implemented by subclass');
  }

  /**
   * 获取此Provider支持的配置选项
   * @returns {Object} 配置选项的schema
   */
  getSupportedOptions() {
    return {};
  }

  /**
   * 获取Provider的统计信息
   * @returns {Object} 统计信息（如词汇总数等）
   */
  getStats() {
    return {
      name: this.name,
      initialized: this.initialized,
      wordCount: 0
    };
  }

  /**
   * 标准化单词（转小写、去除特殊字符等）
   * @param {string} word - 原始单词
   * @returns {string} 标准化后的单词
   */
  normalizeWord(word) {
    return word.toLowerCase().trim();
  }

  /**
   * 验证Provider是否已初始化
   * @throws {Error} 如果未初始化则抛出错误
   */
  ensureInitialized() {
    if (!this.initialized) {
      throw new Error(`VocabularyProvider "${this.name}" is not initialized. Call initialize() first.`);
    }
  }
}

// 导出供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = VocabularyProvider;
}
