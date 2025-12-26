# 添加新翻译提供商

本教程将手把手教你如何为 Annotate Translate 添加一个新的翻译提供商。

## 教程概览

**难度**: ⭐⭐⭐ 中等
**预计时间**: 1-2 小时
**前置知识**: JavaScript、异步编程、HTTP API

**你将学到**:
- 实现 TranslationProvider 接口
- 注册提供商到服务层
- 处理 CORS 限制（如需要）
- 添加配置界面
- 测试提供商

## 示例：添加 Bing Translator

我们将添加 Bing Translator 作为新的翻译提供商。

### Step 1: 创建提供商类

在 `src/services/translation-service.js` 文件末尾添加新类：

```javascript
/**
 * Bing Translator Provider
 */
class BingTranslateProvider extends TranslationProvider {
  constructor(config = {}) {
    super('bing', config);
    this.apiEndpoint = 'https://api.cognitive.microsofttranslator.com/translate';
    this.apiKey = config.apiKey || '';
    this.region = config.region || 'global';
  }

  /**
   * 翻译文本
   */
  async translate(text, targetLang, sourceLang = 'auto') {
    if (!this.apiKey) {
      throw new TranslationError(
        'Bing API Key is required',
        'API_KEY_INVALID',
        'bing'
      );
    }

    try {
      // 构建请求参数
      const params = new URLSearchParams({
        'api-version': '3.0',
        'to': this.mapLanguageCode(targetLang)
      });

      if (sourceLang && sourceLang !== 'auto') {
        params.append('from', this.mapLanguageCode(sourceLang));
      }

      // 通过 Background 发送请求（绕过 CORS）
      const data = await this.sendRequestViaBackground({
        url: `${this.apiEndpoint}?${params}`,
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
          'Ocp-Apim-Subscription-Region': this.region,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify([{ text }])
      });

      // 解析响应
      return this.parseResponse(data, text, targetLang, sourceLang);

    } catch (error) {
      console.error('[BingTranslate] Error:', error);
      throw new TranslationError(
        error.message,
        'TRANSLATION_FAILED',
        'bing'
      );
    }
  }

  /**
   * 解析 Bing API 响应
   */
  parseResponse(data, text, targetLang, sourceLang) {
    if (!data || !data[0] || !data[0].translations) {
      throw new Error('Invalid response format');
    }

    const translation = data[0].translations[0];
    const detectedLanguage = data[0].detectedLanguage?.language || sourceLang;

    return {
      originalText: text,
      translatedText: translation.text,
      sourceLang: detectedLanguage,
      targetLang: targetLang,
      phonetics: [],          // Bing 不提供音标
      definitions: [],        // Bing 不提供释义
      examples: [],           // Bing 不提供例句
      provider: 'bing',
      providerDisplayName: 'Bing Translator',
      timestamp: Date.now()
    };
  }

  /**
   * 发送请求通过 Background（绕过 CORS）
   */
  async sendRequestViaBackground(params) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        action: 'bingTranslate',
        params
      }, (response) => {
        if (response && response.success) {
          resolve(response.data);
        } else {
          reject(new Error(response?.error || 'Request failed'));
        }
      });
    });
  }

  /**
   * 映射语言代码
   */
  mapLanguageCode(code) {
    const map = {
      'zh-CN': 'zh-Hans',
      'zh-TW': 'zh-Hant',
      'auto': ''
    };
    return map[code] || code;
  }

  /**
   * 检测语言
   */
  async detectLanguage(text) {
    // Bing 在翻译时自动检测
    return 'auto';
  }

  /**
   * 获取支持的语言
   */
  getSupportedLanguages() {
    return [
      { code: 'zh-CN', name: '简体中文' },
      { code: 'zh-TW', name: '繁体中文' },
      { code: 'en', name: 'English' },
      { code: 'ja', name: '日本語' },
      { code: 'ko', name: '한국어' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'es', name: 'Español' }
    ];
  }
}
```

### Step 2: 添加 Background 消息处理

在 `src/background/background.js` 中添加 Bing 请求处理：

```javascript
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // ... 其他处理器

  // Bing Translator 代理
  if (request.action === 'bingTranslate') {
    fetch(request.params.url, {
      method: request.params.method,
      headers: request.params.headers,
      body: request.params.body
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      sendResponse({ success: true, data });
    })
    .catch(error => {
      console.error('[Background] Bing translate error:', error);
      sendResponse({ success: false, error: error.message });
    });

    return true; // 保持消息通道开放
  }
});
```

