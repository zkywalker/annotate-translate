# 翻译服务可视化架构

## 📐 系统架构图

```
┌───────────────────────────────────────────────────────────────┐
│                    Chrome Extension                            │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  用户界面层 (UI Layer)                    │ │
│  │                                                            │ │
│  │  [content.js]  [popup.js]  [background.js]               │ │
│  │       │             │              │                       │ │
│  │       └─────────────┴──────────────┘                       │ │
│  │                     │                                       │ │
│  └─────────────────────┼───────────────────────────────────┘ │
│                        ▼                                        │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │              翻译服务层 (Service Layer)                   │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │         TranslationService (服务管理器)            │  │ │
│  │  │  • 提供商管理                                      │  │ │
│  │  │  • 缓存管理 (LRU Cache)                           │  │ │
│  │  │  • 统一接口 (translate, detectLanguage)           │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  │                        │                                   │ │
│  └────────────────────────┼───────────────────────────────┘ │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │            翻译提供商层 (Provider Layer)                 │ │
│  │                                                            │ │
│  │  ┌─────────────────────────────────────────────────┐     │ │
│  │  │     TranslationProvider (抽象基类)              │     │ │
│  │  │  • translate()      - 翻译文本                  │     │ │
│  │  │  • detectLanguage() - 检测语言                  │     │ │
│  │  │  • getSupportedLanguages() - 获取支持的语言     │     │ │
│  │  └─────────────────────────────────────────────────┘     │ │
│  │          │              │              │                   │ │
│  │   ┌──────▼───────┐ ┌───▼────────┐ ┌──▼────────────┐     │ │
│  │   │   Google     │ │   Youdao   │ │    Local      │     │ │
│  │   │  Provider    │ │  Provider  │ │   Provider    │     │ │
│  │   └──────────────┘ └────────────┘ └───────────────┘     │ │
│  └──────────────────────────────────────────────────────────┘ │
│                           ▼                                    │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                UI渲染层 (Render Layer)                    │ │
│  │                                                            │ │
│  │  ┌────────────────────────────────────────────────────┐  │ │
│  │  │            TranslationUI (UI渲染器)                │  │ │
│  │  │  • render() - 完整版UI                            │  │ │
│  │  │  • renderSimple() - 简化版UI                      │  │ │
│  │  │  • createPhoneticSection() - 读音部分             │  │ │
│  │  │  • createAudioButton() - 音频按钮                 │  │ │
│  │  │  • playAudio() - 播放音频                         │  │ │
│  │  └────────────────────────────────────────────────────┘  │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 数据流程图

```
用户选择文本
    │
    ▼
┌─────────────────┐
│  content.js     │  监听选择事件
│  handleSelection│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ 显示上下文菜单   │  [T] 翻译  [A] 标注
│   (T / A 按钮)  │
└────────┬────────┘
         │ 点击翻译按钮
         ▼
┌─────────────────────────────┐
│ translationService.translate│
│ (text, targetLang, source)  │
└────────┬────────────────────┘
         │
         ├──→ 检查缓存
         │    ├─ 命中 ─→ 返回缓存结果
         │    └─ 未命中 ─→ 继续
         │
         ▼
┌─────────────────────────┐
│ 获取活动提供商           │
│ getActiveProvider()     │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 提供商执行翻译           │
│ provider.translate()    │
└────────┬────────────────┘
         │
         ├──→ Google API
         ├──→ Youdao API  
         └──→ Local Dict
         │
         ▼
┌─────────────────────────┐
│ 返回 TranslationResult  │
│ {                       │
│   originalText,         │
│   translatedText,       │
│   phonetics,           │
│   definitions,         │
│   examples,            │
│   ...                  │
│ }                      │
└────────┬────────────────┘
         │
         ├──→ 添加到缓存
         │
         ▼
┌─────────────────────────┐
│ TranslationUI.render()  │
│ 渲染UI组件              │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│ 显示翻译结果             │
│ • 原文/译文             │
│ • 音标 + 🔊按钮         │
│ • 词义列表              │
│ • 例句                  │
└─────────────────────────┘
         │
         │ 用户点击🔊按钮
         ▼
┌─────────────────────────┐
│ playAudio()             │
│                         │
│ 优先级:                 │
│ 1. audioData (本地)     │
│ 2. audioUrl (在线)      │
│ 3. TTS (浏览器)         │
└─────────────────────────┘
         │
         ▼
    播放读音
```

## 🎨 UI组件结构

```
translation-result-container
├── original-text (原文部分)
│   ├── section-title: "Original"
│   └── text-content: "hello"
│
├── translated-text (译文部分)
│   ├── section-title: "Translation"
│   └── text-content: "你好"
│
├── phonetic-section (读音部分)
│   ├── section-title: "Pronunciation"
│   └── phonetic-container
│       ├── phonetic-item (US)
│       │   ├── phonetic-type: "US"
│       │   ├── phonetic-text: "/həˈloʊ/"
│       │   └── audio-play-button: 🔊
│       │
│       └── phonetic-item (UK)
│           ├── phonetic-type: "UK"
│           ├── phonetic-text: "/həˈləʊ/"
│           └── audio-play-button: 🔊
│
├── definition-section (词义部分)
│   ├── section-title: "Definitions"
│   └── definition-list
│       ├── definition-item
│       │   ├── part-of-speech: "int."
│       │   ├── definition-text: "喂，你好"
│       │   └── synonyms: "hi, hey"
│       │
│       └── definition-item
│           ├── part-of-speech: "n."
│           └── definition-text: "招呼"
│
├── example-section (例句部分)
│   ├── section-title: "Examples"
│   └── example-list
│       ├── example-item
│       │   ├── example-source: "Hello!"
│       │   └── example-translation: "你好！"
│       │
│       └── example-item
│           ├── example-source: "Hello, how are you?"
│           └── example-translation: "你好，你好吗？"
│
└── translation-footer (页脚)
    ├── provider-info: "Powered by Google Translate"
    └── time-info: "12:34:56"
