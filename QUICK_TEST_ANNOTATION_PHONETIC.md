# 快速测试：标注音标显示

## 🎯 目标

验证标注是否正确显示音标（在 FreeDictionary 重构后）

## 🧪 测试步骤

### 测试 1: Google 翻译 + 英文单词

1. **打开浏览器开发者工具**（F12）
2. **打开任意网页**
3. **选中英文单词** "hello"
4. **点击右键 → "标注"**（或使用悬浮按钮）
5. **查看标注显示**

**预期结果**:
- ✅ 标注显示：`/həˈloʊ/ 你好` 或 `/həˈləʊ/ 你好`
- ✅ 包含音标和翻译

**控制台日志**:
```
[GoogleTranslate] Translating: "hello" from auto to zh-CN
[GoogleTranslate] ✗ No phonetic data found
[TranslationService] No phonetics found, trying FreeDictionary supplement...
[FreeDictionary] Fetching phonetics for: "hello"
[TranslationService] ✓ Supplemented 2 phonetics from FreeDictionary
[TranslationService] ✓ Generated annotation text: /həˈloʊ/ 你好
[Annotate-Translate] Auto-annotated with: /həˈloʊ/ 你好
```

### 测试 2: 多个单词测试

测试以下单词，验证都能显示音标：

| 单词 | 预期标注（示例） |
|------|-----------------|
| world | `/wɜːld/ 世界` |
| example | `/ɪɡˈzæmpəl/ 例子` |
| beautiful | `/ˈbjuːtɪfl/ 美丽的` |
| computer | `/kəmˈpjuːtər/ 计算机` |

### 测试 3: 有道翻译

1. **打开设置页面**
2. **切换到有道翻译**（需要配置 API）
3. **选中英文单词** "world"
4. **点击标注**
5. **验证显示**

**预期结果**:
- ✅ 同样显示音标和翻译

### 测试 4: 短语（无音标）

1. **选中短语** "hello world"
2. **点击标注**

**预期结果**:
- ✅ 标注显示：`你好世界`（只有翻译，因为 FreeDictionary 不支持短语）

## 📋 检查清单

- [ ] Google 翻译能显示音标
- [ ] 有道翻译能显示音标（如果配置了 API）
- [ ] 音标格式正确（有斜杠包裹）
- [ ] 翻译内容正确
- [ ] 控制台日志完整
- [ ] 短语正常工作（无音标）

## 🔍 调试技巧

### 如果标注不显示音标

1. **检查控制台日志**
   - 应该看到 `[TranslationService] ✓ Generated annotation text: ...`
   - 如果没有，检查是否成功调用了 FreeDictionary

2. **手动测试翻译服务**
   ```javascript
   // 在控制台运行
   async function test() {
     const result = await translationService.translate('hello', 'zh-CN');
     console.log('Result:', result);
     console.log('Annotation Text:', result.annotationText);
     console.log('Phonetics:', result.phonetics);
   }
   test();
   ```

3. **检查 FreeDictionary**
   ```javascript
   // 在控制台运行
   async function testFreeDictionary() {
     const provider = translationService.providers.get('freedict');
     const data = await provider.fetchPhonetics('hello');
     console.log('FreeDictionary data:', data);
   }
   testFreeDictionary();
   ```

### 如果音标格式不对

检查 `generateAnnotationText` 方法是否正确提取音标：
```javascript
// 应该优先使用美式音标
const usPhonetic = result.phonetics.find(p => p.type === 'us');
```

## 🎓 预期流程

```
用户选中 "hello"
    ↓
点击 "标注"
    ↓
调用 translationService.translate('hello', 'zh-CN')
    ↓
GoogleTranslateProvider.translate()
    ├─ 翻译：你好 ✅
    └─ 音标：无 ❌
    ↓
TranslationService 检测到无音标
    ↓
调用 FreeDictionary
    ├─ 获取 US 音标：/həˈloʊ/
    └─ 获取 UK 音标：/həˈləʊ/
    ↓
TranslationService.generateAnnotationText()
    ├─ 提取音标：/həˈloʊ/ (US)
    ├─ 提取翻译：你好
    └─ 生成："/həˈloʊ/ 你好"
    ↓
content.js 创建 Ruby 标注
    ↓
显示：hello 的上方显示 "/həˈloʊ/ 你好"
```

## 🚀 快速验证命令

在控制台运行以下命令进行快速验证：

```javascript
// 快速测试
(async () => {
  console.log('=== 开始测试 ===');
  
  const words = ['hello', 'world', 'example'];
  
  for (const word of words) {
    console.log(`\n测试单词: ${word}`);
    const result = await translationService.translate(word, 'zh-CN');
    
    console.log('  翻译:', result.translatedText);
    console.log('  音标数量:', result.phonetics.length);
    console.log('  标注文本:', result.annotationText);
    
    if (result.annotationText && result.annotationText.includes('/')) {
      console.log('  ✅ 包含音标');
    } else {
      console.log('  ❌ 不包含音标');
    }
  }
  
  console.log('\n=== 测试完成 ===');
})();
```

## ✅ 成功标准

所有测试通过，标注正确显示：
- ✅ 音标（如果是单词）
- ✅ 翻译
- ✅ 格式正确（音标在前，翻译在后，用空格分隔）
- ✅ 控制台日志完整

---

**如果所有测试通过，说明修复成功！** 🎉
