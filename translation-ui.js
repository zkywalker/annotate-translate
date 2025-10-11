/**
 * Translation UI Component
 * 
 * 该模块负责渲染翻译结果的UI，包括：
 * - 翻译文本展示
 * - 读音按钮和播放功能
 * - 词义、例句展示
 */

/**
 * 翻译结果UI渲染器
 */
class TranslationUI {
  constructor(options = {}) {
    this.options = {
      showPhonetics: true,
      showDefinitions: true,
      showExamples: true,
      maxExamples: 3,
      enableAudio: true,
      audioProvider: 'google', // 'google', 'youdao', 'custom'
      ...options
    };
    this.audioCache = new Map(); // 缓存音频数据
  }

  /**
   * 渲染翻译结果为DOM元素
   * @param {TranslationResult} result - 翻译结果
   * @returns {HTMLElement} 翻译结果容器
   */
  render(result) {
    const container = document.createElement('div');
    container.className = 'translation-result-container';

    // 原文
    const originalSection = this.createSection('original-text', 'Original');
    originalSection.appendChild(this.createTextElement(result.originalText, 'original'));
    container.appendChild(originalSection);

    // 译文（主要内容）
    const translationSection = this.createSection('translated-text', 'Translation');
    translationSection.appendChild(this.createTextElement(result.translatedText, 'translated'));
    container.appendChild(translationSection);

    // 读音部分
    if (this.options.showPhonetics && result.phonetics && result.phonetics.length > 0) {
      const phoneticSection = this.createPhoneticSection(result.phonetics, result.originalText);
      container.appendChild(phoneticSection);
    }

    // 词义部分
    if (this.options.showDefinitions && result.definitions && result.definitions.length > 0) {
      const definitionSection = this.createDefinitionSection(result.definitions);
      container.appendChild(definitionSection);
    }

    // 例句部分
    if (this.options.showExamples && result.examples && result.examples.length > 0) {
      const exampleSection = this.createExampleSection(result.examples);
      container.appendChild(exampleSection);
    }

    // 来源信息
    const footer = this.createFooter(result);
    container.appendChild(footer);

    return container;
  }

  /**
   * 创建区域容器
   * @param {string} className - CSS类名
   * @param {string} title - 标题
   * @returns {HTMLElement}
   */
  createSection(className, title) {
    const section = document.createElement('div');
    section.className = `translation-section ${className}`;
    
    if (title) {
      const titleEl = document.createElement('div');
      titleEl.className = 'section-title';
      titleEl.textContent = title;
      section.appendChild(titleEl);
    }
    
    return section;
  }

  /**
   * 创建文本元素
   * @param {string} text - 文本内容
   * @param {string} className - CSS类名
   * @returns {HTMLElement}
   */
  createTextElement(text, className) {
    const el = document.createElement('div');
    el.className = `text-content ${className}`;
    el.textContent = text;
    return el;
  }

  /**
   * 创建读音部分
   * @param {PhoneticInfo[]} phonetics - 读音信息数组
   * @param {string} originalText - 原文（用于语音合成）
   * @returns {HTMLElement}
   */
  createPhoneticSection(phonetics, originalText) {
    const section = this.createSection('phonetic-section', 'Pronunciation');
    
    const phoneticContainer = document.createElement('div');
    phoneticContainer.className = 'phonetic-container';

    phonetics.forEach((phonetic, index) => {
      const phoneticItem = document.createElement('div');
      phoneticItem.className = 'phonetic-item';

      // 读音类型标签
      if (phonetic.type) {
        const typeLabel = document.createElement('span');
        typeLabel.className = 'phonetic-type';
        typeLabel.textContent = phonetic.type.toUpperCase();
        phoneticItem.appendChild(typeLabel);
      }

      // 音标文本
      const phoneticText = document.createElement('span');
      phoneticText.className = 'phonetic-text';
      phoneticText.textContent = phonetic.text;
      phoneticItem.appendChild(phoneticText);

      // 播放按钮
      if (this.options.enableAudio) {
        const playButton = this.createAudioButton(phonetic, originalText, index);
        phoneticItem.appendChild(playButton);
      }

      phoneticContainer.appendChild(phoneticItem);
    });

    section.appendChild(phoneticContainer);
    return section;
  }

