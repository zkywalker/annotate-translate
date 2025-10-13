# 翻译服务快速参考

## 🚀 快速开始

### 基础翻译
```javascript
const result = await translationService.translate('hello', 'zh-CN');
console.log(result.translatedText); // "你好"
```

### 完整示例
```javascript
// 1. 翻译
const result = await translationService.translate(
  'hello world',  // 文本
  'zh-CN',        // 目标语言
  'auto'          // 源语言（可选）
);

// 2. 渲染UI
const ui = new TranslationUI({
  enableAudio: true,
  showDefinitions: true,
  showExamples: true
});

const element = ui.render(result);
document.body.appendChild(element);
```

## 📦 核心文件

| 文件 | 说明 |
|------|------|
| `translation-service.js` | 翻译服务核心（提供商、管理器） |
| `translation-ui.js` | UI渲染组件（显示翻译结果） |
| `translation-ui.css` | UI样式（响应式、深色模式） |
| `translation-integration.js` | 集成示例代码 |
| `translation-test.html` | 浏览器测试页面 |

## 🎯 核心API

### TranslationService

```javascript
// 切换提供商
translationService.setActiveProvider('google');
translationService.setActiveProvider('youdao');
translationService.setActiveProvider('local');

// 翻译
const result = await translationService.translate(text, targetLang, sourceLang);

// 检测语言
const lang = await translationService.detectLanguage(text);

// 获取支持的语言
const langs = await translationService.getSupportedLanguages();

// 清除缓存
translationService.clearCache();
```

### TranslationUI

```javascript
const ui = new TranslationUI({
  showPhonetics: true,      // 显示读音
  showDefinitions: true,    // 显示词义
  showExamples: true,       // 显示例句
  maxExamples: 3,           // 最多例句数
  enableAudio: true,        // 启用音频
  audioProvider: 'google'   // 音频提供商
});

// 完整版UI
const element = ui.render(result);

// 简化版UI（仅译文和读音）
const simpleElement = ui.renderSimple(result);

// 清理资源
ui.cleanup();
```

## 📊 数据结构

### TranslationResult
```javascript
{
  originalText: "hello",           // 原文
  translatedText: "你好",          // 译文
  sourceLang: "en",                // 源语言
  targetLang: "zh-CN",             // 目标语言
  phonetics: [                     // 读音（可选）
    {
      text: "/həˈloʊ/",
      type: "us",
      audioUrl: "https://...",     // 可选
      audioData: ArrayBuffer       // 可选
    }
  ],
  definitions: [                   // 词义（可选）
    {
      partOfSpeech: "int.",
      text: "喂，你好",
      synonyms: ["hi", "hey"]
    }
  ],
  examples: [                      // 例句（可选）
    {
      source: "Hello!",
      translation: "你好！"
    }
  ],
  provider: "Google Translate",
  timestamp: 1234567890
}
```

## 🔌 集成到manifest.json

```json
{
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": [
      "translation-service.js",
      "translation-ui.js",
      "content.js"
    ],
    "css": [
      "translation-ui.css",
      "content.css"
    ]
  }]
}
```

## 🎵 音频播放

### 三种方式

1. **本地音频数据** (最优)
```javascript
phonetic.audioData = ArrayBuffer
```

2. **在线音频URL**
```javascript
phonetic.audioUrl = "https://..."
```

3. **浏览器TTS** (降级方案)
```javascript
// 自动使用 SpeechSynthesis API
```

### 播放优先级
```
audioData → audioUrl → TTS
```

## 🎨 自定义提供商

```javascript
class MyProvider extends TranslationProvider {
  constructor(config) {
    super('My Provider', config);
  }
  
  async translate(text, targetLang, sourceLang) {
    // 实现翻译
    return {
      originalText: text,
      translatedText: '...',
      sourceLang: '...',
      targetLang: targetLang,
      phonetics: [],
      definitions: [],
      examples: [],
      provider: this.name,
      timestamp: Date.now()
    };
  }
  
  async detectLanguage(text) {
    return 'en';
  }
  
  async getSupportedLanguages() {
    return [
      { code: 'en', name: 'English' },
      { code: 'zh-CN', name: 'Chinese' }
    ];
  }
}

// 注册并使用
translationService.registerProvider('my', new MyProvider());
translationService.setActiveProvider('my');
```

## 🛠️ 常用代码片段

### 替换content.js中的翻译函数

```javascript
async function translateText(text) {
  hideContextMenu();
  
  try {
    // 显示加载状态
    showLoading();
    
    // 执行翻译
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );
    
    hideLoading();
    
    // 渲染UI
    const ui = new TranslationUI({
      enableAudio: true,
      showDefinitions: true,
      showExamples: true
    });
    
    const element = ui.render(result);
    element.classList.add('annotate-translate-tooltip');
    
    // 定位并显示
    document.body.appendChild(element);
    positionTooltip(element);
    
    // 自动关闭
    setTimeout(() => {
      element.remove();
      ui.cleanup();
    }, 10000);
    
  } catch (error) {
    console.error('Translation failed:', error);
    showError('Translation failed');
  }
}
```

### 本地词典使用

```javascript
const localProvider = translationService.providers.get('local');

// 添加单词
localProvider.addEntry('hello', {
  translation: '你好',
  sourceLang: 'en',
  phonetics: [
    { text: '/həˈloʊ/', type: 'us' },
    { text: '/həˈləʊ/', type: 'uk' }
  ],
  definitions: [
    { partOfSpeech: 'int.', text: '喂，你好' },
    { partOfSpeech: 'n.', text: '招呼' }
  ],
  examples: [
    { source: 'Hello!', translation: '你好！' }
  ]
});

// 切换到本地词典
translationService.setActiveProvider('local');
```