### Step 3: 注册提供商

在 `src/content/content.js` 的初始化部分注册 Bing 提供商：

找到提供商注册代码块，添加：

```javascript
// 注册翻译提供商
function initializeTranslationService() {
  // ... 其他提供商

  // Bing Translator
  if (settings.providers?.bing?.enabled) {
    translationService.registerProvider('bing', new BingTranslateProvider({
      apiKey: settings.providers.bing.apiKey,
      region: settings.providers.bing.region
    }));
  }

  // 设置当前提供商
  translationService.setActiveProvider(settings.providers.current || 'google');
}
```

### Step 4: 添加到设置 Schema

在 `src/utils/settings-schema.js` 的 `DEFAULT_SETTINGS` 中添加 Bing 配置：

```javascript
const DEFAULT_SETTINGS = {
  // ... 其他设置

  providers: {
    current: 'google',

    // ... 其他提供商

    bing: {
      enabled: false,
      apiKey: '',
      region: 'global',  // 或特定区域如 'eastus'
      connectionStatus: null,
      lastTested: null
    }
  }
};
```

### Step 5: 添加配置 UI

#### 5.1 更新 options.html

在 `src/options/options.html` 中找到提供商配置区域，添加 Bing 配置：

```html
<!-- Bing Translator -->
<div class="provider-section" id="bing-section">
  <div class="provider-header">
    <h3>
      <img src="../assets/icons/providers/bing.svg" alt="Bing" class="provider-icon">
      Bing Translator
    </h3>
    <label class="switch">
      <input type="checkbox" id="bing-enabled">
      <span class="slider"></span>
    </label>
  </div>

  <div class="provider-config" id="bing-config">
    <div class="form-group">
      <label for="bing-api-key">
        <span data-i18n="apiKey">API Key</span>
        <a href="https://azure.microsoft.com/services/cognitive-services/translator/"
           target="_blank" class="help-link">
          <i data-lucide="help-circle"></i>
          <span data-i18n="getApiKey">获取 API Key</span>
        </a>
      </label>
      <div class="input-with-button">
        <input type="password"
               id="bing-api-key"
               placeholder="Your-Bing-API-Key"
               autocomplete="off">
        <button type="button"
                class="toggle-visibility"
                data-target="bing-api-key">
          <i data-lucide="eye"></i>
        </button>
      </div>
    </div>

    <div class="form-group">
      <label for="bing-region">
        <span>Region</span>
      </label>
      <select id="bing-region">
        <option value="global">Global</option>
        <option value="eastus">East US</option>
        <option value="westus">West US</option>
        <option value="westeurope">West Europe</option>
        <option value="southeastasia">Southeast Asia</option>
      </select>
    </div>

    <div class="form-actions">
      <button type="button"
              class="btn btn-secondary"
              id="test-bing-connection">
        <i data-lucide="wifi"></i>
        <span data-i18n="testConnection">测试连接</span>
      </button>
      <span class="connection-status" id="bing-connection-status"></span>
    </div>
  </div>
</div>
```

#### 5.2 更新 options.js

在 `src/options/options.js` 中添加 Bing 配置的加载和保存逻辑：

```javascript
// 加载设置
function loadSettings() {
  chrome.storage.sync.get(null, (items) => {
    const settings = { ...DEFAULT_SETTINGS, ...items };

    // ... 其他提供商

    // Bing
    document.getElementById('bing-enabled').checked =
      settings.providers?.bing?.enabled || false;
    document.getElementById('bing-api-key').value =
      settings.providers?.bing?.apiKey || '';
    document.getElementById('bing-region').value =
      settings.providers?.bing?.region || 'global';

    toggleProviderConfig('bing', settings.providers?.bing?.enabled);
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    // ... 其他设置

    providers: {
      // ... 其他提供商

      bing: {
        enabled: document.getElementById('bing-enabled').checked,
        apiKey: document.getElementById('bing-api-key').value.trim(),
        region: document.getElementById('bing-region').value,
        connectionStatus: null
      }
    }
  };

  chrome.storage.sync.set(settings, () => {
    showNotification('设置已保存', 'success');
  });
}

// 测试连接
document.getElementById('test-bing-connection').addEventListener('click', async () => {
  const apiKey = document.getElementById('bing-api-key').value.trim();
  const region = document.getElementById('bing-region').value;

  if (!apiKey) {
    showNotification('请输入 API Key', 'error');
    return;
  }

  const statusEl = document.getElementById('bing-connection-status');
  statusEl.textContent = '测试中...';
  statusEl.className = 'connection-status testing';

  try {
    const provider = new BingTranslateProvider({ apiKey, region });
    const result = await provider.translate('hello', 'zh-CN', 'en');

    if (result.translatedText) {
      statusEl.textContent = '✓ 连接成功';
      statusEl.className = 'connection-status success';
    } else {
      throw new Error('Invalid response');
    }
  } catch (error) {
    statusEl.textContent = `✗ 连接失败: ${error.message}`;
    statusEl.className = 'connection-status error';
  }
});

// 启用/禁用配置面板
document.getElementById('bing-enabled').addEventListener('change', (e) => {
  toggleProviderConfig('bing', e.target.checked);
});
```

