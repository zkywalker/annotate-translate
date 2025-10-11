// Content Script for Annotate Translate Extension

let settings = {
  enableTranslate: false,
  enableAnnotate: true,
  targetLanguage: 'zh-CN',
  translationProvider: 'debug',
  enableAudio: true,
  showPhonetics: true,
  showDefinitions: true,
  showExamples: true,
  maxExamples: 3,
  enableCache: true,
  cacheSize: 100,
  debugMode: false,
  showConsoleLogs: false
};

let annotations = new Map();
let lastSelection = null; // 保存最后一次选择的Range
let translationUI = null; // TranslationUI实例
let currentTooltip = null; // 当前显示的翻译卡片

// Initialize the extension
init();

function init() {
  console.log('[Annotate-Translate] Content script loaded on:', window.location.href);
  
  // 检查翻译服务是否可用
  if (typeof translationService === 'undefined') {
    console.error('[Annotate-Translate] Translation service not loaded!');
    return;
  }
  
  console.log('[Annotate-Translate] Translation service available:', translationService);
  
  // Load settings from storage
  chrome.storage.sync.get({
    enableTranslate: false,
    enableAnnotate: true,
    targetLanguage: 'zh-CN',
    translationProvider: 'debug',
    enableAudio: true,
    showPhonetics: true,
    showDefinitions: true,
    showExamples: true,
    maxExamples: 3,
    showPhoneticInAnnotation: true,
    enableCache: true,
    cacheSize: 100,
    debugMode: false,
    showConsoleLogs: false
  }, function(items) {
    settings = items;
    console.log('[Annotate-Translate] Settings loaded:', settings);
    
    // 应用设置到翻译服务
    applyTranslationSettings();
  });

  // 初始化TranslationUI
  initializeTranslationUI();

  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
}

// 初始化TranslationUI
function initializeTranslationUI() {
  if (typeof TranslationUI === 'undefined') {
    console.error('[Annotate-Translate] TranslationUI not loaded!');
    return;
  }
  
  translationUI = new TranslationUI({
    showPhonetics: settings.showPhonetics,
    showDefinitions: settings.showDefinitions,
    showExamples: settings.showExamples,
    maxExamples: settings.maxExamples,
    enableAudio: settings.enableAudio
  });
  
  console.log('[Annotate-Translate] TranslationUI initialized');
}

// 应用翻译设置
function applyTranslationSettings() {
  if (typeof translationService === 'undefined') {
    console.error('[Annotate-Translate] Translation service not available');
    return;
  }
  
  // 设置活跃的翻译提供商
  if (settings.translationProvider) {
    translationService.setActiveProvider(settings.translationProvider);
    console.log('[Annotate-Translate] Provider set to:', settings.translationProvider);
    
    // 如果是 Debug 提供商，更新其配置
    if (settings.translationProvider === 'debug') {
      const debugProvider = translationService.providers.get('debug');
      if (debugProvider) {
        debugProvider.showPhoneticInAnnotation = settings.showPhoneticInAnnotation !== false;
        console.log('[Annotate-Translate] Debug provider configured - showPhoneticInAnnotation:', debugProvider.showPhoneticInAnnotation);
      }
    }
  }
  
  // 配置缓存
  if (settings.enableCache) {
    translationService.enableCache(settings.cacheSize || 100);
  } else {
    translationService.disableCache();
  }
  
  // 重新初始化UI（如果设置改变）
  if (translationUI) {
    translationUI = new TranslationUI({
      showPhonetics: settings.showPhonetics,
      showDefinitions: settings.showDefinitions,
      showExamples: settings.showExamples,
      maxExamples: settings.maxExamples,
      enableAudio: settings.enableAudio
    });
  }
}

// Handle text selection events
function handleTextSelection(event) {
  // 如果点击在悬浮窗内，不处理
  if (event.target.closest('.annotate-translate-menu')) {
    return;
  }
  
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText && (settings.enableTranslate || settings.enableAnnotate)) {
    // 保存当前选择的Range
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      lastSelection = selection.getRangeAt(0).cloneRange();
    }
    showContextMenu(event.pageX, event.pageY, selectedText);
  } else {
    hideContextMenu();
    lastSelection = null;
  }
}

