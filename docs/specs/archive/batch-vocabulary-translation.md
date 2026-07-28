---
status: archived
completed: 2026-07-28
---

# 词汇模式批量翻译规格

## 目标

- 词汇整页扫描通过统一的 `TranslationService.translateBatch()` 获取结果。
- OpenAI-compatible provider 将多个独立词条合并为结构化 JSON 请求。
- 不支持批量的 provider 使用有界并发，避免整页请求洪峰。
- 缓存继续由 `TranslationService` 统一管理，并区分 provider 配置、语言和有效上下文。

## 范围

- 新增 provider 批量能力声明、推荐批大小和缓存命名空间接口。
- OpenAI 默认模板支持按稳定 ID 返回批量词条结果。
- 批量解析必须校验 ID、译文、缺失项和重复项。
- 批量请求失败时，以有界并发回退到单条翻译。
- 每个词条独立缓存、独立报告成功或失败，并保持现有标注结果结构。

## 非目标

- 不把翻译缓存下沉到各 provider。
- 不为 Google、Youdao 或 DeepL 模拟基于分隔符的批量解析。
- 不改变设置页或增加用户可见的批大小选项。
- 不为已经发出的 background message 实现网络级取消。

## 验收标准

1. OpenAI 默认配置下，多个未缓存词条按最多 8 个一批请求。
2. OpenAI `maxTokens` 较小时会自动降低批大小。
3. 非批量 provider 同时最多发出 4 个单条请求。
4. 批量 provider 同时最多发出 2 个批次。
5. 相同 provider 配置、语言且无上下文的同一文本命中缓存。
6. 启用上下文的 OpenAI provider 对不同上下文使用不同缓存项。
7. 批量返回不完整或格式错误时，受影响词条通过单条请求回退。
8. 词汇扫描继续逐词更新进度，并只应用成功取得完整结果的标注。
