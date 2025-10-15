# 🌐 OpenAI Base URL 配置指南

## ⚡ 快速开始

### 方式 1: 使用快速测试页面（推荐新手）

```bash
# 在浏览器中打开
open test-openai-baseurl.html
```

1. 点击预设按钮选择服务类型
2. 输入 API Key
3. 选择模型
4. 点击"测试连接"

### 方式 2: 在扩展设置中配置

1. 打开扩展设置页面
2. 在"翻译提供商"部分选择 **OpenAI (GPT)**
3. 配置以下信息：
   - **API Key**: 你的 OpenAI API 密钥
   - **Model**: 选择模型（推荐 GPT-3.5 Turbo）
   - **Base URL**: 自定义端点（可选）
4. 点击保存

## 🎯 常用配置

### OpenAI 官方 API（默认）
```
Base URL: https://api.openai.com/v1
API Key: sk-...
Model: gpt-3.5-turbo
```

### Azure OpenAI
```
Base URL: https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT
API Key: 你的 Azure Key
Model: 你的部署名称
```

### Ollama 本地
```
Base URL: http://localhost:11434/v1
API Key: ollama
Model: llama2, mistral, etc.
```

### LocalAI 本地
```
Base URL: http://localhost:8080/v1
API Key: 根据配置
Model: 你的模型名称
```

## 📖 详细文档

- [完整功能说明](./OPENAI_BASEURL_FEATURE.md) - 详细的功能介绍和实现细节
- [更新公告](./OPENAI_BASEURL_UPDATE.md) - 新功能说明和使用指南
- [快速参考](./OPENAI_BASEURL_QUICK_REF.md) - 配置参数和命令速查
- [开发总结](./OPENAI_BASEURL_SUMMARY.md) - 技术实现和开发过程

## ❓ 常见问题

**Q: Base URL 是什么？**  
A: API 端点的基础地址，默认指向 OpenAI 官方服务器。

**Q: 为什么需要自定义 Base URL？**  
A: 让你可以使用 Azure OpenAI、本地模型或其他兼容服务。

**Q: 如何知道 Base URL 配置正确？**  
A: 使用 `test-openai-baseurl.html` 进行快速测试。

**Q: 支持哪些服务？**  
A: 所有实现了 OpenAI API 格式的服务。

## 🧪 测试文件

| 文件 | 用途 |
|------|------|
| `test-openai-baseurl.html` | Base URL 快速测试 |
| `test-ai-translation.html` | 完整翻译功能测试 |
| `options.html` | 扩展设置页面 |

## 🛠️ 修改的文件

- `options.html` - 添加 OpenAI 配置 UI
- `options.js` - 添加设置逻辑
- `test-ai-translation.html` - 添加 Base URL 输入
- `test-ai-translation.js` - 更新初始化逻辑

## ✅ 功能清单

- [x] 自定义 Base URL 输入
- [x] API Key 配置
- [x] 模型选择
- [x] 配置保存和加载
- [x] OpenAI 官方 API 支持
- [x] Azure OpenAI 支持
- [x] 本地服务支持（Ollama、LocalAI）
- [x] 第三方服务支持
- [x] 快速测试工具
- [x] 完整文档

## 📞 获取帮助

1. 查看浏览器控制台的错误信息
2. 阅读 [完整功能说明](./OPENAI_BASEURL_FEATURE.md)
3. 使用测试工具验证配置
4. 检查网络连接和服务状态

## 🎉 开始使用

立即打开 `test-openai-baseurl.html` 开始测试！

---

更新日期: 2025-10-14
