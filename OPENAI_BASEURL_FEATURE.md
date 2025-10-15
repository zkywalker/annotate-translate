# OpenAI Base URL 功能说明

## 概述

为 AI 翻译服务添加了自定义 Base URL 功能，允许用户连接到 OpenAI 官方 API 以外的兼容服务。

## 修改内容

### 1. `options.html` - 设置页面 UI

**添加了 OpenAI 提供商选项：**
- 在翻译提供商列表中新增 "OpenAI (GPT)" 选项，标记为 NEW
- 位于 DeepL 选项之后

**添加了 OpenAI 配置区域：**
- API Key 输入框（密码类型，安全存储）
- 模型选择下拉框（支持 GPT-3.5 Turbo、GPT-4o Mini、GPT-4o、GPT-4 Turbo、GPT-4）
- Base URL 输入框（可自定义 API 端点）
- 详细的使用说明和配置指南

**Base URL 功能说明：**
- 默认值：`https://api.openai.com/v1`
- 支持 Azure OpenAI Service
- 支持本地部署（Ollama、LocalAI 等）
- 支持第三方 OpenAI 兼容代理服务

### 2. `options.js` - 设置逻辑

**更新了默认设置：**
```javascript
openaiApiKey: '',
openaiModel: 'gpt-3.5-turbo',
openaiBaseUrl: 'https://api.openai.com/v1',
```

**添加了 DOM 元素引用：**
- `openaiApiKey`
- `openaiModel`
- `openaiBaseUrl`
- `openaiConfigSection`

**更新了设置加载和保存：**
- `loadSettings()` - 从存储加载 OpenAI 配置
- `saveSettings()` - 保存 OpenAI 配置到存储
- `updateProviderSelection()` - 根据选择显示/隐藏 OpenAI 配置区域

### 3. `test-ai-translation.html` - 测试页面 UI

**添加了 Base URL 输入框：**
- 位于 API Key 和 Model 之间
- 默认值：`https://api.openai.com/v1`
- 包含使用说明

**更新了信息提示框：**
添加了 Base URL 的详细使用说明，包括：
- OpenAI 官方 API 地址
- Azure OpenAI 使用示例
- 本地部署服务示例
- 第三方兼容服务说明

### 4. `test-ai-translation.js` - 测试逻辑

**添加了 Base URL 支持：**
```javascript
const elements = {
  // ...
  baseUrl: document.getElementById('baseUrl'),
  // ...
};

async function handleInitialize() {
  const baseUrl = elements.baseUrl.value.trim() || 'https://api.openai.com/v1';
  
  await aiService.initialize(provider, {
    apiKey: apiKey,
    model: model,
    baseURL: baseUrl  // 传递给 OpenAI provider
  });
}
```

### 5. `ai-providers/openai-provider.js` - OpenAI 提供商

**已有的 Base URL 支持：**
OpenAI provider 已经在构造函数中支持 `config.baseURL` 参数：
```javascript
constructor(config) {
  // ...
  this.apiEndpoint = `${config.baseURL || 'https://api.openai.com/v1'}/chat/completions`;
  // ...
}
```

## 使用场景

### 1. OpenAI 官方 API
```
Base URL: https://api.openai.com/v1
API Key: sk-...
```

### 2. Azure OpenAI Service
```
Base URL: https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT
API Key: Azure API Key
```

### 3. 本地 Ollama
```
Base URL: http://localhost:11434/v1
API Key: ollama (或留空，取决于配置)
Model: llama2, mistral 等
```

### 4. LocalAI
```
Base URL: http://localhost:8080/v1
API Key: 自定义或留空
Model: 本地模型名称
```

### 5. 第三方代理服务
```
Base URL: https://your-proxy-service.com/v1
API Key: 代理服务提供的密钥
```

## 配置存储

所有 OpenAI 配置都存储在 Chrome Extension 的 `chrome.storage.sync` 中：
- `openaiApiKey` - API 密钥
- `openaiModel` - 选择的模型
- `openaiBaseUrl` - 自定义 Base URL

配置在所有登录同一 Chrome 账户的设备间同步。

## 安全性

- API Key 以密码类型输入框显示（不可见）
- 所有配置仅存储在本地/Chrome 同步存储中
- 不会上传到任何外部服务器
- 使用 HTTPS 连接确保传输安全

## 测试建议

1. **测试 OpenAI 官方 API：**
   - 使用默认 Base URL
   - 输入有效的 OpenAI API Key
   - 选择一个模型进行翻译测试

2. **测试自定义服务：**
   - 修改 Base URL 为你的服务地址
   - 确保服务实现了 OpenAI API 格式
   - 测试初始化和翻译功能

3. **错误处理：**
   - 测试无效的 API Key
   - 测试错误的 Base URL
   - 验证错误消息是否友好

## 未来改进

- [ ] 添加 Base URL 格式验证
- [ ] 支持更多 OpenAI 兼容服务的预设
- [ ] 添加连接测试功能
- [ ] 支持高级配置（temperature、max_tokens 等）
- [ ] 添加使用统计和成本估算
- [ ] 支持多个 API Key 轮换

## 相关文档

- [OpenAI API 文档](https://platform.openai.com/docs)
- [Azure OpenAI 文档](https://learn.microsoft.com/azure/ai-services/openai/)
- [AI SDK 提供商文档](https://ai-sdk.dev/providers/ai-sdk-providers/openai)

## 更新日期

2025-10-14
