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
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    try {
      console.log(`[GoogleTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
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
      console.log('[GoogleTranslate] Request URL:', url);

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 🐛 DEBUG: 打印完整的响应数据
      console.log('[GoogleTranslate] Raw Response Data:', JSON.stringify(data, null, 2));
      console.log('[GoogleTranslate] Response Structure:');
      console.log('  - data[0] (翻译文本):', data[0]);
      console.log('  - data[1] (词义):', data[1]);
      console.log('  - data[2] (检测语言):', data[2]);
      console.log('  - data[13] (例句):', data[13]);
      
      // 解析Google Translate API返回的数据
      const result = this.parseGoogleResponse(data, text, sourceLang, targetLang);
      
      // 🐛 DEBUG: 打印解析后的结果
      console.log('[GoogleTranslate] Parsed Result:', JSON.stringify(result, null, 2));
      console.log('[GoogleTranslate] Has Phonetics:', result.phonetics.length > 0);
      console.log('[GoogleTranslate] Has Definitions:', result.definitions.length > 0);
      console.log('[GoogleTranslate] Has Examples:', result.examples.length > 0);
      
      return result;
    } catch (error) {
      console.error('[GoogleTranslate] Translation error:', error);
      throw error;
    }
  }

  parseGoogleResponse(data, originalText, sourceLang, targetLang) {
    console.log('[GoogleTranslate] Parsing response for:', originalText);
    
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
      console.log('[GoogleTranslate] ✓ Extracted translation:', result.translatedText);
    } else {
      console.log('[GoogleTranslate] ✗ No translation data in data[0]');
    }

    // 音标信息（如果有）
    console.log('[GoogleTranslate] Checking for phonetics in data[0][1][3]...');
    if (data[0] && data[0][1] && data[0][1][3]) {
      result.phonetics.push({
        text: data[0][1][3],
        type: 'us'
      });
      console.log('[GoogleTranslate] ✓ Found phonetic:', data[0][1][3]);
    } else {
      console.log('[GoogleTranslate] ✗ No phonetic data found');
      console.log('[GoogleTranslate]   data[0]?', !!data[0]);
      console.log('[GoogleTranslate]   data[0][1]?', data[0] ? !!data[0][1] : 'N/A');
      console.log('[GoogleTranslate]   data[0][1][3]?', (data[0] && data[0][1]) ? data[0][1][3] : 'N/A');
    }

    // 词义解释
    if (data[1]) {
      result.definitions = data[1].map(item => ({
        partOfSpeech: item[0] || '',
        text: item[1]?.[0]?.[0] || '',
        synonyms: item[1]?.[0]?.[1] || []
      }));
      console.log(`[GoogleTranslate] ✓ Found ${result.definitions.length} definitions`);
    } else {
      console.log('[GoogleTranslate] ✗ No definitions in data[1]');
    }

    // 例句
    if (data[13]) {
      result.examples = data[13][0]?.slice(0, 3).map(item => ({
        source: item[0],
        translation: ''
      })) || [];
      console.log(`[GoogleTranslate] ✓ Found ${result.examples.length} examples`);
    } else {
      console.log('[GoogleTranslate] ✗ No examples in data[13]');
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
    this.enablePhoneticFallback = config.enablePhoneticFallback !== false; // 默认启用音标补充
  }

  /**
   * 更新 API 密钥配置
   * @param {string} appKey - 应用 ID
   * @param {string} appSecret - 应用密钥
   * @param {boolean} enablePhoneticFallback - 是否启用音标补充
   */
  updateConfig(appKey, appSecret, enablePhoneticFallback = true) {
    this.appKey = appKey || '';
    this.appSecret = appSecret || '';
    this.enablePhoneticFallback = enablePhoneticFallback;
    console.log(`[YoudaoTranslate] Config updated. AppKey: ${this.appKey ? 'Set' : 'Not set'}, Phonetic fallback: ${this.enablePhoneticFallback}`);
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
      console.log(`[YoudaoTranslate] Translating: "${text}" from ${sourceLang} to ${targetLang}`);
      
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

      console.log(`[YoudaoTranslate] Request params:`, {
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
      
      console.log(`[YoudaoTranslate] ========== API Response START ==========`);
      console.log(`[YoudaoTranslate] Full response:`, JSON.stringify(data, null, 2));
      console.log(`[YoudaoTranslate] Has basic?`, !!data.basic);
      if (data.basic) {
        console.log(`[YoudaoTranslate] Basic fields:`, Object.keys(data.basic));
        console.log(`[YoudaoTranslate] Basic content:`, data.basic);
      }
      console.log(`[YoudaoTranslate] ========== API Response END ==========`);

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
    console.log('[YoudaoTranslate] Parsing response data...');
    
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
      console.log('[YoudaoTranslate] ✓ Translation:', result.translatedText);
    }

    // 音标信息（基本释义中可能包含）
    if (data.basic) {
      console.log('[YoudaoTranslate] Processing basic dictionary data...');
      console.log('[YoudaoTranslate] Available fields in basic:', Object.keys(data.basic).join(', '));
      
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
        console.log('[YoudaoTranslate] ✓ Default phonetic:', phoneticText);
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
        console.log('[YoudaoTranslate] ✓ US phonetic:', usPhonetic);
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
        console.log('[YoudaoTranslate] ✓ UK phonetic:', ukPhonetic);
        foundPhonetic = true;
      }
      
      if (!foundPhonetic) {
        console.warn('[YoudaoTranslate] ⚠️ No phonetic data found in API response');
        console.warn('[YoudaoTranslate] ⚠️ Note: Youdao Translation API may not include phonetics');
        console.warn('[YoudaoTranslate] ⚠️ Consider using a dictionary API for phonetic information');
      }

      // 词义解释
      if (data.basic.explains && data.basic.explains.length > 0) {
        console.log('[YoudaoTranslate] Processing definitions...');
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
        console.log(`[YoudaoTranslate] ✓ Definitions: ${result.definitions.length} entries`);
      }
    }

    // 网络释义（作为例句的补充）
    if (data.web && data.web.length > 0) {
      console.log('[YoudaoTranslate] Processing web translations...');
      data.web.slice(0, 3).forEach(item => {
        if (item.key && item.value && item.value.length > 0) {
          result.examples.push({
            source: item.key,
            translation: item.value.join('; ')
          });
        }
      });
      console.log(`[YoudaoTranslate] ✓ Examples: ${result.examples.length} entries`);
    }

    // 如果没有翻译结果，使用原文
    if (!result.translatedText) {
      result.translatedText = originalText;
      console.log('[YoudaoTranslate] ⚠ No translation, using original text');
    }

    // 如果没有音标且启用了补充功能，尝试从 FreeDictionary 获取
    if (result.phonetics.length === 0 && this.enablePhoneticFallback) {
      console.log('[YoudaoTranslate] No phonetics found, trying FreeDictionary fallback...');
      await this.supplementPhoneticsFromFreeDictionary(result, originalText);
    }

    // 生成标注文本（用于 Ruby 标注）
    result.annotationText = this.generateAnnotationText(result);
    console.log('[YoudaoTranslate] ✓ Annotation text:', result.annotationText);

    console.log('[YoudaoTranslate] ========== Parsing Summary ==========');
    console.log('[YoudaoTranslate] Phonetics found:', result.phonetics.length);
    console.log('[YoudaoTranslate] Definitions found:', result.definitions.length);
    console.log('[YoudaoTranslate] Examples found:', result.examples.length);
    console.log('[YoudaoTranslate] Annotation text:', result.annotationText);
    console.log('[YoudaoTranslate] =====================================');

    return result;
  }

  /**
   * 从 FreeDictionary 补充音标
   * @param {Object} result - 翻译结果对象
   * @param {string} originalText - 原始文本
   */
  async supplementPhoneticsFromFreeDictionary(result, originalText) {
    try {
      // 只为单个英文单词补充音标
      const words = originalText.trim().split(/\s+/);
      if (words.length !== 1) {
        console.log('[YoudaoTranslate] Skipping phonetic fallback for non-single-word');
        return;
      }

      // 检查是否是英文（简单判断）
      if (!/^[a-zA-Z]+$/.test(originalText.trim())) {
        console.log('[YoudaoTranslate] Skipping phonetic fallback for non-English text');
        return;
      }

      // 使用全局的 translationService 获取 FreeDictionary 提供者
      if (typeof translationService !== 'undefined') {
        const freeDictProvider = translationService.providers.get('freedict');
        if (freeDictProvider) {
          const phoneticData = await freeDictProvider.fetchPhonetics(originalText);
          if (phoneticData && phoneticData.phonetics.length > 0) {
            result.phonetics = phoneticData.phonetics;
            console.log(`[YoudaoTranslate] ✓ Supplemented ${phoneticData.phonetics.length} phonetics from FreeDictionary`);
          } else {
            console.log('[YoudaoTranslate] ⚠️ FreeDictionary did not return phonetics');
          }
        }
      }
    } catch (error) {
      console.error('[YoudaoTranslate] Error supplementing phonetics:', error);
    }
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
   * 优先使用：音标 + 翻译
   * @param {Object} result - 翻译结果对象
   * @returns {string} 标注文本
   */
  generateAnnotationText(result) {
    const parts = [];
    
    // 如果有音标，优先使用美式音标，其次是默认音标
    const usPhonetic = result.phonetics.find(p => p.type === 'us');
    const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
    const phonetic = usPhonetic || defaultPhonetic;
    
    if (phonetic) {
      parts.push(phonetic.text);
    }
    
    // 添加翻译（如果是单词，使用第一个词义；如果是句子，使用完整翻译）
    if (result.definitions.length > 0 && result.originalText.split(' ').length === 1) {
      // 单词：使用第一个词义
      parts.push(result.definitions[0].text);
    } else if (result.translatedText) {
      // 句子或短语：使用完整翻译
      parts.push(result.translatedText);
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
          { source: `Example with ${text}`, translation: `包含 ${text} 的例句` }
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
    console.log(`[DebugProvider] Added test data for "${word}" -> ${targetLang}`);
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
        console.log('[FreeDictionary] Skipping phrase (only supports single words):', word);
        return null;
      }

      console.log(`[FreeDictionary] Fetching phonetics for: "${cleanWord}"`);
      
      const url = `${this.apiUrl}/${encodeURIComponent(cleanWord)}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.log(`[FreeDictionary] Word not found: ${cleanWord}`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[FreeDictionary] API response:', data);

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

    console.log(`[FreeDictionary] Found ${result.phonetics.length} phonetics for "${word}"`);
    
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
    
    // 检查缓存（仅在缓存启用且未指定 noCache 时）
    if (!options.noCache && this.maxCacheSize > 0 && this.cache.has(cacheKey)) {
      console.log('[TranslationService] Using cached result');
      return this.cache.get(cacheKey);
    }

    try {
      const provider = this.getActiveProvider();
      const result = await provider.translate(text, targetLang, sourceLang);
      
      // 缓存结果（仅在缓存启用时）
      if (this.maxCacheSize > 0) {
        this.addToCache(cacheKey, result);
      }
      
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
   * 启用缓存
   * @param {number} [size=100] - 缓存大小
   */
  enableCache(size = 100) {
    this.maxCacheSize = Math.max(10, Math.min(size, 1000)); // 限制在 10-1000 之间
    console.log(`[TranslationService] Cache enabled with size: ${this.maxCacheSize}`);
  }

  /**
   * 禁用缓存
   */
  disableCache() {
    this.maxCacheSize = 0;
    this.clearCache();
    console.log('[TranslationService] Cache disabled');
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
translationService.registerProvider('freedict', new FreeDictionaryProvider());

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
    FreeDictionaryProvider,
    TranslationService,
    translationService
  };
}
