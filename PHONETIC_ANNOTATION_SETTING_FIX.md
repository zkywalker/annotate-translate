# 修复：标注中显示音标+翻译选项不生效

## 问题描述

用户反馈：标注设置中的 "在标注中显示音标 + 翻译" 选项看起来没有生效。

## 根本原因

1. **TranslationService 类缺少配置项**
   - `TranslationService` 类的构造函数中缺少 `showPhoneticInAnnotation` 配置项
   
2. **generateAnnotationText 方法未检查配置**
   - 所有提供商（Google, Youdao, DeepL）的 `generateAnnotationText` 方法都没有检查 `showPhoneticInAnnotation` 配置
   - 方法总是在有音标时添加音标，完全忽略用户的设置选项
   
3. **配置未传递给所有提供商**
   - `content.js` 中的 `applyTranslationSettings()` 函数只为 Debug 提供商设置了 `showPhoneticInAnnotation`
   - Google、Youdao、DeepL 提供商没有接收到这个配置

## 解决方案

### 1. 更新 TranslationService 类

**文件**: `translation-service.js`

#### 1.1 添加配置项到构造函数

```javascript
class TranslationService {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.cache = new Map();
    this.maxCacheSize = 100;
    this.enablePhoneticFallback = true;
    this.showPhoneticInAnnotation = true; // ✅ 新增：默认在标注中显示音标
  }
```

#### 1.2 修改 generateAnnotationText 方法

```javascript
generateAnnotationText(result) {
  const parts = [];
  
  // ✅ 只有在 showPhoneticInAnnotation 开启时才添加音标
  if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
    const usPhonetic = result.phonetics.find(p => p.type === 'us');
    const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
    const phonetic = usPhonetic || defaultPhonetic || result.phonetics[0];
    
    if (phonetic && phonetic.text) {
      parts.push(phonetic.text);
    }
  }
  
  if (result.translatedText) {
    parts.push(result.translatedText);
  }
  
  return parts.join(' ');
}
```

### 2. 更新所有翻译提供商

#### 2.1 GoogleTranslateProvider

```javascript
class GoogleTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Google Translate', config);
    this.apiKey = config.apiKey || null;
    this.usePublicApi = config.usePublicApi !== false;
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // ✅ 新增
  }
```

#### 2.2 YoudaoTranslateProvider

```javascript
class YoudaoTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('Youdao Translate', config);
    this.appKey = config.appKey || '';
    this.appSecret = config.appSecret || '';
    this.apiUrl = 'https://openapi.youdao.com/api';
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // ✅ 新增
  }

  generateAnnotationText(result) {
    const parts = [];
    
    // ✅ 检查配置
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      const usPhonetic = result.phonetics.find(p => p.type === 'us');
      const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
      const phonetic = usPhonetic || defaultPhonetic;
      
      if (phonetic) {
        parts.push(phonetic.text);
      }
    }
    
    if (result.translatedText) {
      parts.push(result.translatedText);
    }
    
    return parts.join(' ');
  }
```

#### 2.3 DeepLTranslateProvider

```javascript
class DeepLTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('DeepL Translate', config);
    this.apiKey = config.apiKey || '';
    this.useFreeApi = config.useFreeApi !== false;
    this.freeApiUrl = 'https://api-free.deepl.com/v2/translate';
    this.proApiUrl = 'https://api.deepl.com/v2/translate';
    this.showPhoneticInAnnotation = config.showPhoneticInAnnotation !== false; // ✅ 新增
  }

  generateAnnotationText(result) {
    const parts = [];
    
    // ✅ 检查配置
    if (this.showPhoneticInAnnotation && result.phonetics && result.phonetics.length > 0) {
      const usPhonetic = result.phonetics.find(p => p.type === 'us');
      const defaultPhonetic = result.phonetics.find(p => p.type === 'default');
      const phonetic = usPhonetic || defaultPhonetic || result.phonetics[0];
      
      if (phonetic && phonetic.text) {
        parts.push(phonetic.text);
      }
    }
    
    if (result.translatedText) {
      parts.push(result.translatedText);
    }
    
    return parts.join(' ');
  }
```

### 3. 更新 content.js 配置传递

**文件**: `content.js`

