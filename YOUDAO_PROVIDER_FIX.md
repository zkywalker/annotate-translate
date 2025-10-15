# Provider Selection Bug Fix - Youdao Issue

## 🐛 Bug Report
**问题**: 用户在配置中选择了 youdao 提供者，但实际加载的是 google 提供者。

**影响范围**: 所有 provider 切换可能都受影响

## 🔍 Root Cause Analysis

### Primary Issue: Settings Merge Problem
当从 popup 或 options 更新设置时，`updateSettings` 消息处理存在问题：

**旧代码** (content.js:1080-1088):
```javascript
} else if (request.action === 'updateSettings') {
  settings = request.settings || settings;  // ❌ 完全替换
  console.log('[Annotate-Translate] Settings updated:', settings);
  applyTranslationSettings();
  sendResponse({success: true});
}
```

**问题**:
1. popup.js 只发送 4 个字段：enableTranslate, enableAnnotate, targetLanguage, translationProvider
2. `settings = request.settings` **完全替换**了 settings 对象
3. 其他字段丢失：youdaoAppKey, youdaoAppSecret, deeplApiKey, openaiApiKey 等
4. Provider 配置失败，可能触发 fallback 回退到 google

### Secondary Issue: Error Handling
`setActiveProvider` 可能抛出异常但没有被捕获。

## ✅ Solutions

### Fix 1: Reload Settings from Storage
```javascript
} else if (request.action === 'updateSettings') {
  // 从 storage 重新加载所有设置
  chrome.storage.sync.get(null, function(items) {
    settings = Object.assign({}, settings, items);
    console.log('[Annotate-Translate] Settings reloaded from storage:', settings);
    applyTranslationSettings();
    sendResponse({success: true});
  });
  return true; // 异步响应
}
```

### Fix 2: Add Error Handling & Logging
```javascript
function applyTranslationSettings() {
  // 打印所有已注册的 providers
  console.log('[Annotate-Translate] Registered providers:', 
    Array.from(translationService.providers.keys()));
  console.log('[Annotate-Translate] Requested provider:', 
    settings.translationProvider);
  
  try {
    translationService.setActiveProvider(settings.translationProvider);
    console.log('[Annotate-Translate] Provider set to:', 
      settings.translationProvider);
  } catch (error) {
    console.error('[Annotate-Translate] Failed to set provider:', error);
    // 出错时回退到 google
    settings.translationProvider = 'google';
    translationService.setActiveProvider('google');
    chrome.storage.sync.set({ translationProvider: 'google' });
  }
}
```

## 📊 Files Modified
- content.js: 添加日志、错误处理、修复 updateSettings

## 🎯 Diagnostic Tools
- test-provider-selection.html: 实时诊断页面
- PROVIDER_SELECTION_DEBUG.md: 调试指南

## 🚀 Testing
1. 重新加载扩展
2. 切换 provider
3. 检查 Console 日志
4. 确认 provider 正确切换

## ✨ Status
✅ Fixed - User needs to reload extension and test
