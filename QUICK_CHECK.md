# ✅ 快速检查清单

在测试扩展之前，快速检查所有必要的文件和配置。

---

## 📁 文件检查

### 核心文件（必须存在）

```bash
# 运行这个命令检查所有文件
ls -la translation-service.js translation-ui.js translation-ui.css content.js content.css manifest.json options.html options.js
```

**必需文件清单**：
- ✅ `translation-service.js` - 翻译服务核心
- ✅ `translation-ui.js` - UI渲染器  
- ✅ `translation-ui.css` - UI样式
- ✅ `content.js` - 内容脚本（已更新）
- ✅ `content.css` - 内容样式（已更新）
- ✅ `manifest.json` - 扩展配置（已更新）
- ✅ `options.html` - 设置页面
- ✅ `options.js` - 设置逻辑
- ✅ `popup.html` - 弹出窗口
- ✅ `popup.js` - 弹出逻辑
- ✅ `background.js` - 后台脚本

---

## 🔍 配置检查

### 1. manifest.json

确认content_scripts配置正确：

```json
"content_scripts": [
  {
    "matches": ["<all_urls>"],
    "js": [
      "translation-service.js",  // ← 必须在最前面
      "translation-ui.js",       // ← 第二个
      "content.js"               // ← 最后
    ],
    "css": [
      "translation-ui.css",      // ← UI样式
      "content.css"              // ← 内容样式
    ]
  }
]
```

**检查命令**：
```bash
grep -A 10 "content_scripts" manifest.json
```

### 2. translation-service.js

确认默认提供商是debug：

```javascript
// 文件末尾应该有：
translationService.setActiveProvider('debug');
```

**检查命令**：
```bash
tail -5 translation-service.js | grep "setActiveProvider"
```

### 3. content.js

确认init函数包含翻译服务检查：

```javascript
function init() {
  // 应该包含这些检查
  if (typeof translationService === 'undefined') { ... }
  if (typeof TranslationUI === 'undefined') { ... }
}
```

**检查命令**：
```bash
grep -A 5 "function init()" content.js | grep "translationService"
```

---

## 🚀 安装步骤

### 步骤1: 打开Chrome扩展页面
```
chrome://extensions/
```

### 步骤2: 启用开发者模式
- 右上角开关 → 开启

### 步骤3: 移除旧版本（如果有）
- 找到"Annotate Translate"
- 点击"移除"

### 步骤4: 加载新版本
- 点击"加载已解压的扩展程序"
- 选择项目文件夹
- 确认扩展已加载

### 步骤5: 检查扩展状态
- ✅ 扩展图标显示
- ✅ 没有错误提示
- ✅ 状态显示"已启用"

---

## ⚙️ 设置配置

### 步骤1: 打开设置页面
- 右键扩展图标 → "选项"

### 步骤2: 配置翻译设置

**功能开关**:
- ✅ Enable Translation (勾选)
- ✅ Enable Annotation (可选)

**翻译提供商**:
- ✅ 选择 "🐛 Debug"

**语言设置**:
- Source Language: Auto Detect
- Target Language: Chinese (Simplified)

**UI设置**:
- ✅ Enable Audio (勾选)
- ✅ Show Phonetics (勾选)
- ✅ Show Definitions (勾选)
- ✅ Show Examples (勾选)
- Max Examples: 3

**性能设置**:
- ✅ Enable Cache (勾选)
- Cache Size: 100

### 步骤3: 保存设置
- 点击 "💾 Save Settings"
- 确认显示"Settings saved successfully!"

---

## 🧪 快速测试

### 测试1: 基础功能（30秒）

1. **打开测试页面**
   ```bash
   # 在浏览器中打开
   file:///path/to/annotate-translate/test-extension.html
   ```

2. **测试"hello"**
   - 选中页面上的"hello"
   - 等待"T"按钮出现
   - 点击"T"按钮
   - 等待加载（~500ms）

3. **期望结果**：
   ```
   ✅ 看到翻译卡片
   ✅ 显示：你好
   ✅ 显示：US /həˈloʊ/, UK /həˈləʊ/
   ✅ 显示：3个定义（int./n./v.）
   ✅ 显示：3个例句
   ✅ 显示：🔊 音频按钮
   ✅ 显示：× 关闭按钮
   ```

### 测试2: 控制台检查（10秒）

1. **打开开发者工具** (F12)
2. **切换到Console标签**
3. **查看日志**：

期望看到：
```
[Annotate-Translate] Content script loaded on: ...
[Annotate-Translate] Settings loaded: {...}
[Annotate-Translate] Translation service available: TranslationService {...}
[Annotate-Translate] TranslationUI initialized
[Annotate-Translate] Provider set to: debug
```

