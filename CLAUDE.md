# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Annotate Translate** is a Chrome Manifest V3 extension that provides text annotation and translation features on web pages. It supports multiple translation providers (Google Translate, Youdao, DeepL, AI-powered translation) with rich features including audio playback, phonetics, definitions, and examples.

## Development Commands

### Loading the Extension
This is a Chrome extension with no build process. To test:
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select the project root directory

### Testing
- **Manual Testing**: Open test files in a browser
  - `test-ai-translation.html` - Test AI translation features
  - `translation-test.html` - Test translation functionality
- **Test Directory**: `test/` contains test utilities

### Debugging
- **Content Script**: Use browser DevTools console on any webpage
- **Background Script**: Go to `chrome://extensions/`, find this extension, click "service worker" link
- **Popup**: Right-click the extension icon > "Inspect popup"
- **Options Page**: Right-click on options page > "Inspect"

## Architecture

### Extension Structure (Manifest V3)
```
Background Service Worker (background.js)
    ↓ [messaging]
Content Scripts (content.js)
    ↓ [uses]
Translation Service Layer
    ↓ [delegates to]
Translation Providers (Google, Youdao, DeepL, OpenAI)
```

### Key Design Patterns

1. **Provider Pattern**: `TranslationService` manages multiple `TranslationProvider` implementations (Google, Youdao, DeepL, OpenAI). Each provider implements a common interface for translation.

2. **Singleton Service**: `translationService` is a global singleton instance that manages all translation operations and caching.

3. **Message Passing**: Background script handles cross-origin requests for providers (Youdao, DeepL) to bypass CORS restrictions. Content scripts send messages to background script via `chrome.runtime.sendMessage`.

4. **Settings Schema**: Uses a hierarchical settings structure defined in `src/utils/settings-schema.js` with categories: `general`, `providers`, `display`, `annotation`, `performance`, `debug`.

5. **Phonetic Fallback Strategy**: If a provider doesn't return phonetics, the service automatically falls back to FreeDictionary API for English words.

### Core Components

**Translation Service Layer** (`src/services/translation-service.js`):
- `TranslationService`: Main service managing providers, caching, and phonetic fallback
- `TranslationProvider`: Abstract base class for all providers
- Providers: `GoogleTranslateProvider`, `YoudaoTranslateProvider`, `DeepLTranslateProvider`, `OpenAITranslateProvider`, `FreeDictionaryProvider`
- Translation result caching with LRU eviction
- Unified phonetic supplementation via FreeDictionary API

**Content Scripts** (`src/content/`):
- `content.js`: Main content script handling text selection, menu creation, settings management
- `translation-ui.js`: Renders translation cards with phonetics, audio, definitions, examples
- Settings helper `$` provides simplified access to nested settings

**Background Service Worker** (`src/background/background.js`):
- Handles context menus
- Proxies CORS-restricted API requests for Youdao and DeepL
- Initializes default settings based on browser language on install

**AI Translation** (`src/services/ai-translation-service.js`, `src/providers/`):
- OpenAI-compatible API provider with pluggable prompt templates
- Supports custom prompt formats for structured translation output
- Context-aware translation

**UI Components**:
- Translation UI renders cards with smart layout (full vs simplified based on text length)
- Audio playback with three-tier fallback: ArrayBuffer → URL → TTS
- Ruby annotations (`<ruby>` tags) for inline text annotations

### Data Flow

```
User selects text
    ↓
Content script detects selection
    ↓
Show floating menu (Translate / Annotate buttons)
    ↓
User clicks Translate → TranslationService.translate()
                            ↓
                        Active provider fetches translation
                            ↓
                        Result cached
                            ↓
                        Phonetic fallback (if needed)
                            ↓
                        TranslationUI.render()
                            ↓
                        Display card to user

User clicks Annotate → Wrap selected text in <ruby> tag
                        Add annotation (phonetic + translation)
                        Save to storage
```

### Translation Providers

Each provider has different requirements:

| Provider | API Key Required | CORS Handling | Special Features |
|----------|-----------------|---------------|------------------|
| Google | No | Direct fetch | Phonetics, definitions, examples |
| Youdao | Yes (appKey + appSecret) | Background proxy | Chinese-optimized, phonetics |
| DeepL | Yes | Background proxy | High quality, no phonetics/definitions |
| OpenAI | Yes | Direct fetch | AI-powered, context-aware |
| FreeDictionary | No | Direct fetch | English phonetics only (fallback) |

**Provider Configuration**: All providers are configured via `settings.providers[providerName]` and can be updated through the options page.

### Settings Management