```

## 🎵 音频播放流程

```
用户点击🔊按钮
    │
    ▼
┌─────────────────┐
│ playAudio()     │
└────────┬────────┘
         │
         ├──→ 检查 phonetic.audioData
         │    └─ 有 ─→ playAudioFromData()
         │              ├─ 创建 AudioContext
         │              ├─ 解码音频数据
         │              └─ 播放
         │
         ├──→ 检查 phonetic.audioUrl
         │    └─ 有 ─→ playAudioFromUrl()
         │              ├─ 检查缓存
         │              ├─ 创建 Audio 对象
         │              └─ 播放
         │
         └──→ 使用浏览器TTS
              └─ playTextToSpeech()
                 ├─ 创建 SpeechSynthesisUtterance
                 ├─ 设置语言和声音
                 └─ window.speechSynthesis.speak()
```

## 🔌 集成示意图

### Before (原始实现)

```javascript
// content.js
function translateText(text) {
  // 硬编码的翻译逻辑
  const tooltip = document.createElement('div');
  tooltip.textContent = `Translation: [${text}]`;
  document.body.appendChild(tooltip);
}
```

### After (使用翻译服务)

```javascript
// content.js
async function translateText(text) {
  try {
    // 使用统一的翻译服务
    const result = await translationService.translate(
      text,
      settings.targetLanguage,
      'auto'
    );
    
    // 使用UI组件渲染
    const ui = new TranslationUI({
      enableAudio: true,
      showDefinitions: true,
      showExamples: true
    });
    
    const element = ui.render(result);
    document.body.appendChild(element);
    
  } catch (error) {
    console.error('Translation failed:', error);
  }
}
```

## 📊 性能优化策略

```
请求翻译
    │
    ▼
┌─────────────┐
│ 检查缓存     │ ◄─── LRU缓存策略
└────┬────────┘      (最多100项)
     │
     ├─ 命中 ───┐
     │          │
     └─ 未命中  │
        │       │
        ▼       │
   ┌─────────┐ │
   │ API调用 │ │
   └────┬────┘ │
        │      │
        ▼      │
   ┌─────────┐│
   │添加缓存 ││
   └────┬────┘│
        │     │
        └─────┴────→ 返回结果
```

### 缓存键格式
```
cacheKey = `${text}:${sourceLang}:${targetLang}:${provider}`

示例:
"hello:en:zh-CN:google"
"apple:auto:zh-CN:youdao"
```

## 🎯 扩展点

### 1. 添加新提供商

```javascript
class NewProvider extends TranslationProvider {
  async translate(text, targetLang, sourceLang) {
    // 实现翻译逻辑
    return TranslationResult;
  }
  
  async detectLanguage(text) {
    // 实现语言检测
    return languageCode;
  }
  
  async getSupportedLanguages() {
    // 返回支持的语言
    return languages[];
  }
}

// 注册
translationService.registerProvider('new', new NewProvider());
```

### 2. 自定义UI渲染

```javascript
class CustomUI extends TranslationUI {
  render(result) {
    // 自定义渲染逻辑
    const container = super.render(result);
    // 添加自定义元素
    return container;
  }
}
```

### 3. 自定义音频源

```javascript
class CustomUI extends TranslationUI {
  getAudioUrlFromService(text, type) {
    return `https://my-tts.com/audio?text=${text}&type=${type}`;
  }
}
```

## 📱 响应式设计

```
Desktop (> 768px)
┌───────────────────────────┐
│  Translation Result       │
│  ┌─────────────────────┐  │
│  │ Original: hello     │  │
│  ├─────────────────────┤  │
│  │ Translation: 你好   │  │
│  ├─────────────────────┤  │
│  │ 🔊 US /həˈloʊ/     │  │
│  │ 🔊 UK /həˈləʊ/     │  │
│  ├─────────────────────┤  │
│  │ Definitions...      │  │
│  ├─────────────────────┤  │
│  │ Examples...         │  │
│  └─────────────────────┘  │
└───────────────────────────┘

Mobile (< 768px)
┌─────────────┐
│ Translation │
│ ┌─────────┐ │
│ │ hello   │ │
│ ├─────────┤ │
│ │ 你好    │ │
│ ├─────────┤ │
│ │🔊 US    │ │
│ │🔊 UK    │ │
│ ├─────────┤ │
│ │ Defs... │ │
│ └─────────┘ │
└─────────────┘
```

## 🌙 深色模式

```css
/* 自动检测系统主题 */
@media (prefers-color-scheme: dark) {
  .translation-result-container {
    background: #2d2d2d;
    color: #e0e0e0;
  }
  
  .phonetic-section {
    background: #3a3a3a;
  }
  
  /* 其他深色样式... */
}
```

## 🎉 完整调用示例

```javascript
// 1. 初始化（自动完成）
// translationService 已经创建并注册了提供商

// 2. 配置
translationService.setActiveProvider('google');

// 3. 翻译
const result = await translationService.translate('hello', 'zh-CN');

// 4. 渲染UI
const ui = new TranslationUI();
const element = ui.render(result);

// 5. 显示
document.body.appendChild(element);

// 6. 用户点击🔊按钮 → 自动播放音频

// 7. 清理（可选）
ui.cleanup(); // 停止音频，清理资源
```

---

**总结**：整个架构采用分层设计，从上到下依次是UI层、服务层、提供商层和渲染层，每层职责清晰，便于维护和扩展。特别是读音功能设计了三种播放方式，可以适应不同的使用场景！
