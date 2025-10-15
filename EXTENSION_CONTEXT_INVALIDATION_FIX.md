# Extension Context Invalidation 错误修复

## 问题描述

用户报告了一个bug：在注释功能成功标注单词后，会出现以下错误：

```
content.js:878 [Annotate-Translate] Failed to create ruby annotation: 
Error: Extension context invalidated.
    at saveAnnotation (content.js:1049:24)
    at createRubyAnnotation (content.js:871:5)
    at promptAndAnnotate (content.js:783:5)
```

虽然注释在页面上已经成功显示，但控制台会报错。

## 根本原因

"Extension context invalidated" 是 Chrome 扩展中的常见错误，发生在以下情况：

1. **扩展重新加载**：开发者在开发时重新加载扩展
2. **扩展更新**：扩展自动更新到新版本
3. **扩展禁用/启用**：用户手动禁用后重新启用扩展

当这些情况发生时：
- 旧的 content script 仍在页面中运行
- 但与 background script 的连接已断开
- 所有 `chrome.*` API 调用都会失败并抛出此错误

在本例中，`saveAnnotation` 函数尝试使用 `chrome.storage.local` API 保存注释数据到存储中，此时扩展上下文已失效，导致错误。

## 解决方案

### 1. 添加扩展上下文检查函数

在文件开头添加通用的上下文检查函数：

```javascript
/**
 * 检查扩展上下文是否有效
 * @returns {boolean} 如果扩展上下文有效返回 true
 */
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}
```

### 2. 修复 `saveAnnotation` 函数

在保存注释前检查上下文，并使用 try-catch 捕获错误：

```javascript
function saveAnnotation(baseText, annotationText) {
  // Check if extension context is still valid
  if (!chrome.runtime?.id) {
    console.warn('[Annotate-Translate] Extension context invalidated, skipping annotation save');
    return;
  }
  
  try {
    chrome.storage.local.get({annotations: []}, function(result) {
      // Check for chrome.runtime.lastError
      if (chrome.runtime.lastError) {
        console.warn('[Annotate-Translate] Failed to save annotation:', chrome.runtime.lastError.message);
        return;
      }
      
      const annotations = result.annotations;
      annotations.push({
        baseText: baseText,
        annotationText: annotationText || '',
        timestamp: Date.now(),
        url: window.location.href
      });
      
      chrome.storage.local.set({annotations: annotations}, function() {
        if (chrome.runtime.lastError) {
          console.warn('[Annotate-Translate] Failed to save annotation:', chrome.runtime.lastError.message);
        }
      });
    });
  } catch (error) {
    // Silently handle extension context invalidation
    // The annotation is already created in the DOM, so this is not a critical error
    console.warn('[Annotate-Translate] Failed to save annotation:', error.message);
  }
}
```

### 3. 修复 `init` 函数

在初始化时检查上下文，并为所有 storage 操作添加错误处理：

```javascript
function init() {
  console.log('[Annotate-Translate] Content script loaded on:', window.location.href);
  
  // 检查扩展上下文
  if (!isExtensionContextValid()) {
    console.error('[Annotate-Translate] Extension context is invalid, script will not initialize');
    return;
  }
  
  // ... 其他初始化代码
  
  try {
    chrome.storage.sync.get({...}, function(items) {
      // Check if context is still valid in callback
      if (chrome.runtime.lastError) {
        console.error('[Annotate-Translate] Failed to load settings:', chrome.runtime.lastError.message);
        return;
      }
      
      settings = items;
      // ... 处理设置
    });
  } catch (error) {
    console.error('[Annotate-Translate] Error loading settings:', error.message);
  }
}
```

### 4. 修复 `clearAllAnnotations` 函数

```javascript
function clearAllAnnotations() {
  // ... 清除 DOM 中的注释
  
  annotations.clear();
  
  // Clear from storage
  if (isExtensionContextValid()) {
    try {
      chrome.storage.local.set({annotations: []}, function() {
        if (chrome.runtime.lastError) {
          console.warn('[Annotate-Translate] Failed to clear annotations from storage:', chrome.runtime.lastError.message);
        }
      });
    } catch (error) {
      console.warn('[Annotate-Translate] Failed to clear annotations from storage:', error.message);
    }
  }
}
```

### 5. 修复 `applyTranslationSettings` 函数

为所有 `chrome.storage.sync.set` 调用添加错误处理：

```javascript
if (isExtensionContextValid()) {
  try {
    chrome.storage.sync.set({ translationProvider: 'google' }, function() {
      if (chrome.runtime.lastError) {
        console.warn('[Annotate-Translate] Failed to update provider:', chrome.runtime.lastError.message);
      }
    });
  } catch (error) {
    console.warn('[Annotate-Translate] Failed to update provider:', error.message);
  }
}
```

### 6. 修复 `handleMessage` 函数

```javascript
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    if (!isExtensionContextValid()) {
      sendResponse({success: false, error: 'Extension context invalidated'});
      return true;
    }
    
    try {
      chrome.storage.sync.get(null, function(items) {
        if (chrome.runtime.lastError) {
          console.error('[Annotate-Translate] Failed to reload settings:', chrome.runtime.lastError.message);
          sendResponse({success: false, error: chrome.runtime.lastError.message});
          return;
        }
        
        settings = Object.assign({}, settings, items);
        applyTranslationSettings();
        sendResponse({success: true});
      });
    } catch (error) {
      console.error('[Annotate-Translate] Error reloading settings:', error.message);
      sendResponse({success: false, error: error.message});
    }
    return true;
  }
  // ... 其他消息处理
}
```

## 修改的文件

- `content.js` - 所有涉及 chrome API 调用的函数

## 修复效果

1. **不再抛出错误**：扩展上下文失效时，静默处理而不是抛出错误
2. **用户体验不变**：注释仍然成功创建并显示在页面上
3. **优雅降级**：存储操作失败不影响核心功能
4. **更好的日志**：使用 `console.warn` 而不是错误，提供清晰的诊断信息

## 防御性编程最佳实践

1. **总是检查 `chrome.runtime.lastError`**：在所有异步 chrome API 回调中
2. **使用 try-catch**：包裹所有 chrome API 调用
3. **检查上下文有效性**：在调用 API 前使用 `isExtensionContextValid()`
4. **优雅降级**：非关键功能失败时不应影响主要功能
5. **清晰的日志**：区分警告和错误，帮助调试

## 测试建议

1. 正常使用注释功能 - 应该正常工作
2. 标注单词后重新加载扩展 - 不应看到错误
3. 标注单词后禁用再启用扩展 - 不应看到错误
4. 检查控制台 - 应该看到警告而不是错误

## 相关文档

- [Chrome Extension Context Invalidation](https://developer.chrome.com/docs/extensions/mv3/messaging/#port-lifetime)
- [Chrome Storage API Error Handling](https://developer.chrome.com/docs/extensions/reference/storage/)
