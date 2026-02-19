---
module: content
last-updated: 2026-02-19
related-modules:
  - docs/modules/translation-service.md
  - docs/modules/translation-ui.md
---

<!-- DD-DOC: Content Script module documentation. Source: src/content/content.js (~2278 lines) -->

# Content Script

::: tip TL;DR
`content.js` is the main content script injected into web pages. It owns the full lifecycle:
loading settings from `chrome.storage.sync`, registering DOM event listeners (`mouseup`, `dblclick`),
showing a floating context menu with Translate/Annotate buttons, delegating translation to
`translationService`, rendering results via `TranslationUI`, and wrapping selected text with
overlay-based annotation elements. It also handles vocabulary scanning and chrome.runtime message dispatch.
:::

## 代码映射

| 行范围 | 职责 |
|---------|------|
| 5-21 | `deepMerge()` -- 递归深度合并对象（保留新增字段） |
| 24-98 | `settings` 全局设置对象（含 general/annotation/translationCard/providers/display/performance/debug/vocabulary） |
| 101-171 | `$` 访问器对象 -- 通过 getter 简化 `settings.x.y.z` 读取 |
| 173-178 | 模块级状态：`annotations` Map、`lastSelection`、`translationUI`、`currentTooltip`、`annotationScanner` |
| 182-261 | `init()` -- 异步初始化主入口 |
| 264-280 | `initializeTranslationUI()` -- 创建 TranslationUI 实例 |
| 283-370 | `initializeVocabularyService()` -- 注册 Unified/CET/Frequency 词库 provider |
| 372-407 | `initializeAnnotationScanner()` + `setupPageUnloadHandler()` |
| 410-618 | `applyTranslationSettings()` -- 将 `$` 中的设置同步到 translationService 各 provider |
| 622-663 | `handleTextSelection()` / `handleDoubleClick()` -- 两个核心 DOM 事件处理器 |
| 667-728 | `showContextMenu()` / `hideContextMenu()` -- 浮动菜单 (T/A 按钮) |
| 746-971 | 上下文提取：`extractContext()` / `extractSentenceContext()` / `extractByCharacterLimit()` |
| 973-1115 | `translateText()` -- 翻译流程（loading → translate → renderUI → 自动/点击关闭） |
| 1119-1151 | `annotateSelectedText()` -- 使用 `lastSelection` Range 启动标注 |
| 1181-1272 | `annotateAllOccurrences()` -- 批量标注所有匹配项 |
| 1602-1685 | `promptAndAnnotate()` -- 核心标注流程：translate → createRubyAnnotation |
| 1722-1808 | `createRubyElement()` / `createRubyAnnotation()` -- 创建 overlay 标注 DOM |
| 1810-1854 | `clearAnnotationsByText()` -- 按文本清除标注 |
| 1858-2019 | 音频系统：`createAudioButton()` / `playPhoneticAudio()` / `playAudioFromUrl()` / `playTextToSpeech()` |
| 2022-2056 | `saveAnnotation()` -- 持久化到 `chrome.storage.local` |
| 2059-2163 | `handleMessage()` -- chrome.runtime.onMessage 分发器 |
| 2166-2241 | `showDetailedTranslation()` -- 点击标注弹出详细翻译卡片 |
| 2244-2277 | `clearAllAnnotations()` -- 清除页面所有标注 |

## 架构概览

```
init()
  ├─ chrome.storage.sync.get → deepMerge(settings, stored)
  ├─ applyTranslationSettings()        → 配置 translationService 各 provider
  ├─ initializeTranslationUI()          → new TranslationUI(options)
  ├─ initializeVocabularyService()      → 注册并激活词库 provider
  ├─ initializeAnnotationScanner()      → new AnnotationScanner(vocabSvc, transSvc)
  ├─ setupPageUnloadHandler()           → beforeunload/pagehide 中止翻译
  ├─ addEventListener('mouseup')        → handleTextSelection
  ├─ addEventListener('dblclick')       → handleDoubleClick
  └─ chrome.runtime.onMessage           → handleMessage
```

## 核心接口

### `settings` 对象与 `$` 访问器

`settings` 是一个分层配置对象，从 `chrome.storage.sync` 通过 `deepMerge()` 合并。
`$` 是一个只读代理对象（getter-based），提供扁平化访问：

```js
$.targetLanguage        // → settings.general.targetLanguage ?? 'zh-CN'
$.translationProvider   // → settings.providers.current ?? 'google'
$.currentAIProvider     // → 从 aiProviders[] 查找或回退到 openai 配置
$.enableCache           // → settings.performance.enableCache ?? true
```

`$` 唯一的 setter 是 `translationProvider`，用于 provider 不可用时回退到 `'google'`。

### `handleMessage(request, sender, sendResponse)`

消息动作分发表：

