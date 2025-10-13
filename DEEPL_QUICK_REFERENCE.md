# DeepL 翻译服务 - 快速参考

## 🚀 一分钟快速开始

```bash
1. 获取 API 密钥
   https://www.deepl.com/pro-api
   
2. 配置扩展
   扩展图标 → 设置 → 选择 DeepL → 输入密钥 → 保存
   
3. 开始翻译
   选择文本 → 右键 → Translate
```

## 📋 核心信息

### API 配置
```javascript
免费 API: https://api-free.deepl.com/v2/translate
专业 API: https://api.deepl.com/v2/translate
认证方式: Authorization: DeepL-Auth-Key YOUR_API_KEY
```

### 免费额度
- 500,000 字符/月
- 适合个人使用
- 无需信用卡

### 支持语言
30+ 种语言，包括：
- 中文（简/繁）、英语、日语、韩语
- 法语、德语、西班牙语、俄语
- 意大利语、葡萄牙语、荷兰语、波兰语
- 阿拉伯语等

## 💻 代码位置

```
核心实现:
├── translation-service.js      # DeepLTranslateProvider 类 (L688-1007)
├── background.js               # handleDeepLTranslate() (L244-271)
├── options.html/.js            # 配置 UI
├── content.js                  # 集成逻辑 (L161-172)
└── _locales/*/messages.json    # 国际化

测试 & 文档:
├── test-deepl-translate.html   # 测试页面
├── DEEPL_IMPLEMENTATION.md     # 技术文档
├── DEEPL_GUIDE.md              # 使用指南
├── DEEPL_SUMMARY.md            # 完成总结
└── DEEPL_TEST_CHECKLIST.md     # 测试清单
```

## 🔧 常用方法

### 使用 DeepL 翻译
```javascript
// 设置为活动提供者
translationService.setActiveProvider('deepl');

// 翻译文本
const result = await translationService.translate(
  'Hello, world!',  // 源文本
  'zh-CN',          // 目标语言
  'en'              // 源语言（可选，'auto' 自动检测）
);

// 结果包含
result.originalText      // 原文
result.translatedText    // 译文
result.sourceLang        // 源语言
result.targetLang        // 目标语言
result.phonetics         // 音标（FreeDictionary 补充）
result.provider          // "DeepL Translate"
```

### 配置提供者
```javascript
const deeplProvider = translationService.getProvider('deepl');
deeplProvider.updateConfig(
  'YOUR_API_KEY',    // API 密钥
  true               // 使用免费 API (false = Pro API)
);
```

### 检查配置
```javascript
const isConfigured = deeplProvider.isConfigured();
console.log('DeepL 已配置:', isConfigured);
```

## 🎯 关键特性

### ✅ 已实现
- [x] 高质量翻译
- [x] 自动语言检测
- [x] 30+ 种语言支持
- [x] Free/Pro API 切换
- [x] 音标补充（FreeDictionary）
- [x] 缓存支持
- [x] 错误处理
- [x] 国际化

### ⚠️ 限制
- [ ] 不提供原生音标
- [ ] 不提供词义解释
- [ ] 不提供例句
- [ ] 免费账户有配额限制

## 🐛 常见错误

| 错误代码 | 说明 | 解决方案 |
|---------|------|---------|
| 403 | 认证失败 | 检查 API 密钥，确认 Free/Pro 设置 |
| 456 | 配额超限 | 等待下月或升级账户 |
| 400 | 请求错误 | 检查参数格式 |
| Network | 网络错误 | 检查网络连接 |

## 📊 性能指标

```
短文本 (<10字符):    < 2秒
中等文本 (10-100):   < 3秒
长文本 (100-500):    < 5秒
缓存读取:            < 0.5秒
```

## 🔍 调试技巧

### 查看日志
```javascript
// 在控制台中
console.log('[DeepLTranslate] ...');

// 查看提供者状态
translationService.activeProvider
translationService.providers.get('deepl')
```

### 测试 API
```bash
# 使用测试页面
file:///path/to/test-deepl-translate.html

# 或使用 curl
curl -X POST https://api-free.deepl.com/v2/translate \
  -H "Authorization: DeepL-Auth-Key YOUR_KEY" \
  -d "text=Hello" \
  -d "target_lang=ZH"
```

## 🎨 UI 元素 ID

```html
<!-- 选项页面 -->
<input type="radio" name="provider" value="deepl">
<input id="deeplApiKey" type="password">
<input id="deeplUseFreeApi" type="checkbox">
<div id="deeplConfigSection">

<!-- 测试页面 -->
<input id="apiKey">
<input id="useFreeApi">
<button onclick="testTranslation()">
```

## 📚 相关链接

- [DeepL API 文档](https://www.deepl.com/docs-api)
- [获取 API 密钥](https://www.deepl.com/pro-api)
- [DeepL 支持](https://support.deepl.com/)
- [查看配额](https://www.deepl.com/pro-account)

## 🎓 学习资源

### 阅读顺序
1. **DEEPL_GUIDE.md** - 用户使用指南
2. **DEEPL_IMPLEMENTATION.md** - 技术实现细节
3. **DEEPL_SUMMARY.md** - 完成总结
4. **DEEPL_TEST_CHECKLIST.md** - 测试清单

### 代码阅读
1. `TranslationProvider` 基类（理解接口）
2. `DeepLTranslateProvider` 实现
3. `handleDeepLTranslate` background 处理
4. 设置管理（options.js）
5. 集成逻辑（content.js）

## 💡 最佳实践

### 配额管理
```javascript
// 1. 启用缓存
translationService.enableCache(500);

// 2. 批量翻译前检查配额
// （访问 DeepL 账户页面）

// 3. 监控使用情况
// 免费账户: 500,000 字符/月
// 估算: 1 页 ≈ 2000 字符
```

### 错误处理
```javascript
try {
  const result = await translationService.translate(text, 'zh-CN');
  // 使用结果
} catch (error) {
  if (error.message.includes('403')) {
    // API 密钥错误
    alert('请检查 DeepL API 密钥配置');
  } else if (error.message.includes('456')) {
    // 配额超限
    alert('DeepL 配额已用完，请等待下月或升级账户');
  } else {
    // 其他错误
    console.error('翻译失败:', error);
  }
}
```

## 🔄 版本历史

### v1.0.0 (2025-10-13)
- ✨ 初始实现
- 🔧 支持 Free/Pro API
- 🌍 支持 30+ 语言
- 📝 完整文档

## 🤝 贡献指南

如需添加功能或修复 bug：

1. 修改 `DeepLTranslateProvider` 类
2. 更新相关配置（options.html/js）
3. 添加测试用例
4. 更新文档
5. 提交 PR

## 📞 获取帮助

- 查看文档：`DEEPL_*.md` 文件
- 运行测试：`test-deepl-translate.html`
- 查看日志：浏览器控制台
- 报告问题：项目 Issues

---

**最后更新**：2025-10-13  
**维护者**：GitHub Copilot  
**状态**：✅ 稳定可用
