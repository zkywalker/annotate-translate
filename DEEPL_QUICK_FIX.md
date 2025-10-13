# 🚨 DeepL 403 错误快速解决

## 问题
```
Error: DeepL API error [403]: Wrong endpoint. Use https://api-free.deepl.com
```

## ⚡ 快速解决（3步）

### 步骤 1：检查你的 API 密钥
打开 DeepL 账户页面，复制 API 密钥：
https://www.deepl.com/pro-account/summary

### 步骤 2：识别密钥类型
```
✅ 免费密钥：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx:fx  ← 注意末尾 :fx
❌ 专业密钥：xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx     ← 没有 :fx
```

### 步骤 3：配置扩展
```
打开扩展设置 → 选择 DeepL → 输入 API 密钥 →
  
  如果密钥有 :fx → ✅ 勾选 "使用免费API"
  如果密钥无 :fx → ❌ 取消勾选 "使用免费API"
  
→ 保存设置 → 刷新页面 → 重试翻译
```

## 🎯 原因
DeepL 有两个不同的 API 端点：
- 免费 API：`api-free.deepl.com` （需要 :fx 密钥）
- 专业 API：`api.deepl.com` （需要普通密钥）

你的配置与密钥类型不匹配！

## ✨ 新功能
扩展现在会**自动检测** `:fx` 后缀并使用正确的端点。

但建议还是手动确认配置以确保无误。

## 📋 检查清单
- [ ] API 密钥已复制（无多余空格）
- [ ] 已识别密钥类型（有无 :fx）
- [ ] "使用免费API" 选项与密钥匹配
- [ ] 已保存设置
- [ ] 已刷新页面或重新加载扩展

## 🔧 仍然有问题？
查看详细指南：`DEEPL_403_ERROR_FIX.md`

---
**更新**: 2025-10-13 | **状态**: ✅ 已修复
