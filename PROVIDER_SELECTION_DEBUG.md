# Provider Selection Debug Guide

## 🔍 Current Issue
用户报告：在配置中选择了 youdao 提供者，但实际加载的是 google 提供者。

## 🛠️ Diagnostic Steps

### Step 1: 打开诊断页面
1. 在浏览器中打开 `test-provider-selection.html`
2. 查看 "Current Status" 部分
3. 检查 "Stored Provider" 和 "Active Provider" 是否匹配

### Step 2: 检查 Storage
1. 点击 "Check Storage" 按钮
2. 确认 `translationProvider` 的值
3. 如果值不是预期的，说明设置保存失败

### Step 3: 检查 Provider 注册
1. 点击 "Check Providers" 按钮
2. 确认所有 provider 都已注册（应该看到：debug, google, youdao, deepl, freedict, openai）
3. 检查 Active Provider 是哪一个

### Step 4: 测试 Provider 切换
1. 点击 "Set Youdao" 按钮
2. 观察控制台日志
3. 检查是否有错误信息
4. 确认 Provider 是否成功切换

### Step 5: 检查 Options 页面
1. 打开 `chrome-extension://[your-extension-id]/options.html`
2. 选择 Youdao 提供者
3. 点击保存
4. 打开浏览器开发者工具（F12）
5. 切换到 Console 标签
6. 刷新页面
7. 查找以下日志：
   - `[Annotate-Translate] Registered providers: [...]`
   - `[Annotate-Translate] Requested provider: youdao`
   - `[Annotate-Translate] Provider set to: youdao`

## 🐛 Possible Issues

### Issue 1: Provider 未注册
**症状**: Console 显示 "Provider 'youdao' not found"

**原因**: 
- `translation-service.js` 中 provider 注册失败
- 文件加载顺序错误

**解决方案**:
```javascript
// 检查 translation-service.js 末尾是否有：
translationService.registerProvider('youdao', new YoudaoTranslateProvider());
```

### Issue 2: setActiveProvider 抛出异常
**症状**: Console 显示错误但没有被捕获

**原因**: 
- `content.js` 中 `setActiveProvider` 调用没有 try-catch
- Provider 存在性检查失败

**解决方案**: ✅ 已修复
```javascript
try {
  translationService.setActiveProvider(settings.translationProvider);
  console.log('[Annotate-Translate] Provider set to:', settings.translationProvider);
} catch (error) {
  console.error('[Annotate-Translate] Failed to set provider:', error);
  settings.translationProvider = 'google';
  translationService.setActiveProvider('google');
  chrome.storage.sync.set({ translationProvider: 'google' });
}
```

### Issue 3: Storage 同步延迟
**症状**: 
- Options 页面显示正确的选择
- Content script 却读取到旧值

**原因**: 
- Chrome storage API 是异步的
- 页面刷新时可能读取到缓存的旧值

**解决方案**:
```javascript
// 在 options.js 保存设置后添加延迟
chrome.storage.sync.set(settings, () => {
  console.log('Settings saved, reloading tabs...');
  // 通知所有 tab 重新加载设置
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { action: 'reloadSettings' });
    });
  });
});
```

### Issue 4: Fallback 逻辑错误触发
**症状**: 
- Provider 已注册
- `providers.has('youdao')` 返回 false

**原因**: 
- Provider 名称不匹配（大小写、空格等）
- Map 对象未正确初始化

**检查方法**:
```javascript
console.log('Has youdao?', translationService.providers.has('youdao'));
console.log('All keys:', Array.from(translationService.providers.keys()));
```

## 📊 Expected Console Output

正常情况下，刷新页面应该看到：

```
[Annotate-Translate] Content script loaded on: https://example.com
[Annotate-Translate] Translation service available: TranslationService {...}
[Annotate-Translate] Settings loaded: {translationProvider: "youdao", ...}
[Annotate-Translate] Registered providers: ["debug", "google", "youdao", "deepl", "freedict", "openai"]
[Annotate-Translate] Requested provider: youdao
[Annotate-Translate] Provider set to: youdao
[TranslationService] Active provider set to: youdao
[Annotate-Translate] Youdao provider configured:
  - AppKey: Set
  - showPhoneticInAnnotation: true
```

## 🔧 Quick Fix Commands

### 重置 Provider 设置
在 Console 中运行：
```javascript
chrome.storage.sync.set({ translationProvider: 'youdao' }, () => {
  console.log('Provider reset to youdao');
  location.reload();
});
```

### 检查当前活动 Provider
```javascript
console.log('Active:', translationService.activeProvider);
console.log('Registered:', Array.from(translationService.providers.keys()));
```

### 强制设置 Provider
```javascript
translationService.setActiveProvider('youdao');
console.log('Forced to youdao');
```

## 📝 What We Fixed

1. ✅ **添加了 try-catch** 包裹 `setActiveProvider` 调用
2. ✅ **添加了详细日志** 显示所有已注册的 provider
3. ✅ **添加了错误恢复** 当设置失败时回退到 google
4. ✅ **创建了诊断页面** `test-provider-selection.html`

## 🎯 Next Steps

请用户：
1. 重新加载扩展（在 chrome://extensions 页面点击刷新）
2. 打开任意网页
3. 按 F12 打开开发者工具
4. 查看 Console 标签中的日志
5. 截图发送以下信息：
   - `[Annotate-Translate] Registered providers: [...]`
   - `[Annotate-Translate] Requested provider: ...`
   - 任何错误或警告信息

如果问题仍然存在，打开 `test-provider-selection.html` 进行深度诊断。
