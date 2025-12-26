# 单词本功能设计文档

## 1. 需求分析

### 1.1 核心需求
- **自动记录**：用户翻译单词时自动记录到单词本
- **手动收藏**：用户可主动标记重要单词
- **状态区分**：区分"查询过"和"收藏"两种状态
- **多单词本**：支持用户创建多个单词本分类管理
- **词汇模式集成**：未来支持从单词本导入词汇进行批量标注

### 1.2 使用场景

**场景1：学习者快速查词**
```
用户在阅读时遇到生词 → 翻译 → 系统自动记录 → 用户无感知
```

**场景2：重点单词收藏**
```
用户翻译后觉得重要 → 点击收藏按钮 → 标记为"已收藏" → 后续重点复习
```

**场景3：分类管理**
```
用户创建"GRE词汇"单词本 → 遇到GRE单词收藏到此本 → 按类别学习
```

**场景4：词汇模式学习**
```
用户完成单词本积累 → 在新文章使用词汇模式 → 选择单词本作为数据源 → 只标注单词本中的词
```

## 2. 技术约束

### 2.1 Chrome Storage 限制

| 存储类型 | 配额限制 | 备注 |
|---------|---------|------|
| chrome.storage.sync | 总计 100KB | 跨设备同步 |
| 单个 key | 最大 8KB | 单条记录限制 |
| 最大 key 数量 | 512 个 | 总条目限制 |
| 写入频率 | 120 次/分钟 | 防滥用限制 |

### 2.2 数据量估算

假设单个单词数据（含翻译结果）：
- 单词 + 音标 + 翻译 + 词义 + 例句 ≈ 2KB
- 100KB / 2KB = **最多存储约 50 个单词**（sync）

**结论**：必须采用**分层存储**策略。

## 3. 数据结构设计

### 3.1 整体架构

```
chrome.storage.sync                chrome.storage.local
    ├── wordbook_meta                  ├── word_details_*
    ├── wordbook_index_*               ├── word_cache_*
    └── user_settings                  └── statistics_*
```

**分层原则**：
- **sync**：元数据、索引（轻量、需同步）
- **local**：详细数据、缓存（大量、仅本地）

### 3.2 数据模型（详细设计）

#### 3.2.1 单词本元数据（Wordbook Metadata）

**存储位置**：`chrome.storage.sync`
**Key**：`wordbook_meta`

```javascript
{
  "default": {
    id: "default",
    name: "默认单词本",
    description: "",
    icon: "📚",  // 可选emoji图标
    color: "#1a73e8",  // 主题色
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",

    // 统计信息（冗余存储，避免遍历）
    stats: {
      total: 156,           // 总单词数
      queried: 143,         // 查询过的
      starred: 13,          // 已收藏的
      lastAddedAt: "2025-01-15T10:30:00.000Z"
    },

    // 配置
    settings: {
      autoAdd: true,        // 是否自动添加查询的单词
      sortBy: "addedAt",    // 排序方式：addedAt | word | reviewCount
      sortOrder: "desc"     // 排序顺序：asc | desc
    }
  },

  "gre-vocab": {
    id: "gre-vocab",
    name: "GRE 核心词汇",
    description: "备考 GRE 使用",
    icon: "🎓",
    color: "#34a853",
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-15T08:20:00.000Z",
    stats: { total: 23, queried: 10, starred: 13 },
    settings: { autoAdd: false, sortBy: "word", sortOrder: "asc" }
  }
}
```

**大小估算**：每个单词本 ≈ 300 bytes，最多支持 20+ 个单词本。

#### 3.2.2 单词本索引（Wordbook Index）

**存储位置**：`chrome.storage.sync`
**Key**：`wordbook_index_{wordbookId}`（每个单词本一个key）

