# ⚡ 快速命令参考

一页纸快速查询所有常用命令和代码片段。

---

## 🚀 立即开始

### 打开测试页面
```bash
# 方式1：直接打开
open translation-test.html

# 方式2：启动本地服务器
python -m http.server 8000
open http://localhost:8000/translation-test.html

# 方式3：在浏览器中
# 双击 translation-test.html 文件
```

### 安装Chrome扩展
```bash
# 1. 打开Chrome
chrome://extensions/

# 2. 开启"开发者模式"（右上角）
# 3. 点击"加载已解压的扩展程序"
# 4. 选择项目文件夹
```

---

## 📝 控制台命令

### 基础翻译
```javascript
// 翻译单词
const result = await translationService.translate('hello', 'zh-CN');
console.log(result);

// 快捷方式
const t = (text) => translationService.translate(text, 'zh-CN');
await t('hello');
await t('apple');
await t('world');
```

### 切换提供商
```javascript
// 切换到Debug
translationService.setActiveProvider('debug');

// 切换到Google
translationService.setActiveProvider('google');

// 切换到Youdao
translationService.setActiveProvider('youdao');

// 切换到Local
translationService.setActiveProvider('local');

// 查看当前提供商
console.log(translationService.activeProvider);

// 查看所有提供商
console.log([...translationService.providers.keys()]);
```

### 渲染UI
```javascript
// 完整版UI
const result = await translationService.translate('hello', 'zh-CN');
const ui = new TranslationUI();
const element = ui.render(result);
document.body.appendChild(element);

// 简化版UI
const simpleElement = ui.renderSimple(result);
document.body.appendChild(simpleElement);

// 快捷方式
const r = async (text) => {
  const result = await translationService.translate(text, 'zh-CN');
  const ui = new TranslationUI();
  document.body.appendChild(ui.render(result));
};
await r('hello');
```

### 缓存管理
```javascript
// 查看缓存大小
console.log('缓存大小:', translationService.cache.size);

// 查看缓存键
console.log([...translationService.cache.keys()]);

// 查看缓存内容
translationService.cache.forEach((value, key) => {
  console.log(key, '→', value.translatedText);
});

// 清除缓存
translationService.clearCache();
console.log('缓存已清除');

// 启用缓存
translationService.enableCache(100); // 最多100条

// 禁用缓存
translationService.disableCache();
```

### 配置管理
```javascript
// 查看所有配置
chrome.storage.sync.get(null, (data) => {
  console.log('当前配置:', data);
});

// 修改配置
chrome.storage.sync.set({
  translationProvider: 'debug',
  targetLanguage: 'zh-CN',
  enableAudio: true
}, () => {
  console.log('配置已保存');
});

// 清除所有配置
chrome.storage.sync.clear(() => {
  console.log('配置已清除');
});
```

### 音频播放
```javascript
// 播放音频
const result = await translationService.translate('hello', 'zh-CN');
const ui = new TranslationUI({ enableAudio: true });

// 方式1：通过UI按钮
const element = ui.render(result);
const audioButton = element.querySelector('.audio-button');
audioButton.click();

// 方式2：直接调用
await ui.playAudio(result);

// 方式3：TTS播放
await ui.playTTS('hello', 'en');
```

---

## 🧪 测试命令

### 快速测试
```javascript
// 测试预定义词汇
await translationService.translate('hello', 'zh-CN');  // 你好
await translationService.translate('apple', 'zh-CN');  // 苹果
await translationService.translate('world', 'zh-CN');  // 世界

// 测试未定义词汇（自动生成）
await translationService.translate('computer', 'zh-CN');
await translationService.translate('book', 'zh-CN');
```

### 性能测试
```javascript
// 测试响应时间
console.time('translation');
await translationService.translate('hello', 'zh-CN');
console.timeEnd('translation'); // ~500ms (Debug模式)

// 测试缓存性能
console.time('cached');
await translationService.translate('hello', 'zh-CN'); // 第二次
console.timeEnd('cached'); // <10ms

// 测试并发
Promise.all([
  translationService.translate('hello', 'zh-CN'),
  translationService.translate('apple', 'zh-CN'),
  translationService.translate('world', 'zh-CN')
]).then(results => {
  console.log('并发测试完成:', results.length, '个结果');
});
```

### 测试所有提供商
```javascript
async function testAllProviders() {
  const providers = ['debug', 'google', 'youdao', 'local'];
  const text = 'hello';
  
  for (const provider of providers) {
    console.log(`\n测试提供商: ${provider}`);
    translationService.setActiveProvider(provider);
    try {
      const result = await translationService.translate(text, 'zh-CN');
      console.log('✅ 成功:', result.translatedText);
    } catch (error) {
      console.log('❌ 失败:', error.message);
    }
  }
}

testAllProviders();
```

