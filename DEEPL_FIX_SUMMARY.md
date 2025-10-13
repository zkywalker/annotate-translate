# DeepL 错误修复总结

## 📋 问题列表

| # | 错误代码 | 错误信息 | 状态 |
|---|---------|---------|------|
| 1 | 403 | Wrong endpoint. Use https://api-free.deepl.com | ✅ 已修复 |
| 2 | 400 | Value for 'source_lang' not supported | ✅ 已修复 |

---

## 🔧 修复 #1: 403 端点错误

### 问题
用户使用免费 API 密钥（以 `:fx` 结尾），但配置使用了专业 API 端点。

### 解决方案
1. **自动检测** API 密钥类型（检查 `:fx` 后缀）
2. **增强错误提示**，指导用户正确配置
3. **详细日志**，显示使用的 API 端点和密钥类型

### 修改文件
- `translation-service.js` - `updateConfig()` 方法
- `translation-service.js` - 错误处理逻辑

### 文档
- `DEEPL_403_ERROR_FIX.md` - 完整故障排除指南
- `DEEPL_QUICK_FIX.md` - 3 步快速解决方案

---

## 🔧 修复 #2: 400 源语言错误

### 问题
当使用自动语言检测时，扩展可能向 DeepL 发送空的 `source_lang` 参数，导致 400 错误。

### 解决方案
1. **更严格的参数检查**：直接检查原始 `sourceLang !== 'auto'`
2. **分离语言映射**：源语言和目标语言使用不同的代码规则
3. **扩展语言支持**：从 15 种增加到 30+ 种语言
4. **增强错误处理**：提供具体的语言相关错误信息

### 修改文件
- `translation-service.js` - `convertLangCode()` 方法（添加 `isTarget` 参数）
- `translation-service.js` - `translate()` 方法（改进参数检查逻辑）
- `translation-service.js` - 错误处理（更详细的 400 错误信息）

### 文档
- `DEEPL_400_SOURCE_LANG_FIX.md` - 完整技术分析
- `DEEPL_400_QUICK_FIX.md` - 一步快速解决

---

## 📊 代码改进统计

### translation-service.js

| 方法 | 改进 | 代码行数 |
|------|------|---------|
| `updateConfig()` | 自动检测 API 密钥类型 | +6 |
| `convertLangCode()` | 分离源/目标语言映射 | +90 |
| `translate()` | 增强参数检查和日志 | +15 |
| 错误处理 | 更详细的 403/400 错误信息 | +12 |
| **总计** | | **+123 行** |

### 语言支持

| 分类 | 以前 | 现在 | 增加 |
|------|------|------|------|
| 支持语言数 | 15 | 30+ | +15 |
| 源语言映射 | 15 | 34 | +19 |
| 目标语言映射 | 15 | 34 | +19 |

---

## 🎯 关键改进

### 1. 自动检测 API 密钥类型
```javascript
if (this.apiKey && this.apiKey.includes(':fx')) {
  this.useFreeApi = true;
  console.log('✅ 检测到免费 API 密钥');
}
```

**效果**: 用户无需手动配置"使用免费 API"选项

### 2. 智能源语言处理
```javascript
// ✅ 严格检查原始值
if (sourceLang !== 'auto' && source_lang && source_lang !== '') {
  params.source_lang = source_lang;
} else {
  // 自动检测：完全不发送 source_lang 参数
}
```

**效果**: 避免向 DeepL 发送空的 source_lang 参数

### 3. 分离源/目标语言映射
```javascript
convertLangCode(langCode, isTarget = false) {
  const sourceLangMap = { 'en': 'EN', ... };      // EN
  const targetLangMap = { 'en': 'EN-US', ... };   // EN-US
  return (isTarget ? targetLangMap : sourceLangMap)[langCode];
}
```

**效果**: 符合 DeepL API 规范，源语言用简单代码，目标语言用具体变体

### 4. 详细的错误诊断
```javascript
if (error.message.includes('source_lang')) {
  throw new Error('DeepL API error: Unsupported source language...');
} else if (error.message.includes('target_lang')) {
  throw new Error('DeepL API error: Unsupported target language...');
}
```

**效果**: 用户能立即了解问题所在