### 批量翻译

```javascript
async function batchTranslate(texts, targetLang) {
  const results = [];
  
  for (const text of texts) {
    try {
      const result = await translationService.translate(text, targetLang);
      results.push(result);
      
      // 避免请求过快
      await new Promise(r => setTimeout(r, 100));
    } catch (error) {
      console.error(`Failed: ${text}`, error);
      results.push(null);
    }
  }
  
  return results;
}
```

### 错误处理与重试

```javascript
async function safeTranslate(text, targetLang) {
  const providers = ['google', 'youdao', 'local'];
  
  for (const provider of providers) {
    try {
      translationService.setActiveProvider(provider);
      return await translationService.translate(text, targetLang);
    } catch (error) {
      console.log(`${provider} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error('All providers failed');
}
```

## 🎨 UI自定义

### 修改颜色主题

```css
.translation-result-container {
  --primary-color: #667eea;
  --bg-color: #ffffff;
  --text-color: #333333;
  --border-radius: 8px;
}
```

### 自定义渲染

```javascript
class CustomUI extends TranslationUI {
  render(result) {
    const container = super.render(result);
    
    // 添加自定义内容
    const footer = document.createElement('div');
    footer.textContent = 'Custom footer';
    container.appendChild(footer);
    
    return container;
  }
}
```

## 🧪 测试

### 在浏览器中测试

```bash
# 启动本地服务器
python -m http.server 8000

# 或使用 Node.js
npx serve

# 访问测试页面
open http://localhost:8000/translation-test.html
```

### 快速测试代码

```javascript
// 测试Google翻译
translationService.setActiveProvider('google');
const r1 = await translationService.translate('hello', 'zh-CN');
console.log(r1.translatedText);

// 测试有道翻译
translationService.setActiveProvider('youdao');
const r2 = await translationService.translate('apple', 'zh-CN');
console.log(r2.translatedText);

// 测试UI渲染
const ui = new TranslationUI();
const element = ui.render(r1);
document.body.appendChild(element);
```

## 📝 配置管理

### 保存配置

```javascript
const config = {
  provider: 'google',
  targetLanguage: 'zh-CN',
  enableAudio: true,
  showDefinitions: true,
  showExamples: true
};

chrome.storage.sync.set({ translationConfig: config });
```

### 加载配置

```javascript
chrome.storage.sync.get('translationConfig', (items) => {
  const config = items.translationConfig || {};
  
  // 应用配置
  if (config.provider) {
    translationService.setActiveProvider(config.provider);
  }
  
  // 创建UI时使用配置
  const ui = new TranslationUI({
    enableAudio: config.enableAudio,
    showDefinitions: config.showDefinitions,
    showExamples: config.showExamples
  });
});
```

## 🔍 调试技巧

### 启用详细日志

```javascript
// 在控制台查看翻译过程
const result = await translationService.translate('hello', 'zh-CN');
console.log('Result:', JSON.stringify(result, null, 2));
```

### 检查缓存

```javascript
console.log('Cache size:', translationService.cache.size);
console.log('Cache keys:', [...translationService.cache.keys()]);
```

### 查看提供商

```javascript
console.log('Active:', translationService.activeProvider);
console.log('Providers:', [...translationService.providers.keys()]);
```

## 📚 相关文档

- **详细指南**: `TRANSLATION_SERVICE_GUIDE.md`
- **实现总结**: `TRANSLATION_IMPLEMENTATION.md`
- **架构可视化**: `ARCHITECTURE_VISUAL.md`
- **集成示例**: `translation-integration.js`
- **测试页面**: `translation-test.html`

## ⚡ 快捷命令

```javascript
// 快速翻译
t = (text, lang='zh-CN') => translationService.translate(text, lang);

// 快速渲染
r = (result) => {
  const ui = new TranslationUI();
  const el = ui.render(result);
  document.body.appendChild(el);
  return el;
};

// 快速测试
async function test() {
  const result = await t('hello');
  r(result);
}
```

## 🎯 性能优化

```javascript
// 1. 使用缓存（默认启用）
const r1 = await translationService.translate('hello', 'zh-CN'); // API调用
const r2 = await translationService.translate('hello', 'zh-CN'); // 使用缓存

// 2. 批量翻译时添加延迟
for (const text of texts) {
  await translationService.translate(text, 'zh-CN');
  await new Promise(r => setTimeout(r, 100)); // 延迟100ms
}

// 3. 防抖处理
const debounce = (fn, delay) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};

const debouncedTranslate = debounce(
  (text) => translationService.translate(text, 'zh-CN'),
  300
);
```

## 💡 最佳实践

1. ✅ 始终使用 `try-catch` 捕获错误
2. ✅ 显示加载状态提升用户体验
3. ✅ 使用缓存减少API调用
4. ✅ 批量翻译时添加延迟避免限流
5. ✅ 使用 `ui.cleanup()` 清理资源
6. ✅ 合理设置自动关闭时间
7. ✅ 提供备用翻译提供商
8. ✅ 过滤敏感信息（密码、邮箱等）

---

**快速参考完成！** 保存此文件以便快速查阅常用API和代码片段。🚀
