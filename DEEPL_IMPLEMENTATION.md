# DeepL 翻译服务提供者实现文档

## 概述

本文档描述了 DeepL 翻译服务提供者的实现，它与现有的 Google Translate 和有道翻译提供者使用相同的抽象接口。

## 实现日期
2025年10月13日

## 架构设计

### 1. 抽象基类
所有翻译服务提供者都继承自 `TranslationProvider` 基类，该基类定义了统一的接口：

```javascript
class TranslationProvider {
  async translate(text, targetLang, sourceLang = 'auto')
  async detectLanguage(text)
  async getSupportedLanguages()
}
```

### 2. DeepL 提供者实现

#### 文件位置
- 主实现：`translation-service.js` (第 688-1007 行)
- Background 处理：`background.js` (handleDeepLTranslate 函数)
- UI 配置：`options.html` 和 `options.js`
- Content 脚本集成：`content.js`

#### 核心特性

1. **API 配置**
   - 支持 Free API 和 Pro API
   - Free API: `https://api-free.deepl.com/v2/translate`
   - Pro API: `https://api.deepl.com/v2/translate`
   - API 密钥存储在 `chrome.storage.sync` 中

2. **语言代码转换**
   - 自动将通用语言代码转换为 DeepL API 格式
   - 支持 30+ 种语言
   - 特殊处理：中文使用统一代码 'ZH'

3. **CORS 处理**
   - 通过 background script 代理请求
   - 使用 `Authorization: DeepL-Auth-Key` 认证头
   - Content-Type: `application/x-www-form-urlencoded`

4. **错误处理**
   - 403: 认证失败
   - 456: 配额超限
   - 400: 请求参数错误

5. **数据结构**
   - 返回标准的 `TranslationResult` 对象
   - 包含原文、译文、语言检测等信息
   - 音标和词义由 TranslationService 统一后处理补充

## 文件修改清单

### 1. translation-service.js
**添加内容：**
- `DeepLTranslateProvider` 类 (第 688-1007 行)
- 语言代码映射 (convertLangCode 方法)
- API 配置管理 (updateConfig, isConfigured 方法)
- 响应解析 (parseDeepLResponse 方法)
- 注册 DeepL 提供者到全局服务
- 导出 DeepLTranslateProvider 类

**代码统计：**
- 新增约 320 行代码
- 包含完整的文档注释

### 2. background.js
**添加内容：**
- 消息处理：`action: 'deeplTranslate'`
- `handleDeepLTranslate` 函数
- DeepL API 错误处理

**代码统计：**
- 新增约 35 行代码

### 3. options.html
**添加内容：**
- DeepL 提供者选项卡
- API 密钥输入框
- Free/Pro API 切换复选框
- 使用说明和链接

**UI 元素：**
- Radio button: `<input type="radio" name="provider" value="deepl">`
- Config section: `#deeplConfigSection`
- API Key input: `#deeplApiKey`
- Free API checkbox: `#deeplUseFreeApi`

### 4. options.js
**添加内容：**
- 默认设置：`deeplApiKey`, `deeplUseFreeApi`
- DOM 元素引用
- 加载/保存设置逻辑
- 提供者选择 UI 更新

**修改函数：**
- `DEFAULT_SETTINGS` 对象
- `elements` 对象
- `loadSettings()` 函数
- `saveSettings()` 函数
- `updateProviderSelection()` 函数

### 5. content.js
**添加内容：**
- 默认设置：`deeplApiKey`, `deeplUseFreeApi`
- DeepL 提供者配置更新逻辑
- 设置加载时的 DeepL 初始化

**修改位置：**
- 全局 `settings` 对象
- `chrome.storage.sync.get()` 默认值
- 提供者配置更新部分 (第 161-172 行)

### 6. test-deepl-translate.html (新文件)
**功能：**
- DeepL 翻译功能测试页面
- API 配置测试
- 连接测试
- 翻译示例
- 结果展示

**特点：**
- 美观的渐变 UI
- 交互式示例
- 本地存储 API 配置
- 详细的错误提示

## 使用指南

### 1. 获取 API 密钥
1. 访问 https://www.deepl.com/pro-api
2. 注册免费或专业账户
3. 从账户页面获取 API 密钥
4. 免费账户包含 500,000 字符/月的翻译额度

