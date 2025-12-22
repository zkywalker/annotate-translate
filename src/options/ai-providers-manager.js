/**
 * AI Providers Manager
 * 管理多个 OpenAI 兼容的 API 提供商
 */

class AIProvidersManager {
  constructor() {
    this.providers = [];
    this.currentProviderId = null;
    this.modal = null;
    this.editingProviderId = null;

    this.init();
  }

  async init() {
    // 加载设置
    await this.loadSettings();

    // 初始化 UI
    this.initUI();

    // 绑定事件
    this.bindEvents();

    // 渲染列表
    this.renderProvidersList();
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(null, (settings) => {
        this.providers = settings.providers?.aiProviders || [];
        this.currentProviderId = settings.providers?.currentAIProvider || null;

        // 如果没有提供商，添加一个默认的
        if (this.providers.length === 0) {
          this.providers = [{
            id: 'openai-default',
            name: 'OpenAI',
            enabled: true,
            apiKey: '',
            model: 'gpt-3.5-turbo',
            baseUrl: 'https://api.openai.com/v1',
            temperature: 0.3,
            maxTokens: 500,
            timeout: 30,
            promptFormat: 'jsonFormat',
            useContext: true,
            customTemplates: null,
            connectionStatus: null,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }];
          this.currentProviderId = 'openai-default';
        }

        resolve();
      });
    });
  }

  async saveSettings() {
    return new Promise((resolve) => {
      // 先读取现有的 providers 配置
      chrome.storage.sync.get(['providers'], (result) => {
        const providers = result.providers || {};

        // 更新 AI 提供商相关的配置
        providers.aiProviders = this.providers;
        providers.currentAIProvider = this.currentProviderId;

        // 保存更新后的配置
        chrome.storage.sync.set({ providers }, () => {
          console.log('[AI Providers] Settings saved', {
            aiProviders: this.providers,
            currentAIProvider: this.currentProviderId
          });

          this.showSaveIndicator();

          // 通知所有 content scripts 更新设置
          this.notifyContentScripts();

          resolve();
        });
      });
    });
  }

  notifyContentScripts() {
    // 向所有标签页发送设置更新消息
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'updateSettings'
        }).catch(() => {
          // 忽略错误（某些页面可能没有 content script）
        });
      });
    });
  }

  initUI() {
    this.modal = document.getElementById('aiProviderModal');
  }

  bindEvents() {
    // 添加提供商按钮
    document.getElementById('addAIProvider')?.addEventListener('click', () => {
      this.showModal();
    });

    // 关闭模态框
    document.getElementById('closeAIProviderModal')?.addEventListener('click', () => {
      this.hideModal();
    });

    document.getElementById('cancelAIProvider')?.addEventListener('click', () => {
      this.hideModal();
    });

    // 保存提供商
    document.getElementById('saveAIProvider')?.addEventListener('click', () => {
      this.saveProvider();
    });

    // 测试连接
    document.getElementById('testAIProviderConnection')?.addEventListener('click', () => {
      this.testConnection();
    });

    // 点击模态框外部关闭
    this.modal?.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hideModal();
      }
    });
  }

  renderProvidersList() {
    const container = document.getElementById('aiProvidersList');
    const emptyState = document.getElementById('noProvidersMessage');

    if (!container) return;

    if (this.providers.length === 0) {
      container.innerHTML = '';
      emptyState.style.display = 'block';
      return;
    }

    emptyState.style.display = 'none';

    container.innerHTML = this.providers.map(provider => this.renderProviderCard(provider)).join('');

    // 绑定卡片事件
    this.bindCardEvents();

    // 初始化 Lucide 图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  renderProviderCard(provider) {
    const isActive = provider.id === this.currentProviderId;
    const status = this.getProviderStatus(provider);

    return `
      <div class="provider-card ${isActive ? 'active' : ''}" data-provider-id="${provider.id}">
        <div class="provider-card-header">
          <div class="provider-card-title">
            <h4 class="provider-card-name">
              ${this.escapeHtml(provider.name)}
              ${isActive ? '<span class="badge">当前使用</span>' : ''}
            </h4>
            <p class="provider-card-meta">${this.escapeHtml(provider.model)} · ${this.escapeHtml(provider.baseUrl)}</p>
          </div>
          <div class="provider-card-actions">
            ${!isActive ? `<button class="btn btn-sm btn-secondary" data-action="use" data-provider-id="${provider.id}">
              <i data-lucide="check-circle" width="14" height="14"></i>
              <span>使用</span>
            </button>` : ''}
            <button class="btn btn-sm btn-secondary" data-action="edit" data-provider-id="${provider.id}">
              <i data-lucide="edit" width="14" height="14"></i>
              <span>编辑</span>
            </button>
            <button class="btn btn-sm btn-secondary" data-action="test" data-provider-id="${provider.id}">
              <i data-lucide="zap" width="14" height="14"></i>
              <span>测试</span>
            </button>
            ${this.providers.length > 1 ? `<button class="btn btn-sm btn-danger" data-action="delete" data-provider-id="${provider.id}">
              <i data-lucide="trash-2" width="14" height="14"></i>
            </button>` : ''}
          </div>
        </div>

        <div class="provider-card-body">
          <div class="provider-detail-item">
            <div class="provider-detail-label">API Key</div>
            <div class="provider-detail-value masked" data-provider-id="${provider.id}" data-field="apiKey">
              ${provider.apiKey ? '*'.repeat(20) : '未设置'}
            </div>
          </div>
          <div class="provider-detail-item">
            <div class="provider-detail-label">Temperature</div>
            <div class="provider-detail-value">${provider.temperature}</div>
          </div>
          <div class="provider-detail-item">
            <div class="provider-detail-label">Max Tokens</div>
            <div class="provider-detail-value">${provider.maxTokens}</div>
          </div>
          <div class="provider-detail-item">
            <div class="provider-detail-label">格式</div>
            <div class="provider-detail-value">${provider.promptFormat === 'jsonFormat' ? 'JSON' : '简单'}</div>
          </div>
        </div>

        <div class="provider-card-footer">
          <div class="provider-status ${status.class}">
            <span class="provider-status-dot"></span>
            <span>${status.text}</span>
          </div>
          <div class="provider-card-meta">
            创建于 ${new Date(provider.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    `;
  }

  bindCardEvents() {
    // 使用提供商
    document.querySelectorAll('[data-action="use"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const providerId = e.currentTarget.dataset.providerId;
        this.useProvider(providerId);
      });
    });

    // 编辑提供商
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const providerId = e.currentTarget.dataset.providerId;
        this.editProvider(providerId);
      });
    });

    // 测试连接
    document.querySelectorAll('[data-action="test"]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const providerId = e.currentTarget.dataset.providerId;
        const provider = this.providers.find(p => p.id === providerId);
        if (provider) {
          await this.testProviderConnection(provider, e.currentTarget);
        }
      });
    });

    // 删除提供商
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const providerId = e.currentTarget.dataset.providerId;
        this.deleteProvider(providerId);
      });
    });

    // 显示/隐藏 API Key
    document.querySelectorAll('.provider-detail-value.masked').forEach(el => {
      el.addEventListener('click', () => {
        const providerId = el.dataset.providerId;
        const provider = this.providers.find(p => p.id === providerId);
        if (provider && provider.apiKey) {
          el.textContent = el.textContent.startsWith('*') ? provider.apiKey : '*'.repeat(20);
        }
      });
    });
  }

  showModal(provider = null) {
    this.editingProviderId = provider?.id || null;

    // 设置标题
    const title = provider ? '编辑 AI 提供商' : '添加 AI 提供商';
    document.getElementById('aiProviderModalTitle').textContent = title;

    // 填充表单
    if (provider) {
      document.getElementById('aiProviderId').value = provider.id;
      document.getElementById('aiProviderName').value = provider.name;
      document.getElementById('aiProviderApiKey').value = provider.apiKey;
      document.getElementById('aiProviderModel').value = provider.model;
      document.getElementById('aiProviderBaseUrl').value = provider.baseUrl;
      document.getElementById('aiProviderTemperature').value = provider.temperature;
      document.getElementById('aiProviderMaxTokens').value = provider.maxTokens;
      document.getElementById('aiProviderTimeout').value = provider.timeout;
      document.getElementById('aiProviderPromptFormat').value = provider.promptFormat;
      document.getElementById('aiProviderUseContext').checked = provider.useContext;
    } else {
      // 清空表单
      document.getElementById('aiProviderId').value = '';
      document.getElementById('aiProviderName').value = '';
      document.getElementById('aiProviderApiKey').value = '';
      document.getElementById('aiProviderModel').value = 'gpt-3.5-turbo';
      document.getElementById('aiProviderBaseUrl').value = 'https://api.openai.com/v1';
      document.getElementById('aiProviderTemperature').value = '0.3';
      document.getElementById('aiProviderMaxTokens').value = '500';
      document.getElementById('aiProviderTimeout').value = '30';
      document.getElementById('aiProviderPromptFormat').value = 'jsonFormat';
      document.getElementById('aiProviderUseContext').checked = true;
    }

    this.modal.style.display = 'flex';

    // 初始化图标
    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  hideModal() {
    this.modal.style.display = 'none';
    this.editingProviderId = null;
  }

  async saveProvider() {
    const name = document.getElementById('aiProviderName').value.trim();
    const apiKey = document.getElementById('aiProviderApiKey').value.trim();
    const model = document.getElementById('aiProviderModel').value.trim();
    const baseUrl = document.getElementById('aiProviderBaseUrl').value.trim();

    // 验证必填字段
    if (!name || !apiKey || !model || !baseUrl) {
      alert('请填写所有必填字段！');
      return;
    }

    const providerData = {
      name,
      apiKey,
      model,
      baseUrl,
      temperature: parseFloat(document.getElementById('aiProviderTemperature').value),
      maxTokens: parseInt(document.getElementById('aiProviderMaxTokens').value),
      timeout: parseInt(document.getElementById('aiProviderTimeout').value),
      promptFormat: document.getElementById('aiProviderPromptFormat').value,
      useContext: document.getElementById('aiProviderUseContext').checked,
      customTemplates: null,
      connectionStatus: null,
      enabled: true
    };

    if (this.editingProviderId) {
      // 编辑现有提供商
      const index = this.providers.findIndex(p => p.id === this.editingProviderId);
      if (index !== -1) {
        this.providers[index] = {
          ...this.providers[index],
          ...providerData,
          updatedAt: Date.now()
        };
      }
    } else {
      // 添加新提供商
      const newProvider = {
        id: 'ai-' + Date.now(),
        ...providerData,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      this.providers.push(newProvider);

      // 如果是第一个提供商，设为当前使用
      if (this.providers.length === 1) {
        this.currentProviderId = newProvider.id;
      }
    }

    await this.saveSettings();
    this.renderProvidersList();
    this.hideModal();
  }

  async useProvider(providerId) {
    this.currentProviderId = providerId;
    await this.saveSettings();
    this.renderProvidersList();

    // 同时将 providers.current 设为 'openai' (所有 AI 提供商都使用 openai provider)
    chrome.storage.sync.get(['providers'], (result) => {
      const providers = result.providers || {};
      providers.current = 'openai';
      chrome.storage.sync.set({ providers }, () => {
        console.log('[AI Providers] Provider set to openai');
      });
    });
  }

  editProvider(providerId) {
    const provider = this.providers.find(p => p.id === providerId);
    if (provider) {
      this.showModal(provider);
    }
  }

  async deleteProvider(providerId) {
    if (!confirm('确定要删除这个 AI 提供商吗？')) {
      return;
    }

    this.providers = this.providers.filter(p => p.id !== providerId);

    // 如果删除的是当前使用的，切换到第一个
    if (this.currentProviderId === providerId && this.providers.length > 0) {
      this.currentProviderId = this.providers[0].id;
    }

    await this.saveSettings();
    this.renderProvidersList();
  }

  async testConnection() {
    const apiKey = document.getElementById('aiProviderApiKey').value.trim();
    const model = document.getElementById('aiProviderModel').value.trim();
    const baseUrl = document.getElementById('aiProviderBaseUrl').value.trim();

    if (!apiKey || !model || !baseUrl) {
      alert('请先填写 API Key、Model 和 Base URL');
      return;
    }

    const btn = document.getElementById('testAIProviderConnection');
    const originalText = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader" width="16" height="16"></i> <span>测试中...</span>';

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    try {
      const endpoint = `${baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "test successful" in one word' }
          ],
          max_tokens: 10
        })
      });

      if (response.ok) {
        alert('✅ 连接测试成功！API 配置正确。');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`❌ 连接测试失败：${error.error?.message || response.statusText}`);
      }
    } catch (error) {
      alert(`❌ 连接测试失败：${error.message}`);
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalText;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  async testProviderConnection(provider, button) {
    const originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i data-lucide="loader" width="14" height="14"></i> <span>测试中...</span>';

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }

    try {
      const endpoint = `${provider.baseUrl}/chat/completions`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "test successful" in one word' }
          ],
          max_tokens: 10
        })
      });

      // 更新连接状态
      provider.connectionStatus = {
        tested: true,
        success: response.ok,
        timestamp: Date.now(),
        error: response.ok ? null : `HTTP ${response.status}`
      };

      await this.saveSettings();
      this.renderProvidersList();

      if (response.ok) {
        alert('✅ 连接测试成功！');
      } else {
        const error = await response.json().catch(() => ({}));
        alert(`❌ 连接测试失败：${error.error?.message || response.statusText}`);
      }
    } catch (error) {
      provider.connectionStatus = {
        tested: true,
        success: false,
        timestamp: Date.now(),
        error: error.message
      };
      await this.saveSettings();
      this.renderProvidersList();
      alert(`❌ 连接测试失败：${error.message}`);
    } finally {
      button.disabled = false;
      button.innerHTML = originalText;
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  getProviderStatus(provider) {
    if (!provider.connectionStatus || !provider.connectionStatus.tested) {
      return { class: 'untested', text: '未测试' };
    }

    if (provider.connectionStatus.success) {
      return { class: 'success', text: '连接正常' };
    }

    return {
      class: 'error',
      text: `连接失败: ${provider.connectionStatus.error || '未知错误'}`
    };
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showSaveIndicator() {
    const indicator = document.getElementById('saveIndicator');
    if (indicator) {
      indicator.classList.add('show');
      setTimeout(() => {
        indicator.classList.remove('show');
      }, 2000);
    }
  }
}

// 在页面加载时初始化
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    window.aiProvidersManager = new AIProvidersManager();
  });
}
