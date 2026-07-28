'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

global.logger = require('../src/utils/logger').logger;
const PromptTemplates = require('../src/providers/prompt-templates');
global.BaseAIProvider = require('../src/providers/base-ai-provider');
global.PromptTemplates = PromptTemplates;
const OpenAIProvider = require('../src/providers/openai-provider');
const AnnotationScanner = require('../src/services/annotation-scanner');
const {
  TranslationProvider,
  TranslationService
} = require('../src/services/translation-service');

function createResult(text, targetLang = 'zh-CN', sourceLang = 'en') {
  return {
    originalText: text,
    translatedText: `translated:${text}`,
    sourceLang,
    targetLang,
    phonetics: [{ text: `/${text}/`, type: 'ipa' }],
    definitions: [],
    examples: [],
    metadata: {}
  };
}

class BatchProvider extends TranslationProvider {
  constructor(options = {}) {
    super('Batch Test Provider');
    this.batchSize = options.batchSize || 2;
    this.failBatch = options.failBatch || false;
    this.batchCalls = [];
    this.singleCalls = [];
  }

  supportsBatchTranslation() {
    return true;
  }

  getBatchSize() {
    return this.batchSize;
  }

  getCacheIdentity() {
    return 'batch-test-v1';
  }

  getCacheContext(options = {}) {
    return options.context || '';
  }

  async translateBatch(texts, targetLang, sourceLang) {
    this.batchCalls.push([...texts]);
    if (this.failBatch) {
      throw new Error('invalid batch response');
    }
    return texts.map(text => createResult(text, targetLang, sourceLang));
  }

  async translate(text, targetLang, sourceLang) {
    this.singleCalls.push(text);
    return createResult(text, targetLang, sourceLang);
  }

  async detectLanguage() {
    return 'en';
  }

  async getSupportedLanguages() {
    return [];
  }
}

class ConcurrencyProvider extends TranslationProvider {
  constructor() {
    super('Concurrency Test Provider');
    this.active = 0;
    this.maximumActive = 0;
  }

  async translate(text, targetLang, sourceLang) {
    this.active++;
    this.maximumActive = Math.max(this.maximumActive, this.active);
    await new Promise(resolve => setTimeout(resolve, 5));
    this.active--;
    return createResult(text, targetLang, sourceLang);
  }

  async detectLanguage() {
    return 'en';
  }

  async getSupportedLanguages() {
    return [];
  }
}

function createService(provider) {
  const service = new TranslationService();
  service.registerProvider('test', provider);
  service.setActiveProvider('test');
  service.enablePhoneticFallback = false;
  return service;
}

test('strict batch JSON parsing maps out-of-order results by id', () => {
  const expected = [
    { id: 0, text: 'bank' },
    { id: 1, text: 'current' }
  ];
  const response = `\`\`\`json
{"items":[
  {"id":1,"translation":"当前的","phonetic":"/current/","definitions":[]},
  {"id":0,"translation":"银行","phonetic":"/bank/","definitions":["金融机构"]}
]}
\`\`\``;

  const parsed = PromptTemplates.parseBatchJsonResponse(response, expected);
  assert.equal(parsed[0].translation, '银行');
  assert.equal(parsed[1].translation, '当前的');
  assert.equal(
    PromptTemplates.parseBatchJsonResponse(
      '{"items":[{"id":0,"translation":"银行"},{"id":0,"translation":"河岸"}]}',
      expected
    ),
    null
  );
});

test('OpenAI provider sends one request and maps a structured batch response', async () => {
  const provider = new OpenAIProvider({
    apiKey: 'test-key',
    model: 'test-model',
    maxTokens: 500
  });
  let requestCount = 0;
  provider.callAPI = async prompts => {
    requestCount++;
    assert.match(prompts.user, /independent vocabulary items/i);
    return {
      choices: [{
        message: {
          content: '{"items":[{"id":0,"translation":"银行","phonetic":"/bank/","definitions":[]},{"id":1,"translation":"当前的","phonetic":"/current/","definitions":[]}]}'
        }
      }],
      usage: { prompt_tokens: 100, completion_tokens: 40, total_tokens: 140 }
    };
  };

  const batch = await provider.translateBatch(
    [{ id: 0, text: 'bank' }, { id: 1, text: 'current' }],
    'en',
    'zh-CN'
  );

  assert.equal(requestCount, 1);
  assert.deepEqual(batch.results.map(result => result.translatedText), ['银行', '当前的']);
  assert.equal(batch.metadata.tokensUsed, 140);
});

