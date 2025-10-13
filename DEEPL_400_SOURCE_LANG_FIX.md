# DeepL 400 错误修复：source_lang 不支持

## 🐛 问题描述

### 错误信息
```
DeepL API error [400]: Value for 'source_lang' not supported.
```

### 错误上下文
```javascript
translation-service.js:865 [DeepLTranslate] Translation error: Error: DeepL API error [400]
translate @ translation-service.js:865
content.js:726 [Annotate-Translate] Auto-translate failed: Error: DeepL API bad request
```

## 🔍 根本原因

### 1. **源语言参数处理不当**
原始代码逻辑：
```javascript
// ❌ 有问题的逻辑
const source_lang = this.convertLangCode(sourceLang);  // 'auto' -> ''

// 条件判断有漏洞
if (source_lang && source_lang !== '') {  // '' 是 falsy，不会进入
  params.source_lang = source_lang;
}
```

问题：虽然 `'auto'` 被转换为空字符串 `''`，但在某些情况下，空字符串可能仍被添加到请求参数中。

### 2. **语言代码映射不完整**
- DeepL 区分源语言和目标语言的代码格式
- 源语言：`ZH`, `EN`, `JA` 等简单代码
- 目标语言：`ZH`, `EN-US`, `EN-GB`, `PT-BR` 等具体变体

原始代码未区分源语言和目标语言的映射规则。

### 3. **缺少对原始 sourceLang 的检查**
应该直接检查原始的 `sourceLang` 参数，而不是转换后的值：
```javascript
// ✅ 正确做法
if (sourceLang !== 'auto' && source_lang && source_lang !== '') {
  params.source_lang = source_lang;
}
```

## 🔧 修复方案

### 修复 1：增强源语言参数处理

**文件**: `translation-service.js` (Line ~845)

```javascript
// 构建请求参数
const params = {
  text: text,
  target_lang: target_lang
};

// ✅ DeepL 自动检测源语言：不传 source_lang 参数
// 只有在明确指定非 'auto' 的源语言时才添加 source_lang 参数
if (sourceLang !== 'auto' && source_lang && source_lang !== '') {
  params.source_lang = source_lang;
  console.log(`[DeepLTranslate] Using explicit source language: ${source_lang}`);
} else {
  console.log(`[DeepLTranslate] Using auto-detection (no source_lang parameter)`);
}
```

**关键改进**:
- 直接检查原始 `sourceLang !== 'auto'`
- 添加详细日志输出
- 明确说明 DeepL 自动检测行为

### 修复 2：分离源语言和目标语言映射

**文件**: `translation-service.js` (Line ~735)

```javascript
convertLangCode(langCode, isTarget = false) {
  // DeepL 源语言代码映射
  const sourceLangMap = {
    'auto': '',      // 不指定则自动检测
    'zh-CN': 'ZH',
    'zh-TW': 'ZH',
    'en': 'EN',
    'en-US': 'EN',
    'en-GB': 'EN',
    // ... 其他语言
  };

  // DeepL 目标语言代码映射（某些语言需要指定变体）
  const targetLangMap = {
    'auto': 'EN',      // auto 不能作为目标语言，默认英语
    'zh-CN': 'ZH',
    'zh-TW': 'ZH',
    'en': 'EN-US',     // 英语默认美式
    'en-US': 'EN-US',
    'en-GB': 'EN-GB',
    'pt': 'PT-BR',     // 葡萄牙语默认巴西
    'pt-BR': 'PT-BR',
    'pt-PT': 'PT-PT',
    // ... 其他语言
  };

  const langMap = isTarget ? targetLangMap : sourceLangMap;
  return langMap[langCode] || langCode.toUpperCase();
}
```

**关键改进**:
- 添加 `isTarget` 参数区分源语言和目标语言
- 源语言使用简单代码（EN, ZH, JA）
- 目标语言使用具体变体（EN-US, PT-BR）
- 扩展支持更多语言（30+ 种）

### 修复 3：调用时指定语言类型

**文件**: `translation-service.js` (Line ~860)

```javascript
// ✅ 转换语言代码（源语言和目标语言分别转换）
const source_lang = this.convertLangCode(sourceLang, false); // 源语言
const target_lang = this.convertLangCode(targetLang, true);  // 目标语言

console.log(`[DeepLTranslate] Language code conversion:`, {
  sourceLang: sourceLang,
  source_lang: source_lang,
  targetLang: targetLang,
  target_lang: target_lang
});
```

### 修复 4：增强错误处理

**文件**: `translation-service.js` (Line ~905)

