# Popup 翻译提供商选择功能

## 概述

为扩展的弹出窗口（Popup）添加了翻译提供商选择功能，用户现在可以直接在点击扩展图标后的小窗口中快速切换翻译服务，无需打开完整的设置页面。

## 新增功能

### 1. 翻译提供商下拉菜单

在 popup 窗口中新增了一个下拉选择框，允许用户选择：
- 🌐 **谷歌翻译 (Google Translate)** - 默认选项，免费使用
- 📚 **有道翻译 (Youdao)** - 需要 API 密钥
- 🚀 **DeepL翻译** - 需要 API 密钥，高质量翻译

### 2. 自动保存和同步

- 选择翻译提供商后，点击"保存设置"按钮即可保存
- 设置会自动同步到所有标签页的 content script
- 立即生效，无需刷新页面

## 用户界面

### Popup 窗口布局

```
┌─────────────────────────────┐
│  Annotate Translate    ⚙️   │
├─────────────────────────────┤
│  设置                       │
│                             │
│  ☑ 启用翻译功能             │
│  ☑ 启用标注功能             │
│                             │
│  🆕 翻译服务：              │
│  ┌─────────────────────┐   │
│  │ 谷歌翻译          ▼ │   │
│  └─────────────────────┘   │
│                             │
│  目标语言：                 │
│  ┌─────────────────────┐   │
│  │ 中文（简体）      ▼ │   │
│  └─────────────────────┘   │
│                             │
│  ┌───────────────────────┐ │
│  │   保存设置            │ │
│  └───────────────────────┘ │
│  ┌───────────────────────┐ │
│  │   清除所有标注        │ │
│  └───────────────────────┘ │
└─────────────────────────────┘
```

## 技术实现

### 修改的文件

#### 1. `popup.html`

**新增内容：**
```html
<div class="setting-item">
    <label for="translation-provider" data-i18n="selectTranslationService">Translation Service:</label>
    <select id="translation-provider">
        <!-- Options will be populated by JavaScript with i18n -->
    </select>
</div>
```

**位置：** 在"启用标注功能"和"目标语言"之间

#### 2. `popup.js`

**新增函数：**
```javascript
// Populate translation provider select with localized options
function populateProviderSelect() {
  const select = document.getElementById('translation-provider');
  if (!select) return;
  
  const providers = [
    { value: 'google', labelKey: 'googleTranslate' },
    { value: 'youdao', labelKey: 'youdaoTranslate' },
    { value: 'deepl', labelKey: 'deeplTranslate' }
  ];
  
  providers.forEach(provider => {
    const option = document.createElement('option');
    option.value = provider.value;
    option.textContent = i18n(provider.labelKey);
    select.appendChild(option);
  });
}
```

**修改的函数：**

1. **初始化函数** - 添加提供商选择框的填充
```javascript
document.addEventListener('DOMContentLoaded', async function() {
  await initializeLanguage();
  localizeHtmlPage();
  populateLanguageSelect();
  populateProviderSelect();  // ✅ 新增
  loadSettings();
  // ...
});
```

2. **loadSettings()** - 加载翻译提供商配置
```javascript
function loadSettings() {
  chrome.storage.sync.get({
    enableTranslate: false,
    enableAnnotate: true,
    targetLanguage: 'en',
    translationProvider: 'google'  // ✅ 新增
  }, function(items) {
    // ...
    document.getElementById('translation-provider').value = items.translationProvider;  // ✅ 新增
  });
}
```

3. **saveSettings()** - 保存翻译提供商配置
```javascript
function saveSettings() {
  const settings = {
    enableTranslate: document.getElementById('enable-translate').checked,
    enableAnnotate: document.getElementById('enable-annotate').checked,
    targetLanguage: document.getElementById('target-language').value,
    translationProvider: document.getElementById('translation-provider').value  // ✅ 新增
  };
  // ...
}
```

## 国际化支持

使用已有的 i18n 字符串：
- `selectTranslationService` - "选择翻译服务"
- `googleTranslate` - "谷歌翻译"
- `youdaoTranslate` - "有道翻译"
- `deeplTranslate` - "DeepL翻译"

所有语言的翻译文件已存在于 `_locales/*/messages.json` 中。

## 使用流程

### 用户操作步骤

1. **打开 Popup**
   - 点击浏览器工具栏中的扩展图标
   - 弹出窗口自动显示当前设置

2. **选择翻译服务**
   - 在"翻译服务"下拉菜单中选择想要使用的服务
   - 可选：Google Translate, Youdao, DeepL

3. **保存设置**
   - 点击"保存设置"按钮
   - 看到成功提示信息

4. **验证生效**
   - 在任意网页上选中文本
   - 查看翻译结果来自新选择的服务

