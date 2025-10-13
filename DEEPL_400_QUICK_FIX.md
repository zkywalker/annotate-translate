# 🚨 DeepL 400 错误快速修复

## 问题
```
DeepL API error [400]: Value for 'source_lang' not supported
```

## ⚡ 快速解决（1步）

### 重新加载扩展
```
1. 访问 chrome://extensions/
2. 找到你的扩展
3. 点击刷新按钮 🔄
4. 刷新网页
5. 重试翻译
```

就这么简单！代码已修复。

## 🔍 发生了什么？

### 问题
扩展向 DeepL 发送了空的 `source_lang` 参数：
```javascript
{
  text: "hello",
  source_lang: "",    // ❌ 空字符串导致 400 错误
  target_lang: "ZH"
}
```

### 修复
现在当使用自动检测时，完全不发送 `source_lang` 参数：
```javascript
{
  text: "hello",
  // source_lang 参数被省略 ✅
  target_lang: "ZH"
}
```

## 🎯 技术细节

### 改进 1: 更严格的参数检查
```javascript
// ✅ 现在：检查原始值
if (sourceLang !== 'auto' && source_lang && source_lang !== '') {
  params.source_lang = source_lang;
}

// ❌ 以前：只检查转换后的值（有漏洞）
if (source_lang && source_lang !== '') {
  params.source_lang = source_lang;
}
```

### 改进 2: 分离源语言和目标语言映射
```javascript
// 源语言：EN, ZH, JA
const source_lang = this.convertLangCode(sourceLang, false);

// 目标语言：EN-US, ZH, JA（可能带变体）
const target_lang = this.convertLangCode(targetLang, true);
```

### 改进 3: 支持更多语言
从 15 种 → **30+ 种语言**

## 📊 日志输出

修复后，你会在控制台看到：

```
✅ 自动检测（推荐）
[DeepLTranslate] Using auto-detection (no source_lang parameter)
[DeepLTranslate] Final request params: { text: "hello", target_lang: "ZH" }

✅ 指定源语言
[DeepLTranslate] Using explicit source language: EN
[DeepLTranslate] Final request params: { text: "hello", source_lang: "EN", target_lang: "ZH" }
```

## 🎉 就这样！

不需要更改任何设置，只需重新加载扩展即可。

---

**详细文档**: `DEEPL_400_SOURCE_LANG_FIX.md`  
**更新**: 2025-10-13 | **状态**: ✅ 已修复