```javascript
// Key: "wordbook_index_default"
{
  words: {
    "hello": {
      status: "starred",           // queried | starred | archived
      addedAt: "2025-01-01T10:00:00.000Z",
      updatedAt: "2025-01-15T10:30:00.000Z",
      reviewCount: 5,              // 复习次数
      lastReviewedAt: "2025-01-15T10:30:00.000Z",

      // 用户数据
      notes: "",                   // 用户笔记
      tags: ["difficult", "verb"],  // 自定义标签

      // 学习数据（为未来的间隔重复算法预留）
      learning: {
        ease: 2.5,                 // 难易度
        interval: 1,               // 间隔天数
        nextReview: "2025-01-16T10:30:00.000Z"
      }
    },

    "world": {
      status: "queried",
      addedAt: "2025-01-15T14:20:00.000Z",
      updatedAt: "2025-01-15T14:20:00.000Z",
      reviewCount: 1,
      lastReviewedAt: "2025-01-15T14:20:00.000Z",
      notes: "",
      tags: []
    }

    // ... 更多单词
  },

  // 元数据
  version: "1.0",
  lastSync: "2025-01-15T14:20:00.000Z"
}
```

**大小控制**：
- 单个单词索引 ≈ 200 bytes
- 8KB / 200 bytes = **每个索引最多 40 个单词**
- 超过40个单词时分页：`wordbook_index_default_1`, `wordbook_index_default_2`

**分页策略**：
```javascript
// 第一页：wordbook_index_default
// 第二页：wordbook_index_default_p2
// 第三页：wordbook_index_default_p3
```

#### 3.2.3 单词详细数据（Word Details）

**存储位置**：`chrome.storage.local`
**Key**：`word_detail_{word}`

```javascript
// Key: "word_detail_hello"
{
  word: "hello",

  // 完整翻译数据（缓存，避免重复API调用）
  translation: {
    originalText: "hello",
    translatedText: "你好；哈喽",
    sourceLang: "en",
    targetLang: "zh-CN",

    phonetics: [
      {
        type: "us",
        text: "/həˈloʊ/",
        audioUrl: "https://...",
        audioData: null  // ArrayBuffer (可选)
      },
      {
        type: "uk",
        text: "/həˈləʊ/",
        audioUrl: "https://...",
        audioData: null
      }
    ],

    definitions: [
      {
        partOfSpeech: "int.",
        text: "喂；你好（用于问候、接电话或引起注意）",
        synonyms: ["hi", "hey"]
      },
      {
        partOfSpeech: "n.",
        text: "招呼；问候",
        synonyms: []
      }
    ],

    examples: [
      {
        source: "Hello, is there anybody there?",
        translation: "喂，那里有人吗？"
      },
      {
        source: "Hello John, how are you?",
        translation: "哈喽，约翰，你好吗？"
      }
    ],

    provider: "google",
    timestamp: "2025-01-01T10:00:00.000Z"
  },

  // 元数据
  firstSeenAt: "2025-01-01T10:00:00.000Z",
  lastAccessedAt: "2025-01-15T10:30:00.000Z",
  accessCount: 5,

  // 跨单词本引用计数（用于GC）
  refCount: 2  // 被2个单词本引用
}
```

**优势**：
- 单词详情不占用 sync 配额
- 多个单词本共享同一份详细数据（节省空间）
- 缓存翻译结果，离线可用

#### 3.2.4 快速查询索引（可选优化）

**存储位置**：`chrome.storage.local`
**Key**：`word_index_by_letter_{letter}`

```javascript
// Key: "word_index_by_letter_h"
{
  words: ["hello", "help", "house", "hope", ...],
  updatedAt: "2025-01-15T10:30:00.000Z"
}
```

**用途**：加速按首字母筛选、搜索等操作。

### 3.3 数据关系图

