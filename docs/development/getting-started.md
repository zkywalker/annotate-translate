# 快速开始

本指南将帮助你在 5 分钟内搭建好 Annotate Translate 的开发环境并开始贡献代码。

## 前置要求

### 必需

- **Chrome 浏览器** - 版本 88+ (支持 Manifest V3)
- **Git** - 用于克隆仓库
- **文本编辑器** - VS Code、Sublime Text 等

### 可选

- **Node.js** - 仅用于运行脚本处理 ECDICT 数据（如需要）
- **Chrome DevTools** - 熟悉基本调试方法

### 技能要求

- JavaScript (ES6+)
- 基本的 Chrome Extension 知识
- DOM 操作
- 异步编程 (Promise/async-await)

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/annotate-translate.git
cd annotate-translate
```

### 2. 了解项目结构

```bash
tree -L 2 -I 'node_modules|.git'
```

输出：
```
annotate-translate/
├── manifest.json
├── src/
│   ├── background/
│   ├── content/
│   ├── services/
│   ├── providers/
│   ├── utils/
│   ├── options/
│   ├── popup/
│   └── data/
├── _locales/
├── assets/
└── README.md
```

### 3. 加载扩展到 Chrome

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 启用右上角的 **"开发者模式"**
4. 点击 **"加载已解压的扩展程序"**
5. 选择项目根目录（`annotate-translate/`）

你应该会看到扩展卡片，显示扩展名称和版本号。

### 4. 测试基本功能

1. 打开任意网页（如 Wikipedia）
2. 选中一段英文文本
3. 应该会出现浮动菜单，点击 **"翻译"**
4. 查看翻译卡片是否正常显示

## 开发工作流

### 代码修改

1. **修改代码** - 使用你喜欢的编辑器编辑源文件
2. **刷新扩展** - 在 `chrome://extensions/` 页面点击扩展卡片上的刷新按钮 🔄
3. **刷新网页** - 刷新测试网页使 Content Scripts 重新加载
4. **测试功能** - 验证你的修改是否生效

### 调试方法

#### 1. Content Script 调试

在测试网页上打开 Chrome DevTools (F12):

```javascript
// 添加 console.log 查看变量
console.log('[Content]', result);

// 使用 debugger 断点
debugger;
```

#### 2. Background Service Worker 调试

1. 访问 `chrome://extensions/`
2. 找到扩展卡片，点击 **"service worker"** 链接
3. 打开 DevTools 查看 Background 脚本的日志

```javascript
// background.js
console.log('[Background]', request);
```

#### 3. Popup 调试

1. 点击扩展图标打开 Popup
2. 右键点击 Popup 窗口
3. 选择 **"检查"**

#### 4. Options 页面调试

1. 右键点击扩展图标
2. 选择 **"选项"**
3. 右键点击选项页面 → **"检查"**

### 常用开发技巧

#### 快速重载

修改代码后快速重载的快捷方式：