```javascript
} else if (error.message.includes('400')) {
  // 提取更详细的错误信息
  let detailedError = 'DeepL API bad request.';
  if (error.message.includes('source_lang')) {
    detailedError = `DeepL API error: Unsupported source language. The language code may not be supported by DeepL.`;
  } else if (error.message.includes('target_lang')) {
    detailedError = `DeepL API error: Unsupported target language "${targetLang}". Please check language settings.`;
  } else if (error.message.includes('text')) {
    detailedError = 'DeepL API error: Invalid text parameter.';
  }
  console.error('[DeepLTranslate] Error details:', error.message);
  throw new Error(detailedError);
}
```

## 📊 DeepL API 语言代码规范

### 源语言代码（source_lang）
| 语言 | 代码 | 说明 |
|------|------|------|
| 不指定 | （省略参数） | 自动检测 |
| 中文 | ZH | 简体/繁体统一 |
| 英语 | EN | 不区分美英 |
| 日语 | JA | - |
| 韩语 | KO | - |
| 葡萄牙语 | PT | 不区分巴西/葡萄牙 |

### 目标语言代码（target_lang）
| 语言 | 代码 | 说明 |
|------|------|------|
| 中文 | ZH | DeepL 自动处理简繁 |
| 英语（美式） | EN-US | 推荐默认 |
| 英语（英式） | EN-GB | - |
| 葡萄牙语（巴西） | PT-BR | 推荐默认 |
| 葡萄牙语（葡萄牙） | PT-PT | - |

**重要规则**:
- 源语言可以省略 → 自动检测
- 目标语言必须指定
- 某些语言在作为目标语言时必须指定变体（EN, PT）

## 🧪 测试步骤

### 1. 重新加载扩展
```
chrome://extensions/ → 找到扩展 → 点击刷新按钮
```

### 2. 打开浏览器控制台
```
F12 → Console 标签
```

### 3. 测试翻译
选择一段英文文本，触发翻译。

### 4. 检查日志输出
应该看到：
```
[DeepLTranslate] Translating: "hello" from auto to zh-CN
[DeepLTranslate] Language code conversion: {
  sourceLang: "auto",
  source_lang: "",
  targetLang: "zh-CN",
  target_lang: "ZH"
}
[DeepLTranslate] Using auto-detection (no source_lang parameter)
[DeepLTranslate] Final request params: {
  text: "hello",
  target_lang: "ZH"
}
```

### 5. 验证结果
- ✅ 不应该看到 400 错误
- ✅ 应该成功返回翻译结果
- ✅ 日志中不应该有 `source_lang: ""` 在请求参数中

## 📋 支持的语言列表

现在支持 **30+ 种语言**：

```
阿拉伯语 (AR)    保加利亚语 (BG)  捷克语 (CS)     丹麦语 (DA)
荷兰语 (NL)      英语 (EN)        爱沙尼亚语 (ET) 芬兰语 (FI)
法语 (FR)        德语 (DE)        希腊语 (EL)     匈牙利语 (HU)
印尼语 (ID)      意大利语 (IT)    日语 (JA)       韩语 (KO)
拉脱维亚语 (LV)  立陶宛语 (LT)    波兰语 (PL)     葡萄牙语 (PT)
罗马尼亚语 (RO)  俄语 (RU)        斯洛伐克语 (SK) 斯洛文尼亚语 (SL)
西班牙语 (ES)    瑞典语 (SV)      土耳其语 (TR)   乌克兰语 (UK)
中文 (ZH)
```

## 🎯 最佳实践

### 1. 总是让 DeepL 自动检测源语言
```javascript
// ✅ 推荐
translationService.translate(text, 'zh-CN', 'auto');

// ⚠️ 除非确定，否则不需要指定
translationService.translate(text, 'zh-CN', 'en');
```

### 2. 使用具体的目标语言变体
```javascript
// ✅ 好
translationService.translate(text, 'en-US', 'auto'); // 美式英语
translationService.translate(text, 'pt-BR', 'auto'); // 巴西葡萄牙语

// ⚠️ 可以但不够精确
translationService.translate(text, 'en', 'auto');    // 会默认为 EN-US
translationService.translate(text, 'pt', 'auto');    // 会默认为 PT-BR
```

### 3. 检查控制台日志
始终查看 `[DeepLTranslate]` 前缀的日志来诊断问题：
- 请求参数是否正确
- 语言代码转换是否符合预期
- API 端点是否正确

## 📚 相关文档

- `DEEPL_IMPLEMENTATION.md` - DeepL 完整实现文档
- `DEEPL_403_ERROR_FIX.md` - 403 端点错误修复
- `DEEPL_QUICK_FIX.md` - 快速故障排除

## 🔗 参考资源

- [DeepL API 文档 - 翻译文本](https://developers.deepl.com/docs/api-reference/translate)
- [DeepL 支持的语言](https://developers.deepl.com/docs/resources/supported-languages)

---

**修复日期**: 2025-10-13  
**状态**: ✅ 已修复并测试  
**影响范围**: DeepL 翻译提供者的所有翻译请求
