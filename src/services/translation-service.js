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
 * @property {string} [annotationText] - 用于标注的文本（可能包含读音+翻译）
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
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // 默认在标注中显示音标
    this.debugMode = config.debugMode || false; // Fixed: P1-2 — gate verbose logs behind debug flag
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    try {
      logger.log(`[GoogleTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      // 这里使用公共API端点（无需API密钥，但有限制）
      // 实际生产环境中应该使用官方API
      // 注意: URLSearchParams 不支持同名参数，需要手动构建URL
      const params = [
        'client=gtx',
        `sl=${sourceLang}`,
        `tl=${targetLang}`,
        'dt=t',     // 翻译
        'dt=at',    // 备选翻译
        'dt=bd',    // 词典
        'dt=ex',    // 例句
        'dt=md',    // 词义
        'dt=rw',    // 相关词
        `q=${encodeURIComponent(text)}`
      ];
      const url = 'https://translate.googleapis.com/translate_a/single?' + params.join('&');
      
      // 🐛 DEBUG: 打印请求URL
      logger.log('[GoogleTranslate] Request URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Fixed: P1-2 — only log full response in debug mode
      if (this.debugMode) {
        logger.log('[GoogleTranslate] Raw Response Data:', JSON.stringify(data, null, 2));
        logger.log('[GoogleTranslate] Response Structure:');
        logger.log('  - data[0] (翻译文本):', data[0]);
        logger.log('  - data[1] (反向翻译):', data[1]);
        logger.log('  - data[2] (检测语言):', data[2]);
        logger.log('  - data[12] (英文定义):', data[12]);
        logger.log('  - data[13] (例句):', data[13]);
      }

      // 解析Google Translate API返回的数据
      const result = this.parseGoogleResponse(data, text, sourceLang, targetLang);

      // Fixed: P1-2 — only log parsed result in debug mode
      if (this.debugMode) {
        logger.log('[GoogleTranslate] Parsed Result:', JSON.stringify(result, null, 2));
        logger.log('[GoogleTranslate] Has Phonetics:', result.phonetics.length > 0);
        logger.log('[GoogleTranslate] Has Definitions:', result.definitions.length > 0);
        logger.log('[GoogleTranslate] Has Examples:', result.examples.length > 0);
      }
      
      // ✅ 移除提供者级别的音标补充，由 TranslationService 统一处理
      
      return result;
    } catch (error) {
      console.error('[GoogleTranslate] Translation error:', error);
      throw error;
    }
  }

  parseGoogleResponse(data, originalText, sourceLang, targetLang) {
    logger.log('[GoogleTranslate] Parsing response for:', originalText);
    
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
      logger.log('[GoogleTranslate] ✓ Extracted translation:', result.translatedText);
    } else {
      logger.log('[GoogleTranslate] ✗ No translation data in data[0]');
    }

    // 音标信息（如果有）
    logger.log('[GoogleTranslate] Checking for phonetics in data[0][1][3]...');
    if (data[0] && data[0][1] && data[0][1][3]) {
      result.phonetics.push({
        text: data[0][1][3],
        type: 'us'
      });
      logger.log('[GoogleTranslate] ✓ Found phonetic:', data[0][1][3]);
    } else {
      logger.log('[GoogleTranslate] ✗ No phonetic data found');
      logger.log('[GoogleTranslate]   data[0]?', !!data[0]);
      logger.log('[GoogleTranslate]   data[0][1]?', data[0] ? !!data[0][1] : 'N/A');
      logger.log('[GoogleTranslate]   data[0][1][3]?', (data[0] && data[0][1]) ? data[0][1][3] : 'N/A');
    }

    // 词义解释 - 优先使用 data[12]（英文定义），否则使用 data[1]（反向翻译）
    if (data[12] && Array.isArray(data[12])) {
      // data[12] 包含英文定义
      result.definitions = data[12].map(item => {
        const definitions = item[1]; // 定义数组
        if (Array.isArray(definitions) && definitions.length > 0) {
          // 合并所有定义
          return definitions.map(def => ({
            partOfSpeech: item[0] || '',
            text: def[0] || '',
            synonyms: []
          }));
        }
        return null;
      }).flat().filter(Boolean);
      logger.log(`[GoogleTranslate] ✓ Found ${result.definitions.length} definitions from data[12]`);
    } else if (data[1]) {
      // 回退到 data[1]（反向翻译）
      result.definitions = data[1].map(item => {
        // data[1] 结构: ["名词", ["发音", "读音", "读法"], ...]
        const translations = item[1]; // 翻译数组
        if (Array.isArray(translations) && translations.length > 0) {
          // 显示所有翻译，用顿号分隔
          const translationText = translations.filter(t => typeof t === 'string').join('、');
          return {
            partOfSpeech: item[0] || '',
            text: translationText || translations[0],
            synonyms: []
          };
        }
        return null;
      }).filter(Boolean);
      logger.log(`[GoogleTranslate] ✓ Found ${result.definitions.length} definitions from data[1]`);
    } else {
      logger.log('[GoogleTranslate] ✗ No definitions in data[12] or data[1]');
    }

    // 例句
    if (data[13]) {
      result.examples = data[13][0]?.slice(0, 3).map(item => ({
        source: item[0],
        translation: ''
      })) || [];
      logger.log(`[GoogleTranslate] ✓ Found ${result.examples.length} examples`);
    } else {
      logger.log('[GoogleTranslate] ✗ No examples in data[13]');
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
 * 有道翻译提供者（使用官方 API）
 * 需要在有道智云 AI 开放平台注册获取 appKey 和 appSecret
 * API 文档: https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html
 */
class YoudaoTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Youdao Translate', config);
    this.appKey = config.appKey || '';
    this.appSecret = config.appSecret || '';
    this.apiUrl = 'https://openapi.youdao.com/api';
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // 默认在标注中显示音标
  }

  /**
   * 更新 API 密钥配置
   * @param {string} appKey - 应用 ID
   * @param {string} appSecret - 应用密钥
   */
  updateConfig(appKey, appSecret) {
    this.appKey = appKey || '';
    this.appSecret = appSecret || '';
    logger.log(`[YoudaoTranslate] Config updated. AppKey: ${this.appKey ? 'Set' : 'Not set'}`);
  }

  /**
   * 检查配置是否完整
   * @returns {boolean}
   */
  isConfigured() {
    return !!(this.appKey && this.appSecret);
  }

  /**
   * 生成签名
   * @param {string} query - 待翻译文本
   * @param {string} salt - 随机数
   * @param {string} curtime - 当前时间戳
   * @returns {string} 签名
   */
  async generateSign(query, salt, curtime) {
    // 根据有道 API 文档，input 的计算规则：
    // 如果 query 长度 <= 20，input = query
    // 如果 query 长度 > 20，input = query前10个字符 + query长度 + query后10个字符
    let input;
    if (query.length <= 20) {
      input = query;
    } else {
      input = query.substring(0, 10) + query.length + query.substring(query.length - 10);
    }

    // 生成签名: SHA256(appKey + input + salt + curtime + appSecret)
    const signStr = this.appKey + input + salt + curtime + this.appSecret;
    
    // 使用 Web Crypto API 生成 SHA256 签名
    const encoder = new TextEncoder();
    const data = encoder.encode(signStr);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * 将语言代码转换为有道 API 支持的格式
   * @param {string} langCode - 通用语言代码
   * @returns {string} 有道 API 语言代码
   */
  convertLangCode(langCode) {
    const langMap = {
      'auto': 'auto',
      'zh-CN': 'zh-CHS',
      'zh-TW': 'zh-CHT',
      'en': 'en',
      'ja': 'ja',
      'ko': 'ko',
      'fr': 'fr',
      'es': 'es',
      'ru': 'ru',
      'de': 'de',
      'ar': 'ar'
    };
    return langMap[langCode] || langCode;
  }

  /**
   * 通过 background script 发送请求（绕过 CORS）
   * @param {string} url - API URL
   * @param {URLSearchParams} params - 请求参数
   * @returns {Promise<Object>} API 响应数据
   */
  async sendRequestViaBackground(url, params) {
    return new Promise((resolve, reject) => {
      // 检查是否在扩展环境中
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error('Chrome extension API not available'));
        return;
      }

      chrome.runtime.sendMessage({
        action: 'youdaoTranslate',
        params: {
          url: url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params.toString()
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (!response) {
          reject(new Error('No response from background script'));
          return;
        }

        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Unknown error from background script'));
        }
      });
    });
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    // 检查配置
    if (!this.isConfigured()) {
      throw new Error('Youdao API not configured. Please set appKey and appSecret in settings.');
    }

    try {
      logger.log(`[YoudaoTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      // 生成请求参数
      const salt = Date.now().toString();
      const curtime = Math.floor(Date.now() / 1000).toString();
      const sign = await this.generateSign(text, salt, curtime);
      
      // 转换语言代码
      const from = this.convertLangCode(sourceLang);
      const to = this.convertLangCode(targetLang);

      // 构建请求参数
      const params = new URLSearchParams({
        q: text,
        from: from,
        to: to,
        appKey: this.appKey,
        salt: salt,
        sign: sign,
        signType: 'v3',
        curtime: curtime
      });

      logger.log(`[YoudaoTranslate] Request params:`, {
        q: text,
        from: from,
        to: to,
        appKey: this.appKey.substring(0, 8) + '...',
        salt: salt,
        curtime: curtime,
        sign: sign.substring(0, 16) + '...'
      });

      // 通过 background script 发送请求（绕过 CORS）
      const data = await this.sendRequestViaBackground(this.apiUrl, params);
      
      logger.log(`[YoudaoTranslate] ========== API Response START ==========`);
      logger.log(`[YoudaoTranslate] Full response:`, JSON.stringify(data, null, 2));
      logger.log(`[YoudaoTranslate] Has basic?`, !!data.basic);
      if (data.basic) {
        logger.log(`[YoudaoTranslate] Basic fields:`, Object.keys(data.basic));
        logger.log(`[YoudaoTranslate] Basic content:`, data.basic);
      }
      logger.log(`[YoudaoTranslate] ========== API Response END ==========`);

      // 检查错误码
      if (data.errorCode !== '0') {
        const errorMessages = {
          '101': 'Missing required parameters',
          '102': 'Unsupported language',
          '103': 'Text too long',
          '104': 'Unsupported API type',
          '105': 'Unsupported signature type',
          '106': 'Unsupported response type',
          '107': 'Unsupported encoding type',
          '108': 'Invalid appKey',
          '109': 'Invalid batchLog format',
          '110': 'Invalid client IP',
          '111': 'Invalid account',
          '113': 'Access frequency limited',
          '202': 'Invalid signature',
          '206': 'Request timeout',
          '207': 'Service unavailable'
        };
        const errorMsg = errorMessages[data.errorCode] || `Unknown error: ${data.errorCode}`;
        throw new Error(`Youdao API Error [${data.errorCode}]: ${errorMsg}`);
      }
      
      return await this.parseYoudaoResponse(data, text, from, to);
    } catch (error) {
      console.error('[YoudaoTranslate] Translation error:', error);
      throw error;
    }
  }

  async parseYoudaoResponse(data, originalText, sourceLang, targetLang) {
    logger.log('[YoudaoTranslate] Parsing response data...');
    
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

    // 主要翻译结果
    if (data.translation && data.translation.length > 0) {
      result.translatedText = data.translation.join('\n');
      logger.log('[YoudaoTranslate] ✓ Translation:', result.translatedText);
    }

    // 音标信息（基本释义中可能包含）
    if (data.basic) {
      logger.log('[YoudaoTranslate] Processing basic dictionary data...');
      logger.log('[YoudaoTranslate] Available fields in basic:', Object.keys(data.basic).join(', '));
      
      let foundPhonetic = false;
      
      // 处理音标 - 有道API可能返回三种音标格式
      // 注意：有道翻译API可能不包含音标，只有词典API才有
      
      // 1. phonetic - 通用音标（通常是美音）
      if (data.basic.phonetic) {
        const phoneticText = this.formatPhonetic(data.basic.phonetic);
        result.phonetics.push({
          text: phoneticText,
          type: 'default',
          audioUrl: data.basic['phonetic-audio'] || null
        });
        logger.log('[YoudaoTranslate] ✓ Default phonetic:', phoneticText);
        foundPhonetic = true;
      }
      
      // 2. us-phonetic - 美式音标
      if (data.basic['us-phonetic']) {
        const usPhonetic = this.formatPhonetic(data.basic['us-phonetic']);
        result.phonetics.push({
          text: usPhonetic,
          type: 'us',
          audioUrl: data.basic['us-speech'] || null
        });
        logger.log('[YoudaoTranslate] ✓ US phonetic:', usPhonetic);
        foundPhonetic = true;
      }
      
      // 3. uk-phonetic - 英式音标
      if (data.basic['uk-phonetic']) {
        const ukPhonetic = this.formatPhonetic(data.basic['uk-phonetic']);
        result.phonetics.push({
          text: ukPhonetic,
          type: 'uk',
          audioUrl: data.basic['uk-speech'] || null
        });
        logger.log('[YoudaoTranslate] ✓ UK phonetic:', ukPhonetic);
        foundPhonetic = true;
      }
      
      if (!foundPhonetic) {
        console.warn('[YoudaoTranslate] ⚠️ No phonetic data found in API response');
        console.warn('[YoudaoTranslate] ⚠️ Note: Youdao Translation API may not include phonetics');
        console.warn('[YoudaoTranslate] ⚠️ Consider using a dictionary API for phonetic information');
      }

      // 词义解释
      if (data.basic.explains && data.basic.explains.length > 0) {
        logger.log('[YoudaoTranslate] Processing definitions...');
        data.basic.explains.forEach((explain, index) => {
          // 尝试解析词性和释义（格式：n. 名词释义）
          const match = explain.match(/^([a-z]+\.)\s*(.+)$/i);
          if (match) {
            result.definitions.push({
              partOfSpeech: match[1],
              text: match[2],
              synonyms: []
            });
          } else {
            result.definitions.push({
              partOfSpeech: '',
              text: explain,
              synonyms: []
            });
          }
        });
        logger.log(`[YoudaoTranslate] ✓ Definitions: ${result.definitions.length} entries`);
      }
    }

    // 网络释义（作为例句的补充）
    if (data.web && data.web.length > 0) {
      logger.log('[YoudaoTranslate] Processing web translations...');
      data.web.slice(0, 3).forEach(item => {
        if (item.key && item.value && item.value.length > 0) {
          result.examples.push({
            source: item.key,
            translation: item.value.join('; ')
          });
        }
      });
      logger.log(`[YoudaoTranslate] ✓ Examples: ${result.examples.length} entries`);
    }

    // 如果没有翻译结果，使用原文
    if (!result.translatedText) {
      result.translatedText = originalText;
      logger.log('[YoudaoTranslate] ⚠ No translation, using original text');
    }

    // ✅ 移除提供者级别的音标补充，由 TranslationService 统一处理

    // 生成标注文本（用于 Ruby 标注）
    result.annotationText = this.generateAnnotationText(result);
    logger.log('[YoudaoTranslate] ✓ Annotation text:', result.annotationText);

    logger.log('[YoudaoTranslate] ========== Parsing Summary ==========');
    logger.log('[YoudaoTranslate] Phonetics found:', result.phonetics.length);
    logger.log('[YoudaoTranslate] Definitions found:', result.definitions.length);
    logger.log('[YoudaoTranslate] Examples found:', result.examples.length);
    logger.log('[YoudaoTranslate] Annotation text:', result.annotationText);
    logger.log('[YoudaoTranslate] =====================================');

    return result;
  }

  /**
   * 格式化音标文本，确保有斜杠包裹
   * @param {string} phonetic - 原始音标文本
   * @returns {string} 格式化后的音标
   */
  formatPhonetic(phonetic) {
    if (!phonetic) return '';
    
    // 移除可能已存在的斜杠
    phonetic = phonetic.trim().replace(/^\/|\/$/g, '');
    
    // 添加标准的斜杠
    return `/${phonetic}/`;
  }

  /**
   * 生成用于标注的文本
   * 根据配置组合：音标 + 翻译 + 释义
   * @param {Object} result - 翻译结果对象
   * @returns {string} 标注文本
   */
  generateAnnotationText(result) {
    const parts = [];
    
    // 1. 音标 - 只有在 showPhoneticInAnnotation 开启时才添加
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      // 如果有音标，优先使用美式音标，其次是默认音标
      const usPhonetic = result.phonetics.find(p => p.type === 'us');
      const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
      const phonetic = usPhonetic || defaultPhonetic;
      
      if (phonetic) {
        parts.push(phonetic.text);
      }
    }
    
    // 2. 翻译 - 只有在 showTranslationInAnnotation 开启时才添加
    if (this.showTranslationInAnnotation !== false && result.translatedText) {
      parts.push(result.translatedText);
    }
    
    // 3. 释义 - 只有在 showDefinitionsInAnnotation 开启时才添加
    if (this.showDefinitionsInAnnotation && result.definitions && result.definitions.length > 0) {
      // 选择前几个释义（避免过长）
      const definitionsToShow = result.definitions.slice(0, 2); // 最多显示2个词性的释义
      const definitionTexts = definitionsToShow.map(def => {
        if (def.meanings && def.meanings.length > 0) {
          // 只取每个词性的第一个释义
          return `[${def.pos || ''}] ${def.meanings[0]}`;
        }
        return null;
      }).filter(Boolean);
      
      if (definitionTexts.length > 0) {
        parts.push(definitionTexts.join('; '));
      }
    }
    
    // 如果所有部分都为空（不应该发生，但作为兜底），返回翻译文本
    if (parts.length === 0 && result.translatedText) {
      return result.translatedText;
    }
    
    return parts.join(' ');
  }

  async detectLanguage(text) {
    return 'auto';
  }

  async getSupportedLanguages() {
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'ru', name: 'Russian' },
      { code: 'de', name: 'German' },
      { code: 'ar', name: 'Arabic' }
    ];
  }
}

