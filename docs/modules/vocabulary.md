---
module: vocabulary
last-updated: 2026-02-19
related-modules:
  - docs/modules/translation-service.md
  - docs/modules/content.md
---

<!-- DD-DOC: Vocabulary system — word-list driven page annotation -->

# Vocabulary System

::: tip TL;DR
Vocabulary 系统通过本地 JSON 词库（CET-4/6、TOEFL、GRE 等标签体系）判定页面上哪些英文单词需要标注，
然后由 `AnnotationScanner` 遍历 DOM 文本节点、批量查询词库、调用翻译服务获取译文与音标，
最终将匹配词替换为 `<ruby>` 标注元素。全流程支持 AbortController 中断，并以 LRU 缓存加速查词。
:::

## 代码映射

| 文件 | 职责 |
|------|------|
| `src/providers/vocabulary/base-provider.js` | `VocabularyProvider` 抽象基类，定义 provider 接口 |
| `src/providers/vocabulary/unified-provider.js` | `UnifiedVocabularyProvider`，从 JSON 加载词库，支持标签过滤 |
| `src/services/vocabulary-service.js` | `VocabularyService` 单例，管理多 provider、LRU 缓存、批量查询 |
| `src/services/annotation-scanner.js` | `AnnotationScanner`，DOM 扫描、翻译 enrichment、ruby 标注应用 |
| `src/data/vocabularies/vocabulary-core.json` | 核心词库数据（初始化必加载） |
| `src/data/vocabularies/vocabulary-advanced.json` | 高级词库数据（按需加载） |
| `src/data/vocabularies/vocabulary-frequency.json` | 词频词库数据（按需加载） |

## 架构概览

```
content.js (初始化入口)
  ├─ initializeVocabularyService()
  │    ├─ new UnifiedVocabularyProvider('unified')
  │    ├─ vocabularyService.registerProvider('unified', ...)
  │    └─ vocabularyService.setActiveProvider(name, options)
  │         └─ provider.initialize() → fetch vocabulary-core.json
  │
  └─ initializeAnnotationScanner()
       └─ new AnnotationScanner(vocabularyService, translationService)

用户触发扫描 (message: 'scanVocabulary'):
  AnnotationScanner.scanPage()
    1. collectTextNodes()     → TreeWalker 遍历 DOM
    2. extractWordsFromNodes() → 正则提取英文单词
    3. vocabularyService.batchCheck() → 词库匹配 + LRU 缓存
    4. enrichAnnotations()    → translationService.translate() 逐词翻译
    5. applyAnnotations()     → createRubyElement() 替换 DOM 节点
```

## 核心接口

### VocabularyProvider (抽象基类)

```js
class VocabularyProvider {
  async initialize()                        // 加载词库数据
  shouldAnnotate(word, options) → boolean   // 判断是否需要标注
  batchCheck(words, options) → Map<string, boolean>  // 批量检查（默认逐词调用）
  getMetadata(word) → Object|null           // 获取词汇元数据
  normalizeWord(word) → string              // 标准化：toLowerCase + trim
  getSupportedOptions() → Object            // 返回支持的配置 schema
}
```

构造函数会阻止直接实例化（`new.target === VocabularyProvider` 检查）。

### VocabularyService (单例: `vocabularyService`)

```js
// 关键方法
registerProvider(name, provider)            // 注册 provider 到 Map
setActiveProvider(name, options)            // 切换活跃 provider（会清缓存）
shouldAnnotate(word, context) → boolean     // 单词查询（走缓存）
batchCheck(words, context) → Map           // 批量查询（缓存 + 未命中批量委托 provider）
getMetadata(word) → Object|null            // 直接委托活跃 provider
combineProviders(names, logic, opts) → fn  // 多 provider 组合查询（OR/AND）
```

**缓存键格式**: `${word}:${providerName}:${JSON.stringify(activeOptions)}`
**LRU 策略**: 超过 `maxCacheSize`（默认 1000）时淘汰最早条目。

### UnifiedVocabularyProvider

```js
// 初始化
await initialize()           // 加载 vocabulary-core.json
await loadLayer('advanced')  // 按需加载 vocabulary-advanced.json
await ensureAdvancedLoaded() // 懒加载 advanced 层

// 标签过滤
shouldAnnotate(word, {
  targetTags: ['cet6', 'toefl'],  // 目标标签
  mode: 'any' | 'all' | 'exact', // 匹配模式
  includeBase: false,             // 是否包含 CET-4 基础词
  minCollins: 0                   // 最小柯林斯星级
})
```

