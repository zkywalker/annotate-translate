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
    targetLanguage: 'zh-CN'
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
    }
  },

  // 显示与外观
  display: {
    // 翻译弹窗设置
    translation: {
      enableAudio: true,
      showPhonetics: true,
      showDefinitions: true,
      showExamples: true,
      maxExamples: 3,
      autoCloseDelay: 10, // 秒，0=不自动关闭
      enablePhoneticFallback: true // 音标补充功能
    },
    
    // 选择菜单设置
    menu: {
      buttonSize: 'small' // 'small' | 'medium' | 'large'
    },
    
    // 标注样式设置
    annotation: {
      showPhonetics: true,
      enableAudio: true
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
