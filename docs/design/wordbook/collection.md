---
scope: wordbook/collection
status: draft
dependencies:
  - docs/design/wordbook/data-model.md
constraints:
  - Must integrate with existing TranslationUI without breaking current flow
  - Collection button must work without page reload
last-verified: 2026-03-07
---

<!-- DD-DOC-META
Design spec & review artifact for word collection flow.
- Agent: implement strictly from this spec. Do not add unspecified features.
- Engineer: review this doc to validate design intent and expose flaws.
- Code-spec conflict: this spec is authoritative. Fix code or get approval to update spec.
-->

# 收藏流程与分组管理

::: tip TL;DR
在翻译卡片右上角添加收藏按钮（星标图标）。点击后将当前翻译结果存入单词本，再次点击取消收藏。用户在 Options 页面管理分组和单词列表。支持批量操作和搜索过滤。
:::

## 收藏入口

### 翻译卡片收藏按钮

**位置**: 翻译卡片头部，原文行右侧

```
┌─────────────────────────────────┐
│ hello                       ☆  │  ← 收藏按钮（未收藏：空心星）
│ 你好                            │
│ /həˈloʊ/ 🔊                    │
│ ─────────────────────────────── │
│ n. 问候  v. 打招呼              │
│ ─────────────────────────────── │
│ Example: Hello, how are you?   │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ hello                       ★  │  ← 已收藏：实心星（#f59e0b）
│ ...                             │
└─────────────────────────────────┘
```

### 按钮行为

| 状态 | 图标 | 点击行为 |
|------|------|----------|
| 未收藏 | ☆ (stroke, `#9ca3af`) | 添加到单词本 default 分组，显示 toast "已收藏" |
| 已收藏 | ★ (fill, `#f59e0b`) | 从单词本移除，显示 toast "已取消收藏" |

### 收藏数据组装

WHEN 用户点击收藏按钮 THEN 从当前 TranslationResult 组装 WordEntry：

```javascript
function buildWordEntry(result, context) {
  return {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    word: result.originalText,
    translation: result.translatedText,
    phonetics: result.phonetics || [],
    definitions: (result.definitions || []).slice(0, 5),
    examples: (result.examples || []).slice(0, 3),
    sourceLang: result.sourceLang || 'auto',
    targetLang: result.targetLang,
    context: context || '',      // 选中文本前后的句子片段
    sourceUrl: location.href,
    groups: ['default'],
    createdAt: Date.now(),
    review: {
      repetitions: 0,
      easeFactor: 2.5,
      interval: 0,
      nextReviewAt: Date.now(),
      lastReviewAt: 0,
      totalReviews: 0,
      correctCount: 0,
      status: 'new'
    }
  };
}
```

### 去重规则

- **BR-001** (see [data-model.md](./data-model.md)): 以 `word.toLowerCase() + targetLang` 为去重 key
- WHEN 重复收藏 THEN 更新 `translation`, `phonetics`, `definitions`, `examples`, `context`, `sourceUrl` 字段
- 保留原有的 `review`, `groups`, `createdAt` 不变

## 分组管理（Options 页面）

### 分组 CRUD

| 操作 | 入口 | 规则 |
|------|------|------|
| 创建分组 | Options > 单词本 Tab > "新建分组" 按钮 | 名称不超过 30 字符，不允许重名 |
| 重命名 | 分组列表 > 行内编辑 | 同上 |
| 修改颜色 | 分组列表 > 颜色选择器 | 预设 8 色：gray/red/orange/yellow/green/blue/purple/pink |
| 删除分组 | 分组列表 > 删除图标 | default 分组禁止删除；删除后单词移入 default |

### 单词列表视图（Options 页面）

```
┌─ 单词本 ──────────────────────────────────────┐
│                                                │
│  [🔍 搜索...]  [分组: 全部 ▼]  [排序: 最新 ▼] │
│                                                │
│  ┌─────────────────────────────────────────┐   │
│  │ ☐  hello        你好     new    default │   │
│  │ ☐  beautiful    美丽的   review  CET-4  │   │
│  │ ☐  ephemeral    短暂的   new    GRE     │   │
│  └─────────────────────────────────────────┘   │
│                                                │
│  [□ 全选]  [移动到分组...]  [删除选中]         │
│                                                │
│  ◀ 1 / 5 ▶        共 47 个单词                │
└────────────────────────────────────────────────┘
```

### 列表功能

| 功能 | 实现 |
|------|------|
| 搜索 | 按 word 和 translation 模糊匹配（`includes`） |
| 分组过滤 | 下拉选择分组，"全部" 显示所有 |
| 排序 | 最新优先 / 最早优先 / 字母序 / 复习状态 |
| 分页 | 每页 20 条，前后翻页 |
| 批量操作 | 勾选后可批量移动分组、批量删除 |
| 单词详情 | 点击单词行展开，显示完整翻译、音标、例句、复习记录 |

### 导入/导出整合

扩展现有 Options 页面的导出功能：

- **导出**: 在现有 export JSON 中新增 `wordbook` 字段
- **导入**: 导入时检测 `wordbook` 字段，合并到本地数据（去重合并，保留更高 repetitions 的记录）

## Business Rules

- **BR-007**: WHEN 翻译卡片显示时 THEN 异步查询 wordbook 判断是否已收藏，设置按钮初始状态
- **BR-008**: WHEN 收藏成功 THEN 更新 GlobalStats.totalCollected += 1
- **BR-009**: WHEN 取消收藏 THEN 完全删除 WordEntry（不保留复习记录）
- **BR-010**: WHEN 批量删除 THEN 弹出确认对话框 "确定删除 N 个单词？复习记录将一并删除。"