test('translation service chunks batch providers and caches each word', async () => {
  const provider = new BatchProvider({ batchSize: 2 });
  const service = createService(provider);
  const words = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];

  const first = await service.translateBatch(words, 'zh-CN', 'en');
  assert.deepEqual(provider.batchCalls, [
    ['alpha', 'beta'],
    ['gamma', 'delta']
  ]);
  assert.deepEqual(provider.singleCalls, ['epsilon']);
  assert.ok(first.every(outcome => outcome.result && !outcome.cached));

  const second = await service.translateBatch(words, 'zh-CN', 'en');
  assert.ok(second.every(outcome => outcome.result && outcome.cached));
  assert.equal(provider.batchCalls.length, 2);
  assert.equal(provider.singleCalls.length, 1);
});

test('context-aware cache reuses identical context and separates different contexts', async () => {
  const provider = new BatchProvider();
  const service = createService(provider);

  await service.translate('bank', 'zh-CN', 'en', { context: 'the river bank' });
  await service.translate('bank', 'zh-CN', 'en', { context: 'the river bank' });
  await service.translate('bank', 'zh-CN', 'en', { context: 'open a bank account' });

  assert.deepEqual(provider.singleCalls, ['bank', 'bank']);
});

test('non-batch providers use bounded individual concurrency', async () => {
  const provider = new ConcurrencyProvider();
  const service = createService(provider);
  const words = Array.from({ length: 12 }, (_, index) => `word${index}`);

  const outcomes = await service.translateBatch(words, 'zh-CN', 'en', {
    noCache: true,
    individualConcurrency: 8
  });

  assert.ok(outcomes.every(outcome => outcome.result));
  assert.equal(provider.maximumActive, 4);
});

test('failed structured batches fall back to individual translation', async () => {
  const provider = new BatchProvider({ batchSize: 4, failBatch: true });
  const service = createService(provider);
  const words = ['alpha', 'beta', 'gamma', 'delta'];

  const outcomes = await service.translateBatch(words, 'zh-CN', 'en');

  assert.equal(provider.batchCalls.length, 1);
  assert.deepEqual(provider.singleCalls.sort(), [...words].sort());
  assert.ok(outcomes.every(outcome => outcome.result));
});

test('annotation scanner consumes per-word batch outcomes and updates progress', async () => {
  const calls = [];
  const scanner = new AnnotationScanner(
    { getMetadata: word => ({ word, level: 'test' }) },
    {
      activeProvider: 'test',
      getActiveProvider: () => ({ name: 'test' }),
      translateBatch: async (texts, targetLang, sourceLang, options) => {
        calls.push({ texts, targetLang, sourceLang, options });
        texts.forEach((text, index) => options.onProgress({
          text,
          cached: index === 0,
          result: createResult(text, targetLang, sourceLang)
        }, index));
        return [];
      }
    }
  );
  const progress = [];
  scanner.createProgressPanel = () => ({});
  scanner.updateProgress = (panel, completed, total, word, errorCount) => {
    progress.push({ completed, total, word, errorCount });
  };
  scanner.showCompletionStatus = () => {};
  scanner.abortController = new AbortController();
  const annotations = [
    { word: 'alpha', nodes: [] },
    { word: 'beta', nodes: [] }
  ];

  await scanner.enrichAnnotations(annotations, {
    fetchTranslation: true,
    fetchPhonetic: true,
    sourceLang: 'en',
    targetLang: 'zh-CN'
  });

  assert.deepEqual(calls[0].texts, ['alpha', 'beta']);
  assert.equal(calls[0].options.signal, scanner.abortController.signal);
  assert.equal(annotations[0].fullResult.translatedText, 'translated:alpha');
  assert.equal(annotations[1].phonetic, '/beta/');
  assert.deepEqual(progress.map(item => item.completed), [1, 2]);
});
