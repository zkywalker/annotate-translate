# CSP 修复快速参考

## ✅ 完整解决方案

### 问题
Chrome 扩展 CSP 阻止：
1. 从外部 CDN 加载脚本 ❌
2. 使用内联 `<script>` 标签 ❌

### 解决方案
所有资源本地化 + 外部脚本 ✅

## 📁 文件清单

```
lucide.min.js         # Lucide 库（366KB）
lucide-init.js        # HTML 页面初始化
lucide-loader.js      # 内容脚本加载器
popup.html            # 使用本地库
options.html          # 使用本地库
manifest.json         # web_accessible_resources
```

## 🔧 具体修改

### 1. popup.html & options.html

**修改前：**
```html
<script src="https://unpkg.com/lucide@latest"></script>
...
<script>
  lucide.createIcons();
</script>
```

**修改后：**
```html
<script src="lucide.min.js"></script>
...
<script src="lucide-init.js"></script>
```

### 2. lucide-loader.js

**修改前：**
```javascript
script.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
```

**修改后：**
```javascript
script.src = chrome.runtime.getURL('lucide.min.js');
```

### 3. manifest.json

**添加：**
```json
{
  "web_accessible_resources": [
    {
      "resources": ["lucide.min.js"],
      "matches": ["<all_urls>"]
    }
  ]
}
```

## ✨ 新文件：lucide-init.js

```javascript
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLucide);
} else {
  initLucide();
}

function initLucide() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
  }
}
```

## 🧪 测试

### HTML 页面
1. 打开 popup/options
2. 控制台应显示：`[Lucide] Icons initialized in HTML page`
3. 图标正常显示

### 内容脚本
1. 访问任意网页
2. 控制台应显示：`[Lucide] Loaded successfully from extension`
3. 翻译时音频按钮图标正常

## ⚠️ 无 CSP 错误

重新加载扩展后，应该**完全没有** CSP 错误：
- ✅ 无 "Refused to load" 错误
- ✅ 无 "Refused to execute inline script" 错误
- ✅ 所有图标正常显示

## 📊 影响

- 扩展包大小：+366KB
- 页面加载：无外部请求，更快
- 兼容性：完全符合 Manifest V3 CSP

## 🔄 更新 Lucide

```bash
curl -L -o lucide.min.js https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
```

## 📚 相关文档

- `CSP_FIX.md` - 详细修复指南
- `LUCIDE_ICONS_INTEGRATION.md` - Lucide 集成文档
