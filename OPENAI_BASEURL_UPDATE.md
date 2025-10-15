# OpenAI Base URL 功能更新

## 🎉 新功能

现在您可以在扩展设置和测试页面中自定义 OpenAI API 的 Base URL，这使得您可以：

- ✅ 使用 **Azure OpenAI Service**
- ✅ 连接 **本地部署的 AI 模型**（Ollama、LocalAI 等）
- ✅ 使用 **第三方 OpenAI 兼容服务**
- ✅ 通过 **代理服务** 访问 OpenAI API

## 📍 在哪里配置

### 1. 扩展设置页面 (options.html)

1. 打开扩展设置
2. 在"翻译提供商"部分选择 **OpenAI (GPT)**
3. 输入您的配置：
   - **API Key**: 您的 API 密钥
   - **Model**: 选择模型（GPT-3.5 Turbo、GPT-4o 等）
   - **Base URL**: 自定义 API 端点（可选）
4. 保存设置

### 2. 测试页面 (test-ai-translation.html)

1. 打开 `test-ai-translation.html`
2. 在"配置"部分填写：
   - **API 密钥**: 您的 OpenAI API Key
   - **Base URL**: 自定义端点地址
   - **模型**: 选择要使用的模型
3. 点击"初始化服务"进行测试

### 3. 快速测试页面 (test-openai-baseurl.html) 🆕

专门用于测试 Base URL 配置的简化页面：
1. 打开 `test-openai-baseurl.html`
2. 选择预设配置或输入自定义 URL
3. 输入 API Key
4. 点击"测试连接"

## 🌐 支持的服务示例

### OpenAI 官方 API
```
Base URL: https://api.openai.com/v1
API Key: sk-...
Model: gpt-3.5-turbo / gpt-4o 等
```

### Azure OpenAI Service
```
Base URL: https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT
API Key: 您的 Azure API Key
Model: 您在 Azure 中部署的模型名称
```

### Ollama (本地)
```
Base URL: http://localhost:11434/v1
API Key: ollama（或根据配置）
Model: llama2, mistral, codellama 等
```

### LocalAI (本地)
```
Base URL: http://localhost:8080/v1
API Key: 根据您的 LocalAI 配置
Model: 您部署的模型名称
```

### 第三方代理
```
Base URL: https://your-proxy.com/v1
API Key: 代理服务提供的密钥
Model: 支持的模型
```

## 🔒 安全提示

- ✅ 所有 API Key 都只存储在本地
- ✅ 使用密码输入框保护密钥显示
- ✅ 配置通过 Chrome 同步存储
- ✅ 不会上传到任何外部服务器

## 📝 技术实现

修改的文件：
- `options.html` - 添加 OpenAI 配置 UI
- `options.js` - 添加设置保存/加载逻辑
- `test-ai-translation.html` - 添加 Base URL 输入
- `test-ai-translation.js` - 更新初始化逻辑
- `ai-providers/openai-provider.js` - 已支持自定义 baseURL

新增文件：
- `test-openai-baseurl.html` - 快速测试页面
- `OPENAI_BASEURL_FEATURE.md` - 详细功能文档

## 🧪 测试方法

### 方法 1: 使用快速测试页面
```bash
# 在浏览器中打开
open test-openai-baseurl.html
```

### 方法 2: 使用完整测试页面
```bash
# 在浏览器中打开
open test-ai-translation.html
```

### 方法 3: 在扩展中使用
1. 加载扩展到 Chrome
2. 打开扩展设置
3. 配置 OpenAI 选项
4. 在网页上测试翻译功能

## 📚 相关文档

- [完整功能说明](./OPENAI_BASEURL_FEATURE.md)
- [OpenAI API 文档](https://platform.openai.com/docs)
- [Azure OpenAI 文档](https://learn.microsoft.com/azure/ai-services/openai/)
- [AI SDK 文档](https://ai-sdk.dev/providers/ai-sdk-providers/openai)

## ❓ 常见问题

**Q: Base URL 留空会怎样？**  
A: 默认使用 OpenAI 官方 API：`https://api.openai.com/v1`

**Q: 可以使用本地模型吗？**  
A: 可以！只要服务实现了 OpenAI API 格式（如 Ollama、LocalAI）

**Q: Azure OpenAI 如何配置？**  
A: 使用 Azure 资源的完整 URL，包括部署名称

**Q: 如何测试配置是否正确？**  
A: 使用 `test-openai-baseurl.html` 进行快速测试

## 🚀 下一步

- [ ] 添加更多预设配置
- [ ] 支持 Base URL 验证
- [ ] 添加连接状态指示
- [ ] 支持批量测试多个端点

---

更新日期: 2025-10-14
