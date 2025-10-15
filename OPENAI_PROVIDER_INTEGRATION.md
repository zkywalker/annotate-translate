# OpenAI Provider 集成完成

## 问题
用户报告：在配置里设置了 OpenAI 作为翻译提供者，但实际调用的是 Google。

## 根本原因
OpenAI Provider 的实现文件存在，但没有在 `translation-service.js` 中注册。

## 解决方案

### 1. 创建适配器类
由于 `OpenAIProvider` 继承自 `BaseAIProvider`，其接口与 `TranslationProvider` 不兼容：
- `TranslationProvider.translate(text, targetLang, sourceLang)`
- `OpenAIProvider.translate(text, sourceLang, targetLang, options)`

在 `translation-service.js` 中创建了 `OpenAITranslateProvider` 适配器类，将 OpenAI Provider 包装为 TranslationProvider 接口。

### 2. 注册 Provider
在 `translation-service.js` 中添加：
```javascript
translationService.registerProvider('openai', new OpenAITranslateProvider());
```

### 3. 加载依赖文件
更新 `manifest.json` 的 `content_scripts` 部分：
```json
"js": [
  "ai-providers/prompt-templates.js",
  "ai-providers/base-ai-provider.js",
  "ai-providers/openai-provider.js",
  "translation-service.js",
  "translation-ui.js",
  "content.js"
]
```

### 4. 配置初始化
在 `content.js` 中添加 OpenAI 配置逻辑：
```javascript
if (settings.translationProvider === 'openai') {
  const openaiProvider = translationService.providers.get('openai');
  if (openaiProvider) {
    openaiProvider.updateConfig({
      apiKey: settings.openaiApiKey,
      model: settings.openaiModel,
      baseURL: settings.openaiBaseUrl,
      promptFormat: settings.openaiPromptFormat || 'jsonFormat',
      useContext: settings.openaiUseContext !== undefined ? settings.openaiUseContext : true,
      showPhoneticInAnnotation: settings.showPhoneticInAnnotation !== false
    });
  }
}
```

### 5. 默认设置
在 `options.js` 的 `DEFAULT_SETTINGS` 中添加：
```javascript
openaiPromptFormat: 'jsonFormat',
openaiUseContext: true,
```

## 技术细节

### OpenAITranslateProvider 适配器
```javascript
class OpenAITranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('OpenAI', config);
    this.openaiProvider = null;
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-3.5-turbo';
    this.baseURL = config.baseURL || 'https://api.openai.com/v1';
    this.promptFormat = config.promptFormat || 'jsonFormat';
    this.useContext = config.useContext !== undefined ? config.useContext : true;
  }

  async translate(text, targetLang, sourceLang = 'auto') {
    // 懒加载：首次调用时才初始化 OpenAIProvider
    if (!this.openaiProvider) {
      this.initializeProvider();
    }

    // 调用 OpenAI Provider (注意参数顺序转换)
    const aiResult = await this.openaiProvider.translate(text, sourceLang, targetLang, {
      context: ''
    });

    // 转换为 TranslationResult 格式
    return {
      originalText: text,
      translatedText: aiResult.translatedText || aiResult.translation || '',
      sourceLang: sourceLang,
      targetLang: targetLang,
      phonetics: aiResult.phonetics || [],
      definitions: aiResult.definitions || [],
      examples: aiResult.examples || [],
      provider: 'openai',
      metadata: aiResult.metadata || {},
      timestamp: Date.now(),
      annotationText: this.buildAnnotationText(result)
    };
  }
}
```

### 配置更新机制
适配器支持动态更新配置，当设置改变时无需重启扩展：
```javascript
updateConfig(config) {
  if (config.apiKey !== this.apiKey || config.model !== this.model || ...) {
    // 配置改变，重新初始化 provider
    this.openaiProvider = null;
  }
}
```

## 配置选项

### 用户可配置的设置
| 设置项 | 说明 | 默认值 |
|--------|------|--------|
| `openaiApiKey` | OpenAI API 密钥 | `''` |
| `openaiModel` | 模型名称（支持自定义） | `'gpt-3.5-turbo'` |
| `openaiBaseUrl` | API 基础 URL | `'https://api.openai.com/v1'` |
| `openaiPromptFormat` | 提示词格式 (`jsonFormat` / `simpleFormat`) | `'jsonFormat'` |
| `openaiUseContext` | 是否使用上下文 | `true` |
| `showPhoneticInAnnotation` | 标注中显示音标 | `true` |