| action | 行为 |
|--------|------|
| `ping` | 返回 `{pong: true}` 确认脚本已加载 |
| `updateSettings` | 从 storage 重新加载并 `applyTranslationSettings()` |
| `clearCache` | `translationService.clearCache()` |
| `clearAnnotations` | `clearAllAnnotations()` |
| `annotate` | `annotateSelectedText(request.text)` |
| `translate` | `translateText(request.text)` |
| `annotate_page` | `annotationScanner.scanPage(options)` (异步) |
| `remove_annotations` | `annotationScanner.removeAnnotations()` |

## 业务逻辑

### 翻译流程

```
mouseup → handleTextSelection()
  → 保存 lastSelection (cloneRange)
  → showContextMenu(x, y, text)
    → 用户点击 "T" 按钮
      → translateText(text)
        → 显示 loading tooltip
        → extractContext(selection, 300, text)
        → translationService.translate(text, targetLang, 'auto', {context})
        → text.length > 50 ? renderSimple(result) : render(result)
        → 定位卡片、添加关闭按钮、自动关闭定时器
```

### 标注流程

```
双击 → handleDoubleClick()
  → promptAndAnnotate(range, text)
    → 显示 loading tooltip
    → extractContext(range, 300, text)
    → translationService.translate(...)
    → 判断 hidePhoneticForMultipleWords (>2 英文单词)
    → createRubyAnnotation(range, text, annotationText, result)
      → createRubyElement() 创建 .annotated-text + .annotation-overlay
      → range.deleteContents() + range.insertNode()
      → saveAnnotation() 持久化到 chrome.storage.local

菜单标注 → showContextMenu → 用户点击 "A"
  → annotateSelectedText(text)
    → 验证 lastSelection 有效性
    → promptAndAnnotate(lastSelection, text)
```

### 上下文提取策略

`extractContext()` 支持 Selection 和 Range 两种输入。策略分两层：
1. **句子级** (`extractSentenceContext`)：找到包含选中文本的句子，尝试前后各扩展一句，不超过 `CONTEXT_MAX_LENGTH`(300)。
2. **字符级降级** (`extractByCharacterLimit`)：当单句超长时，以选中文本为中心按字符截取，在单词边界对齐。

### 音频播放

优先级：phonetics 中的 `audioUrl` → Web Speech API (TTS)。
`audioCache`(Map) 实现 LRU 缓存，最大 `AUDIO_CACHE_MAX_SIZE`(50) 条。

## 设计决策

| 决策 | 原因 |
|------|------|
| `deepMerge` 而非 `Object.assign` | 保留默认 settings 中新增的嵌套字段，避免升级后丢失 |
| `$` getter 代理 | 避免在业务代码中反复写 `settings.general?.xxx ?? default` |
| `lastSelection` 保存 cloneRange | mouseup 后菜单点击会导致 Selection 丢失，必须提前保存 |
| 标注使用 overlay 定位而非 `<ruby>` 标签 | 函数名保留 `createRubyAnnotation` 但实际生成 `.annotated-text` + `.annotation-overlay` span |
| 批量标注从后往前遍历 | 避免 DOM 插入导致前面节点的 offset 失效 |
| `init()` 中 settings 加载失败时继续默认初始化 | 保证基本功能可用，不因 storage 异常完全失效 |
| provider 不可用时自动回退 google 并持久化 | 防止用户卸载某 provider 后每次加载都报错 |

## 已知限制

- `handleMessage` 中 `updateSettings` 使用 `Object.assign` (非 `deepMerge`)，与 `init()` 不一致，可能丢失嵌套新字段。
- `findAndAnnotateText()` 中仍使用 `alert()`，与 `showTemporaryMessage()` toast 方案不一致。
- `annotateAllMatches()` 中也使用 `alert()` 报告部分失败。
- 音频播放 TTS 硬编码 `lang: 'en-US'`，非英文文本发音不准确。
- `extractContext()` 向上遍历父元素获取文本可能取到大量无关内容（如整个 `<body>`）。
- `clearAllAnnotations()` 清除 storage 用 `chrome.storage.local`，而 settings 用 `chrome.storage.sync`，两套存储。

## 变更历史

| 日期 | 变更 |
|------|------|
| 2025 初期 | 初始实现：selection → translate → ruby 标注 |
| 后续迭代 | 标注样式从 `<ruby>` 改为 overlay 定位 (commit e4ebf02) |
| 后续迭代 | 新增 vocabulary 词库扫描系统 (unified/CET/frequency providers) |
| 后续迭代 | 新增 AI provider 多实例支持 (`aiProviders[]` + `currentAIProvider`) |
| 后续迭代 | 新增 `hidePhoneticForMultipleWords` (>2 单词隐藏音标) (commit 59d607b) |
| 后续迭代 | 新增双击自动标注 (`handleDoubleClick`) |
| 后续迭代 | 新增 `extractContext()` 句子级上下文提取 |
| 后续迭代 | 新增 `AnnotationScanner` 集成 + 页面卸载中止逻辑 |
