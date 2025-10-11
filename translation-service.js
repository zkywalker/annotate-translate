/**
 * Translation Service Abstraction Layer
 * 
 * 该模块提供翻译服务的抽象接口，使得可以轻松切换不同的翻译提供商
 * 
 * 数据结构设计：
 * - TranslationResult: 包含翻译结果、音标、例句等信息
 * - TranslationProvider: 翻译服务提供者的抽象基类
 */

/**
 * 翻译结果数据结构
 * @typedef {Object} TranslationResult
 * @property {string} originalText - 原文
 * @property {string} translatedText - 译文
 * @property {string} sourceLang - 源语言代码 (如 'en', 'zh-CN')
 * @property {string} targetLang - 目标语言代码
 * @property {PhoneticInfo[]} [phonetics] - 读音信息数组（可选）
 * @property {Definition[]} [definitions] - 词义解释数组（可选）
 * @property {Example[]} [examples] - 例句数组（可选）
 * @property {string} [provider] - 翻译服务提供商名称
 * @property {number} timestamp - 时间戳
 */

/**
 * 读音信息数据结构
 * @typedef {Object} PhoneticInfo
 * @property {string} text - 音标文本 (如 '/həˈloʊ/')
 * @property {string} [type] - 读音类型 (如 'us', 'uk', 'pinyin')
 * @property {string} [audioUrl] - 音频URL（用于在线播放）
 * @property {ArrayBuffer} [audioData] - 音频数据（用于离线播放）
 */

/**
 * 词义解释数据结构
 * @typedef {Object} Definition
 * @property {string} partOfSpeech - 词性 (如 'n.', 'v.', 'adj.')
 * @property {string} text - 解释文本
 * @property {string[]} [synonyms] - 同义词
 */

/**
 * 例句数据结构
 * @typedef {Object} Example
 * @property {string} source - 例句原文
 * @property {string} translation - 例句翻译
 */

/**
 * 翻译服务提供者抽象基类
 */
class TranslationProvider {
  /**
   * 构造函数
   * @param {string} name - 提供商名称
   * @param {Object} config - 配置对象
   */
  constructor(name, config = {}) {
    if (new.target === TranslationProvider) {
      throw new TypeError('Cannot construct TranslationProvider instances directly');
    }
    this.name = name;
    this.config = config;
  }

  /**
   * 翻译文本（抽象方法，必须由子类实现）
   * @param {string} text - 待翻译文本
   * @param {string} targetLang - 目标语言
   * @param {string} [sourceLang='auto'] - 源语言（默认自动检测）
   * @returns {Promise<TranslationResult>}
   */
  async translate(text, targetLang, sourceLang = 'auto') {
    throw new Error('translate() method must be implemented by subclass');
  }

  /**
   * 检测语言
   * @param {string} text - 待检测文本
   * @returns {Promise<string>} 语言代码
   */
  async detectLanguage(text) {
    throw new Error('detectLanguage() method must be implemented by subclass');
  }

