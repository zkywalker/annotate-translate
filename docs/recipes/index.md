# 实战示例

本节提供实际开发中的常见任务和最佳实践，通过 step-by-step 教程帮助你快速实现特定功能。

## 扩展功能

### 添加新的翻译提供商

学习如何实现和集成新的翻译服务。

**难度**: ⭐⭐⭐
**预计时间**: 1-2 小时

- 实现 TranslationProvider 接口
- 注册提供商
- 添加配置界面
- 处理 CORS（如需要）

[查看教程 →](/recipes/add-new-provider)

### 自定义 AI 提示词模板

自定义 AI 翻译的提示词，优化翻译质量。

**难度**: ⭐⭐
**预计时间**: 30 分钟

- 理解提示词模板系统
- 创建自定义模板
- 配置提供商使用

[查看教程 →](/recipes/ai-prompt-template)

### 自定义词库

添加自定义词库，支持专业领域或个性化学习。

**难度**: ⭐⭐⭐
**预计时间**: 1 小时

- 准备词库数据
- 实现词库提供商
- 集成到词汇系统

[查看教程 →](/recipes/custom-vocabulary)

## 高级定制

### 自定义 UI 主题

修改翻译卡片和标注的样式。

**难度**: ⭐⭐
**预计时间**: 30 分钟

- 理解 UI 组件结构
- 修改 CSS 样式
- 添加自定义颜色和动画

[查看教程 →](/recipes/custom-ui-theme)

### 实现 CORS 代理

为新的翻译提供商添加 CORS 代理支持。

**难度**: ⭐⭐⭐⭐
**预计时间**: 1-2 小时

- Background Service Worker 消息处理
- 请求转发和响应处理
- 错误处理

[查看教程 →](/recipes/cors-proxy)

## 实用技巧

### 调试技巧

- 如何使用 Chrome DevTools 调试扩展
- 查看 Background Service Worker 日志
- Content Script 调试方法

### 性能优化

- 缓存策略优化
- 减少 API 调用
- 批量操作优化

### 数据迁移

- 从旧版本迁移数据
- 导入导出设置
- 清理过期数据

## 代码片段

### 快速翻译

```javascript
async function quickTranslate(text) {
  const result = await translationService.translate(text, 'zh-CN', 'auto');
  return result.translatedText;
}
```

### 批量翻译

```javascript
async function batchTranslate(words, targetLang) {
  const results = [];
  for (const word of words) {
    try {
      const result = await translationService.translate(word, targetLang);
      results.push(result);
    } catch (error) {
      console.error(`翻译失败: ${word}`, error);
      results.push(null);
    }
    // 避免速率限制
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  return results;
}
```

### 添加自定义按钮

```javascript
// 在翻译卡片中添加自定义按钮
function addCustomButton(card, result) {
  const button = document.createElement('button');
  button.textContent = '收藏';
  button.className = 'custom-favorite-btn';
  button.onclick = () => {
    saveFavorite(result);
  };
  card.querySelector('.actions').appendChild(button);
}
```

## 常见问题解决方案

### 提供商 API 调用失败

```javascript
class RobustProvider extends TranslationProvider {
  async translate(text, targetLang, sourceLang) {
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.doTranslate(text, targetLang, sourceLang);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(r => setTimeout(r, 1000 * (i + 1)));
      }
    }
  }
}
```

### 缓存过期处理

```javascript
class CacheWithExpiry {
  set(key, value, ttl = 30 * 60 * 1000) {
    const entry = {
      value,
      expiresAt: Date.now() + ttl
    };
    this.cache.set(key, entry);
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }
}
```

## 贡献示例

如果你有好的实战示例，欢迎贡献！

1. Fork 仓库
2. 在 `docs/recipes/` 目录下创建新的 Markdown 文件
3. 按照现有格式编写教程
4. 提交 Pull Request

[贡献指南 →](/contributing)

## 相关资源

- [开发文档](/development/) - 了解架构设计
- [API 参考](/api/) - 查看接口详情
- [设计文档](/design/) - 查看设计规范
