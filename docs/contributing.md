# 贡献指南

感谢您考虑为 Annotate Translate 贡献代码！本文档将指导您完成贡献流程。

## 行为准则

参与本项目即表示您同意遵守以下准则：

- ✅ 尊重所有贡献者
- ✅ 接受建设性批评
- ✅ 专注于对项目最有利的事情
- ✅ 对新手友好
- ❌ 不使用侮辱性或贬损性语言
- ❌ 不进行人身攻击或政治攻击

---

## 快速开始

### 1. Fork 仓库

访问 [GitHub 仓库](https://github.com/your-username/annotate-translate)，点击右上角的 **Fork** 按钮。

### 2. 克隆到本地

```bash
git clone https://github.com/YOUR_USERNAME/annotate-translate.git
cd annotate-translate
```

### 3. 设置上游仓库

```bash
git remote add upstream https://github.com/your-username/annotate-translate.git
```

### 4. 创建功能分支

```bash
git checkout -b feature/your-feature-name
```

### 5. 加载扩展到 Chrome

1. 打开 `chrome://extensions/`
2. 启用 **"开发者模式"**
3. 点击 **"加载已解压的扩展程序"**
4. 选择项目根目录

::: tip 无需构建
此项目使用 Vanilla JavaScript，无需 `npm install` 或构建步骤。
:::

---

## 开发工作流

### 保持分支更新

在开始开发前，同步上游仓库的最新代码：

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

### 开发新功能

1. **创建功能分支**

```bash
git checkout -b feature/add-bing-translator
```

2. **编写代码**

   - 遵循 [代码规范](#代码规范)
   - 添加必要的注释
   - 保持代码简洁

3. **测试功能**

   - 在 Chrome 中重新加载扩展
   - 测试所有功能路径
   - 检查浏览器控制台是否有错误

4. **提交代码**

```bash
git add .
git commit -m "feat: add Bing Translator provider"
```

5. **推送到 GitHub**

```bash
git push origin feature/add-bing-translator
```

6. **创建 Pull Request**

   - 访问您的 Fork 仓库
   - 点击 **"New Pull Request"**
   - 填写 PR 描述 (参考 [PR 模板](#pull-request-模板))
   - 提交 PR

---

## 代码规范

### JavaScript 风格

遵循 Airbnb JavaScript Style Guide 的核心原则：

#### 1. 命名约定

```javascript
// ✅ 类名: PascalCase
class TranslationProvider {}

// ✅ 函数/变量: camelCase
const translateText = () => {};
let apiKey = 'xxx';

// ✅ 常量: UPPER_SNAKE_CASE
const MAX_CACHE_SIZE = 100;
const API_ENDPOINT = 'https://api.example.com';

// ✅ 私有属性/方法: 以 _ 开头
class MyClass {
  _privateMethod() {}
}

// ❌ 避免使用
var myVar = 'bad';  // 使用 const/let
function My_Function() {}  // 使用 camelCase
```

#### 2. 函数声明

```javascript
// ✅ 推荐: 箭头函数 (简洁场景)
const add = (a, b) => a + b;

// ✅ 推荐: 传统函数 (类方法、需要 this)
function processData(data) {
  return data.map(item => item.value);
}

// ✅ 推荐: async/await (异步操作)
async function translate(text) {
  const result = await translationService.translate(text, 'zh-CN');
  return result;
}

// ❌ 避免嵌套回调
fetchData((data) => {
  processData(data, (result) => {
    saveResult(result, () => {
      console.log('done');
    });
  });
});
```

#### 3. 对象和数组

```javascript
// ✅ 使用对象字面量
const config = {
  apiKey: 'xxx',
  model: 'gpt-3.5-turbo'
};

// ✅ 使用解构赋值
const { apiKey, model } = config;

// ✅ 使用扩展运算符
const newConfig = { ...config, temperature: 0.3 };

// ✅ 简洁的对象方法
const obj = {
  name: 'test',
  // ✅ 简洁方法
  getName() {
    return this.name;
  },
  // ❌ 传统方法
  getNameOld: function() {
    return this.name;
  }
};
```

#### 4. 字符串

```javascript
// ✅ 使用模板字符串
const message = `Hello, ${name}!`;

// ✅ 多行字符串
const longText = `
  This is a long text
  that spans multiple lines
`;

// ❌ 避免字符串拼接
const message = 'Hello, ' + name + '!';
```

#### 5. 条件语句

```javascript
// ✅ 使用严格相等
if (value === 0) {}

// ✅ 使用简洁的布尔判断
if (isEnabled) {}
if (!isEmpty) {}

// ❌ 避免
if (value == 0) {}  // 使用 ===
if (isEnabled === true) {}  // 冗余
```

### 注释规范

#### 文件头注释

```javascript
/**
 * TranslationService - 翻译服务核心类
 *
 * 负责管理翻译提供商、缓存翻译结果、补充音标等功能。
 *
 * @class TranslationService
 * @example
 * const service = new TranslationService();
 * service.registerProvider('google', new GoogleTranslateProvider());
 * const result = await service.translate('hello', 'zh-CN');
 */
```

#### 函数注释

```javascript
/**
 * 翻译文本
 *
 * @param {string} text - 要翻译的文本
 * @param {string} targetLang - 目标语言 (ISO 639-1)
 * @param {string} [sourceLang='auto'] - 源语言 (默认自动检测)
 * @param {Object} [options={}] - 可选参数
 * @param {string} [options.context] - 上下文文本
 * @param {boolean} [options.useCache=true] - 是否使用缓存
 * @returns {Promise<TranslationResult>} 翻译结果
 * @throws {Error} 翻译失败时抛出错误
 *
 * @example
 * const result = await translate('hello', 'zh-CN');
 * console.log(result.translatedText); // "你好"
 */
async function translate(text, targetLang, sourceLang = 'auto', options = {}) {
  // ...
}
```

#### 行内注释

```javascript
// ✅ 解释 "为什么"，而非 "是什么"
// CORS 代理: 某些 API 不允许浏览器直接访问，需要通过 Background 代理
const response = await this.sendRequestViaBackground(url);

// ❌ 避免无意义注释
// 创建变量
const x = 10;
```

### 错误处理

```javascript
// ✅ 总是捕获异步错误
async function translateText(text) {
  try {
    const result = await translationService.translate(text, 'zh-CN');
    return result;
  } catch (error) {
    console.error('[TranslationError]', error);
    // 降级处理
    return { originalText: text, translatedText: text, detectedLanguage: 'unknown' };
  }
}

// ✅ 提供有意义的错误消息
if (!apiKey) {
  throw new Error('API Key is required for Youdao Translate. Please configure it in settings.');
}

// ❌ 避免空 catch
try {
  doSomething();
} catch (error) {
  // 什么都不做
}
```

### 代码组织

```javascript
// ✅ 按逻辑分组
class TranslationService {
  // 1. 构造函数
  constructor() {}

  // 2. 公共方法 (按功能分组)
  // --- 提供商管理 ---
  registerProvider(name, provider) {}
  setActiveProvider(name) {}

  // --- 翻译功能 ---
  async translate(text, targetLang) {}
  async detectLanguage(text) {}

  // --- 缓存管理 ---
  getFromCache(key) {}
  setToCache(key, value) {}

  // 3. 私有方法
  _buildCacheKey(text, lang) {}
}
```

---

## 提交规范

### Commit Message 格式

遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:

```
feat(providers): add Bing Translator provider

- Implement BingTranslateProvider class
- Add CORS proxy support in background.js
- Update settings UI for Bing configuration

Closes #123
```

### Type 类型

| Type | 说明 | 示例 |
|------|------|------|
| `feat` | 新功能 | `feat: add dark mode support` |
| `fix` | Bug 修复 | `fix: resolve cache invalidation issue` |
| `docs` | 文档变更 | `docs: update API reference` |
| `style` | 代码格式 (不影响功能) | `style: format translation-service.js` |
| `refactor` | 重构 (不改变功能) | `refactor: simplify cache logic` |
| `perf` | 性能优化 | `perf: optimize batch translation` |
| `test` | 测试相关 | `test: add unit tests for providers` |
| `chore` | 构建/工具变更 | `chore: update manifest version` |
| `revert` | 回滚提交 | `revert: revert "feat: add feature X"` |

### Scope 范围 (可选)

| Scope | 说明 |
|-------|------|
| `providers` | 翻译提供商相关 |
| `ui` | UI 组件 |
| `content` | Content Scripts |
| `background` | Background Service Worker |
| `settings` | 设置管理 |
| `cache` | 缓存系统 |
| `vocabulary` | 词库系统 |
| `i18n` | 国际化 |

### Subject 主题

- ✅ 使用祈使句 (如 "add" 而非 "added")
- ✅ 首字母小写
- ✅ 不超过 50 字符
- ✅ 不以句号结尾
- ✅ 使用英文

**好的示例**:

```
feat: add phonetic fallback mechanism
fix: resolve CORS error in Youdao provider
docs: update contributing guidelines
```

**不好的示例**:

```
Added new feature.  // ❌ 过去式
Fix bug  // ❌ 不明确
feat: This commit adds a new translation provider with support for multiple languages and automatic fallback  // ❌ 太长
```

### Body 正文 (可选)

- 详细说明 **为什么** 做这个改动
- 说明实现细节 (如果复杂)
- 每行不超过 72 字符

### Footer 页脚 (可选)

- 引用相关 Issue: `Closes #123` 或 `Fixes #456`
- 标注破坏性变更: `BREAKING CHANGE: ...`

---

## Pull Request 模板

创建 PR 时，请使用以下模板：

```markdown
## 变更说明

简要描述这个 PR 做了什么。

## 变更类型

- [ ] Bug 修复
- [ ] 新功能
- [ ] 性能优化
- [ ] 重构
- [ ] 文档更新
- [ ] 其他 (请说明):

## 测试

描述如何测试这个变更：

- [ ] 在 Chrome 中手动测试
- [ ] 添加了单元测试
- [ ] 更新了现有测试

## 测试步骤

1. 加载扩展到 Chrome
2. 打开测试页面 `test-xxx.html`
3. 执行 xxx 操作
4. 验证 xxx 结果

## 截图 (如果有 UI 变更)

粘贴截图或 GIF

## 相关 Issue

Closes #xxx

## Checklist

- [ ] 代码遵循项目规范
- [ ] 添加了必要的注释
- [ ] 更新了相关文档
- [ ] 通过了所有测试
- [ ] Commit 消息遵循规范
```

---

## 测试指南

### 手动测试

1. **基本翻译功能**

   - 选中文本 → 翻译 → 验证结果正确性
   - 测试不同语言对 (中→英、英→中、日→英)
   - 测试长文本和短文本

2. **提供商切换**

   - 切换到不同提供商
   - 验证翻译结果变化
   - 测试缓存清除逻辑

3. **标注功能**

   - 添加标注 → 刷新页面 → 验证标注保留
   - 测试删除标注
   - 测试导出/导入标注数据

4. **词汇模式**

   - 启用词汇模式 → 打开网页 → 验证自动标注
   - 测试中断扫描功能
   - 测试不同词库

5. **边界情况**

   - 测试空文本
   - 测试特殊字符 (emoji、标点符号)
   - 测试超长文本 (>1000 字符)
   - 测试 API 失败场景

### 单元测试 (未来)

计划使用 Jest 进行单元测试：

```javascript
// tests/translation-service.test.js
describe('TranslationService', () => {
  test('should cache translation results', async () => {
    const service = new TranslationService();
    const result1 = await service.translate('hello', 'zh-CN');
    const result2 = await service.translate('hello', 'zh-CN');

    expect(result1).toEqual(result2);
    expect(service.cache.size).toBe(1);
  });
});
```

### 集成测试

使用测试页面 `test/translation-test.html`:

1. 打开测试页面
2. 点击 "Run All Tests"
3. 验证所有测试通过

---

## 文档要求

### 更新文档

代码变更时，同步更新文档：

| 变更类型 | 需要更新的文档 |
|---------|--------------|
| 新增提供商 | `/development/providers.md`<br/>`/api/providers/xxx.md`<br/>`/recipes/add-new-provider.md` |
| 新增 API | `/api/xxx.md` |
| 修改设置结构 | `/development/settings-management.md`<br/>`/guide/quick-start.md` |
| 新增功能 | `/guide/xxx.md`<br/>`/README.md` |
| 修改架构 | `/development/architecture.md`<br/>`/development/core-concepts.md` |

### 文档规范

- ✅ 使用中文撰写
- ✅ 包含代码示例
- ✅ 添加 Mermaid 图表 (如果适用)
- ✅ 使用 VitePress 的特殊语法 (`::: tip`, `::: warning`)
- ✅ 提供跨文档链接

---

## 代码审查

### 审查清单 (Reviewer)

审查 PR 时，检查以下内容：

- [ ] **代码质量**
  - [ ] 遵循代码规范
  - [ ] 命名清晰
  - [ ] 逻辑简洁
  - [ ] 无冗余代码

- [ ] **功能正确性**
  - [ ] 实现了 PR 描述的功能
  - [ ] 边界情况处理
  - [ ] 错误处理完善

- [ ] **性能**
  - [ ] 无不必要的 API 调用
  - [ ] 使用缓存 (如适用)
  - [ ] 无内存泄漏

- [ ] **兼容性**
  - [ ] Chrome Manifest V3 兼容
  - [ ] 不破坏现有功能
  - [ ] 向后兼容设置结构

- [ ] **文档**
  - [ ] 注释完整
  - [ ] 文档已更新
  - [ ] README 更新 (如需要)

- [ ] **测试**
  - [ ] 提供测试步骤
  - [ ] 手动测试通过
  - [ ] 单元测试 (如适用)

### 反馈方式

- ✅ 提出建设性意见
- ✅ 解释 "为什么" 需要修改
- ✅ 提供示例代码
- ✅ 使用 GitHub Review 功能
- ❌ 避免主观批评

---

## 发布流程

### 版本号规则

遵循 [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.2.3
│ │ │
│ │ └─ Patch: Bug 修复
│ └─── Minor: 新功能 (向后兼容)
└───── Major: 重大变更 (破坏性变更)
```

### 发布步骤 (Maintainers)

1. **更新版本号**

```bash
# manifest.json
{
  "version": "1.3.0"
}
```

2. **更新 CHANGELOG.md**

```markdown
## [1.3.0] - 2024-01-15

### Added
- Bing Translator provider
- Dark mode support

### Fixed
- Cache invalidation issue
- CORS error in Youdao provider
```

3. **创建 Git Tag**

```bash
git tag -a v1.3.0 -m "Release v1.3.0"
git push origin v1.3.0
```

4. **创建 GitHub Release**

   - 访问 Releases 页面
   - 点击 "Draft a new release"
   - 选择 Tag: `v1.3.0`
   - 标题: `v1.3.0 - 2024-01-15`
   - 描述: 从 CHANGELOG.md 复制
   - 附件: 上传 ZIP 文件

5. **发布到 Chrome Web Store** (未来)

---

## 问题反馈

### Bug 报告

使用 [Bug Report 模板](https://github.com/your-username/annotate-translate/issues/new?template=bug_report.md)：

- **描述**: 简要描述 Bug
- **复现步骤**: 详细的复现步骤
- **预期行为**: 应该发生什么
- **实际行为**: 实际发生了什么
- **截图**: 如果有 UI 问题
- **环境**:
  - Chrome 版本
  - 扩展版本
  - 操作系统

### 功能请求

使用 [Feature Request 模板](https://github.com/your-username/annotate-translate/issues/new?template=feature_request.md)：

- **问题**: 描述当前的痛点
- **解决方案**: 建议的解决方案
- **替代方案**: 其他可能的方案
- **使用场景**: 详细描述使用场景

---

## 常见问题

### 如何调试扩展?

参考 [开发指南](/development/getting-started#调试) 的调试章节。

### 如何添加新的翻译提供商?

参考 [添加新提供商教程](/recipes/add-new-provider)。

### 如何贡献文档?

文档使用 VitePress 构建，位于 `/docs` 目录。参考 [VitePress 文档](https://vitepress.dev/)。

### 我的 PR 多久会被审查?

通常在 2-3 个工作日内会有回复。

### 如何成为 Maintainer?

持续贡献高质量代码和文档，展现出对项目的深刻理解和责任心。

---

## 感谢贡献者

感谢所有为 Annotate Translate 做出贡献的开发者！

查看 [贡献者列表](https://github.com/your-username/annotate-translate/graphs/contributors)。

---

## 联系方式

- **GitHub Issues**: [提交 Issue](https://github.com/your-username/annotate-translate/issues)
- **Discussions**: [参与讨论](https://github.com/your-username/annotate-translate/discussions)
- **Email**: your-email@example.com

---

## 许可证

贡献代码即表示您同意将代码以 [MIT License](https://opensource.org/licenses/MIT) 发布。

---

再次感谢您的贡献！🎉
