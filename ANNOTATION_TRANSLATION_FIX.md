# 修复标注文本使用英文定义的问题

## 🐛 问题描述

当使用 Google 翻译标注英文单词时，标注显示的是**英文定义**而不是**中文翻译**。

### 示例

**单词**: `consider`

**Google 翻译返回**:
```json
{
  "originalText": "consider",
  "translatedText": "考虑",  // ← 这是正确的中文翻译
  "phonetics": [...],
  "definitions": [
    {
      "partOfSpeech": "动词",
      "text": "think carefully about (something), typically before making a decision."  // ← 这是英文定义
    }
  ]
}
```

**错误的标注显示**:
```
/kən'sɪdə-/ think carefully about (something), typically before making a decision.
```

**应该显示**:
```
/kən'sɪdə-/ 考虑
```

## 🔍 根本原因

在 `generateAnnotationText()` 方法中，对于单词优先使用了 `definitions[0].text`，但这个字段的含义在不同提供者中不同：

- **有道翻译**: `definitions[0].text` 是中文词义 ✅
- **Google 翻译**: `definitions[0].text` 是英文定义 ❌

### 错误的逻辑

```javascript
// 错误：优先使用 definitions[0].text
if (result.definitions && result.definitions.length > 0 && result.originalText.split(' ').length === 1) {
  parts.push(result.definitions[0].text);  // ← Google 返回的是英文定义
} else if (result.translatedText) {
  parts.push(result.translatedText);
}
```

## ✅ 解决方案

**统一使用 `translatedText` 作为标注文本**，这是所有翻译提供者的主要翻译结果。

### 修复后的逻辑

```javascript
// 正确：直接使用 translatedText
if (result.translatedText) {
  parts.push(result.translatedText);  // ← 所有提供者都返回正确的翻译
}
```

## 📊 修复对比

| 提供者 | 单词 | 修复前 | 修复后 |
|--------|------|--------|--------|
| Google | consider | `/kən'sɪdə-/ think carefully about...` ❌ | `/kən'sɪdə-/ 考虑` ✅ |
| Google | hello | `/həˈloʊ/ used as a greeting...` ❌ | `/həˈloʊ/ 你好` ✅ |
| 有道 | world | `/wɜːld/ 世界` ✅ | `/wɜːld/ 世界` ✅ |

## 🔧 修改的代码

### 1. TranslationService.generateAnnotationText()

**文件**: `translation-service.js` 第1116-1140行

**修改前**:
```javascript
generateAnnotationText(result) {
  const parts = [];
  
  if (phonetic && phonetic.text) {
    parts.push(phonetic.text);
  }
  
  // ❌ 优先使用 definitions[0].text（可能是英文定义）
  if (result.definitions && result.definitions.length > 0 && result.originalText.split(' ').length === 1) {
    parts.push(result.definitions[0].text);
  } else if (result.translatedText) {
    parts.push(result.translatedText);
  }
  
  return parts.join(' ');
}
```

**修改后**:
```javascript
generateAnnotationText(result) {
  const parts = [];
  
  if (phonetic && phonetic.text) {
    parts.push(phonetic.text);
  }
  
  // ✅ 直接使用 translatedText（所有提供者的主要翻译）
  if (result.translatedText) {
    parts.push(result.translatedText);
  }
  
  return parts.join(' ');
}
```

### 2. YoudaoTranslateProvider.generateAnnotationText()

**文件**: `translation-service.js` 第638-661行

做了同样的修改，保持两个方法的一致性。

## 🧪 测试验证

### 测试步骤

1. **选择 Google 翻译**
2. **选中单词** "consider"
3. **点击标注**
4. **查看标注内容**

### 预期结果

**修复前**:
```
/kən'sɪdə-/ think carefully about (something), typically before making a decision.
```

**修复后**:
```
/kən'sɪdə-/ 考虑
```

### 更多测试用例

| 单词 | 预期标注 |
|------|----------|
| hello | `/həˈloʊ/ 你好` |
| world | `/wɜːld/ 世界` |
| example | `/ɪɡˈzæmpəl/ 例子` |
| beautiful | `/ˈbjuːtɪfl/ 美丽的` |
| consider | `/kənˈsɪdər/ 考虑` |

## 📝 设计说明

### translatedText vs definitions[0].text

| 字段 | 含义 | Google 翻译 | 有道翻译 |
|------|------|------------|----------|
| `translatedText` | 主要翻译结果 | 中文翻译 ✅ | 中文翻译 ✅ |
| `definitions[0].text` | 第一个词义/定义 | 英文定义 ❌ | 中文词义 ✅ |

### 为什么改为统一使用 translatedText？

1. **一致性**: 所有翻译提供者的 `translatedText` 都是目标语言的翻译
2. **准确性**: `translatedText` 是翻译服务的主要输出，最可靠
3. **简单性**: 不需要判断提供者类型或字段含义
4. **通用性**: 适用于单词、短语、句子

### definitions 的正确用途

`definitions` 字段应该用于：
- **翻译卡片中显示详细词义**
- **帮助用户理解单词的不同含义**
- **提供上下文和用法**

但**不应该用于标注**，因为：
- Google 翻译的 definitions 是英文定义
- 标注需要简洁的目标语言翻译
- `translatedText` 已经是最好的选择

## 🎯 影响范围

### 受益场景
- ✅ Google 翻译标注单词（主要修复）
- ✅ 所有提供者的标注行为统一
- ✅ 未来新增提供者自动正确

### 不受影响场景
- ✅ 翻译卡片的 definitions 显示（仍然显示详细词义）
- ✅ 例句显示
- ✅ 音标显示
- ✅ 短语和句子的标注

## ✅ 修复确认

- [x] 修复 TranslationService.generateAnnotationText()
- [x] 修复 YoudaoTranslateProvider.generateAnnotationText()
- [x] 保持两个方法逻辑一致
- [x] 简化代码逻辑
- [x] 无语法错误
- [x] 适用于所有提供者

---

**问题已修复！标注现在会正确显示中文翻译而不是英文定义。** 🎉
