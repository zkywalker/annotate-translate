'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const AIProvidersManager = require('../src/options/ai-providers-manager');
const { DEFAULT_SETTINGS } = require('../src/utils/settings-schema');
const { validateAIProviderConfig } = require('../src/utils/input-validator');

test('default settings contain no synthetic AI provider data', () => {
  assert.deepEqual(DEFAULT_SETTINGS.providers.aiProviders, []);
  assert.equal(DEFAULT_SETTINGS.providers.currentAIProvider, null);
  assert.equal(DEFAULT_SETTINGS.providers.openai.model, '');
  assert.equal(DEFAULT_SETTINGS.providers.openai.baseUrl, '');
});

test('AI provider validation does not invent a model or base URL', () => {
  const result = validateAIProviderConfig({ apiKey: 'test-api-key' });

  assert.equal(result.valid, false);
  assert.equal(result.sanitized.model, '');
  assert.equal(result.sanitized.baseURL, '');
  assert.match(result.errors.join(' '), /Model name cannot be empty/);
  assert.match(result.errors.join(' '), /Base URL cannot be empty/);
});

test('loading settings removes only the unused generated provider', async () => {
  const savedProvider = {
    id: 'custom-provider',
    name: 'My provider',
    apiKey: 'real-key',
    model: 'real-model',
    baseUrl: 'https://example.com/v1'
  };
  let savedSettings = null;
  global.chrome = {
    storage: {
      sync: {
        get: (_keys, callback) => callback({
          providers: {
            current: 'openai',
            currentAIProvider: 'openai-default',
            aiProviders: [
              { id: 'openai-default', name: 'OpenAI', apiKey: '' },
              savedProvider
            ]
          }
        }),
        set: (value, callback) => {
          savedSettings = value;
          callback();
        }
      }
    }
  };

  const manager = Object.create(AIProvidersManager.prototype);
  manager.providers = [];
  manager.currentProviderId = null;
  await manager.loadSettings();

  assert.deepEqual(manager.providers, [savedProvider]);
  assert.equal(manager.currentProviderId, savedProvider.id);
  assert.deepEqual(savedSettings.providers.aiProviders, [savedProvider]);
  assert.equal(savedSettings.providers.currentAIProvider, savedProvider.id);
  delete global.chrome;
});

test('loading an unused legacy AI config clears fake identity fields', async () => {
  let savedSettings = null;
  global.chrome = {
    storage: {
      sync: {
        get: (_keys, callback) => callback({
          providers: {
            current: 'openai',
            openai: {
              enabled: false,
              apiKey: '',
              model: 'gpt-3.5-turbo',
              baseUrl: 'https://api.openai.com/v1'
            },
            currentAIProvider: 'openai-default',
            aiProviders: [{ id: 'openai-default', apiKey: '' }]
          }
        }),
        set: (value, callback) => {
          savedSettings = value;
          callback();
        }
      }
    }
  };

  const manager = Object.create(AIProvidersManager.prototype);
  manager.providers = [];
  manager.currentProviderId = null;
  await manager.loadSettings();

  assert.deepEqual(manager.providers, []);
  assert.equal(manager.currentProviderId, null);
  assert.equal(savedSettings.providers.current, 'google');
  assert.equal(savedSettings.providers.openai.model, '');
  assert.equal(savedSettings.providers.openai.baseUrl, '');
  delete global.chrome;
});
