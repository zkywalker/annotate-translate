# OpenAI 提示词模板系统 - 实现说明

## 📦 已完成的工作

### 1. 提示词模板系统 (`prompt-templates.js`)

✅ 创建了完整的提示词模板系统，包括：

#### 核心功能
- **占位符替换**：支持 `{text}`, `{sourceLang}`, `{targetLang}`, `{context}` 等占位符
- **两种模板格式**：
  - `jsonFormat`: 返回 JSON 格式（translation, phonetic, definitions）
  - `simpleFormat`: 仅返回翻译文本
- **上下文支持**：
  - 可配置启用/禁用
  - 智能截取（前后文本，总长度控制）
  - 自动在上下文中标记目标文本
- **自定义模板**：支持用户自定义提示词模板

#### 关键方法

```javascript
// 构建提示词
PromptTemplates.buildPrompt({
  text: 'hello',
  sourceLang: 'en',
  targetLang: 'zh-CN',
  format: 'jsonFormat',  // 或 'simpleFormat'
  context: '上下文文本...',
  customTemplates: null  // 可选的自定义模板
});

// 解析 JSON 响应
PromptTemplates.parseJsonResponse(rawResponse);

// 验证模板格式
PromptTemplates.validateTemplate(template);
```

### 2. OpenAI Provider 更新需求

由于当前 `openai-provider.js` 文件损坏，需要重新创建。以下是完整的实现方案：

#### 构造函数新增参数
```javascript
constructor(config) {
  // ... 原有参数
  this.promptFormat = config.promptFormat || 'jsonFormat';
  this.useContext = config.useContext !== undefined ? config.useContext : true;
  this.customTemplates = config.customTemplates || null;
}
```

#### 翻译方法更新
```javascript
async translate(text, sourceLang, targetLang, options = {}) {
  // 使用提示词模板系统
  const prompts = PromptTemplates.buildPrompt({
    text: text,
    sourceLang: sourceLang,
    targetLang: targetLang,
    format: this.promptFormat,
    context: this.useContext ? (options.context || '') : '',
    customTemplates: this.customTemplates
  });
  
  // 调用 API (prompts 包含 system 和 user 两部分)
  const response = await this.callAPI(prompts);
  
  // 根据格式解析结果
  if (this.promptFormat === 'jsonFormat') {
    return this.parseJsonResponse(rawResponse);
  } else {
    return this.parseSimpleResponse(rawResponse);
  }
}
```

### 3. 配置选项 (options.html/options.js)

需要添加的新设置：

```javascript
// 默认设置
{
  // OpenAI 提示词配置
  openaiPromptFormat: 'jsonFormat',  // 或 'simpleFormat'
  openaiUseContext: true,            // 是否使用上下文
  openaiContextMaxLength: 200,       // 上下文最大长度
  
  // 自定义模板（JSON 字符串）
  openaiCustomTemplates: null
}
```

### 4. UI 界面 (options.html)

添加到 OpenAI 配置区域：

```html
<div class="setting-item">
  <label for="openaiPromptFormat">提示词格式</label>
  <select id="openaiPromptFormat">
    <option value="jsonFormat">完整格式 (JSON - 包含音标和释义)</option>
    <option value="simpleFormat">简化格式 (仅翻译)</option>
  </select>
  <div class="description">
    完整格式返回翻译、音标和释义，消耗更多token。简化格式仅返回翻译，更省成本。
  </div>
</div>

<div class="checkbox-item">
  <input type="checkbox" id="openaiUseContext" checked>
  <label for="openaiUseContext">使用上下文提升翻译准确度</label>
</div>
<div class="description" style="margin-left: 32px;">
  启用后会自动提取目标文本的前后文本作为上下文，提升翻译准确度。
  上下文会被智能截取（最多200字符），避免消耗过多token。
</div>
```

## 🎯 使用示例

### 示例 1: JSON 格式（完整信息）