**词库数据结构** (`vocabulary-core.json`):
```json
{ "words": { "abandon": { "tags": ["cet4","cet6","ky","toefl"], "frequency": 5234, "collins": 4 } } }
```

支持标签: `cet4`, `cet6`, `ky`(考研), `gk`(高考), `toefl`, `ielts`, `gre`, `zk`(中考)。

### AnnotationScanner

```js
constructor(vocabularyService, translationService)

async scanPage(options) → { status, stats }
// options: { fetchTranslation, fetchPhonetic, sourceLang, targetLang, rootElement }

abort() → boolean               // 通过 AbortController 中断扫描
removeAnnotations() → number    // 移除所有已应用的 ruby 标注
observeChanges(enable, options)  // MutationObserver 监听动态内容（1s 防抖）
```

## 业务逻辑

### 扫描流程

1. **文本节点收集** — `TreeWalker` 过滤 `script/style/noscript/iframe/ruby/rt/rp` 标签，跳过空白节点和已标注内容。
2. **单词提取** — 正则 `/\b[a-zA-Z]+(?:[-'][a-zA-Z]+)*\b/g` 匹配英文单词（含连字符、撇号），结果按 `word.toLowerCase()` 去重，记录每个出现的 `{node, offset, length, originalWord}`。
3. **词库查询** — `vocabularyService.batchCheck()` 先查 LRU 缓存，未命中的批量委托 provider。
4. **翻译 enrichment** — 对需要标注的词并发调用 `translationService.translate()`，每个词翻译前检查 `abortController.signal.aborted`。翻译过程中显示进度面板（provider 名称、标签配置、完成数/总数、错误计数）。
5. **DOM 替换** — 同一文本节点上的多个标注按 offset 倒序处理（避免偏移），调用 `createRubyElement()` 生成 ruby 元素，用 fragment 一次性替换原节点。

### 标签过滤逻辑

- `mode: 'any'` — 词的标签与目标标签有交集即匹配
- `mode: 'all'` — 词的标签包含所有目标标签
- `mode: 'exact'` — 标签集合完全相等
- `includeBase: false` 时，仅有 `cet4` 标签的词被排除（视为基础词汇无需标注）
- `minCollins > 0` 时，柯林斯星级不足的词被过滤

### Provider 自动升级

`content.js` 中如果设置指定的 provider 为 `'cet'`，会自动升级为 `'unified'` provider，并将 CET 配置（`levels`）转换为统一的 `targetTags` 格式。

## 设计决策

| 决策 | 理由 |
|------|------|
| 全局单例 `vocabularyService` | 与 `translationService` 保持一致的模式，方便跨模块共享 |
| 分层加载（core / advanced / frequency） | 减少初始化开销，按需加载大型词库 |
| LRU 缓存放在 Service 层而非 Provider 层 | 缓存键包含 provider 名和 options，切换 provider 时自动清空 |
| AbortController 仅检查信号而非传递给 fetch | 翻译调用委托给 `translationService`，中断粒度为逐词检查 |
| 标注按 offset 倒序替换 | 从后往前替换文本节点避免前面的替换影响后面的 offset |
| 依赖全局 `createRubyElement` 函数 | 复用 `content.js` 已有的 ruby 创建逻辑（含点击事件、音频按钮） |
| 并发翻译 `Promise.all` | 所有词的翻译请求同时发出以提速，通过进度面板反馈进度 |

## 已知限制

1. **仅支持英文** — 单词提取正则 `/\b[a-zA-Z]+/` 无法处理非拉丁文字。
2. **AbortController 不穿透翻译层** — `abort()` 只阻止后续词的翻译发起，已发出的 HTTP 请求不会被取消。
3. **无词形还原** — 词库查询使用原形匹配，`running` 不会归约为 `run`（依赖词库本身包含变形）。
4. **并发翻译无限流** — `Promise.all` 同时发出所有翻译请求，大量词汇时可能造成请求洪峰。
5. **MutationObserver 全量重扫** — DOM 变化触发的重扫调用 `scanPage()` 而非增量处理新节点。
6. **`createRubyElement` 全局依赖** — `applyAnnotations` 运行时要求 `content.js` 已定义该函数，否则返回 0。

## 变更历史

| 日期 | 提交 | 描述 |
|------|------|------|
| 2025 | 初始实现 | 建立 VocabularyProvider 基类、VocabularyService、UnifiedProvider、AnnotationScanner |
| 2025 | 59d607b | 修复标注音频按钮不可点击问题，3 词以上隐藏音标 |