// Show context menu for selected text
function showContextMenu(x, y, text) {
  hideContextMenu();
  
  const menu = document.createElement('div');
  menu.id = 'annotate-translate-menu';
  menu.className = 'annotate-translate-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  if (settings.enableTranslate) {
    const translateBtn = document.createElement('button');
    translateBtn.textContent = 'T';
    translateBtn.className = 'menu-button';
    translateBtn.title = 'Translate'; // 悬停提示
    translateBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault();  // 阻止默认行为
      console.log('[Annotate-Translate] Translate button clicked');
      hideContextMenu();
      translateText(text);
    });
    menu.appendChild(translateBtn);
  }

  if (settings.enableAnnotate) {
    const annotateBtn = document.createElement('button');
    annotateBtn.textContent = 'A';
    annotateBtn.className = 'menu-button';
    annotateBtn.title = 'Annotate'; // 悬停提示
    annotateBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // 阻止事件冒泡
      e.preventDefault();  // 阻止默认行为
      console.log('[Annotate-Translate] Annotate button clicked');
      hideContextMenu();
      // 使用改进的标注方法（支持批量标注和精确定位）
      annotateSelectedText(text);
    });
    menu.appendChild(annotateBtn);
  }

  document.body.appendChild(menu);

  // 阻止菜单本身的点击事件冒泡
  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Hide menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 100);
}

// Hide context menu
function hideContextMenu() {
  const menu = document.getElementById('annotate-translate-menu');
  if (menu) {
    menu.remove();
  }
}

