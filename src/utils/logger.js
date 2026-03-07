/**
 * Debug Logger Utility
 * Wraps console.log with a debug guard to reduce noise in production.
 * console.warn and console.error always output.
 */
const logger = {
  _enabled: false,

  enable() { this._enabled = true; },
  disable() { this._enabled = false; },

  log(...args) {
    if (this._enabled) console.log(...args);
  },
  warn(...args) {
    console.warn(...args);
  },
  error(...args) {
    console.error(...args);
  }
};

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { logger };
}
