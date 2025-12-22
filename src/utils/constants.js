/**
 * Application Constants
 * Centralized constants to replace magic numbers throughout the codebase
 */

// ============================================
// Context and Text Processing
// ============================================

/**
 * Maximum length of context to extract around selected text (in characters)
 */
const CONTEXT_MAX_LENGTH = 300;

/**
 * Maximum length for word boundary adjustment when extracting context
 */
const WORD_BOUNDARY_SEARCH_LENGTH = 20;

/**
 * Text length threshold to switch from full UI to simplified UI (in characters)
 */
const SIMPLIFIED_UI_THRESHOLD = 100;

/**
 * Text length threshold for "long text" detection (in characters)
 */
const LONG_TEXT_THRESHOLD = 50;

// ============================================
// Cache Configuration
// ============================================

/**
 * Default size for translation result cache
 */
const DEFAULT_CACHE_SIZE = 100;

/**
 * Maximum size for audio cache (number of audio objects)
 */
const AUDIO_CACHE_MAX_SIZE = 50;

/**
 * Cache Time-To-Live in milliseconds (30 minutes)
 */
const CACHE_TTL_MS = 30 * 60 * 1000;

// ============================================
// Timing Constants
// ============================================

/**
 * Delay before injecting content script (in milliseconds)
 */
const INJECTION_DELAY_MS = 100;

/**
 * Delay before registering click-outside listeners (in milliseconds)
 */
const CLICK_OUTSIDE_DELAY_MS = 100;

/**
 * Auto-close delay for error messages (in milliseconds)
 */
const ERROR_MESSAGE_AUTO_CLOSE_MS = 3000;

/**
 * Auto-close delay for translation cards (in seconds, 0 = no auto-close)
 */
const TRANSLATION_CARD_AUTO_CLOSE_SECONDS = 10;

/**
 * Delay for showing audio error feedback (in milliseconds)
 */
const AUDIO_ERROR_FEEDBACK_MS = 1000;

/**
 * Delay for showing audio error icon reset (in milliseconds)
 */
const AUDIO_ERROR_RESET_MS = 2000;

// ============================================
// API Configuration
// ============================================

/**
 * Default OpenAI model
 */
const DEFAULT_OPENAI_MODEL = 'gpt-3.5-turbo';

/**
 * Default OpenAI base URL
 */
const DEFAULT_OPENAI_BASE_URL = 'https://api.openai.com/v1';

/**
 * Default temperature for AI translation
 */
const DEFAULT_AI_TEMPERATURE = 0.3;

/**
 * Default max tokens for AI translation
 */
const DEFAULT_AI_MAX_TOKENS = 500;

/**
 * Default timeout for API requests (in seconds)
 */
const DEFAULT_API_TIMEOUT_SECONDS = 30;

// ============================================
// UI Configuration
// ============================================

/**
 * Maximum number of examples to display
 */
const MAX_EXAMPLES_DISPLAY = 3;

/**
 * Maximum number of definitions to show in annotations
 */
const MAX_ANNOTATION_DEFINITIONS = 2;

/**
 * Default button size for selection menu
 */
const DEFAULT_BUTTON_SIZE = 'small';

/**
 * Speech synthesis rate (0.5 - 2.0, 1.0 is normal)
 */
const TTS_SPEECH_RATE = 0.9;

/**
 * Speech synthesis pitch (0.5 - 2.0, 1.0 is normal)
 */
const TTS_SPEECH_PITCH = 1.0;

// ============================================
// Storage Keys
// ============================================

/**
 * Storage key for annotations
 */
const STORAGE_KEY_ANNOTATIONS = 'annotations';

/**
 * Storage key for settings
 */
const STORAGE_KEY_SETTINGS = 'settings';

// ============================================
// Language Codes
// ============================================

/**
 * Default source language (auto-detect)
 */
const DEFAULT_SOURCE_LANG = 'auto';

/**
 * Default target language
 */
const DEFAULT_TARGET_LANG = 'zh-CN';

/**
 * Default UI language
 */
const DEFAULT_UI_LANG = 'auto';

/**
 * Default phonetic type
 */
const DEFAULT_PHONETIC_TYPE = 'us';

// ============================================
// Validation Constants
// ============================================

/**
 * Minimum cache size
 */
const MIN_CACHE_SIZE = 10;

/**
 * Maximum cache size
 */
const MAX_CACHE_SIZE = 1000;

/**
 * Minimum temperature value for AI models
 */
const MIN_AI_TEMPERATURE = 0.0;

/**
 * Maximum temperature value for AI models
 */
