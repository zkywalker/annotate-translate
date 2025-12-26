# API 参考

本节提供 Annotate Translate 所有核心类、接口和函数的详细 API 文档。

## 核心服务

### TranslationService

翻译服务的核心类，管理所有翻译提供商和缓存。

```javascript
const translationService = new TranslationService();
```

[查看完整文档 →](/api/translation-service)

### VocabularyService

词库服务，负责词汇查询和批量标注。

```javascript
const vocabularyService = new VocabularyService();
```

[查看完整文档 →](/api/vocabulary-service)

### AnnotationScanner

页面扫描器，用于词汇模式的批量标注。

```javascript
const scanner = new AnnotationScanner(vocabularyService, translationService);
```

[查看完整文档 →](/api/annotation-scanner)

### CacheManager

LRU 缓存管理器。

```javascript
const cache = new CacheManager({ maxSize: 100, ttl: 1800000 });
```

[查看完整文档 →](/api/cache-manager)

## 提供商接口

### TranslationProvider (抽象基类)

所有翻译提供商必须实现的接口。

[查看文档 →](/api/providers/base-provider)

### 具体提供商

- [Google Translate](/api/providers/google) - Google 翻译提供商
- [Youdao](/api/providers/youdao) - 有道翻译提供商
- [DeepL](/api/providers/deepl) - DeepL 翻译提供商
- [OpenAI](/api/providers/openai) - OpenAI AI 翻译提供商
- [FreeDictionary](/api/providers/freedictionary) - 音标补充提供商

## 工具函数

常用的工具函数和辅助类。

[查看文档 →](/api/utils)

## 数据类型

### TranslationResult

翻译结果的数据结构：

```typescript
interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  phonetics: PhoneticInfo[];
  definitions: Definition[];
  examples: Example[];
  annotationText: string;
  provider: string;
  metadata?: {
    tokensUsed?: number;
    cost?: number;
  };
  timestamp: number;
}
```

### PhoneticInfo

音标信息：

```typescript
interface PhoneticInfo {
  text: string;           // 例如: "/həˈloʊ/"
  type: 'us' | 'uk' | 'ipa' | 'pinyin' | 'default';
  audioUrl?: string;
  audioData?: ArrayBuffer;
}
```

### Definition

词义定义：

```typescript
interface Definition {
  partOfSpeech: string;   // 词性: "n.", "v.", "adj." 等
  text: string;           // 释义文本
  synonyms?: string[];    // 同义词（可选）
}
```

### Example

例句：

```typescript
interface Example {
  source: string;         // 原文（可能包含 HTML）
  translation: string;    // 译文
}
```

## 设置类型

### Settings Schema

完整的设置结构定义在 `src/utils/settings-schema.js`。

主要分类：

```javascript
{
  general: {
    enableTranslate: boolean,
    enableAnnotate: boolean,
    targetLanguage: string,
    enablePhoneticFallback: boolean
  },
  providers: {
    current: string,
    google: {...},
    youdao: {...},
    deepl: {...},
    openai: {...}
  },
  annotation: {...},
  translationCard: {...},
  vocabulary: {...},
  performance: {...},
  debug: {...}
}
```

## 消息协议

### Background 消息

Content Script 与 Background Service Worker 之间的消息格式：

```javascript
// Youdao 翻译请求
chrome.runtime.sendMessage({
  action: 'youdaoTranslate',
  params: {
    url: string,
    method: string,
    headers: object,
    body: string
  }
}, (response) => {
  // response.success, response.data, response.error
});

// DeepL 翻译请求
chrome.runtime.sendMessage({
  action: 'deeplTranslate',
  params: {...}
});

// OpenAI 翻译请求
chrome.runtime.sendMessage({
  action: 'openaiTranslate',
  params: {...}
});
```

## 事件

### TranslationService 事件

```javascript
// 提供商切换事件
translationService.on('providerChanged', (newProvider) => {
  console.log('切换到:', newProvider);
});

// 缓存清理事件
translationService.on('cacheCleared', () => {
  console.log('缓存已清理');
});
```

## 错误处理

### 错误类型

```javascript
class TranslationError extends Error {
  constructor(message, code, provider) {
    super(message);
    this.name = 'TranslationError';
    this.code = code;
    this.provider = provider;
  }
}

// 常见错误代码
const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_KEY_INVALID: 'API_KEY_INVALID',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PROVIDER_NOT_FOUND: 'PROVIDER_NOT_FOUND',
  INVALID_PARAMETERS: 'INVALID_PARAMETERS'
};
```

## 常量

### 语言代码

```javascript
const Languages = {
  AUTO: 'auto',
  ZH_CN: 'zh-CN',
  EN: 'en',
  JA: 'ja',
  KO: 'ko',
  FR: 'fr',
  DE: 'de',
  ES: 'es',
  IT: 'it',
  RU: 'ru'
};
```

### 提供商名称

```javascript
const Providers = {
  GOOGLE: 'google',
  YOUDAO: 'youdao',
  DEEPL: 'deepl',
  OPENAI: 'openai',
  FREEDICT: 'freedict'
};
```

## 使用示例

### 基本翻译

```javascript
const result = await translationService.translate(
  'hello',
  'zh-CN',
  'auto'
);

console.log(result.translatedText); // "你好"
console.log(result.phonetics[0].text); // "/həˈloʊ/"
```

### 切换提供商

```javascript
translationService.setActiveProvider('openai');
const result = await translationService.translate('hello', 'zh-CN');
```

### 词库查询

```javascript
await vocabularyService.setActiveProvider('cet', {
  targetTags: ['cet4', 'cet6']
});

const shouldAnnotate = vocabularyService.shouldAnnotate('abandon');
console.log(shouldAnnotate); // true（如果在词库中）
```

### 缓存管理

```javascript
const cache = new CacheManager({ maxSize: 100 });

cache.set('key', 'value');
const value = cache.get('key'); // 'value'

cache.clear(); // 清空缓存
```

## 下一步

- 查看具体的 [TranslationService API](/api/translation-service)
- 了解如何 [添加新提供商](/recipes/add-new-provider)
- 阅读 [开发文档](/development/) 了解架构设计
