# 翻译提供者与 Debug 模式状态同步修复

## 问题描述

当 debug 开关关闭时（例如第一次安装插件），虽然 UI 显示选中的是 Google 翻译，但实际使用的却是 debug 提供者。这是因为：

1. `content.js` 中默认的 `translationProvider` 被硬编码为 `'debug'`
2. 当用户第一次安装插件时，`chrome.storage.sync.get()` 使用的默认值也是 `'debug'`
3. 没有检查 debug 模式状态与提供者选择的一致性

## 修复方案

### 1. 更新 `content.js` 默认设置

**位置**: `content.js` 第 3-19 行和第 42-60 行

**修改前**:
```javascript
let settings = {
  translationProvider: 'debug',
  // ...
};

chrome.storage.sync.get({
  translationProvider: 'debug',
  // ...
}, function(items) {
  settings = items;
  applyTranslationSettings();
});
```

**修改后**:
```javascript
let settings = {
  translationProvider: 'google',
  // ...
};

chrome.storage.sync.get({
  translationProvider: 'google',
  // ...
}, function(items) {
  settings = items;
  
  // 如果 debug 模式关闭但提供者是 debug，则切换到 google
  if (settings.translationProvider === 'debug' && !settings.debugMode) {
    console.log('[Annotate-Translate] Debug mode is off but provider is debug, switching to google');
    settings.translationProvider = 'google';
    // 更新存储
    chrome.storage.sync.set({ translationProvider: 'google' });
  }
  
  applyTranslationSettings();
});
```

### 2. 更新 `options.js` 加载设置逻辑

**位置**: `options.js` `loadSettings()` 函数

**修改前**:
```javascript
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    // Feature toggles
    elements.enableTranslate.checked = settings.enableTranslate;
    // ...
  });
}
```

**修改后**:
```javascript
function loadSettings() {
  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    // 检查并修正状态不一致
    if (settings.translationProvider === 'debug' && !settings.enableDebugMode) {
      console.log('[Options] Debug mode is off but provider is debug, switching to google');
      settings.translationProvider = 'google';
      chrome.storage.sync.set({ translationProvider: 'google' });
    }
    
    // Feature toggles
    elements.enableTranslate.checked = settings.enableTranslate;
    // ...
  });
}
```

### 3. 更新 `options.js` 保存设置逻辑

**位置**: `options.js` `saveSettings()` 函数

**修改前**:
```javascript
function saveSettings() {
  const settings = {
    translationProvider: document.querySelector('input[name="provider"]:checked').value,
    // ...
  };
  // ...
}
```

**修改后**:
```javascript
function saveSettings() {
  // 获取选中的翻译提供者
  let selectedProvider = document.querySelector('input[name="provider"]:checked').value;
  const debugModeEnabled = elements.enableDebugMode.checked;
  
  // 如果 debug 模式关闭但选中的是 debug 提供者，则强制切换到 google
  if (selectedProvider === 'debug' && !debugModeEnabled) {
    console.log('[Options] Cannot select debug provider when debug mode is off, switching to google');
    selectedProvider = 'google';
    // 更新 UI
    const googleRadio = document.querySelector('input[name="provider"][value="google"]');
    if (googleRadio) {
      googleRadio.checked = true;
      updateProviderSelection('google');
    }
  }
  
  const settings = {
    translationProvider: selectedProvider,
    // ...
  };
  // ...
}
```

## 修复效果

### 场景 1: 首次安装插件
- **修复前**: `translationProvider` 默认为 `'debug'`，但 `debugMode` 为 `false`，导致状态不一致
- **修复后**: `translationProvider` 默认为 `'google'`，与 `debugMode: false` 保持一致

### 场景 2: 加载已有设置时发现不一致
- **修复前**: 如果存储中 `translationProvider` 是 `'debug'` 但 `debugMode` 为 `false`，直接使用不一致的状态
- **修复后**: 自动检测并修正，将 `translationProvider` 切换为 `'google'`，并更新存储

### 场景 3: 保存设置时尝试保存不一致状态
- **修复前**: 可能保存 `translationProvider: 'debug'` 但 `debugMode: false` 的不一致状态
- **修复后**: 保存前检查，如果 debug 模式关闭但选中 debug 提供者，强制切换到 google

### 场景 4: 关闭 debug 模式
- **已有逻辑**: `updateDebugProviderVisibility()` 函数会隐藏 debug 选项，并自动切换到 google（如果当前选中 debug）
- **现在增强**: 加上加载和保存时的检查，形成三重保护

## 测试验证

### 测试用例 1: 首次安装
1. 移除插件并重新安装
2. 打开设置页面
3. 验证：
   - ✅ Debug 模式开关应该是关闭状态
   - ✅ Debug 提供者选项应该是隐藏的
   - ✅ Google 翻译应该是选中状态
   - ✅ 控制台没有状态不一致的警告

### 测试用例 2: 修复已有的不一致状态
1. 通过 Chrome DevTools 手动设置不一致状态：
   ```javascript
   chrome.storage.sync.set({
     translationProvider: 'debug',
     enableDebugMode: false
   });
   ```
2. 刷新页面或重新打开插件
3. 验证：
   - ✅ 自动修正为 `translationProvider: 'google'`
   - ✅ 控制台显示修正日志
   - ✅ UI 显示正确状态

### 测试用例 3: 关闭 debug 模式时自动切换
1. 启用 debug 模式并选择 debug 提供者
2. 保存设置
3. 关闭 debug 模式
4. 再次保存
5. 验证：
   - ✅ 自动切换到 Google 翻译
   - ✅ UI 更新正确
   - ✅ 保存的设置一致

## 总结

通过以上修复：
1. ✅ 将默认 `translationProvider` 从 `'debug'` 改为 `'google'`
2. ✅ 在 `content.js` 加载设置时检查并修正不一致状态
3. ✅ 在 `options.js` 加载设置时检查并修正不一致状态
4. ✅ 在 `options.js` 保存设置时防止保存不一致状态
5. ✅ 保留原有的 `updateDebugProviderVisibility()` 逻辑

这样形成了多层防护，确保 debug 模式和翻译提供者状态始终保持一致。