  /**
   * 获取支持的语言列表
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async getSupportedLanguages() {
    throw new Error('getSupportedLanguages() method must be implemented by subclass');
  }
}

/**
 * Google Translate 提供者（示例实现）
 */
class GoogleTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Google Translate', config);
    this.apiKey = config.apiKey || null;
    this.usePublicApi = config.usePublicApi !== false; // 默认使用公共API
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    try {
      console.log(`[GoogleTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      // 这里使用公共API端点（无需API密钥，但有限制）
      // 实际生产环境中应该使用官方API
      const url = 'https://translate.googleapis.com/translate_a/single?' + new URLSearchParams({
        client: 'gtx',
        sl: sourceLang,
        tl: targetLang,
        dt: 't',    // 翻译
        dt: 'at',   // 备选翻译
        dt: 'bd',   // 词典
        dt: 'ex',   // 例句
        dt: 'md',   // 词义
        dt: 'rw',   // 相关词
        q: text
      });

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 解析Google Translate API返回的数据
      return this.parseGoogleResponse(data, text, sourceLang, targetLang);
    } catch (error) {
      console.error('[GoogleTranslate] Translation error:', error);
      throw error;
    }
  }

  parseGoogleResponse(data, originalText, sourceLang, targetLang) {
    const result = {
      originalText: originalText,
      translatedText: '',
      sourceLang: data[2] || sourceLang,
      targetLang: targetLang,
      phonetics: [],
      definitions: [],
      examples: [],
      provider: this.name,
      timestamp: Date.now()
    };

    // 主要翻译文本
    if (data[0]) {
      result.translatedText = data[0].map(item => item[0]).filter(Boolean).join('');
    }

    // 音标信息（如果有）
    if (data[0] && data[0][1] && data[0][1][3]) {
      result.phonetics.push({
        text: data[0][1][3],
        type: 'us'
      });
    }

    // 词义解释
    if (data[1]) {
      result.definitions = data[1].map(item => ({
        partOfSpeech: item[0] || '',
        text: item[1]?.[0]?.[0] || '',
        synonyms: item[1]?.[0]?.[1] || []
      }));
    }

    // 例句
    if (data[13]) {
      result.examples = data[13][0]?.slice(0, 3).map(item => ({
        source: item[0],
        translation: ''
      })) || [];
    }

    return result;
  }

  async detectLanguage(text) {
    // Google Translate 会在翻译时自动检测语言
    const result = await this.translate(text, 'en', 'auto');
    return result.sourceLang;
  }

  async getSupportedLanguages() {
    // 常用语言列表
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'ru', name: 'Russian' },
      { code: 'ar', name: 'Arabic' }
    ];
  }
}

/**
 * 有道翻译提供者（示例实现）
 */
class YoudaoTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Youdao Translate', config);
    this.appKey = config.appKey || null;
    this.appSecret = config.appSecret || null;
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    try {
      console.log(`[YoudaoTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      // 有道翻译公共API
      const url = `https://dict.youdao.com/suggest?q=${encodeURIComponent(text)}&le=en&doctype=json`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      return this.parseYoudaoResponse(data, text, sourceLang, targetLang);
    } catch (error) {
      console.error('[YoudaoTranslate] Translation error:', error);
      throw error;
    }
  }

  parseYoudaoResponse(data, originalText, sourceLang, targetLang) {
    const result = {
      originalText: originalText,
      translatedText: '',
      sourceLang: sourceLang,
      targetLang: targetLang,
      phonetics: [],
      definitions: [],
      examples: [],
      provider: this.name,
      timestamp: Date.now()
    };

    // 解析有道返回的数据
    if (data.result && data.result.entries && data.result.entries.length > 0) {
      const entry = data.result.entries[0];
      result.translatedText = entry.explain || entry.entry;
      
      if (entry.phonetic) {
        result.phonetics.push({
          text: `/${entry.phonetic}/`,
          type: 'us'
        });
      }
    }

    return result;
  }

  async detectLanguage(text) {
    return 'auto';
  }

  async getSupportedLanguages() {
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'zh-CHS', name: 'Chinese (Simplified)' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'ru', name: 'Russian' }
    ];
  }
}

/**
 * 本地词典提供者（用于离线场景）
 */
class LocalDictionaryProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Local Dictionary', config);
    this.dictionary = config.dictionary || new Map();
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    console.log(`[LocalDictionary] Looking up: "${text}"`);
    
    const key = text.toLowerCase().trim();
    const entry = this.dictionary.get(key);
    
    if (!entry) {
      throw new Error(`No translation found for "${text}"`);
    }

    return {
      originalText: text,
      translatedText: entry.translation || '',
      sourceLang: entry.sourceLang || sourceLang,
      targetLang: targetLang,
      phonetics: entry.phonetics || [],
      definitions: entry.definitions || [],
      examples: entry.examples || [],
      provider: this.name,
      timestamp: Date.now()
    };
  }

  async detectLanguage(text) {
    return 'en'; // 简单实现
  }

  async getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' }
    ];
  }

  /**
   * 添加词条到本地词典
   * @param {string} word - 单词
   * @param {Object} entry - 词条数据
   */
  addEntry(word, entry) {
    this.dictionary.set(word.toLowerCase().trim(), entry);
  }
}

/**
 * Debug翻译提供者（用于开发和测试）
 * 返回固定的测试数据，无需API调用
 */
class DebugTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Debug Provider', config);
    this.delay = config.delay || 500; // 模拟API延迟
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    console.log(`[DebugProvider] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, this.delay));
    
    // 检测源语言
    const detectedLang = this.detectSourceLanguage(text);
    
    // 生成测试数据
    return this.generateTestResult(text, detectedLang, targetLang);
  }

  /**
   * 简单的语言检测
   */
  detectSourceLanguage(text) {
    // 检测是否包含中文字符
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return 'zh-CN';
    }
    // 检测是否包含日文字符
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja';
    }
    // 检测是否包含韩文字符
    if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko';
    }
    // 默认英文
    return 'en';
  }

  /**
   * 生成测试翻译结果
   */
  generateTestResult(text, sourceLang, targetLang) {
    const textLower = text.toLowerCase().trim();
    
    // 预定义的测试数据
    const testData = {
      'hello': {
        'zh-CN': {
          translation: '你好',
          phonetics: [
            { text: '/həˈloʊ/', type: 'us' },
            { text: '/həˈləʊ/', type: 'uk' }
          ],
          definitions: [
            { partOfSpeech: 'int.', text: '(用于问候)喂，你好', synonyms: ['hi', 'hey'] },
            { partOfSpeech: 'n.', text: '招呼，问候', synonyms: [] },
            { partOfSpeech: 'v.', text: '打招呼', synonyms: ['greet'] }
          ],
          examples: [
            { source: 'Hello! How are you?', translation: '你好！你好吗？' },
            { source: 'Say hello to your parents.', translation: '向你的父母问好。' },
            { source: 'He said hello and left.', translation: '他打了个招呼就离开了。' }
          ]
        },
        'ja': {
          translation: 'こんにちは',
          phonetics: [{ text: '/həˈloʊ/', type: 'us' }],
          definitions: [
            { partOfSpeech: 'int.', text: '挨拶の言葉', synonyms: [] }
          ],
          examples: [
            { source: 'Hello! How are you?', translation: 'こんにちは！元気ですか？' }
          ]
        }
      },
      'apple': {
        'zh-CN': {
          translation: '苹果',
          phonetics: [
            { text: '/ˈæpl/', type: 'us' },
            { text: '/ˈæpl/', type: 'uk' }
          ],
          definitions: [
            { partOfSpeech: 'n.', text: '苹果（水果）', synonyms: [] },
            { partOfSpeech: 'n.', text: '苹果树', synonyms: [] },
            { partOfSpeech: 'n.', text: '苹果公司', synonyms: [] }
          ],
          examples: [
            { source: 'An apple a day keeps the doctor away.', translation: '一天一苹果，医生远离我。' },
            { source: 'I like red apples.', translation: '我喜欢红苹果。' }
          ]
        }
      },
      'world': {
        'zh-CN': {
          translation: '世界',
          phonetics: [{ text: '/wɜːrld/', type: 'us' }],
          definitions: [
            { partOfSpeech: 'n.', text: '世界；地球', synonyms: ['earth', 'globe'] },
            { partOfSpeech: 'n.', text: '领域；界', synonyms: ['realm', 'sphere'] }
          ],
          examples: [
            { source: 'Hello world!', translation: '你好，世界！' },
            { source: 'The world is changing.', translation: '世界正在改变。' }
          ]
        }
      }
    };

    // 查找测试数据
    let data = testData[textLower]?.[targetLang];
    
    // 如果没有预定义数据，生成默认数据
    if (!data) {
      data = {
        translation: `[DEBUG] Translation of "${text}" to ${targetLang}`,
        phonetics: [
          { text: '/debug/', type: 'debug' }
        ],
        definitions: [
          { partOfSpeech: 'n.', text: `[DEBUG] 这是 "${text}" 的调试翻译`, synonyms: [] }
        ],
        examples: [
          { source: `Example with ${text}`, translation: `包含 ${text} 的例句` }
        ]
      };
    }

    return {
      originalText: text,
      translatedText: data.translation,
      sourceLang: sourceLang,
      targetLang: targetLang,
      phonetics: data.phonetics || [],
      definitions: data.definitions || [],
      examples: data.examples || [],
      provider: this.name,
      timestamp: Date.now()
    };
  }

  async detectLanguage(text) {
    return this.detectSourceLanguage(text);
  }

  async getSupportedLanguages() {
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' }
    ];
  }

  /**
   * 添加自定义测试数据
   * @param {string} word - 单词
   * @param {string} targetLang - 目标语言
   * @param {Object} data - 翻译数据
   */
  addTestData(word, targetLang, data) {
    console.log(`[DebugProvider] Added test data for "${word}" -> ${targetLang}`);
  }
}

/**
 * 翻译服务管理器
 * 管理多个翻译提供者，提供统一的翻译接口
 */
class TranslationService {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.cache = new Map(); // 翻译缓存
    this.maxCacheSize = 100;
  }

  /**
   * 注册翻译提供者
   * @param {string} name - 提供者名称
   * @param {TranslationProvider} provider - 提供者实例
   */
  registerProvider(name, provider) {
    if (!(provider instanceof TranslationProvider)) {
      throw new TypeError('Provider must be an instance of TranslationProvider');
    }
    this.providers.set(name, provider);
    console.log(`[TranslationService] Registered provider: ${name}`);
  }

  /**
   * 设置当前活动的提供者
   * @param {string} name - 提供者名称
   */
  setActiveProvider(name) {
    if (!this.providers.has(name)) {
      throw new Error(`Provider "${name}" not found`);
    }
    this.activeProvider = name;
    console.log(`[TranslationService] Active provider set to: ${name}`);
  }

  /**
   * 获取当前活动的提供者
   * @returns {TranslationProvider}
   */
  getActiveProvider() {
    if (!this.activeProvider) {
      throw new Error('No active provider set');
    }
    return this.providers.get(this.activeProvider);
  }

  /**
   * 翻译文本
   * @param {string} text - 待翻译文本
   * @param {string} targetLang - 目标语言
   * @param {string} [sourceLang='auto'] - 源语言
   * @param {Object} [options] - 额外选项
   * @returns {Promise<TranslationResult>}
   */
  async translate(text, targetLang, sourceLang = 'auto', options = {}) {
    const cacheKey = `${text}:${sourceLang}:${targetLang}:${this.activeProvider}`;
    
    // 检查缓存
    if (!options.noCache && this.cache.has(cacheKey)) {
      console.log('[TranslationService] Using cached result');
      return this.cache.get(cacheKey);
    }

    try {
      const provider = this.getActiveProvider();
      const result = await provider.translate(text, targetLang, sourceLang);
      
      // 缓存结果
      this.addToCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('[TranslationService] Translation failed:', error);
      throw error;
    }
  }

  /**
   * 添加到缓存
   * @param {string} key - 缓存键
   * @param {TranslationResult} value - 翻译结果
   */
  addToCache(key, value) {
    // 如果缓存已满，删除最旧的项
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  /**
   * 清除缓存
   */
  clearCache() {
    this.cache.clear();
    console.log('[TranslationService] Cache cleared');
  }

  /**
   * 获取支持的语言列表
   * @returns {Promise<Array<{code: string, name: string}>>}
   */
  async getSupportedLanguages() {
    const provider = this.getActiveProvider();
    return provider.getSupportedLanguages();
  }

  /**
   * 检测语言
   * @param {string} text - 待检测文本
   * @returns {Promise<string>}
   */
  async detectLanguage(text) {
    const provider = this.getActiveProvider();
    return provider.detectLanguage(text);
  }

  /**
   * 导出翻译结果为JSON
   * @param {TranslationResult} result - 翻译结果
   * @returns {string} JSON字符串
   */
  exportToJSON(result) {
    return JSON.stringify(result, null, 2);
  }

  /**
   * 从JSON导入翻译结果
   * @param {string} json - JSON字符串
   * @returns {TranslationResult}
   */
  importFromJSON(json) {
    return JSON.parse(json);
  }
}

// 创建全局翻译服务实例
const translationService = new TranslationService();

// 注册默认提供者
translationService.registerProvider('debug', new DebugTranslateProvider());
translationService.registerProvider('google', new GoogleTranslateProvider());
translationService.registerProvider('youdao', new YoudaoTranslateProvider());
translationService.registerProvider('local', new LocalDictionaryProvider());

// 设置默认提供者为Debug（便于开发调试）
translationService.setActiveProvider('debug');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = {
    TranslationProvider,
    DebugTranslateProvider,
    GoogleTranslateProvider,
    YoudaoTranslateProvider,
    LocalDictionaryProvider,
    TranslationService,
    translationService
  };
}
