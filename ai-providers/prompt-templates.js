/**
 * AI Prompt Templates
 * 
 * 可配置的提示词模板系统
 * 支持占位符替换和模板自定义
 */

class PromptTemplates {
  /**
   * 默认提示词模板配置
   */
  static DEFAULT_TEMPLATES = {
    // JSON 格式模板（返回完整信息）
    jsonFormat: {
      system: `You are a professional translator with expertise in multiple languages. 
You provide accurate, natural, and contextually appropriate translations.
Always respond with valid JSON only, no additional text or explanations.`,
      
      user: `Translate the following text from {sourceLang} to {targetLang}.

Requirements:
1. Provide accurate and natural translation
2. Include phonetic transcription of the SOURCE text (original text, not translation):
   - For English: use IPA format (e.g., /ˈtʃeɪmbə(r)/)
   - For Chinese: use Pinyin (e.g., fáng jiān)
   - If source text has no phonetic system, use empty string
3. Include brief definitions/meanings of the source text in the target language
4. Respond ONLY with valid JSON in this exact format:

{
  "translation": "translated text",
  "phonetic": "phonetic transcription of SOURCE text (empty string if not applicable)",
  "definitions": ["definition 1 in target language", "definition 2 in target language"]
}

Text to translate: {text}
{context}`,
      
      contextTemplate: `\nContext (for better translation accuracy):\n{context}\n`
    },
    
    // 简化模板（仅返回翻译）
    simpleFormat: {
      system: `You are a professional translator. Provide accurate, natural translations.
Respond ONLY with the translated text, no explanations or additional information.`,
      
      user: `Translate the following text from {sourceLang} to {targetLang}.

Requirements:
1. Provide accurate and natural translation
2. Maintain the original tone and style
3. Only return the translation, nothing else

Text to translate: {text}
{context}`,
      
      contextTemplate: `\nContext (for reference):\n{context}\n`
    }
  };

  /**
   * 上下文截取配置
   */
  static CONTEXT_CONFIG = {
    enabled: true,              // 是否启用上下文
    maxLength: 200,             // 上下文最大长度（字符数）
    beforeLength: 100,          // 目标文本前的上下文长度
    afterLength: 100            // 目标文本后的上下文长度
  };

  /**
   * 获取语言的完整名称
   * @param {string} langCode - 语言代码
   * @returns {string}
   */
  static getLanguageName(langCode) {
    const languageNames = {
      'en': 'English',
      'zh-CN': 'Simplified Chinese',
      'zh-TW': 'Traditional Chinese',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish'
    };
    return languageNames[langCode] || langCode;
  }

  /**
   * 构建提示词
   * @param {Object} options - 配置选项
   * @param {string} options.text - 要翻译的文本
   * @param {string} options.sourceLang - 源语言代码
   * @param {string} options.targetLang - 目标语言代码
   * @param {string} [options.format='jsonFormat'] - 模板格式 ('jsonFormat' 或 'simpleFormat')
   * @param {string} [options.context=''] - 上下文文本
   * @param {Object} [options.contextConfig] - 上下文配置
   * @param {Object} [options.customTemplates] - 自定义模板
   * @returns {Object} { system: string, user: string }
   */
  static buildPrompt(options) {
    const {
      text,
      sourceLang,
      targetLang,
      format = 'jsonFormat',
      context = '',
      contextConfig = this.CONTEXT_CONFIG,
      customTemplates = null
    } = options;

    // 使用自定义模板或默认模板
    const templates = customTemplates || this.DEFAULT_TEMPLATES;
    const template = templates[format] || templates.jsonFormat;

    // 处理上下文
    let contextText = '';
    if (contextConfig.enabled && context && context.trim()) {
      const processedContext = this.processContext(text, context, contextConfig);
      if (processedContext) {
        contextText = this.replaceVariables(template.contextTemplate, {
          context: processedContext
        });
      }
    }

    // 替换变量
    const variables = {
      text: text,
      sourceLang: this.getLanguageName(sourceLang),
      targetLang: this.getLanguageName(targetLang),
      context: contextText
    };

    const systemPrompt = this.replaceVariables(template.system, variables);
    const userPrompt = this.replaceVariables(template.user, variables);

    return {
      system: systemPrompt.trim(),
      user: userPrompt.trim()
    };
  }

  /**
   * 处理上下文文本
   * @param {string} text - 目标文本
   * @param {string} fullContext - 完整上下文
   * @param {Object} config - 上下文配置
   * @returns {string} 处理后的上下文
   */
  static processContext(text, fullContext, config) {
    if (!fullContext || !text) {
      return '';
    }

    // 查找目标文本在上下文中的位置
    const textIndex = fullContext.indexOf(text);
    
    if (textIndex === -1) {
      // 如果目标文本不在上下文中，截取开头部分
      return this.truncateText(fullContext, config.maxLength);
    }

    // 提取前后文本
    const beforeText = fullContext.substring(0, textIndex);
    const afterText = fullContext.substring(textIndex + text.length);

    // 截取前后文本
    const beforeTruncated = this.truncateText(
      beforeText, 
      config.beforeLength, 
      'end'  // 从末尾开始截取
    );
    const afterTruncated = this.truncateText(
      afterText, 
      config.afterLength, 
      'start'  // 从开头开始截取
    );

    // 组合上下文
    const contextParts = [];
    if (beforeTruncated) {
      contextParts.push(beforeTruncated.trim());
    }
    contextParts.push(`[${text}]`);  // 用方括号标记目标文本
    if (afterTruncated) {
      contextParts.push(afterTruncated.trim());
    }

    return contextParts.join(' ');
  }

