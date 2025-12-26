# Annotate Translate 开发者文档

这是 Annotate Translate 项目的 VitePress 文档站点。

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run docs:dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run docs:build
```

### 预览生产版本

```bash
npm run docs:preview
```

## 文档结构

```
docs/
├── .vitepress/
│   └── config.mts       # VitePress 配置
├── index.md             # 首页
├── guide/               # 用户指南
├── development/         # 开发文档
├── api/                 # API 参考
├── recipes/             # 实战示例
├── design/              # 设计文档
└── resources/           # 资源
```

## 部署

文档会通过 GitHub Actions 自动部署到 GitHub Pages。

推送到 `main` 分支后，访问：https://your-username.github.io/annotate-translate/

## 贡献

欢迎完善文档！请按照以下步骤：

1. Fork 仓库
2. 创建分支
3. 编辑文档（Markdown 文件）
4. 提交 Pull Request

## 已完成的文档

✅ 首页 (index.md)
✅ 用户指南首页 (guide/index.md)
✅ 开发文档首页 (development/index.md)
✅ 架构概览 (development/architecture.md)
✅ 快速开始 (development/getting-started.md)
✅ API 参考首页 (api/index.md)
✅ 实战示例首页 (recipes/index.md)
✅ 设计文档首页 (design/index.md)
✅ 资源首页 (resources/index.md)

## 待完善的文档

以下页面已在配置中定义，但尚未创建内容：

### 用户指南 (guide/)
- [ ] installation.md - 安装指南
- [ ] quick-start.md - 快速开始
- [ ] translation.md - 翻译功能
- [ ] annotation.md - 标注功能
- [ ] vocabulary-mode.md - 词汇模式
- [ ] settings.md - 配置说明
- [ ] faq.md - 常见问题

### 开发文档 (development/)
- [ ] project-structure.md - 项目结构详解
- [ ] core-concepts.md - 核心概念
- [ ] extension-architecture.md - 扩展架构 (MV3)
- [ ] translation-service.md - 翻译服务层
- [ ] providers.md - 提供商系统
- [ ] ai-translation.md - AI 翻译实现
- [ ] vocabulary-system.md - 词库系统
- [ ] ui-components.md - UI 组件
- [ ] settings-management.md - 设置管理
- [ ] caching-strategy.md - 缓存策略
- [ ] i18n.md - 国际化
- [ ] debugging.md - 调试指南

### API 参考 (api/)
- [ ] translation-service.md - TranslationService API
- [ ] vocabulary-service.md - VocabularyService API
- [ ] annotation-scanner.md - AnnotationScanner API
- [ ] cache-manager.md - CacheManager API
- [ ] utils.md - 工具函数 API
- [ ] providers/base-provider.md
- [ ] providers/google.md
- [ ] providers/youdao.md
- [ ] providers/deepl.md
- [ ] providers/openai.md
- [ ] providers/freedictionary.md

### 实战示例 (recipes/)
- [ ] add-new-provider.md - 添加新翻译提供商
- [ ] custom-ui-theme.md - 自定义 UI 主题
- [ ] custom-vocabulary.md - 自定义词库
- [ ] ai-prompt-template.md - 自定义 AI 提示词
- [ ] cors-proxy.md - CORS 代理实现

### 设计文档 (design/)
- [ ] ui-guidelines.md - UI 设计规范
- [ ] wordbook-design.md - 单词本设计
- [ ] data-structures.md - 数据结构设计

### 资源 (resources/)
- [ ] ecdict.md - ECDICT 词库说明
- [ ] glossary.md - 术语表
- [ ] links.md - 相关链接

### 其他
- [ ] contributing.md - 贡献指南

## 技术栈

- **VitePress** - 文档站点生成器
- **Vue.js** - VitePress 基于 Vue 3
- **Markdown** - 文档编写格式
- **Mermaid** - 图表绘制（VitePress 原生支持）

## 许可证

MIT License
