# Debug翻译提供商和设置页面

## 🎯 新功能概述

我们添加了两个重要的开发工具功能：

1. **Debug翻译提供商** - 用于开发调试，返回固定测试数据
2. **设置页面（Options Page）** - 统一管理所有配置

## 🐛 Debug翻译提供商

### 特性

- ✅ **无需API调用** - 返回预定义的测试数据
- ✅ **模拟真实场景** - 包含完整的翻译、读音、词义、例句
- ✅ **可配置延迟** - 模拟网络延迟（默认500ms）
- ✅ **语言自动检测** - 支持中文、日文、韩文、英文
- ✅ **预定义词汇** - hello, apple, world等常用词
- ✅ **自动生成** - 未定义的词自动生成调试数据

### 预定义测试数据

#### hello → 中文
```javascript
{
  originalText: "hello",
  translatedText: "你好",
  phonetics: [
    { text: "/həˈloʊ/", type: "us" },
    { text: "/həˈləʊ/", type: "uk" }
  ],
  definitions: [
    { partOfSpeech: "int.", text: "(用于问候)喂，你好", synonyms: ["hi", "hey"] },
    { partOfSpeech: "n.", text: "招呼，问候" },
    { partOfSpeech: "v.", text: "打招呼", synonyms: ["greet"] }
  ],
  examples: [
    { source: "Hello! How are you?", translation: "你好！你好吗？" },
    { source: "Say hello to your parents.", translation: "向你的父母问好。" },
    { source: "He said hello and left.", translation: "他打了个招呼就离开了。" }
  ]
}
```

#### apple → 中文
```javascript
{
  translatedText: "苹果",
  phonetics: [
    { text: "/ˈæpl/", type: "us" },
    { text: "/ˈæpl/", type: "uk" }
  ],
  definitions: [
    { partOfSpeech: "n.", text: "苹果（水果）" },
    { partOfSpeech: "n.", text: "苹果树" },
    { partOfSpeech: "n.", text: "苹果公司" }
  ],
  examples: [
    { source: "An apple a day keeps the doctor away.", translation: "一天一苹果，医生远离我。" },
    { source: "I like red apples.", translation: "我喜欢红苹果。" }
  ]
}
```

#### world → 中文
```javascript
{
  translatedText: "世界",
  phonetics: [{ text: "/wɜːrld/", type: "us" }],
  definitions: [
    { partOfSpeech: "n.", text: "世界；地球", synonyms: ["earth", "globe"] },
    { partOfSpeech: "n.", text: "领域；界", synonyms: ["realm", "sphere"] }
  ],
  examples: [
    { source: "Hello world!", translation: "你好，世界！" },
    { source: "The world is changing.", translation: "世界正在改变。" }
  ]
}
```

### 使用方法

#### 1. 在代码中使用

```javascript
// 使用Debug提供商
translationService.setActiveProvider('debug');

// 翻译测试
const result = await translationService.translate('hello', 'zh-CN');
console.log(result); // 返回预定义的测试数据
```

#### 2. 在设置页面中选择

1. 打开扩展设置页面
2. 在"Translation Provider"部分选择"🐛 Debug"
3. 保存设置

#### 3. 自定义延迟

```javascript
// 创建自定义延迟的Debug提供商
const debugProvider = new DebugTranslateProvider({
  delay: 1000  // 1秒延迟
});

translationService.registerProvider('debug-slow', debugProvider);
translationService.setActiveProvider('debug-slow');
```

### 语言检测

Debug提供商可以自动检测以下语言：

| 语言 | 检测规则 |
|------|---------|
| 中文 | 包含汉字 `[\u4e00-\u9fa5]` |
| 日文 | 包含平假名/片假名 `[\u3040-\u30ff]` |
| 韩文 | 包含韩文字符 `[\uac00-\ud7af]` |
| 英文 | 默认（其他情况） |

### 未定义词汇的处理

对于未预定义的词汇，会自动生成调试数据：

