/**
 * Translation Service Integration Example
 * 
 * 这个文件展示了如何将翻译服务集成到Chrome扩展中
 */

/**
 * 集成翻译服务到content.js
 * 
 * 使用说明：
 * 1. 在manifest.json中添加translation-service.js和translation-ui.js
 * 2. 在content.js中引入这些模块
 * 3. 使用TranslationService进行翻译
 * 4. 使用TranslationUI渲染结果
 */

// ============================================
// 示例1: 基本翻译功能
// ============================================

async function basicTranslationExample() {
  try {
    // 使用全局翻译服务实例
    const result = await translationService.translate(
      'hello world',
      'zh-CN',
      'en'
    );
    
    console.log('Translation result:', result);
    
    // 渲染UI
    const ui = new TranslationUI();
    const element = ui.render(result);
    
    // 添加到页面
    document.body.appendChild(element);
  } catch (error) {
    console.error('Translation failed:', error);
  }
}

// ============================================
// 示例2: 切换翻译提供商
// ============================================

async function switchProviderExample() {
  // 切换到有道翻译
  translationService.setActiveProvider('youdao');
  
  const result = await translationService.translate('apple', 'zh-CN');
  console.log('Youdao result:', result);
  
  // 切换回Google翻译
  translationService.setActiveProvider('google');
}

// ============================================
// 示例4: 创建自定义翻译提供者
// ============================================

class CustomAPIProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Custom API', config);
    this.apiUrl = config.apiUrl;
    this.apiKey = config.apiKey;
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        text,
        source: sourceLang,
        target: targetLang
      })
    });

    const data = await response.json();
    
    return {
      originalText: text,
      translatedText: data.translation,
      sourceLang: data.detectedLanguage || sourceLang,
      targetLang: targetLang,
      phonetics: data.phonetics || [],
      definitions: data.definitions || [],
      examples: data.examples || [],
      provider: this.name,
      timestamp: Date.now()
    };
  }

  async detectLanguage(text) {
    // 实现语言检测
    return 'en';
  }

  async getSupportedLanguages() {
    // 返回支持的语言列表
    return [];
  }
}

// 注册自定义提供者
function registerCustomProvider() {
  const customProvider = new CustomAPIProvider({
    apiUrl: 'https://api.example.com/translate',
    apiKey: 'your-api-key'
  });
  
  translationService.registerProvider('custom', customProvider);
  translationService.setActiveProvider('custom');
}

// ============================================
// 示例5: 修改content.js中的translateText函数
// ============================================

async function improvedTranslateText(text) {
  console.log('[Annotate-Translate] Translating:', text);
  
  // 移除旧的tooltip
  const oldTooltip = document.querySelector('.annotate-translate-tooltip');
  if (oldTooltip) {
    oldTooltip.remove();
  }

  try {
    // 创建加载中的tooltip
    const loadingTooltip = createLoadingTooltip();
    document.body.appendChild(loadingTooltip);
    positionTooltip(loadingTooltip);

    // 执行翻译
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );

    // 移除加载tooltip
    loadingTooltip.remove();

    // 创建翻译结果UI
    const ui = new TranslationUI({
      showPhonetics: true,
      showDefinitions: true,
      showExamples: true,
      maxExamples: 2,
      enableAudio: true
    });

    // 根据文本长度决定使用简化版还是完整版UI
    const resultElement = text.length > 50 
      ? ui.renderSimple(result)
      : ui.render(result);

    // 添加特殊类名以便样式化
    resultElement.classList.add('annotate-translate-tooltip');
    
    // 添加关闭按钮
    const closeButton = createCloseButton(() => {
      resultElement.remove();
      ui.cleanup();
    });
    resultElement.appendChild(closeButton);

    // 定位并显示
    document.body.appendChild(resultElement);
    positionTooltip(resultElement);

    // 自动隐藏（可选）
    setTimeout(() => {
      if (resultElement.parentNode) {
        resultElement.remove();
        ui.cleanup();
      }
    }, 10000); // 10秒后自动关闭

  } catch (error) {
    console.error('[Annotate-Translate] Translation error:', error);
    showErrorTooltip('Translation failed. Please try again.');
  }
}

