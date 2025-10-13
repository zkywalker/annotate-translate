# 标注配置说明文档

## 📋 概述

本文档说明如何配置标注功能，特别是**读音+翻译**的显示选项。

---

## 🎯 新增配置项

### `showPhoneticInAnnotation`

**类型**: `boolean`  
**默认值**: `true`  
**位置**: Settings → Annotation Settings

#### 功能说明

控制自动翻译标注时是否在标注文本中包含读音信息。

| 设置值 | 标注效果 | 示例 |
|--------|---------|------|
| `true` ✅ | 显示 **读音 + 翻译** | `/həˈloʊ/ 你好` |
| `false` ❌ | 仅显示 **翻译** | `你好` |

---

## 🔧 配置方式

### 方法1: 通过设置页面（推荐）

1. **打开设置页面**
   - 右键点击扩展图标
   - 选择 "Options" / "设置"

2. **找到 "Annotation Settings" 部分**
   - 标记为 🆕 New
   
3. **勾选/取消勾选选项**
   ```
   ☑️ Show Phonetic + Translation in Annotation
   ```

4. **点击 "Save Settings" 保存**

### 方法2: 通过代码配置

```javascript
// 在 content.js 或 background.js 中
chrome.storage.sync.set({
  showPhoneticInAnnotation: true  // true=显示读音, false=仅翻译
});
```

---

## 💡 使用场景

### 场景1: 学习发音（推荐开启）

**适用情况**:
- 英语学习者
- 需要知道单词发音
- 制作学习笔记

**配置**: `showPhoneticInAnnotation: true`

**效果示例**:
```html
<ruby>hello<rt>/həˈloʊ/ 你好</rt></ruby>
<ruby>apple<rt>/ˈæpl/ 苹果</rt></ruby>
<ruby>world<rt>/wɜːrld/ 世界</rt></ruby>
```

**渲染效果**:
```
hello        apple        world
[/həˈloʊ/ 你好]  [/ˈæpl/ 苹果]  [/wɜːrld/ 世界]
```

---

### 场景2: 简洁阅读（推荐关闭）

**适用情况**:
- 已经熟悉发音
- 只需要翻译意思
- 屏幕空间有限

**配置**: `showPhoneticInAnnotation: false`

**效果示例**:
```html
<ruby>hello<rt>你好</rt></ruby>
<ruby>apple<rt>苹果</rt></ruby>
<ruby>world<rt>世界</rt></ruby>
```

**渲染效果**:
```
hello   apple   world
[你好]   [苹果]   [世界]
```

---

## 🧪 技术实现

### 数据流

```
用户选中文本 "hello"
    ↓
点击 "A" 按钮
    ↓
选择 "🤖 Auto Translate & Annotate"
    ↓
调用 translationService.translate()
    ↓
DebugTranslateProvider.translate()
    ↓
生成 TranslationResult:
    - translatedText: "你好"
    - phonetics: [{text: "/həˈloʊ/", type: "us"}]
    - annotationText: (根据配置生成)
    ↓
if (showPhoneticInAnnotation === true):
    result.annotationText = "/həˈloʊ/ 你好"
else:
    result.annotationText = "你好"
    ↓
createRubyAnnotation(range, "hello", result.annotationText)
    ↓
生成 HTML:
<ruby>hello<rt>/həˈloʊ/ 你好</rt></ruby>
```

### 关键代码

#### 1. DebugTranslateProvider 配置读取

```javascript
// translation-service.js
class DebugTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Debug Provider', config);
    this.delay = config.delay || 500;
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // ✨ 新增
  }
  
  generateTestResult(text, sourceLang, targetLang) {
    // ... 生成翻译结果
    
    // ✨ 根据配置生成 annotationText
    if (this.showPhoneticInAnnotation && result.phonetics.length > 0) {
      const phoneticText = result.phonetics[0].text;
      result.annotationText = `${phoneticText} ${result.translatedText}`;
    } else {
      result.annotationText = result.translatedText;
    }
    
    return result;
  }
}
```

#### 2. content.js 应用配置

```javascript
// content.js
function applyTranslationSettings() {
  if (settings.translationProvider === 'debug') {
    const debugProvider = translationService.providers.get('debug');
    if (debugProvider) {
      // ✨ 动态更新配置
      debugProvider.showPhoneticInAnnotation = settings.showPhoneticInAnnotation !== false;
    }
  }
}
```

#### 3. 标注时使用 annotationText

```javascript
// content.js - promptAndAnnotate()
const result = await translationService.translate(text, targetLang, 'auto');

// ✨ 优先使用 annotationText，回退到 translatedText
const annotationText = result.annotationText || result.translatedText;

createRubyAnnotation(range, text, annotationText);
```

