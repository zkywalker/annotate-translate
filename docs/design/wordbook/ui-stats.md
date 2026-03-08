---
scope: wordbook/ui-stats
status: draft
dependencies:
  - docs/design/wordbook/data-model.md
  - docs/design/wordbook/review.md
constraints:
  - Options page integration, no separate HTML file
  - Charts use pure CSS/SVG, no chart libraries
  - Follow UI_DESIGN_GUIDELINES.md
last-verified: 2026-03-07
---

<!-- DD-DOC-META
Design spec & review artifact for statistics dashboard and UI integration.
- Agent: implement strictly from this spec. Do not add unspecified features.
- Engineer: review this doc to validate design intent and expose flaws.
- Code-spec conflict: this spec is authoritative. Fix code or get approval to update spec.
-->

# 统计仪表盘与 UI 集成

::: tip TL;DR
Options 页面新增两个 Tab："单词本" 和 "复习"。统计仪表盘嵌入"复习" Tab 顶部，用纯 CSS/SVG 实现。展示核心指标（总词量、掌握率、连续天数）和 7 天复习热力图。
:::

## Options 页面 Tab 结构

```
现有:  [设置]
新增:  [设置]  [单词本]  [复习]
```

| Tab | 内容 |
|-----|------|
| 设置 | 现有全部设置（不变） |
| 单词本 | 分组管理 + 单词列表（见 [collection.md](./collection.md)） |
| 复习 | 统计仪表盘 + 复习区域 |

## 统计仪表盘

```
┌─ 复习 ─────────────────────────────────────────────┐
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐           │
│  │    47    │  │   68%    │  │   5 天   │           │
│  │ 总词量   │  │ 掌握率   │  │ 连续学习 │           │
│  └──────────┘  └──────────┘  └──────────┘           │
│                                                      │
│  最近 7 天                                           │
│  ┌──┬──┬──┬──┬──┬──┬──┐                             │
│  │▓▓│▓ │  │▓▓│▓▓│▓ │▓▓│  复习量                    │
│  │▓▓│▓ │  │▓▓│▓▓│▓ │▓▓│                             │
│  └──┴──┴──┴──┴──┴──┴──┘                             │
│  一  二  三  四  五  六  日                           │
│                                                      │
│  单词状态分布                                        │
│  ████████████░░░░░░░░░░                              │
│  new: 12  learning: 15  review: 12  mastered: 8     │
│                                                      │
│  ─────────────────────────────────────────────────── │
│                                                      │
│  模式: [闪卡 ▼]   数量: [20 ▼]   分组: [全部 ▼]    │
│                                                      │
│  [开始复习 (12 个待复习)]                            │
│                                                      │
│  ┌──────── 复习区域 ────────┐                        │
│  │    (复习卡片在此渲染)    │                        │
│  └──────────────────────────┘                        │
└──────────────────────────────────────────────────────┘
```

## 指标卡片

| 指标 | 计算方式 | 样式 |
|------|---------|------|
| 总词量 | `Object.keys(entries).length` | 大字号数字 + 灰色标签 |
| 掌握率 | `mastered / total * 100%` | 百分比 + 颜色编码（<30% 红, 30-70% 黄, >70% 绿） |
| 连续学习 | `stats.streakDays` | 天数 + 火焰图标(仅 >=3 天时) |

## 7 天复习柱状图

- 纯 CSS 实现，每天一个 `<div>` 柱子
- 高度 = `当天 reviewed / max(7天reviewed)` * 60px
- 颜色: `#3b82f6`（蓝），无数据天: `#e5e7eb`（浅灰）
- 鼠标悬停显示 tooltip: "周三: 复习 15 个, 正确 12 个"

## 状态分布条

- 水平堆叠条，总宽度 100%
- 颜色: new `#9ca3af`, learning `#f59e0b`, review `#3b82f6`, mastered `#22c55e`
- 下方显示各状态数量

## 文件结构

```
src/
├── services/
│   └── wordbook-service.js      // WordbookService: CRUD, SM-2, scheduler
├── content/
│   └── translation-ui.js        // 修改: 添加收藏按钮
├── options/
│   ├── options.html              // 修改: 添加 Tab 结构和单词本/复习 UI
│   └── options.js                // 修改: 添加单词本和复习逻辑
├── popup/
│   ├── popup.html                // 修改: 添加待复习数显示
│   └── popup.js                  // 修改: 查询待复习数
├── styles/
│   └── wordbook.css              // 新增: 单词本和复习专用样式
└── utils/
    ├── settings-schema.js        // 修改: 添加 wordbook 相关设置
    └── constants.js              // 修改: 添加 wordbook 常量
```

## Settings Schema 扩展

在 `DEFAULT_SETTINGS` 中新增：

```javascript
wordbook: {
  review: {
    sessionSize: 20,           // 每次复习数量
    defaultMode: 'flashcard',  // 默认复习模式
    autoPlayAudio: false,      // 自动播放发音
    showContext: true           // 显示上下文
  }
}
```

## Storage Keys 新增

| Key | Storage Area | Description |
|-----|-------------|-------------|
| `wordbook` | local | 单词本主数据（entries, groups, stats） |

## Popup 待复习数查询

```javascript
// popup.js 新增
async function getReviewCount() {
  const { wordbook } = await chrome.storage.local.get('wordbook');
  if (!wordbook?.entries) return 0;
  const now = Date.now();
  return Object.values(wordbook.entries)
    .filter(e => e.review.nextReviewAt <= now && e.review.status !== 'mastered')
    .length;
}
```

## Business Rules

- **BR-015**: WHEN Options 页面打开 THEN 自动加载单词本数据并渲染对应 Tab
- **BR-016**: WHEN 复习区域激活 THEN 统计仪表盘折叠为单行摘要以腾出空间
- **BR-017**: WHEN 复习结束 THEN 统计仪表盘立即刷新数据
- **BR-018**: WHEN streakDays >= 3 THEN 指标卡片显示火焰图标（CSS 伪元素，非动画）
