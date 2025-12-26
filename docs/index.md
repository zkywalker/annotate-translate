---
layout: home

hero:
  name: Annotate Translate
  text: 网页文本标注与翻译
  tagline: Chrome 扩展开发者文档 - 支持多提供商翻译、AI 驱动、词库系统
  image:
    src: /images/logo.png
    alt: Annotate Translate
  actions:
    - theme: brand
      text: 快速开始
      link: /development/getting-started
    - theme: alt
      text: 用户指南
      link: /guide/
    - theme: alt
      text: GitHub
      link: https://github.com/your-username/annotate-translate

features:
  - icon: 🌐
    title: 多提供商支持
    details: 集成 Google Translate、Youdao、DeepL 和 AI 翻译，支持运行时切换

  - icon: 🤖
    title: AI 驱动翻译
    details: OpenAI 兼容 API 支持，上下文感知翻译，自定义提示词模板

  - icon: 📚
    title: 强大的词库系统
    details: 基于 ECDICT，支持 CET-4/6、TOEFL、IELTS、GRE 等多个词库

  - icon: 🎨
    title: Provider Pattern 架构
    details: 优雅的提供商抽象，易于扩展新的翻译服务

  - icon: ⚡
    title: 高性能缓存
    details: LRU 缓存 + TTL 策略，智能音标补充机制

  - icon: 🔧
    title: 无构建流程
    details: 纯 Vanilla JavaScript，Chrome Manifest V3，直接加载运行

  - icon: 🌍
    title: 国际化支持
    details: 支持 8 种语言（en, zh_CN, zh_TW, de, es, fr, ja, ko）

  - icon: 📝
    title: 智能标注
    details: Ruby 标注、词汇模式、批量标注，支持自定义样式

  - icon: 🔊
    title: 音频播放
    details: 三层 Fallback 策略：ArrayBuffer → URL → TTS
---

## 核心特性

### 翻译功能

选中网页文本即可翻译，支持显示音标、释义、例句和音频播放。支持多个翻译提供商：

- **Google Translate** - 免费，无需配置
- **Youdao** - 需要 API Key，中文优化
- **DeepL** - 需要 API Key，高质量翻译
- **OpenAI** - AI 驱动，上下文感知

### 文本标注

快速为选中文本添加 Ruby 标注，显示音标和翻译，标注永久保存。

### 词汇模式

根据词库自动标注页面中的重点词汇（CET-4/6、TOEFL、IELTS、GRE 等），支持批量翻译和学习模式。

## 开发者友好

### 简洁的架构

```javascript
// 翻译服务
const result = await translationService.translate(text, 'zh-CN');

// 注册新提供商
translationService.registerProvider('custom', new CustomProvider());

// 切换提供商
translationService.setActiveProvider('custom');
```

### 易于扩展

通过实现 `TranslationProvider` 接口即可添加新的翻译服务：

```javascript
class CustomProvider extends TranslationProvider {
  async translate(text, targetLang, sourceLang) {
    // 实现翻译逻辑
    return {
      originalText: text,
      translatedText: '...',
      phonetics: [...],
      definitions: [...]
    };
  }
}
```

## 技术亮点

- **Chrome Extension Manifest V3** - 现代扩展架构
- **Provider Pattern** - 提供商模式实现多服务支持
- **CORS Proxy** - Background Service Worker 绕过跨域限制
- **LRU Cache** - 高性能翻译结果缓存
- **Phonetic Fallback** - 三层音标补充策略
- **ECDICT Integration** - 本地优先的词库数据
- **Batch Operations** - 批量翻译与标注优化
- **i18n** - 完整的国际化支持

## 快速链接

<div class="vp-doc">

### 📖 文档导航

- [用户指南](/guide/) - 如何使用扩展的各项功能
- [开发文档](/development/) - 架构设计、核心系统详解
- [API 参考](/api/) - 完整的 API 文档
- [实战示例](/recipes/) - 添加新功能的 Step-by-step 教程
- [设计文档](/design/) - UI 规范、数据结构设计

### 🚀 快速开始

1. **克隆仓库**
   ```bash
   git clone https://github.com/your-username/annotate-translate.git
   cd annotate-translate
   ```

2. **加载扩展**
   - 打开 Chrome 浏览器，访问 `chrome://extensions/`
   - 启用"开发者模式"
   - 点击"加载已解压的扩展程序"
   - 选择项目根目录

3. **开始开发**
   - 阅读 [开发文档](/development/)
   - 查看 [架构概览](/development/architecture)
   - 尝试 [添加新提供商](/recipes/add-new-provider)

</div>

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

- [GitHub Issues](https://github.com/your-username/annotate-translate/issues)
- [贡献指南](/contributing)

## 许可证

[MIT License](https://github.com/your-username/annotate-translate/blob/main/LICENSE)
