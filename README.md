# Annotate Translate

A Chrome extension for annotating and translating text on web pages.

## Features

- **Text Translation**: Select any text on a webpage to translate it to your target language
- **Text Annotation**: Highlight and annotate important text passages for later reference
- **Customizable Settings**: Configure translation preferences and enable/disable features
- **Context Menu Integration**: Right-click on selected text for quick access to features
- **Persistent Storage**: Your annotations and settings are saved across browsing sessions

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

1. Select any text on a webpage
2. Click the "Translate" button that appears, or right-click and select "Translate"
3. The translation will appear in a tooltip

### Annotation

1. Select any text on a webpage
2. Click the "Annotate" button that appears, or right-click and select "Annotate"
3. The text will be highlighted in yellow
4. Your annotations are automatically saved

### Settings

Click the extension icon in the Chrome toolbar to open the settings popup where you can:
- Enable/disable translation and annotation features
- Change the target language for translations
- Clear all annotations from the current page

## File Structure

```
annotate-translate/
├── manifest.json          # Extension configuration
├── popup.html            # Extension popup UI
├── popup.js              # Popup logic
├── styles.css            # Popup styles
├── content.js            # Content script for page interaction
├── content.css           # Content script styles
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # This file
```

## Development

This extension is built using:
- **Manifest V3**: Latest Chrome extension manifest version
- **Vanilla JavaScript**: No frameworks required
- **Chrome Storage API**: For persisting user data
- **Content Scripts**: For interacting with web pages

## Permissions

This extension requires the following permissions:
- `activeTab`: To interact with the current webpage
- `storage`: To save settings and annotations
- `contextMenus`: To add right-click menu options
- `<all_urls>`: To work on all websites

## License

MIT License

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.