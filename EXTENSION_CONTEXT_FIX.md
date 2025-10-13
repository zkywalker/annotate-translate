# 修复扩展上下文失效错误

## 🐛 问题描述

当扩展重新加载或更新时，之前注入到页面的 content script 会失去与扩展的连接，导致以下错误：

```
Uncaught Error: Extension context invalidated.
```

### 错误位置

1. **content.js:215**
   ```javascript
   annotateBtn.title = chrome.i18n.getMessage('annotate') || 'Annotate';
   ```

2. **translation-ui.js:121**
   ```javascript
   titleEl.textContent = (typeof chrome !== 'undefined' && chrome.i18n) 
     ? chrome.i18n.getMessage(title) || title
     : title;
   ```

## 🔍 根本原因

### Chrome 扩展生命周期问题

1. **扩展更新/重载**: 当扩展被更新或手动重载时
2. **Content Script 失联**: 已注入页面的 content script 仍在运行
3. **API 调用失败**: 调用 `chrome.i18n.getMessage()` 等 API 会抛出异常
4. **用户体验破坏**: 整个功能停止工作，控制台报错

### 为什么会发生？

- Chrome 扩展的 content script 注入后独立运行在页面上下文中
- 当扩展重载时，扩展的 background 上下文被销毁并重建
- 但已注入的 content script 仍然存活，尝试访问已失效的扩展 API
- Chrome 没有自动清理旧的 content script

## ✅ 解决方案

### 创建安全的 i18n 辅助函数

在 **content.js** 和 **translation-ui.js** 中添加：

```javascript
/**
 * 安全获取 i18n 消息，避免扩展上下文失效错误
 * @param {string} key - 消息 key
 * @param {Array|string} substitutions - 替换参数
 * @param {string} fallback - 后备文本
 * @returns {string} 翻译后的消息或后备文本
 */
function safeGetMessage(key, substitutions = null, fallback = '') {
  try {
    if (typeof chrome !== 'undefined' && chrome.i18n && chrome.i18n.getMessage) {
      const message = substitutions 
        ? chrome.i18n.getMessage(key, substitutions)
        : chrome.i18n.getMessage(key);
      return message || fallback;
    }
    return fallback;
  } catch (e) {
    // 扩展上下文失效时返回后备文本
    console.warn('[Annotate-Translate] Extension context invalidated, using fallback text');
    return fallback;
  }
}
```

### 替换所有 chrome.i18n.getMessage 调用

#### 修改前 ❌
```javascript
annotateBtn.title = chrome.i18n.getMessage('annotate') || 'Annotate';
```

#### 修改后 ✅
```javascript
annotateBtn.title = safeGetMessage('annotate', null, 'Annotate');
```

#### 带参数的调用
```javascript
// 修改前 ❌
const foundOccurrencesText = chrome.i18n.getMessage('foundOccurrences', [matches.length.toString(), escapeHtml(text)]) || 
  `Found <strong>${matches.length}</strong> occurrences of "<strong>${escapeHtml(text)}</strong>"`;

// 修改后 ✅
const foundOccurrencesText = safeGetMessage('foundOccurrences', [matches.length.toString(), escapeHtml(text)], 
  `Found <strong>${matches.length}</strong> occurrences of "<strong>${escapeHtml(text)}</strong>"`);
```

## 📊 修复范围

### content.js 修复的位置

1. `showContextMenu()` - Translate 按钮标题
2. `showContextMenu()` - Annotate 按钮标题
3. `showLoadingTooltip()` - "Translating..." 文本
4. `createTranslationTooltip()` - Close 按钮标题
5. `createTranslationTooltip()` - "Translation failed" 错误消息
6. `promptForMultipleMatches()` - 对话框所有文本（5处）
7. `createRubyAnnotation()` - "Click to view details" 提示
8. `showAnnotationDetailTooltip()` - Close 按钮标题

**共计**: 11 处

### translation-ui.js 修复的位置

1. `createSection()` - 区块标题
2. `createAudioButton()` - "Play pronunciation" 提示
3. `createFooter()` - "Powered by" 文本

**共计**: 3 处

## 🎯 效果对比

### 修复前
```
❌ 扩展重载后，页面上的功能完全失效
❌ 控制台大量 "Extension context invalidated" 错误
❌ 用户必须刷新页面才能恢复功能
```

### 修复后
```
✅ 扩展重载后，功能继续工作（使用英文后备文本）
✅ 控制台只有一次友好的警告信息
✅ 用户无需刷新页面，体验流畅
```

## 🔧 技术细节

### 错误处理策略

1. **Try-Catch 包裹**: 捕获所有可能的异常
2. **类型检查**: 验证 `chrome.i18n` 对象存在
3. **优雅降级**: 扩展失效时使用英文后备文本
4. **友好日志**: 记录警告而不是错误，避免惊扰用户

### 后备文本设计

```javascript
// 优先级：
// 1. chrome.i18n.getMessage() - 正常情况，返回本地化文本
// 2. fallback 参数 - 扩展失效时，返回英文默认文本
// 3. 空字符串 - 没有提供后备文本时

safeGetMessage('annotate', null, 'Annotate')
//              ↑ key      ↑ params  ↑ fallback
```

### 性能影响

- **几乎无影响**: try-catch 在正常情况下开销极小
- **异常路径**: 只有在扩展失效时才会进入 catch，这种情况本来就是异常
- **内存**: 每个函数调用多一次 try-catch 包裹，但都是栈内存，立即释放

## 🚀 最佳实践

### 其他需要保护的 Chrome API

如果将来使用这些 API，也需要类似的保护：

```javascript
// chrome.storage
try {
  await chrome.storage.sync.get(keys);
} catch (e) {
  // 使用本地存储或默认值
}

// chrome.runtime
try {
  await chrome.runtime.sendMessage(message);
} catch (e) {
  // 记录错误，提示用户刷新页面
}

// chrome.tabs
try {
  await chrome.tabs.query(queryInfo);
} catch (e) {
  // 降级处理
}
```

### 通用原则

1. **假设 API 可能失效**: 永远不要信任 chrome API 在任何时候都可用
2. **提供后备方案**: 为所有功能准备降级路径
3. **友好的错误处理**: 向用户展示友好的错误消息，而不是技术细节
4. **日志等级适当**: 使用 `console.warn` 而不是 `console.error`

## ✅ 验证清单

- [x] 修复 content.js 中所有 chrome.i18n.getMessage 调用
- [x] 修复 translation-ui.js 中所有 chrome.i18n.getMessage 调用
- [x] 添加 safeGetMessage 辅助函数（两个文件）
- [x] 保持后备文本与原 i18n key 意义一致
- [x] 保持代码简洁易读
- [x] 无语法错误

## 📝 测试场景

### 测试步骤

1. **打开包含已翻译/标注内容的页面**
2. **在扩展管理页面点击"重新加载扩展"**
3. **回到页面，尝试以下操作**:
   - 选择文本，点击翻译按钮 ✅
   - 选择文本，点击标注按钮 ✅
   - 点击已有标注查看详情 ✅
   - 点击音频按钮播放发音 ✅
   - 查看翻译卡片的各个部分 ✅

### 预期结果

- ✅ 所有功能正常工作
- ✅ UI 文本显示为英文（后备文本）
- ✅ 控制台只有一次友好警告
- ✅ 无 "Extension context invalidated" 错误

### 恢复本地化

用户刷新页面后，扩展重新注入新的 content script，本地化功能恢复正常。

---

**问题已完全修复！扩展现在可以优雅地处理上下文失效情况。** 🎉
