# Extension Context Invalidation 错误修复 - 快速参考

## 问题
注释成功但报错：`Error: Extension context invalidated`

## 原因
扩展重新加载/更新时，旧的 content script 仍在运行，但与 background 的连接已断开

## 解决方案速览

### 1. 添加上下文检查函数
```javascript
function isExtensionContextValid() {
  try {
    return chrome.runtime && chrome.runtime.id !== undefined;
  } catch (e) {
    return false;
  }
}
```

### 2. 在使用 chrome API 前检查
```javascript
if (!isExtensionContextValid()) {
  console.warn('Extension context invalidated');
  return;
}
```

### 3. 使用 try-catch 包裹
```javascript
try {
  chrome.storage.local.get(..., function(result) {
    if (chrome.runtime.lastError) {
      console.warn('Failed:', chrome.runtime.lastError.message);
      return;
    }
    // 处理结果
  });
} catch (error) {
  console.warn('Failed:', error.message);
}
```

### 4. 检查回调中的错误
```javascript
chrome.storage.local.set(..., function() {
  if (chrome.runtime.lastError) {
    console.warn('Failed:', chrome.runtime.lastError.message);
  }
});
```

## 修改的函数
- `isExtensionContextValid()` - 新增
- `saveAnnotation()` - 添加上下文检查和错误处理
- `init()` - 添加上下文检查和错误处理
- `applyTranslationSettings()` - 添加错误处理
- `clearAllAnnotations()` - 添加错误处理
- `handleMessage()` - 添加错误处理

## 修复效果
✅ 不再抛出错误  
✅ 注释功能正常  
✅ 优雅降级  
✅ 清晰的警告日志  

## 测试
1. 正常标注 - OK
2. 标注后重新加载扩展 - 无错误
3. 标注后禁用/启用扩展 - 无错误