const MAX_AI_TEMPERATURE = 2.0;

/**
 * Minimum max tokens for AI models
 */
const MIN_AI_MAX_TOKENS = 100;

/**
 * Maximum max tokens for AI models
 */
const MAX_AI_MAX_TOKENS = 4000;

// ============================================
// CSS Class Names
// ============================================

/**
 * CSS class for the selection menu
 */
const CSS_CLASS_MENU = 'annotate-translate-menu';

/**
 * CSS class for translation tooltip
 */
const CSS_CLASS_TOOLTIP = 'annotate-translate-tooltip';

/**
 * CSS class for ruby annotations
 */
const CSS_CLASS_RUBY = 'annotate-translate-ruby';

/**
 * CSS class for loading state
 */
const CSS_CLASS_LOADING = 'loading';

/**
 * CSS class for error state
 */
const CSS_CLASS_ERROR = 'error';

/**
 * CSS class for playing state
 */
const CSS_CLASS_PLAYING = 'playing';

// ============================================
// Regular Expressions
// ============================================

/**
 * Sentence ending markers (supports English and Chinese)
 */
const SENTENCE_ENDERS_REGEX = /[.!?。！？；;]\s*/g;

/**
 * Word boundary regex
 */
const WORD_BOUNDARY_REGEX = /[\s\-,;:]/;

/**
 * Chinese character regex
 */
const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;

/**
 * English word regex (with hyphens and apostrophes)
 */
const ENGLISH_WORD_REGEX = /[a-zA-Z]+(?:[-'][a-zA-Z]+)*/g;

/**
 * English character regex
 */
const ENGLISH_CHAR_REGEX = /[a-zA-Z]/;

/**
 * Japanese character regex
 */
const JAPANESE_CHAR_REGEX = /[\u3040-\u309f\u30a0-\u30ff]/;

/**
 * Korean character regex
 */
const KOREAN_CHAR_REGEX = /[\uac00-\ud7af]/;

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    // Context and Text Processing
    CONTEXT_MAX_LENGTH,
    WORD_BOUNDARY_SEARCH_LENGTH,
    SIMPLIFIED_UI_THRESHOLD,
    LONG_TEXT_THRESHOLD,

    // Cache Configuration
    DEFAULT_CACHE_SIZE,
    AUDIO_CACHE_MAX_SIZE,
    CACHE_TTL_MS,

    // Timing Constants
    INJECTION_DELAY_MS,
    CLICK_OUTSIDE_DELAY_MS,
    ERROR_MESSAGE_AUTO_CLOSE_MS,
    TRANSLATION_CARD_AUTO_CLOSE_SECONDS,
    AUDIO_ERROR_FEEDBACK_MS,
    AUDIO_ERROR_RESET_MS,

    // API Configuration
    DEFAULT_OPENAI_MODEL,
    DEFAULT_OPENAI_BASE_URL,
    DEFAULT_AI_TEMPERATURE,
    DEFAULT_AI_MAX_TOKENS,
    DEFAULT_API_TIMEOUT_SECONDS,

    // UI Configuration
    MAX_EXAMPLES_DISPLAY,
    MAX_ANNOTATION_DEFINITIONS,
    DEFAULT_BUTTON_SIZE,
    TTS_SPEECH_RATE,
    TTS_SPEECH_PITCH,

    // Storage Keys
    STORAGE_KEY_ANNOTATIONS,
    STORAGE_KEY_SETTINGS,

    // Language Codes
    DEFAULT_SOURCE_LANG,
    DEFAULT_TARGET_LANG,
    DEFAULT_UI_LANG,
    DEFAULT_PHONETIC_TYPE,

    // Validation Constants
    MIN_CACHE_SIZE,
    MAX_CACHE_SIZE,
    MIN_AI_TEMPERATURE,
    MAX_AI_TEMPERATURE,
    MIN_AI_MAX_TOKENS,
    MAX_AI_MAX_TOKENS,

    // CSS Class Names
    CSS_CLASS_MENU,
    CSS_CLASS_TOOLTIP,
    CSS_CLASS_RUBY,
    CSS_CLASS_LOADING,
    CSS_CLASS_ERROR,
    CSS_CLASS_PLAYING,

    // Regular Expressions
    SENTENCE_ENDERS_REGEX,
    WORD_BOUNDARY_REGEX,
    CHINESE_CHAR_REGEX,
    ENGLISH_WORD_REGEX,
    ENGLISH_CHAR_REGEX,
    JAPANESE_CHAR_REGEX,
    KOREAN_CHAR_REGEX
  };
}
