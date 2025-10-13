# 快速测试：标注配置功能

## ⚡ 5分钟测试流程

### 测试1: 默认配置（显示读音+翻译）

1. **打开测试页面**
   ```bash
   # 在浏览器中打开
   file:///workspaces/annotate-translate/test.html
   ```

2. **选中单词 "hello"**

3. **点击 "A" 按钮 → "🤖 Auto Translate & Annotate"**

4. **预期结果**
   ```
   hello
   [/həˈloʊ/ 你好]
   ```

5. **验证HTML**
   ```html
   <ruby>hello<rt>/həˈloʊ/ 你好</rt></ruby>
   ```

---

### 测试2: 关闭读音显示（仅翻译）

1. **打开设置页面**
   - 右键扩展图标 → Options

2. **找到 "Annotation Settings"**
   - 取消勾选 "Show Phonetic + Translation in Annotation"
   - 点击 "Save Settings"

3. **重新加载测试页面**

4. **选中单词 "apple"**

5. **点击 "A" 按钮 → "🤖 Auto Translate & Annotate"**

6. **预期结果**
   ```
   apple
   [苹果]
   ```
   （注意：**没有** `/ˈæpl/` 读音）

7. **验证HTML**
   ```html
   <ruby>apple<rt>苹果</rt></ruby>
   ```

---

### 测试3: 批量标注

1. **测试HTML**
   ```html
   <p>I like apple. Apple is good. Red apple is best.</p>
   ```

2. **配置**: `showPhoneticInAnnotation: true`

3. **选中任意一个 "apple" → A → Annotate All (3) → 🤖 Auto Translate All**

4. **预期结果**（所有3个apple）:
   ```
   apple
   [/ˈæpl/ 苹果]
   ```

5. **切换配置**: `showPhoneticInAnnotation: false`

6. **重新标注**

7. **预期结果**（所有3个apple）:
   ```
   apple
   [苹果]
   ```

---

## 🔍 验证清单

| 测试项 | 配置 | 预期 | 实际 | 状态 |
|--------|------|------|------|------|
| 单个标注（开启读音） | `true` | `/həˈloʊ/ 你好` | _____ | ☐ |
| 单个标注（关闭读音） | `false` | `你好` | _____ | ☐ |
| 批量标注（开启读音） | `true` | `/ˈæpl/ 苹果` | _____ | ☐ |
| 批量标注（关闭读音） | `false` | `苹果` | _____ | ☐ |
| 手动输入 | N/A | 自定义 | _____ | ☐ |
| 设置保存 | N/A | 持久化 | _____ | ☐ |
| 配置重载 | N/A | 实时生效 | _____ | ☐ |

---

## 🐛 调试命令

### 查看当前配置
```javascript
chrome.storage.sync.get('showPhoneticInAnnotation', console.log);
```

### 手动设置配置
```javascript
// 开启读音
chrome.storage.sync.set({ showPhoneticInAnnotation: true });

// 关闭读音
chrome.storage.sync.set({ showPhoneticInAnnotation: false });
```

### 查看 Provider 状态
```javascript
const debugProvider = translationService.providers.get('debug');
console.log('showPhoneticInAnnotation:', debugProvider.showPhoneticInAnnotation);
```

### 测试翻译结果
```javascript
translationService.translate('hello', 'zh-CN').then(result => {
  console.log('translatedText:', result.translatedText);
  console.log('annotationText:', result.annotationText);
  console.log('phonetics:', result.phonetics);
});
```

---

## ✅ 预期输出示例

### 配置开启（showPhoneticInAnnotation: true）

```javascript
{
  originalText: "hello",
  translatedText: "你好",
  annotationText: "/həˈloʊ/ 你好",  // ← 包含读音
  phonetics: [
    { text: "/həˈloʊ/", type: "us" },
    { text: "/həˈləʊ/", type: "uk" }
  ],
  // ...
}
```

### 配置关闭（showPhoneticInAnnotation: false）

```javascript
{
  originalText: "hello",
  translatedText: "你好",
  annotationText: "你好",  // ← 仅翻译
  phonetics: [
    { text: "/həˈloʊ/", type: "us" },
    { text: "/həˈləʊ/", type: "uk" }
  ],
  // ...
}
```

---

## 🎯 成功标准

- ✅ 配置开启时，标注包含读音
- ✅ 配置关闭时，标注仅包含翻译
- ✅ 批量标注遵循相同规则
- ✅ 手动输入不受配置影响
- ✅ 配置修改后持久化保存
- ✅ 页面重载后配置生效

---

## 📸 视觉对比

### 开启读音（verbose mode）
```
┌─────────────────────┐
│ I like apple pie.   │
│        ↓            │
│        apple        │
│    [/ˈæpl/ 苹果]    │  ← 包含读音
└─────────────────────┘
```

### 关闭读音（concise mode）
```
┌─────────────────────┐
│ I like apple pie.   │
│        ↓            │
│        apple        │
│       [苹果]        │  ← 简洁模式
└─────────────────────┘
```

---

## 🚀 一键测试脚本

```bash
#!/bin/bash

echo "=== 标注配置快速测试 ==="

# 1. 开启读音
echo "1. 测试开启读音模式..."
# 手动: 在浏览器中选中 "hello" → A → 🤖 Auto

# 2. 关闭读音
echo "2. 测试关闭读音模式..."
# 手动: Settings → 取消勾选 → Save
# 选中 "apple" → A → 🤖 Auto

# 3. 批量测试
echo "3. 测试批量标注..."
# 选中 "world" (假设有多个) → A → Annotate All → 🤖 Auto

echo "✅ 测试完成！请查看标注效果。"
```

---

## 📋 报告模板

```markdown
## 测试报告

**测试人**: _______
**日期**: 2024-10-11
**浏览器**: _______
**扩展版本**: _______

### 测试结果

1. **单个标注（开启读音）**: ☐ 通过 ☐ 失败
   - 预期: `/həˈloʊ/ 你好`
   - 实际: __________

2. **单个标注（关闭读音）**: ☐ 通过 ☐ 失败
   - 预期: `你好`
   - 实际: __________

3. **批量标注（开启读音）**: ☐ 通过 ☐ 失败
   - 预期: 所有实例包含读音
   - 实际: __________

4. **批量标注（关闭读音）**: ☐ 通过 ☐ 失败
   - 预期: 所有实例仅翻译
   - 实际: __________

### 问题记录

- 问题1: __________
- 问题2: __________

### 总体评价

☐ 所有功能正常
☐ 部分功能异常
☐ 需要修复

### 备注

__________
```

---

完成！现在开始测试吧！🎉
