---
module: translation-service
last-updated: 2026-07-28
related-modules:
  - docs/modules/content.md
  - docs/modules/ai-translation.md
---

<!-- DD-DOC
Living documentation for the translation-service module.
- Agent: read this doc before modifying any code in this module. Understand current architecture before making changes.
- Engineer: this doc reflects the current system state. If code differs from this doc, one of them needs updating.
-->

# Translation Service

::: tip TL;DR
Core abstraction layer that manages multiple translation providers (Google, Youdao, DeepL, OpenAI, FreeDictionary) behind a unified interface. Implements context-safe LRU caching, structured provider batching with bounded-concurrency fallback, automatic phonetic fallback via FreeDictionary for single English words, and configurable annotation text generation. Exposed as a global singleton `translationService` with Google Translate as the default active provider.
:::

## 代码映射

| 职责 | 文件路径 |
|------|----------|
| Provider 基类 + 所有内置 Provider + 服务管理器 | `src/services/translation-service.js` |
| OpenAI 底层 Provider 实现 | `src/providers/openai-provider.js` |
| AI 翻译服务（高级封装） | `src/services/ai-translation-service.js` |
| 背景脚本 CORS 代理 | `src/background/background.js` |
| 翻译卡片 UI 渲染 | `src/content/translation-ui.js` |
| 设置 Schema 定义 | `src/utils/settings-schema.js` |

## 架构概览

```mermaid
classDiagram
    class TranslationProvider {
        <<abstract>>
        +name: string
        +config: Object
        +translate(text, targetLang, sourceLang)*
        +detectLanguage(text)*
        +getSupportedLanguages()*
    }

    class GoogleTranslateProvider {
        +usePublicApi: boolean
        -parseGoogleResponse(data, text, src, tgt)
    }
    class YoudaoTranslateProvider {
        +appKey: string
        +appSecret: string
        -generateSign(query, salt, curtime)
        -sendRequestViaBackground(url, params)
        -parseYoudaoResponse(data, text, src, tgt)
    }
    class DeepLTranslateProvider {
        +apiKey: string
        +useFreeApi: boolean
        -sendRequestViaBackground(url, params)
        -parseDeepLResponse(data, text, src, tgt)
    }
    class OpenAITranslateProvider {
        +openaiProvider: OpenAIProvider
        +apiKey, model, baseURL: string
        -initializeProvider()
        -buildAnnotationText(result)
    }
    class FreeDictionaryProvider {
        +fetchPhonetics(word): Promise
        -parseFreeDictionaryResponse(data, word)
    }
    class DebugTranslateProvider {
        +delay: number
        -generateTestResult(text, src, tgt)
    }

    class TranslationService {
        +providers: Map
        +activeProvider: string
        +cache: Map
        +maxCacheSize: number
        +translate(text, targetLang, sourceLang, options)
        +translateBatch(texts, targetLang, sourceLang, options)
        +registerProvider(name, provider)
        +setActiveProvider(name)
        -supplementPhoneticsFromFreeDictionary(result, text)
        +generateAnnotationText(result)
        -addToCache(key, value)
    }

    TranslationProvider <|-- GoogleTranslateProvider
    TranslationProvider <|-- YoudaoTranslateProvider
    TranslationProvider <|-- DeepLTranslateProvider
    TranslationProvider <|-- OpenAITranslateProvider
    TranslationProvider <|-- FreeDictionaryProvider
    TranslationProvider <|-- DebugTranslateProvider
    TranslationService o-- TranslationProvider : manages many
```

## 核心接口

### TranslationProvider (abstract base)

```js
constructor(name: string, config?: Object)
async translate(text: string, targetLang: string, sourceLang?: string): Promise<TranslationResult>
supportsBatchTranslation(): boolean
getBatchSize(options?: Object): number
getCacheIdentity(): string
getCacheContext(options?: Object): string
async detectLanguage(text: string): Promise<string>
async getSupportedLanguages(): Promise<Array<{code, name}>>
```

Throws `TypeError` if instantiated directly.

### TranslationService (manager/singleton)

```js
registerProvider(name: string, provider: TranslationProvider): void
setActiveProvider(name: string): void
getActiveProvider(): TranslationProvider
async translate(text: string, targetLang: string, sourceLang?: string, options?: Object): Promise<TranslationResult>
async translateBatch(texts: string[], targetLang: string, sourceLang?: string, options?: Object): Promise<BatchOutcome[]>
generateAnnotationText(result: TranslationResult): string
enableCache(size?: number): void   // clamps to 10-1000
disableCache(): void
clearCache(): void
```

### TranslationResult (typedef)

```js
{ originalText, translatedText, sourceLang, targetLang,
  phonetics: PhoneticInfo[], definitions: Definition[], examples: Example[],
  annotationText?: string, provider: string, timestamp: number }
```

