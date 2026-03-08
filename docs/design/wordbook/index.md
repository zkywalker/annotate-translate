---
scope: wordbook
status: draft
dependencies: []
constraints:
  - Chrome Extension Manifest V3, no build process
  - Storage via chrome.storage.local (quota 10MB)
  - Vanilla JS only, no frameworks
  - UI must follow UI_DESIGN_GUIDELINES.md (flat, professional, no flashy animations)
last-verified: 2026-03-07
---

<!-- DD-DOC-META
Design spec & review artifact for Wordbook & Review System.
- Agent: implement strictly from this spec. Do not add unspecified features.
- Engineer: review this doc to validate design intent and expose flaws.
- Code-spec conflict: this spec is authoritative. Fix code or get approval to update spec.
-->

# 单词本与复习系统

::: tip TL;DR
为翻译扩展添加单词收藏与间隔重复复习功能。用户在翻译卡片上点击收藏按钮将单词存入本地单词本，按分组管理。复习调度基于 SM-2 算法，支持闪卡、选择题、拼写三种模式。在 Options 页面提供学习统计仪表盘。
:::

## Scope

**IN**:
- 翻译卡片上的收藏按钮（一键添加/移除）
- 单词本存储与管理（CRUD、分组、搜索）
- SM-2 间隔重复复习调度算法
- 三种复习模式：闪卡翻转、四选一、拼写输入
- 学习统计仪表盘（Options 页面内嵌 Tab）
- 数据导入/导出（与现有 export/import 功能整合）

**OUT**:
- 云端同步（仅本地存储，未来可扩展）
- 社交功能（分享单词本、排行榜）
- 离线语音合成优化
- 与第三方 Anki/Quizlet 的双向同步

::: danger Constraints
- chrome.storage.local 配额 10MB，单词本数据量必须控制
- 单词本上限 5000 条，超出时提示用户清理已掌握单词
- 复习算法必须纯客户端运行，不依赖任何后端
- 所有 UI 遵循 flat/professional 设计规范，禁止花哨动画
:::

## Sub-Documents

| Document | Content |
|----------|---------|
| [data-model.md](./data-model.md) | 数据模型、存储结构、SM-2 算法参数 |
| [collection.md](./collection.md) | 收藏流程、翻译卡片集成、分组管理 |
| [review.md](./review.md) | 复习系统、三种模式、调度逻辑 |
| [ui-stats.md](./ui-stats.md) | 统计仪表盘、Options 页面集成 |
