# Provider Logo 快速参考

## 🎯 快速开始

### 测试页面
```bash
# 在浏览器中打开测试页面查看效果
open test-provider-logos.html
```

## 📁 Logo 文件位置

```
icons/
├── icon_logo_google.svg   # Google Translate logo
├── icon_logo_youdao.svg   # 有道翻译 logo
└── icon_logo_deepl.svg    # DeepL logo
```

## 💻 使用方法

### 1. 在 JavaScript 中获取 logo 路径

```javascript
// 翻译服务 provider 映射表
const logoMap = {
  'google': 'icons/icon_logo_google.svg',
  'youdao': 'icons/icon_logo_youdao.svg',
  'deepl': 'icons/icon_logo_deepl.svg'
};

// 在扩展中使用
const logoUrl = chrome.runtime.getURL(logoMap['google']);
```

### 2. 在 HTML 中直接使用

```html
<!-- Google -->
<img src="icons/icon_logo_google.svg" alt="Google" class="provider-logo">

<!-- Youdao -->
<img src="icons/icon_logo_youdao.svg" alt="Youdao" class="provider-logo">

<!-- DeepL -->
<img src="icons/icon_logo_deepl.svg" alt="DeepL" class="provider-logo">
```

### 3. 应用对应的 CSS 样式

```css
/* Translation Footer */
.provider-logo {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

/* Popup Select */
.provider-select-icon {
  width: 20px;
  height: 20px;
}

/* Options Radio */
.provider-option-logo {
  width: 20px;
  height: 20px;
}
```

## 🎨 样式类名

| 场景 | 类名 | 尺寸 |
|------|------|------|
| 翻译结果页脚 | `.provider-logo` | 16x16px |
| Popup 选择框图标 | `.provider-select-icon` | 20x20px |
| Popup 选项 logo | `.provider-option-logo` | 18x18px |
| Options 单选 logo | `.provider-option-logo` | 20x20px |

## 📋 修改的文件清单

- ✅ `translation-ui.js` - 翻译结果 footer
- ✅ `translation-ui.css` - provider logo 样式
- ✅ `popup.html` - 弹出框结构
- ✅ `popup.js` - 选择器逻辑
- ✅ `styles.css` - popup 样式
- ✅ `options.html` - 设置页面

## 🔍 代码示例

### 动态创建带 logo 的 provider 信息

```javascript
// 在 translation-ui.js 的 createFooter 方法中
const provider = document.createElement('span');
provider.className = 'provider-info';

const providerName = result.provider ? result.provider.toLowerCase() : 'unknown';
const logoMap = {
  'google': 'icons/icon_logo_google.svg',
  'youdao': 'icons/icon_logo_youdao.svg',
  'deepl': 'icons/icon_logo_deepl.svg'
};

if (logoMap[providerName]) {
  const logo = document.createElement('img');
  logo.className = 'provider-logo';
  logo.src = chrome.runtime.getURL(logoMap[providerName]);
  logo.alt = result.provider || 'Unknown';
  provider.appendChild(logo);
}

const providerText = document.createElement('span');
providerText.textContent = `Powered by ${result.provider}`;
provider.appendChild(providerText);
```

### 更新选择器图标

```javascript
// 在 popup.js 中
function updateProviderIcon() {
  const select = document.getElementById('translation-provider');
  const icon = document.getElementById('provider-select-icon');
  
  const selectedOption = select.options[select.selectedIndex];
  const logoPath = selectedOption.dataset.logo;
  
  if (logoPath) {
    icon.src = chrome.runtime.getURL(logoPath);
    icon.alt = selectedOption.textContent;
    icon.style.display = 'block';
  }
}
```

## ✅ 检查清单

部署前检查：

- [ ] Logo 文件存在于 `icons/` 目录
- [ ] 所有三个 provider 的 logo 都能显示
- [ ] Select 切换时图标正确更新
- [ ] 翻译结果 footer 显示正确
- [ ] Options 页面显示正确
- [ ] 测试页面全部通过

## 📚 相关文档

- 详细说明: `PROVIDER_LOGO_UPDATE.md`
- 测试页面: `test-provider-logos.html`
