# DeepL API 403 错误修复指南

## 🐛 错误信息

```
[DeepLTranslate] Translation error: Error: DeepL API error [403]: 
Wrong endpoint. Use https://api-free.deepl.com. 
You can find more info in our docs: https://developers.deepl.com/docs/getting-started/auth
```

```
[Annotate-Translate] Auto-translate failed: 
Error: DeepL API authentication failed. Please check your API key.
```

## 🔍 问题原因

DeepL 有两种 API 端点：
1. **免费 API**: `https://api-free.deepl.com/v2/translate`
2. **专业 API**: `https://api.deepl.com/v2/translate`

**403 错误的原因**：你使用的 API 密钥类型与配置的端点不匹配！

### API 密钥类型识别

- **免费 API 密钥**：通常以 `:fx` 结尾
  - 例如：`abcd1234-5678-90ab-cdef-1234567890ab:fx`
  - 必须使用：`https://api-free.deepl.com`
  
- **专业 API 密钥**：不包含 `:fx` 后缀
  - 例如：`abcd1234-5678-90ab-cdef-1234567890ab`
  - 必须使用：`https://api.deepl.com`

## ✅ 解决方案

### 方案 1：自动检测（推荐）

扩展现在会自动检测 API 密钥类型！但你需要重新加载扩展。

**步骤：**
1. 打开扩展选项页面
2. 确认你的 API 密钥已输入
3. 保存设置
4. **重新加载扩展**（chrome://extensions/ → 点击刷新图标）
5. 再次尝试翻译

### 方案 2：手动配置

**如果你的 API 密钥以 `:fx` 结尾（免费密钥）：**
1. 打开扩展选项页面
2. 选择 DeepL 提供者
3. ✅ **勾选** "使用免费API (api-free.deepl.com)"
4. 保存设置
5. 刷新页面并尝试翻译

**如果你的 API 密钥没有 `:fx` 后缀（专业密钥）：**
1. 打开扩展选项页面
2. 选择 DeepL 提供者
3. ❌ **取消勾选** "使用免费API (api-free.deepl.com)"
4. 保存设置
5. 刷新页面并尝试翻译

## 🔧 详细步骤（图文说明）

### 步骤 1：检查你的 API 密钥

```bash
# 在 DeepL 账户页面复制你的 API 密钥
https://www.deepl.com/pro-account/summary

# 检查密钥格式
免费版: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx  ← 注意末尾的 :fx
专业版: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← 没有 :fx
```

### 步骤 2：配置扩展

```
Chrome 扩展 → 点击扩展图标 → 设置
↓
翻译提供商 → 选择 "🚀 DeepL"
↓
输入 API 密钥
↓
根据密钥类型选择：
  ✅ 免费版：勾选 "使用免费API"
  ❌ 专业版：取消勾选 "使用免费API"
↓
点击 "保存设置"
```

### 步骤 3：验证配置

在浏览器控制台（F12）中查看日志：

```javascript
// 应该看到类似这样的输出
[DeepLTranslate] Config updated.
[DeepLTranslate]   API Key: abcd123456...
[DeepLTranslate]   API Type: Free (api-free.deepl.com)  // 或 Pro (api.deepl.com)

// 翻译时应该看到
[DeepLTranslate] Using API URL: https://api-free.deepl.com/v2/translate
```

### 步骤 4：测试翻译

1. 在任意网页选择一些文本
2. 右键 → "Translate"
3. 检查是否成功翻译

## 🎯 快速诊断

### 检查清单

```
□ API 密钥已正确复制（没有多余空格）
□ API 密钥类型已识别（有无 :fx 后缀）
□ "使用免费API" 选项与密钥类型匹配
□ 已保存设置
□ 已重新加载扩展或刷新页面
□ 浏览器控制台没有其他错误
```

### 常见错误和解决方案

| 错误信息 | 原因 | 解决方案 |
|---------|------|---------|
| Wrong endpoint. Use api-free.deepl.com | 免费密钥但使用了专业端点 | ✅ 勾选 "使用免费API" |
| Wrong endpoint. Use api.deepl.com | 专业密钥但使用了免费端点 | ❌ 取消勾选 "使用免费API" |
| 403 Authentication failed | API 密钥无效或过期 | 重新获取 API 密钥 |
| 456 Quota exceeded | 超出配额限制 | 等待下月重置或升级 |