## 业务逻辑

### 批量调度

- `translateBatch()` 先逐词查询缓存，并合并同一批中的重复 key。
- 支持结构化批量的 provider 按其 `getBatchSize()` 分块，默认最多并发 2 个批次。
- OpenAI 默认 JSON 模式每批最多 8 词，并根据 `maxTokens` 自动降低批大小。
- 自定义 OpenAI prompt 启用时退回单条请求，避免绕过用户模板语义。
- 不支持批量的 provider 使用最多 4 个单条请求并发。
- 批量响应格式错误或结果不完整时，该批次以最多 2 个并发回退到单条翻译。
- 返回值与输入顺序一致，每项为 `{ text, result?, error?, cached }`，允许部分成功。

### 缓存策略

- **类型**: LRU；命中时将条目提升到 `Map` 尾部
- **Key 内容**: active provider、非敏感 provider 配置标识、源/目标语言、文本、有效上下文和输出字段选项
- **默认容量**: 100 条，可通过 `enableCache(size)` 调整（10-1000）
- **上下文规则**: 普通 provider 忽略 context；启用 `useContext` 的 OpenAI provider 将 context 纳入 key
- **绕过缓存**: `options.noCache = true` 同时跳过读取和写入
- **切换 Provider**: Provider 名称编入 cache key，因此切换 Provider 后旧缓存自然不命中

### 音标补充链

1. 活动 Provider 返回 `result.phonetics`
2. 若 `phonetics` 为空 **且** `enablePhoneticFallback === true`:
   - 检查原文是否为单个英文单词（`/^[a-zA-Z]+$/`）
   - 调用 `FreeDictionaryProvider.fetchPhonetics(word)` 补充
3. 补充后重新生成 `annotationText`

### 标注文本生成

`generateAnnotationText(result)` 按配置拼接三部分（空格分隔）:
1. 音标（`showPhoneticInAnnotation`）-- 优先 US > default > first
2. 翻译（`showTranslationInAnnotation`）
3. 释义（`showDefinitionsInAnnotation`）-- 最多 2 条

兜底: 若所有部分为空，返回 `translatedText`。

### CORS 代理

Youdao 和 DeepL 的请求通过 `chrome.runtime.sendMessage` 发往 background script，由 background 代理 fetch 绕过内容脚本的 CORS 限制。Google 和 FreeDictionary 直接从内容脚本 fetch。

## 设计决策

| 决策 | 理由 |
|------|------|
| 音标补充由 `TranslationService` 统一处理，而非各 Provider 内部 | 避免重复逻辑；各 Provider 注释明确标注 "移除提供者级别的音标补充" |
| `FreeDictionaryProvider` 不实现 `translate()` | 仅用于音标查询，调用 `translate()` 直接抛异常 |
| `OpenAITranslateProvider` 使用适配器模式包装 `OpenAIProvider` | 解耦 AI SDK 与 TranslationProvider 接口，支持延迟初始化 |
| 批量能力由 Provider 声明，调度和回退由 Service 负责 | 保持 provider API 差异，同时统一并发、缓存和错误语义 |
| 缓存保留在 `TranslationService` | 所有 provider 共享 LRU、语言、上下文和输出变体规则，避免各自实现后出现语义不一致 |
| DeepL 根据 key 后缀 `:fx` 自动检测免费/付费 API | 减少用户配置错误 |
| Cache key 包含 provider 配置和有效上下文 | 不同模型或上下文对同一文本可能返回不同结果；无上下文词条仍可稳定复用 |
| 全局 singleton `translationService` | 整个扩展共享一个实例，简化状态管理 |

## 已知限制

- FreeDictionary 补充仅支持纯英文单词（不支持短语或含连字符单词）
- Youdao 翻译 API 可能不返回音标（只有词典 API 才有），需依赖 FreeDictionary 补充
- DeepL 不提供音标、词义、例句，完全依赖后处理补充
- `DebugTranslateProvider` 仅包含 `hello`/`apple`/`world` 三个预置词条
- OpenAI Provider 依赖外部 `OpenAIProvider` 类，若未加载则注册失败（静默降级）

## 变更历史

| 提交 | 说明 |
|------|------|
| 2026-07-28 | add structured vocabulary batching, bounded fallback, and context-safe LRU caching |
| `7fa0016` | feat: add token usage statistics for AI providers |
| `9e03beb` | feat: add AI provider management, support multiple OpenAI-compatible services |
| `d55ac90` | feat: add annotation settings (show translation/definitions toggles) |
| `c1ad5fb` | feat: add options parameter to translate(), enhance provider call flexibility |
| `96a67f3` | feat: add extra options support to OpenAI provider for context passing |
| `d3d0c1f` | refactor: reorganize project structure |
