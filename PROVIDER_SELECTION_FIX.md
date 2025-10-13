# 翻译提供商选择换行问题修复

## 问题描述

在 `options.html` 页面中，翻译提供商选择的三个单选按钮出现文字换行问题：
- "谷歌翻译"、"有道翻译"、"DeepL翻译" 等文字在按钮内换行
- 视觉不整齐，影响用户体验

## 根本原因

原 `.radio-item` 样式设置的 `min-width: 150px` 太小，无法容纳：
- 图标宽度：20px
- 图标与文字间距：8px
- 中文文字宽度：约 80-100px
- 单选框宽度：约 20px
- 左右内边距：24px (12px × 2)
- **总计需要：约 152-172px**

150px 的最小宽度刚好临界，导致在某些情况下文字换行。

## 修复方案

### 1. 增加最小宽度

```css
/* 修复前 */
.radio-item {
  min-width: 150px;
}

/* 修复后 */
.radio-item {
  min-width: 200px;  /* 增加到 200px，留有充足空间 */
}
```

### 2. 优化内边距

```css
/* 修复前 */
.radio-item {
  padding: 12px;
}

/* 修复后 */
.radio-item {
  padding: 12px 16px;  /* 增加水平内边距 */
}
```

### 3. 防止文字换行

```css
/* 新增属性 */
.radio-item {
  white-space: nowrap;  /* 强制单行显示 */
}

.provider-option-label {
  white-space: nowrap;  /* 确保标签内容不换行 */
}
```

### 4. 防止图标压缩（建议）

```css
.provider-option-logo {
  flex-shrink: 0;  /* 防止在空间不足时图标被压缩 */
}
```

## 修改文件

### options.html

**位置：**第 159-171 行

```html
<style>
  .radio-item {
    flex: 1;
    min-width: 200px;           /* ✅ 从 150px 增加到 200px */
    padding: 12px 16px;         /* ✅ 从 12px 改为 12px 16px */
    background: #f8f9fa;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    white-space: nowrap;        /* ✅ 新增：防止换行 */
  }
</style>
```

**位置：**第 183-187 行

```html
<style>
  .provider-option-label {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;        /* ✅ 新增：防止换行 */
  }
</style>
```

## 响应式设计

小屏幕（< 600px）下保持纵向排列，不受影响：

```css
@media (max-width: 600px) {
  .radio-group {
    flex-direction: column;
  }

  .radio-item {
    min-width: 100%;  /* 全宽显示 */
  }
}
```

## 测试验证

### 测试文件
- `test-provider-selection-fix.html` - 完整的修复前后对比演示

### 测试要点
1. ✅ 在不同浏览器中测试（Chrome、Firefox、Safari）
2. ✅ 调整窗口宽度，验证不同尺寸
3. ✅ 确认中英文都能单行显示
4. ✅ 验证三个选项均匀分布
5. ✅ 检查小屏幕下的纵向排列

## 技术细节

### 宽度计算

| 元素 | 宽度 | 说明 |
|------|------|------|
| 单选框 | ~20px | input[type="radio"] |
| 单选框右边距 | 10px | margin-right |
| 图标 | 20px | .provider-option-logo |
| 图标文字间距 | 8px | gap |
| 文字内容 | 80-100px | 中文 4 个字符 |
| 左右内边距 | 32px | padding: 12px 16px (16px × 2) |
| **总计** | **170-190px** | |

设置 `min-width: 200px` 提供了 10-30px 的缓冲空间。

### white-space: nowrap 的作用

- 防止文字在空间不足时自动换行
- 保持内容在同一行显示
- 配合 `overflow: hidden` 或 `text-overflow: ellipsis` 可以实现省略号效果（如需要）

## 相关文件

- `options.html` - Options 页面主文件
- `test-provider-selection-fix.html` - 修复效果测试页面

## 修复日期

2025-10-13

## 状态

✅ 已修复并测试