  /**
   * 创建音频播放按钮
   * @param {PhoneticInfo} phonetic - 读音信息
   * @param {string} text - 要朗读的文本
   * @param {number} index - 索引
   * @returns {HTMLElement}
   */
  createAudioButton(phonetic, text, index) {
    const button = document.createElement('button');
    button.className = 'audio-play-button';
    button.innerHTML = '🔊'; // 使用emoji作为图标
    button.title = 'Play pronunciation';
    button.setAttribute('aria-label', 'Play pronunciation');

    // 点击播放
    button.addEventListener('click', async (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      try {
        button.classList.add('playing');
        await this.playAudio(phonetic, text);
      } catch (error) {
        console.error('[TranslationUI] Audio playback error:', error);
        this.showAudioError(button);
      } finally {
        button.classList.remove('playing');
      }
    });

    return button;
  }

  /**
   * 播放音频
   * @param {PhoneticInfo} phonetic - 读音信息
   * @param {string} text - 要朗读的文本
   * @returns {Promise<void>}
   */
  async playAudio(phonetic, text) {
    // 优先级：
    // 1. phonetic.audioData (预加载的音频数据)
    // 2. phonetic.audioUrl (在线音频URL)
    // 3. 语音合成API (浏览器自带TTS)
    // 4. 第三方音频服务

    if (phonetic.audioData) {
      // 播放预加载的音频数据
      return this.playAudioFromData(phonetic.audioData);
    }

    if (phonetic.audioUrl) {
      // 播放在线音频
      return this.playAudioFromUrl(phonetic.audioUrl);
    }

    // 使用语音合成API
    return this.playTextToSpeech(text, phonetic.type);
  }