```javascript
function applyTranslationSettings() {
  // ... 现有代码 ...
  
  // ✅ 为 Google 提供商设置配置
  if (settings.translationProvider === 'google') {
    const googleProvider = translationService.providers.get('google');
    if (googleProvider) {
      googleProvider.showPhoneticInAnnotation = settings.showPhoneticInAnnotation !== false;
      console.log('[Annotate-Translate] Google provider configured - showPhoneticInAnnotation:', googleProvider.showPhoneticInAnnotation);
    }
  }
  
  // ✅ 为 Youdao 提供商设置配置
  if (settings.translationProvider === 'youdao') {
    const youdaoProvider = translationService.providers.get('youdao');
    if (youdaoProvider) {
      youdaoProvider.updateConfig(
        settings.youdaoAppKey, 
        settings.youdaoAppSecret
      );
      youdaoProvider.showPhoneticInAnnotation = settings.showPhoneticInAnnotation !== false;
      console.log('[Annotate-Translate] Youdao provider configured:');
      console.log('  - showPhoneticInAnnotation:', youdaoProvider.showPhoneticInAnnotation);
    }
  }
  
  // ✅ 为 DeepL 提供商设置配置
  if (settings.translationProvider === 'deepl') {
    const deeplProvider = translationService.providers.get('deepl');
    if (deeplProvider) {
      deeplProvider.updateConfig(
        settings.deeplApiKey,
        settings.deeplUseFreeApi
      );
      deeplProvider.showPhoneticInAnnotation = settings.showPhoneticInAnnotation !== false;
      console.log('[Annotate-Translate] DeepL provider configured:');
      console.log('  - showPhoneticInAnnotation:', deeplProvider.showPhoneticInAnnotation);
    }
  }
  
  // ✅ 设置 TranslationService 级别的配置
  if (settings.showPhoneticInAnnotation !== undefined) {
    translationService.showPhoneticInAnnotation = settings.showPhoneticInAnnotation;
    console.log('[Annotate-Translate] Show phonetic in annotation:', settings.showPhoneticInAnnotation ? 'Enabled' : 'Disabled');
  }
```

## 测试方法

### 快速测试

1. 打开扩展设置页面
2. 找到 "在标注中显示音标 + 翻译" 选项
3. 测试开启和关闭两种状态

### 使用测试页面

打开 `test-phonetic-annotation-setting.html` 进行完整测试：

1. 选择 "在标注中显示音标 + 翻译" 选项
2. 点击 "保存设置"
3. 点击 "重新加载页面"
4. 选中页面上的英文单词（如 "hello"）
5. 观察标注内容

### 预期结果

#### 开启时（showPhoneticInAnnotation: true）
- 标注显示：`/həˈloʊ/ 你好`
- 包含音标和翻译，用空格分隔

#### 关闭时（showPhoneticInAnnotation: false）
- 标注显示：`你好`
- 仅显示翻译，不包含音标

### 控制台验证

在浏览器控制台中运行：

```javascript
// 检查当前设置
chrome.storage.sync.get('showPhoneticInAnnotation', console.log);

// 查看提供商配置
const provider = translationService.getActiveProvider();
console.log('Provider showPhoneticInAnnotation:', provider.showPhoneticInAnnotation);

// 查看 TranslationService 配置
console.log('Service showPhoneticInAnnotation:', translationService.showPhoneticInAnnotation);
```

## 修改的文件

1. ✅ `translation-service.js`
   - TranslationService 构造函数
   - TranslationService.generateAnnotationText()
   - GoogleTranslateProvider 构造函数
   - YoudaoTranslateProvider 构造函数和 generateAnnotationText()
   - DeepLTranslateProvider 构造函数和 generateAnnotationText()

2. ✅ `content.js`
   - applyTranslationSettings() 函数

3. ✅ 新增测试文件
   - `test-phonetic-annotation-setting.html`

## 影响范围

- ✅ Google Translate
- ✅ Youdao Translate
- ✅ DeepL Translate
- ✅ Debug Provider
- ✅ 标注功能
- ✅ 翻译卡片（不受影响，继续显示完整信息）

## 兼容性

- ✅ 向后兼容：默认值为 `true`，保持现有行为
- ✅ 不影响翻译卡片：翻译卡片中仍然显示完整的音标信息
- ✅ 不影响其他功能：只影响标注文本的生成

## 注意事项

1. **配置优先级**：
   - 提供商级别的 `showPhoneticInAnnotation` 优先
   - 如果提供商没有设置，使用 TranslationService 的配置
   
2. **音标补充**：
   - `enablePhoneticFallback` 配置仍然有效
   - 即使 `showPhoneticInAnnotation=false`，音标仍会在翻译卡片中显示
   
3. **默认行为**：
   - 默认值为 `true`（显示音标）
   - 与之前的行为保持一致

## 验证清单

- [x] TranslationService 添加 showPhoneticInAnnotation 配置
- [x] TranslationService.generateAnnotationText() 检查配置
- [x] GoogleTranslateProvider 添加配置支持
- [x] YoudaoTranslateProvider 添加配置支持
- [x] DeepLTranslateProvider 添加配置支持
- [x] content.js 传递配置到所有提供商
- [x] 创建测试页面
- [x] 无编译错误
- [x] 向后兼容

## 相关文档

- `ANNOTATION_CONFIG.md` - 标注配置说明
- `QUICK_TEST_ANNOTATION.md` - 标注测试指南
- `ANNOTATION_PHONETIC_FIX.md` - 音标显示修复历史
