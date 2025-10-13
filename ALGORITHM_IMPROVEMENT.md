# 🔧 标注算法改进说明

## ❌ 原有问题

### 问题1: 基于文本匹配导致标错位置

**场景：**
```
The word "test" appears in this test sentence.
        ^^^^                       ^^^^
```

如果用户选中第二个 "test"，但算法基于文本搜索会标注到第一个 "test"。

**原因：**
- 右键菜单只传递选中的文本字符串
- 不知道用户具体选中的是哪个位置
- `indexOf()` 总是找到第一个匹配

### 问题2: 无法批量标注相同单词

用户可能希望：
- 同时标注页面上所有的 "API"
- 一次性给所有 "test" 添加相同的注释

原算法只能标注一个位置。

---

## ✅ 新算法方案

### 方案1: 保存 Range 对象 (主要方案)

**原理：**
```javascript
// 在用户选择文本时保存Range
let lastSelection = null;

document.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    lastSelection = selection.getRangeAt(0).cloneRange();
  }
});
```

**优势：**
- ✅ 精确记录用户选择的位置
- ✅ 不依赖文本搜索
- ✅ 支持跨元素选择

**流程：**
```
1. 用户选中文本 (mouseup)
   ↓
2. 保存 Range 对象到 lastSelection
   ↓
3. 用户右键点击菜单
   ↓
4. Background 发送消息到 Content Script
   ↓
5. Content Script 使用保存的 Range
   ↓
6. 直接在正确位置创建标注
```

### 方案2: 查找所有匹配 (备选方案)

如果 Range 无效（例如页面已刷新），回退到文本搜索：

```javascript
// 查找所有匹配
const matches = findAllTextOccurrences(text);

if (matches.length === 1) {
  // 只有一个，直接标注
  annotate(matches[0]);
} else if (matches.length > 1) {
  // 多个匹配，询问用户
  showMultipleMatchesDialog(matches);
}
```

**功能：**
- 🔍 找到所有匹配位置
- 🤔 询问用户标注哪些
- 📝 支持批量标注

---

## 🎯 新功能: 批量标注

### UI交互

当发现多个匹配时，显示对话框：

```
┌─────────────────────────────────────┐
│  Multiple matches found             │
│                                     │
│  Found 3 occurrences of "test"     │
│                                     │
│  [Annotate First Only]             │
│  [Annotate All (3)]                │
│  [Cancel]                           │
└─────────────────────────────────────┘
```

### 用户选择

1. **Annotate First Only**
   - 只标注第一个匹配
   - 适用于：用户只想标注一个

2. **Annotate All (N)**
   - 标注所有 N 个匹配
   - 弹出一次输入框，所有匹配使用相同标注
   - 适用于：批量标注专业术语

3. **Cancel**
   - 取消操作

---

## 🔍 算法实现细节

### 1. 保存选择

```javascript
let lastSelection = null;

function handleTextSelection(event) {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText) {
    // 保存Range的克隆
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      lastSelection = selection.getRangeAt(0).cloneRange();
    }
  }
}
```

**关键点：**
- 使用 `cloneRange()` 创建副本
- 原因：原始 Range 可能被后续操作清除

### 2. 使用保存的Range

```javascript
function annotateSelectedText(text) {
  if (lastSelection) {
    try {
      // 验证Range是否仍然有效
      const selectedText = lastSelection.toString();
      if (selectedText === text) {
        // 使用保存的Range，精确定位
        promptAndAnnotate(lastSelection, text);
        return;
      }
    } catch (e) {
      // Range 已失效
    }
  }
  
  // 回退到搜索方案
  findAndAnnotateText(text);
}
```

**验证步骤：**
1. 检查 `lastSelection` 是否存在
2. 尝试获取 Range 的文本
3. 验证文本是否匹配
4. 如果失败，回退到搜索

### 3. 查找所有匹配

```javascript
function findAllTextOccurrences(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // 跳过已标注的文本
        if (node.parentElement.closest('ruby.annotate-translate-ruby')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes(text) 
          ? NodeFilter.FILTER_ACCEPT 
          : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const matches = [];
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.nodeValue;
    let index = nodeText.indexOf(text);
    
    // 找到该节点中所有的匹配
    while (index !== -1) {
      matches.push({
        node: node,
        index: index,
        text: text
      });
      index = nodeText.indexOf(text, index + 1);
    }
  }
  
  return matches;
}
```

**关键优化：**
- 使用 `TreeWalker` 遍历文本节点
- 跳过已标注的内容（避免重复标注）
- 在单个节点中可能有多个匹配（如 "test test"）

### 4. 批量标注

```javascript
function annotateAllMatches(matches, text, annotation) {
  let successCount = 0;
  
  // 从后往前标注，避免DOM变化影响索引
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    try {
      // 验证节点仍在文档中
      if (!document.contains(match.node)) {
        continue;
      }
      
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + text.length);
      
      createRubyAnnotation(range, text, annotation);
      successCount++;
    } catch (e) {
      console.error('Failed to annotate:', e);
    }
  }
  
  return successCount;
}
```

**为什么从后往前？**
- 标注会修改 DOM 结构
- 从后往前可以保证前面的索引不受影响
- 类似于数组删除元素的最佳实践

---

## 📊 算法流程图

### 完整流程

