# ❌ 错误修复指南

## 错误：Could not establish connection. Receiving end does not exist.

### 🎯 这个错误是什么意思？

这个错误表示：
- ✉️ Background script 试图向页面发送消息
- ❌ 但页面中没有 Content Script 在监听
- 🔧 Content Script 没有被注入到当前页面

### 🛠️ 修复步骤（按顺序执行）

#### ✅ 步骤 1: 重新加载插件
```
1. 打开 chrome://extensions/
2. 找到 "Annotate Translate" 插件
3. 点击刷新图标 🔄
4. 确认插件状态为"已启用"
```

#### ✅ 步骤 2: 刷新测试页面
```
1. 回到你的测试页面
2. 按 F5 或 Ctrl+R 刷新页面
3. 等待页面完全加载
```

#### ✅ 步骤 3: 验证 Content Script 已加载
```
1. 在页面上按 F12 打开 DevTools
2. 切换到 Console 标签
3. 应该看到日志：
   "[Annotate-Translate] Content script loaded on: [页面URL]"
   "[Annotate-Translate] Settings loaded: {...}"
```

#### ✅ 步骤 4: 测试功能
```
1. 在页面上选中一些文字
2. 右键点击
3. 选择 "Annotate [选中的文字]"
4. 输入标注文本
5. 查看效果
```

### 🔍 为什么会出现这个错误？

**主要原因：**

1. **页面在插件加载前就已经打开**
   - Content Script 只注入到**新加载的页面**
   - 已经打开的页面需要**手动刷新**

2. **插件刚刚更新/重新加载**
   - 更新插件后，所有已打开的页面都需要刷新
   - 刷新后 Content Script 才会重新注入

3. **某些特殊页面不允许注入**
   - Chrome内部页面（chrome://...）
   - Chrome Web Store 页面
   - 新标签页（New Tab）
   - 解决方法：在普通网页上测试

### 🆕 已添加的自动修复功能

最新版本已经添加了**自动注入机制**：

```javascript
// 现在插件会自动检测并注入 Content Script
// 但首次使用时仍建议刷新页面以确保稳定
```

**工作原理：**
1. 用户点击右键菜单
2. Background Script 先发送 "ping" 消息检测
3. 如果没有响应，自动注入 Content Script
4. 然后再发送实际的功能消息

**注意：** 虽然有自动注入，但**刷新页面仍是最可靠的方式**！

### 📋 完整的故障排除清单

- [ ] 插件已在 `chrome://extensions/` 中启用
- [ ] 开发者模式已开启
- [ ] 插件已重新加载（点击刷新🔄）
- [ ] 测试页面已刷新（按F5）
- [ ] 不是在 Chrome 特殊页面上测试
- [ ] DevTools Console 中能看到 Content Script 加载日志
- [ ] Service Worker Console 中能看到菜单点击日志
- [ ] manifest.json 中包含 "scripting" 权限
- [ ] content.js 和 content.css 文件存在

### 🧪 快速验证脚本

在页面的 Console 中执行以下代码，检查 Content Script 是否存在：

```javascript
// 检查 Content Script 是否注入
chrome.runtime.sendMessage({action: 'ping'}, (response) => {
  if (chrome.runtime.lastError) {
    console.error('❌ Content Script 未注入:', chrome.runtime.lastError.message);
  } else if (response && response.pong) {
    console.log('✅ Content Script 已正常加载');
  }
});
```

### 🎓 学到的知识点

1. **Content Script 注入时机**
   - 页面加载时（由 manifest.json 配置）
   - 或者通过 `chrome.scripting.executeScript()` 动态注入

2. **Manifest V3 的变化**
   - 需要 `scripting` 权限才能动态注入
   - Service Worker 替代了 Background Page

3. **消息传递机制**
   - Background ↔️ Content Script 通过 `chrome.tabs.sendMessage()`
   - 需要确保接收方存在并在监听

4. **最佳实践**
   - 总是添加错误处理
   - 添加日志便于调试
   - 提供用户友好的错误提示

---

## 其他常见错误

### 错误：Cannot access contents of url "chrome://..."

**原因：** Chrome 不允许在内部页面注入 Content Script

**解决：** 在普通网页上测试（如 test.html 或任何网站）

### 错误：Extension context invalidated

**原因：** 插件被重新加载，旧的上下文已失效

**解决：** 刷新所有使用插件的页面

### 错误：Cannot read properties of undefined

**原因：** 对象或变量未正确初始化

**解决：** 检查 Console 日志，查看具体是哪个变量

---

## 📞 仍然有问题？

1. 查看 Service Worker Console：有无错误信息？
2. 查看页面 Console：Content Script 是否加载？
3. 检查 Network 标签：资源是否正确加载？
4. 查看 Elements 标签：DOM 是否正确修改？

记住：**刷新页面通常能解决 90% 的问题！** 🔄

---

生成时间: 2025-10-11
版本: 修复了 "Receiving end does not exist" 错误
