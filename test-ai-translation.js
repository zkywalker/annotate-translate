/**
 * Test Script for AI Translation Service
 * 
 * 测试AI翻译服务的各项功能
 */

// 全局变量
let aiService = null;
let stats = {
  translations: 0,
  totalTokens: 0,
  totalCost: 0,
  cacheHits: 0
};

// DOM 元素
const elements = {
  // Configuration
  provider: document.getElementById('provider'),
  apiKey: document.getElementById('apiKey'),
  baseUrl: document.getElementById('baseUrl'),
  model: document.getElementById('model'),
  initBtn: document.getElementById('initBtn'),
  validateBtn: document.getElementById('validateBtn'),
  providerInfo: document.getElementById('providerInfo'),
  providerInfoContent: document.getElementById('providerInfoContent'),
  
  // Translation
  text: document.getElementById('text'),
  sourceLang: document.getElementById('sourceLang'),
  targetLang: document.getElementById('targetLang'),
  translateBtn: document.getElementById('translateBtn'),
  translateRetryBtn: document.getElementById('translateRetryBtn'),
  clearCacheBtn: document.getElementById('clearCacheBtn'),
  result: document.getElementById('result'),
  
  // Batch
  batchTranslateBtn: document.getElementById('batchTranslateBtn'),
  batchResult: document.getElementById('batchResult'),
  
  // Stats
  statTranslations: document.getElementById('statTranslations'),
  statTokens: document.getElementById('statTokens'),
  statCost: document.getElementById('statCost'),
  statCache: document.getElementById('statCache')
};

// 初始化事件监听器
function initEventListeners() {
  elements.initBtn.addEventListener('click', handleInitialize);
  elements.validateBtn.addEventListener('click', handleValidate);
  elements.translateBtn.addEventListener('click', handleTranslate);
  elements.translateRetryBtn.addEventListener('click', handleTranslateWithRetry);
  elements.clearCacheBtn.addEventListener('click', handleClearCache);
  elements.batchTranslateBtn.addEventListener('click', handleBatchTranslate);
  
  // 快捷键
  elements.text.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleTranslate();
    }
  });
}

// 初始化服务
async function handleInitialize() {
  const apiKey = elements.apiKey.value.trim();
  const baseUrl = elements.baseUrl.value.trim() || 'https://api.openai.com/v1';
  const model = elements.model.value;
  const provider = elements.provider.value;

  if (!apiKey) {
    showError('请输入 API 密钥');
    return;
  }

  setButtonLoading(elements.initBtn, true, '初始化中...');

  try {
    // 创建服务实例
    aiService = new AITranslationService();
    
    // 初始化提供商
    await aiService.initialize(provider, {
      apiKey: apiKey,
      model: model,
      baseURL: baseUrl
    });

    showSuccess('服务初始化成功！');
    
    // 显示提供商信息
    const info = aiService.getProviderInfo();
    displayProviderInfo(info);
    
    // 启用其他按钮
    enableTranslationButtons(true);
    
  } catch (error) {
    showError(`初始化失败: ${error.message}`);
    console.error(error);
  } finally {
    setButtonLoading(elements.initBtn, false, '初始化服务');
  }
}

// 验证配置
async function handleValidate() {
  if (!aiService) {
    showError('请先初始化服务');
    return;
  }

  setButtonLoading(elements.validateBtn, true, '验证中...');

  try {
    const isValid = await aiService.provider.validateConfig();
    
    if (isValid) {
      showSuccess('配置验证通过！API 密钥有效。');
    } else {
      showError('配置验证失败！请检查 API 密钥。');
    }
    
  } catch (error) {
    showError(`验证失败: ${error.message}`);
  } finally {
    setButtonLoading(elements.validateBtn, false, '验证配置');
  }
}

// 翻译
async function handleTranslate() {
  if (!aiService) {
    showError('请先初始化服务');
    return;
  }

  const text = elements.text.value.trim();
  const sourceLang = elements.sourceLang.value;
  const targetLang = elements.targetLang.value;

  if (!text) {
    showError('请输入要翻译的文本');
    return;
  }

  setButtonLoading(elements.translateBtn, true, '翻译中...');
  elements.result.innerHTML = '';

  try {
    const startTime = Date.now();
    const result = await aiService.translate(text, sourceLang, targetLang);
    const endTime = Date.now();
    const duration = endTime - startTime;

    displayTranslationResult(result, duration);
    updateStats(result);
    
  } catch (error) {
    showError(`翻译失败: ${error.message}`, elements.result);
    console.error(error);
  } finally {
    setButtonLoading(elements.translateBtn, false, '翻译');
  }
}

