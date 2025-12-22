/**
 * Cache Manager with TTL (Time-To-Live) Support
 * Provides LRU cache with automatic expiration
 */

/**
 * Cache entry with expiration timestamp
 * @typedef {Object} CacheEntry
 * @property {*} value - The cached value
 * @property {number} timestamp - When this entry was created
 * @property {number} expiresAt - When this entry expires (timestamp)
 */

/**
 * Cache Manager Class
 * Implements LRU (Least Recently Used) eviction with TTL support
 */
class CacheManager {
  /**
   * @param {Object} options - Cache configuration
   * @param {number} options.maxSize - Maximum number of entries (default: 100)
   * @param {number} options.ttl - Time-to-live in milliseconds (default: 30 minutes)
   * @param {boolean} options.autoCleanup - Enable automatic cleanup of expired entries (default: true)
   * @param {number} options.cleanupInterval - Cleanup interval in milliseconds (default: 5 minutes)
   */
  constructor(options = {}) {
    this.maxSize = options.maxSize || 100;
    this.ttl = options.ttl || (30 * 60 * 1000); // Default: 30 minutes
    this.autoCleanup = options.autoCleanup !== false;
    this.cleanupInterval = options.cleanupInterval || (5 * 60 * 1000); // Default: 5 minutes

    // Use Map to maintain insertion order (for LRU)
    this.cache = new Map();

    // Statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0
    };

    // Start automatic cleanup if enabled
    if (this.autoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Get a value from the cache
   * @param {string} key - Cache key
   * @returns {*|null} The cached value or null if not found/expired
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
      this.stats.misses++;
      return null;
    }

    // Move to end (mark as recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  /**
   * Set a value in the cache
   * @param {string} key - Cache key
   * @param {*} value - Value to cache
   * @param {number} [customTTL] - Custom TTL for this entry (optional)
   */
  set(key, value, customTTL) {
    const now = Date.now();
    const ttl = customTTL !== undefined ? customTTL : this.ttl;

    const entry = {
      value,
      timestamp: now,
      expiresAt: now + ttl
    };

    // If key exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, entry);
    this.stats.sets++;

    // Evict oldest entry if cache is full
    if (this.cache.size > this.maxSize) {
      this.evictOldest();
    }
  }

  /**
   * Check if an entry has expired
   * @param {CacheEntry} entry - The cache entry
   * @returns {boolean} True if expired
   */
  isExpired(entry) {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Evict the oldest (least recently used) entry
   */
  evictOldest() {
    // Map maintains insertion order, so first key is oldest
    const firstKey = this.cache.keys().next().value;
    if (firstKey !== undefined) {
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
  }

  /**
   * Check if a key exists in cache (and is not expired)
   * @param {string} key - Cache key
   * @returns {boolean} True if key exists and is not expired
   */
  has(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      return false;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.expirations++;
      return false;
    }

    return true;
  }

  /**
   * Delete a specific key from cache
   * @param {string} key - Cache key
   * @returns {boolean} True if key was deleted
   */
  delete(key) {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear() {
    this.cache.clear();
    this.resetStats();
  }

  /**
   * Get current cache size
   * @returns {number} Number of entries in cache
   */
  size() {
    return this.cache.size;
  }

  /**
   * Clean up expired entries
   * @returns {number} Number of entries removed
   */
  cleanup() {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.expirations++;
        removed++;
      }
    }

    return removed;
  }

  /**
   * Start automatic cleanup interval
   */
  startAutoCleanup() {
    if (this.cleanupTimer) {
      return; // Already running
    }

    this.cleanupTimer = setInterval(() => {
      const removed = this.cleanup();
      if (removed > 0) {
        console.log(`[CacheManager] Cleaned up ${removed} expired entries`);
      }
    }, this.cleanupInterval);
  }

  /**
   * Stop automatic cleanup interval
   */
  stopAutoCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      ttl: this.ttl
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      expirations: 0,
      sets: 0
    };
  }

  /**
   * Get all keys in cache
   * @returns {string[]} Array of cache keys
   */
  keys() {
    return Array.from(this.cache.keys());
  }

  /**
   * Get all values in cache (non-expired only)
   * @returns {Array} Array of cached values
   */
  values() {
    const values = [];

    for (const [key, entry] of this.cache.entries()) {
      if (!this.isExpired(entry)) {
        values.push(entry.value);
      }
    }

    return values;
  }

  /**
   * Destroy the cache manager (cleanup resources)
   */
  destroy() {
    this.stopAutoCleanup();
    this.clear();
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CacheManager };
}
