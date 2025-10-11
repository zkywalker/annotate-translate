# 🐛 快速调试参考

## 问题：右键Annotate功能不添加标注

### ✅ 已修复的问题
我发现并修复了主要问题：
- **原因**：当用户右键点击菜单时，页面的文本选择（selection）已经丢失
- **解决方案**：改用DOM遍历的方式查找并标注文本，不依赖`window.getSelection()`

### 🔄 需要做的事

1. **重新加载插件**
   - 打开 `chrome://extensions/`
   - 找到 "Annotate Translate"
   - 点击刷新图标 🔄

2. **测试功能**
   - 用浏览器打开 `test.html` 文件
   - 按 `F12` 打开DevTools
   - 选中一些文字
   - 右键 → "Annotate ..."
   - 输入标注文本
   - 查看效果

---

## 📊 Chrome插件调试三步法

### 1️⃣ 调试 Background Script (Service Worker)
```
位置: chrome://extensions/ → 点击 "service worker"
作用: 查看右键菜单事件、消息发送
日志: [Annotate-Translate BG] 开头
```

### 2️⃣ 调试 Content Script
```
位置: 测试页面 → F12 → Console标签
作用: 查看页面中的标注逻辑执行
日志: [Annotate-Translate] 开头
```

### 3️⃣ 调试 Popup
```
位置: 右键插件图标 → "检查"
作用: 查看设置界面的逻辑
```

---

## 🔍 调试流程图

```
用户右键点击 "Annotate"
         ↓
[Background] 接收点击事件
         ↓ (sendMessage)
[Content Script] 接收消息 
         ↓
弹出prompt对话框
         ↓
用户输入标注文本
         ↓
遍历DOM查找文本节点
         ↓
创建 <ruby> 标签
         ↓
显示标注效果 ✓
```

---

## 🎯 关键检查点

### ✓ Service Worker Console 应该显示：
```
[Annotate-Translate BG] Context menu clicked: annotate-text Text: [选中的文字]
[Annotate-Translate BG] Annotate message sent successfully
```

### ✓ 网页 Console 应该显示：
```
[Annotate-Translate] Received message: {action: 'annotate', text: '...'}
[Annotate-Translate] Annotating text: ...
[Annotate-Translate] Creating ruby annotation for: ... with: ...
[Annotate-Translate] Ruby annotation created successfully
```

### ✓ DOM 中应该有：
```html
<ruby class="annotate-translate-ruby" data-annotation="标注" data-base-text="文字">
    文字
    <rt class="annotate-translate-rt">标注</rt>
</ruby>
```

---

## ⚠️ 常见问题速查

| 问题 | 原因 | 解决方法 |
|------|------|----------|
| 没有右键菜单 | 插件未加载或权限不足 | 重新加载插件 |
| 菜单点击无反应 | Service Worker休眠 | 查看Service Worker日志 |
| 没有prompt对话框 | Content Script未接收消息 | 刷新测试页面 |
| 标注没显示 | CSS未加载或DOM操作失败 | 检查Elements和Console |
| "Receiving end does not exist" | Content Script未注入 | 刷新页面 |

---

## 💡 调试技巧

### 快速检查存储
```javascript
// 在任意Console执行
chrome.storage.local.get(null, console.log);
chrome.storage.sync.get(null, console.log);
```

### 查看所有标注
```javascript
// 在网页Console执行
document.querySelectorAll('ruby.annotate-translate-ruby');
```

### 清除所有标注
```javascript
// 在网页Console执行
chrome.runtime.sendMessage({action: 'clearAnnotations'});
```

### 手动触发标注（测试）
```javascript
// 在网页Console执行
chrome.runtime.sendMessage({action: 'annotate', text: 'test'});
```

---

## 📱 测试清单

- [ ] 打开 `chrome://extensions/`
- [ ] 确认插件已启用
- [ ] 开启开发者模式
- [ ] 点击插件的刷新按钮
- [ ] 打开 Service Worker DevTools
- [ ] 用浏览器打开 `test.html`
- [ ] 按 F12 打开网页 DevTools
- [ ] 选中文字并右键
- [ ] 确认看到 "Annotate" 菜单项
- [ ] 点击菜单项
- [ ] 输入标注文本
- [ ] 查看标注是否显示

---

## 🎨 标注样式说明

标注使用 HTML `<ruby>` 标签：
- 基础文本在下方（正常大小）
- 标注文本在上方（小号、蓝色）
- 鼠标悬停时会有高亮效果

CSS控制在 `content.css` 文件中。

---

## 📚 参考文件

- `DEBUG_GUIDE.md` - 完整调试指南
- `test.html` - 测试页面
- `content.js` - Content Script（已修复）
- `background.js` - Service Worker（已添加日志）

---

生成时间: 2025-10-11