```
┌─────────────────────────────────────────────────────────┐
│                  chrome.storage.sync                     │
│  ┌────────────────────────────────────────────────┐    │
│  │ wordbook_meta (单词本元数据)                    │    │
│  │  ├── default                                    │    │
│  │  ├── gre-vocab                                  │    │
│  │  └── toefl-vocab                                │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
│                         ▼                               │
│  ┌────────────────────────────────────────────────┐    │
│  │ wordbook_index_default (单词索引)              │    │
│  │  ├── hello {status, addedAt, reviewCount, ...} │    │
│  │  ├── world {status, addedAt, reviewCount, ...} │    │
│  │  └── ...                                        │    │
│  └────────────────────────────────────────────────┘    │
│                         │                               │
└─────────────────────────┼───────────────────────────────┘
                          │ word reference
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  chrome.storage.local                    │
│  ┌────────────────────────────────────────────────┐    │
│  │ word_detail_hello (单词详情)                   │    │
│  │  ├── translation (完整翻译数据)                 │    │
│  │  ├── phonetics, definitions, examples          │    │
│  │  └── refCount: 3 (被3个单词本引用)             │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 4. 核心操作流程

### 4.1 添加单词（自动记录）

```
用户翻译"hello"
  ↓
1. 检查 word_detail_hello 是否存在
   - 不存在：保存完整翻译数据到 local
   - 存在：更新 lastAccessedAt, accessCount++
  ↓
2. 检查当前单词本索引中是否有"hello"
   - 不存在：添加新条目，status="queried"
   - 存在：更新 lastReviewedAt, reviewCount++
  ↓
3. 更新单词本元数据统计 (stats.total++)
  ↓
4. 保存到 storage
```

### 4.2 收藏单词

```
用户点击翻译卡片的"收藏"按钮
  ↓
1. 读取当前单词本索引
  ↓
2. 更新单词状态：status="queried" → "starred"
  ↓
3. 更新单词本元数据统计：
   stats.queried--, stats.starred++
  ↓
4. 保存并显示反馈
```

### 4.3 移除单词

```
用户在单词本页面删除"hello"
  ↓
1. 从单词本索引中删除条目
  ↓
2. 更新单词本元数据统计
  ↓
3. word_detail_hello 的 refCount--
  ↓
4. 如果 refCount == 0：GC（可选延迟删除）
```

### 4.4 查询单词列表

```
用户打开单词本页面
  ↓
1. 读取 wordbook_meta，显示单词本列表
  ↓
2. 读取 wordbook_index_default（可能多页）
  ↓
3. 根据 filter 筛选（status、tags、日期等）
  ↓
4. 按 sortBy 排序
  ↓
5. 分页显示（前端分页，每页20个）
  ↓
6. 按需加载 word_detail（用户点击时）
```

## 5. 存储空间优化

### 5.1 分页存储

当单词本超过 40 个单词时：

```javascript
// 第1-40个单词
wordbook_index_default

// 第41-80个单词
wordbook_index_default_p2

// 第81-120个单词
wordbook_index_default_p3
```

**索引元数据**：
```javascript
// wordbook_meta 中添加
{
  "default": {
    // ...
    pagination: {
      pageSize: 40,
      pageCount: 3,
      pages: [
        "wordbook_index_default",
        "wordbook_index_default_p2",
        "wordbook_index_default_p3"
      ]
    }
  }
}
```

### 5.2 数据压缩（可选）

对于 examples 等大数据：
```javascript
// 只保留前3个例句
examples: examples.slice(0, 3)

