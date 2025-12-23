/**
 * TokenStatsService - AI Provider Token Usage Statistics
 *
 * Tracks token usage for AI translation providers:
 * - Input tokens (prompt tokens)
 * - Output tokens (completion tokens)
 * - Total tokens
 * - Estimated cost
 * - Request count
 */
class TokenStatsService {
  constructor() {
    this.storageKey = 'tokenStats';
    this.stats = {};
    this.initialized = false;
  }

  /**
   * Initialize service and load stats from storage
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      const result = await chrome.storage.local.get(this.storageKey);
      this.stats = result[this.storageKey] || {};
      this.initialized = true;
      console.log('[TokenStatsService] Initialized with stats:', this.stats);
    } catch (error) {
      console.error('[TokenStatsService] Failed to load stats:', error);
      this.stats = {};
      this.initialized = true;
    }
  }

  /**
   * Record token usage for a translation
   * @param {string} providerName - Provider display name (e.g., "AI翻译 · DeepSeek")
   * @param {Object} usage - Token usage info
   * @param {number} usage.promptTokens - Input tokens
   * @param {number} usage.completionTokens - Output tokens
   * @param {number} usage.totalTokens - Total tokens
   * @param {number} [usage.cost] - Estimated cost (optional)
   */
  async recordUsage(providerName, usage) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { promptTokens = 0, completionTokens = 0, totalTokens = 0, cost = 0 } = usage;

    if (!this.stats[providerName]) {
      this.stats[providerName] = {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        requestCount: 0,
        lastUpdated: Date.now()
      };
    }

    const stats = this.stats[providerName];
    stats.totalInputTokens += promptTokens;
    stats.totalOutputTokens += completionTokens;
    stats.totalTokens += totalTokens;
    stats.totalCost += cost;
    stats.requestCount += 1;
    stats.lastUpdated = Date.now();

    await this.saveStats();

    console.log(`[TokenStatsService] Recorded usage for ${providerName}:`, {
      promptTokens,
      completionTokens,
      totalTokens,
      cost,
      totalStats: stats
    });
  }

  /**
   * Get stats for a specific provider
   * @param {string} providerName - Provider display name
   * @returns {Object|null} Stats object or null if not found
   */
  async getProviderStats(providerName) {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.stats[providerName] || null;
  }

  /**
   * Get stats for all providers
   * @returns {Object} All provider stats
   */
  async getAllStats() {
    if (!this.initialized) {
      await this.initialize();
    }

    return { ...this.stats };
  }

  /**
   * Reset stats for a specific provider
   * @param {string} providerName - Provider display name
   */
  async resetProviderStats(providerName) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (this.stats[providerName]) {
      delete this.stats[providerName];
      await this.saveStats();
      console.log(`[TokenStatsService] Reset stats for ${providerName}`);
    }
  }

  /**
   * Reset all stats
   */
  async resetAllStats() {
    this.stats = {};
    await this.saveStats();
    console.log('[TokenStatsService] Reset all stats');
  }

  /**
   * Save stats to storage
   * @private
   */
  async saveStats() {
    try {
      await chrome.storage.local.set({ [this.storageKey]: this.stats });
    } catch (error) {
      console.error('[TokenStatsService] Failed to save stats:', error);
    }
  }

  /**
   * Format token count with K/M suffixes
   * @param {number} count - Token count
   * @returns {string} Formatted string
   */
  formatTokenCount(count) {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(2) + 'M';
    } else if (count >= 1000) {
      return (count / 1000).toFixed(2) + 'K';
    }
    return count.toString();
  }

  /**
   * Format cost
   * @param {number} cost - Cost in USD
   * @returns {string} Formatted cost string
   */
  formatCost(cost) {
    if (cost < 0.01) {
      return '<$0.01';
    }
    return '$' + cost.toFixed(2);
  }
}

// Create global singleton
const tokenStatsService = new TokenStatsService();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TokenStatsService, tokenStatsService };
}