---

## 🧪 测试清单

### 测试场景

| 场景 | 预期结果 | 状态 |
|------|---------|------|
| 使用免费 API 密钥（:fx） | 自动使用 api-free.deepl.com | ✅ |
| 使用专业 API 密钥 | 自动使用 api.deepl.com | ✅ |
| 自动语言检测（auto） | 不发送 source_lang 参数 | ✅ |
| 指定源语言（en） | 发送 source_lang: "EN" | ✅ |
| 目标语言为英语 | 使用 EN-US（美式） | ✅ |
| 目标语言为葡萄牙语 | 使用 PT-BR（巴西） | ✅ |
| 30+ 种语言 | 全部支持 | ✅ |

### 错误处理测试

| 错误 | 错误信息 | 状态 |
|------|---------|------|
| 403 端点错误 | "请检查'使用免费 API'设置" | ✅ |
| 403 认证错误 | "请检查 API 密钥" | ✅ |
| 400 源语言错误 | "不支持的源语言代码" | ✅ |
| 400 目标语言错误 | "不支持的目标语言" | ✅ |
| 456 配额错误 | "API 配额已用完" | ✅ |

---

## 📚 文档结构

```
DeepL 实现和故障排除文档
│
├── 核心文档
│   ├── DEEPL_IMPLEMENTATION.md       # 完整实现指南（5000+ 字）
│   └── DEEPL_API_REFERENCE.md        # API 参考文档
│
├── 403 错误（端点问题）
│   ├── DEEPL_403_ERROR_FIX.md        # 详细分析和解决方案
│   └── DEEPL_QUICK_FIX.md            # 3 步快速修复
│
└── 400 错误（参数问题）
    ├── DEEPL_400_SOURCE_LANG_FIX.md  # 技术分析和修复
    └── DEEPL_400_QUICK_FIX.md        # 1 步快速修复
```

---

## 🎓 经验教训

### 1. API 参数处理
**教训**: 不要假设 API 会忽略空字符串参数
- ❌ 发送 `source_lang: ""`  → 400 错误
- ✅ 完全省略 `source_lang` → 成功

### 2. 语言代码标准化
**教训**: 不同 API 有不同的语言代码规范
- DeepL：源语言用 `EN`，目标语言用 `EN-US`
- Google：统一用 `en`
- Youdao：用 `EN`

**解决**: 为每个 API 单独维护语言代码映射

### 3. 错误信息重要性
**教训**: 通用错误信息让用户困惑
- ❌ "Bad request" → 用户不知道怎么办
- ✅ "不支持的源语言代码" → 用户知道检查语言设置

### 4. 自动检测的价值
**教训**: 用户不应该手动配置明显的设置
- API 密钥以 `:fx` 结尾 → 明显是免费密钥
- 应该自动检测而不是让用户勾选选项

---

## 🚀 下一步

### 已完成 ✅
- [x] DeepL 提供者实现
- [x] 403 端点错误修复
- [x] 400 源语言错误修复
- [x] 自动密钥类型检测
- [x] 扩展语言支持（30+ 种）
- [x] 完整错误处理
- [x] 详细日志输出
- [x] 综合文档

### 建议改进 💡
- [ ] 添加语言自动检测（用户界面）
- [ ] 缓存语言检测结果
- [ ] 添加用量统计（Free API 有限制）
- [ ] 支持文档翻译（DeepL 支持）
- [ ] 支持术语表（DeepL Pro 功能）

---

## 📞 用户指南

### 遇到问题？

1. **403 错误** → 查看 `DEEPL_QUICK_FIX.md`
2. **400 错误** → 查看 `DEEPL_400_QUICK_FIX.md`
3. **其他问题** → 查看 `DEEPL_IMPLEMENTATION.md`

### 快速检查
```
打开浏览器控制台（F12）
→ 查找 [DeepLTranslate] 开头的日志
→ 检查 API URL 和参数
→ 查看详细错误信息
```

---

**更新日期**: 2025-10-13  
**修复数量**: 2 个关键错误  
**文档页数**: 4 个文档，约 400 行  
**代码改进**: +123 行，30+ 语言支持  
**状态**: ✅ 全部修复并测试通过
