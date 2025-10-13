# CSP 错误修复：Lucide 库本地化

## 问题描述

Chrome 扩展的内容安全策略 (CSP) 有两个限制：

### 1. 外部脚本加载被阻止
```
Refused to load the script 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js' 
because it violates the following Content Security Policy directive: "script-src 'self'..."
```

### 2. 内联脚本被阻止
```
Refused to execute inline script because it violates the following Content Security Policy directive: 
"script-src 'self'". Either the 'unsafe-inline' keyword, a hash, or a nonce is required.
```

Chrome 扩展默认禁止：
- 从外部 CDN 加载脚本
- 使用内联 `<script>` 标签

## 解决方案

### 1. 下载 Lucide 库到本地
```bash
curl -L -o lucide.min.js https://unpkg.com/lucide@latest/dist/umd/lucide.min.js
```

文件大小：约 366KB

### 2. 创建外部初始化脚本 `lucide-init.js`

将内联脚本移到外部文件：

```javascript
// lucide-init.js
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLucide);
} else {
  initLucide();
}

function initLucide() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
    console.log('[Lucide] Icons initialized in HTML page');
  }
}
```

### 3. 修改 HTML 页面（popup.html, options.html）

**修改前：**
```html
<script src="https://unpkg.com/lucide@latest"></script>
...
<script>
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
</script>
```

**修改后：**
```html
<script src="lucide.min.js"></script>
...
<script src="lucide-init.js"></script>
```

### 4. 修改内容脚本 `lucide-loader.js`

**修改前：**
```javascript
script.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
```

**修改后：**
```javascript
script.src = chrome.runtime.getURL('lucide.min.js');
```

### 5. 更新 `manifest.json`

添加 `web_accessible_resources` 配置：

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

这允许内容脚本访问扩展包中的 `lucide.min.js` 文件。

## 文件更改清单

✅ **lucide.min.js** - 新增本地库文件（366KB）  
✅ **lucide-init.js** - 新增外部初始化脚本  
✅ **lucide-loader.js** - 修改为从扩展包加载  
✅ **popup.html** - 改用本地库和外部脚本  
✅ **options.html** - 改用本地库和外部脚本  
✅ **manifest.json** - 添加 web_accessible_resources 配置

## 工作原理

### HTML 页面（popup.html, options.html）
1. 直接引用本地 `lucide.min.js`
2. 使用外部 `lucide-init.js` 初始化图标
3. 避免内联脚本，符合 CSP 要求

### 内容脚本（content.js）
1. **lucide-loader.js** 运行在内容脚本上下文
2. 使用 `chrome.runtime.getURL('lucide.min.js')` 获取扩展内文件的 URL
3. 动态创建 `<script>` 标签注入到页面中
4. manifest.json 的 `web_accessible_resources` 允许页面访问该文件

## 测试验证

### 1. HTML 页面测试
1. 重新加载扩展
2. 点击扩展图标打开 popup
3. 查看控制台（F12）：
   ```
   [Lucide] Icons initialized in HTML page
   ```
4. 验证设置图标正常显示
5. 打开 options 页面，验证图标正常

### 2. 内容脚本测试
1. 访问任意网页
2. 查看控制台输出：
   ```
   [Lucide] Loaded successfully from extension
   [Lucide] Icons initialized
   ```
3. 选中文本翻译，验证音频按钮图标正常显示

## 注意事项

- ✅ 所有页面都使用本地 Lucide 库
- ✅ 所有内联脚本都已移到外部文件
- ✅ 完全符合 Chrome 扩展 CSP 要求
- 📦 扩展包大小增加约 366KB
- 🔄 如需更新 Lucide，重新下载并替换 `lucide.min.js`

## Chrome 扩展 CSP 规则

Manifest V3 默认 CSP：
```
script-src 'self' 'wasm-unsafe-eval';
object-src 'self'
```

**限制：**
- ❌ 不能从外部 CDN 加载脚本
- ❌ 不能使用内联 `<script>` 标签
- ❌ 不能使用 `eval()` 和相关函数
- ✅ 只能加载扩展包内的脚本文件

**解决方案：**
- 将所有第三方库下载到本地
- 将所有内联脚本移到外部 .js 文件

## 相关文件

- `lucide.min.js` - Lucide 库文件（366KB）
- `lucide-init.js` - HTML 页面初始化脚本
- `lucide-loader.js` - 内容脚本动态加载器
- `manifest.json` - 扩展配置（web_accessible_resources）
- `popup.html` - 使用本地库和外部脚本
- `options.html` - 使用本地库和外部脚本
- `content.js` - 使用音频按钮图标
- `translation-ui.js` - 使用音频按钮图标

## 参考资料

- [Chrome Extensions - Content Security Policy](https://developer.chrome.com/docs/extensions/mv3/intro/mv3-migration/#content-security-policy)
- [Lucide Icons Documentation](https://lucide.dev/)

