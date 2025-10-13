# 🎯 批量标注功能使用指南

## ✨ 新功能：智能批量标注

当你选中并标注一个单词时，如果页面上有多个相同的单词，插件会智能询问你是否要批量标注。

---

## 📖 使用场景

### 场景1: 技术文档标注

假设你在阅读一篇技术文档：

```
API stands for Application Programming Interface. 
An API allows different software systems to communicate.
Modern web applications heavily rely on API calls.
RESTful API is a popular API architecture.
```

**操作：**
1. 选中任意一个 "API"
2. 右键 → "Annotate API"
3. 插件提示："Found 4 occurrences of 'API'"
4. 选择 "Annotate All (4)"
5. 输入标注："应用程序接口"

**结果：**
所有4个 "API" 都被标注为 "应用程序接口"

---

### 场景2: 学习英文单词

```
The test is important. This test will test your knowledge. 
Make sure to test your code before the final test.
```

**操作：**
1. 选中某个 "test"
2. 右键 → "Annotate test"
3. 插件提示："Found 5 occurrences of 'test'"
4. 选择 "Annotate First Only"（或 "Annotate All"）
5. 输入标注："测试"

**两种选择：**
- **Annotate First Only**: 只标注第一个 "test"
- **Annotate All (5)**: 标注所有5个 "test"

---

### 场景3: 中文拼音标注

```
验证功能是否正常。系统会自动验证输入。请完成验证流程。
```

**操作：**
1. 选中 "验证"
2. 右键 → "Annotate 验证"
3. 插件提示："Found 3 occurrences of '验证'"
4. 选择 "Annotate All (3)"
5. 输入拼音："yàn zhèng"

**结果：**
所有 "验证" 都显示拼音标注

---

## 🖥️ UI界面说明

### 对话框示例

当发现多个匹配时，会显示：

```
┌─────────────────────────────────────┐
│  Multiple matches found             │
│                                     │
│  Found 3 occurrences of "test"     │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Annotate First Only          │ │  ← 蓝色按钮
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Annotate All (3)             │ │  ← 绿色按钮
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Cancel                       │ │  ← 灰色按钮
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

### 按钮说明

| 按钮 | 颜色 | 功能 |
|------|------|------|
| **Annotate First Only** | 🔵 蓝色 | 只标注第一个匹配项 |
| **Annotate All (N)** | 🟢 绿色 | 标注所有N个匹配项 |
| **Cancel** | ⚪ 灰色 | 取消操作 |

---

## 🎯 使用技巧

### 技巧1: 精确定位

**问题：** 如何确保标注正确的单词位置？

**解决方案：**
- 选中文字后**立即右键**
- 插件会记住你选择的精确位置
- 即使有重复单词，也能标注正确的那个

**示例：**
```
The first test and the second test.
            ↑ 选这个
```
立即右键 → 会精确标注你选的那个 "test"

---

### 技巧2: 批量标注专业术语

**适用场景：**
- 技术文档中的缩写词 (API, SDK, OAuth)
- 专业术语 (authentication, middleware)
- 反复出现的概念

**步骤：**
1. 选中术语的任意一个
2. 选择 "Annotate All"
3. 输入统一的标注
4. 一次性完成所有标注

**好处：**
- 节省时间
- 保证标注一致性
- 提高阅读效率

---

### 技巧3: 只标注关键的

**场景：** 有些单词出现太多次，不想全部标注

**操作：**
- 选择 "Annotate First Only"
- 或者选择 "Cancel"，手动一个一个标注

**示例：**
```
is is is is is is
```
"is" 出现太多，只标注第一个或几个关键的

---

## ⚙️ 工作原理

### 1. 智能识别

```javascript
选中文字 → 保存位置 → 搜索匹配
                          ↓
            ┌─────────────┼─────────────┐
            ↓             ↓             ↓
         找到0个       找到1个       找到多个
            ↓             ↓             ↓
         显示错误      直接标注    显示选择对话框
```

### 2. 精确定位优先

```javascript
// 优先级
1. 使用保存的Range（最精确）
   ↓ 如果失效
2. 搜索所有匹配
   ↓ 根据结果