  /**
   * 从ArrayBuffer播放音频
   * @param {ArrayBuffer} audioData - 音频数据
   * @returns {Promise<void>}
   */
  async playAudioFromData(audioData) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioBuffer = await audioContext.decodeAudioData(audioData);
    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    
    return new Promise((resolve, reject) => {
      source.onended = resolve;
      source.onerror = reject;
      source.start(0);
    });
  }

  /**
   * 从URL播放音频
   * @param {string} url - 音频URL
   * @returns {Promise<void>}
   */
  async playAudioFromUrl(url) {
    // 检查缓存
    if (this.audioCache.has(url)) {
      const audio = this.audioCache.get(url);
      audio.currentTime = 0;
      return audio.play();
    }

    // 创建新的音频元素
    const audio = new Audio(url);
    this.audioCache.set(url, audio);

    return new Promise((resolve, reject) => {
      audio.onended = resolve;
      audio.onerror = reject;
      audio.play().catch(reject);
    });
  }

  /**
   * 使用浏览器TTS播放文本
   * @param {string} text - 要朗读的文本
   * @param {string} [type] - 语音类型（如 'us', 'uk'）
   * @returns {Promise<void>}
   */
  async playTextToSpeech(text, type) {
    if (!('speechSynthesis' in window)) {
      throw new Error('Speech synthesis not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // 设置语言和语音
      utterance.lang = this.getLanguageCode(type);
      
      // 尝试选择合适的语音
      const voices = window.speechSynthesis.getVoices();
      const voice = this.selectVoice(voices, utterance.lang, type);
      if (voice) {
        utterance.voice = voice;
      }

      utterance.onend = resolve;
      utterance.onerror = reject;

      window.speechSynthesis.speak(utterance);
    });
  }

  /**
   * 获取语言代码
   * @param {string} type - 语音类型
   * @returns {string} BCP 47语言代码
   */
  getLanguageCode(type) {
    const languageMap = {
      'us': 'en-US',
      'uk': 'en-GB',
      'pinyin': 'zh-CN',
      'default': 'en-US'
    };
    return languageMap[type] || languageMap['default'];
  }

  /**
   * 选择合适的语音
   * @param {SpeechSynthesisVoice[]} voices - 可用语音列表
   * @param {string} lang - 语言代码
   * @param {string} type - 语音类型
   * @returns {SpeechSynthesisVoice|null}
   */
  selectVoice(voices, lang, type) {
    // 首先尝试完全匹配
    let voice = voices.find(v => v.lang === lang);
    
    // 如果没有完全匹配，尝试语言前缀匹配
    if (!voice) {
      const langPrefix = lang.split('-')[0];
      voice = voices.find(v => v.lang.startsWith(langPrefix));
    }

    return voice || null;
  }

  /**
   * 从第三方服务获取音频URL
   * @param {string} text - 文本
   * @param {string} type - 语音类型
   * @returns {string} 音频URL
   */
  getAudioUrlFromService(text, type) {
    // Google TTS
    if (this.options.audioProvider === 'google') {
      const lang = this.getLanguageCode(type);
      return `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${lang}&client=tw-ob`;
    }
    
    // Youdao TTS
    if (this.options.audioProvider === 'youdao') {
      return `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=${type === 'uk' ? 2 : 1}`;
    }

    return null;
  }

  /**
   * 显示音频错误
   * @param {HTMLElement} button - 按钮元素
   */
  showAudioError(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '❌';
    button.classList.add('error');
    
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.classList.remove('error');
    }, 2000);
  }

  /**
   * 创建词义部分
   * @param {Definition[]} definitions - 词义数组
   * @returns {HTMLElement}
   */
  createDefinitionSection(definitions) {
    const section = this.createSection('definition-section', 'Definitions');
    
    const list = document.createElement('ul');
    list.className = 'definition-list';

    definitions.forEach(def => {
      const item = document.createElement('li');
      item.className = 'definition-item';

      // 词性
      if (def.partOfSpeech) {
        const pos = document.createElement('span');
        pos.className = 'part-of-speech';
        pos.textContent = def.partOfSpeech;
        item.appendChild(pos);
      }

      // 释义
      const text = document.createElement('span');
      text.className = 'definition-text';
      text.textContent = def.text;
      item.appendChild(text);

      // 同义词
      if (def.synonyms && def.synonyms.length > 0) {
        const synonyms = document.createElement('div');
        synonyms.className = 'synonyms';
        synonyms.innerHTML = '<span class="label">Synonyms:</span> ' + 
                            def.synonyms.join(', ');
        item.appendChild(synonyms);
      }

      list.appendChild(item);
    });

    section.appendChild(list);
    return section;
  }

  /**
   * 创建例句部分
   * @param {Example[]} examples - 例句数组
   * @returns {HTMLElement}
   */
  createExampleSection(examples) {
    const section = this.createSection('example-section', 'Examples');
    
    const list = document.createElement('ul');
    list.className = 'example-list';

    const maxExamples = Math.min(examples.length, this.options.maxExamples);
    for (let i = 0; i < maxExamples; i++) {
      const example = examples[i];
      const item = document.createElement('li');
      item.className = 'example-item';

      // 原文
      const source = document.createElement('div');
      source.className = 'example-source';
      source.textContent = example.source;
      item.appendChild(source);

      // 译文
      if (example.translation) {
        const translation = document.createElement('div');
        translation.className = 'example-translation';
        translation.textContent = example.translation;
        item.appendChild(translation);
      }

      list.appendChild(item);
    }

    section.appendChild(list);
    return section;
  }

  /**
   * 创建页脚（显示来源和时间）
   * @param {TranslationResult} result - 翻译结果
   * @returns {HTMLElement}
   */
  createFooter(result) {
    const footer = document.createElement('div');
    footer.className = 'translation-footer';

    const provider = document.createElement('span');
    provider.className = 'provider-info';
    provider.textContent = `Powered by ${result.provider || 'Unknown'}`;
    footer.appendChild(provider);

    if (result.timestamp) {
      const time = document.createElement('span');
      time.className = 'time-info';
      time.textContent = new Date(result.timestamp).toLocaleTimeString();
      footer.appendChild(time);
    }

    return footer;
  }

  /**
   * 创建简化版UI（仅显示译文和读音）
   * @param {TranslationResult} result - 翻译结果
   * @returns {HTMLElement}
   */
  renderSimple(result) {
    const container = document.createElement('div');
    container.className = 'translation-simple-container';

    // 译文
    const translation = document.createElement('div');
    translation.className = 'simple-translation';
    translation.textContent = result.translatedText;
    container.appendChild(translation);

    // 读音（如果有）
    if (result.phonetics && result.phonetics.length > 0) {
      const phoneticRow = document.createElement('div');
      phoneticRow.className = 'simple-phonetic-row';

      result.phonetics.forEach((phonetic, index) => {
        const phoneticText = document.createElement('span');
        phoneticText.className = 'simple-phonetic-text';
        phoneticText.textContent = phonetic.text;
        phoneticRow.appendChild(phoneticText);

        if (this.options.enableAudio) {
          const playButton = this.createAudioButton(phonetic, result.originalText, index);
          playButton.className = 'simple-audio-button';
          phoneticRow.appendChild(playButton);
        }
      });

      container.appendChild(phoneticRow);
    }

    return container;
  }

  /**
   * 清理资源
   */
  cleanup() {
    // 停止所有音频
    this.audioCache.forEach(audio => {
      audio.pause();
      audio.src = '';
    });
    this.audioCache.clear();

    // 停止语音合成
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TranslationUI };
}