```javascript
// 翻译未定义的词 "computer"
const result = await translationService.translate('computer', 'zh-CN');

// 返回：
{
  originalText: "computer",
  translatedText: "[DEBUG] Translation of \"computer\" to zh-CN",
  phonetics: [{ text: "/debug/", type: "debug" }],
  definitions: [
    { partOfSpeech: "n.", text: "[DEBUG] 这是 \"computer\" 的调试翻译" }
  ],
  examples: [
    { source: "Example with computer", translation: "包含 computer 的例句" }
  ]
}
```

## ⚙️ 设置页面（Options Page）

### 访问方式

1. **右键扩展图标** → 选项
2. **chrome://extensions** → 找到扩展 → 详细信息 → 扩展程序选项
3. **代码中打开**：
   ```javascript
   chrome.runtime.openOptionsPage();
   ```

### 功能分组

#### 1. Feature Toggles（功能开关）
- ✅ Enable Translation Feature - 启用翻译功能
- ✅ Enable Annotation Feature - 启用标注功能

#### 2. Translation Provider（翻译提供商）
- 🐛 **Debug** - 调试提供商（默认，推荐开发使用）
- 🌐 Google Translate - Google翻译
- 📖 Youdao - 有道翻译
- 💾 Local Dictionary - 本地词典

#### 3. Language Settings（语言设置）
- Default Target Language - 默认目标语言
  - Chinese (Simplified)
  - Chinese (Traditional)
  - English
  - Japanese
  - Korean
  - Spanish
  - French
  - German
  - Russian

#### 4. UI Settings（UI设置）
- ✅ Enable Audio Pronunciation - 启用音频发音
- ✅ Show Phonetic Symbols - 显示音标
- ✅ Show Word Definitions - 显示词义
- ✅ Show Example Sentences - 显示例句
- Maximum Number of Examples - 最多显示例句数（1-10）
- Auto-close Delay - 自动关闭延迟（0-60秒，0=永不）

#### 5. Performance Settings（性能设置）
- ✅ Enable Translation Cache - 启用翻译缓存
- Cache Size - 缓存大小（10-500条）

#### 6. Debug Settings（调试设置）
- Enable Debug Mode - 启用调试模式
- Show Console Logs - 显示控制台日志

### 按钮功能

| 按钮 | 功能 | 说明 |
|------|------|------|
| 💾 Save Settings | 保存设置 | 保存所有配置到chrome.storage |
| 🔄 Reset to Defaults | 重置为默认 | 恢复所有默认设置 |
| 🗑️ Clear Cache | 清除缓存 | 清除所有翻译缓存 |

### 默认配置

```javascript
{
  // Feature toggles
  enableTranslate: true,
  enableAnnotate: true,
  
  // Translation settings
  translationProvider: 'debug',  // 默认使用Debug提供商
  targetLanguage: 'zh-CN',
  
  // UI settings
  enableAudio: true,
  showPhonetics: true,
  showDefinitions: true,
  showExamples: true,
  maxExamples: 3,
  autoCloseDelay: 10,
  
  // Performance settings
  enableCache: true,
  cacheSize: 100,
  
  // Debug settings
  enableDebugMode: false,
  showConsoleLog: false
}
```

## 🔧 开发工作流

### 推荐的开发流程

#### 阶段1：使用Debug提供商测试UI

```javascript
// 1. 设置为Debug模式
translationService.setActiveProvider('debug');

// 2. 测试UI渲染
const result = await translationService.translate('hello', 'zh-CN');
const ui = new TranslationUI();
document.body.appendChild(ui.render(result));

// 3. 测试音频播放
// 点击🔊按钮，验证播放逻辑

// 4. 测试不同的UI配置
const ui2 = new TranslationUI({
  enableAudio: false,
  showExamples: false
});
```

#### 阶段2：测试真实API

```javascript
// 切换到真实提供商
translationService.setActiveProvider('google');

// 测试实际的API调用
const result = await translationService.translate('hello', 'zh-CN');
console.log(result);
```

#### 阶段3：性能测试

```javascript
// 测试缓存
const start = Date.now();
await translationService.translate('hello', 'zh-CN'); // 首次调用
const firstTime = Date.now() - start;

const start2 = Date.now();
await translationService.translate('hello', 'zh-CN'); // 缓存命中
const cachedTime = Date.now() - start2;

console.log(`首次: ${firstTime}ms, 缓存: ${cachedTime}ms`);
```

