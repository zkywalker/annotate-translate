/**
 * Storage Encryption Utility
 * Provides simple encryption for sensitive data storage
 * Note: This provides basic obfuscation. For production use, consider more robust solutions.
 */

/**
 * Generate a simple key for encryption/decryption
 * Uses browser's native crypto API for key generation
 * @returns {Promise<string>} Base64 encoded key
 */
async function generateEncryptionKey() {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256
    },
    true,
    ['encrypt', 'decrypt']
  );

  const exportedKey = await crypto.subtle.exportKey('raw', key);
  return arrayBufferToBase64(exportedKey);
}

/**
 * Encrypt a string value
 * @param {string} plaintext - The text to encrypt
 * @param {string} [keyString] - Base64 encoded encryption key (optional, generates if not provided)
 * @returns {Promise<{encrypted: string, key: string, iv: string}>} Encrypted data
 */
async function encryptValue(plaintext, keyString = null) {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Invalid plaintext');
  }

  // Generate or import key
  let cryptoKey;
  if (keyString) {
    const keyData = base64ToArrayBuffer(keyString);
    cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
  } else {
    cryptoKey = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
    const exportedKey = await crypto.subtle.exportKey('raw', cryptoKey);
    keyString = arrayBufferToBase64(exportedKey);
  }

  // Generate IV (Initialization Vector)
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encode plaintext
  const encoded = new TextEncoder().encode(plaintext);

  // Encrypt
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    cryptoKey,
    encoded
  );

  return {
    encrypted: arrayBufferToBase64(encrypted),
    key: keyString,
    iv: arrayBufferToBase64(iv)
  };
}

/**
 * Decrypt an encrypted value
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} keyString - Base64 encoded encryption key
 * @param {string} ivString - Base64 encoded IV
 * @returns {Promise<string>} Decrypted plaintext
 */
async function decryptValue(encryptedData, keyString, ivString) {
  if (!encryptedData || !keyString || !ivString) {
    throw new Error('Missing required parameters for decryption');
  }

  try {
    // Import key
    const keyData = base64ToArrayBuffer(keyString);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Convert encrypted data and IV from base64
    const encrypted = base64ToArrayBuffer(encryptedData);
    const iv = base64ToArrayBuffer(ivString);

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      cryptoKey,
      encrypted
    );

    // Decode to string
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error('[Encryption] Decryption failed:', error);
    throw new Error('Decryption failed - data may be corrupted or key is incorrect');
  }
}

/**
 * Simple obfuscation for API keys (lightweight alternative to full encryption)
 * Uses base64 encoding with a simple XOR cipher
 * @param {string} value - Value to obfuscate
 * @returns {string} Obfuscated value
 */
function obfuscate(value) {
  if (!value || typeof value !== 'string') {
    return '';
  }

  // Simple XOR cipher with a constant key (not secure, just obfuscation)
  const key = 'AnnotateTranslate';
  let result = '';

  for (let i = 0; i < value.length; i++) {
    result += String.fromCharCode(
      value.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }

  // Base64 encode the result
  return btoa(result);
}

/**
 * Deobfuscate a value
 * @param {string} obfuscated - Obfuscated value
 * @returns {string} Original value
 */
function deobfuscate(obfuscated) {
  if (!obfuscated || typeof obfuscated !== 'string') {
    return '';
  }

  try {
    // Base64 decode
    const decoded = atob(obfuscated);

    // XOR cipher with the same key
    const key = 'AnnotateTranslate';
    let result = '';

    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(
        decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }

    return result;
  } catch (error) {
    console.error('[Encryption] Deobfuscation failed:', error);
    return '';
  }
}

/**
 * Secure storage wrapper for chrome.storage.local
 * Automatically encrypts/decrypts sensitive values
 */
class SecureStorage {
  constructor() {
    this.encryptionKey = null;
    this.initialized = false;
  }

  /**
   * Initialize secure storage
   * Loads or generates encryption key
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      // Try to load existing key from storage
      const result = await chrome.storage.local.get('_encryptionKey');

      if (result._encryptionKey) {
        this.encryptionKey = result._encryptionKey;
      } else {
        // Generate new key
        this.encryptionKey = await generateEncryptionKey();
        await chrome.storage.local.set({ _encryptionKey: this.encryptionKey });
      }

      this.initialized = true;
    } catch (error) {
      console.error('[SecureStorage] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Store a sensitive value with encryption
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  async setSecure(key, value) {
    await this.initialize();

    const encrypted = await encryptValue(value, this.encryptionKey);

    await chrome.storage.local.set({
      [key]: {
        _encrypted: true,
        data: encrypted.encrypted,
        iv: encrypted.iv
      }
    });
  }

  /**
   * Retrieve and decrypt a sensitive value
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} Decrypted value or null
   */
  async getSecure(key) {
    await this.initialize();

    const result = await chrome.storage.local.get(key);

    if (!result[key]) {
      return null;
    }

    const stored = result[key];

    if (!stored._encrypted) {
      // Not encrypted, return as-is
      return stored;
    }

    try {
      return await decryptValue(stored.data, this.encryptionKey, stored.iv);
    } catch (error) {
      console.error('[SecureStorage] Failed to decrypt:', error);
      return null;
    }
  }

  /**
   * Store a value with simple obfuscation (faster than encryption)
   * @param {string} key - Storage key
   * @param {string} value - Value to store
   */
  async setObfuscated(key, value) {
    const obfuscated = obfuscate(value);

    await chrome.storage.local.set({
      [key]: {
        _obfuscated: true,
        data: obfuscated
      }
    });
  }

  /**
   * Retrieve and deobfuscate a value
   * @param {string} key - Storage key
   * @returns {Promise<string|null>} Original value or null
   */
  async getObfuscated(key) {
    const result = await chrome.storage.local.get(key);

    if (!result[key]) {
      return null;
    }

    const stored = result[key];

    if (!stored._obfuscated) {
      return stored;
    }

    return deobfuscate(stored.data);
  }
}

// Helper functions

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
function base64ToArrayBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Create global instance
const secureStorage = new SecureStorage();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateEncryptionKey,
    encryptValue,
    decryptValue,
    obfuscate,
    deobfuscate,
    SecureStorage,
    secureStorage
  };
}
