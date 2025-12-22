/**
 * OpenAI Provider for AI Translation
 * 支持可配置的提示词模板
 */

class OpenAIProvider extends BaseAIProvider {
  constructor(config) {
    super(config);
    this.providerName = 'openai';
    this.apiEndpoint = `${config.baseURL || 'https://api.openai.com/v1'}/chat/completions`;
    this.model = config.model || 'gpt-3.5-turbo';
    this.temperature = config.temperature !== undefined ? config.temperature : 0.3;
    this.maxTokens = config.maxTokens || 1000;
    this.promptFormat = config.promptFormat || 'jsonFormat';
    this.useContext = config.useContext !== undefined ? config.useContext : true;
    this.customTemplates = config.customTemplates || null;
    
    console.log(`[OpenAI Provider] Initialized - Model: ${this.model}, Format: ${this.promptFormat}`);
  }

  async translate(text, sourceLang, targetLang, options = {}) {
    console.log(`[OpenAI Provider] Translating: "${text.substring(0, 50)}..."`);
    console.log(`[OpenAI Provider] Options received:`, options);
    console.log(`[OpenAI Provider] Context:`, options.context || '(none)');
    console.log(`[OpenAI Provider] useContext setting:`, this.useContext);
    
    try {
      const prompts = PromptTemplates.buildPrompt({
        text, sourceLang, targetLang,
        format: this.promptFormat,
        context: this.useContext ? (options.context || '') : '',
        customTemplates: this.customTemplates
      });
      
      console.log(`[OpenAI Provider] Generated prompt preview:`, prompts.user.substring(0, 200) + '...');
      
      const response = await this.callAPI(prompts);
      const rawResponse = response.choices[0].message.content.trim();
      const tokensUsed = response.usage?.total_tokens || 0;
      
      console.log(`[OpenAI Provider] Completed - Tokens: ${tokensUsed}`);
      
      let result = this.promptFormat === 'jsonFormat' 
        ? this.parseJsonResponse(rawResponse, text, sourceLang, targetLang)
        : this.parseSimpleResponse(rawResponse, text, sourceLang, targetLang);
      
      result.metadata = {
        ...result.metadata,
        tokensUsed, 
        cost: this.calculateCost(tokensUsed),
        promptTokens: response.usage?.prompt_tokens || 0,
        completionTokens: response.usage?.completion_tokens || 0,
        promptFormat: this.promptFormat
      };
      
      return result;
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * 通过 background script 发送请求（绕过 CORS）
   * @param {string} url - API URL
   * @param {Object} body - 请求体
   * @param {Object} headers - 请求头
   * @returns {Promise<Object>} API 响应数据
   */
  async sendRequestViaBackground(url, body, headers) {
    return new Promise((resolve, reject) => {
      // 检查是否在扩展环境中
      if (typeof chrome === 'undefined' || !chrome.runtime || !chrome.runtime.sendMessage) {
        reject(new Error('Chrome extension API not available'));
        return;
      }

      chrome.runtime.sendMessage({
        action: 'openaiTranslate',
        params: {
          url: url,
          method: 'POST',
          headers: headers,
          body: JSON.stringify(body)
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

  async callAPI(prompts) {
    const requestBody = {
      model: this.model,
      messages: [
        { role: 'system', content: prompts.system },
        { role: 'user', content: prompts.user }
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens
    };

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    };

    // 使用 background script 发送请求以绕过 CORS
    const data = await this.sendRequestViaBackground(this.apiEndpoint, requestBody, headers);
    return data;
  }

  parseJsonResponse(rawResponse, originalText, sourceLang, targetLang) {
    const parsed = PromptTemplates.parseJsonResponse(rawResponse);
    if (parsed) {
      // 转换音标格式：string → PhoneticInfo[]
      const phonetics = [];
      if (parsed.phonetic && parsed.phonetic.trim()) {
        phonetics.push({
          text: parsed.phonetic,
          type: this.detectPhoneticType(parsed.phonetic, sourceLang)
        });
      }

      // 转换释义格式：string[] → Definition[]
      const definitions = [];
      if (parsed.definitions && Array.isArray(parsed.definitions)) {
        parsed.definitions.forEach((def, index) => {
          definitions.push({
            partOfSpeech: '', // AI 返回的简化格式没有词性
            text: def
          });
        });
      }

      return {
        translatedText: parsed.translation,
        originalText, sourceLang, targetLang,
        provider: this.providerName,
        model: this.model,
        timestamp: Date.now(),
        phonetics: phonetics,
        definitions: definitions,
        metadata: {}
      };
    }
    console.warn('[OpenAI Provider] JSON parse failed, using simple format');
    return this.parseSimpleResponse(rawResponse, originalText, sourceLang, targetLang);
  }

  /**
   * 检测音标类型
   * @param {string} phonetic - 音标文本
   * @param {string} sourceLang - 源语言
   * @returns {string} 音标类型
   */
  detectPhoneticType(phonetic, sourceLang) {
    // 如果包含 IPA 符号，判断为 IPA
    if (/[ˈˌːəɪʊɛæɔʌɑθðŋʃʒ]/.test(phonetic)) {
      return 'ipa';
    }
    // 如果是中文，判断为拼音
    if (sourceLang.startsWith('zh')) {
      return 'pinyin';
    }
    return 'default';
  }

  parseSimpleResponse(rawResponse, originalText, sourceLang, targetLang) {
    return {
      translatedText: rawResponse,
      originalText, sourceLang, targetLang,
      provider: this.providerName,
      model: this.model,
      timestamp: Date.now(),
      metadata: {}
    };
  }

  async validateConfig() {
    try {
      const prompts = PromptTemplates.buildPrompt({
        text: 'hello', sourceLang: 'en', targetLang: 'zh-CN',
        format: 'simpleFormat', context: ''
      });
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: prompts.system },
            { role: 'user', content: prompts.user }
          ],
          max_tokens: 50
        })
      });

      return response.ok;
    } catch (error) {
      console.error('[OpenAI Provider] Validation error:', error);
      return false;
    }
  }

  calculateCost(tokens) {
    const pricing = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015
    };
    return (tokens / 1000) * (pricing[this.model] || pricing['gpt-3.5-turbo']);
  }

  getProviderInfo() {
    return {
      ...super.getProviderInfo(),
      endpoint: this.apiEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      promptFormat: this.promptFormat,
      useContext: this.useContext
    };
  }

  getPricingInfo() {
    const pricing = {
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'gpt-4': { input: 0.03, output: 0.06 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
    };
    return pricing[this.model] || pricing['gpt-3.5-turbo'];
  }
}

if (typeof window !== 'undefined') window.OpenAIProvider = OpenAIProvider;
if (typeof module !== 'undefined' && module.exports) module.exports = OpenAIProvider;