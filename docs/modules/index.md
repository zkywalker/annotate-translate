# 模块文档

持久性文档，按模块组织，描述系统现状和设计理由。

修改任何代码前，先查找并阅读关联的模块文档。

## 模块列表

| 模块 | 描述 | 代码路径 |
|------|------|----------|
| [翻译服务](./translation-service.md) | Provider Pattern 翻译服务层，管理缓存、音标补充、提供商切换 | `src/services/translation-service.js` |
| [内容脚本](./content.md) | 注入网页的主脚本，负责设置加载、DOM 交互、浮动菜单、标注 | `src/content/content.js` |
| [词库系统](./vocabulary.md) | 词库数据加载、批量扫描标注、AbortController 取消机制 | `src/services/vocabulary-service.js` |