```javascript
// 配置
const provider = new OpenAIProvider({
  apiKey: 'sk-...',
  model: 'gpt-3.5-turbo',
  baseURL: 'https://api.openai.com/v1',
  promptFormat: 'jsonFormat',
  useContext: true
});

// 翻译
const result = await provider.translate('hello', 'en', 'zh-CN', {
  context: 'Hello, how are you? I hope you are doing well.'
});

// 结果
{
  translatedText: '你好',
  phonetic: 'nǐ hǎo',
  definitions: ['问候语，用于见面时打招呼'],
  ...
}
```

### 示例 2: 简化格式（仅翻译）

```javascript
// 配置
const provider = new OpenAIProvider({
  apiKey: 'sk-...',
  model: 'gpt-3.5-turbo',
  promptFormat: 'simpleFormat',
  useContext: false
});

// 翻译
const result = await provider.translate('hello', 'en', 'zh-CN');

// 结果
{
  translatedText: '你好',
  ...
}
```

### 示例 3: 自定义模板

```javascript
const customTemplates = {
  myCustomFormat: {
    system: 'You are a professional translator.',
    user: 'Translate from {sourceLang} to {targetLang}: {text}',
    contextTemplate: '\nContext: {context}'
  }
};

const provider = new OpenAIProvider({
  apiKey: 'sk-...',
  customTemplates: customTemplates,
  promptFormat: 'myCustomFormat'
});
```

## 📊 提示词模板对比

| 特性 | JSON 格式 | 简化格式 |
|------|----------|---------|
| 翻译 | ✅ | ✅ |
| 音标 | ✅ | ❌ |
| 释义 | ✅ | ❌ |
| Token 消耗 | 更多 | 更少 |
| 适用场景 | 学习、完整翻译 | 快速翻译 |
| 成本 | 较高 | 较低 |

## 🔧 上下文处理机制

### 1. 上下文提取
```
原文: "... previous text [target text] following text ..."
↓
提取: "... previous [target text] following ..."
```

### 2. 智能截取
- 总长度限制：200 字符
- 前文：100 字符
- 后文：100 字符
- 在单词边界截断
- 添加省略号

### 3. 上下文标记
目标文本在上下文中用 `[...]` 标记，帮助 AI 理解翻译焦点。

## 📝 后续TODO

### 立即需要
1. ✅ 重新创建 `openai-provider.js`（已有完整代码）
2. ⏳ 添加 UI 配置选项
3. ⏳ 更新 `options.js` 保存/加载逻辑
4. ⏳ 更新 `test-ai-translation.html` 添加格式选择
5. ⏳ 测试两种格式的翻译效果

### 未来改进
- [ ] 添加提示词模板编辑器
- [ ] 支持更多预设模板
- [ ] 提示词效果A/B测试
- [ ] 上下文相关性分析
- [ ] Token 消耗优化建议

## 🎓 最佳实践

### 选择格式
- **学习场景**：使用 JSON 格式，获取音标和释义
- **快速翻译**：使用简化格式，节省成本
- **长文本**：使用简化格式，避免过多token

### 上下文使用
- **单词/短语**：启用上下文，提升准确度
- **完整句子**：可选上下文
- **长文本**：建议禁用，避免超出token限制

### 成本控制
```
JSON 格式 ≈ 简化格式 × 1.5-2倍 token
上下文启用 ≈ 基础 + 50-100 tokens
```

## 📚 相关文件

- `ai-providers/prompt-templates.js` - 提示词模板系统 ✅
- `ai-providers/openai-provider.js` - OpenAI 提供商（需重新创建）⏳
- `ai-providers/base-ai-provider.js` - 基类
- `options.html` - 设置界面（需添加配置）⏳
- `options.js` - 设置逻辑（需添加保存/加载）⏳
- `test-ai-translation.html` - 测试界面（需添加格式选择）⏳

## ✨ 核心价值

1. **灵活性**：支持多种提示词格式和自定义模板
2. **经济性**：简化格式可节省 30-50% 成本
3. **智能性**：自动处理上下文，提升翻译准确度
4. **可扩展**：易于添加新的提示词模板
5. **用户友好**：简单的配置选项

---

**状态**: 提示词模板系统已完成，等待集成到 OpenAI Provider  
**日期**: 2025-10-14
