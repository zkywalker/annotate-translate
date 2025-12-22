/**
 * Input Validator Utility
 * Provides validation functions for API requests and user inputs
 * Prevents injection attacks and ensures data integrity
 */

/**
 * Validate and sanitize text input
 * @param {string} text - The text to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, sanitized: string, error: string|null}}
 */
function validateText(text, options = {}) {
  const {
    minLength = 1,
    maxLength = 10000,
    allowEmpty = false,
    trimWhitespace = true
  } = options;

  // Type check
  if (typeof text !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'Input must be a string'
    };
  }

  // Trim if requested
  let sanitized = trimWhitespace ? text.trim() : text;

  // Empty check
  if (!allowEmpty && sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'Text cannot be empty'
    };
  }

  // Length check
  if (sanitized.length < minLength) {
    return {
      valid: false,
      sanitized,
      error: `Text must be at least ${minLength} characters`
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized: sanitized.substring(0, maxLength),
      error: `Text exceeds maximum length of ${maxLength} characters`
    };
  }

  return {
    valid: true,
    sanitized,
    error: null
  };
}

/**
 * Validate language code
 * @param {string} langCode - The language code to validate
 * @returns {{valid: boolean, sanitized: string, error: string|null}}
 */
function validateLanguageCode(langCode) {
  if (typeof langCode !== 'string') {
    return {
      valid: false,
      sanitized: 'auto',
      error: 'Language code must be a string'
    };
  }

  const sanitized = langCode.trim().toLowerCase();

  // Allow 'auto' for auto-detection
  if (sanitized === 'auto') {
    return {
      valid: true,
      sanitized,
      error: null
    };
  }

  // Validate ISO 639-1 (2-letter) or BCP 47 (with region) codes
  // Examples: 'en', 'zh-CN', 'en-US'
  const langCodeRegex = /^[a-z]{2}(-[A-Z]{2})?$/;

  if (!langCodeRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized: 'auto',
      error: 'Invalid language code format'
    };
  }

  return {
    valid: true,
    sanitized,
    error: null
  };
}

/**
 * Validate API key
 * @param {string} apiKey - The API key to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, sanitized: string, error: string|null}}
 */
function validateAPIKey(apiKey, options = {}) {
  const {
    minLength = 10,
    maxLength = 500,
    allowEmpty = false
  } = options;

  if (typeof apiKey !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'API key must be a string'
    };
  }

  const sanitized = apiKey.trim();

  if (!allowEmpty && sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'API key cannot be empty'
    };
  }

  if (sanitized.length > 0 && sanitized.length < minLength) {
    return {
      valid: false,
      sanitized: '',
      error: `API key must be at least ${minLength} characters`
    };
  }

  if (sanitized.length > maxLength) {
    return {
      valid: false,
      sanitized: '',
      error: `API key exceeds maximum length of ${maxLength} characters`
    };
  }

  return {
    valid: true,
    sanitized,
    error: null
  };
}

/**
 * Validate URL
 * @param {string} url - The URL to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, sanitized: string, error: string|null}}
 */
function validateURL(url, options = {}) {
  const {
    allowedProtocols = ['http:', 'https:'],
    requireProtocol = true
  } = options;

  if (typeof url !== 'string') {
    return {
      valid: false,
      sanitized: '',
      error: 'URL must be a string'
    };
  }

  const sanitized = url.trim();

  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized: '',
      error: 'URL cannot be empty'
    };
  }

  try {
    const urlObj = new URL(sanitized);

    if (requireProtocol && !allowedProtocols.includes(urlObj.protocol)) {
      return {
        valid: false,
        sanitized,
        error: `URL must use one of these protocols: ${allowedProtocols.join(', ')}`
      };
    }

    return {
      valid: true,
      sanitized: urlObj.href, // Normalized URL
      error: null
    };
  } catch (e) {
    return {
      valid: false,
      sanitized,
      error: 'Invalid URL format'
    };
  }
}

/**
 * Validate numeric value within a range
 * @param {number} value - The value to validate
 * @param {Object} options - Validation options
 * @returns {{valid: boolean, sanitized: number, error: string|null}}
 */
function validateNumber(value, options = {}) {
  const {
    min = -Infinity,
    max = Infinity,
    allowFloat = true,
    defaultValue = 0
  } = options;

  // Type coercion
  const num = Number(value);

  if (isNaN(num)) {
    return {
      valid: false,
      sanitized: defaultValue,
      error: 'Value must be a number'
    };
  }

  if (!allowFloat && !Number.isInteger(num)) {
    return {
      valid: false,
      sanitized: Math.floor(num),
      error: 'Value must be an integer'
    };
  }

  if (num < min) {
    return {
      valid: false,
      sanitized: min,
      error: `Value must be at least ${min}`
    };
  }

  if (num > max) {
    return {
      valid: false,
      sanitized: max,
      error: `Value must be at most ${max}`
    };
  }

  return {
    valid: true,
    sanitized: num,
    error: null
  };
}