Settings use a hierarchical structure:
- `general`: UI language, target language, feature toggles
- `providers`: Provider-specific configs (API keys, endpoints)
- `display`: UI appearance settings (translation card, menu, annotations)
- `annotation`: What to show in annotations (phonetics, translation, definitions)
- `performance`: Caching settings
- `debug`: Debug mode toggle

Access settings via the `$` helper in content scripts (e.g., `$.targetLanguage`, `$.translationProvider`).

## Important Implementation Details

### Audio Playback Strategy
Three-tier fallback for pronunciation audio (src/content/translation-ui.js):
1. **ArrayBuffer**: Play provider's raw audio data via Web Audio API
2. **URL**: Play provider's audio URL via `<audio>` element
3. **TTS Fallback**: Use browser's `speechSynthesis` API

### Annotation Text Generation
Controlled by settings (`settings.annotation.showPhonetics`, `showTranslation`, `showDefinitions`):
- `TranslationService.generateAnnotationText()` builds the annotation text
- Providers can have their own `generateAnnotationText()` but service-level is canonical

### CORS Proxy Pattern
Youdao and DeepL require the background script to make requests:
```javascript
// Content script sends message
chrome.runtime.sendMessage({ action: 'youdaoTranslate', params: {...} })

// Background script receives and fetches
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'youdaoTranslate') {
    fetch(request.params.url, {...}).then(...)
  }
})
```

### Extension Context Validation
Content scripts check if extension context is valid before making chrome API calls using `isExtensionContextValid()`. This prevents errors when the extension is reloaded during development.

## File Organization

- **`manifest.json`**: Extension manifest (Manifest V3)
- **`src/background/`**: Background service worker
- **`src/content/`**: Content scripts and translation UI
- **`src/services/`**: Translation service layer
- **`src/providers/`**: AI provider implementations (OpenAI adapter)
- **`src/utils/`**: Utilities (i18n helper, settings schema)
- **`src/options/`**: Options page UI
- **`src/popup/`**: Extension popup UI
- **`src/lib/`**: Third-party libraries (Lucide icons)
- **`_locales/`**: Internationalization files (en, zh_CN, etc.)
- **`assets/icons/`**: Extension icons and provider logos

## Common Tasks

### Adding a New Translation Provider

1. Create a new provider class extending `TranslationProvider` in `src/services/translation-service.js`
2. Implement required methods: `translate()`, `detectLanguage()`, `getSupportedLanguages()`
3. Register the provider: `translationService.registerProvider('provider-name', new YourProvider())`
4. Add provider settings to `src/utils/settings-schema.js` under `providers`
5. Update options page UI (`src/options/options.html` and `options.js`)
6. If CORS proxy needed, add message handler in `src/background/background.js`

### Modifying Translation Card UI

Edit `src/content/translation-ui.js`:
- `TranslationUI.render()`: Main rendering logic
- UI switches between full/simplified based on `result.originalText.length > 100`
- Audio button handlers in `attachAudioButtonListeners()`
- Styling in `src/styles/translation-ui.css`

### Changing Annotation Behavior

Edit annotation logic in `src/content/content.js`:
- Annotation text generation: `TranslationService.generateAnnotationText()`
- Ruby tag wrapping: Find the annotation creation code in content.js
- Saved annotations: Stored in `chrome.storage.sync` with structure `{ [url]: { [timestamp]: {...} } }`

### Modifying Settings Structure

1. Update `DEFAULT_SETTINGS` in `src/utils/settings-schema.js`
2. Update `settings` initialization in `src/content/content.js`
3. Update `settings` initialization in `src/background/background.js` (for defaults on install)
4. Update options page form bindings in `src/options/options.js`
5. Migration: Handle old settings format in settings load logic if needed

## Key Constraints

- **No Build Process**: This is a pure vanilla JS Chrome extension with no compilation step
- **Manifest V3**: Uses service workers instead of background pages
- **Chrome Storage Sync**: Settings sync across devices via `chrome.storage.sync`
- **Content Security Policy**: No inline scripts, all JS in external files
- **CORS Limitations**: Some providers require background script proxy
- **Ruby Annotation Compatibility**: Annotation feature depends on browser support for `<ruby>` tags

## Notes on Translation Service

The translation service implements a sophisticated caching and fallback system:
- **Cache Key Format**: `${text}:${sourceLang}:${targetLang}:${provider}`
- **LRU Cache**: Max 100 entries by default, configurable via settings
- **Phonetic Fallback**: Automatically queries FreeDictionary API for English words when provider doesn't return phonetics
- **Provider Switching**: Changing providers clears cache to avoid stale data

When debugging translation issues:
1. Check browser console for provider-specific logs (tagged with `[ProviderName]`)
2. Verify API keys in storage: Open DevTools > Application > Storage > Chrome Storage
3. Test provider connectivity via options page "Test Connection" buttons
4. Check background service worker console for CORS proxy errors