/**
 * DeepL 翻译提供者
 * 使用 DeepL API 进行高质量翻译
 * API 文档: https://www.deepl.com/docs-api
 */
class DeepLTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('DeepL Translate', config);
    this.apiKey = config.apiKey || '';
    this.useFreeApi = config.useFreeApi !== false; // 默认使用免费 API
    this.freeApiUrl = 'https://api-free.deepl.com/v2/translate';
    this.proApiUrl = 'https://api.deepl.com/v2/translate';
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // 默认在标注中显示音标
  }

  /**
   * 更新 API 密钥配置
   * @param {string} apiKey - API 密钥
   * @param {boolean} useFreeApi - 是否使用免费 API
   */
  updateConfig(apiKey, useFreeApi = true) {
    this.apiKey = apiKey || '';
    this.useFreeApi = useFreeApi;
    
    // 🆕 根据 API 密钥自动检测类型（免费密钥通常以 :fx 结尾）
    if (this.apiKey && this.apiKey.includes(':fx')) {
      this.useFreeApi = true;
      logger.log(`[DeepLTranslate] Detected Free API key (ends with :fx)`);
    }
    
    logger.log(`[DeepLTranslate] Config updated.`);
    logger.log(`[DeepLTranslate]   API Key: ${this.apiKey ? (this.apiKey.substring(0, 10) + '...') : 'Not set'}`);
    logger.log(`[DeepLTranslate]   API Type: ${this.useFreeApi ? 'Free (api-free.deepl.com)' : 'Pro (api.deepl.com)'}`);
  }

  /**
   * 检查配置是否完整
   * @returns {boolean}
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * 获取 API URL
   * @returns {string}
   */
  getApiUrl() {
    return this.useFreeApi ? this.freeApiUrl : this.proApiUrl;
  }

  /**
   * 将语言代码转换为 DeepL API 支持的格式
   * @param {string} langCode - 通用语言代码
   * @param {boolean} isTarget - 是否为目标语言（目标语言和源语言的代码可能不同）
   * @returns {string} DeepL API 语言代码
   */
  convertLangCode(langCode, isTarget = false) {
    // DeepL 源语言代码映射
    const sourceLangMap = {
      'auto': '', // DeepL 不需要指定源语言，自动检测
      'zh-CN': 'ZH',
      'zh-TW': 'ZH',
      'zh': 'ZH',
      'en': 'EN',
      'en-US': 'EN',
      'en-GB': 'EN',
      'ja': 'JA',
      'ko': 'KO',
      'fr': 'FR',
      'es': 'ES',
      'ru': 'RU',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT',
      'pt-BR': 'PT',
      'pt-PT': 'PT',
      'nl': 'NL',
      'pl': 'PL',
      'ar': 'AR',
      'bg': 'BG',
      'cs': 'CS',
      'da': 'DA',
      'el': 'EL',
      'et': 'ET',
      'fi': 'FI',
      'hu': 'HU',
      'id': 'ID',
      'lt': 'LT',
      'lv': 'LV',
      'ro': 'RO',
      'sk': 'SK',
      'sl': 'SL',
      'sv': 'SV',
      'tr': 'TR',
      'uk': 'UK'
    };

    // DeepL 目标语言代码映射（某些语言需要指定变体）
    const targetLangMap = {
      'auto': 'EN', // auto 不能作为目标语言，默认英语
      'zh-CN': 'ZH', // 中文简体
      'zh-TW': 'ZH', // 中文繁体（DeepL 会自动处理）
      'zh': 'ZH',
      'en': 'EN-US', // 英语默认美式
      'en-US': 'EN-US',
      'en-GB': 'EN-GB',
      'ja': 'JA',
      'ko': 'KO',
      'fr': 'FR',
      'es': 'ES',
      'ru': 'RU',
      'de': 'DE',
      'it': 'IT',
      'pt': 'PT-BR', // 葡萄牙语默认巴西
      'pt-BR': 'PT-BR',
      'pt-PT': 'PT-PT',
      'nl': 'NL',
      'pl': 'PL',
      'ar': 'AR',
      'bg': 'BG',
      'cs': 'CS',
      'da': 'DA',
      'el': 'EL',
      'et': 'ET',
      'fi': 'FI',
      'hu': 'HU',
      'id': 'ID',
      'lt': 'LT',
      'lv': 'LV',
      'ro': 'RO',
      'sk': 'SK',
      'sl': 'SL',
      'sv': 'SV',
      'tr': 'TR',
      'uk': 'UK'
    };

    const langMap = isTarget ? targetLangMap : sourceLangMap;
    const result = langMap[langCode];
    
    if (result !== undefined) {
      return result;
    }
    
    // 如果没有找到映射，尝试转换为大写（可能是标准 ISO 代码）
    console.warn(`[DeepLTranslate] Unknown language code: ${langCode}, using uppercase version`);
    return langCode.toUpperCase();
  }

  /**
   * 通过 background script 发送请求（绕过 CORS）
   * @param {string} url - API URL
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} API 响应数据
   */
  async sendRequestViaBackground(url, params) {
    return new Promise((resolve, reject) => {
      // 检查是否在扩展环境中
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error('Chrome extension API not available'));
        return;
      }

      // 构建请求体
      const formData = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (Array.isArray(value)) {
          value.forEach(v => formData.append(key, v));
        } else {
          formData.append(key, value);
        }
      }

      chrome.runtime.sendMessage({
        action: 'deeplTranslate',
        params: {
          url: url,
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${this.apiKey}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: formData.toString()
        }
      }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(`Background script error: ${chrome.runtime.lastError.message}`));
          return;
        }

        if (!response) {
          reject(new Error('No response from background script'));
          return;
        }

        if (response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Unknown error from background script'));
        }
      });
    });
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    // 检查配置
    if (!this.isConfigured()) {
      throw new Error('DeepL API not configured. Please set API key in settings.');
    }

    try {
      logger.log(`[DeepLTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
      // 转换语言代码（源语言和目标语言分别转换）
      const source_lang = this.convertLangCode(sourceLang, false); // 源语言
      const target_lang = this.convertLangCode(targetLang, true);  // 目标语言

      logger.log(`[DeepLTranslate] Language code conversion:`, {
        sourceLang: sourceLang,
        source_lang: source_lang,
        targetLang: targetLang,
        target_lang: target_lang
      });

      // 构建请求参数
      const params = {
        text: text,
        target_lang: target_lang
      };

      // DeepL 自动检测源语言：不传 source_lang 参数
      // 只有在明确指定非 'auto' 的源语言时才添加 source_lang 参数
      if (sourceLang !== 'auto' && source_lang && source_lang !== '') {
        params.source_lang = source_lang;
        logger.log(`[DeepLTranslate] Using explicit source language: ${source_lang}`);
      } else {
        logger.log(`[DeepLTranslate] Using auto-detection (no source_lang parameter)`);
      }

      logger.log(`[DeepLTranslate] Final request params:`, params);

      // 获取 API URL
      const apiUrl = this.getApiUrl();
      
      logger.log(`[DeepLTranslate] Using API URL: ${apiUrl}`);
      logger.log(`[DeepLTranslate] API Key: ${this.apiKey ? (this.apiKey.substring(0, 10) + '...') : 'Not set'}`);

      // 通过 background script 发送请求（绕过 CORS）
      const data = await this.sendRequestViaBackground(apiUrl, params);
      
      logger.log(`[DeepLTranslate] ========== API Response START ==========`);
      logger.log(`[DeepLTranslate] Full response:`, JSON.stringify(data, null, 2));
      logger.log(`[DeepLTranslate] ========== API Response END ==========`);

      // 解析响应
      return this.parseDeepLResponse(data, text, sourceLang, targetLang);
    } catch (error) {
      console.error('[DeepLTranslate] Translation error:', error);
      
      // 处理常见的 DeepL API 错误
      if (error.message.includes('403')) {
        // 检查是否是端点错误
        if (error.message.includes('Wrong endpoint')) {
          const suggestedEndpoint = error.message.includes('api-free.deepl.com') ? 'Free' : 'Pro';
          throw new Error(
            `DeepL API endpoint mismatch. Your API key requires the ${suggestedEndpoint} API endpoint. ` +
            `Please ${suggestedEndpoint === 'Free' ? 'check' : 'uncheck'} the "Use Free API" option in settings.`
          );
        }
        throw new Error('DeepL API authentication failed. Please check your API key.');
      } else if (error.message.includes('456')) {
        throw new Error('DeepL API quota exceeded. Please check your usage limits or upgrade your plan.');
      } else if (error.message.includes('400')) {
        // 提取更详细的错误信息
        let detailedError = 'DeepL API bad request.';
        if (error.message.includes('source_lang')) {
          detailedError = `DeepL API error: Unsupported source language. The language code may not be supported by DeepL.`;
        } else if (error.message.includes('target_lang')) {
          detailedError = `DeepL API error: Unsupported target language "${targetLang}". Please check language settings.`;
        } else if (error.message.includes('text')) {
          detailedError = 'DeepL API error: Invalid text parameter.';
        }
        console.error('[DeepLTranslate] Error details:', error.message);
        throw new Error(detailedError);
      }
      
      throw error;
    }
  }

  parseDeepLResponse(data, originalText, sourceLang, targetLang) {
    logger.log('[DeepLTranslate] Parsing response data...');
    
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

    // DeepL API 返回的数据结构：
    // {
    //   "translations": [
    //     {
    //       "detected_source_language": "EN",
    //       "text": "translated text"
    //     }
    //   ]
    // }

    if (data.translations && data.translations.length > 0) {
      const translation = data.translations[0];
      
      // 翻译文本
      result.translatedText = translation.text;
      logger.log('[DeepLTranslate] ✓ Translation:', result.translatedText);

      // 检测到的源语言
      if (translation.detected_source_language) {
        result.sourceLang = translation.detected_source_language.toLowerCase();
        logger.log('[DeepLTranslate] ✓ Detected source language:', result.sourceLang);
      }
    } else {
      logger.log('[DeepLTranslate] ⚠ No translation in response');
      result.translatedText = originalText;
    }

    // DeepL 不提供音标和词义解释，这些将由 TranslationService 的统一后处理补充
    logger.log('[DeepLTranslate] ⓘ Note: DeepL does not provide phonetics or definitions');
    logger.log('[DeepLTranslate] ⓘ These will be supplemented by TranslationService if enabled');

    // 生成标注文本
    result.annotationText = this.generateAnnotationText(result);
    logger.log('[DeepLTranslate] ✓ Annotation text:', result.annotationText);

    logger.log('[DeepLTranslate] ========== Parsing Summary ==========');
    logger.log('[DeepLTranslate] Phonetics found:', result.phonetics.length);
    logger.log('[DeepLTranslate] Definitions found:', result.definitions.length);
    logger.log('[DeepLTranslate] Examples found:', result.examples.length);
    logger.log('[DeepLTranslate] Annotation text:', result.annotationText);
    logger.log('[DeepLTranslate] =====================================');

    return result;
  }

  /**
   * 生成用于标注的文本
   * DeepL 只返回翻译文本，音标和释义由后续处理补充
   * @param {Object} result - 翻译结果对象
   * @returns {string} 标注文本
   */
  generateAnnotationText(result) {
    const parts = [];
    
    // 1. 音标 - 只有在 showPhoneticInAnnotation 开启时才添加
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      // 如果有音标（由后续处理补充），优先使用美式音标
      const usPhonetic = result.phonetics.find(p => p.type === 'us');
      const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
      const phonetic = usPhonetic || defaultPhonetic || result.phonetics[0];
      
      if (phonetic && phonetic.text) {
        parts.push(phonetic.text);
      }
    }
    
    // 2. 翻译 - 只有在 showTranslationInAnnotation 开启时才添加
    if (this.showTranslationInAnnotation !== false && result.translatedText) {
      parts.push(result.translatedText);
    }
    
    // 3. 释义 - 只有在 showDefinitionsInAnnotation 开启时才添加
    if (this.showDefinitionsInAnnotation && result.definitions && result.definitions.length > 0) {
      const definitionsToShow = result.definitions.slice(0, 2);
      const definitionTexts = definitionsToShow.map(def => {
        if (def.meanings && def.meanings.length > 0) {
          return `[${def.pos || ''}] ${def.meanings[0]}`;
        }
        return null;
      }).filter(Boolean);
      
      if (definitionTexts.length > 0) {
        parts.push(definitionTexts.join('; '));
      }
    }
    
    // 如果所有部分都为空，返回翻译文本作为兜底
    if (parts.length === 0 && result.translatedText) {
      return result.translatedText;
    }
    
    return parts.join(' ');
  }

  async detectLanguage(text) {
    // DeepL 会在翻译时自动检测语言
    // 我们可以通过翻译到英语来检测语言
    try {
      const result = await this.translate(text, 'en', 'auto');
      return result.sourceLang;
    } catch (error) {
      console.error('[DeepLTranslate] Language detection error:', error);
      return 'auto';
    }
  }

  async getSupportedLanguages() {
    // DeepL 支持的语言列表（截至 2024）
    return [
      { code: 'auto', name: 'Auto Detect' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' },
      { code: 'zh-TW', name: 'Chinese (Traditional)' },
      { code: 'cs', name: 'Czech' },
      { code: 'da', name: 'Danish' },
      { code: 'nl', name: 'Dutch' },
      { code: 'en', name: 'English' },
      { code: 'en-US', name: 'English (American)' },
      { code: 'en-GB', name: 'English (British)' },
      { code: 'et', name: 'Estonian' },
      { code: 'fi', name: 'Finnish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'el', name: 'Greek' },
      { code: 'hu', name: 'Hungarian' },
      { code: 'id', name: 'Indonesian' },
      { code: 'it', name: 'Italian' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'lv', name: 'Latvian' },
      { code: 'lt', name: 'Lithuanian' },
      { code: 'nb', name: 'Norwegian' },
      { code: 'pl', name: 'Polish' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pt-BR', name: 'Portuguese (Brazilian)' },
      { code: 'pt-PT', name: 'Portuguese (European)' },
      { code: 'ro', name: 'Romanian' },
      { code: 'ru', name: 'Russian' },
      { code: 'sk', name: 'Slovak' },
      { code: 'sl', name: 'Slovenian' },
      { code: 'es', name: 'Spanish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'uk', name: 'Ukrainian' }
    ];
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
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // 默认在标注中显示读音
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    logger.log(`[DebugProvider] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
    
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
            { source: 'Hello! <b>How are you?</b>', translation: '你好！<b>你好吗？</b>' },
            { source: 'Say <i>hello</i> to your parents.', translation: '向你的父母<i>问好</i>。' },
            { source: 'He said hello and <u>left</u>.', translation: '他打了个招呼就<u>离开</u>了。' }
          ]
        },
        'ja': {
          translation: 'こんにちは',
          phonetics: [{ text: '/həˈloʊ/', type: 'us' }],
          definitions: [
            { partOfSpeech: 'int.', text: '挨拶の言葉', synonyms: [] }
          ],
          examples: [
            { source: '<b>Hello!</b> How are you?', translation: '<b>こんにちは！</b>元気ですか？' }
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
            { source: 'An <b>apple</b> a day keeps the doctor away.', translation: '一天一<b>苹果</b>，医生远离我。' },
            { source: 'I like <mark>red apples</mark>.', translation: '我喜欢<mark>红苹果</mark>。' }
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
            { source: '<strong>Hello world!</strong>', translation: '<strong>你好，世界！</strong>' },
            { source: 'The <u>world</u> is changing.', translation: '<u>世界</u>正在改变。' }
          ]
        }
      }
    };

    // 查找测试数据
    let data = testData[textLower]?.[targetLang];
    
    // 如果没有预定义数据，生成简单占位数据
    if (!data) {
      data = {
        translation: `${text}_translated`,
        phonetics: [
          { text: '/debug/', type: 'debug' }
        ],
        definitions: [
          { partOfSpeech: 'n.', text: `[DEBUG] 这是 "${text}" 的调试翻译`, synonyms: [] }
        ],
        examples: [
          { source: `Example with <b>${text}</b>`, translation: `包含 <b>${text}</b> 的例句` },
          { source: `No code can be <b>completely</b> secure`, translation: `没有代码可以<b>完全</b>安全` }
        ]
      };
    }

    const result = {
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

    // 如果配置为在标注中显示读音，且有读音信息，将读音添加到翻译文本中
    if (this.showPhoneticInAnnotation && result.phonetics.length > 0) {
      const phoneticText = result.phonetics[0].text;
      result.annotationText = `${phoneticText} ${result.translatedText}`;
    } else {
      result.annotationText = result.translatedText;
    }

    return result;
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
    logger.log(`[DebugProvider] Added test data for "${word}" -> ${targetLang}`);
  }
}

