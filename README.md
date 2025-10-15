# Annotate Translate

A Chrome extension for annotating and translating text on web pages.


## Features

### Core Features
- **Text Translation**: Select any text on a webpage to translate it to your target language
- **Text Annotation**: Highlight and annotate important text passages for later reference
- **Multiple Providers**: Google Translate, Youdao
- **Rich Translation Results**: Audio playback, phonetics, definitions, examples
- **Settings Page**: Centralized configuration for all features
- **Context Menu Integration**: Right-click on selected text for quick access to features
- **Persistent Storage**: Your annotations and settings are saved across browsing sessions

### Translation Features
- 🌍 **Translation Providers**:
  - Google Translate (production recommended, no config needed)
  - Youdao (Chinese optimized, **requires API key** - [Setup Guide](YOUDAO_SETUP_GUIDE.md))
- 🔊 **Audio Playback**: 
  - **In Translation Cards**: Three-tier audio strategy (ArrayBuffer → URL → TTS)
  - **In Annotations**: Click speaker button 🔊 next to phonetics to play pronunciation ([Audio Feature Guide](AUDIO_FEATURE.md))
  - **Smart Audio Source**: Automatically uses FreeDictionary API or Web Speech API fallback
- 📖 **Phonetics**: 
  - US/UK pronunciations with IPA notation
  - FreeDictionary fallback for missing phonetics ([Phonetic Fallback Guide](PHONETIC_FALLBACK_FEATURE.md))
- 📚 **Definitions**: Multiple meanings with part of speech
- 📝 **Examples**: Real-world usage examples
- 💾 **Smart Cache**: Reduce API calls, improve speed
- 🎨 **Responsive UI**: Desktop and mobile support, dark mode ready

## Project Structure

```
annotate-translate/
├── manifest.json              # Extension manifest
├── README.md
│
├── src/                       # Source code
│   ├── background/            # Background service worker
│   │   └── background.js
│   │
│   ├── content/               # Content scripts
│   │   ├── content.js         # Main content script
│   │   ├── content.css        # Content styles
│   │   ├── translation-integration.js
│   │   └── translation-ui.js  # Translation UI components
│   │
│   ├── popup/                 # Extension popup
│   │   ├── popup.html
│   │   ├── popup.js
│   │   └── styles.css
│   │
│   ├── options/               # Settings page
│   │   ├── options.html
│   │   ├── options.js
│   │   └── options.css
│   │
│   ├── services/              # Business logic
│   │   ├── ai-translation-service.js
│   │   └── translation-service.js
│   │
│   ├── providers/             # AI providers
│   │   ├── base-ai-provider.js
│   │   ├── openai-provider.js
│   │   └── prompt-templates.js
│   │
│   ├── utils/                 # Utility functions
│   │   ├── i18n-helper.js
│   │   └── settings-schema.js
│   │
│   ├── lib/                   # Third-party libraries
│   │   ├── lucide.min.js
│   │   ├── lucide-loader.js
│   │   └── lucide-init.js
│   │
│   └── styles/                # Shared styles
│       └── translation-ui.css
│
├── assets/                    # Static resources
│   └── icons/                 # Extension icons and logos
│
├── _locales/                  # i18n translations
│   ├── en/
│   ├── zh_CN/
│   └── ...
│
└── test/                      # Test files
```

## Installation

### Install from Source

1. Clone this repository or download the source code:
   ```bash
   git clone https://github.com/zkywalker/annotate-translate.git
   cd annotate-translate
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" by toggling the switch in the top right corner

4. Click "Load unpacked" button

5. Select the `annotate-translate` directory

6. The extension should now be installed and active!

## Usage

### Translation

#### Basic Translation
1. Select any text on a webpage
2. Click the "Translate" button that appears, or right-click and select "Translate"
3. The translation will appear in a beautiful card with:
   - 🔊 Audio playback button
   - 📖 Phonetic notation (US/UK)
   - 📚 Multiple definitions
   - 📝 Usage examples

#### Translation Result Features
- **Audio Playback**: Click 🔊 button to hear pronunciation
- **Phonetics**: See US and UK pronunciations with IPA
- **Definitions**: Multiple meanings with part of speech
- **Examples**: Real-world usage examples with translations
- **Smart UI**: Full UI for short text, simplified UI for long text

### Annotation

1. Select any text on a webpage
2. Click the "Annotate" button that appears, or right-click and select "Annotate"
3. The text will be automatically annotated with translation and phonetics
4. **🔊 Click the speaker button** next to the phonetics to hear pronunciation ([Guide](AUDIO_FEATURE.md))
5. The text will be wrapped in an HTML `<ruby>` tag with your annotation displayed above it
6. Your annotations are automatically saved

**Example**: Select "hello" → Annotate → See `/həˈloʊ/ 你好 🔊` above the word → Click 🔊 to hear pronunciation

**Ruby Tag Structure:**
The extension creates standard HTML ruby annotations like this:
```html
<ruby class="annotate-translate-ruby">
  selected text
  <rt class="annotate-translate-rt">your annotation</rt>