### Step 6: 添加提供商图标

将 Bing 图标放到 `assets/icons/providers/bing.svg`。

你可以从 [Lucide Icons](https://lucide.dev/) 下载或创建一个简单的 SVG：

```xml
<!-- assets/icons/providers/bing.svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
  <polyline points="7.5 4.21 12 6.81 16.5 4.21"></polyline>
  <polyline points="7.5 19.79 7.5 14.6 3 12"></polyline>
  <polyline points="21 12 16.5 14.6 16.5 19.79"></polyline>
  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
  <line x1="12" y1="22.08" x2="12" y2="12"></line>
</svg>
```

### Step 7: 更新 manifest.json（如需要）

如果 Bing API 需要特定的权限，在 `manifest.json` 中添加：

```json
{
  "host_permissions": [
    "https://api.cognitive.microsofttranslator.com/*"
  ]
}
```

### Step 8: 测试提供商

#### 8.1 单元测试

创建测试文件 `test/test-bing-translator.html`：

```html
<!DOCTYPE html>
<html>
<head>
  <title>Bing Translator Test</title>
  <meta charset="UTF-8">
</head>
<body>
  <h1>Bing Translator Test</h1>

  <div>
    <label>API Key: <input type="text" id="apiKey" size="50"></label><br>
    <label>Region: <input type="text" id="region" value="global"></label><br>
    <label>Text: <input type="text" id="text" value="hello"></label><br>
    <label>Target Lang: <input type="text" id="targetLang" value="zh-CN"></label><br>
    <button onclick="testTranslate()">Test</button>
  </div>

  <h2>Result:</h2>
  <pre id="result"></pre>

  <script src="../src/services/translation-service.js"></script>
  <script>
    async function testTranslate() {
      const apiKey = document.getElementById('apiKey').value;
      const region = document.getElementById('region').value;
      const text = document.getElementById('text').value;
      const targetLang = document.getElementById('targetLang').value;

      const provider = new BingTranslateProvider({ apiKey, region });

      try {
        const result = await provider.translate(text, targetLang);
        document.getElementById('result').textContent = JSON.stringify(result, null, 2);
      } catch (error) {
        document.getElementById('result').textContent = `Error: ${error.message}`;
      }
    }
  </script>
</body>
</html>
```

#### 8.2 集成测试

1. 重新加载扩展
2. 打开选项页面
3. 启用 Bing Translator
4. 输入 API Key 和 Region
5. 点击"测试连接"
6. 如果成功，保存设置
7. 在网页上选中文本并翻译
8. 检查是否使用 Bing 翻译

### Step 9: 添加到提供商选择器

在 `src/popup/popup.js` 中添加 Bing 到提供商列表：

```javascript
const providers = [
  { id: 'google', name: 'Google Translate' },
  { id: 'youdao', name: 'Youdao' },
  { id: 'deepl', name: 'DeepL' },
  { id: 'openai', name: 'OpenAI' },
  { id: 'bing', name: 'Bing Translator' }  // 新增
];
```

### Step 10: 添加国际化文本

在 `_locales/zh_CN/messages.json` 中添加：

```json
{
  "bingTranslate": {
    "message": "Bing 翻译",
    "description": "Bing Translator name"
  },
  "bingApiKey": {
    "message": "Bing API Key",
    "description": "Bing API Key label"
  }
}
```

在 `_locales/en/messages.json` 中添加：

```json
{
  "bingTranslate": {
    "message": "Bing Translator",
    "description": "Bing Translator name"
  },
  "bingApiKey": {
    "message": "Bing API Key",
    "description": "Bing API Key label"
  }
}
```

## 完整检查清单

- [ ] 创建 `BingTranslateProvider` 类
- [ ] 实现 `translate()` 方法
- [ ] 添加 Background 消息处理
- [ ] 注册提供商到 TranslationService
- [ ] 添加到 DEFAULT_SETTINGS
- [ ] 创建配置 UI (HTML + JS)
- [ ] 添加提供商图标
- [ ] 更新 manifest.json 权限（如需要）
- [ ] 编写测试代码
- [ ] 测试所有功能
- [ ] 添加国际化文本
- [ ] 更新 popup 提供商列表

## 常见问题

### Q1: 提供商不显示在列表中？

**A**: 检查：
1. 是否在 settings-schema.js 中添加了配置
2. 是否在 content.js 中注册了提供商
3. 是否在 popup.js 中添加到列表
4. 重新加载扩展

### Q2: 翻译失败，显示 CORS 错误？

**A**: 确保：
1. 在 background.js 中添加了消息处理器
2. action 名称一致（如 'bingTranslate'）
3. 在 manifest.json 中添加了 host_permissions

### Q3: API Key 无效？

**A**: 检查：
1. API Key 是否正确复制
2. API Key 是否有效（未过期）
3. 是否选择了正确的 region
4. 查看 Background 控制台的错误信息

### Q4: 如何处理提供商特定的错误？

**A**: 在 `translate()` 方法中添加错误处理：

```javascript
try {
  const response = await fetch(...);
  const data = await response.json();

  // 检查 API 特定错误
  if (data.error) {
    if (data.error.code === '401000') {
      throw new TranslationError('Invalid API key', 'API_KEY_INVALID', 'bing');
    } else if (data.error.code === '429000') {
      throw new TranslationError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED', 'bing');
    }
  }

  return this.parseResponse(data, text, targetLang, sourceLang);
} catch (error) {
  // 统一错误处理
  throw new TranslationError(error.message, 'TRANSLATION_FAILED', 'bing');
}
```

## 最佳实践

### 1. 错误处理

```javascript
async translate(text, targetLang, sourceLang) {
  try {
    // 翻译逻辑
  } catch (error) {
    // 记录详细错误
    console.error(`[${this.name}] Translation failed:`, {
      text, targetLang, sourceLang, error
    });

    // 抛出标准化错误
    throw new TranslationError(
      error.message,
      this.categorizeError(error),
      this.name
    );
  }
}

categorizeError(error) {
  if (error.message.includes('401')) return 'API_KEY_INVALID';
  if (error.message.includes('429')) return 'RATE_LIMIT_EXCEEDED';
  if (error.name === 'TypeError') return 'NETWORK_ERROR';
  return 'TRANSLATION_FAILED';
}
```

### 2. 速率限制

```javascript
constructor(config) {
  super('bing', config);
  this.lastRequest = 0;
  this.minInterval = 100; // 最小间隔 100ms
}

async translate(text, targetLang, sourceLang) {
  // 等待最小间隔
  const now = Date.now();
  const elapsed = now - this.lastRequest;
  if (elapsed < this.minInterval) {
    await new Promise(r => setTimeout(r, this.minInterval - elapsed));
  }

  this.lastRequest = Date.now();

  // 继续翻译...
}
```

### 3. 重试机制

```javascript
async translateWithRetry(text, targetLang, sourceLang, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.translate(text, targetLang, sourceLang);
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      // 指数退避
      const delay = 1000 * Math.pow(2, i);
      console.log(`[${this.name}] Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}
```

### 4. 输入验证

```javascript
async translate(text, targetLang, sourceLang) {
  // 验证输入
  if (!text || text.trim().length === 0) {
    throw new TranslationError('Empty text', 'INVALID_PARAMETERS', this.name);
  }

  if (text.length > 5000) {
    throw new TranslationError('Text too long (max 5000 chars)', 'INVALID_PARAMETERS', this.name);
  }

  // 继续翻译...
}
```

## 总结

通过本教程，你学会了：

✅ 实现 TranslationProvider 接口
✅ 处理 CORS 限制
✅ 注册和配置提供商
✅ 创建配置 UI
✅ 测试提供商
✅ 错误处理和最佳实践

现在你可以为 Annotate Translate 添加任何翻译 API！

## 相关文档

- [提供商系统](/development/providers)
- [TranslationService](/development/translation-service)
- [CORS 代理](/recipes/cors-proxy)
- [BaseProvider API](/api/providers/base-provider)