1. `Ctrl+R` (或 `Cmd+R`) - 刷新 `chrome://extensions/` 页面会自动重载扩展
2. 使用扩展 [Extension Reloader](https://chrome.google.com/webstore/detail/extensions-reloader/fimgfedafeadlieiabdeeaodndnlbhid) 实现一键重载

#### 查看存储数据

在 DevTools 中查看 Chrome Storage 数据：

1. 打开 DevTools
2. 切换到 **Application** 标签
3. 展开 **Storage** → **Chrome Storage**
4. 查看 `sync` 和 `local` 数据

#### 清理存储数据

```javascript
// 在 Console 中运行
chrome.storage.sync.clear();
chrome.storage.local.clear();
```

## 第一次贡献

### 示例任务：修改翻译卡片背景色

让我们通过一个简单的任务来熟悉开发流程。

#### 1. 找到相关文件

翻译卡片的样式在：`src/styles/translation-ui.css`

```bash
# 搜索翻译卡片相关样式
grep -n "translation-card" src/styles/translation-ui.css
```

#### 2. 修改代码

编辑 `src/styles/translation-ui.css`：

```css
/* 修改前 */
.translation-card {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
}

/* 修改后 */
.translation-card {
  background: #f6f8fa; /* 改为浅灰色背景 */
  border: 1px solid #e1e4e8;
  border-radius: 6px;
}
```

#### 3. 测试修改

1. 在 `chrome://extensions/` 刷新扩展
2. 刷新测试网页
3. 选中文本并翻译
4. 检查翻译卡片背景色是否变为浅灰色

#### 4. 提交修改

```bash
git add src/styles/translation-ui.css
git commit -m "style: change translation card background to light gray"
git push origin your-branch
```

#### 5. 创建 Pull Request

访问 GitHub 仓库，点击 "New Pull Request"。

## 常见任务

### 添加新的翻译提供商

详细教程见 [添加新翻译提供商](/recipes/add-new-provider)。

基本步骤：

1. 在 `src/services/translation-service.js` 中创建新类
2. 继承 `TranslationProvider`
3. 实现 `translate()` 方法
4. 注册提供商
5. 测试

### 修改 UI 文本

所有 UI 文本都在 `_locales/zh_CN/messages.json` (中文) 和 `_locales/en/messages.json` (英文)。

```json
{
  "translate": {
    "message": "翻译",
    "description": "Translate button text"
  }
}
```

修改后刷新扩展即可生效。

### 添加新的设置项

1. 在 `src/utils/settings-schema.js` 中添加默认值
2. 在 `src/options/options.html` 中添加 UI 控件
3. 在 `src/options/options.js` 中绑定事件
4. 在相关代码中使用设置项

## 项目约定

### 代码风格

- **缩进**: 2 空格
- **引号**: 单引号 `'`
- **分号**: 使用分号结尾
- **命名**:
  - 类名: `PascalCase`
  - 函数/变量: `camelCase`
  - 常量: `UPPER_SNAKE_CASE`

### 注释规范

```javascript
/**
 * 翻译文本
 * @param {string} text - 要翻译的文本
 * @param {string} targetLang - 目标语言
 * @param {string} sourceLang - 源语言 (可选，默认 'auto')
 * @returns {Promise<TranslationResult>}
 */
async function translate(text, targetLang, sourceLang = 'auto') {
  // ...
}
```

### Git Commit 规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型：
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档修改
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat(providers): add Bing Translate provider

- Implement BingTranslateProvider class
- Add configuration in settings schema
- Add UI in options page

Closes #123
```

## 测试

### 手动测试

测试文件位于项目根目录：

- `test-ai-translation.html` - 测试 AI 翻译功能
- `translation-test.html` - 测试翻译功能

在浏览器中打开这些文件进行测试。

### 测试清单

提交前请确保：

- ✅ 基本翻译功能正常
- ✅ 标注功能正常
- ✅ 设置可以正常保存和读取
- ✅ 没有控制台错误
- ✅ 兼容最新版 Chrome

## 常见问题

### 扩展无法加载

**症状**: 在 `chrome://extensions/` 加载时出错。

**解决方案**:
1. 检查 `manifest.json` 语法是否正确
2. 确保所有引用的文件路径存在
3. 查看错误信息定位问题

### 修改代码后不生效

**症状**: 修改代码后刷新扩展，功能没有更新。

**解决方案**:
1. 确保在 `chrome://extensions/` 点击了刷新按钮
2. 刷新测试网页（Content Scripts 需要重新注入）
3. 清空浏览器缓存 (Ctrl+Shift+Delete)
4. 如果是 Background 脚本，点击 "service worker" 链接检查是否有错误

### 无法调试 Background Service Worker

**症状**: 点击 "service worker" 链接后没有反应。

**解决方案**:
1. Background Service Worker 在空闲时会自动休眠
2. 触发一个需要 Background 脚本的操作（如右键菜单）
3. 立即点击 "service worker" 链接

### CORS 错误

**症状**: 控制台显示 CORS 相关错误。

**解决方案**:
1. 检查 `manifest.json` 中的 `host_permissions`
2. 对于 Youdao、DeepL 等，确保使用 Background 代理
3. 查看 [CORS 代理实现](/recipes/cors-proxy) 教程

## 下一步

- 阅读 [架构概览](/development/architecture) 理解系统设计
- 查看 [项目结构](/development/project-structure) 了解目录组织
- 尝试 [添加新提供商](/recipes/add-new-provider) 实战教程
- 加入 [GitHub Discussions](https://github.com/your-username/annotate-translate/discussions) 与社区交流

## 获取帮助

遇到问题？
- 查看 [常见问题](/guide/faq)
- 搜索 [GitHub Issues](https://github.com/your-username/annotate-translate/issues)
- 提出新的 [Issue](https://github.com/your-username/annotate-translate/issues/new)
- 参与 [Discussions](https://github.com/your-username/annotate-translate/discussions)

欢迎贡献！🎉