### 2. 配置扩展
1. 打开扩展选项页面
2. 在"翻译提供商"部分选择 "🚀 DeepL"
3. 输入 API 密钥
4. 选择是否使用 Free API（默认勾选）
5. 点击保存

### 3. 使用翻译
- 选择文本后右键点击"Translate"
- 或使用快捷键/按钮触发翻译
- DeepL 会提供高质量的翻译结果

### 4. 测试功能
1. 在浏览器中打开 `test-deepl-translate.html`
2. 配置 API 密钥
3. 点击"Test Connection"验证连接
4. 尝试翻译示例文本

## 技术细节

### API 请求格式
```javascript
POST https://api-free.deepl.com/v2/translate
Headers:
  Authorization: DeepL-Auth-Key YOUR_API_KEY
  Content-Type: application/x-www-form-urlencoded
Body:
  text=Hello
  target_lang=ZH
  source_lang=EN (可选)
```

### 响应格式
```json
{
  "translations": [
    {
      "detected_source_language": "EN",
      "text": "你好"
    }
  ]
}
```

### 数据流
1. Content Script → Background Script (绕过 CORS)
2. Background Script → DeepL API
3. DeepL API → Background Script
4. Background Script → Content Script
5. Content Script → TranslationUI (显示结果)

## 音标补充机制

DeepL 本身不提供音标和词义解释，这些信息通过以下机制补充：

1. **TranslationService 统一后处理**
   - `enablePhoneticFallback` 设置控制
   - 使用 FreeDictionary API 补充英文单词音标
   - 仅对单个英文单词生效

2. **补充时机**
   - 在 `TranslationService.translate()` 方法中
   - 检测到无音标时自动触发
   - 补充后更新 `annotationText`

## 与现有提供者的对比

### 相同点
- 继承自 `TranslationProvider` 基类
- 实现相同的接口方法
- 使用 background script 绕过 CORS
- 支持语言自动检测
- 集成到统一的翻译服务架构

### 不同点
1. **API 认证**
   - Google: 无需密钥（公共 API）
   - 有道: AppKey + AppSecret + 签名
   - DeepL: API Key + Authorization Header

2. **语言代码**
   - Google: 使用标准代码（zh-CN, zh-TW）
   - 有道: 使用特殊代码（zh-CHS, zh-CHT）
   - DeepL: 使用大写代码（ZH, EN, DE）

3. **响应内容**
   - Google: 包含音标、词义、例句
   - 有道: 包含音标（词典 API）、词义、例句
   - DeepL: 仅包含翻译文本，需要后处理补充

4. **API 限制**
   - Google: 公共 API 有速率限制
   - 有道: 需要注册获取凭据
   - DeepL: 免费账户 500,000 字符/月

## 未来改进建议

1. **缓存优化**
   - 针对 DeepL 的配额限制，优先使用缓存
   - 实现智能缓存策略

2. **批量翻译**
   - DeepL API 支持批量翻译多个文本
   - 可以优化为一次请求翻译多个段落

3. **术语表支持**
   - DeepL Pro API 支持自定义术语表
   - 可以添加领域专业词汇支持

4. **翻译质量偏好**
   - DeepL API 支持 `formality` 参数
   - 可以添加正式/非正式语气选项

5. **文档翻译**
   - 扩展支持整页翻译
   - 保持格式的文档翻译

## 测试清单

- [x] API 密钥配置保存和加载
- [x] Free/Pro API 切换
- [x] 单词翻译（英译中）
- [x] 短语翻译
- [x] 长文本翻译
- [x] 语言自动检测
- [x] 音标补充（通过 FreeDictionary）
- [x] 错误处理（无效密钥、配额超限等）
- [x] 与其他提供者切换
- [x] 设置页面 UI
- [x] 测试页面功能

## 已知问题和限制

1. **音标限制**
   - DeepL 不提供音标
   - 仅英文单词可通过 FreeDictionary 补充
   - 其他语言暂无音标来源

2. **词义解释**
   - DeepL 不提供词义解释
   - 暂无补充方案

3. **例句**
   - DeepL 不提供例句
   - 暂无补充方案

4. **API 限制**
   - 免费账户有字符数限制
   - 建议配合缓存使用
   - 超限时需要等待或升级账户

## 贡献者
- 实现者：GitHub Copilot
- 日期：2025年10月13日

## 参考资料
- [DeepL API 文档](https://www.deepl.com/docs-api)
- [DeepL Pro API 注册](https://www.deepl.com/pro-api)
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/)
