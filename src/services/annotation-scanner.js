/**
 * AnnotationScanner - 页面扫描和标注应用器
 *
 * 负责：
 * 1. 遍历页面文本节点
 * 2. 提取单词并查询词库
 * 3. 应用Ruby标注
 * 4. 管理标注状态
 */
class AnnotationScanner {
  constructor(vocabularyService, translationService) {
    this.vocabularyService = vocabularyService;
    this.translationService = translationService;
    this.observer = null;
    this.annotatedNodes = new Set(); // 跟踪已标注的节点
    this.isScanning = false;
  }

  /**
   * 扫描整个页面并应用标注
   * @param {Object} options - 扫描选项
   * @param {boolean} options.fetchTranslation - 是否获取翻译（默认true）
   * @param {boolean} options.fetchPhonetic - 是否获取音标（默认true）
   * @param {string} options.sourceLang - 源语言（默认'en'）
   * @param {string} options.targetLang - 目标语言（默认'zh-CN'）
   * @param {HTMLElement} options.rootElement - 根元素（默认document.body）
   * @returns {Promise<Object>} 扫描结果统计
   */
  async scanPage(options = {}) {
    const {
      fetchTranslation = true,
      fetchPhonetic = true,
      sourceLang = 'en',
      targetLang = 'zh-CN',
      rootElement = document.body
    } = options;

    if (this.isScanning) {
      console.warn('[AnnotationScanner] Scan already in progress');
      return { status: 'skipped', reason: 'already_scanning' };
    }

    this.isScanning = true;

    try {
      console.log('[AnnotationScanner] Starting page scan...');
      const startTime = performance.now();

      // 1. 遍历所有文本节点
      const textNodes = this.collectTextNodes(rootElement);
      console.log(`[AnnotationScanner] Found ${textNodes.length} text nodes`);

      // 2. 提取所有单词
      const wordsMap = this.extractWordsFromNodes(textNodes);
      const uniqueWords = Array.from(wordsMap.keys());
      console.log(`[AnnotationScanner] Extracted ${uniqueWords.length} unique words`);

      // 3. 批量查询词库
      const wordsToAnnotate = this.vocabularyService.batchCheck(uniqueWords);
      const annotationCount = Array.from(wordsToAnnotate.values()).filter(v => v).length;
      console.log(`[AnnotationScanner] ${annotationCount} words need annotation`);

      // 4. 准备标注数据
      const annotations = [];
      for (const [word, shouldAnnotate] of wordsToAnnotate) {
        if (shouldAnnotate) {
          annotations.push({
            word,
            nodes: wordsMap.get(word) || []
          });
        }
      }

      // 5. 如果需要，批量获取翻译
      if (fetchTranslation || fetchPhonetic) {
        await this.enrichAnnotations(annotations, {
          fetchTranslation,
          fetchPhonetic,
          sourceLang,
          targetLang
        });
      }

      // 6. 应用标注
      const appliedCount = this.applyAnnotations(annotations);

      const endTime = performance.now();
      const duration = Math.round(endTime - startTime);

      const result = {
        status: 'completed',
        stats: {
          textNodesScanned: textNodes.length,
          uniqueWords: uniqueWords.length,
          wordsToAnnotate: annotationCount,
          annotationsApplied: appliedCount,
          duration
        }
      };

      console.log('[AnnotationScanner] Scan completed:', result);
      return result;
    } catch (error) {
      console.error('[AnnotationScanner] Scan failed:', error);
      return {
        status: 'error',
        error: error.message
      };
    } finally {
      this.isScanning = false;
    }
  }

  /**
   * 收集所有文本节点
   * @private
   */
  collectTextNodes(root) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;

          const tagName = parent.tagName.toLowerCase();

          // 跳过这些标签
          const skipTags = ['script', 'style', 'noscript', 'iframe', 'ruby', 'rt', 'rp'];
          if (skipTags.includes(tagName)) {
            return NodeFilter.FILTER_REJECT;
          }

          // 跳过已标注的内容
          if (parent.closest('ruby')) {
            return NodeFilter.FILTER_REJECT;
          }

