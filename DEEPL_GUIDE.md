# DeepL 翻译服务集成指南

## 快速开始

### 1. 获取 DeepL API 密钥

1. 访问 [DeepL Pro API](https://www.deepl.com/pro-api)
2. 注册账户（免费或专业版）
3. 在账户页面获取 API 密钥
4. 免费账户包含 **500,000 字符/月** 的翻译额度

### 2. 配置扩展

1. 点击扩展图标，选择 "设置"
2. 在 "翻译提供商" 部分，选择 "🚀 DeepL"
3. 输入您的 API 密钥
4. 选择是否使用免费 API（默认勾选）
   - ✅ 勾选：使用 `api-free.deepl.com`（免费账户）
   - ❌ 不勾选：使用 `api.deepl.com`（专业账户）
5. 点击 "保存设置"

### 3. 开始使用

- 在网页上选中文本
- 右键点击选择 "Translate"
- 或使用快捷键/按钮触发翻译
- DeepL 将提供高质量的翻译结果

## 功能特点

### ✨ 优势

1. **高质量翻译**：DeepL 以其卓越的翻译质量著称
2. **多语言支持**：支持 30+ 种语言
3. **免费额度**：每月 500,000 字符的免费翻译
4. **自动语言检测**：无需手动选择源语言
5. **统一架构**：与 Google Translate、有道翻译使用相同接口

### 🔧 技术集成

- 继承自 `TranslationProvider` 抽象基类
- 自动补充音标（通过 FreeDictionary API）
- 支持缓存以节省 API 配额
- CORS 代理处理（通过 background script）
- 完整的错误处理和用户提示

## 支持的语言

DeepL 支持以下语言（截至 2024）：

| 语言 | 代码 | 说明 |
|------|------|------|
| 中文（简体） | zh-CN | Chinese (Simplified) |
| 中文（繁体） | zh-TW | Chinese (Traditional) |
| 英语 | en | English |
| 日语 | ja | Japanese |
| 韩语 | ko | Korean |
| 法语 | fr | French |
| 德语 | de | German |
| 西班牙语 | es | Spanish |
| 俄语 | ru | Russian |
| 意大利语 | it | Italian |
| 葡萄牙语 | pt | Portuguese |
| 荷兰语 | nl | Dutch |
| 波兰语 | pl | Polish |
| 阿拉伯语 | ar | Arabic |
| ... | ... | 总计 30+ 种语言 |

## 测试工具

### 使用测试页面

1. 在浏览器中打开 `test-deepl-translate.html`
2. 输入您的 API 密钥并保存
3. 点击 "Test Connection" 验证配置
4. 尝试翻译示例文本
5. 查看详细的翻译结果

### 测试示例

```javascript
// 英译中
源文本: "Hello, how are you today?"
目标语言: zh-CN
预期结果: "你好，你今天怎么样？"

// 法译英
源文本: "Bonjour le monde!"
目标语言: en
预期结果: "Hello world!"
```

## 常见问题

### Q: 为什么没有音标？
**A:** DeepL 本身不提供音标信息。扩展会自动使用 FreeDictionary API 补充英文单词的音标。要启用此功能：
1. 进入设置页面
2. 找到 "音标与注音设置"
3. 勾选 "启用音标补充"

### Q: 如何节省 API 配额？
**A:** 
1. 启用缓存功能（设置 → 性能设置 → 启用缓存）
2. 增加缓存大小（推荐 100-500）
3. 避免重复翻译相同内容

### Q: Free API 和 Pro API 有什么区别？
**A:**
- **Free API**: 
  - 每月 500,000 字符
  - 适合个人使用
  - 端点：`api-free.deepl.com`
- **Pro API**:
  - 根据订阅计划提供更高配额
  - 适合商业使用
  - 端点：`api.deepl.com`

### Q: 如何查看剩余配额？
**A:** 登录 [DeepL 账户页面](https://www.deepl.com/pro-account) 查看使用情况和剩余配额。

### Q: 遇到 "403 Authentication failed" 错误？
**A:** 
1. 检查 API 密钥是否正确
2. 确认 Free/Pro API 选择与账户类型匹配
3. 确保密钥没有过期

### Q: 遇到 "456 Quota exceeded" 错误？
**A:** 
1. 您已超出月度配额限制
2. 等待下月重置或升级到 Pro 账户
3. 临时切换到其他翻译提供商

## 技术架构

### 数据流

```
用户选择文本
    ↓
Content Script (content.js)
    ↓
Translation Service (translation-service.js)
    ↓
DeepL Provider (DeepLTranslateProvider)
    ↓
Background Script (background.js) [CORS 代理]
    ↓
DeepL API (api-free.deepl.com 或 api.deepl.com)
    ↓
返回翻译结果
    ↓
补充音标 (FreeDictionary API)
    ↓
显示结果 (TranslationUI)
```

### 核心组件

1. **DeepLTranslateProvider** (`translation-service.js`)
   - 继承 `TranslationProvider` 基类
   - 实现 `translate()`, `detectLanguage()`, `getSupportedLanguages()` 方法
   - 语言代码转换
   - API 配置管理

2. **Background Handler** (`background.js`)
   - 处理 `deeplTranslate` 消息
   - 代理 API 请求以绕过 CORS
   - 错误处理和重试逻辑

3. **Settings UI** (`options.html`, `options.js`)
   - API 密钥配置
   - Free/Pro API 选择
   - 设置保存和加载

4. **Content Integration** (`content.js`)
   - 提供者配置更新
   - 翻译触发和结果显示
   - 与其他提供者协同工作

## 开发指南

### 添加新功能

如果您想为 DeepL 提供者添加新功能，可以参考以下步骤：

1. **修改 DeepLTranslateProvider 类** (`translation-service.js`)
```javascript
class DeepLTranslateProvider extends TranslationProvider {
  // 添加新方法
  async yourNewMethod() {
    // 实现
  }
}
```

2. **更新 API 请求参数** (如需要)
```javascript
const params = {
  text: text,
  target_lang: target_lang,
  source_lang: source_lang,
  // 添加新参数
  formality: 'prefer_more', // 例如：正式/非正式
  tag_handling: 'html'      // 例如：HTML 标签处理
};
```

3. **更新设置界面** (`options.html`, `options.js`)
   - 添加新的配置选项
   - 保存/加载逻辑

4. **测试**
   - 使用 `test-deepl-translate.html` 测试新功能
   - 检查错误处理和边界情况

### 调试技巧

1. **查看控制台日志**
```javascript
// 在 content.js 或 translation-service.js 中
console.log('[DeepLTranslate] Debug info:', data);
```

2. **使用测试页面**
   - 打开 `test-deepl-translate.html`
   - 查看详细的请求和响应

3. **检查 Background Script**
```javascript
// 在浏览器中打开：chrome://extensions/
// 点击 "Service Worker" 查看日志
```

## 相关资源

- [DeepL API 文档](https://www.deepl.com/docs-api)
- [DeepL Pro API 注册](https://www.deepl.com/pro-api)
- [DeepL 支持页面](https://support.deepl.com/)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)

## 许可证

本项目遵循项目主许可证。DeepL API 的使用需要遵守 [DeepL 服务条款](https://www.deepl.com/pro-license)。

## 更新日志

### v1.0.0 (2025-10-13)
- ✨ 初始实现 DeepL 翻译服务提供者
- 🔧 支持 Free 和 Pro API
- 🌍 支持 30+ 种语言
- 📝 完整的文档和测试工具
- 🎨 美观的配置界面
- 🐛 完善的错误处理

---

**需要帮助？** 请查看 [DEEPL_IMPLEMENTATION.md](./DEEPL_IMPLEMENTATION.md) 了解技术实现细节。