/**
 * Validate model name (for AI providers)
 * @param {string} modelName - The model name to validate
 * @returns {{valid: boolean, sanitized: string, error: string|null}}
 */
function validateModelName(modelName) {
  if (typeof modelName !== 'string') {
    return {
      valid: false,
      sanitized: 'gpt-3.5-turbo',
      error: 'Model name must be a string'
    };
  }

  const sanitized = modelName.trim();

  if (sanitized.length === 0) {
    return {
      valid: false,
      sanitized: 'gpt-3.5-turbo',
      error: 'Model name cannot be empty'
    };
  }

  // Basic validation: alphanumeric, dots, hyphens, underscores
  const modelNameRegex = /^[a-zA-Z0-9._-]+$/;

  if (!modelNameRegex.test(sanitized)) {
    return {
      valid: false,
      sanitized: 'gpt-3.5-turbo',
      error: 'Model name contains invalid characters'
    };
  }

  return {
    valid: true,
    sanitized,
    error: null
  };
}

/**
 * Validate translation request
 * Comprehensive validation for translation API requests
 * @param {Object} request - The translation request object
 * @returns {{valid: boolean, sanitized: Object, errors: string[]}}
 */
function validateTranslationRequest(request) {
  const errors = [];
  const sanitized = {};

  // Validate text
  const textValidation = validateText(request.text, {
    minLength: 1,
    maxLength: 10000
  });

  if (!textValidation.valid) {
    errors.push(textValidation.error);
  }
  sanitized.text = textValidation.sanitized;

  // Validate target language
  const targetLangValidation = validateLanguageCode(request.targetLang);

  if (!targetLangValidation.valid) {
    errors.push(targetLangValidation.error);
  }
  sanitized.targetLang = targetLangValidation.sanitized;

  // Validate source language (optional)
  if (request.sourceLang !== undefined) {
    const sourceLangValidation = validateLanguageCode(request.sourceLang);

    if (!sourceLangValidation.valid) {
      errors.push(sourceLangValidation.error);
    }
    sanitized.sourceLang = sourceLangValidation.sanitized;
  } else {
    sanitized.sourceLang = 'auto';
  }

  // Validate context (optional)
  if (request.context !== undefined) {
    const contextValidation = validateText(request.context, {
      minLength: 0,
      maxLength: 5000,
      allowEmpty: true
    });

    if (!contextValidation.valid) {
      errors.push(contextValidation.error);
    }
    sanitized.context = contextValidation.sanitized;
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

/**
 * Validate AI provider configuration
 * @param {Object} config - The AI provider configuration
 * @returns {{valid: boolean, sanitized: Object, errors: string[]}}
 */
function validateAIProviderConfig(config) {
  const errors = [];
  const sanitized = {};

  // Validate API key
  const apiKeyValidation = validateAPIKey(config.apiKey, {
    minLength: 10,
    allowEmpty: false
  });

  if (!apiKeyValidation.valid) {
    errors.push(apiKeyValidation.error);
  }
  sanitized.apiKey = apiKeyValidation.sanitized;

  // Validate model name
  const modelValidation = validateModelName(config.model || 'gpt-3.5-turbo');

  if (!modelValidation.valid) {
    errors.push(modelValidation.error);
  }
  sanitized.model = modelValidation.sanitized;

  // Validate base URL
  if (config.baseURL) {
    const urlValidation = validateURL(config.baseURL);

    if (!urlValidation.valid) {
      errors.push(urlValidation.error);
    }
    sanitized.baseURL = urlValidation.sanitized;
  }

  // Validate temperature
  if (config.temperature !== undefined) {
    const tempValidation = validateNumber(config.temperature, {
      min: 0.0,
      max: 2.0,
      allowFloat: true,
      defaultValue: 0.3
    });

    if (!tempValidation.valid) {
      errors.push(tempValidation.error);
    }
    sanitized.temperature = tempValidation.sanitized;
  }

  // Validate max tokens
  if (config.maxTokens !== undefined) {
    const tokensValidation = validateNumber(config.maxTokens, {
      min: 100,
      max: 4000,
      allowFloat: false,
      defaultValue: 1000
    });

    if (!tokensValidation.valid) {
      errors.push(tokensValidation.error);
    }
    sanitized.maxTokens = tokensValidation.sanitized;
  }

  return {
    valid: errors.length === 0,
    sanitized,
    errors
  };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateText,
    validateLanguageCode,
    validateAPIKey,
    validateURL,
    validateNumber,
    validateModelName,
    validateTranslationRequest,
    validateAIProviderConfig
  };
}
