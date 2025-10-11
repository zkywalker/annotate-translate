# Chrome插件调试指南

## 如何调试Chrome插件

### 1. 加载和重新加载插件

1. **打开扩展程序管理页面**
   - 在Chrome地址栏输入：`chrome://extensions/`
   - 或者点击：菜单 → 更多工具 → 扩展程序

2. **开启开发者模式**
   - 在右上角找到"开发者模式"开关，确保它是打开的

3. **加载未打包的扩展程序**
   - 点击"加载已解压的扩展程序"按钮
   - 选择你的插件目录（包含manifest.json的文件夹）

4. **重新加载插件**
   - 每次修改代码后，需要点击插件卡片上的"刷新"图标🔄
   - 或者使用快捷键：`Ctrl+R`（在扩展程序页面）

### 2. 调试Background Script（Service Worker）

1. **打开Service Worker控制台**
   - 在扩展程序页面，找到你的插件
   - 点击"service worker"链接（在"检查视图"下方）
   - 这会打开DevTools，专门用于调试background.js

2. **查看日志**
   ```javascript
   // 在background.js中添加的console.log会显示在这里
   console.log('[Debug] Context menu clicked');
   ```

3. **常见问题**
   - 如果Service Worker显示"inactive"，说明它已休眠
   - 触发任何事件（如点击右键菜单）会唤醒它
   - Service Worker会在30秒无活动后自动休眠

### 3. 调试Content Script

1. **打开网页的DevTools**
   - 在你要调试的网页上，按`F12`或右键→检查
   - 或者按`Ctrl+Shift+I`（Windows/Linux）或`Cmd+Option+I`（Mac）

2. **查看Content Script日志**
   - 在Console标签页中，你会看到content.js中的console.log输出
   - 日志前缀`[Annotate-Translate]`帮助识别来自我们插件的消息

3. **在Sources面板中调试**
   - 打开DevTools的Sources标签
   - 在左侧树形菜单中，找到：
     - `Content scripts` → `Annotate Translate` → `content.js`
   - 可以在这里设置断点、单步执行代码

### 4. 调试Popup页面

1. **打开Popup的DevTools**
   - 右键点击浏览器工具栏中的插件图标
   - 选择"检查"或"审查元素"
   - 这会打开popup.html的DevTools

2. **注意事项**
   - Popup关闭后DevTools也会关闭
   - 可以在Console中执行JS代码测试功能

### 5. 调试本插件的具体步骤

#### 问题：右键Annotate功能不工作

**调试步骤：**

1. **检查Context Menu是否创建成功**
   ```
   a. 打开 chrome://extensions/
   b. 找到 "Annotate Translate" 插件
   c. 点击 "service worker" 链接
   d. 在Console中应该看到："Annotate Translate extension installed"
   e. 检查是否有错误信息
   ```

2. **测试右键菜单点击**
   ```
   a. 打开任意网页（如：https://example.com）
   b. 选中一些文字
   c. 右键点击，选择 "Annotate [选中的文字]"
   d. 在Service Worker的Console中应该看到：
      "[Annotate-Translate BG] Context menu clicked: annotate-text Text: [你选的文字]"
      "[Annotate-Translate BG] Annotate message sent successfully"
   ```

3. **检查Content Script是否接收消息**
   ```
   a. 在网页上按F12打开DevTools
   b. 切换到Console标签
   c. 再次右键点击选中的文字 → Annotate
   d. 应该看到：
      "[Annotate-Translate] Received message: {action: 'annotate', text: '...'}"
      "[Annotate-Translate] Annotating text: ..."
   e. 会弹出一个prompt对话框让你输入标注
   f. 输入标注后应该看到：
      "[Annotate-Translate] Creating ruby annotation for: ... with: ..."
      "[Annotate-Translate] Ruby annotation created successfully"
   ```

4. **常见问题排查**

   **问题A: Service Worker中看不到任何日志**
   - 解决：重新加载插件（点击刷新图标）
   - 原因：代码更新后需要重新加载

   **问题B: 右键菜单中没有"Annotate"选项**
   - 检查：manifest.json中的permissions是否包含"contextMenus"
   - 解决：卸载插件重新加载

   **问题C: Content Script没有收到消息**
   - 检查：在网页Console中输入 `console.log('test')`，确认Console工作正常
   - 解决：刷新网页，确保content script已注入
   - 检查：是否有错误"Could not establish connection. Receiving end does not exist"
     - 这意味着content script未加载，需要刷新页面

   **问题D: 标注没有显示**
   - 在Console中检查是否有错误
   - 在Elements标签中搜索 `ruby.annotate-translate-ruby` 看元素是否创建
   - 检查content.css是否正确加载

### 6. 有用的调试技巧

1. **使用断点调试**
   ```javascript
   // 在代码中添加debugger语句
   function annotateSelectedText(text) {
     debugger; // 执行到这里会暂停
     const annotation = prompt('Enter annotation for "' + text + '":', '');
     // ...
   }
   ```

2. **检查存储数据**
   ```javascript
   // 在任何Console中执行
   chrome.storage.sync.get(null, (data) => console.log('Sync storage:', data));
   chrome.storage.local.get(null, (data) => console.log('Local storage:', data));
   ```

3. **检查DOM元素**
   ```javascript
   // 在网页Console中执行
   document.querySelectorAll('ruby.annotate-translate-ruby');
   ```

4. **监控消息传递**
   ```javascript
   // 在content.js中添加
   chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
     console.log('Message received:', request);
     // 原有代码...
   });
   ```

### 7. 性能调试

1. **检查内存泄漏**
   - DevTools → Performance → Memory
   - 录制一段操作后查看内存使用

2. **检查CPU使用**
   - DevTools → Performance
   - 录制后查看函数调用时间

### 8. 网络请求调试

如果将来添加翻译API：
- DevTools → Network标签
- 可以看到所有的HTTP请求
- 检查请求/响应内容

### 9. 错误日志位置

- **Background错误**: Service Worker DevTools Console
- **Content Script错误**: 网页DevTools Console  
- **Popup错误**: Popup DevTools Console
- **安装错误**: chrome://extensions/ 页面上的错误提示

### 10. 清除插件数据

如果需要重置所有数据：
```javascript
// 在任何Console中执行
chrome.storage.sync.clear();
chrome.storage.local.clear();
console.log('Storage cleared');
```

或者在扩展程序页面点击"清除"按钮。

---

## 快速检查清单

- [ ] 插件已加载且启用
- [ ] 开发者模式已开启
- [ ] 修改代码后已重新加载插件
- [ ] 测试页面已刷新
- [ ] Service Worker处于活动状态
- [ ] Console中没有错误信息
- [ ] Content.css已正确加载
- [ ] 右键菜单项可见
- [ ] 选中文字后右键可以看到菜单

## 当前问题的修复

已修复的问题：
1. ✅ 修改了`annotateSelectedText`函数，使其不依赖于window.getSelection()
2. ✅ 新的实现会在DOM中查找匹配的文本节点并创建标注
3. ✅ 添加了详细的调试日志
4. ✅ 改进了错误处理

测试步骤：
1. 重新加载插件
2. 刷新测试页面
3. 选中一段文字
4. 右键选择"Annotate [文字]"
5. 输入标注文本
6. 应该能看到文字上方出现标注