// 或使用压缩库（需评估收益）
import pako from 'pako';
const compressed = pako.deflate(JSON.stringify(data));
```

### 5.3 垃圾回收（GC）

定期清理未被引用的 word_detail：
```javascript
// 每周运行一次
async function garbageCollect() {
  const allDetails = await chrome.storage.local.get(null);
  for (const [key, value] of Object.entries(allDetails)) {
    if (key.startsWith('word_detail_') && value.refCount === 0) {
      // 30天未访问且无引用，删除
      if (Date.now() - new Date(value.lastAccessedAt) > 30 * 24 * 3600 * 1000) {
        await chrome.storage.local.remove(key);
      }
    }
  }
}
```

## 6. 与现有功能集成

### 6.1 翻译功能集成

**修改点**：`src/content/content.js` 的 `translateText()` 函数

```javascript
async function translateText(text) {
  // 现有翻译逻辑
  const result = await translationService.translate(text, ...);

  // 显示翻译卡片
  showTranslationCard(result);

  // 新增：自动添加到单词本
  if (settings.wordbook.autoAdd) {
    await wordbookService.addWord(
      text,
      result,
      settings.wordbook.defaultWordbookId
    );
  }
}
```

### 6.2 翻译卡片添加收藏按钮

**修改点**：翻译卡片HTML结构

```javascript
// 在关闭按钮旁添加收藏按钮
const starBtn = document.createElement('button');
starBtn.className = 'translation-star-btn';
starBtn.innerHTML = isStarred ? '⭐' : '☆';
starBtn.addEventListener('click', async () => {
  await wordbookService.toggleStar(word, currentWordbookId);
  starBtn.innerHTML = isStarred ? '☆' : '⭐';
});
```

### 6.3 词汇模式集成（未来）

**新增配置项**：

```javascript
vocabularyMode: {
  dataSource: "tags",  // "tags" | "wordbook"
  selectedTags: [...],
  selectedWordbook: "gre-vocab"  // 当 dataSource="wordbook" 时使用
}
```

**实现**：
```javascript
async function getVocabularyWords() {
  if (settings.vocabularyMode.dataSource === 'wordbook') {
    // 从单词本获取单词列表
    const words = await wordbookService.getWords(
      settings.vocabularyMode.selectedWordbook,
      { status: 'starred' }  // 只用收藏的单词
    );
    return words.map(w => w.word);
  } else {
    // 现有逻辑：从词库标签获取
    return getWordsFromTags(settings.vocabularyMode.selectedTags);
  }
}
```

## 7. API 设计

### 7.1 WordbookService 类

```javascript
class WordbookService {
  // ===== 单词本管理 =====

  async getWordbooks()
  async createWordbook(name, description, settings)
  async updateWordbook(id, updates)
  async deleteWordbook(id)
  async getWordbookStats(id)

  // ===== 单词管理 =====

  async addWord(word, translationData, wordbookId)
  async removeWord(word, wordbookId)
  async toggleStar(word, wordbookId)
  async updateWordNotes(word, wordbookId, notes)
  async updateWordTags(word, wordbookId, tags)

  // ===== 查询 =====

  async getWords(wordbookId, filter, pagination)
  async getWord(word, wordbookId)
  async searchWords(query, wordbookId)
  async getWordDetail(word)

  // ===== 统计 =====

  async getGlobalStats()
  async getRecentWords(limit)

  // ===== 工具 =====

  async exportWordbook(wordbookId)
  async importWordbook(data)
  async garbageCollect()
}
```

### 7.2 存储辅助类

```javascript
class StorageHelper {
  // 分页读取索引
  async readWordbookIndex(wordbookId)

  // 分页写入索引（自动分页）
  async writeWordbookIndex(wordbookId, words)