```
用户选中文本 (mouseup)
         ↓
保存 Range → lastSelection
         ↓
用户右键 → 点击 "Annotate"
         ↓
Background 发送消息
         ↓
Content Script 接收
         ↓
    尝试使用 lastSelection
         ↓
    ┌────────────────┐
    │ Range 有效？   │
    └────────────────┘
         ↓ Yes           ↓ No
    直接标注        查找所有匹配
         ↓                ↓
    完成        ┌──────────────┐
                │ 找到几个？   │
                └──────────────┘
                ↓     ↓        ↓
              0个    1个     多个
                ↓     ↓        ↓
              失败   标注   显示对话框
                            ↓
                    ┌───────────────┐
                    │ 用户选择...   │
                    └───────────────┘
                    ↓       ↓      ↓
                  第一个   所有   取消
```

---

## 🎨 UI设计

### 对话框样式

```css
.annotate-translate-dialog {
  /* 全屏遮罩 */
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 100000;
  
  /* 居中内容 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-overlay {
  /* 半透明背景 */
  background-color: rgba(0, 0, 0, 0.5);
}

.dialog-content {
  /* 白色卡片 */
  background-color: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  
  /* 动画 */
  animation: dialogSlideIn 0.2s ease-out;
}
```

### 按钮样式

- **Annotate First Only**: 蓝色主按钮
- **Annotate All (N)**: 绿色成功按钮
- **Cancel**: 灰色次要按钮

---

## 🧪 测试场景

### 场景1: 单个匹配
```
Text: "Hello world"
User selects: "world"
Result: 直接标注，不显示对话框
```

### 场景2: 多个匹配 - 标注第一个
```
Text: "test test test"
User selects: "test" (any one)
Action: 选择 "Annotate First Only"
Result: 只有第一个 "test" 被标注
```

### 场景3: 多个匹配 - 标注所有
```
Text: "API is an API for API calls"
User selects: "API" (any one)
Action: 选择 "Annotate All (3)"
Input: "应用程序接口"
Result: 所有3个 "API" 都被标注
```

### 场景4: Range保存有效
```
Text: "word1 word2 word3"
User selects: "word2"
User right-clicks immediately
Result: 使用 lastSelection，精确标注 "word2"
```

### 场景5: Range保存失效
```
Text: "word1 word2 word3"
User selects: "word2"
User scrolls, clicks elsewhere
User right-clicks context menu
Result: Range失效，回退到搜索所有匹配
```

---

## ⚠️ 边界情况处理

### 1. Range 失效
**原因：**
- 页面DOM被修改
- 用户点击了其他地方
- 页面滚动导致节点被重新渲染

**处理：**
- 使用 try-catch 捕获
- 回退到搜索方案

### 2. 节点已被标注
**问题：** 重复标注同一个位置

**解决：**
```javascript
acceptNode: function(node) {
  if (node.parentElement.closest('ruby.annotate-translate-ruby')) {
    return NodeFilter.FILTER_REJECT;
  }
  // ...
}
```

### 3. 跨元素选择
**场景：**
```html
<p>Hello <strong>world</strong></p>
用户选中: "Hello world"
```

**处理：**
- Range 可以跨越多个节点
- 标注时可能需要包裹多个节点
- 当前实现会保留原有结构

### 4. 特殊字符
**场景：**
- 选中包含换行符的文本
- 选中包含 HTML 实体的文本

**处理：**
- 使用 `textContent` 而不是 `innerHTML`
- 搜索时考虑空白字符

---

## 🚀 性能优化

### 1. TreeWalker vs querySelectorAll
```javascript
// ❌ 慢
const allText = document.body.textContent;
const positions = findAllPositions(allText, text);

// ✅ 快
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT
);
```

**优势：**
- TreeWalker 按需遍历
- 可以提前终止
- 内存占用小

### 2. 批量操作优化
```javascript
// 从后往前标注
for (let i = matches.length - 1; i >= 0; i--) {
  annotate(matches[i]);
}
```

**原因：**
- 避免索引失效
- 减少DOM重排

### 3. 缓存验证
```javascript
// 验证节点仍在文档中
if (!document.contains(match.node)) {
  continue;
}
```

**作用：**
- 跳过已被移除的节点
- 避免DOM操作错误

---

## 📈 未来改进方向

### 1. 可视化高亮
标注前高亮所有匹配位置：
```
Found 3 matches:
[1] 🔵 first occurrence
[2] 🔵 second occurrence  
[3] 🔵 third occurrence
```

### 2. 智能匹配
- 忽略大小写
- 匹配词根（test, tests, testing）
- 正则表达式支持

### 3. 撤销功能
- 撤销最后一次标注
- 撤销某个特定标注
- 批量撤销

### 4. 导入/导出
- 保存标注到文件
- 在不同页面间共享标注
- 团队协作标注

---

## 📚 相关API文档

- [Selection API](https://developer.mozilla.org/en-US/docs/Web/API/Selection)
- [Range API](https://developer.mozilla.org/en-US/docs/Web/API/Range)
- [TreeWalker API](https://developer.mozilla.org/en-US/docs/Web/API/TreeWalker)
- [NodeFilter](https://developer.mozilla.org/en-US/docs/Web/API/NodeFilter)

---

生成时间: 2025-10-11
版本: 算法改进 v2.0
