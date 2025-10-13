# 翻译服务集成待办事项

## ✅ 已完成

- [x] 设计翻译服务抽象层架构
- [x] 实现 TranslationProvider 抽象基类
- [x] 实现 GoogleTranslateProvider
- [x] 实现 YoudaoTranslateProvider
- [x] 实现 LocalDictionaryProvider
- [x] 实现 TranslationService 管理器
- [x] 实现 TranslationUI 渲染组件
- [x] 实现音频播放功能（TTS + 在线音频）
- [x] 设计标准JSON数据结构
- [x] 创建CSS样式（响应式 + 深色模式）
- [x] 编写集成示例代码
- [x] 创建浏览器测试页面
- [x] 编写完整文档

## 🔄 进行中

### 阶段1: 集成到现有代码 (预计1-2小时)

- [ ] **更新 manifest.json**
  - [ ] 添加 `translation-service.js` 到 content_scripts
  - [ ] 添加 `translation-ui.js` 到 content_scripts
  - [ ] 添加 `translation-ui.css` 到 content_scripts
  - [ ] 确保脚本加载顺序正确

- [ ] **修改 content.js**
  - [ ] 替换 `translateText()` 函数实现
  - [ ] 添加加载状态提示
  - [ ] 添加错误处理
  - [ ] 优化tooltip定位逻辑
  - [ ] 添加关闭按钮
  - [ ] 测试与现有标注功能的兼容性

- [ ] **修改 popup.js**
  - [ ] 添加翻译提供商选择下拉框
  - [ ] 添加音频开关
  - [ ] 添加UI显示选项（词义、例句等）
  - [ ] 保存配置到 chrome.storage

- [ ] **修改 popup.html**
  - [ ] 添加提供商选择UI
  - [ ] 添加音频设置UI
  - [ ] 添加显示选项UI
  - [ ] 优化布局

- [ ] **更新 content.css**
  - [ ] 调整 tooltip 样式以适应新UI
  - [ ] 添加加载动画样式
  - [ ] 确保与 translation-ui.css 兼容

### 阶段2: 测试与优化 (预计1小时)

- [ ] **功能测试**
  - [ ] 测试基础翻译功能
  - [ ] 测试三个提供商切换
  - [ ] 测试音频播放（TTS + 在线）
  - [ ] 测试UI渲染（完整版 + 简化版）
  - [ ] 测试缓存机制
  - [ ] 测试错误处理

- [ ] **兼容性测试**
  - [ ] 测试与标注功能的配合
  - [ ] 测试在不同网页上的表现
  - [ ] 测试在不同浏览器上的表现
  - [ ] 测试深色模式
  - [ ] 测试响应式布局

- [ ] **性能测试**
  - [ ] 测试翻译速度
  - [ ] 测试缓存命中率
  - [ ] 测试内存占用
  - [ ] 测试音频加载速度

- [ ] **用户体验优化**
  - [ ] 优化加载动画
  - [ ] 优化错误提示
  - [ ] 优化tooltip定位算法
  - [ ] 添加快捷键支持
  - [ ] 优化自动关闭时机

### 阶段3: 文档与发布 (预计30分钟)

- [ ] **更新主README**
  - [ ] 添加翻译功能说明
  - [ ] 更新功能列表
  - [ ] 添加使用截图
  - [ ] 更新安装说明

- [ ] **创建CHANGELOG**
  - [ ] 记录本次更新内容
  - [ ] 列出新增功能
  - [ ] 列出改进项目

- [ ] **准备发布**
  - [ ] 更新版本号
  - [ ] 检查所有文件
  - [ ] 打包扩展
  - [ ] 测试打包后的扩展

## 📋 详细步骤

### Step 1: 更新 manifest.json

```json
{
  "manifest_version": 3,
  "name": "Annotate Translate",
  "version": "2.0.0",
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": [
        "translation-service.js",
        "translation-ui.js",
        "content.js"
      ],
      "css": [
        "translation-ui.css",
        "content.css"
      ],
      "run_at": "document_end"
    }
  ]
}
```

### Step 2: 修改 content.js

在文件开头添加初始化代码：

```javascript
// 初始化翻译服务配置
async function initTranslationService() {
  const config = await new Promise((resolve) => {
    chrome.storage.sync.get({
      translationProvider: 'google',
      enableAudio: true,
      showDefinitions: true,
      showExamples: true
    }, resolve);
  });
  
  translationService.setActiveProvider(config.translationProvider);
  window.translationUIConfig = config;
}

// 在 init() 函数中调用
function init() {
  console.log('[Annotate-Translate] Content script loaded');
  loadSettings();
  initTranslationService();
  // ... 其他初始化代码
}
```

