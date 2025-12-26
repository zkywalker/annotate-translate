# 资源

本节包含与 Annotate Translate 相关的资源、工具和链接。

## ECDICT 词库

### 什么是 ECDICT？

ECDICT（English-Chinese Dictionary）是由 skywind3000 创建的开源英汉词典数据库，包含 770,000+ 词条，MIT 许可证。

### 数据来源

- **作者**: skywind3000
- **GitHub**: [https://github.com/skywind3000/ECDICT](https://github.com/skywind3000/ECDICT)
- **许可证**: MIT License
- **数据格式**: CSV

### 在本项目中的使用

Annotate Translate 使用 ECDICT 作为词库数据源，支持：
- CET-4/6 词汇
- TOEFL、IELTS、GRE 词汇
- 考研词汇
- Collins 星级分类
- 词频统计

[详细了解 ECDICT 集成 →](/resources/ecdict)

## 术语表

### 核心术语

- **Provider** - 提供商，实现翻译服务的具体类
- **Service Layer** - 服务层，抽象翻译操作的中间层
- **Content Script** - 内容脚本，注入到网页的脚本
- **Background Service Worker** - 后台服务工作者，处理扩展生命周期
- **Ruby Annotation** - Ruby 标注，HTML `<ruby>` 标签实现的文本注释
- **Phonetic** - 音标，词语的发音标记
- **LRU Cache** - 最近最少使用缓存，一种缓存淘汰策略
- **TTL** - Time To Live，缓存生存时间
- **CORS** - Cross-Origin Resource Sharing，跨域资源共享
- **Manifest V3** - Chrome 扩展清单版本 3

### 提供商相关

- **Google Translate** - Google 翻译服务
- **Youdao** - 有道翻译服务
- **DeepL** - DeepL 翻译服务
- **OpenAI** - OpenAI AI 翻译服务
- **FreeDictionary** - 免费词典 API，用于音标补充

### 词库相关

- **CET-4/6** - 大学英语四级/六级词汇
- **TOEFL** - 托福考试词汇
- **IELTS** - 雅思考试词汇
- **GRE** - 研究生入学考试词汇
- **Collins** - 柯林斯词典星级分类
- **BNC** - British National Corpus，英国国家语料库

[查看完整术语表 →](/resources/glossary)

## 相关链接

### 官方资源

- [GitHub 仓库](https://github.com/your-username/annotate-translate)
- [Chrome Web Store](#)
- [问题反馈](https://github.com/your-username/annotate-translate/issues)
- [更新日志](https://github.com/your-username/annotate-translate/releases)

### 技术文档

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Chrome Storage API](https://developer.chrome.com/docs/extensions/reference/storage/)
- [Chrome i18n API](https://developer.chrome.com/docs/extensions/reference/i18n/)
- [Chrome Runtime API](https://developer.chrome.com/docs/extensions/reference/runtime/)

### 翻译 API 文档

- [Google Translate API](https://cloud.google.com/translate/docs)
- [Youdao Translation API](https://ai.youdao.com/DOCSIRMA/html/trans/api/wbfy/index.html)
- [DeepL API](https://www.deepl.com/docs-api)
- [OpenAI API](https://platform.openai.com/docs/api-reference)

### 开源项目

- [ECDICT](https://github.com/skywind3000/ECDICT) - 英汉词典数据库
- [VitePress](https://vitepress.dev/) - 文档站点生成器
- [Lucide Icons](https://lucide.dev/) - 图标库

### 学习资源

- [JavaScript MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
- [Chrome Extension 开发指南](https://developer.chrome.com/docs/extensions/mv3/getstarted/)
- [Provider Pattern](https://refactoring.guru/design-patterns/provider)

[查看完整链接列表 →](/resources/links)

## 开发工具

### Chrome 开发者工具

- **Elements** - 检查 DOM 和 CSS
- **Console** - 查看日志和错误
- **Sources** - 调试 JavaScript
- **Network** - 监控网络请求
- **Application** - 查看 Storage 数据

### 扩展调试

- **chrome://extensions/** - 扩展管理页面
- **Service Worker** - 查看后台脚本日志
- **Inspect Popup** - 调试弹出窗口
- **Inspect Options** - 调试设置页面

### 在线工具

- [JSON Formatter](https://jsonformatter.org/) - JSON 格式化
- [RegEx Tester](https://regex101.com/) - 正则表达式测试
- [Can I Use](https://caniuse.com/) - 浏览器兼容性查询

## 社区

### 讨论

- [GitHub Discussions](https://github.com/your-username/annotate-translate/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/chrome-extension)

### 贡献

- [贡献指南](/contributing)
- [行为准则](https://github.com/your-username/annotate-translate/blob/main/CODE_OF_CONDUCT.md)

## 许可证

本项目采用 [MIT License](https://github.com/your-username/annotate-translate/blob/main/LICENSE)。

## 鸣谢

- [ECDICT](https://github.com/skywind3000/ECDICT) - 提供词库数据
- [Lucide](https://lucide.dev/) - 提供图标
- 所有贡献者和用户