/**
 * FreeDictionary API 提供者（用于补充音标）
 * API: https://dictionaryapi.dev/
 * 完全免费，无需注册，支持英语单词音标查询
 */
class FreeDictionaryProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Free Dictionary', config);
    this.apiUrl = 'https://api.dictionaryapi.dev/api/v2/entries/en';
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    // FreeDictionary 只支持英语单词查询
    throw new Error('FreeDictionary is for phonetic lookup only, not translation');
  }

  /**
   * 获取单词的音标信息
   * @param {string} word - 英语单词
   * @returns {Promise<Object>} 包含音标的结果对象
   */
  async fetchPhonetics(word) {
    try {
      // 只查询单个单词
      const cleanWord = word.trim().toLowerCase();
      if (cleanWord.split(/\s+/).length > 1) {
        logger.log('[FreeDictionary] Skipping phrase (only supports single words):', word);
        return null;
      }

      logger.log(`[FreeDictionary] Fetching phonetics for: "${cleanWord}"`);
      
      const url = `${this.apiUrl}/${encodeURIComponent(cleanWord)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.log(`[FreeDictionary] Word not found: ${cleanWord}`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      logger.log('[FreeDictionary] API response:', data);

      return this.parseFreeDictionaryResponse(data, cleanWord);
    } catch (error) {
      console.error('[FreeDictionary] Error fetching phonetics:', error);
      return null;
    }
  }

  parseFreeDictionaryResponse(data, word) {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = {
      phonetics: [],
      audioUrls: []
    };

    // FreeDictionary 返回数组，通常第一个元素包含主要信息
    const entry = data[0];
    
    if (entry.phonetics && Array.isArray(entry.phonetics)) {
      entry.phonetics.forEach(phonetic => {
        if (phonetic.text) {
          // 判断音标类型（美音/英音）
          let type = 'default';
          if (phonetic.audio) {
            if (phonetic.audio.includes('-us.mp3') || phonetic.audio.includes('_us.mp3')) {
              type = 'us';
            } else if (phonetic.audio.includes('-uk.mp3') || phonetic.audio.includes('_uk.mp3')) {
              type = 'uk';
            }
          }

          result.phonetics.push({
            text: phonetic.text.startsWith('/') ? phonetic.text : `/${phonetic.text}/`,
            type: type,
            audioUrl: phonetic.audio || null
          });

          if (phonetic.audio) {
            result.audioUrls.push(phonetic.audio);
          }
        }
      });
    }

    logger.log(`[FreeDictionary] Found ${result.phonetics.length} phonetics for "${word}"`);
    
    return result.phonetics.length > 0 ? result : null;
  }

  async detectLanguage(text) {
    return 'en';
  }

  async getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' }
    ];
  }
}

/**
 * OpenAI 翻译提供者适配器
 * 将 ai-providers/openai-provider.js 的 OpenAIProvider 适配到 TranslationProvider 接口
 */
class OpenAITranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('AI翻译', config);
    this.openaiProvider = null;
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-3.5-turbo';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.temperature = config.temperature !== undefined ? config.temperature : 0.3;
    this.maxTokens = config.maxTokens || 500;
    this.timeout = config.timeout || 30;
    this.promptFormat = config.promptFormat || 'jsonFormat';
    this.useContext = config.useContext !== undefined ? config.useContext : true;
    this.customTemplates = config.customTemplates || null;
    this.providerName = config.providerName || 'OpenAI'; // 用户自定义的提供商名称
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false;
    this.showTranslationInAnnotation = config.showTranslationInAnnotation !== false;
    this.showDefinitionsInAnnotation = config.showDefinitionsInAnnotation === true;
  }

  /**
   * 初始化 OpenAI Provider
   */
  initializeProvider() {
    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }

    if (typeof OpenAIProvider === 'undefined') {
      throw new Error('OpenAIProvider class not loaded. Make sure ai-providers/openai-provider.js is included.');
    }

    this.openaiProvider = new OpenAIProvider({
      apiKey: this.apiKey,
      model: this.model,
      baseURL: this.baseURL,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      timeout: this.timeout,
      promptFormat: this.promptFormat,
      useContext: this.useContext,
      customTemplates: this.customTemplates
    });

    logger.log(`[OpenAI Adapter] Initialized with:`, {
      model: this.model,
      baseURL: this.baseURL,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      timeout: this.timeout,
      promptFormat: this.promptFormat,
      useContext: this.useContext
    });
  }

  /**
   * 更新配置
   */
  updateConfig(config) {
    let changed = false;

    if (config.apiKey !== undefined && config.apiKey !== this.apiKey) {
      this.apiKey = config.apiKey;
      changed = true;
    }
    if (config.model !== undefined && config.model !== this.model) {
      this.model = config.model;
      changed = true;
    }
    if (config.baseURL !== undefined && config.baseURL !== this.baseURL) {
      this.baseURL = config.baseURL;
      changed = true;
    }
    if (config.temperature !== undefined && config.temperature !== this.temperature) {
      this.temperature = config.temperature;
      changed = true;
    }
    if (config.maxTokens !== undefined && config.maxTokens !== this.maxTokens) {
      this.maxTokens = config.maxTokens;
      changed = true;
    }
    if (config.timeout !== undefined && config.timeout !== this.timeout) {
      this.timeout = config.timeout;
      changed = true;
    }
    if (config.promptFormat !== undefined && config.promptFormat !== this.promptFormat) {
      this.promptFormat = config.promptFormat;
      changed = true;
    }
    if (config.useContext !== undefined && config.useContext !== this.useContext) {
      this.useContext = config.useContext;
      changed = true;
    }
    if (config.customTemplates !== undefined && config.customTemplates !== this.customTemplates) {
      this.customTemplates = config.customTemplates;
      changed = true;
    }
    if (config.providerName !== undefined && config.providerName !== this.providerName) {
      this.providerName = config.providerName;
      // providerName 变更不需要重新初始化 provider
    }
    if (config.showPhoneticInAnnotation !== undefined) {
      this.showPhoneticInAnnotation = config.showPhoneticInAnnotation;
    }
    if (config.showTranslationInAnnotation !== undefined) {
      this.showTranslationInAnnotation = config.showTranslationInAnnotation;
    }
    if (config.showDefinitionsInAnnotation !== undefined) {
      this.showDefinitionsInAnnotation = config.showDefinitionsInAnnotation;
    }

    if (changed) {
      logger.log('[OpenAI Adapter] Configuration changed, reinitializing provider');
      this.openaiProvider = null;
    }
  }

  /**
   * 翻译文本（适配 TranslationProvider 接口）
   * @param {string} text - 待翻译文本
   * @param {string} targetLang - 目标语言
   * @param {string} [sourceLang='auto'] - 源语言
   * @param {Object} [options={}] - 额外选项（如 context）
   * @returns {Promise<TranslationResult>}
   */
  async translate(text, targetLang, sourceLang = 'auto', options = {}) {
    logger.log(`[OpenAI Adapter] Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);
    logger.log(`[OpenAI Adapter] Options:`, options);
    logger.log(`[OpenAI Adapter] Context:`, options.context || '(none)');
    
    // 确保 provider 已初始化
    if (!this.openaiProvider) {
      this.initializeProvider();
    }

    try {
      // 调用 OpenAIProvider (注意参数顺序不同)
      const aiResult = await this.openaiProvider.translate(text, sourceLang, targetLang, {
        context: options.context || '' // 从 options 中传递上下文
      });

      // 转换为 TranslationResult 格式
      const result = {
        originalText: text,
        translatedText: aiResult.translatedText || aiResult.translation || '',
        sourceLang: sourceLang === 'auto' ? (aiResult.sourceLang || 'auto') : sourceLang,
        targetLang: targetLang,
        phonetics: aiResult.phonetics || [],
        definitions: aiResult.definitions || [],
        examples: aiResult.examples || [],
        provider: 'openai',
        providerDisplayName: this.providerName, // 用户自定义的提供商显示名称
        metadata: aiResult.metadata || {},
        timestamp: Date.now()
      };

      // 构建标注文本
      result.annotationText = this.buildAnnotationText(result);

      // 记录 token 使用量
      if (typeof tokenStatsService !== 'undefined' && result.metadata) {
        const { promptTokens, completionTokens, tokensUsed, cost } = result.metadata;
        if (promptTokens || completionTokens || tokensUsed) {
          tokenStatsService.recordUsage(this.providerName, {
            promptTokens: promptTokens || 0,
            completionTokens: completionTokens || 0,
            totalTokens: tokensUsed || (promptTokens + completionTokens),
            cost: cost || 0
          }).catch(err => {
            console.warn('[OpenAI Adapter] Failed to record token usage:', err);
          });
        }
      }

      logger.log('[OpenAI Adapter] Translation completed:', result);
      return result;

    } catch (error) {
      console.error('[OpenAI Adapter] Translation failed:', error);
      throw new Error(`OpenAI translation failed: ${error.message}`);
    }
  }

  /**
   * 构建标注文本
   * 根据配置组合：音标 + 翻译 + 释义
   */
  buildAnnotationText(result) {
    let parts = [];
    
    // 1. 音标 - 只有在 showPhoneticInAnnotation 开启时才添加
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      const phoneticTexts = result.phonetics.map(p => p.text).filter(t => t);
      if (phoneticTexts.length > 0) {
        parts.push(phoneticTexts.join(' '));
      }
    }
    
    // 2. 翻译 - 只有在 showTranslationInAnnotation 开启时才添加
    if (this.showTranslationInAnnotation !== false && result.translatedText) {
      parts.push(result.translatedText);
    }
    
    // 3. 释义 - 只有在 showDefinitionsInAnnotation 开启时才添加
    if (this.showDefinitionsInAnnotation && result.definitions && result.definitions.length > 0) {
      const definitionsToShow = result.definitions.slice(0, 2);
      const definitionTexts = definitionsToShow.map(def => {
        if (def.meanings && def.meanings.length > 0) {
          return `[${def.pos || ''}] ${def.meanings[0]}`;
        }
        return null;
      }).filter(Boolean);
      
      if (definitionTexts.length > 0) {
        parts.push(definitionTexts.join('; '));
      }
    }
    
    // 如果所有部分都为空，返回翻译文本作为兜底
    if (parts.length === 0 && result.translatedText) {
      return result.translatedText;
    }
    
    return parts.join(' ');
  }

  async detectLanguage(text) {
    // OpenAI 不需要单独的语言检测，翻译时会自动处理
    // 简单判断：包含中文字符就是中文，否则是英文
    if (/[\u4e00-\u9fa5]/.test(text)) {
      return 'zh-CN';
    }
    return 'en';
  }

  async getSupportedLanguages() {
    // OpenAI 支持大多数主流语言
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
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'ar', name: 'Arabic' },
      { code: 'hi', name: 'Hindi' },
      { code: 'th', name: 'Thai' },
      { code: 'vi', name: 'Vietnamese' }
    ];
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
    this.enablePhoneticFallback = true; // 默认启用音标补充
    this.showPhoneticInAnnotation = true; // 默认在标注中显示音标
    this.showTranslationInAnnotation = true; // 默认在标注中显示翻译
    this.showDefinitionsInAnnotation = false; // 默认不显示释义（可能过长）
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
    logger.log(`[TranslationService] Registered provider: ${name}`);
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
    logger.log(`[TranslationService] Active provider set to: ${name}`);
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
    
    // 检查缓存（仅在缓存启用且未指定 noCache 时）
    if (!options.noCache && this.maxCacheSize > 0 && this.cache.has(cacheKey)) {
      logger.log('[TranslationService] Using cached result');
      return this.cache.get(cacheKey);
    }

    const provider = this.getActiveProvider();

    // Timeout and retry logic for provider.translate()
    const maxRetries = 2;
    let lastError;
    let result;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      let timeoutId;
      try {
        const controller = new AbortController();
        timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        logger.log('[TranslationService] Calling provider.translate with options:', options);
        result = await provider.translate(text, targetLang, sourceLang, { ...options, signal: controller.signal });
        clearTimeout(timeoutId);
        break; // Success, exit retry loop
      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;

        // Don't retry on 4xx errors (client errors)
        if (error.message?.includes('4') && error.message?.includes('error')) {
          throw error;
        }
        // On timeout (AbortError), retry if attempts remain
        if (error.name === 'AbortError' && attempt < maxRetries) {
          console.warn(`[TranslationService] Attempt ${attempt + 1} timed out, retrying...`);
          continue;
        }
        // For network errors, retry if attempts remain
        if (attempt < maxRetries && (error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'TypeError')) {
          console.warn(`[TranslationService] Attempt ${attempt + 1} failed, retrying...`);
          continue;
        }
        // No more retries or non-retryable error
        console.error('[TranslationService] Translation failed:', error);
        throw error;
      }
    }

    // If all retries exhausted without breaking out of the loop
    if (!result) {
      console.error('[TranslationService] Translation failed after all retries:', lastError);
      throw lastError;
    }

    try {
      // 通用音标补充：如果没有音标且启用了补充功能，尝试从 FreeDictionary 获取
      if (result.phonetics.length === 0 && this.enablePhoneticFallback) {
        logger.log('[TranslationService] No phonetics found, trying FreeDictionary supplement...');
        await this.supplementPhoneticsFromFreeDictionary(result, text);
      }

      // 生成或更新 annotationText（在补充音标后）
      if (!result.annotationText || result.phonetics.length > 0) {
        result.annotationText = this.generateAnnotationText(result);
        logger.log('[TranslationService] ✓ Generated annotation text:', result.annotationText);
      }

      // 缓存结果（仅在缓存启用时）
      if (this.maxCacheSize > 0) {
        this.addToCache(cacheKey, result);
      }

      return result;
    } catch (error) {
      console.error('[TranslationService] Post-translation processing failed:', error);
      throw error;
    }
  }

  /**
   * 从 FreeDictionary API 补充音标和发音（通用服务）
   * 这是一个通用的后处理步骤，适用于所有翻译提供者
   * @param {Object} result - 翻译结果对象
   * @param {string} originalText - 原始文本
   */
  async supplementPhoneticsFromFreeDictionary(result, originalText) {
    try {
      // 只为单个英文单词补充音标
      const words = originalText.trim().split(/\s+/);
      if (words.length !== 1) {
        logger.log('[TranslationService] Skipping FreeDictionary for non-single-word text');
        return;
      }

      // 检查是否是英文（简单判断）
      if (!/^[a-zA-Z]+$/.test(originalText.trim())) {
        logger.log('[TranslationService] Skipping FreeDictionary for non-English text');
        return;
      }

      // 获取 FreeDictionary 提供者
      const freeDictProvider = this.providers.get('freedict');
      if (!freeDictProvider) {
        logger.log('[TranslationService] ⚠️ FreeDictionary provider not available');
        return;
      }

      const phoneticData = await freeDictProvider.fetchPhonetics(originalText);
      if (phoneticData && phoneticData.phonetics.length > 0) {
        result.phonetics = phoneticData.phonetics;
        logger.log(`[TranslationService] ✓ Supplemented ${phoneticData.phonetics.length} phonetics from FreeDictionary`);
      } else {
        logger.log('[TranslationService] ⚠️ FreeDictionary did not return phonetics');
      }
    } catch (error) {
      console.error('[TranslationService] Error supplementing phonetics:', error);
    }
  }

  /**
   * 生成用于标注的文本（通用方法）
   * 根据配置组合：音标 + 翻译 + 释义
   * @param {Object} result - 翻译结果对象
   * @returns {string} 标注文本
   */
  generateAnnotationText(result) {
    const parts = [];
    
    // 1. 音标 - 只有在 showPhoneticInAnnotation 开启时才添加
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      // 如果有音标，优先使用美式音标，其次是默认音标
      const usPhonetic = result.phonetics.find(p => p.type === 'us');
      const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
      const phonetic = usPhonetic || defaultPhonetic || result.phonetics[0];
      
      if (phonetic && phonetic.text) {
        parts.push(phonetic.text);
      }
    }
    
    // 2. 翻译 - 只有在 showTranslationInAnnotation 开启时才添加
    if (this.showTranslationInAnnotation && result.translatedText) {
      parts.push(result.translatedText);
    }
    
    // 3. 释义 - 只有在 showDefinitionsInAnnotation 开启时才添加
    if (this.showDefinitionsInAnnotation && result.definitions && result.definitions.length > 0) {
      // 选择前几个释义（避免过长）
      const definitionsToShow = result.definitions.slice(0, 2); // 最多显示2个词性的释义
      const definitionTexts = definitionsToShow.map(def => {
        if (def.meanings && def.meanings.length > 0) {
          // 只取每个词性的第一个释义
          return `[${def.pos || ''}] ${def.meanings[0]}`;
        }
        return null;
      }).filter(Boolean);
      
      if (definitionTexts.length > 0) {
        parts.push(definitionTexts.join('; '));
      }
    }
    
    // 如果所有部分都为空（不应该发生，但作为兜底），返回翻译文本
    if (parts.length === 0 && result.translatedText) {
      return result.translatedText;
    }
    
    return parts.join(' ');
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
    logger.log('[TranslationService] Cache cleared');
  }

  /**
   * 启用缓存
   * @param {number} [size=100] - 缓存大小
   */
  enableCache(size = 100) {
    this.maxCacheSize = Math.max(10, Math.min(size, 1000)); // 限制在 10-1000 之间
    logger.log(`[TranslationService] Cache enabled with size: ${this.maxCacheSize}`);
  }

  /**
   * 禁用缓存
   */
  disableCache() {
    this.maxCacheSize = 0;
    this.clearCache();
    logger.log('[TranslationService] Cache disabled');
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
translationService.registerProvider('deepl', new DeepLTranslateProvider());
translationService.registerProvider('freedict', new FreeDictionaryProvider());

// 注册 OpenAI 提供者（如果 OpenAIProvider 类可用）
try {
  if (typeof OpenAIProvider !== 'undefined') {
    translationService.registerProvider('openai', new OpenAITranslateProvider());
    logger.log('[TranslationService] OpenAI provider registered successfully');
  } else {
    console.warn('[TranslationService] OpenAIProvider class not found, skipping registration');
  }
} catch (error) {
  console.error('[TranslationService] Failed to register OpenAI provider:', error);
}

// 设置默认提供者为 Google Translate
translationService.setActiveProvider('google');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  // Node.js 环境
  module.exports = {
    TranslationProvider,
    DebugTranslateProvider,
    GoogleTranslateProvider,
    YoudaoTranslateProvider,
    DeepLTranslateProvider,
    FreeDictionaryProvider,
    OpenAITranslateProvider,
    TranslationService,
    translationService
  };
}
