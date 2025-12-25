# Annotate Translate

一个功能丰富的 Chrome 浏览器扩展，支持网页文本翻译、标注和词汇学习。

## 核心功能

### 🌍 文本翻译
- **选中翻译**：选择任意文本即可翻译
- **多翻译源**：支持 Google、有道、DeepL、AI 翻译
- **丰富结果**：音频发音、音标、词义、例句

### 📝 文本标注
- **即时标注**：选中文本后点击标注，自动添加音标和翻译
- **音频播放**：点击标注中的 🔊 按钮播放发音

### 📚 词汇模式
- **批量标注**：自动识别页面中的英文单词并标注
- **词库过滤**：支持 CET-4/6、考研、GRE、TOEFL、雅思等词库
- **自定义标签**：按难度、主题自定义词汇筛选

## 翻译提供商

| 提供商 | 配置要求 | 特色功能 |
|--------|---------|---------|
| **Google** | 无需配置 | 音标、词义、例句、音频 |
| **有道** | 需要 API Key | 中文优化、音频播放 |
| **DeepL** | 需要 API Key | 高质量翻译 |
| **AI 翻译** | 需要 API Key | 支持 OpenAI 兼容接口、上下文翻译 |

### API Key 配置

**有道翻译**：
1. 访问 [有道智云](https://ai.youdao.com/)
2. 注册并创建应用
3. 获取 AppKey 和 AppSecret
4. 在扩展设置中填入

**DeepL**：
1. 访问 [DeepL API](https://www.deepl.com/pro-api)
2. 注册并获取 API Key
3. 在扩展设置中填入

**AI 翻译**：
1. 支持任何 OpenAI 兼容的 API（OpenAI、Claude、Gemini 等）
2. 配置 API Key、Base URL、模型名称
3. 支持自定义提示词模板

## 安装

### 从源码安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/zkywalker/annotate-translate.git
   cd annotate-translate
   ```

2. 打开 Chrome 浏览器，访问 `chrome://extensions/`

3. 开启右上角的"开发者模式"

4. 点击"加载已解压的扩展程序"

5. 选择 `annotate-translate` 目录

## 使用方法

### 翻译文本

1. 在网页上选中任意文本
2. 点击浮动的"翻译"按钮（或右键菜单选择"翻译"）
3. 查看翻译结果：
   - 🔊 点击播放按钮听发音
   - 📖 查看音标（美/英音）
   - 📚 查看词义和词性
   - 📝 查看例句

### 标注文本

1. 选中文本
2. 点击"标注"按钮（或右键菜单选择"标注"）
3. 文本上方会显示音标和翻译
4. 点击 🔊 按钮播放发音

### 词汇模式

1. 点击扩展图标，进入弹窗
2. 开启"词汇模式"开关
3. 选择词库标签（如 CET-4、考研等）
4. 点击"开始标注"

## 项目结构

```
annotate-translate/
├── manifest.json              # 扩展配置
├── src/
│   ├── background/            # 后台脚本
│   ├── content/               # 内容脚本
│   │   ├── content.js         # 主逻辑
│   │   ├── annotation-scanner.js  # 词汇扫描器
│   │   └── translation-ui.js  # 翻译UI
│   ├── popup/                 # 弹窗页面
│   ├── options/               # 设置页面
│   ├── services/              # 翻译服务
│   │   ├── translation-service.js
│   │   ├── ai-translation-service.js
│   │   └── vocabulary-service.js
│   ├── providers/             # AI 提供商
│   ├── utils/                 # 工具函数
│   └── lib/                   # 第三方库
├── assets/                    # 静态资源
├── _locales/                  # 国际化文件
│   ├── en/                    # 英文
│   ├── zh_CN/                 # 简体中文
│   └── ...                    # 其他语言
└── data/                      # 词汇数据
    └── ecdict/                # ECDICT 词典数据
```

## 技术特性

- **Manifest V3**：使用最新的扩展规范
- **纯原生 JS**：无需构建工具，直接加载
- **Provider 模式**：可插拔的翻译提供商架构
- **本地优先**：数据存储在本地和 Chrome 账号同步
- **国际化**：支持中文、英文等多语言
- **词库数据**：基于 [ECDICT](https://github.com/skywind3000/ECDICT) 开源词典

## 权限说明

- `activeTab`：与当前网页交互
- `storage`：保存设置和标注数据
- `contextMenus`：右键菜单
- `scripting`：注入内容脚本
- `<all_urls>`：在所有网站上工作

**隐私承诺**：所有数据仅在本地和 Chrome 账号间同步，翻译 API 调用除外。

## 开发

### 调试

- **内容脚本**：在网页上打开 DevTools 查看控制台
- **后台脚本**：访问 `chrome://extensions/`，点击"service worker"
- **弹窗页面**：右键扩展图标 > 检查弹出内容窗口
- **设置页面**：在设置页面右键 > 检查

### 测试文件

- `test-ai-translation.html` - AI 翻译测试
- `translation-test.html` - 翻译功能测试

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件