替换 `translateText()` 函数：

```javascript
async function translateText(text) {
  console.log('[Annotate-Translate] Translating:', text);
  hideContextMenu();
  
  // 移除旧tooltip
  const oldTooltip = document.querySelector('.annotate-translate-tooltip');
  if (oldTooltip) {
    oldTooltip.remove();
  }

  try {
    // 显示加载状态
    const loadingTooltip = createLoadingTooltip();
    document.body.appendChild(loadingTooltip);
    positionTooltip(loadingTooltip);

    // 执行翻译
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );

    // 移除加载tooltip
    loadingTooltip.remove();

    // 创建翻译结果UI
    const ui = new TranslationUI(window.translationUIConfig || {
      enableAudio: true,
      showDefinitions: true,
      showExamples: true,
      maxExamples: 2
    });

    // 根据文本长度选择UI模式
    const resultElement = text.length > 50 
      ? ui.renderSimple(result)
      : ui.render(result);

    resultElement.classList.add('annotate-translate-tooltip');
    
    // 添加关闭按钮
    const closeButton = document.createElement('button');
    closeButton.className = 'translation-close-button';
    closeButton.innerHTML = '✕';
    closeButton.title = 'Close';
    closeButton.addEventListener('click', () => {
      resultElement.remove();
      ui.cleanup();
    });
    resultElement.appendChild(closeButton);

    // 显示
    document.body.appendChild(resultElement);
    positionTooltip(resultElement);

    // 自动关闭
    setTimeout(() => {
      if (resultElement.parentNode) {
        resultElement.remove();
        ui.cleanup();
      }
    }, 10000);

  } catch (error) {
    console.error('[Annotate-Translate] Translation error:', error);
    
    // 显示错误提示
    const errorTooltip = document.createElement('div');
    errorTooltip.className = 'annotate-translate-tooltip error';
    errorTooltip.textContent = 'Translation failed. Please try again.';
    document.body.appendChild(errorTooltip);
    positionTooltip(errorTooltip);
    
    setTimeout(() => errorTooltip.remove(), 3000);
  }
}

// 辅助函数：创建加载tooltip
function createLoadingTooltip() {
  const tooltip = document.createElement('div');
  tooltip.className = 'annotate-translate-tooltip loading';
  tooltip.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <div class="loading-spinner"></div>
      <div>Translating...</div>
    </div>
  `;
  return tooltip;
}

// 辅助函数：定位tooltip
function positionTooltip(tooltip) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    tooltip.style.position = 'absolute';
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.bottom + window.scrollY + 10) + 'px';
    tooltip.style.zIndex = '10000';
    
    // 确保不超出视口
    setTimeout(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      
      if (tooltipRect.right > window.innerWidth) {
        tooltip.style.left = (window.innerWidth - tooltipRect.width - 10) + 'px';
      }
      
      if (tooltipRect.bottom > window.innerHeight) {
        tooltip.style.top = (rect.top + window.scrollY - tooltipRect.height - 10) + 'px';
      }
    }, 0);
  }
}
```

### Step 3: 修改 popup.html

在 `<div class="settings">` 中添加新设置：

```html
<!-- 翻译提供商选择 -->
<div class="setting-item">
  <label for="translation-provider">Translation Provider:</label>
  <select id="translation-provider">
    <option value="google">Google Translate</option>
    <option value="youdao">Youdao</option>
    <option value="local">Local Dictionary</option>
  </select>
</div>

<!-- 音频设置 -->
<div class="setting-item">
  <label>
    <input type="checkbox" id="enable-audio" checked>
    Enable Audio Pronunciation
  </label>
</div>

<!-- 显示选项 -->
<div class="setting-item">
  <label>
    <input type="checkbox" id="show-definitions" checked>
    Show Definitions
  </label>
</div>

<div class="setting-item">
  <label>
    <input type="checkbox" id="show-examples" checked>
    Show Examples
  </label>
