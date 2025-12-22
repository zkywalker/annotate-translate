/**
 * Settings Schema and Default Values
 * 分层的配置结构，便于扩展和维护
 */

const DEFAULT_SETTINGS = {
  // 通用设置
  general: {
    enableTranslate: true,
    enableAnnotate: true,
    uiLanguage: 'auto', // 'auto' 跟随浏览器语言
    targetLanguage: 'zh-CN',
    showFloatingButton: true,
    enableContextMenu: true,
    phoneticDisplay: 'both', // 'us' | 'uk' | 'both'
    enablePhoneticFallback: true // 音标补充功能
  },

  // 标注功能设置
  annotation: {
    // 显示内容
    showPhonetics: true,       // 显示音标
    showTranslation: true,     // 显示翻译
    showDefinitions: false,    // 显示释义（可能超长）
    enableAudio: true,         // 显示发音按钮

    // 标注样式
    hidePhoneticForMultipleWords: false // 多词时隐藏音标
  },

  // 翻译详情卡片设置
  translationCard: {
    // 显示内容
    showPhonetics: true,     // 显示音标
    enableAudio: true,       // 显示发音按钮
    showDefinitions: true,   // 显示词义
    showExamples: true,      // 显示例句
    maxExamples: 3,          // 最大例句数量
    autoCloseDelay: 10       // 自动关闭延迟（秒），0=不自动关闭
  },

  // 翻译服务配置
  providers: {
    current: 'google', // 当前使用的服务

    google: {
      enabled: true
      // Google 翻译无需额外配置
    },

    youdao: {
      enabled: false,
      appKey: '',
      appSecret: '',
      connectionStatus: null // { tested: boolean, success: boolean, timestamp: number, responseTime: number, error: string }
    },

    deepl: {
      enabled: false,
      apiKey: '',
      useFreeApi: true,
      connectionStatus: null
    },

    // 保留 openai 作为默认 AI 提供商（向后兼容）
    openai: {
      enabled: false,
      apiKey: '',
      model: 'gpt-3.5-turbo',
      baseUrl: 'https://api.openai.com/v1',
      temperature: 0.3,
      maxTokens: 500,
      timeout: 30,
      connectionStatus: null,
      // 提示词配置
      promptFormat: 'jsonFormat', // 'jsonFormat' | 'simpleFormat'
      useContext: true, // 是否使用上下文信息
      customTemplates: null // 自定义模板对象，null表示使用默认模板
    },

    // 新增：AI 提供商列表（支持多个 OpenAI 兼容的服务）
    aiProviders: [
      {
        id: 'openai-default',
        name: 'OpenAI',
        enabled: true,
        apiKey: '',
        model: 'gpt-3.5-turbo',
        baseUrl: 'https://api.openai.com/v1',
        temperature: 0.3,
        maxTokens: 500,
        timeout: 30,
        promptFormat: 'jsonFormat',
        useContext: true,
        customTemplates: null,
        connectionStatus: null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }
    ],
    // 当前选择的 AI 提供商 ID
    currentAIProvider: 'openai-default'
  },

  // 显示与外观 (选择菜单)
  display: {
    menu: {
      buttonSize: 'small'      // 'small' | 'medium' | 'large'
    }
  },

  // 性能设置
  performance: {
    enableCache: true,
    cacheSize: 100
  },

  // 调试设置
  debug: {
    enableDebugMode: false
  }
};

// 如果在浏览器环境中，导出到全局
if (typeof window !== 'undefined') {
  window.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
}

// 如果是 Node.js 环境（用于测试）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DEFAULT_SETTINGS };
}
