# OpenAI Provider 快速测试指南

## 🚀 快速测试步骤

### 1. 重新加载扩展
```bash
# 方法1：在 Chrome 扩展管理页面
chrome://extensions/ → 点击"重新加载"按钮

# 方法2：使用快捷键
Ctrl+R (在扩展管理页面)
```

### 2. 配置 OpenAI Provider
1. 点击扩展图标 → 打开 Options 页面
2. 在 "Translation Provider" 部分选择 **OpenAI**
3. 填写配置：
   - **API Key**: 你的 OpenAI API 密钥
   - **Model**: `gpt-3.5-turbo` 或其他模型
   - **Base URL**: `https://api.openai.com/v1` (默认)
4. 设置会自动保存

### 3. 测试翻译
1. 打开任意网页（如 https://www.example.com）
2. 选中一段英文文本
3. 点击浮动菜单中的 **Translate** 按钮
4. 观察翻译结果

### 4. 验证日志
打开开发者工具 (F12)，查看 Console 输出：

**期望看到的日志**:
```
[Annotate-Translate] Provider set to: openai
[OpenAI Adapter] OpenAI provider configured:
  - API Key: Set
  - Model: gpt-3.5-turbo
  - Base URL: https://api.openai.com/v1
  - Prompt Format: jsonFormat
  - Use Context: true
[OpenAI Adapter] Translating: "hello" from auto to zh-CN
[OpenAI Provider] Initialized - Model: gpt-3.5-turbo, Format: jsonFormat
[OpenAI Provider] Translating: "hello..."
[OpenAI Provider] Completed - Tokens: 150
[OpenAI Adapter] Translation completed
```

**如果仍然看到 Google 日志**:
```
[Google Translate] Translating...  ❌ 问题未解决
```

## 🔍 调试检查清单

### ✅ Provider 注册检查
在控制台输入以下命令：
```javascript
translationService.providers.has('openai')
// 期望输出: true
```

```javascript
translationService.providers.get('openai')
// 期望输出: OpenAITranslateProvider { name: "OpenAI", ... }
```

### ✅ 设置检查
```javascript
chrome.storage.sync.get(['translationProvider', 'openaiApiKey', 'openaiModel', 'openaiBaseUrl'], console.log)
// 期望输出:
// {
//   translationProvider: "openai",
//   openaiApiKey: "sk-...",
//   openaiModel: "gpt-3.5-turbo",
//   openaiBaseUrl: "https://api.openai.com/v1"
// }
```

### ✅ 当前 Provider 检查
```javascript
translationService.getActiveProvider().name
// 期望输出: "OpenAI"
```

## 🧪 完整测试用例

### 测试用例 1: 基础翻译
- **文本**: "Hello, world!"
- **源语言**: auto
- **目标语言**: zh-CN
- **期望结果**: 显示中文翻译 "你好，世界！"

### 测试用例 2: 带音标的单词
- **文本**: "apple"
- **源语言**: en
- **目标语言**: zh-CN
- **期望结果**: 
  - 翻译: 苹果
  - 音标: /ˈæp.əl/
  - 标注文本: "/ˈæp.əl/ 苹果"

### 测试用例 3: 长文本翻译
- **文本**: "The quick brown fox jumps over the lazy dog."
- **期望结果**: 流畅的中文翻译

### 测试用例 4: 自定义 Base URL (Azure OpenAI)
- **Base URL**: `https://your-resource.openai.azure.com/openai/deployments/your-deployment`
- **Model**: `gpt-35-turbo`
- **期望结果**: 正常翻译（使用 Azure 端点）

## 🐛 常见问题排查

### 问题1: 扩展加载失败
**症状**: 扩展图标变灰或无法点击

**检查**:
```bash
# 查看 manifest.json 是否有语法错误
jq . manifest.json

# 或手动检查文件结构
cat manifest.json | grep -E "ai-providers|content_scripts"
```

**解决**: 确保 manifest.json 中的文件路径正确

### 问题2: OpenAIProvider 未定义
**症状**: 控制台报错 `OpenAIProvider is not defined`

**原因**: 文件加载顺序错误

**检查**: manifest.json 中的加载顺序应该是：
```json
"js": [
  "ai-providers/prompt-templates.js",  ← 最先
  "ai-providers/base-ai-provider.js",  ← 第二
  "ai-providers/openai-provider.js",   ← 第三
  "translation-service.js",            ← 第四
  "translation-ui.js",
  "content.js"
]
```

### 问题3: API Key 无效
**症状**: 返回 401 或 403 错误

**检查**:
1. API Key 是否以 `sk-` 开头
2. API Key 是否有多余的空格或换行
3. 账户是否有余额

**测试 API Key**:
```bash
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### 问题4: 仍然调用 Google
**症状**: 日志显示 `[Google Translate]`

**排查步骤**:
1. 打开 Options 页面，确认选择了 "OpenAI"
2. 关闭并重新打开测试网页
3. 清除浏览器缓存
4. 在控制台运行：
   ```javascript
   chrome.storage.sync.set({translationProvider: 'openai'}, () => {
     location.reload();
   });
   ```

## 📊 性能监控

### Token 使用量
在翻译完成后查看 metadata：
```javascript
// 在控制台捕获翻译结果
let lastResult = null;
window.addEventListener('translation-complete', (e) => {
  lastResult = e.detail;
  console.log('Tokens used:', e.detail.metadata.tokensUsed);
  console.log('Cost:', e.detail.metadata.cost);
});
```

### 响应时间
```javascript
console.time('translation');
// 执行翻译
console.timeEnd('translation');
// 输出: translation: 1234.567ms
```

## 📝 测试报告模板

```markdown
## OpenAI Provider 测试报告

**测试日期**: 2024-XX-XX
**测试环境**: Chrome XX / Edge XX
**配置**:
- Model: gpt-3.5-turbo
- Base URL: https://api.openai.com/v1
- Prompt Format: jsonFormat

### 测试结果
- [ ] ✅ Provider 注册成功
- [ ] ✅ 配置加载正常
- [ ] ✅ 翻译功能正常
- [ ] ✅ 音标显示正确
- [ ] ✅ 标注功能正常
- [ ] ❌ 错误处理正常（API Key 错误时显示友好提示）

### 问题记录
1. [描述问题]
   - 复现步骤: [...]
   - 期望结果: [...]
   - 实际结果: [...]
   - 截图: [...]

### 性能数据
- 平均响应时间: XXX ms
- 平均 Token 使用: XXX tokens
- 估算成本: $X.XXX per translation
```

## 🎯 成功标准

当满足以下所有条件时，集成视为成功：

1. ✅ 控制台日志显示 `Provider set to: openai`
2. ✅ 能看到 `[OpenAI Adapter]` 和 `[OpenAI Provider]` 日志
3. ✅ 翻译结果来自 OpenAI（不是 Google）
4. ✅ 翻译质量符合预期
5. ✅ 音标信息正确显示
6. ✅ 没有 JavaScript 错误

## 下一步

测试成功后，可以尝试：
1. 使用不同的模型（gpt-4, gpt-4-turbo）
2. 配置 Azure OpenAI
3. 尝试本地部署的模型（通过自定义 Base URL）
4. 调整提示词格式（jsonFormat vs simpleFormat）
