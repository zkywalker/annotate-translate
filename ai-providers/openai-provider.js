/**
 * OpenAI Provider for AI Translation
 * 
 * 使用 OpenAI API (GPT-3.5/GPT-4) 进行翻译
 * 支持直接 REST API 调用，无需 Vercel AI SDK
 */

class OpenAIProvider extends BaseAIProvider {
  /**
   * 构造函数
   * @param {Object} config - 配置对象
   * @param {string} config.apiKey - OpenAI API密钥
   * @param {string} [config.model='gpt-3.5-turbo'] - 使用的模型
   * @param {string} [config.baseURL='https://api.openai.com/v1'] - API基础URL
   * @param {number} [config.temperature=0.3] - 温度参数（0-2）
   * @param {number} [config.maxTokens=1000] - 最大token数
   */
  constructor(config) {
    super(config);
    
    this.providerName = 'openai';
    this.apiEndpoint = `${config.baseURL || 'https://api.openai.com/v1'}/chat/completions`;
    this.model = config.model || 'gpt-3.5-turbo';
    this.temperature = config.temperature !== undefined ? config.temperature : 0.3;
    this.maxTokens = config.maxTokens || 1000;
    
    console.log(`[OpenAI Provider] Initialized with model: ${this.model}`);
  }

  /**
   * 翻译文本
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言代码
   * @param {string} targetLang - 目标语言代码
   * @returns {Promise<AITranslationResult>}
   */
  async translate(text, sourceLang, targetLang) {
    console.log(`[OpenAI Provider] Translating from ${sourceLang} to ${targetLang}`);
    console.log(`[OpenAI Provider] Text: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}"`);
    
    try {
      // 构建提示词
      const prompt = this.buildTranslationPrompt(text, sourceLang, targetLang);
      
      // 估算输入token数
      const estimatedInputTokens = this.estimateTokens(prompt);
      console.log(`[OpenAI Provider] Estimated input tokens: ${estimatedInputTokens}`);
      
      // 调用 OpenAI API
      const response = await this.callAPI(prompt);
      
      // 解析响应
      const translatedText = response.choices[0].message.content.trim();
      const tokensUsed = response.usage?.total_tokens || 0;
      
      console.log(`[OpenAI Provider] Translation completed. Tokens used: ${tokensUsed}`);
      
      // 构建结果对象
      return {
        translatedText: translatedText,
        originalText: text,
        sourceLang: sourceLang,
        targetLang: targetLang,
        provider: this.providerName,
        model: this.model,
        timestamp: Date.now(),
        metadata: {
          tokensUsed: tokensUsed,
          cost: this.calculateCost(tokensUsed),
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0
        }
      };
      
    } catch (error) {
      throw this.handleAPIError(error);
    }
  }

  /**
   * 调用 OpenAI API
   * @param {string} prompt - 提示词
   * @returns {Promise<Object>}
   * @private
   */
  async callAPI(prompt) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator with expertise in multiple languages. Provide accurate, natural, and contextually appropriate translations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens
    };

    console.log(`[OpenAI Provider] Calling API: ${this.apiEndpoint}`);
    
    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || response.statusText;
      throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
    }

    return await response.json();
  }

  /**
   * 验证配置是否有效
   * @returns {Promise<boolean>}
   */
  async validateConfig() {
    try {
      console.log('[OpenAI Provider] Validating configuration...');
      
      // 尝试调用API进行简单的翻译测试
      const testPrompt = 'Translate "hello" from English to Chinese. Only return the translation.';
      
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'user', content: testPrompt }
          ],
          max_tokens: 10
        })
      });

      if (response.ok) {
        console.log('[OpenAI Provider] Configuration is valid');
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenAI Provider] Configuration validation failed:', errorData);
        return false;
      }
      
    } catch (error) {
      console.error('[OpenAI Provider] Configuration validation error:', error);
      return false;
    }
  }

  /**
   * 计算使用成本（美元）
   * 基于 2025 年的定价
   * @param {number} tokens - 使用的token数
   * @returns {number}
   * @private
   */
  calculateCost(tokens) {
    // OpenAI 定价（每1K tokens的价格，美元）
    const pricing = {
      'gpt-3.5-turbo': 0.0015,
      'gpt-3.5-turbo-0125': 0.0015,
      'gpt-4': 0.03,
      'gpt-4-turbo': 0.01,
      'gpt-4-turbo-preview': 0.01,
      'gpt-4o': 0.005,
      'gpt-4o-mini': 0.00015
    };

    const pricePerK = pricing[this.model] || pricing['gpt-3.5-turbo'];
    return (tokens / 1000) * pricePerK;
  }

  /**
   * 获取提供商信息
   * @returns {Object}
   */
  getProviderInfo() {
    return {
      ...super.getProviderInfo(),
      endpoint: this.apiEndpoint,
      temperature: this.temperature,
      maxTokens: this.maxTokens,
      pricing: this.getPricingInfo()
    };
  }

  /**
   * 获取定价信息
   * @returns {Object}
   * @private
   */
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

  /**
   * 构建针对OpenAI优化的翻译提示词
   * @param {string} text - 要翻译的文本
   * @param {string} sourceLang - 源语言
   * @param {string} targetLang - 目标语言
   * @returns {string}
   */
  buildTranslationPrompt(text, sourceLang, targetLang) {
    const sourceLanguageName = this.getLanguageName(sourceLang);
    const targetLanguageName = this.getLanguageName(targetLang);
    
    // 针对短文本和长文本使用不同的提示词
    if (text.length < 100) {
      return `Translate from ${sourceLanguageName} to ${targetLanguageName}. Only return the translation:

${text}`;
    } else {
      return `Translate the following text from ${sourceLanguageName} to ${targetLanguageName}.

Requirements:
- Maintain the original meaning and tone
- Use natural and fluent ${targetLanguageName}
- Preserve any formatting or special characters
- Only return the translation without explanations

Text:
${text}`;
    }
  }
}

// 如果在浏览器环境中，导出到全局
if (typeof window !== 'undefined') {
  window.OpenAIProvider = OpenAIProvider;
}

// 如果在Node.js环境中，使用module.exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OpenAIProvider;
}