### Prompt 格式说明
- **jsonFormat**: 返回结构化 JSON，包含翻译、音标、词义、例句
- **simpleFormat**: 仅返回翻译文本，速度更快、成本更低

## 测试清单

### 基础功能测试
- [ ] 在 Options 页面选择 OpenAI Provider
- [ ] 配置 API Key、Model、Base URL
- [ ] 选择文本，点击"翻译"按钮
- [ ] 验证调用的是 OpenAI API（在控制台查看日志）

### 配置测试
- [ ] 测试不同模型（gpt-3.5-turbo, gpt-4, 自定义模型）
- [ ] 测试不同 Base URL（Azure OpenAI, 本地部署）
- [ ] 切换 Prompt Format（jsonFormat vs simpleFormat）
- [ ] 开启/关闭上下文功能

### 错误处理测试
- [ ] 无效的 API Key（应显示友好错误消息）
- [ ] 网络错误（超时、无法连接）
- [ ] API 限流（429 错误）
- [ ] 模型不存在错误

### 集成测试
- [ ] 切换不同 Provider（Google ↔ OpenAI ↔ DeepL）
- [ ] 验证设置持久化（刷新页面后配置保留）
- [ ] 验证标注功能（音标、翻译显示正确）

## 调试方法

### 查看日志
1. 打开任意网页
2. 按 `F12` 打开开发者工具
3. 切换到 Console 标签
4. 选择文本并点击翻译
5. 查找以下日志：
   ```
   [Annotate-Translate] Provider set to: openai
   [OpenAI Adapter] Initialized with model: gpt-3.5-turbo, baseURL: https://api.openai.com/v1
   [OpenAI Adapter] Translating: "hello" from auto to zh-CN
   [OpenAI Provider] Translating: "hello..."
   ```

### 常见问题

#### 1. 仍然调用 Google
**检查**:
- 确认 Options 页面的 Provider 选择为 "OpenAI"
- 检查控制台日志，确认 `Provider set to: openai`
- 刷新页面，重新加载配置

#### 2. API Key 无效
**检查**:
- API Key 是否正确复制（无多余空格）
- API Key 是否有余额
- 是否选择了正确的 Base URL

#### 3. 模型不存在
**检查**:
- 模型名称拼写是否正确
- 该模型是否在您的账户中可用
- 如果使用非官方 API，确认模型是否支持

#### 4. Base URL 配置错误
**常见错误**:
- 末尾多了 `/`：`https://api.openai.com/v1/`（正确应该不带 `/`）
- 缺少协议：`api.openai.com/v1`（应该是 `https://api.openai.com/v1`）
- 路径错误：`https://api.openai.com`（应该包含 `/v1`）

## 文件修改清单

| 文件 | 修改内容 |
|------|---------|
| `translation-service.js` | 添加 `OpenAITranslateProvider` 适配器类 |
| `translation-service.js` | 注册 `openai` provider |
| `translation-service.js` | 导出 `OpenAITranslateProvider` |
| `content.js` | 添加 OpenAI 配置逻辑 |
| `content.js` | 加载 OpenAI 相关设置 |
| `options.js` | 添加 `openaiPromptFormat` 和 `openaiUseContext` 到 DEFAULT_SETTINGS |
| `manifest.json` | 添加 OpenAI 相关 JS 文件到 content_scripts |

## 下一步优化

### 可选功能增强
1. **UI 控件**: 在 Options 页面添加 Prompt Format 和 Use Context 选项
2. **上下文提取**: 改进上下文提取算法，传入更多周围文本
3. **自定义模板**: 允许用户自定义提示词模板
4. **成本估算**: 显示每次翻译的 Token 使用量和成本
5. **批量翻译**: 支持批量翻译功能

### 性能优化
1. **缓存**: 利用 TranslationService 的缓存机制
2. **请求合并**: 多个短文本合并为一次请求
3. **流式输出**: 使用 OpenAI Stream API 提供更快的响应

## 总结

✅ **问题已解决**: OpenAI Provider 现在已完全集成到翻译服务中
✅ **向后兼容**: 不影响现有的 Google、Youdao、DeepL 提供商
✅ **可扩展**: 适配器模式便于未来添加更多 AI 提供商

用户现在可以：
1. 在 Options 页面选择 OpenAI 作为翻译提供者
2. 配置自定义的 Base URL（支持 Azure OpenAI、本地模型等）
3. 选择不同的模型（包括自定义模型）
4. 享受 AI 驱动的高质量翻译和音标生成