// 辅助函数：创建加载中的tooltip
function createLoadingTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'annotate-translate-tooltip loading';
  tooltip.innerHTML = `
    <div class="loading-spinner"></div>
    <div>Translating...</div>
  `;
  return tooltip;
}

// 辅助函数：定位tooltip
function positionTooltip(tooltip) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    tooltip.style.position = 'absolute';
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.bottom + window.scrollY + 10) + 'px';
    tooltip.style.zIndex = '10000';
    
    // 确保tooltip不会超出视口
    setTimeout(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      
      // 右边界检查
      if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
      }
      
      // 下边界检查
      if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = (rect.top + window.scrollY - tooltipRect.height - 10) + 'px';
      }
    }, 0);
  }
}

// 辅助函数：创建关闭按钮
function createCloseButton(onClick) {
  const button = document.createElement('button');
  button.className = 'translation-close-button';
  button.innerHTML = '✕';
  button.title = 'Close';
  button.addEventListener('click', onClick);
  return button;
}

// 辅助函数：显示错误tooltip
function showErrorTooltip(message) {
  const tooltip = document.createElement('div');
  tooltip.className = 'annotate-translate-tooltip error';
  tooltip.textContent = message;
  
  document.body.appendChild(tooltip);
  positionTooltip(tooltip);
  
  setTimeout(() => {
    tooltip.remove();
  }, 3000);
}

// ============================================
// 示例6: 在background.js中使用
// ============================================

// background.js中监听消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'translate') {
    handleTranslateRequest(request, sendResponse);
    return true; // 保持消息通道开放
  }
});

async function handleTranslateRequest(request, sendResponse) {
  try {
    const result = await translationService.translate(
      request.text,
      request.targetLang || 'zh-CN',
      request.sourceLang || 'auto'
    );
    
    sendResponse({
      success: true,
      result: result
    });
  } catch (error) {
    sendResponse({
      success: false,
      error: error.message
    });
  }
}

// ============================================
// 示例7: 批量翻译
// ============================================

async function batchTranslateExample(texts, targetLang) {
  const results = [];
  
  for (const text of texts) {
    try {
      const result = await translationService.translate(text, targetLang);
      results.push(result);
      
      // 避免请求过于频繁
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to translate "${text}":`, error);
      results.push(null);
    }
  }
  
  return results;
}

// ============================================
// 示例8: 导出和导入翻译结果
// ============================================

function exportTranslations() {
  const translations = []; // 假设这是你的翻译历史
  
  // 导出为JSON
  const json = JSON.stringify(translations, null, 2);
  
  // 下载文件
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'translations.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importTranslations(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const translations = JSON.parse(e.target.result);
      console.log('Imported translations:', translations);
      // 处理导入的翻译...
    } catch (error) {
      console.error('Failed to import translations:', error);
    }
  };
  reader.readAsText(file);
}

// ============================================
// 示例9: 配置管理
// ============================================

class TranslationConfig {
  static async load() {
    return new Promise((resolve) => {
      chrome.storage.sync.get({
        translationProvider: 'google',
        defaultTargetLang: 'zh-CN',
        enableCache: true,
        enableAudio: true,
        showDefinitions: true,
        showExamples: true
      }, (config) => {
        resolve(config);
      });
    });
  }

  static async save(config) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(config, resolve);
    });
  }

  static async apply(config) {
    // 设置翻译提供者
    if (config.translationProvider) {
      translationService.setActiveProvider(config.translationProvider);
    }
    
    // 其他配置应用...
  }
}

// 初始化时加载配置
async function initTranslationService() {
  const config = await TranslationConfig.load();
  await TranslationConfig.apply(config);
  console.log('[Translation Service] Initialized with config:', config);
}

// ============================================
// 导出所有示例函数
// ============================================

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    basicTranslationExample,
    switchProviderExample,
    registerCustomProvider,
    improvedTranslateText,
    batchTranslateExample,
    exportTranslations,
    importTranslations,
    TranslationConfig,
    initTranslationService,
    CustomAPIProvider
  };
}