          // 跳过空文本或纯空白
          if (!node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }

          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }

    return textNodes;
  }

  /**
   * 从文本节点提取单词
   * @private
   * @returns {Map<string, Array>} word -> [{ node, matches: [{offset, length}] }]
   */
  extractWordsFromNodes(textNodes) {
    const wordsMap = new Map();

    // 英文单词匹配正则（支持连字符、撇号等）
    const wordPattern = /\b[a-zA-Z]+(?:[-'][a-zA-Z]+)*\b/g;

    for (const node of textNodes) {
      const text = node.textContent;
      let match;

      while ((match = wordPattern.exec(text)) !== null) {
        const word = match[0];
        const wordLower = word.toLowerCase();

        if (!wordsMap.has(wordLower)) {
          wordsMap.set(wordLower, []);
        }

        wordsMap.get(wordLower).push({
          node,
          offset: match.index,
          length: word.length,
          originalWord: word
        });
      }
    }

    return wordsMap;
  }

  /**
   * 丰富标注数据（获取翻译、音标等）
   * @private
   */
  async enrichAnnotations(annotations, options) {
    const { fetchTranslation, fetchPhonetic, sourceLang, targetLang, vocabularyConfig } = options;

    console.log(`[AnnotationScanner] Enriching ${annotations.length} annotations`, {
      fetchTranslation,
      fetchPhonetic,
      sourceLang,
      targetLang,
      vocabularyConfig,
      hasTranslationService: !!this.translationService
    });

    const total = annotations.length;
    let completed = 0;
    let errorCount = 0;
    const errors = []; // 收集错误信息

    // 获取翻译提供者名称
    const providerName = this.translationService?.activeProvider || 'Unknown';

    // 创建进度显示面板
    const progressPanel = this.createProgressPanel(total, vocabularyConfig, providerName);

    // 批量获取翻译（带进度更新）
    const promises = annotations.map(async (annotation, index) => {
      try {
        // 获取词库元数据
        const metadata = this.vocabularyService.getMetadata(annotation.word);

        // 获取翻译
        if (fetchTranslation && this.translationService) {
          console.log(`[AnnotationScanner] Fetching translation for "${annotation.word}" (${sourceLang} → ${targetLang})`);

          const translation = await this.translationService.translate(
            annotation.word,
            targetLang,  // 第2个参数：目标语言
            sourceLang   // 第3个参数：源语言
          );

          console.log(`[AnnotationScanner] Translation result for "${annotation.word}":`, {
            translatedText: translation.translatedText,
            phonetic: translation.phonetic,
            hasDefinition: !!translation.definition
          });

          // 保存完整的翻译结果，用于点击时显示详细面板
          annotation.fullResult = translation;
          annotation.translation = translation.translatedText;
          annotation.phonetic = translation.phonetic || '';
          annotation.definition = translation.definition || '';
        } else {
          console.warn(`[AnnotationScanner] Skipping translation for "${annotation.word}":`, {
            fetchTranslation,
            hasTranslationService: !!this.translationService
          });
        }

        annotation.metadata = metadata;

        // 更新进度
        completed++;
        this.updateProgress(progressPanel, completed, total, annotation.word, errorCount);

      } catch (error) {
        console.error(`[AnnotationScanner] Failed to enrich "${annotation.word}":`, error);
        errorCount++;
        errors.push({ word: annotation.word, error: error.message });
        completed++;
        this.updateProgress(progressPanel, completed, total, annotation.word, errorCount);
      }
    });

    await Promise.all(promises);

    console.log(`[AnnotationScanner] Enrichment complete. Success: ${total - errorCount}, Errors: ${errorCount}`);
    if (errors.length > 0) {
      console.log(`[AnnotationScanner] Failed words:`, errors);
    }

    // 显示完成状态
    this.showCompletionStatus(progressPanel, total, errorCount);
  }

  /**
   * 创建进度显示面板（简洁版）
   * @private
   */
  createProgressPanel(total, vocabularyConfig, providerName) {
    // 格式化翻译提供者信息
    let providerText = '';
    if (providerName) {
      const providerLabels = {
        'google': 'Google Translate',
        'youdao': 'Youdao',
        'deepl': 'DeepL',
        'openai': 'OpenAI'
      };
      const displayName = providerLabels[providerName.toLowerCase()] || providerName;
      providerText = `<span class="progress-provider">Provider: ${displayName}</span>`;
    }

    // 格式化词汇配置信息
    let configText = '';
    if (vocabularyConfig && vocabularyConfig.options) {
      const { targetTags = [], mode = 'any' } = vocabularyConfig.options;

      if (targetTags.length > 0) {
        const tagLabels = {
          'cet4': 'CET-4',
          'cet6': 'CET-6',
          'ky': '考研',
          'gk': '高考',
          'toefl': 'TOEFL',
          'ielts': 'IELTS',
          'gre': 'GRE',
          'zk': '中考'
        };

        const tagNames = targetTags.map(tag => tagLabels[tag] || tag.toUpperCase()).join(', ');
        const modeText = mode === 'any' ? '任一' : mode === 'all' ? '全部' : '精确';
        configText = `<span class="progress-config">Tags: ${tagNames} (${modeText})</span>`;
      }
    }

    const panel = document.createElement('div');
    panel.className = 'vocab-annotation-progress';
    panel.innerHTML = `
      <div class="progress-content">
        ${providerText}
        ${configText}
        <span class="progress-text"><span class="progress-current">0</span>/<span class="progress-total">${total}</span></span>
        <span class="progress-errors" style="display: none; color: #d73a49;">(<span class="progress-error-count">0</span> errors)</span>
        <div class="progress-bar-container">
          <div class="progress-bar" style="width: 0%"></div>
        </div>
        <span class="progress-current-word"></span>
      </div>
    `;

    document.body.appendChild(panel);

    // 触发显示
    setTimeout(() => panel.classList.add('show'), 10);

    return panel;
  }

  /**
   * 更新进度（简洁版）
   * @private
   */
  updateProgress(panel, completed, total, word, errorCount = 0) {
    if (!panel || !document.contains(panel)) return;

    const currentEl = panel.querySelector('.progress-current');
    const barEl = panel.querySelector('.progress-bar');
    const currentWordEl = panel.querySelector('.progress-current-word');
    const errorEl = panel.querySelector('.progress-errors');
    const errorCountEl = panel.querySelector('.progress-error-count');

    if (currentEl) currentEl.textContent = completed;

    if (barEl) {
      const percent = (completed / total) * 100;
      barEl.style.width = `${percent}%`;
      // 如果有错误，进度条显示红色
      if (errorCount > 0) {
        barEl.style.background = 'linear-gradient(90deg, #28a745 0%, #ffc107 80%, #dc3545 100%)';
      }
    }

    if (currentWordEl) {
      currentWordEl.textContent = word;
    }

    // 显示错误计数
    if (errorCount > 0) {
      if (errorEl) errorEl.style.display = 'inline';
      if (errorCountEl) errorCountEl.textContent = errorCount;
    }
  }

  /**
   * 显示完成状态（简洁版）
   * @private
   */
  showCompletionStatus(panel, total, errorCount = 0) {
    if (!panel || !document.contains(panel)) return;

    const textEl = panel.querySelector('.progress-text');
    if (textEl) {
      const successCount = total - errorCount;
      if (errorCount === 0) {
        textEl.textContent = `✓ Completed: ${total} words translated`;
        textEl.style.color = '#28a745';
      } else {
        textEl.textContent = `Completed: ${successCount} succeeded, ${errorCount} failed`;
        textEl.style.color = '#856404';
      }
    }

    // 2秒后自动消失
    setTimeout(() => {
      panel.classList.add('fade-out');
      setTimeout(() => {
        if (panel.parentElement) {
          panel.remove();
        }
      }, 200);
    }, 2000);
  }

  /**
   * 应用标注到DOM
   * @private
   *
   * 策略：复用 content.js 中的 createRubyElement 函数创建元素
   * 但使用批量处理策略来优化性能（构建 fragments 一次性替换）
   */
  applyAnnotations(annotations) {
    let appliedCount = 0;

    // 检查 createRubyElement 是否可用
    if (typeof createRubyElement !== 'function') {
      console.error('[AnnotationScanner] createRubyElement function not available');
      return 0;
    }

    // 按文本节点分组，以便批量处理同一节点上的多个标注
    const nodeAnnotationsMap = new Map();

    for (const annotation of annotations) {
      const { word, nodes, fullResult } = annotation;

      if (!fullResult) {
        console.warn(`[AnnotationScanner] Missing fullResult for "${word}", skipping`);
        continue;
      }

      // 获取标注文本（根据配置决定显示什么）
      const annotationText = fullResult.annotationText || fullResult.translatedText;

      for (const nodeInfo of nodes) {
        if (!nodeAnnotationsMap.has(nodeInfo.node)) {
          nodeAnnotationsMap.set(nodeInfo.node, []);
        }
        nodeAnnotationsMap.get(nodeInfo.node).push({
          ...nodeInfo,
          annotationText,
          fullResult
        });
      }
    }

    // 处理每个文本节点
    for (const [node, nodeAnnotations] of nodeAnnotationsMap) {
      try {
        // 检查节点是否还在DOM中
        if (!document.contains(node)) {
          continue;
        }

        // 检查父节点是否已经被标注过
        if (node.parentElement && node.parentElement.tagName.toLowerCase() === 'ruby') {
          continue;
        }

        // 按offset倒序排序，从后往前替换，避免offset偏移
        nodeAnnotations.sort((a, b) => b.offset - a.offset);

        const parent = node.parentNode;
        if (!parent) continue;

        // 获取原始文本
        let currentText = node.textContent;
        const fragments = [];
        let lastIndex = currentText.length;

        // 从后往前处理每个标注
        for (const { offset, length, originalWord, annotationText, fullResult } of nodeAnnotations) {
          // 验证offset是否有效
          if (offset < 0 || offset + length > currentText.length) {
            console.warn(`[AnnotationScanner] Invalid offset for "${originalWord}" in node (offset: ${offset}, length: ${length}, nodeLength: ${currentText.length})`);
            continue;
          }

          // 使用 content.js 的 createRubyElement 创建 ruby 元素
          // 这个函数会处理所有细节：点击事件、音频按钮、配置读取等
          const ruby = createRubyElement(originalWord, annotationText, fullResult);

          // 收集片段：[后面的文本] + [ruby] + [中间的文本]
          const afterText = currentText.substring(offset + length, lastIndex);
          if (afterText) {
            fragments.unshift(document.createTextNode(afterText));
          }
          fragments.unshift(ruby);

          lastIndex = offset;
          appliedCount++;
        }

        // 添加最前面的文本
        const beforeText = currentText.substring(0, lastIndex);
        if (beforeText) {
          fragments.unshift(document.createTextNode(beforeText));
        }

        // 替换原节点
        if (fragments.length > 0) {
          // 在原节点之前插入所有片段
          for (const fragment of fragments) {
            parent.insertBefore(fragment, node);
            if (fragment.nodeType === Node.ELEMENT_NODE && fragment.tagName.toLowerCase() === 'ruby') {
              this.annotatedNodes.add(fragment);
            }
          }
          // 移除原节点
          parent.removeChild(node);
        }
      } catch (error) {
        console.warn(`[AnnotationScanner] Failed to apply annotations for node:`, error);
      }
    }

    return appliedCount;
  }

  /**
   * 移除所有标注
   */
  removeAnnotations() {
    console.log('[AnnotationScanner] Removing all annotations...');

    let removedCount = 0;

    // 移除所有ruby元素
    for (const ruby of this.annotatedNodes) {
      if (ruby && ruby.parentNode) {
        const text = ruby.childNodes[0]?.textContent || '';
        const textNode = document.createTextNode(text);
        ruby.parentNode.replaceChild(textNode, ruby);
        removedCount++;
      }
    }

    this.annotatedNodes.clear();

    console.log(`[AnnotationScanner] Removed ${removedCount} annotations`);
    return removedCount;
  }

  /**
   * 监听页面变化（用于动态内容）
   */
  observeChanges(enable = true, options = {}) {
    if (enable) {
      if (this.observer) {
        console.warn('[AnnotationScanner] Observer already running');
        return;
      }

      this.observer = new MutationObserver((mutations) => {
        // 防抖处理
        if (this.observerTimeout) {
          clearTimeout(this.observerTimeout);
        }

        this.observerTimeout = setTimeout(() => {
          console.log('[AnnotationScanner] DOM changed, re-scanning...');
          this.scanPage(options);
        }, 1000);
      });

      this.observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      console.log('[AnnotationScanner] Started observing DOM changes');
    } else {
      if (this.observer) {
        this.observer.disconnect();
        this.observer = null;
        console.log('[AnnotationScanner] Stopped observing DOM changes');
      }
    }
  }

  /**
   * 获取扫描统计
   */
  getStats() {
    return {
      annotatedNodes: this.annotatedNodes.size,
      isScanning: this.isScanning,
      observing: this.observer !== null
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnnotationScanner;
}
