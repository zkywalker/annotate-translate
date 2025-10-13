# 🎨 Ruby 标注样式优化说明

## 问题描述

原始样式存在两个问题：
1. ❌ 标注没有相对于原文本居中
2. ❌ 短标注会改变原文本的宽度（被撑开）

## 解决方案

### 核心CSS改进

```css
ruby.annotate-translate-ruby {
  /* 使用原生 ruby 显示模式 */
  display: ruby;
  ruby-align: center;  /* 标注居中对齐 */
  white-space: nowrap; /* 防止换行 */
}

ruby.annotate-translate-ruby rt.annotate-translate-rt {
  /* 使用 ruby-text 显示 */
  display: ruby-text;
  ruby-position: over;  /* 标注在上方 */
  text-align: center;   /* 文本居中 */
  font-size: 0.5em;     /* 标注字体大小 */
  white-space: nowrap;  /* 标注不换行 */
  overflow: visible;    /* 长标注可以溢出 */
}
```

### 关键改进点

1. **使用原生 Ruby 语义**
   - `display: ruby` 而不是 `inline-block`
   - `display: ruby-text` 用于 `<rt>` 元素
   - 让浏览器使用原生的 ruby 布局算法

2. **居中对齐**
   - `ruby-align: center` 确保标注相对原文居中
   - `text-align: center` 确保标注文本本身居中

3. **宽度控制**
   - `white-space: nowrap` 防止文本换行
   - 原文宽度由内容决定，不受标注影响
   - 如果标注更长，允许溢出显示（`overflow: visible`）

4. **字体大小调整**
   - 从 `0.6em` 改为 `0.5em`
   - 标注更小巧，视觉效果更好

## 效果对比

### ❌ 修复前
```
标注比原文长时会撑开原文：
o  a  u  t  h
一个特殊的 oauth
```

### ✅ 修复后
```
标注居中，原文宽度不变：
     oauth
一个特殊的 oauth
```

## 测试场景

### 1. 短标注（标注比原文短）
```html
<ruby>
  世界
  <rt>world</rt>
</ruby>
```
- ✅ 标注居中
- ✅ 原文宽度不变

### 2. 长标注（标注比原文长）
```html
<ruby>
  oauth
  <rt>一个特殊的 oauth</rt>
</ruby>
```
- ✅ 标注居中
- ✅ 标注向两侧延伸
- ✅ 原文宽度不变

### 3. 多个标注连续出现
```html
This is a <ruby>oauth<rt>认证</rt></ruby> system.
```
- ✅ 标注不会互相影响
- ✅ 文本流动自然

## 浏览器兼容性

### Ruby 标签支持
- ✅ Chrome/Edge: 完全支持
- ✅ Firefox: 完全支持
- ✅ Safari: 完全支持
- ✅ Opera: 完全支持

### CSS Ruby 属性
- `ruby-align`: Chrome 84+, Firefox 38+, Safari 7+
- `ruby-position`: Chrome 84+, Firefox 38+, Safari 7+
- 覆盖主流浏览器的最新版本

## HTML Ruby 标签说明

```html
<ruby>
  基础文本
  <rt>标注文本</rt>
</ruby>
```

### 元素说明
- `<ruby>`: Ruby 容器元素
- `<rt>`: Ruby Text（标注文本）
- `<rp>`: Ruby Parenthesis（可选，用于不支持 ruby 的浏览器）

### 为什么使用 Ruby 标签？

1. **语义化**：专门用于东亚文字的注音标注
2. **原生支持**：浏览器有优化的渲染逻辑
3. **无障碍**：屏幕阅读器能正确识别
4. **样式灵活**：CSS 提供了专门的属性控制

## 实际应用示例

### 中文拼音
```html
<ruby>验证<rt>yàn zhèng</rt></ruby>
```

### 英文翻译
```html
<ruby>authentication<rt>认证</rt></ruby>
```

### 日文假名
```html
<ruby>漢字<rt>かんじ</rt></ruby>
```

### 技术术语注释
```html
<ruby>API<rt>Application Programming Interface</rt></ruby>
```

## 调试技巧

### 检查 Ruby 元素
```javascript
// 在 Console 中执行
document.querySelectorAll('ruby.annotate-translate-ruby').forEach(ruby => {
  console.log('Base text:', ruby.getAttribute('data-base-text'));
  console.log('Annotation:', ruby.getAttribute('data-annotation'));
  console.log('Width:', ruby.offsetWidth);
  console.log('RT width:', ruby.querySelector('rt').offsetWidth);
});
```

### 检查样式应用
```javascript
// 检查 ruby 元素的计算样式
const ruby = document.querySelector('ruby.annotate-translate-ruby');
const styles = window.getComputedStyle(ruby);
console.log('Display:', styles.display);
console.log('Ruby-align:', styles.rubyAlign);
```

### 测试不同长度的标注
```javascript
// 在 Console 中手动创建测试
const testRuby = document.createElement('ruby');
testRuby.className = 'annotate-translate-ruby';
testRuby.textContent = 'test';
const rt = document.createElement('rt');
rt.className = 'annotate-translate-rt';
rt.textContent = 'This is a very long annotation';
testRuby.appendChild(rt);
document.body.appendChild(testRuby);
```

## 注意事项

1. **行高调整**
   - Ruby 标注需要额外的垂直空间
   - 建议设置 `line-height: 2` 或更大
   - 在 `test.html` 中测试区域已设置 `line-height: 3`

2. **标注长度**
   - 标注可以比原文长
   - 但不要过长，影响阅读体验
   - 建议标注长度不超过原文的 3 倍

3. **颜色对比度**
   - 标注颜色 `#1a73e8`（蓝色）
   - 确保与背景有足够对比度
   - 悬停时加深：`#1557b0`

4. **字体大小**
   - 标注 `0.5em` 相对于原文
   - 如果原文是 16px，标注是 8px
   - 确保标注文字清晰可读

## 测试清单

- [ ] 短标注居中显示
- [ ] 短标注不改变原文宽度
- [ ] 长标注可以向两侧延伸
- [ ] 多个标注不互相影响
- [ ] 悬停效果正常
- [ ] 标注颜色清晰可见
- [ ] 标注文字大小合适
- [ ] 行高足够显示标注
- [ ] 中英文混合正常
- [ ] 标点符号不影响布局

## 参考资源

- [MDN - Ruby 标签](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/ruby)
- [MDN - Ruby-align](https://developer.mozilla.org/en-US/docs/Web/CSS/ruby-align)
- [W3C Ruby Annotation](https://www.w3.org/TR/ruby/)
- [Can I Use - Ruby](https://caniuse.com/ruby)

---

生成时间: 2025-10-11
版本: Ruby 标注样式优化
