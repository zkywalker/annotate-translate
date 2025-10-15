# OpenAI Provider 音标和释义修复

## 🐛 问题

### 问题 1: 音标错误
**现象**: 翻译 "chamber" → "房间" 时，返回的音标是 "fáng jiān"（中文拼音），而不是英文单词的 IPA 音标。

**根本原因**: 提示词中说 "Include phonetic transcription if applicable (IPA format for English, Pinyin for Chinese)"，但翻译方向是 English → Chinese，AI 误解为返回目标语言（中文）的拼音。

### 问题 2: 释义显示为空
**现象**: AI 返回了两条释义数据：
```json
"definitions": [
  "建筑物内由墙壁、地板和天花板围合的空间",
  "特定用途的封闭空间（如会议厅、卧室）"
]
```
但在 UI 中显示为空白。

**根本原因**: 数据格式不匹配
- AI 返回的是简单字符串数组：`["定义1", "定义2"]`
- TranslationResult 需要的是对象数组：`[{partOfSpeech: "n.", text: "定义1"}, ...]`
- UI 渲染时找不到 `definition.text` 属性，所以显示为空

---

## 🔧 修复方案

### 修复 1: 明确提示词中的音标要求

**文件**: `ai-providers/prompt-templates.js`

**修改前**:
```javascript
2. Include phonetic transcription if applicable (IPA format for English, Pinyin for Chinese)
```

**修改后**:
```javascript
2. Include phonetic transcription of the SOURCE text (original text, not translation):
   - For English: use IPA format (e.g., /ˈtʃeɪmbə(r)/)
   - For Chinese: use Pinyin (e.g., fáng jiān)
   - If source text has no phonetic system, use empty string
```

**关键改进**:
- ✅ 明确说明是 "SOURCE text" 的音标，不是翻译结果的
- ✅ 提供具体示例（chamber 的 IPA）
- ✅ 说明如果源文本没有音标系统则返回空字符串

---

### 修复 2: 转换响应数据格式

**文件**: `ai-providers/openai-provider.js`

**修改前**:
```javascript
parseJsonResponse(rawResponse, originalText, sourceLang, targetLang) {
  const parsed = PromptTemplates.parseJsonResponse(rawResponse);
  if (parsed) {
    return {
      translatedText: parsed.translation,
      originalText, sourceLang, targetLang,
      provider: this.providerName,
      model: this.model,
      timestamp: Date.now(),
      phonetic: parsed.phonetic || '',        // ❌ 错误：字段名和类型不对
      definitions: parsed.definitions || [],   // ❌ 错误：格式不对
      metadata: {}
    };
  }
  // ...
}
```

**修改后**:
```javascript
parseJsonResponse(rawResponse, originalText, sourceLang, targetLang) {
  const parsed = PromptTemplates.parseJsonResponse(rawResponse);
  if (parsed) {
    // 转换音标格式：string → PhoneticInfo[]
    const phonetics = [];
    if (parsed.phonetic && parsed.phonetic.trim()) {
      phonetics.push({
        text: parsed.phonetic,
        type: this.detectPhoneticType(parsed.phonetic, sourceLang)
      });
    }

    // 转换释义格式：string[] → Definition[]
    const definitions = [];
    if (parsed.definitions && Array.isArray(parsed.definitions)) {
      parsed.definitions.forEach((def, index) => {
        definitions.push({
          partOfSpeech: '', // AI 返回的简化格式没有词性
          text: def
        });
      });
    }

    return {
      translatedText: parsed.translation,
      originalText, sourceLang, targetLang,
      provider: this.providerName,
      model: this.model,
      timestamp: Date.now(),
      phonetics: phonetics,      // ✅ 正确：PhoneticInfo[] 格式
      definitions: definitions,  // ✅ 正确：Definition[] 格式
      metadata: {}
    };
  }
  // ...
}

/**
 * 检测音标类型
 * @param {string} phonetic - 音标文本
 * @param {string} sourceLang - 源语言
 * @returns {string} 音标类型
 */
detectPhoneticType(phonetic, sourceLang) {
  // 如果包含 IPA 符号，判断为 IPA
  if (/[ˈˌːəɪʊɛæɔʌɑθðŋʃʒ]/.test(phonetic)) {
    return 'ipa';
  }
  // 如果是中文，判断为拼音
  if (sourceLang.startsWith('zh')) {
    return 'pinyin';
  }
  return 'default';
}
```

**关键改进**:
- ✅ 将 `phonetic` (string) 转换为 `phonetics` (PhoneticInfo[])
- ✅ 自动检测音标类型（IPA vs 拼音）
- ✅ 将 `definitions` (string[]) 转换为 `Definition[]`（包含 partOfSpeech 和 text）
- ✅ UI 现在可以正确渲染 `definition.text`

---

## 📊 数据格式对比