---

## 📊 配置对比表

| 功能 | `showPhoneticInAnnotation: true` | `showPhoneticInAnnotation: false` |
|------|--------------------------------|----------------------------------|
| **标注长度** | 较长 | 较短 |
| **信息量** | 多（读音+翻译） | 少（仅翻译） |
| **适合场景** | 学习、记忆 | 阅读、理解 |
| **空间占用** | 大 | 小 |
| **视觉噪音** | 中等 | 低 |
| **学习价值** | 高 | 中 |

---

## 🔍 调试

### 查看当前配置

```javascript
// 在浏览器 Console 中运行
chrome.storage.sync.get('showPhoneticInAnnotation', (result) => {
  console.log('当前配置:', result.showPhoneticInAnnotation);
});

// 查看 Debug Provider 配置
console.log('Debug Provider config:', 
  translationService.providers.get('debug').showPhoneticInAnnotation
);
```

### 测试标注效果

```javascript
// 1. 修改配置
chrome.storage.sync.set({ showPhoneticInAnnotation: true });

// 2. 重新加载页面

// 3. 选中 "hello" 并点击 "A" → "🤖 Auto Translate & Annotate"

// 4. 查看生成的 HTML
const ruby = document.querySelector('ruby');
console.log('标注HTML:', ruby.outerHTML);
console.log('标注文本:', ruby.querySelector('rt').textContent);
```

---

## 🎨 样式自定义

### CSS 控制标注显示

```css
/* 默认样式（已包含在 content.css 中） */
ruby {
  ruby-position: over; /* 标注显示在文本上方 */
}

rt {
  font-size: 0.6em;
  color: #666;
}

/* 自定义样式示例 */
ruby rt {
  /* 读音部分使用等宽字体 */
  font-family: 'Courier New', monospace;
  
  /* 增加间距 */
  padding: 2px 4px;
  
  /* 背景色 */
  background: rgba(102, 126, 234, 0.1);
  border-radius: 2px;
}
```

---

## 📝 更新日志

### v1.0.0 (2024-10-11)

**新增功能**:
- ✨ 添加 `showPhoneticInAnnotation` 配置项
- ✨ Settings 页面添加 "Annotation Settings" 部分
- ✨ TranslationResult 新增 `annotationText` 字段
- ✨ DebugTranslateProvider 支持动态配置

**修复问题**:
- 🐛 修复默认数据过于冗长（移除 `[DEBUG]` 前缀）
- 🐛 修复 Google Translate URL 参数重复声明

**改进**:
- 📈 标注文本现在根据配置动态生成
- 📈 默认占位翻译简化为 `{text}_translated`
- 📈 配置更改实时生效（无需重启扩展）

---

## 🤝 相关文档

- [ANNOTATION_UPGRADE.md](./ANNOTATION_UPGRADE.md) - 标注功能升级说明
- [INTEGRATION_COMPLETE.md](./INTEGRATION_COMPLETE.md) - 集成测试指南
- [TRANSLATION_SERVICE.md](./TRANSLATION_SERVICE.md) - 翻译服务架构
- [OPTIONS_GUIDE.md](./OPTIONS_GUIDE.md) - 设置页面使用指南

---

## 💬 常见问题

### Q1: 修改配置后不生效？

**A**: 需要重新加载页面才能应用新配置:
```javascript
// 保存配置后
location.reload();
```

### Q2: 如何为其他提供商添加此功能？

**A**: 在对应的 Provider 类中实现相同逻辑:

```javascript
class GoogleTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Google Translate', config);
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false;
  }
  
  async translate(text, targetLang, sourceLang) {
    // ... 获取翻译结果
    
    // 生成 annotationText
    if (this.showPhoneticInAnnotation && result.phonetics.length > 0) {
      result.annotationText = `${result.phonetics[0].text} ${result.translatedText}`;
    } else {
      result.annotationText = result.translatedText;
    }
    
    return result;
  }
}
```

### Q3: 手动输入的标注受影响吗？

**A**: 不受影响。此配置**仅影响自动翻译**生成的标注。手动输入时你可以输入任何内容。

---

## 📌 总结

`showPhoneticInAnnotation` 配置项提供了灵活的标注显示方式，用户可以根据自己的需求选择：

- **学习模式** (开启): 读音+翻译，适合记忆
- **阅读模式** (关闭): 仅翻译，简洁清爽

通过 Settings 页面可以轻松切换，满足不同使用场景！🎉