## 📊 调试技巧

### 1. 启用详细日志

在设置页面中：
1. 勾选"Enable Debug Mode"
2. 勾选"Show Console Logs"
3. 保存设置

查看控制台输出：
```
[DebugProvider] Translating: "hello" from auto to zh-CN
[TranslationService] Using cached result
[TranslationUI] Rendering result...
```

### 2. 测试特定场景

```javascript
// 测试长文本
await translationService.translate(
  'This is a very long sentence that should trigger the simple UI mode.',
  'zh-CN'
);

// 测试特殊字符
await translationService.translate('Hello! @#$%', 'zh-CN');

// 测试不同语言
await translationService.translate('你好', 'en');
await translationService.translate('こんにちは', 'zh-CN');
```

### 3. 检查配置是否生效

```javascript
chrome.storage.sync.get(null, (settings) => {
  console.log('Current settings:', settings);
});
```

### 4. 监听配置变化

```javascript
chrome.storage.onChanged.addListener((changes, namespace) => {
  console.log('Settings changed:', changes);
  for (let key in changes) {
    const change = changes[key];
    console.log(`${key}: ${change.oldValue} → ${change.newValue}`);
  }
});
```

## 🎯 使用场景

### 场景1：开发新功能

使用Debug提供商，避免频繁的API调用：

```javascript
// 设置页面选择Debug提供商
// 然后在开发中专注于UI和交互逻辑
```

### 场景2：演示和截图

使用Debug提供商获得一致的演示数据：

```javascript
// 每次都返回相同的结果，适合制作演示视频
await translationService.translate('hello', 'zh-CN');
// 总是返回"你好"，带完整的词义和例句
```

### 场景3：单元测试

```javascript
// 在测试中使用Debug提供商
beforeEach(() => {
  translationService.setActiveProvider('debug');
});

test('should render translation result', async () => {
  const result = await translationService.translate('hello', 'zh-CN');
  expect(result.translatedText).toBe('你好');
  expect(result.phonetics.length).toBe(2);
});
```

### 场景4：离线开发

```javascript
// 无网络时使用Debug提供商
if (!navigator.onLine) {
  translationService.setActiveProvider('debug');
}
```

## 📝 文件清单

| 文件 | 说明 |
|------|------|
| `options.html` | 设置页面HTML |
| `options.js` | 设置页面JavaScript |
| `translation-service.js` | 翻译服务（已添加DebugTranslateProvider） |
| `manifest.json` | 清单文件（已添加options_page） |
| `background.js` | 后台脚本（已添加clearCache处理） |

## 🔄 后续集成步骤

1. **测试设置页面**
   ```bash
   # 加载扩展后，右键扩展图标 → 选项
   ```

2. **测试Debug提供商**
   ```javascript
   // 在测试页面或控制台测试
   translationService.setActiveProvider('debug');
   await translationService.translate('hello', 'zh-CN');
   ```

3. **集成到content.js**
   - 从chrome.storage加载配置
   - 应用翻译提供商设置
   - 应用UI配置

4. **测试配置同步**
   - 修改设置页面的配置
   - 验证content.js是否接收到更新
   - 验证新配置是否生效

## 💡 最佳实践

### 开发时

- ✅ 使用Debug提供商，避免API限制
- ✅ 启用详细日志，便于排查问题
- ✅ 使用较短的auto-close延迟，加快测试速度

### 生产时

- ✅ 切换到真实的翻译提供商
- ✅ 关闭详细日志，减少性能开销
- ✅ 启用缓存，提升用户体验
- ✅ 合理设置auto-close延迟（建议10-15秒）

## 🎉 总结

通过添加Debug提供商和设置页面：

1. **开发效率提升** - 无需依赖外部API即可测试
2. **调试更容易** - 固定的测试数据，易于复现问题
3. **用户体验改善** - 统一的配置管理界面
4. **灵活性增强** - 可以轻松切换不同的配置组合

现在你可以：
- ✅ 在设置页面配置所有选项
- ✅ 使用Debug提供商进行开发和测试
- ✅ 逐步切换到真实API
- ✅ 快速定位和解决问题

开始使用吧！🚀