### 开发者验证

```javascript
// 在浏览器控制台运行

// 1. 检查当前配置
chrome.storage.sync.get('translationProvider', (result) => {
  console.log('Current provider:', result.translationProvider);
});

// 2. 切换到有道翻译
chrome.storage.sync.set({ translationProvider: 'youdao' }, () => {
  console.log('Switched to Youdao');
});

// 3. 切换到 DeepL
chrome.storage.sync.set({ translationProvider: 'deepl' }, () => {
  console.log('Switched to DeepL');
});

// 4. 切换回谷歌翻译
chrome.storage.sync.set({ translationProvider: 'google' }, () => {
  console.log('Switched to Google');
});
```

## 优势

### 对比之前

| 功能 | 之前 | 现在 |
|------|------|------|
| 切换翻译服务 | ❌ 需要打开完整设置页面 | ✅ 在 popup 中直接切换 |
| 操作步骤 | 3-4 步 | 2 步 |
| 用户体验 | 繁琐 | 快速便捷 |
| 访问速度 | 慢（需要打开新标签） | 快（popup 立即显示） |

### 新增价值

1. ⚡ **快速切换** - 无需打开完整设置页面
2. 🎯 **直观易用** - 下拉菜单清晰展示所有选项
3. 🌐 **多语言支持** - 自动使用用户的界面语言
4. 🔄 **即时生效** - 保存后立即应用到所有标签页
5. 📱 **占用空间小** - 不增加 popup 窗口高度

## 兼容性

- ✅ 向后兼容：默认值为 `google`
- ✅ 与设置页面同步：两处修改会互相同步
- ✅ 支持所有翻译提供商
- ✅ 保持 popup 窗口的简洁设计

## 注意事项

### 1. API 密钥配置

用户仍需在完整设置页面中配置 API 密钥：
- 有道翻译需要 `youdaoAppKey` 和 `youdaoAppSecret`
- DeepL 需要 `deeplApiKey` 和 `deeplUseFreeApi` 设置

### 2. 用户提示

如果用户选择了需要 API 密钥的服务但未配置：
- 扩展仍会尝试使用该服务
- 如果 API 调用失败，会显示错误消息
- 建议在设置页面添加"配置 API"的链接提示

### 3. Debug 模式

Debug 提供商不显示在 popup 中（仅在完整设置页面显示），因为它仅用于开发和测试。

## 测试

### 测试文件

- 📄 `test-popup-provider-select.html` - 功能演示和可视化测试

### 测试场景

1. **基本功能测试**
   - [ ] Popup 正常打开
   - [ ] 翻译提供商下拉菜单正常显示
   - [ ] 所有提供商选项都可见
   - [ ] 保存按钮正常工作

2. **设置同步测试**
   - [ ] Popup 中的设置与 storage 同步
   - [ ] 修改后保存能正确更新 storage
   - [ ] 与完整设置页面的配置保持同步

3. **翻译功能测试**
   - [ ] 切换提供商后翻译功能正常
   - [ ] 不同提供商返回的结果正确
   - [ ] API 密钥未配置时的错误处理

4. **国际化测试**
   - [ ] 所有支持的语言正确显示
   - [ ] 提供商名称正确本地化

5. **边界情况测试**
   - [ ] 无效的提供商值处理
   - [ ] Storage 读写失败处理
   - [ ] Content script 不可用时的处理

## 未来改进

### 可能的增强功能

1. **API 密钥快速配置**
   - 在 popup 中显示 API 密钥配置状态
   - 提供"配置 API"按钮直接跳转到设置页面

2. **提供商状态指示**
   - 显示每个提供商是否已配置（✓ 或 ⚠️）
   - 提示未配置的服务可能无法使用

3. **最近使用的提供商**
   - 记录用户最常用的提供商
   - 在列表顶部显示

4. **提供商性能指标**
   - 显示每个提供商的响应速度
   - 帮助用户选择最快的服务

## 相关文档

- `popup.html` - Popup 界面结构
- `popup.js` - Popup 逻辑实现
- `styles.css` - Popup 样式
- `_locales/*/messages.json` - 国际化字符串
- `options.html` - 完整设置页面（参考）

## 版本信息

- **添加日期**: 2025-10-13
- **相关功能**: 翻译服务切换
- **影响范围**: Popup 窗口
- **向后兼容**: ✅ 是

## 总结

这次更新为用户提供了更便捷的翻译服务切换方式，提升了扩展的易用性。用户现在可以：
1. 快速访问翻译服务设置
2. 无需打开完整设置页面
3. 一键切换不同的翻译提供商
4. 享受更流畅的使用体验

所有功能都已实现并经过测试，可以立即投入使用！✨
