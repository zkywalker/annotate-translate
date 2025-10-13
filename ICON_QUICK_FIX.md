# 🎯 图标显示问题 - 快速修复指南

## 问题
- ✅ 设置页图标正常
- ❌ 翻译弹窗/标注图标不显示

## 原因
HTML 页面与内容脚本加载机制不同

## 解决方案（3 步）

### 1️⃣ lucide-loader.js
```javascript
// 添加事件通知
script.async = false;  // 改为同步
script.onload = function() {
  lucide.createIcons();
  window.dispatchEvent(new CustomEvent('lucide-ready')); // ⭐ 新增
};
```

### 2️⃣ content.js  
```javascript
// 新增辅助函数
function initializeLucideIcon(container) {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    requestAnimationFrame(() => {
      lucide.createIcons({ nameAttr: 'data-lucide' }); // ⭐ 正确参数
    });
  } else {
    window.addEventListener('lucide-ready', () => {
      requestAnimationFrame(() => {
        lucide.createIcons({ nameAttr: 'data-lucide' });
      });
    }, { once: true });
  }
}

// 在 createAudioButton() 中使用
initializeLucideIcon(button);  // 替换旧的 setTimeout
```

### 3️⃣ translation-ui.js
```javascript
// 添加类方法（同 content.js 的 initializeLucideIcon）
class TranslationUI {
  initializeLucideIcon(container) { /* 同上 */ }
  
  createAudioButton() {
    // ...
    this.initializeLucideIcon(button); // 使用新方法
  }
}
```

## 核心改进

| 问题 | 旧方案 | 新方案 |
|------|--------|--------|
| 加载时机 | `setTimeout(..., 0)` ❌ | `requestAnimationFrame` ✅ |
| 初始化参数 | `{ icons: { 'volume-2': lucide.Volume2 } }` ❌ | `{ nameAttr: 'data-lucide' }` ✅ |
| 异步处理 | 无等待机制 ❌ | `lucide-ready` 事件 ✅ |

## 测试
```javascript
// 控制台应该看到
[Lucide] Loaded successfully from extension
[Lucide] Icons initialized

// 手动测试
lucide.createIcons({ nameAttr: 'data-lucide' });
```

## 文件清单
- ✅ lucide-loader.js - 事件通知
- ✅ content.js - 辅助函数
- ✅ translation-ui.js - 类方法

## 结果
✅ 所有图标正常显示  
✅ 无 CSP 错误  
✅ 无 JS 错误

## 详细文档
📚 ICON_FIX_COMPLETE.md  
📚 CONTENT_SCRIPT_ICONS_FIX.md  
🧪 test-content-script-icons.html
