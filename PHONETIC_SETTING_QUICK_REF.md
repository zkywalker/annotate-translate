# 标注音标设置 - 快速参考

## 问题
"在标注中显示音标 + 翻译" 选项不生效

## 原因
- `generateAnnotationText()` 方法未检查 `showPhoneticInAnnotation` 配置
- 配置未传递给所有翻译提供商

## 快速测试

### 1. 检查当前配置
```javascript
// 在浏览器控制台运行
chrome.storage.sync.get('showPhoneticInAnnotation', console.log);
```

### 2. 切换配置
```javascript
// 开启
chrome.storage.sync.set({ showPhoneticInAnnotation: true });

// 关闭
chrome.storage.sync.set({ showPhoneticInAnnotation: false });
```

### 3. 重新加载页面
刷新页面以应用新配置

### 4. 测试标注
选中英文单词（如 "hello"），观察标注：
- **开启时**: `/həˈloʊ/ 你好`
- **关闭时**: `你好`

## 使用测试页面

打开 `test-phonetic-annotation-setting.html` 进行可视化测试

## 验证修复

### 检查 TranslationService
```javascript
console.log('Service config:', translationService.showPhoneticInAnnotation);
```

### 检查提供商
```javascript
const provider = translationService.getActiveProvider();
console.log('Provider config:', provider.showPhoneticInAnnotation);
```

### 测试标注生成
```javascript
// 获取翻译结果
const result = await translationService.translate('hello', 'zh-CN');
console.log('Translation:', result.translatedText);
console.log('Phonetics:', result.phonetics);
console.log('Annotation Text:', result.annotationText);
```

## 预期输出

### 开启时 (true)
```javascript
{
  translatedText: "你好",
  phonetics: [{ text: "/həˈloʊ/", type: "us" }],
  annotationText: "/həˈloʊ/ 你好"  // ✅ 包含音标
}
```

### 关闭时 (false)
```javascript
{
  translatedText: "你好",
  phonetics: [{ text: "/həˈloʊ/", type: "us" }],
  annotationText: "你好"  // ✅ 不包含音标
}
```

## 修改的文件
- ✅ `translation-service.js`
- ✅ `content.js`

## 测试文件
- ✅ `test-phonetic-annotation-setting.html`
- ✅ `PHONETIC_ANNOTATION_SETTING_FIX.md`