### 压力测试
```javascript
// 连续请求测试
async function stressTest(count = 10) {
  console.log(`开始压力测试: ${count}次请求`);
  const start = Date.now();
  
  for (let i = 0; i < count; i++) {
    await translationService.translate('test', 'zh-CN');
    console.log(`完成 ${i + 1}/${count}`);
  }
  
  const duration = Date.now() - start;
  console.log(`总耗时: ${duration}ms`);
  console.log(`平均耗时: ${duration / count}ms`);
  console.log(`缓存大小: ${translationService.cache.size}`);
}

stressTest(10);
```

---

## 🐞 调试命令

### 启用调试模式
```javascript
// 在设置页面（options.html）中：
// 1. 勾选 "Enable Debug Mode"
// 2. 勾选 "Show Console Logs"
// 3. 点击 "Save Settings"

// 或通过代码：
chrome.storage.sync.set({
  debugMode: true,
  showConsoleLogs: true
});
```

### 查看提供商信息
```javascript
// 查看所有提供商
translationService.providers.forEach((provider, name) => {
  console.log(`${name}:`, provider.name);
});

// 查看当前提供商
const current = translationService.providers.get(
  translationService.activeProvider
);
console.log('当前提供商:', current.name);

// 查看提供商详情
console.log('支持的语言:', current.supportedLanguages);
console.log('需要API Key:', current.requiresApiKey);
```

### 查看翻译结果详情
```javascript
const result = await translationService.translate('hello', 'zh-CN');

console.log('=== 翻译结果详情 ===');
console.log('原文:', result.originalText);
console.log('译文:', result.translatedText);
console.log('源语言:', result.sourceLanguage);
console.log('目标语言:', result.targetLanguage);
console.log('提供商:', result.provider);
console.log('时间戳:', new Date(result.timestamp));

console.log('\n=== 读音 ===');
result.phonetics.forEach(p => {
  console.log(`${p.accent}: ${p.text}`);
});

console.log('\n=== 词义 ===');
result.definitions.forEach((d, i) => {
  console.log(`${i + 1}. [${d.partOfSpeech}] ${d.text}`);
  if (d.synonyms?.length > 0) {
    console.log('   同义词:', d.synonyms.join(', '));
  }
});

console.log('\n=== 例句 ===');
result.examples.forEach((e, i) => {
  console.log(`${i + 1}. ${e.source}`);
  console.log(`   ${e.target}`);
});
```

### 错误调试
```javascript
// 捕获详细错误
try {
  const result = await translationService.translate('', 'zh-CN');
} catch (error) {
  console.error('错误类型:', error.name);
  console.error('错误信息:', error.message);
  console.error('错误堆栈:', error.stack);
}

// 启用详细日志
const originalLog = console.log;
console.log = function(...args) {
  const timestamp = new Date().toISOString();
  originalLog.apply(console, [`[${timestamp}]`, ...args]);
};
```

---

## 🛠️ 开发命令

### 创建自定义提供商
```javascript
class MyCustomProvider extends TranslationProvider {
  constructor() {
    super();
    this.name = 'My Custom Provider';
    this.supportedLanguages = ['en', 'zh-CN'];
  }
  
  async translate(text, targetLang, sourceLang = 'auto') {
    // 实现翻译逻辑
    return {
      originalText: text,
      translatedText: 'Your translation here',
      sourceLanguage: sourceLang,
      targetLanguage: targetLang,
      provider: this.name,
      phonetics: [],
      definitions: [],
      examples: [],
      audioUrl: null,
      audioData: null,
      timestamp: Date.now()
    };
  }
}

// 注册提供商
translationService.registerProvider('mycustom', new MyCustomProvider());

// 使用
translationService.setActiveProvider('mycustom');
```

### 添加Debug测试数据
```javascript
// 在translation-service.js中找到DebugTranslateProvider类
// 在constructor中的this.testData对象添加：

'computer': {
  'zh-CN': {
    translatedText: '计算机',
    phonetics: [
      { text: '/kəmˈpjuːtər/', accent: 'US' }
    ],
    definitions: [
      {
        partOfSpeech: 'n.',
        text: '计算机，电脑',
        synonyms: ['PC', 'machine']
      }
    ],
    examples: [
      {
        source: 'I use a computer every day.',
        target: '我每天使用计算机。'
      }
    ]
  }
}
```

### 修改UI配置
```javascript
// 创建自定义UI
const customUI = new TranslationUI({
  showPhonetics: true,      // 显示读音
  showDefinitions: true,    // 显示词义
  showExamples: true,       // 显示例句
  maxExamples: 5,           // 最多5个例句
  enableAudio: true,        // 启用音频
  theme: 'dark'             // 深色主题（如果支持）
});

// 渲染
const result = await translationService.translate('hello', 'zh-CN');
const element = customUI.render(result);
document.body.appendChild(element);
```

---

## 📋 常用代码片段

### 完整翻译流程
```javascript
async function translateAndRender(text, targetLang = 'zh-CN') {
  try {
    // 1. 翻译
    console.log(`正在翻译: ${text}`);
    const result = await translationService.translate(text, targetLang);
    
    // 2. 渲染
    const ui = new TranslationUI({
      showPhonetics: true,
      showDefinitions: true,
      showExamples: true,
      maxExamples: 3,
      enableAudio: true
    });
    
    const element = ui.render(result);
    
    // 3. 显示
    document.body.appendChild(element);
    
    console.log(`翻译完成: ${result.translatedText}`);
    return result;
  } catch (error) {
    console.error('翻译失败:', error);
    throw error;
  }
}

// 使用
await translateAndRender('hello');
```

