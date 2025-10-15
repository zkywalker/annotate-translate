# OpenAI Base URL 快速参考

## 🎯 功能概述

添加了自定义 OpenAI API Base URL 的支持，允许连接到非 OpenAI 官方的兼容服务。

## 📝 配置项

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `openaiApiKey` | string | `''` | OpenAI API 密钥 |
| `openaiModel` | string | `'gpt-3.5-turbo'` | 使用的模型 |
| `openaiBaseUrl` | string | `'https://api.openai.com/v1'` | API 基础 URL |

## 🔧 可用模型

- `gpt-3.5-turbo` - 推荐，性价比高
- `gpt-4o-mini` - 更快，更便宜
- `gpt-4o` - 更强大
- `gpt-4-turbo` - GPT-4 Turbo
- `gpt-4` - GPT-4

## 🌐 常用 Base URL

### OpenAI 官方
```
https://api.openai.com/v1
```

### Azure OpenAI
```
https://{resource-name}.openai.azure.com/openai/deployments/{deployment-id}
```

### Ollama 本地
```
http://localhost:11434/v1
```

### LocalAI 本地
```
http://localhost:8080/v1
```

## 📂 修改的文件

### UI 文件
- `options.html` - 添加 OpenAI 配置区域（第 606-650 行）
- `test-ai-translation.html` - 添加 Base URL 输入框（第 315-320 行）

### 逻辑文件
- `options.js` - 添加设置保存/加载（第 24-27, 62-65, 206-209, 275-278 行）
- `test-ai-translation.js` - 添加 Base URL 支持（第 19, 70-72, 86 行）

### 新增文件
- `test-openai-baseurl.html` - Base URL 快速测试页面
- `OPENAI_BASEURL_FEATURE.md` - 详细功能文档
- `OPENAI_BASEURL_UPDATE.md` - 更新说明文档

## 🧪 测试命令

### 在浏览器中打开测试页面
```bash
# 完整测试页面
open test-ai-translation.html

# 快速测试页面
open test-openai-baseurl.html
```

### 测试扩展
```
1. 在 Chrome 中加载扩展
2. 打开 chrome://extensions/
3. 启用"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
```

## 💡 使用示例

### 示例 1: OpenAI 官方 API
```javascript
await aiService.initialize('openai', {
  apiKey: 'sk-...',
  model: 'gpt-3.5-turbo',
  baseURL: 'https://api.openai.com/v1'
});
```

### 示例 2: Azure OpenAI
```javascript
await aiService.initialize('openai', {
  apiKey: 'your-azure-key',
  model: 'gpt-35-turbo',  // Azure 部署名称
  baseURL: 'https://your-resource.openai.azure.com/openai/deployments/your-deployment'
});
```

### 示例 3: Ollama 本地
```javascript
await aiService.initialize('openai', {
  apiKey: 'ollama',  // 或根据配置
  model: 'llama2',
  baseURL: 'http://localhost:11434/v1'
});
```

## 🔍 调试技巧

### 检查 API 端点
```javascript
console.log(provider.apiEndpoint);
// 输出: https://api.openai.com/v1/chat/completions
```

### 查看配置
```javascript
const info = aiService.getProviderInfo();
console.log(info);
// 输出: { name, model, endpoint, ... }
```

### 测试翻译
```javascript
const result = await aiService.translate('hello', 'en', 'zh-CN');
console.log(result);
```

## ⚠️ 常见错误

### 错误 1: Invalid API Key
```
原因: API Key 不正确或已过期
解决: 检查并更新 API Key
```

### 错误 2: 404 Not Found
```
原因: Base URL 格式不正确
解决: 确保 URL 以 /v1 结尾
```

### 错误 3: CORS Error
```
原因: 本地服务未配置 CORS
解决: 在服务配置中启用 CORS
```

### 错误 4: Model not found
```
原因: 服务不支持指定的模型
解决: 检查服务支持的模型列表
```

## 📋 检查清单

配置前检查：
- [ ] Base URL 格式正确
- [ ] API Key 有效
- [ ] 模型被服务支持
- [ ] 网络连接正常
- [ ] （本地服务）服务已启动

## 🚀 快速开始

### 1. 最简单的测试
打开 `test-openai-baseurl.html`，使用预设配置快速测试。

### 2. 完整功能测试
打开 `test-ai-translation.html`，测试翻译、批量翻译等完整功能。

### 3. 在扩展中使用
1. 打开扩展设置
2. 选择 OpenAI 提供商
3. 配置 API Key 和 Base URL
4. 保存并在网页中测试

## 📞 支持

遇到问题？
1. 查看控制台错误信息
2. 检查 `OPENAI_BASEURL_FEATURE.md` 详细文档
3. 使用 `test-openai-baseurl.html` 进行连接测试

---

最后更新: 2025-10-14