// Translate selected text
async function translateText(text) {
  hideContextMenu();
  
  // 移除之前的翻译卡片
  if (currentTooltip) {
    currentTooltip.remove();
    currentTooltip = null;
  }
  
  // 创建加载提示
  const loadingTooltip = document.createElement('div');
  loadingTooltip.className = 'annotate-translate-tooltip loading';
  loadingTooltip.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <span>Translating...</span>
    </div>
  `;
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    loadingTooltip.style.left = (rect.left + window.scrollX) + 'px';
    loadingTooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  }
  
  document.body.appendChild(loadingTooltip);
  currentTooltip = loadingTooltip;

  try {
    // 使用翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    if (settings.debugMode && settings.showConsoleLogs) {
      console.log('[Annotate-Translate] Translating:', text, 'to', settings.targetLanguage);
    }
    
    // 调用翻译服务
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );
    
    if (settings.debugMode && settings.showConsoleLogs) {
      console.log('[Annotate-Translate] Translation result:', result);
    }
    
    // 移除加载提示
    loadingTooltip.remove();
    
    // 使用TranslationUI渲染结果
    if (!translationUI) {
      initializeTranslationUI();
    }
    
    // 根据文本长度选择UI模式
    const element = text.length > 50 
      ? translationUI.renderSimple(result)
      : translationUI.render(result);
    
    // 定位翻译卡片
    element.className += ' annotate-translate-tooltip';
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      element.style.left = (rect.left + window.scrollX) + 'px';
      element.style.top = (rect.bottom + window.scrollY + 5) + 'px';
    }
    
    document.body.appendChild(element);
    currentTooltip = element;
    
    // 添加关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'translation-close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => {
      element.remove();
      currentTooltip = null;
    });
    element.appendChild(closeBtn);
    
    // 自动关闭（如果配置了）
    if (settings.autoCloseDelay && settings.autoCloseDelay > 0) {
      setTimeout(() => {
        if (element.parentElement) {
          element.remove();
          if (currentTooltip === element) {
            currentTooltip = null;
          }
        }
      }, settings.autoCloseDelay * 1000);
    }
    
    // 点击外部关闭
    setTimeout(() => {
      const closeHandler = (e) => {
        if (!element.contains(e.target)) {
          element.remove();
          currentTooltip = null;
          document.removeEventListener('click', closeHandler);
        }
      };
      document.addEventListener('click', closeHandler);
    }, 100);
    
  } catch (error) {
    console.error('[Annotate-Translate] Translation failed:', error);
    
    // 显示错误消息
    loadingTooltip.className = 'annotate-translate-tooltip error';
    loadingTooltip.innerHTML = `
      <div class="error-content">
        <span class="error-icon">⚠️</span>
        <div class="error-message">
          <strong>Translation failed</strong>
          <p>${error.message}</p>
        </div>
      </div>
    `;
    
    // 3秒后自动关闭错误提示
    setTimeout(() => {
      if (loadingTooltip.parentElement) {
        loadingTooltip.remove();
      }
      if (currentTooltip === loadingTooltip) {
        currentTooltip = null;
      }
    }, 3000);
  }
}

// Annotate selected text
// Create ruby annotation for context menu action
function annotateSelectedText(text) {
  console.log('[Annotate-Translate] Annotating selected text:', text);
  
  // 使用保存的Range，如果有的话
  if (lastSelection) {
    try {
      // 验证Range是否仍然有效
      const selectedText = lastSelection.toString();
      if (selectedText === text) {
        console.log('[Annotate-Translate] Using saved range');
        promptAndAnnotate(lastSelection, text);
        return;
      } else {
        console.log('[Annotate-Translate] Saved range text mismatch:', selectedText, 'vs', text);
      }
    } catch (e) {
      console.error('[Annotate-Translate] Saved range is invalid:', e);
    }
  }
  
  // 如果没有保存的Range或Range无效，尝试查找文本
  console.log('[Annotate-Translate] Searching for text in DOM');
  findAndAnnotateText(text);
}

// 查找并标注文本（用于右键菜单）
function findAndAnnotateText(text) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script and style elements
        if (node.parentElement.tagName === 'SCRIPT' || 
            node.parentElement.tagName === 'STYLE' ||
            node.parentElement.closest('ruby.annotate-translate-ruby')) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.nodeValue.includes(text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  const matches = [];
  let node;
  while (node = walker.nextNode()) {
    const nodeText = node.nodeValue;
    let index = nodeText.indexOf(text);
    while (index !== -1) {
      matches.push({
        node: node,
        index: index,
        text: text
      });
      index = nodeText.indexOf(text, index + 1);
    }
  }
  
  if (matches.length === 0) {
    alert('Could not find the selected text on the page.');
    return;
  }
  
  console.log(`[Annotate-Translate] Found ${matches.length} match(es)`);
  
  // 如果只有一个匹配，直接标注
  if (matches.length === 1) {
    const match = matches[0];
    const range = document.createRange();
    range.setStart(match.node, match.index);
    range.setEnd(match.node, match.index + match.text.length);
    promptAndAnnotate(range, text);
  } else {
    // 多个匹配，询问用户
    promptForMultipleMatches(matches, text);
  }
}

// 处理多个匹配的情况
function promptForMultipleMatches(matches, text) {
  // 创建一个更友好的对话框
  const dialog = document.createElement('div');
  dialog.className = 'annotate-translate-dialog';
  dialog.innerHTML = `
    <div class="dialog-content">
      <h3>Multiple matches found</h3>
      <p>Found <strong>${matches.length}</strong> occurrences of "<strong>${escapeHtml(text)}</strong>"</p>
      <div class="dialog-buttons">
        <button class="dialog-btn dialog-btn-primary" data-action="first">
          Annotate First Only
        </button>
        <button class="dialog-btn dialog-btn-success" data-action="all">
          Annotate All (${matches.length})
        </button>
        <button class="dialog-btn dialog-btn-secondary" data-action="cancel">
          Cancel
        </button>
      </div>
    </div>
    <div class="dialog-overlay"></div>
  `;
  
  document.body.appendChild(dialog);
  
  // 处理按钮点击
  dialog.addEventListener('click', function(e) {
    const btn = e.target.closest('.dialog-btn');
    if (!btn) return;
    
    const action = btn.dataset.action;
    dialog.remove();
    
    if (action === 'first') {
      // 只标注第一个
      const match = matches[0];
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + match.text.length);
      promptAndAnnotate(range, text);
    } else if (action === 'all') {
      // 标注所有
      promptForBatchAnnotation(matches, text);
    }
  });
  
  // 点击遮罩层关闭
  dialog.querySelector('.dialog-overlay').addEventListener('click', function() {
    dialog.remove();
  });
}

// HTML转义函数
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 标注所有匹配项
function annotateAllMatches(matches, text, annotation) {
  let successCount = 0;
  
  // 从后往前标注，避免DOM变化影响后续的索引
  for (let i = matches.length - 1; i >= 0; i--) {
    const match = matches[i];
    try {
      // 重新验证节点是否仍然有效
      if (!document.contains(match.node)) {
        console.warn('[Annotate-Translate] Node no longer in document, skipping');
        continue;
      }
      
      const range = document.createRange();
      range.setStart(match.node, match.index);
      range.setEnd(match.node, match.index + match.text.length);
      createRubyAnnotation(range, text, annotation);
      successCount++;
    } catch (e) {
      console.error('[Annotate-Translate] Failed to annotate match:', e);
    }
  }
  
  console.log(`[Annotate-Translate] Successfully annotated ${successCount}/${matches.length} occurrences`);
  
  if (successCount < matches.length) {
    alert(`Annotated ${successCount} out of ${matches.length} occurrences.\nSome annotations may have failed.`);
  }
}

// 批量自动翻译标注
async function promptForBatchAnnotation(matches, text) {
  try {
    // 检查翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    console.log('[Annotate-Translate] Batch auto-annotating:', text, `(${matches.length} occurrences)`);
    
    // 调用翻译服务
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );
    
    // 使用 annotationText（可能包含读音）或 translatedText 作为标注
    const annotationText = result.annotationText || result.translatedText;
    
    // 使用翻译结果标注所有匹配项
    annotateAllMatches(matches, text, annotationText);
    
    console.log('[Annotate-Translate] Batch auto-annotated with:', annotationText);
    
  } catch (error) {
    console.error('[Annotate-Translate] Auto-translate failed:', error);
    alert('Auto-translation failed: ' + error.message);
  }
}

// 自动翻译并标注
async function promptAndAnnotate(range, text) {
  try {
    // 检查翻译服务
    if (typeof translationService === 'undefined') {
      throw new Error('Translation service not available');
    }
    
    console.log('[Annotate-Translate] Auto-annotating:', text);
    
    // 调用翻译服务
    const result = await translationService.translate(
      text,
      settings.targetLanguage || 'zh-CN',
      'auto'
    );
    
    // 使用 annotationText（可能包含读音）或 translatedText 作为标注
    const annotationText = result.annotationText || result.translatedText;
    
    createRubyAnnotation(range, text, annotationText);
    
    console.log('[Annotate-Translate] Auto-annotated with:', annotationText);
    
  } catch (error) {
    console.error('[Annotate-Translate] Auto-translate failed:', error);
    alert('Auto-translation failed: ' + error.message);
  }
}

// Create ruby tag annotation
function createRubyAnnotation(range, baseText, annotationText) {
  try {
    console.log('[Annotate-Translate] Creating ruby annotation for:', baseText, 'with:', annotationText);
    
    // Create ruby element structure
    const ruby = document.createElement('ruby');
    ruby.className = 'annotate-translate-ruby';
    ruby.setAttribute('data-annotation', annotationText);
    ruby.setAttribute('data-base-text', baseText);
    
    // Add base text
    ruby.textContent = baseText;
    
    // Create rt (ruby text) element for annotation
    const rt = document.createElement('rt');
    rt.className = 'annotate-translate-rt';
    rt.textContent = annotationText;
    ruby.appendChild(rt);
    
    // Replace the selected text with the ruby element
    range.deleteContents();
    range.insertNode(ruby);
    
    // Store annotation
    annotations.set(ruby, {
      base: baseText,
      annotation: annotationText
    });
    
    // Save annotation to storage
    saveAnnotation(baseText, annotationText);
    
    // Clear selection
    window.getSelection().removeAllRanges();
    
    console.log('[Annotate-Translate] Ruby annotation created successfully');
  } catch (e) {
    console.error('[Annotate-Translate] Failed to create ruby annotation:', e);
    alert('Failed to annotate text. Please try selecting the text again.');
  }
}

// Save annotation to storage
function saveAnnotation(baseText, annotationText) {
  chrome.storage.local.get({annotations: []}, function(result) {
    const annotations = result.annotations;
    annotations.push({
      baseText: baseText,
      annotationText: annotationText || '',
      timestamp: Date.now(),
      url: window.location.href
    });
    chrome.storage.local.set({annotations: annotations});
  });
}

// Handle messages from popup or background
function handleMessage(request, sender, sendResponse) {
  console.log('[Annotate-Translate] Received message:', request);
  
  if (request.action === 'ping') {
    // Respond to ping to confirm content script is loaded
    sendResponse({pong: true});
  } else if (request.action === 'updateSettings') {
    // 更新设置
    settings = request.settings || settings;
    console.log('[Annotate-Translate] Settings updated:', settings);
    
    // 重新应用翻译设置
    applyTranslationSettings();
    
    sendResponse({success: true});
  } else if (request.action === 'clearCache') {
    // 清除翻译缓存
    if (typeof translationService !== 'undefined') {
      translationService.clearCache();
      console.log('[Annotate-Translate] Translation cache cleared');
      sendResponse({success: true});
    } else {
      sendResponse({success: false, error: 'Translation service not available'});
    }
  } else if (request.action === 'clearAnnotations') {
    clearAllAnnotations();
    sendResponse({success: true});
  } else if (request.action === 'annotate' && request.text) {
    // Handle annotate action from context menu
    console.log('[Annotate-Translate] Annotating text:', request.text);
    annotateSelectedText(request.text);
    sendResponse({success: true});
  } else if (request.action === 'translate' && request.text) {
    // Handle translate action from context menu
    console.log('[Annotate-Translate] Translating text:', request.text);
    translateText(request.text);
    sendResponse({success: true});
  }
  return true;
}

// Clear all annotations from the page
function clearAllAnnotations() {
  // Clear old style highlights
  const highlights = document.querySelectorAll('.annotate-translate-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    parent.removeChild(highlight);
  });
  
  // Clear ruby annotations
  const rubyElements = document.querySelectorAll('ruby.annotate-translate-ruby');
  rubyElements.forEach(ruby => {
    const baseText = ruby.getAttribute('data-base-text') || ruby.textContent;
    const textNode = document.createTextNode(baseText);
    ruby.parentNode.replaceChild(textNode, ruby);
  });
  
  annotations.clear();
  
  // Clear from storage
  chrome.storage.local.set({annotations: []});
}