### 批量翻译
```javascript
async function batchTranslate(words, targetLang = 'zh-CN') {
  const results = [];
  
  for (const word of words) {
    console.log(`翻译: ${word}`);
    try {
      const result = await translationService.translate(word, targetLang);
      results.push({
        word,
        translation: result.translatedText,
        success: true
      });
    } catch (error) {
      results.push({
        word,
        error: error.message,
        success: false
      });
    }
  }
  
  return results;
}

// 使用
const words = ['hello', 'apple', 'world', 'computer'];
const results = await batchTranslate(words);
console.table(results);
```

### 监听配置变化
```javascript
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync') {
    console.log('配置变化:');
    
    for (let key in changes) {
      const change = changes[key];
      console.log(`  ${key}:`);
      console.log(`    旧值: ${change.oldValue}`);
      console.log(`    新值: ${change.newValue}`);
      
      // 根据变化更新服务
      if (key === 'translationProvider') {
        translationService.setActiveProvider(change.newValue);
      }
    }
  }
});
```

---

## 🎓 学习命令

### 探索API
```javascript
// 查看TranslationService的所有方法
console.log('TranslationService方法:');
Object.getOwnPropertyNames(TranslationService.prototype)
  .filter(name => typeof translationService[name] === 'function')
  .forEach(name => console.log(`  - ${name}()`));

// 查看TranslationUI的所有方法
console.log('\nTranslationUI方法:');
const ui = new TranslationUI();
Object.getOwnPropertyNames(Object.getPrototypeOf(ui))
  .filter(name => typeof ui[name] === 'function')
  .forEach(name => console.log(`  - ${name}()`));
```

### 查看数据结构
```javascript
// 标准翻译结果结构
const exampleResult = {
  originalText: 'hello',
  translatedText: '你好',
  sourceLanguage: 'en',
  targetLanguage: 'zh-CN',
  provider: 'Debug Provider',
  phonetics: [
    { text: '/həˈloʊ/', accent: 'US' },
    { text: '/həˈləʊ/', accent: 'UK' }
  ],
  definitions: [
    {
      partOfSpeech: 'int.',
      text: '你好（用于问候）',
      synonyms: ['hi', 'hey']
    }
  ],
  examples: [
    {
      source: 'Hello, how are you?',
      target: '你好，你好吗？'
    }
  ],
  audioUrl: null,
  audioData: null,
  timestamp: 1234567890
};

console.log('标准结构:', JSON.stringify(exampleResult, null, 2));
```

---

## 📚 文档命令

### 生成文档目录
```bash
# 列出所有文档
ls -1 *.md

# 统计文档字数
wc -w *.md

# 查找特定内容
grep -r "Debug" *.md
```

### 快速查看文档
```bash
# 查看README
cat README.md | head -50

# 查看快速开始
cat DEBUG_QUICKSTART.md | head -100

# 查看测试清单
cat TEST_CHECKLIST.md | grep "Test"
```

---

## 💡 提示与技巧

### 性能优化
```javascript
// 使用缓存
translationService.enableCache(200); // 缓存200条

// 批量操作使用Promise.all
await Promise.all([
  translationService.translate('hello', 'zh-CN'),
  translationService.translate('apple', 'zh-CN')
]);

// 预加载常用词汇
const commonWords = ['hello', 'apple', 'world'];
commonWords.forEach(word => 
  translationService.translate(word, 'zh-CN')
);
```

### 错误处理
```javascript
// 优雅的错误处理
async function safeTranslate(text, targetLang) {
  try {
    return await translationService.translate(text, targetLang);
  } catch (error) {
    console.error('翻译失败，使用降级方案:', error);
    return {
      originalText: text,
      translatedText: '[翻译失败]',
      error: error.message
    };
  }
}
```

### 调试技巧
```javascript
// 启用详细日志
localStorage.setItem('debug', 'true');

// 查看所有存储
chrome.storage.local.get(null, console.log);
chrome.storage.sync.get(null, console.log);

// 清除所有数据
chrome.storage.local.clear();
chrome.storage.sync.clear();
```

---

## 🚀 快捷键

在translation-test.html中：
- `Ctrl/Cmd + Enter`: 翻译
- `Ctrl/Cmd + L`: 清除日志
- `Ctrl/Cmd + R`: 清除结果
- `Esc`: 关闭翻译卡片

---

## 📖 相关文档

- [Debug快速开始](DEBUG_QUICKSTART.md) - 3分钟教程
- [快速参考](QUICK_REFERENCE.md) - 完整API
- [测试清单](TEST_CHECKLIST.md) - 40+测试
- [文档索引](DOCS_INDEX.md) - 所有文档

---

**保存此页面以便快速查询！** ⭐