</ruby>
```

This allows the annotation text to appear directly above the base text, which is especially useful for:
- Adding pronunciation guides
- Providing translations
- Adding contextual notes
- Creating reading aids for language learning

### Settings Page ⚙️

Access the settings page by:
- Right-clicking the extension icon → "Options"
- Or visit `chrome://extensions/` → Extension details → "Extension options"

**Configuration Sections**:
1. **Feature Toggles**: Enable/disable translation and annotation
2. **Translation Provider**: Choose from Google/Youdao
3. **Youdao API Configuration**: Set App Key and App Secret (when Youdao is selected) - [Setup Guide](YOUDAO_SETUP_GUIDE.md)
4. **Language Settings**: Set source and target languages
5. **UI Settings**: Configure audio, phonetics, definitions, examples display
6. **Performance**: Cache settings and auto-close delay
7. **Debug Settings**: Enable debug mode and console logs

## Documentation 📚

### Register Translate providers

// TODO

## Architecture 🏗️

### Design Patterns
- **Abstract Factory**: Pluggable translation providers
- **Strategy**: Audio playback fallback chain
- **Adapter**: Uniform API for different providers
- **Singleton**: TranslationService instance

### Core Components

```
┌─────────────────────────────────────────┐
│         Chrome Extension                │
│  ┌──────────┐  ┌──────────┐            │
│  │ Popup    │  │ Options  │            │
│  │ (UI)     │  │ (Config) │            │
│  └─────┬────┘  └────┬─────┘            │
│        │            │                   │
│  ┌─────▼────────────▼─────┐            │
│  │   Background Service    │            │
│  │   (Message Handler)     │            │
│  └─────────┬───────────────┘            │
│            │                            │
│  ┌─────────▼───────────────┐            │
│  │    Content Script        │            │
│  │  ┌──────────────────┐   │            │
│  │  │ TranslationService│   │            │
│  │  │  ┌──────────┐    │   │            │
│  │  │  │Providers │    │   │            │
│  │  │  │- Google  │    │   │            │
│  │  │  │- Youdao  │    │   │            │
│  │  │  └──────────┘    │   │            │
│  │  └─────────┬────────┘   │            │
│  │            │            │            │
│  │  ┌─────────▼─────────┐  │            │
│  │  │  TranslationUI    │  │            │
│  │  │  - render()       │  │            │
│  │  │  - playAudio()    │  │            │
│  │  └───────────────────┘  │            │
│  └──────────────────────────┘            │
└─────────────────────────────────────────┘
```

### Data Flow

```
User Selection
    ↓
Content Script detects text
    ↓
TranslationService.translate()
    ↓
Active Provider (e.g., Google)
    ↓
Cache Check
    ↓ (cache miss)
Provider API Call / Fixed Data
    ↓
Standardized Result JSON
    ↓
Cache Store
    ↓
TranslationUI.render()
    ↓
Display to User
```


## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 88+ | ✅ Fully Supported |
| Edge | 88+ | ✅ Fully Supported |
| Firefox | 85+ | ⚠️ Partial (Manifest V3 support varies) |
| Safari | 14+ | ⚠️ Partial (Limited extension API) |

## Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current webpage
- `storage`: To save settings and annotations (using chrome.storage.sync)
- `contextMenus`: To add right-click menu options
- `scripting`: To inject content scripts dynamically (Manifest V3)
- `<all_urls>`: To work on all websites (for translation service)

**Privacy**: All data is stored locally. No data is sent to external servers except for translation API calls to selected providers.


## Known Limitations

### Translation Provider Limitations

| Provider | Configuration | Limitation |
|----------|---------------|------------|
| Google | None required | May have CORS issues in local testing, rate limits in production |
| Youdao | **Requires API key** | Must register at [Youdao AI Platform](https://ai.youdao.com/) - See [Setup Guide](YOUDAO_SETUP_GUIDE.md) |

### Audio Playback

- **Web Audio API**: Requires audio data from provider (best quality)
- **Audio Element**: Requires audio URL from provider (good quality)
- **TTS Fallback**: Browser-dependent, may not support all languages

## Roadmap 🗺️

### Future Plans
- [ ] OCR text recognition
- [ ] Frequency-based batch translation

## Contributing 🤝

Contributions are welcome! Here's how you can help:

### Report Issues
- 🐛 **Bug Reports**: Use "bug" label
- 💡 **Feature Requests**: Use "enhancement" label
- 📚 **Documentation**: Use "documentation" label

### Submit Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Support 💬

- **Issues**: GitHub Issues
- **Discussions**: GitHub Discussions

## Changelog 📝


## License 📄

MIT License

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Acknowledgments 🙏

- Chrome Extension API documentation
- Web Audio API specification
- Speech Synthesis API
- All contributors and users