## 🔍 调试步骤

如果上述方案都不行，请按以下步骤调试：

### 1. 清除浏览器缓存
```
Chrome → 设置 → 隐私和安全 → 清除浏览数据
选择：缓存的图片和文件
```

### 2. 检查扩展日志

**打开扩展的 Service Worker 日志：**
```
chrome://extensions/ → 
找到 "Annotate Translate" → 
点击 "Service Worker" 链接
```

**查看内容脚本日志：**
```
在任意网页按 F12 → Console 标签
```

**寻找以下日志：**
```javascript
[DeepLTranslate] Config updated.
[DeepLTranslate]   API Key: ...
[DeepLTranslate]   API Type: Free/Pro
[DeepLTranslate] Using API URL: ...
[DeepLTranslate] Translation error: ...
```

### 3. 手动测试 API

使用 curl 命令测试你的 API 密钥：

**免费 API：**
```bash
curl -X POST https://api-free.deepl.com/v2/translate \
  -H "Authorization: DeepL-Auth-Key YOUR_API_KEY_HERE" \
  -d "text=Hello, world!" \
  -d "target_lang=ZH"
```

**专业 API：**
```bash
curl -X POST https://api.deepl.com/v2/translate \
  -H "Authorization: DeepL-Auth-Key YOUR_API_KEY_HERE" \
  -d "text=Hello, world!" \
  -d "target_lang=ZH"
```

**预期响应：**
```json
{
  "translations": [
    {
      "detected_source_language": "EN",
      "text": "你好，世界！"
    }
  ]
}
```

### 4. 使用测试页面

```bash
# 打开测试页面
file:///path/to/annotate-translate/test-deepl-translate.html

# 或在浏览器中直接打开
# 配置 API 密钥并点击 "Test Connection"
```

## 💡 预防措施

### 配置最佳实践

1. **获取 API 密钥后立即测试**
   - 使用 curl 或测试页面验证
   
2. **记录你的 API 类型**
   - 在密码管理器中标注"免费"或"专业"
   
3. **定期检查配额**
   - 访问 https://www.deepl.com/pro-account/usage
   - 免费版：500,000 字符/月
   
4. **启用缓存**
   - 在设置中启用翻译缓存
   - 可以减少 API 调用次数

## 📝 配置示例

### 免费版配置（推荐个人使用）

```
API 密钥: abcd1234-5678-90ab-cdef-1234567890ab:fx
使用免费API: ✅ 勾选
端点: https://api-free.deepl.com/v2/translate
配额: 500,000 字符/月
```

### 专业版配置（商业使用）

```
API 密钥: abcd1234-5678-90ab-cdef-1234567890ab
使用免费API: ❌ 不勾选
端点: https://api.deepl.com/v2/translate
配额: 根据订阅计划
```

## 🆕 新增功能

### 自动 API 类型检测

扩展现在会自动检测 API 密钥类型：

```javascript
// 代码片段（仅供参考）
if (apiKey.includes(':fx')) {
  // 自动设置为免费 API
  useFreeApi = true;
  console.log('Detected Free API key');
}
```

这意味着即使你忘记勾选/取消勾选选项，扩展也会尝试使用正确的端点。

但建议还是**手动确认**配置，以确保万无一失。

## 🔄 更新记录

### 2025-10-13 更新
- ✅ 添加自动 API 类型检测
- ✅ 改进错误信息，明确指出端点不匹配
- ✅ 添加详细的日志输出
- ✅ 改进配置更新逻辑

## 📞 仍然有问题？

如果以上方法都无法解决问题，请提供以下信息：

```
1. API 密钥格式（前10个字符 + 是否有 :fx 后缀）
   示例：abcd123456... :fx

2. "使用免费API" 选项状态
   ✅ 已勾选 / ❌ 未勾选

3. 浏览器控制台的完整错误日志
   [DeepLTranslate] ...

4. 是否能用 curl 成功调用 API
   成功 / 失败

5. DeepL 账户类型
   免费 / Pro

6. 配额使用情况
   已用 X / 总计 500,000 字符
```

---

**文档版本**: 1.1  
**更新日期**: 2025-10-13  
**状态**: ✅ 已修复并增强
