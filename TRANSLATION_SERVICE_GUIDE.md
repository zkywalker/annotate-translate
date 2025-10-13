# 翻译服务架构指南

## 📋 目录

1. [概述](#概述)
2. [架构设计](#架构设计)
3. [核心模块](#核心模块)
4. [数据结构](#数据结构)
5. [读音功能设计](#读音功能设计)
6. [使用示例](#使用示例)
7. [扩展指南](#扩展指南)
8. [最佳实践](#最佳实践)

## 概述

本翻译服务提供了一个灵活、可扩展的抽象层，将翻译功能与具体的翻译提供商（Google、有道等）解耦，并提供统一的UI展示接口。

### 主要特性

✅ **提供商抽象** - 轻松切换不同的翻译服务  
✅ **标准数据格式** - 统一的JSON数据结构  
✅ **音频支持** - 多种读音播放方式（TTS、在线音频、本地音频）  
✅ **缓存机制** - 提高性能，减少API调用  
✅ **离线支持** - 本地词典功能  
✅ **UI组件** - 开箱即用的翻译结果展示组件  

## 架构设计

```
┌─────────────────────────────────────────────────┐
│              Chrome Extension                    │
│  ┌───────────────────────────────────────────┐ │
│  │         content.js / popup.js              │ │
│  └────────────────┬──────────────────────────┘ │
│                   │                              │
│  ┌────────────────▼──────────────────────────┐ │
│  │      TranslationService (管理器)          │ │
│  │  - 提供商注册与切换                        │ │
│  │  - 缓存管理                                │ │
│  │  - 统一接口                                │ │
│  └────────────────┬──────────────────────────┘ │
│                   │                              │
│  ┌────────────────▼──────────────────────────┐ │
│  │     TranslationProvider (抽象基类)        │ │
│  └─────┬─────────┬─────────┬─────────────────┘ │
│        │         │         │                    │
│  ┌─────▼──┐ ┌───▼────┐ ┌──▼──────┐            │
│  │ Google │ │ Youdao │ │  Local  │            │
│  │Provider│ │Provider│ │Provider │            │
│  └────────┘ └────────┘ └─────────┘            │
│                                                  │
│  ┌───────────────────────────────────────────┐ │
│  │         TranslationUI (UI组件)            │ │
│  │  - 渲染翻译结果                            │ │
│  │  - 音频播放控制                            │ │
│  │  - 响应式布局                              │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## 核心模块

### 1. translation-service.js

翻译服务核心模块，包含：

- `TranslationProvider` - 抽象基类
- `GoogleTranslateProvider` - Google翻译实现
- `YoudaoTranslateProvider` - 有道翻译实现
- `LocalDictionaryProvider` - 本地词典实现
- `TranslationService` - 服务管理器

### 2. translation-ui.js

UI渲染模块，包含：

- `TranslationUI` - UI渲染器类
- 多种渲染模式（完整版/简化版）
- 音频播放控制

### 3. translation-ui.css

样式定义，包含：

- 完整的UI样式
- 深色模式支持
- 响应式设计
- 打印样式

## 数据结构

### TranslationResult（翻译结果）

```javascript
{
  originalText: "hello",           // 原文
  translatedText: "你好",          // 译文
  sourceLang: "en",                // 源语言
  targetLang: "zh-CN",             // 目标语言
  phonetics: [                     // 读音信息（可选）
    {
      text: "/həˈloʊ/",            // 音标
      type: "us",                  // 类型：us/uk/pinyin
      audioUrl: "https://...",     // 音频URL（可选）
      audioData: ArrayBuffer       // 音频数据（可选）
    }
  ],
  definitions: [                   // 词义（可选）
    {
      partOfSpeech: "int.",        // 词性
      text: "喂，你好",            // 释义
      synonyms: ["hi", "hey"]      // 同义词（可选）
    }
  ],
  examples: [                      // 例句（可选）
    {
      source: "Hello!",            // 原文
      translation: "你好！"         // 译文
    }
  ],
  provider: "Google Translate",    // 提供商名称
  timestamp: 1234567890            // 时间戳
}
```

## 读音功能设计

### 读音数据结构

```javascript
{
  text: "/həˈloʊ/",        // 音标文本
  type: "us",              // 读音类型
  audioUrl: "https://...", // 在线音频URL
  audioData: ArrayBuffer   // 本地音频数据
}
```

### 读音播放方式

#### 方式1：浏览器TTS（Text-to-Speech）

**优点：**
- 无需网络
- 免费
- 支持多语言

**缺点：**
- 音质一般
- 声音较机械
- 不同浏览器效果不同

**实现：**

```javascript
const utterance = new SpeechSynthesisUtterance(text);
utterance.lang = 'en-US';
window.speechSynthesis.speak(utterance);
```

#### 方式2：在线音频URL

**优点：**
- 音质好
- 真人发音
- 标准音标

**缺点：**
- 需要网络
- 可能有CORS问题
- 依赖第三方服务

**实现：**

```javascript
const audio = new Audio(audioUrl);
audio.play();
```

**音频源：**
- Google TTS: `https://translate.google.com/translate_tts?ie=UTF-8&q=hello&tl=en&client=tw-ob`
- 有道词典: `https://dict.youdao.com/dictvoice?audio=hello&type=1`

#### 方式3：本地音频数据

**优点：**
- 完全离线
- 加载快速
- 无网络依赖

**缺点：**
- 需要预先下载
- 占用存储空间
- 维护成本高

**实现：**

```javascript
const audioContext = new AudioContext();
const audioBuffer = await audioContext.decodeAudioData(audioData);
const source = audioContext.createBufferSource();
source.buffer = audioBuffer;
source.connect(audioContext.destination);
source.start(0);
```

### 读音按钮设计

```html
<button class="audio-play-button" title="Play pronunciation">
  🔊
</button>
```

**交互状态：**
- 默认：蓝色圆形按钮
- 悬停：放大效果
- 播放中：橙色 + 脉冲动画
- 错误：红色 + 抖动动画

## 使用示例

### 基础使用

```javascript
// 1. 在manifest.json中引入脚本
{
  "content_scripts": [{
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

// 2. 在content.js中使用
async function translateText(text) {
  // 执行翻译
  const result = await translationService.translate(
    text,
    'zh-CN',
    'auto'
  );
  
  // 渲染UI
  const ui = new TranslationUI({
    enableAudio: true,
    showDefinitions: true,
    showExamples: true
  });
  
  const element = ui.render(result);
  document.body.appendChild(element);
}
```

### 切换提供商

```javascript
// 切换到有道翻译
translationService.setActiveProvider('youdao');

// 切换到本地词典
translationService.setActiveProvider('local');

// 切换回Google翻译
translationService.setActiveProvider('google');
```

### 使用本地词典

```javascript
const localProvider = translationService.providers.get('local');

// 添加词条
localProvider.addEntry('hello', {
  translation: '你好',
  sourceLang: 'en',
  phonetics: [
    { text: '/həˈloʊ/', type: 'us' }
  ],
  definitions: [
    { partOfSpeech: 'int.', text: '喂，你好' }
  ]
});
```

### 创建自定义提供商

```javascript
class MyCustomProvider extends TranslationProvider {
  constructor(config) {
    super('My Provider', config);
  }
  
  async translate(text, targetLang, sourceLang) {
    // 调用自己的API
    const response = await fetch('https://my-api.com/translate', {
      method: 'POST',
      body: JSON.stringify({ text, targetLang })
    });
    
    const data = await response.json();
    
    return {
      originalText: text,
      translatedText: data.translation,
      sourceLang: data.sourceLang,
      targetLang: targetLang,
      phonetics: [],
      definitions: [],
      examples: [],
      provider: this.name,
      timestamp: Date.now()
    };
  }
  
  async detectLanguage(text) {
    // 实现语言检测
  }
  
  async getSupportedLanguages() {
    // 返回支持的语言
  }
}

// 注册并使用
translationService.registerProvider('mycustom', new MyCustomProvider());
translationService.setActiveProvider('mycustom');
```

## 扩展指南

### 添加新的翻译提供商

1. **创建提供商类**

```javascript
class BaiduTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Baidu Translate', config);
    this.appId = config.appId;
    this.appKey = config.appKey;
  }
  
  async translate(text, targetLang, sourceLang = 'auto') {
    // 实现百度翻译API调用
    const salt = Date.now();
    const sign = this.generateSign(text, salt);
    
    const url = 'https://fanyi-api.baidu.com/api/trans/vip/translate';
    const params = new URLSearchParams({
      q: text,
      from: sourceLang,
      to: targetLang,
      appid: this.appId,
      salt: salt,
      sign: sign
    });
    
    const response = await fetch(`${url}?${params}`);
    const data = await response.json();
    
    return this.parseResponse(data, text, sourceLang, targetLang);
  }
  
  generateSign(text, salt) {
    const str = this.appId + text + salt + this.appKey;
    return md5(str); // 需要md5库
  }
  
  parseResponse(data, originalText, sourceLang, targetLang) {
    // 解析百度翻译响应
    return {
      originalText,
      translatedText: data.trans_result[0].dst,
      sourceLang: data.from,
      targetLang: data.to,
      phonetics: [],
      definitions: [],
      examples: [],
      provider: this.name,
      timestamp: Date.now()
    };
  }
  
  // 实现其他必需方法...
}
```

2. **注册提供商**

```javascript
translationService.registerProvider('baidu', new BaiduTranslateProvider({
  appId: 'your-app-id',
  appKey: 'your-app-key'
}));
```

### 自定义UI样式

1. **覆盖CSS变量**

```css
.translation-result-container {
  --primary-color: #your-color;
  --bg-color: #your-bg;
  --text-color: #your-text;
}
```

2. **自定义渲染器**

```javascript
class MyTranslationUI extends TranslationUI {
  render(result) {
    const container = super.render(result);
    
    // 添加自定义元素
    const customElement = document.createElement('div');
    customElement.textContent = 'Custom content';
    container.appendChild(customElement);
    
    return container;
  }
}
```

### 添加音频源

```javascript
class MyTranslationUI extends TranslationUI {
  getAudioUrlFromService(text, type) {
    // 使用自己的音频服务
    return `https://my-audio-service.com/tts?text=${encodeURIComponent(text)}&voice=${type}`;
  }
}
```

## 最佳实践

### 1. 错误处理

```javascript
async function safeTranslate(text, targetLang) {
  try {
    return await translationService.translate(text, targetLang);
  } catch (error) {
    console.error('Translation failed:', error);
    
    // 尝试备用提供商
    const currentProvider = translationService.activeProvider;
    const fallbackProviders = ['google', 'youdao', 'local'].filter(
      p => p !== currentProvider
    );
    
    for (const provider of fallbackProviders) {
      try {
        translationService.setActiveProvider(provider);
        return await translationService.translate(text, targetLang);
      } catch (e) {
        continue;
      }
    }
    
    throw new Error('All translation providers failed');
  }
}
```

### 2. 性能优化

```javascript
// 使用缓存
const result = await translationService.translate(text, 'zh-CN');
// 再次请求相同内容会使用缓存

// 批量翻译时添加延迟
async function batchTranslate(texts) {
  for (const text of texts) {
    await translationService.translate(text, 'zh-CN');
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// 防抖处理
const debouncedTranslate = debounce(async (text) => {
  return await translationService.translate(text, 'zh-CN');
}, 300);
```

### 3. 用户体验

```javascript
// 显示加载状态
function showLoading() {
  const loader = document.createElement('div');
  loader.className = 'translation-loading';
  loader.textContent = 'Translating...';
  document.body.appendChild(loader);
  return loader;
}

async function translateWithFeedback(text) {
  const loader = showLoading();
  
  try {
    const result = await translationService.translate(text, 'zh-CN');
    loader.remove();
    
    // 显示结果
    showTranslationResult(result);
  } catch (error) {
    loader.remove();
    showError('Translation failed');
  }
}
```

### 4. 隐私保护

```javascript
// 敏感信息过滤
function shouldTranslate(text) {
  // 不翻译密码、邮箱等敏感信息
  const sensitivePatterns = [
    /password/i,
    /\b[\w\.-]+@[\w\.-]+\.\w+\b/, // 邮箱
    /\b\d{4}-\d{4}-\d{4}-\d{4}\b/  // 信用卡号
  ];
  
  return !sensitivePatterns.some(pattern => pattern.test(text));
}

// 使用前检查
if (shouldTranslate(text)) {
  await translationService.translate(text, 'zh-CN');
}
```

### 5. 配置管理

```javascript
// 统一配置管理
const config = {
  translation: {
    provider: 'google',
    defaultTargetLang: 'zh-CN',
    enableCache: true,
    cacheSize: 100
  },
  ui: {
    showPhonetics: true,
    showDefinitions: true,
    showExamples: true,
    maxExamples: 3,
    enableAudio: true,
    audioProvider: 'google'
  }
};

// 应用配置
function applyConfig(config) {
  translationService.setActiveProvider(config.translation.provider);
  translationService.maxCacheSize = config.translation.cacheSize;
  
  // 初始化UI配置
  window.translationUIConfig = config.ui;
}
```

## 总结

通过这个抽象层设计：

1. ✅ **解耦实现** - 翻译逻辑与具体提供商分离
2. ✅ **标准接口** - 统一的JSON数据格式便于集成
3. ✅ **灵活扩展** - 轻松添加新的翻译提供商
4. ✅ **多种读音** - 支持TTS、在线音频、本地音频
5. ✅ **完整UI** - 开箱即用的展示组件
6. ✅ **良好体验** - 缓存、错误处理、响应式设计

这个架构可以很好地支持Chrome扩展的翻译功能需求，同时保持代码的可维护性和可扩展性。

## 下一步

1. 将翻译服务集成到现有的`content.js`中
2. 更新`manifest.json`添加新的脚本文件
3. 测试各个翻译提供商
4. 优化音频播放体验
5. 添加用户配置界面

有任何问题欢迎参考`translation-integration.js`中的示例代码！