// 带重试的翻译
async function handleTranslateWithRetry() {
  if (!aiService) {
    showError('请先初始化服务');
    return;
  }

  const text = elements.text.value.trim();
  const sourceLang = elements.sourceLang.value;
  const targetLang = elements.targetLang.value;

  if (!text) {
    showError('请输入要翻译的文本');
    return;
  }

  setButtonLoading(elements.translateRetryBtn, true, '翻译中...');
  elements.result.innerHTML = '';

  try {
    const startTime = Date.now();
    const result = await aiService.translateWithRetry(text, sourceLang, targetLang, 3);
    const endTime = Date.now();
    const duration = endTime - startTime;

    displayTranslationResult(result, duration);
    updateStats(result);
    
  } catch (error) {
    showError(`翻译失败: ${error.message}`, elements.result);
    console.error(error);
  } finally {
    setButtonLoading(elements.translateRetryBtn, false, '带重试翻译');
  }
}

// 批量翻译
async function handleBatchTranslate() {
  if (!aiService) {
    showError('请先初始化服务');
    return;
  }

  const items = [
    { text: 'Hello', sourceLang: 'en', targetLang: 'zh-CN' },
    { text: 'Good morning', sourceLang: 'en', targetLang: 'zh-CN' },
    { text: 'Thank you', sourceLang: 'en', targetLang: 'zh-CN' },
    { text: 'How are you?', sourceLang: 'en', targetLang: 'zh-CN' },
    { text: 'See you later', sourceLang: 'en', targetLang: 'zh-CN' }
  ];

  setButtonLoading(elements.batchTranslateBtn, true, '批量翻译中...');
  elements.batchResult.innerHTML = '';

  try {
    const startTime = Date.now();
    const results = await aiService.translateBatch(items, {
      concurrency: 2,
      delayMs: 1000
    });
    const endTime = Date.now();
    const duration = endTime - startTime;

    displayBatchResults(results, duration);
    
    // 更新统计
    results.forEach(result => {
      if (!result.error) {
        updateStats(result);
      }
    });
    
  } catch (error) {
    showError(`批量翻译失败: ${error.message}`, elements.batchResult);
    console.error(error);
  } finally {
    setButtonLoading(elements.batchTranslateBtn, false, '批量翻译示例');
  }
}

// 清除缓存
function handleClearCache() {
  if (!aiService) {
    showError('请先初始化服务');
    return;
  }

  aiService.clearCache();
  updateCacheStats();
  showSuccess('缓存已清除');
}

// 显示翻译结果
function displayTranslationResult(result, duration) {
  const html = `
    <div class="result-box success">
      <div class="result-title">✅ 翻译成功</div>
      <div class="result-content">
        <strong>原文:</strong><br>
        ${escapeHtml(result.originalText)}<br><br>
        <strong>译文:</strong><br>
        ${escapeHtml(result.translatedText)}
      </div>
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">提供商:</span>
          <span>${result.provider} (${result.model})</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">Token 使用:</span>
          <span>${result.metadata.tokensUsed} tokens (输入: ${result.metadata.promptTokens}, 输出: ${result.metadata.completionTokens})</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">估算成本:</span>
          <span>$${result.metadata.cost.toFixed(6)}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">耗时:</span>
          <span>${duration}ms</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">语言:</span>
          <span>${result.sourceLang} → ${result.targetLang}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">时间戳:</span>
          <span>${new Date(result.timestamp).toLocaleString()}</span>
        </div>
      </div>
    </div>
  `;
  
  elements.result.innerHTML = html;
}

