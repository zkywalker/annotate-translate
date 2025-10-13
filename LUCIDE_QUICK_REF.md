# Lucide 图标集成 - 快速参考

## 已替换的图标

| 位置 | 之前 | 现在 | 图标名 | 大小 |
|------|------|------|--------|------|
| Popup 设置按钮 | 自定义 SVG | Lucide | `settings` | 20x20 |
| 设置页标题 | ⚙️ emoji | Lucide | `settings` | 28x28 |
| 翻译弹窗发音 | 🔊 emoji | Lucide | `volume-2` | 16x16 |
| 注释发音 | 🔊 emoji | Lucide | `volume-2` | 12x12 |
| 音标设置标题 | 🔊 emoji | 移除 | - | - |

## 样式变化

### 音频按钮（翻译弹窗）
- ❌ 之前：蓝色圆形背景
- ✅ 现在：透明背景，悬停时淡蓝色

### 音频按钮（注释）
- ❌ 之前：无背景
- ✅ 现在：透明背景，悬停时淡蓝色

## 使用方法

### HTML 中使用
```html
<i data-lucide="settings" width="20" height="20"></i>
<i data-lucide="volume-2" width="16" height="16"></i>
```

### JavaScript 中创建
```javascript
const icon = document.createElement('i');
icon.setAttribute('data-lucide', 'volume-2');
icon.setAttribute('width', '16');
icon.setAttribute('height', '16');
element.appendChild(icon);

// 初始化
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
}
```

## 修改的文件

- ✅ popup.html
- ✅ options.html  
- ✅ translation-ui.js
- ✅ translation-ui.css
- ✅ content.js
- ✅ content.css
- ✅ manifest.json
- ✅ lucide-loader.js (新增)

## 常用图标

| 用途 | 图标名 | 示例 |
|------|--------|------|
| 设置 | `settings` | ⚙️ |
| 音量/发音 | `volume-2` | 🔊 |
| 翻译 | `languages` | 🌐 |
| 删除 | `trash-2` | 🗑️ |
| 保存 | `save` | 💾 |
| 检查/成功 | `check-circle` | ✅ |
| 错误 | `alert-circle` | ⚠️ |
| 加载 | `loader` | ⏳ |

## 图标颜色

### 默认状态
```css
color: #5f6368; /* 灰色 */
```

### 悬停状态
```css
background: #e8f0fe; /* 淡蓝色背景 */
color: #1a73e8; /* 蓝色 */
```

### 播放中
```css
color: #1a73e8; /* 蓝色 */
```

### 错误状态
```css
color: #d93025; /* 红色 */
```

## 链接

- 🌐 官网: https://lucide.dev/
- 📦 CDN: https://unpkg.com/lucide@latest
- 🔍 图标搜索: https://lucide.dev/icons/

## 测试命令

```javascript
// 检查 Lucide 是否加载
console.log(typeof lucide !== 'undefined' ? '✅ Lucide loaded' : '❌ Not loaded');

// 重新初始化所有图标
if (typeof lucide !== 'undefined') {
  lucide.createIcons();
  console.log('✅ Icons reinitialized');
}
```

## 优势

✅ 跨平台一致显示  
✅ SVG 矢量，任意缩放  
✅ 统一视觉风格  
✅ 易于定制颜色  
✅ 支持 1000+ 图标  

## 注意事项

⚠️ 需要网络加载 CDN（首次）  
⚠️ 动态创建图标后需调用 `lucide.createIcons()`  
⚠️ Content script 使用动态加载方式  