</div>
```

### Step 4: 修改 popup.js

更新加载和保存设置：

```javascript
function loadSettings() {
  chrome.storage.sync.get({
    enableTranslate: false,
    enableAnnotate: true,
    targetLanguage: 'en',
    translationProvider: 'google',
    enableAudio: true,
    showDefinitions: true,
    showExamples: true
  }, function(items) {
    document.getElementById('enable-translate').checked = items.enableTranslate;
    document.getElementById('enable-annotate').checked = items.enableAnnotate;
    document.getElementById('target-language').value = items.targetLanguage;
    document.getElementById('translation-provider').value = items.translationProvider;
    document.getElementById('enable-audio').checked = items.enableAudio;
    document.getElementById('show-definitions').checked = items.showDefinitions;
    document.getElementById('show-examples').checked = items.showExamples;
  });
}

function saveSettings() {
  const settings = {
    enableTranslate: document.getElementById('enable-translate').checked,
    enableAnnotate: document.getElementById('enable-annotate').checked,
    targetLanguage: document.getElementById('target-language').value,
    translationProvider: document.getElementById('translation-provider').value,
    enableAudio: document.getElementById('enable-audio').checked,
    showDefinitions: document.getElementById('show-definitions').checked,
    showExamples: document.getElementById('show-examples').checked
  };

  chrome.storage.sync.set(settings, function() {
    // 显示保存成功消息
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    status.className = 'status success';
    
    // 通知content script更新设置
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs[0] && isValidTabUrl(tabs[0].url)) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'updateSettings',
          settings: settings
        });
      }
    });

    setTimeout(() => {
      status.textContent = '';
      status.className = 'status';
    }, 3000);
  });
}
```

### Step 5: 更新 content.css

添加新样式：

```css
/* 加载动画 */
.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 关闭按钮 */
.translation-close-button {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  transition: all 0.2s;
}

.translation-close-button:hover {
  background: rgba(0, 0, 0, 0.2);
  transform: scale(1.1);
}

/* 错误状态 */
.annotate-translate-tooltip.error {
  background: #f44336;
  color: white;
}

/* 加载状态 */
.annotate-translate-tooltip.loading {
  background: white;
  padding: 12px 16px;
}
```

## 🧪 测试清单

### 基础功能测试

- [ ] 翻译单词（如 "apple"）
- [ ] 翻译句子（如 "Hello world"）
- [ ] 翻译段落（多行文本）
- [ ] 切换目标语言
- [ ] 切换提供商（Google/Youdao/Local）

### UI测试

- [ ] 完整版UI显示正确
- [ ] 简化版UI显示正确
- [ ] 读音按钮可点击
- [ ] 音频播放正常
- [ ] 关闭按钮工作正常
- [ ] 自动关闭功能正常

### 兼容性测试

- [ ] 与标注功能不冲突
- [ ] 在不同网站上正常工作
- [ ] Chrome浏览器测试
- [ ] Edge浏览器测试
- [ ] 深色网页上显示正常
- [ ] 明亮网页上显示正常

### 错误处理测试

- [ ] 无网络时的表现
- [ ] API限流时的表现
- [ ] 不支持的语言对
- [ ] 超长文本处理
- [ ] 特殊字符处理

## 📊 性能指标

目标值：
- [ ] 首次翻译响应时间 < 2秒
- [ ] 缓存命中后响应时间 < 100ms
- [ ] UI渲染时间 < 50ms
- [ ] 音频播放延迟 < 500ms
- [ ] 内存占用 < 50MB

## 🐛 已知问题

记录在此：

1. 

## 💡 未来改进

- [ ] 添加更多翻译提供商（百度、DeepL等）
- [ ] 支持离线词典（大型词库）
- [ ] 添加翻译历史记录
- [ ] 支持导出翻译历史
- [ ] 添加单词本功能
- [ ] 支持自定义快捷键
- [ ] 添加划词翻译功能
- [ ] 优化音频质量
- [ ] 支持语音输入
- [ ] 添加OCR图片翻译

## 📝 注意事项

1. **脚本加载顺序很重要**：translation-service.js 必须在 translation-ui.js 之前加载
2. **缓存策略**：默认缓存100条结果，可根据需要调整
3. **音频播放**：某些网站可能阻止自动播放音频
4. **API限制**：Google Translate 公共API有请求限制，生产环境建议使用官方API
5. **隐私保护**：不要翻译密码、邮箱等敏感信息
6. **性能考虑**：批量翻译时添加适当延迟
7. **错误处理**：始终提供用户友好的错误提示

## 🎯 本周目标

- [ ] 完成阶段1（集成到现有代码）
- [ ] 完成阶段2（测试与优化）
- [ ] 完成阶段3（文档与发布）

---

**开始集成吧！** 按照上面的步骤一步步来，遇到问题随时查阅相关文档。加油！💪