// 显示批量翻译结果
function displayBatchResults(results, duration) {
  const successCount = results.filter(r => !r.error).length;
  const errorCount = results.filter(r => r.error).length;
  
  let html = `
    <div class="result-box ${errorCount > 0 ? 'error' : 'success'}">
      <div class="result-title">
        ${errorCount > 0 ? '⚠️' : '✅'} 批量翻译完成
      </div>
      <div class="metadata">
        <div class="metadata-item">
          <span class="metadata-label">总数:</span>
          <span>${results.length}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">成功:</span>
          <span>${successCount}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">失败:</span>
          <span>${errorCount}</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">总耗时:</span>
          <span>${duration}ms</span>
        </div>
        <div class="metadata-item">
          <span class="metadata-label">平均耗时:</span>
          <span>${Math.round(duration / results.length)}ms/条</span>
        </div>
      </div>
    </div>
  `;

  // 显示每个结果
  results.forEach((result, index) => {
    if (result.error) {
      html += `
        <div class="result-box error" style="margin-top: 10px;">
          <div class="result-title">❌ 第 ${index + 1} 条失败</div>
          <div class="result-content">
            <strong>原文:</strong> ${escapeHtml(result.originalText)}<br>
            <strong>错误:</strong> ${escapeHtml(result.message)}
          </div>
        </div>
      `;
    } else {
      html += `
        <div class="result-box success" style="margin-top: 10px;">
          <div class="result-title">✅ 第 ${index + 1} 条</div>
          <div class="result-content">
            ${escapeHtml(result.originalText)} → ${escapeHtml(result.translatedText)}
          </div>
        </div>
      `;
    }
  });

  elements.batchResult.innerHTML = html;
}

// 显示提供商信息
function displayProviderInfo(info) {
  const html = `
    <div class="metadata">
      <div class="metadata-item">
        <span class="metadata-label">提供商:</span>
        <span>${info.name}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">模型:</span>
        <span>${info.model}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">API 端点:</span>
        <span>${info.endpoint}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">温度:</span>
        <span>${info.temperature}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">最大 Token:</span>
        <span>${info.maxTokens}</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">定价 (输入):</span>
        <span>$${info.pricing.input}/1K tokens</span>
      </div>
      <div class="metadata-item">
        <span class="metadata-label">定价 (输出):</span>
        <span>$${info.pricing.output}/1K tokens</span>
      </div>
    </div>
  `;
  
  elements.providerInfoContent.innerHTML = html;
  elements.providerInfo.classList.add('show');
  elements.validateBtn.disabled = false;
}

// 更新统计信息
function updateStats(result) {
  if (result.metadata) {
    stats.translations++;
    stats.totalTokens += result.metadata.tokensUsed || 0;
    stats.totalCost += result.metadata.cost || 0;
  }
  
  updateCacheStats();
  
  elements.statTranslations.textContent = stats.translations;
  elements.statTokens.textContent = stats.totalTokens.toLocaleString();
  elements.statCost.textContent = `$${stats.totalCost.toFixed(6)}`;
}

// 更新缓存统计
function updateCacheStats() {
  if (aiService) {
    const cacheStats = aiService.getCacheStats();
    elements.statCache.textContent = cacheStats.size;
  }
}

// 启用/禁用翻译按钮
function enableTranslationButtons(enabled) {
  elements.translateBtn.disabled = !enabled;
  elements.translateRetryBtn.disabled = !enabled;
  elements.clearCacheBtn.disabled = !enabled;
  elements.batchTranslateBtn.disabled = !enabled;
}

// 设置按钮加载状态
function setButtonLoading(button, loading, text) {
  button.disabled = loading;
  if (loading) {
    button.innerHTML = `<span class="spinner"></span><span>${text}</span>`;
  } else {
    button.innerHTML = `<span>${text}</span>`;
  }
}

// 显示错误消息
function showError(message, container = null) {
  const html = `
    <div class="result-box error">
      <div class="result-title">❌ 错误</div>
      <div class="result-content">${escapeHtml(message)}</div>
    </div>
  `;
  
  if (container) {
    container.innerHTML = html;
  } else {
    elements.result.innerHTML = html;
  }
}

// 显示成功消息
function showSuccess(message, container = null) {
  const html = `
    <div class="result-box success">
      <div class="result-title">✅ 成功</div>
      <div class="result-content">${escapeHtml(message)}</div>
    </div>
  `;
  
  if (container) {
    container.innerHTML = html;
  } else {
    elements.result.innerHTML = html;
  }
  
  // 3秒后自动隐藏成功消息
  setTimeout(() => {
    if (container) {
      container.innerHTML = '';
    } else if (elements.result.innerHTML.includes('成功')) {
      elements.result.innerHTML = '';
    }
  }, 3000);
}

// HTML 转义
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  console.log('[AI Translation Test] Page loaded');
  initEventListeners();
  
  // 检查是否有保存的API密钥（用于测试）
  const savedApiKey = sessionStorage.getItem('ai-test-api-key');
  if (savedApiKey) {
    elements.apiKey.value = savedApiKey;
  }
  
  // 保存API密钥到sessionStorage
  elements.apiKey.addEventListener('input', () => {
    sessionStorage.setItem('ai-test-api-key', elements.apiKey.value);
  });
});

console.log('[AI Translation Test] Script loaded');