  /**
   * 截取文本
   * @param {string} text - 要截取的文本
   * @param {number} maxLength - 最大长度
   * @param {string} [direction='start'] - 截取方向 ('start' 或 'end')
   * @returns {string}
   */
  static truncateText(text, maxLength, direction = 'start') {
    if (!text || text.length <= maxLength) {
      return text;
    }

    if (direction === 'end') {
      // 从末尾截取（保留后面的文本）
      const truncated = text.substring(text.length - maxLength);
      // 尝试从单词边界开始
      const firstSpace = truncated.indexOf(' ');
      return firstSpace > 0 && firstSpace < 20 
        ? '...' + truncated.substring(firstSpace + 1)
        : '...' + truncated;
    } else {
      // 从开头截取（保留前面的文本）
      const truncated = text.substring(0, maxLength);
      // 尝试在单词边界结束
      const lastSpace = truncated.lastIndexOf(' ');
      return lastSpace > maxLength - 20
        ? truncated.substring(0, lastSpace) + '...'
        : truncated + '...';
    }
  }

  /**
   * 替换模板中的变量
   * @param {string} template - 模板字符串
   * @param {Object} variables - 变量对象
   * @returns {string}
   */
  static replaceVariables(template, variables) {
    if (!template) {
      return '';
    }

    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{${key}}`;
      result = result.replace(new RegExp(placeholder, 'g'), value || '');
    }
    return result;
  }

  /**
   * 解析 JSON 格式的翻译结果
   * @param {string} response - AI 返回的响应
   * @returns {Object|null} 解析后的结果
   */
  static parseJsonResponse(response) {
    try {
      // 尝试直接解析
      const parsed = JSON.parse(response);
      
      // 验证必需字段
      if (parsed.translation) {
        return {
          translation: parsed.translation,
          phonetic: parsed.phonetic || '',
          definitions: Array.isArray(parsed.definitions) ? parsed.definitions : []
        };
      }
      
      return null;
    } catch (error) {
      // 尝试提取 JSON（可能被其他文本包围）
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.translation) {
            return {
              translation: parsed.translation,
              phonetic: parsed.phonetic || '',
              definitions: Array.isArray(parsed.definitions) ? parsed.definitions : []
            };
          }
        }
      } catch (e) {
        console.error('[Prompt Templates] Failed to parse JSON response:', error);
      }
      return null;
    }
  }

  /**
   * 验证模板格式
   * @param {Object} template - 模板对象
   * @returns {boolean}
   */
  static validateTemplate(template) {
    if (!template || typeof template !== 'object') {
      return false;
    }

    // 检查必需字段
    if (!template.system || !template.user) {
      return false;
    }

    // 检查是否包含必需的占位符
    const requiredPlaceholders = ['{text}', '{sourceLang}', '{targetLang}'];
    const userPrompt = template.user;
    
    for (const placeholder of requiredPlaceholders) {
      if (!userPrompt.includes(placeholder)) {
        console.warn(`[Prompt Templates] Missing required placeholder: ${placeholder}`);
        return false;
      }
    }

    return true;
  }

  /**
   * 创建自定义模板
   * @param {Object} template - 自定义模板对象
   * @param {string} name - 模板名称
   * @returns {Object|null} 验证后的模板
   */
  static createCustomTemplate(template, name = 'custom') {
    if (!this.validateTemplate(template)) {
      throw new Error('Invalid template format');
    }

    return {
      [name]: {
        system: template.system,
        user: template.user,
        contextTemplate: template.contextTemplate || this.DEFAULT_TEMPLATES.jsonFormat.contextTemplate
      }
    };
  }

  /**
   * 导出模板配置（用于保存到存储）
   * @param {Object} templates - 模板对象
   * @returns {string} JSON 字符串
   */
  static exportTemplates(templates) {
    return JSON.stringify(templates, null, 2);
  }

  /**
   * 导入模板配置（从存储加载）
   * @param {string} jsonString - JSON 字符串
   * @returns {Object|null} 模板对象
   */
  static importTemplates(jsonString) {
    try {
      const templates = JSON.parse(jsonString);
      
      // 验证所有模板
      for (const [name, template] of Object.entries(templates)) {
        if (!this.validateTemplate(template)) {
          console.error(`[Prompt Templates] Invalid template: ${name}`);
          return null;
        }
      }
      
      return templates;
    } catch (error) {
      console.error('[Prompt Templates] Failed to import templates:', error);
      return null;
    }
  }
}

// 导出到全局（浏览器环境）
if (typeof window !== 'undefined') {
  window.PromptTemplates = PromptTemplates;
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PromptTemplates;
}