**如果看到错误**：
- ❌ "Translation service not loaded!" → 检查manifest.json
- ❌ "TranslationUI not loaded!" → 检查文件顺序
- ❌ 其他错误 → 查看完整错误消息

### 测试3: 功能完整性（2分钟）

| 测试项 | 操作 | 期望结果 |
|--------|------|----------|
| 预定义词汇 | 翻译"apple" | 显示"苹果" |
| 预定义词汇 | 翻译"world" | 显示"世界" |
| 自动生成 | 翻译"computer" | 显示"[DEBUG] Translation..." |
| 音频播放 | 点击🔊 | 听到读音或看到状态变化 |
| 关闭按钮 | 点击× | 卡片关闭 |
| 外部点击 | 点击页面其他地方 | 卡片关闭 |
| 缓存 | 翻译"hello"两次 | 第二次<10ms |

---

## 🐞 故障排查

### 问题1: "T"按钮不出现

**可能原因**：
- [ ] 翻译功能未启用
- [ ] Content script未注入
- [ ] 文本选择问题

**解决方法**：
```javascript
// 在页面Console中运行
console.log('Service:', typeof translationService);
console.log('UI:', typeof TranslationUI);
console.log('Settings:', settings);
```

### 问题2: 翻译失败

**检查日志**：
```javascript
// 在页面Console中运行
translationService.translate('hello', 'zh-CN')
  .then(console.log)
  .catch(console.error);
```

**常见错误**：
- "Translation service not available" → 文件未加载
- "Provider not found" → 提供商设置错误
- "Translation failed" → 查看具体错误消息

### 问题3: 样式错误

**检查CSS加载**：
```javascript
// 在页面Console中运行
const cssFiles = [...document.styleSheets].map(s => s.href);
console.log('Loaded CSS:', cssFiles);
```

**确认包含**：
- translation-ui.css
- content.css

### 问题4: 设置不生效

**检查存储**：
```javascript
// 在页面Console中运行
chrome.storage.sync.get(null, (data) => {
  console.log('Stored settings:', data);
});
```

**重新加载扩展**：
1. chrome://extensions/
2. 点击刷新按钮
3. 刷新测试页面

---

## ✅ 完成检查表

### 安装检查
- [ ] 扩展已加载到Chrome
- [ ] 没有显示错误
- [ ] 扩展图标可见

### 配置检查
- [ ] 设置页面可以打开
- [ ] Debug提供商已选中
- [ ] 设置已保存

### 功能检查
- [ ] "T"按钮出现
- [ ] 翻译卡片显示
- [ ] 译文正确（hello→你好）
- [ ] 读音显示
- [ ] 词义显示
- [ ] 例句显示

### 交互检查
- [ ] 音频按钮可点击
- [ ] 关闭按钮工作
- [ ] 外部点击关闭
- [ ] 缓存功能正常

### Console检查
- [ ] 看到初始化日志
- [ ] 看到翻译日志
- [ ] 没有错误消息

---

## 📊 测试报告模板

```markdown
## 测试结果

**测试时间**: YYYY-MM-DD HH:mm
**Chrome版本**: xx.x.xxxx.xx
**扩展版本**: 2.0.0

### 基础功能
- [ ] ✅/❌ 翻译"hello" 
- [ ] ✅/❌ 翻译"apple"
- [ ] ✅/❌ 翻译"world"
- [ ] ✅/❌ 音频播放
- [ ] ✅/❌ 关闭功能

### 高级功能
- [ ] ✅/❌ 缓存功能
- [ ] ✅/❌ 自动生成数据
- [ ] ✅/❌ 长文本简化UI
- [ ] ✅/❌ 设置同步

### 问题记录
- 问题1: [描述]
- 问题2: [描述]

### 总体评价
[通过/失败]
```

---

## 🎉 成功标志

当所有检查项都通过时，你应该看到：

✅ **安装**: 扩展正常加载，无错误  
✅ **配置**: 设置保存成功  
✅ **翻译**: "hello"正确翻译为"你好"  
✅ **UI**: 完整卡片显示（译文+读音+词义+例句）  
✅ **音频**: 🔊按钮可点击  
✅ **交互**: 关闭功能正常  
✅ **缓存**: 第二次翻译<10ms  
✅ **日志**: Console无错误  

---

## 📚 相关文档

- [集成完成指南](INTEGRATION_COMPLETE.md) - 详细说明
- [测试清单](TEST_CHECKLIST.md) - 完整测试
- [故障排查](DEBUG_GUIDE.md) - 调试技巧

---

**准备好了吗？开始测试吧！** 🚀

**推荐顺序**：
1. 运行文件检查命令
2. 重新加载扩展
3. 配置设置
4. 打开test-extension.html
5. 测试"hello"
6. 检查Console
7. 完成完整测试
