# 快速测试：翻译提供者与 Debug 模式同步

## 快速验证步骤

### 方式 1: 通过 Chrome DevTools 验证

1. **打开扩展的 Service Worker 控制台**：
   ```bash
   # 访问 chrome://extensions/
   # 找到 "Annotate Translate" 扩展
   # 点击 "Service Worker" 链接打开控制台
   ```

2. **检查当前设置**：
   ```javascript
   chrome.storage.sync.get(null, (data) => {
     console.log('Current settings:', data);
     console.log('Provider:', data.translationProvider);
     console.log('Debug Mode:', data.enableDebugMode);
   });
   ```

3. **预期结果**（首次安装或默认状态）：
   ```javascript
   {
     translationProvider: 'google',  // ✅ 应该是 'google'，不是 'debug'
     enableDebugMode: false          // ✅ 应该是 false
   }
   ```

### 方式 2: 模拟不一致状态并验证自动修复

1. **设置不一致状态**：
   ```javascript
   // 在 Service Worker 控制台执行
   chrome.storage.sync.set({
     translationProvider: 'debug',
     enableDebugMode: false
   }, () => {
     console.log('Set inconsistent state');
   });
   ```

2. **刷新任意网页标签页**（触发 content script 重新加载）

3. **检查是否自动修复**：
   ```javascript
   chrome.storage.sync.get(['translationProvider', 'enableDebugMode'], (data) => {
     console.log('After auto-fix:', data);
     // 预期: translationProvider 应该自动变为 'google'
   });
   ```

4. **查看控制台日志**：
   - 应该看到: `[Annotate-Translate] Debug mode is off but provider is debug, switching to google`

### 方式 3: 通过设置页面验证

1. **打开设置页面**：
   ```bash
   # 右键点击扩展图标 -> "选项"
   # 或访问 chrome://extensions/ -> "Annotate Translate" -> "扩展程序选项"
   ```

2. **验证默认状态**：
   - ✅ Debug 模式开关应该是**关闭**状态
   - ✅ Debug 翻译提供者选项应该是**隐藏**的
   - ✅ Google 翻译应该是**选中**状态

3. **测试 debug 模式切换**：
   - 启用 debug 模式 → Debug 选项应该显示
   - 选择 debug 提供者 → 保存
   - 关闭 debug 模式 → 应该自动切换回 Google
   - 保存 → 验证设置正确

### 方式 4: 测试首次安装场景

1. **移除扩展**：
   ```bash
   # chrome://extensions/
   # 点击 "移除" 按钮
   ```

2. **重新安装扩展**（通过 "加载已解压的扩展程序"）

3. **检查初始设置**：
   ```javascript
   chrome.storage.sync.get(null, (data) => {
     console.log('First install settings:', data);
     // translationProvider 应该是 'google'
     // enableDebugMode 应该是 false
   });
   ```

4. **打开任意网页**，选中文本，验证翻译功能是否使用 Google 翻译

## 验证清单

- [ ] 首次安装时，`translationProvider` 默认为 `'google'`
- [ ] 首次安装时，Debug 选项在设置页面中隐藏
- [ ] 手动设置不一致状态后，自动修复为一致状态
- [ ] 控制台显示相应的修复日志
- [ ] 关闭 debug 模式时，如果选中 debug 提供者，自动切换到 Google
- [ ] 保存设置时，不允许保存不一致状态
- [ ] UI 显示与实际使用的提供者一致

## 常见问题排查

### Q: 如何确认当前使用的是哪个提供者？

A: 在网页上选中文本触发翻译，查看 console：
```javascript
// 应该看到类似的日志：
[Annotate-Translate] Provider set to: google
```

### Q: 如何查看完整的设置？

A: 在 Service Worker 控制台执行：
```javascript
chrome.storage.sync.get(null, console.log);
```

### Q: 如何重置所有设置？

A: 在设置页面点击 "重置为默认设置" 按钮，或在控制台执行：
```javascript
chrome.storage.sync.clear(() => {
  console.log('Settings cleared');
  location.reload();
});
```

## 修复前后对比

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 首次安装 | provider: `'debug'` ❌ | provider: `'google'` ✅ |
| 不一致状态 | 继续使用错误状态 ❌ | 自动修复 ✅ |
| UI 显示 | 可能与实际不符 ❌ | 始终一致 ✅ |
| 控制台日志 | 无警告 ❌ | 显示修复日志 ✅ |

## 自动化测试脚本

可以在 Service Worker 控制台运行以下脚本进行自动化测试：

```javascript
async function testProviderDebugSync() {
  console.log('=== Testing Provider-Debug Sync ===');
  
  // Test 1: Check default values
  console.log('\n[Test 1] Checking default values...');
  const defaults = await chrome.storage.sync.get(['translationProvider', 'enableDebugMode']);
  console.log('Provider:', defaults.translationProvider);
  console.log('Debug Mode:', defaults.enableDebugMode);
  console.assert(
    defaults.translationProvider === 'google', 
    'Default provider should be google'
  );
  console.assert(
    defaults.enableDebugMode === false, 
    'Default debug mode should be false'
  );
  
  // Test 2: Simulate inconsistent state
  console.log('\n[Test 2] Simulating inconsistent state...');
  await chrome.storage.sync.set({
    translationProvider: 'debug',
    enableDebugMode: false
  });
  console.log('Set inconsistent state (provider: debug, debugMode: false)');
  
  // Wait for content script to fix it
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if it was fixed
  const fixed = await chrome.storage.sync.get(['translationProvider', 'enableDebugMode']);
  console.log('After auto-fix - Provider:', fixed.translationProvider);
  console.assert(
    fixed.translationProvider === 'google', 
    'Provider should be auto-fixed to google'
  );
  
  // Test 3: Reset to defaults
  console.log('\n[Test 3] Resetting to defaults...');
  await chrome.storage.sync.set({
    translationProvider: 'google',
    enableDebugMode: false
  });
  
  console.log('\n=== All tests passed! ===');
}

// Run the test
testProviderDebugSync();
```

运行后应该看到所有断言都通过，表示修复成功！