3. 自动标注 或 询问用户
```

### 3. 批量处理

```javascript
// 从后往前标注
for (let i = matches.length - 1; i >= 0; i--) {
  annotate(matches[i]);
}
```

**为什么从后往前？**
- 标注会修改DOM
- 从后往前保证索引不受影响

---

## 🧪 测试示例

### 测试1: 重复单词

在 `test.html` 中找到：

```html
The word "test" appears multiple times in this test sentence. 
When you select and annotate "test", you will be asked whether 
to annotate only the first "test" or all occurrences of "test".
```

**测试步骤：**
1. 选中任意一个 "test"
2. 右键 → "Annotate test"
3. 应该看到："Found 4 occurrences of 'test'"
4. 尝试两种选择

---

### 测试2: 中英文混合

```html
同样的，单词 word 在这个句子中出现了多次。
word 这个 word 可以用来测试批量标注功能。
```

**测试步骤：**
1. 选中 "word"
2. 右键 → "Annotate word"
3. 应该看到："Found 3 occurrences of 'word'"
4. 选择 "Annotate All (3)"
5. 输入："单词"

---

### 测试3: 只有一个匹配

选中任意**不重复**的单词，如：

```
JavaScript
```

**预期行为：**
- 不显示对话框
- 直接弹出输入框
- 输入标注后立即完成

---

## ⚠️ 注意事项

### 1. 已标注的不会重复标注

```html
<ruby>test<rt>测试</rt></ruby> test test
  ↑ 已标注，跳过              ↑ ↑ 会被找到
```

### 2. 大小写敏感

```
Test ≠ test ≠ TEST
```

选中 "test" 只会找到小写的 "test"

### 3. 标点符号影响匹配

```
test. ≠ test
```

选中 "test" 不会匹配 "test."

### 4. 跨元素选择

```html
<p>Hello <strong>world</strong></p>
```

如果选中 "Hello world"（跨越两个元素），标注可能复杂。

---

## 🐛 常见问题

### Q1: 为什么没有显示"多个匹配"对话框？

**可能原因：**
1. 页面上确实只有一个匹配
2. 其他匹配已经被标注过了（会自动跳过）
3. 其他匹配在不可见的元素中（script, style）

**检查方法：**
```javascript
// 在Console中执行
document.body.textContent.match(/test/g).length
```

---

### Q2: 为什么标注位置不对？

**可能原因：**
- 选中文字后等待太久才右键
- 页面内容发生了变化

**解决方法：**
- 选中后立即右键
- 刷新页面重试

---

### Q3: 可以撤销批量标注吗？

**当前版本：**
- 可以清除所有标注（popup中的"Clear All"）
- 暂不支持单独撤销

**未来版本：**
- 计划支持撤销功能
- 支持选择性删除

---

## 📊 使用统计建议

| 场景 | 建议选择 |
|------|----------|
| 学习新单词 | Annotate First Only |
| 技术文档术语 | Annotate All |
| 专有名词 | Annotate All |
| 常见单词 | Annotate First Only |
| 测试功能 | Annotate All |

---

## 🎨 自定义建议

### 标注内容建议

**英文单词：**
- 中文翻译
- 音标：/test/
- 词性：n. v.

**中文单词：**
- 拼音：yàn zhèng
- 英文翻译：verify
- 解释：检查确认

**技术术语：**
- 全称：API = Application Programming Interface
- 中文：应用程序接口
- 简短说明

---

## 🚀 高级用法

### 1. 组合标注

**步骤：**
1. 先批量标注所有 "API" → "应用程序接口"
2. 再单独标注某个特殊的 "API" → "REST API"
3. 第二次标注不会影响第一次

### 2. 分类标注

**同一个词，不同上下文：**
```
This is a test.        → test (n.) 测试
Please test it.        → test (v.) 测试
```

只标注第一个，避免混淆。

### 3. 渐进式标注

**学习过程：**
1. 第一遍：标注不认识的所有单词
2. 第二遍：标注重点词汇的详细信息
3. 第三遍：标注扩展知识

---

## 📚 最佳实践

1. **选中即标注**
   - 不要等待，立即右键

2. **一致性**
   - 同样的术语使用相同的标注
   - 使用批量标注保证一致

3. **简洁明了**
   - 标注不要太长
   - 建议不超过原文3倍长度

4. **合理使用**
   - 不是所有词都需要标注
   - 重点标注关键概念

5. **定期清理**
   - 不需要的标注及时清除
   - 保持页面整洁

---

生成时间: 2025-10-11
功能版本: v2.0 with Batch Annotation