### AI 原始响应
```json
{
  "translation": "房间",
  "phonetic": "fáng jiān",  // ❌ 错误的拼音
  "definitions": [
    "建筑物内由墙壁、地板和天花板围合的空间",
    "特定用途的封闭空间（如会议厅、卧室）"
  ]
}
```

### 修复后期望响应
```json
{
  "translation": "房间",
  "phonetic": "/ˈtʃeɪmbə(r)/",  // ✅ 正确的 IPA
  "definitions": [
    "建筑物内由墙壁、地板和天花板围合的空间",
    "特定用途的封闭空间（如会议厅、卧室）"
  ]
}
```

### 转换为 TranslationResult
```javascript
{
  originalText: "chamber",
  translatedText: "房间",
  sourceLang: "en",
  targetLang: "zh-CN",
  
  // ✅ 音标格式转换
  phonetics: [
    {
      text: "/ˈtʃeɪmbə(r)/",
      type: "ipa"
    }
  ],
  
  // ✅ 释义格式转换
  definitions: [
    {
      partOfSpeech: "",
      text: "建筑物内由墙壁、地板和天花板围合的空间"
    },
    {
      partOfSpeech: "",
      text: "特定用途的封闭空间（如会议厅、卧室）"
    }
  ],
  
  provider: "openai",
  timestamp: 1760445944000
}
```

---

## 🧪 测试

### 测试文件
打开 `test-openai-format.html` 查看详细的数据格式测试。

### 测试用例

#### 用例 1: English → Chinese
- **输入**: "chamber"
- **期望音标**: `/ˈtʃeɪmbə(r)/` (英文 IPA)
- **期望释义**: 中文释义数组

#### 用例 2: Chinese → English
- **输入**: "房间"
- **期望音标**: `fáng jiān` (中文拼音)
- **期望释义**: 英文释义数组

#### 用例 3: 无音标语言
- **输入**: 符号或数字
- **期望音标**: 空字符串

---

## 🎯 验证步骤

1. **重新加载扩展**
   ```
   chrome://extensions/ → 重新加载
   ```

2. **配置 OpenAI Provider**
   - 选择 OpenAI
   - 填写 API Key
   - 确保 Prompt Format 为 "jsonFormat"

3. **测试翻译**
   - 选择 "chamber" 进行翻译
   - 查看翻译卡片

4. **期望结果**
   ```
   chamber
   /ˈtʃeɪmbə(r)/
   房间
   
   释义:
   · 建筑物内由墙壁、地板和天花板围合的空间
   · 特定用途的封闭空间（如会议厅、卧室）
   ```

5. **验证控制台**
   ```javascript
   // 查看解析后的数据
   console.log(result.phonetics);
   // [{text: "/ˈtʃeɪmbə(r)/", type: "ipa"}]
   
   console.log(result.definitions);
   // [{partOfSpeech: "", text: "..."}, {partOfSpeech: "", text: "..."}]
   ```

---

## 📝 提示词优化建议

### 当前版本
```
2. Include phonetic transcription of the SOURCE text (original text, not translation):
   - For English: use IPA format (e.g., /ˈtʃeɪmbə(r)/)
   - For Chinese: use Pinyin (e.g., fáng jiān)
   - If source text has no phonetic system, use empty string
```

### 未来可优化
如果 AI 仍然返回错误的音标，可以进一步强化：

```
2. IMPORTANT: Provide phonetic transcription for "{text}" (the SOURCE/ORIGINAL text), NOT for the translation:
   - Source language is {sourceLang}
   - If {sourceLang} is English → use IPA: /ˈtʃeɪmbə(r)/
   - If {sourceLang} is Chinese → use Pinyin: fáng jiān
   - If source has no phonetic → empty string ""
   - DO NOT provide phonetic for "{translation}" (the translated text)
```

---

## 🔄 回归测试

确保修复不影响其他功能：

- [ ] Google Translate 仍然正常工作
- [ ] DeepL 仍然正常工作
- [ ] Youdao 仍然正常工作
- [ ] 音标补充功能（FreeDictionary）仍然正常
- [ ] 标注功能正常显示音标和翻译
- [ ] 缓存功能正常

---

## 📚 相关文件

- `ai-providers/prompt-templates.js` - 提示词模板
- `ai-providers/openai-provider.js` - OpenAI Provider 实现
- `translation-service.js` - TranslationResult 数据结构定义
- `test-openai-format.html` - 数据格式测试页面

---

## ✅ 修复总结

| 问题 | 状态 | 说明 |
|------|------|------|
| 音标返回中文拼音 | ✅ 已修复 | 提示词明确要求源文本音标 |
| 释义显示空白 | ✅ 已修复 | 转换为 Definition 对象数组 |
| 音标类型检测 | ✅ 已添加 | 自动识别 IPA/拼音 |
| 数据格式转换 | ✅ 已完成 | string → PhoneticInfo[], string[] → Definition[] |

---

**最后更新**: 2024-XX-XX  
**测试状态**: 待验证
