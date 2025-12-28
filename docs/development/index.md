# 开发文档

欢迎来到 Annotate Translate 开发者文档！本文档面向想要理解项目架构、贡献代码或二次开发的开发者。

## 技术栈

- Chrome Extension Manifest V3
- Vanilla JavaScript (ES6+)
- Provider Pattern 架构
- 无构建流程，直接加载

## 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/annotate-translate.git
cd annotate-translate
```

### 2. 加载扩展

1. 打开 Chrome 浏览器，访问 `chrome://extensions/`
2. 启用"开发者模式"（右上角开关）
3. 点击"加载已解压的扩展程序"
4. 选择项目根目录

### 3. 开始开发

- 修改代码后，点击扩展卡片上的刷新按钮
- 打开浏览器控制台查看日志
- 使用 Chrome DevTools 调试

[详细开发指南 →](/development/getting-started)

## 文档导航

### 📚 基础

<div class="vp-card-container">

- [架构概览](/development/architecture) - 系统整体架构
- [快速开始](/development/getting-started) - 开发环境搭建
- [项目结构](/development/project-structure) - 目录和文件组织
- [核心概念](/development/core-concepts) - 设计模式和关键思想

</div>

### 🔧 核心系统

<div class="vp-card-container">

- [扩展架构](/development/extension-architecture) - Manifest V3 详解
- [翻译服务](/development/translation-service) - TranslationService 深入
- [提供商系统](/development/providers) - 如何实现翻译提供商
- [AI 翻译](/development/ai-translation) - OpenAI 集成和提示词
- [词库系统](/development/vocabulary-system) - ECDICT 和词汇标注

</div>

### 🎨 专题

<div class="vp-card-container">

- [UI 组件](/development/ui-components) - 翻译卡片和标注 UI
- [设置管理](/development/settings-management) - 配置系统详解
- [缓存策略](/development/caching-strategy) - LRU 缓存实现
- [国际化](/development/i18n) - i18n 系统使用
- [调试指南](/development/debugging) - 调试技巧和工具

</div>

## 贡献代码

我们欢迎各种形式的贡献：

- 🐛 报告 Bug
- 💡 提出新功能
- 📝 改进文档
- 🔧 提交 Pull Request

请查看 [贡献指南](/contributing) 了解详情。

## 下一步

- [架构概览](/development/architecture)
- [API 参考](/api/)
- [实战示例](/recipes/)