  // 批量操作
  async batchUpdateWords(wordbookId, updates)
}
```

## 8. UI 设计草图

### 8.1 单词本列表页

```
┌──────────────────────────────────────────┐
│ 单词本                    [+ 新建]  [设置] │
├──────────────────────────────────────────┤
│                                           │
│ 📚 默认单词本                    156 词   │
│    查询 143 · 收藏 13 · 2小时前           │
│    ───────────────────────────────────   │
│                                           │
│ 🎓 GRE 核心词汇                   23 词   │
│    查询 10 · 收藏 13 · 昨天               │
│    ───────────────────────────────────   │
│                                           │
│ 📖 TOEFL 高频词                   45 词   │
│    查询 30 · 收藏 15 · 3天前              │
│                                           │
└──────────────────────────────────────────┘
```

### 8.2 单词列表页

```
┌──────────────────────────────────────────┐
│ ← 默认单词本          [搜索] [排序] [过滤] │
├──────────────────────────────────────────┤
│ [全部 156] [查询 143] [收藏 13]           │
├──────────────────────────────────────────┤
│                                           │
│ ⭐ hello                         [详情][×]│
│    /həˈloʊ/  你好                         │
│    查询 5 次 · 2小时前                     │
│                                           │
│ ☆ world                         [详情][×]│
│    /wɜːrld/  世界                         │
│    查询 1 次 · 今天                        │
│                                           │
│ ⭐ important                     [详情][×]│
│    /ɪmˈpɔːrtnt/  重要的                   │
│    查询 3 次 · 昨天                        │
│    📝 需要重点记忆                         │
│                                           │
└──────────────────────────────────────────┘
```

### 8.3 单词详情页

```
┌──────────────────────────────────────────┐
│ ← 返回                         [收藏][编辑]│
├──────────────────────────────────────────┤
│                                           │
│  hello                               🔊   │
│  /həˈloʊ/  US    /həˈləʊ/  UK            │
│                                           │
│  你好；哈喽                                │
│                                           │
│  ────────────────────────────────────   │
│                                           │
│  📚 词义                                  │
│  int. 喂；你好（用于问候）                │
│  n.   招呼；问候                          │
│                                           │
│  📝 例句                                  │
│  • Hello, is there anybody there?        │
│    喂，那里有人吗？                        │
│                                           │
│  🏷️ 标签                                 │
│  [日常用语] [基础]                        │
│                                           │
│  📊 统计                                  │
│  查询 5 次 · 最近：2小时前                 │
│  首次见：2025-01-01                       │
│                                           │
│  💬 笔记                                  │
│  [添加笔记...]                            │
│                                           │
└──────────────────────────────────────────┘
```

## 9. 实施计划

### Phase 1：核心功能（Week 1-2）
- [ ] 实现 WordbookService 基础类
- [ ] 实现数据存储层（StorageHelper）
- [ ] 翻译功能集成（自动添加）
- [ ] 翻译卡片添加收藏按钮
- [ ] 单元测试

### Phase 2：单词本页面（Week 3-4）
- [ ] 单词本列表页 UI
- [ ] 单词列表页 UI
- [ ] 单词详情页 UI
- [ ] 搜索、过滤、排序功能
- [ ] 国际化（i18n）

### Phase 3：高级功能（Week 5-6）
- [ ] 多单词本支持
- [ ] 批量操作（导入/导出）
- [ ] 统计图表
- [ ] 垃圾回收机制

### Phase 4：词汇模式集成（Week 7）
- [ ] 词汇模式数据源切换
- [ ] 从单词本导入词汇列表
- [ ] UI 调整

## 10. 风险与挑战

### 10.1 存储空间不足
**风险**：用户积累大量单词，超出 sync 配额
**缓解**：
- 实施分页存储
- 提供导出功能
- 显示存储空间使用情况
- 引导用户归档旧单词

### 10.2 同步冲突
**风险**：多设备同时修改导致数据冲突
**缓解**：
- 使用时间戳进行冲突解决（Last Write Wins）
- 关键操作添加乐观锁
- 提供冲突恢复机制

### 10.3 性能问题
**风险**：单词过多时查询变慢
**缓解**：
- 实施分页加载
- 使用虚拟滚动
- 建立快速索引
- 缓存常用查询结果

### 10.4 数据迁移
**风险**：未来需要修改数据结构
**缓解**：
- 在数据中添加 version 字段
- 实现数据迁移脚本
- 提供降级路径

## 11. 未来扩展方向

### 11.1 学习算法
- 基于 Anki 的间隔重复算法（SM-2）
- 遗忘曲线分析
- 学习计划推荐

### 11.2 社区功能
- 分享单词本
- 导入他人单词本
- 热门单词本推荐

### 11.3 数据分析
- 学习进度可视化
- 词汇量统计
- 学习时长分析

### 11.4 跨平台同步
- 云端存储（自建服务器）
- 突破 Chrome Storage 限制
- 移动端应用

## 12. 参考资料

- [Chrome Extension Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Anki Manual - Spaced Repetition](https://docs.ankiweb.net/background.html)
- [扇贝单词 - 产品分析](https://www.shanbay.com/)
- [Notion Database Design](https://www.notion.so/help/guides/creating-a-database)
- [SuperMemo Algorithm (SM-2)](https://www.supermemo.com/en/archives1990-2015/english/ol/sm2)
