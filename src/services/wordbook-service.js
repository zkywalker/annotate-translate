/**
 * Wordbook Service
 * Manages word collection, SM-2 spaced repetition, group management, and statistics.
 * Storage: chrome.storage.local key "wordbook"
 *
 * Improvements based on learning science research:
 * - Learning-status priority scheduling (Cepeda et al., 2006)
 * - Daily new word limit (Sweller, 1994 - Cognitive Load Theory)
 * - Interleaving strategy (Rohrer & Taylor, 2007)
 * - Adaptive mode recommendation (Dunlosky et al., 2013)
 * - Spelling tolerance via Levenshtein distance
 */

class WordbookService {
  constructor() {
    this.data = null;
    this._initialized = false;
  }

  async init() {
    if (this._initialized) return;
    try {
      const result = await chrome.storage.local.get('wordbook');
      this.data = result.wordbook || this._createDefaultData();
      if (this.data.version !== 1) {
        this.data = this._migrate(this.data);
      }
      this._initialized = true;
    } catch (e) {
      console.error('[WordbookService] Init failed:', e);
      this.data = this._createDefaultData();
      this._initialized = true;
    }
  }

  _createDefaultData() {
    return {
      version: 1,
      entries: {},
      groups: [
        { id: 'default', name: 'Default', color: '#6b7280', createdAt: Date.now() }
      ],
      stats: {
        totalCollected: 0,
        totalReviews: 0,
        streakDays: 0,
        lastStudyDate: '',
        dailyHistory: {}
      }
    };
  }

  _migrate(data) {
    data.version = 1;
    if (!data.entries) data.entries = {};
    if (!data.groups) data.groups = [{ id: 'default', name: 'Default', color: '#6b7280', createdAt: Date.now() }];
    if (!data.stats) data.stats = { totalCollected: 0, totalReviews: 0, streakDays: 0, lastStudyDate: '', dailyHistory: {} };
    return data;
  }

  // ==================== CRUD ====================

  /**
   * Add word from TranslationResult
   * BR-001: dedup by word.toLowerCase() + targetLang
   * BR-002: max 5000 entries
   * Daily new word limit: 15 (Cognitive Load Theory)
   */
  async addWord(result, context = '') {
    await this.init();

    const existing = this.findByWord(result.originalText, result.targetLang);
    if (existing) {
      existing.translation = result.translatedText;
      existing.phonetics = result.phonetics || [];
      existing.definitions = (result.definitions || []).slice(0, 5);
      existing.examples = (result.examples || []).slice(0, 3);
      existing.context = (context || '').slice(0, 200);
      existing.sourceUrl = typeof location !== 'undefined' ? location.href : '';
      await this._save();
      return existing;
    }

    if (Object.keys(this.data.entries).length >= 5000) {
      throw new Error('Wordbook is full (5000 words max).');
    }

    // Daily new word limit check
    const today = new Date().toISOString().split('T')[0];
    const todayNew = Object.values(this.data.entries).filter(e => {
      const d = new Date(e.createdAt).toISOString().split('T')[0];
      return d === today;
    }).length;
    if (todayNew >= 50) {
      throw new Error('Daily collection limit reached (50/day).');
    }

    const entry = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      word: result.originalText,
      translation: result.translatedText,
      phonetics: result.phonetics || [],
      definitions: (result.definitions || []).slice(0, 5),
      examples: (result.examples || []).slice(0, 3),
      sourceLang: result.sourceLang || 'auto',
      targetLang: result.targetLang,
      context: (context || '').slice(0, 200),
      sourceUrl: typeof location !== 'undefined' ? location.href : '',
      groups: ['default'],
      createdAt: Date.now(),
      review: {
        repetitions: 0,
        easeFactor: 2.5,
        interval: 0,
        nextReviewAt: Date.now(),
        lastReviewAt: 0,
        totalReviews: 0,
        correctCount: 0,
        status: 'new',
        // FSRS-ready: review log for future algorithm migration
        log: []
      }
    };

    this.data.entries[entry.id] = entry;
    this.data.stats.totalCollected += 1;
    this._updateDailyStats('newWords', 1);
    await this._save();
    return entry;
  }

  async removeWord(id) {
    await this.init();
    if (this.data.entries[id]) {
      delete this.data.entries[id];
      await this._save();
      return true;
    }
    return false;
  }

  isCollected(word, targetLang) {
    if (!this.data) return false;
    const key = word.toLowerCase() + targetLang;
    return Object.values(this.data.entries).some(
      e => e.word.toLowerCase() + e.targetLang === key
    );
  }

  findByWord(word, targetLang) {
    if (!this.data) return null;
    const key = word.toLowerCase() + targetLang;
    return Object.values(this.data.entries).find(
      e => e.word.toLowerCase() + e.targetLang === key
    ) || null;
  }

  getEntry(id) {
    return this.data ? this.data.entries[id] || null : null;
  }

  async updateWord(id, updates) {
    await this.init();
    const entry = this.data.entries[id];
    if (!entry) return null;
    Object.assign(entry, updates);
    await this._save();
    return entry;
  }

  getEntries({ search = '', group = '', sort = 'newest', page = 1, pageSize = 20 } = {}) {
    if (!this.data) return { entries: [], total: 0, pages: 0 };

    let entries = Object.values(this.data.entries);

    if (group) entries = entries.filter(e => e.groups.includes(group));

    if (search) {
      const q = search.toLowerCase();
      entries = entries.filter(e =>
        e.word.toLowerCase().includes(q) || e.translation.toLowerCase().includes(q)
      );
    }

    switch (sort) {
      case 'oldest': entries.sort((a, b) => a.createdAt - b.createdAt); break;
      case 'alpha': entries.sort((a, b) => a.word.localeCompare(b.word)); break;
      case 'status':
        const statusOrder = { new: 0, learning: 1, review: 2, mastered: 3 };
        entries.sort((a, b) => statusOrder[a.review.status] - statusOrder[b.review.status]);
        break;
      default: entries.sort((a, b) => b.createdAt - a.createdAt);
    }

    const total = entries.length;
    const pages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    entries = entries.slice(start, start + pageSize);

    return { entries, total, pages };
  }

  // ==================== SM-2 Algorithm ====================

  /**
   * SM-2 with reaction time adjustment
   * quality: 1=don't know, 2=barely, 3=hard, 4=remembered, 5=easy
   * responseTimeMs: optional, used for quality fine-tuning
   */
  sm2(reviewState, quality, responseTimeMs = null) {
    let { repetitions, easeFactor, interval } = reviewState;

    // Adjust quality by response time (Dunlosky et al., 2013)
    if (responseTimeMs !== null && quality >= 3) {
      if (responseTimeMs < 2000 && quality === 4) quality = 5; // fast + correct = easy
      else if (responseTimeMs > 8000 && quality === 4) quality = 3; // slow + correct = hard
    }

    if (quality < 3) {
      repetitions = 0;
      interval = 0;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 3;
      else interval = Math.round(interval * easeFactor);
      repetitions += 1;
    }

    easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (easeFactor < 1.3) easeFactor = 1.3;

    let status;
    if (repetitions === 0) status = 'learning';
    else if (interval >= 21 && repetitions >= 5) status = 'mastered';
    else status = 'review';

    return {
      repetitions,
      easeFactor: Math.round(easeFactor * 100) / 100,
      interval,
      nextReviewAt: Date.now() + interval * 24 * 60 * 60 * 1000,
      lastReviewAt: Date.now(),
      totalReviews: reviewState.totalReviews + 1,
      correctCount: quality >= 3 ? reviewState.correctCount + 1 : reviewState.correctCount,
      status,
      log: reviewState.log || []
    };
  }

  // ==================== Improved Scheduler ====================

  /**
   * Select words for review with interleaving and learning-priority
   * Priority: learning(overdue) > review(overdue) > new (max 7 per session)
   * Interleaving: mix different statuses (Rohrer & Taylor, 2007)
   */
  selectReviewWords(sessionSize = 20, groupFilter = '') {
    if (!this.data) return [];

    let entries = Object.values(this.data.entries);
    if (groupFilter) entries = entries.filter(e => e.groups.includes(groupFilter));

    const now = Date.now();

    // Separate by priority
    const overdueLearning = entries.filter(e =>
      e.review.nextReviewAt <= now && e.review.status === 'learning'
    ).sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);

    const overdueReview = entries.filter(e =>
      e.review.nextReviewAt <= now && e.review.status === 'review'
    ).sort((a, b) => a.review.nextReviewAt - b.review.nextReviewAt);

    const newWords = entries.filter(e => e.review.status === 'new')
      .sort((a, b) => a.createdAt - b.createdAt);

    // Build selection with limits
    const maxNewPerSession = Math.min(7, Math.floor(sessionSize * 0.35));
    const selected = [];

    // 1. All overdue learning words first
    selected.push(...overdueLearning.slice(0, sessionSize));

    // 2. Fill with overdue review words
    if (selected.length < sessionSize) {
      selected.push(...overdueReview.slice(0, sessionSize - selected.length));
    }

    // 3. Fill with new words (capped)
    if (selected.length < sessionSize) {
      const newSlots = Math.min(maxNewPerSession, sessionSize - selected.length);
      selected.push(...newWords.slice(0, newSlots));
    }

    // Interleave: shuffle by status to mix different types
    return this._interleave(selected);
  }

  /**
   * Interleave words of different statuses for better learning
   * Groups words by status, then round-robin picks from each group
   */
  _interleave(words) {
    if (words.length <= 3) return words;

    const buckets = {};
    words.forEach(w => {
      const s = w.review.status;
      if (!buckets[s]) buckets[s] = [];
      buckets[s].push(w);
    });

    const keys = Object.keys(buckets);
    if (keys.length <= 1) return words;

    const result = [];
    let idx = 0;
    while (result.length < words.length) {
      const key = keys[idx % keys.length];
      if (buckets[key].length > 0) {
        result.push(buckets[key].shift());
      }
      idx++;
      // Safety: if all buckets empty, break
      if (keys.every(k => buckets[k].length === 0)) break;
    }
    return result;
  }

  /**
   * Recommend review mode based on repetition count
   * 0-2 reps → flashcard, 2-5 → quiz, 5+ → spelling
   */
  recommendMode(entry) {
    const reps = entry.review.repetitions;
    if (reps <= 2) return 'flashcard';
    if (reps <= 5) return 'quiz';
    return 'spelling';
  }

  // ==================== Review ====================

  /**
   * Record review with optional response time tracking
   */
  async recordReview(id, quality, responseTimeMs = null) {
    await this.init();
    const entry = this.data.entries[id];
    if (!entry) return null;

    // Append to FSRS-ready log
    if (!entry.review.log) entry.review.log = [];
    entry.review.log.push({
      ts: Date.now(),
      q: quality,
      rt: responseTimeMs,
      ef: entry.review.easeFactor,
      iv: entry.review.interval,
      reps: entry.review.repetitions
    });
    // Keep last 30 log entries
    if (entry.review.log.length > 30) {
      entry.review.log = entry.review.log.slice(-30);
    }

    const newState = this.sm2(entry.review, quality, responseTimeMs);
    entry.review = newState;

    this.data.stats.totalReviews += 1;
    this._updateDailyStats('reviewed', 1);
    if (quality >= 3) this._updateDailyStats('correct', 1);
    this._updateStreak();

    await this._save();
    return entry;
  }

  getReviewCount() {
    if (!this.data) return 0;
    const now = Date.now();
    return Object.values(this.data.entries).filter(
      e => e.review.nextReviewAt <= now && e.review.status !== 'mastered'
    ).length;
  }

  // ==================== Spelling Helpers ====================

  /**
   * Levenshtein distance for spelling tolerance
   */
  static levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  }

  /**
   * Evaluate spelling answer with tolerance
   * Returns { quality, accuracy, verdict }
   */
  static evaluateSpelling(userAnswer, correctWord) {
    const ua = userAnswer.trim().toLowerCase();
    const cw = correctWord.toLowerCase();
    if (ua === cw) return { quality: 5, accuracy: 1, verdict: 'perfect' };

    const dist = WordbookService.levenshtein(ua, cw);
    const accuracy = 1 - (dist / Math.max(cw.length, 1));

    if (accuracy >= 0.85) return { quality: 3, accuracy, verdict: 'close' };  // minor typo
    if (accuracy >= 0.6) return { quality: 2, accuracy, verdict: 'partial' }; // half right
    return { quality: 1, accuracy, verdict: 'wrong' };
  }

  /**
   * Generate progressive hint based on difficulty
   */
  static generateHint(word, level = 1) {
    if (level >= 3) {
      // Show every other letter
      return word.split('').map((c, i) => i % 2 === 0 ? c : '_').join(' ');
    }
    if (level >= 2) {
      // First, last + length
      return word[0] + ' ' + '_  '.repeat(word.length - 2).trim() + ' ' + word[word.length - 1];
    }
    // Level 1: just length
    return '_ '.repeat(word.length).trim() + ` (${word.length})`;
  }

  // ==================== Quiz Helpers ====================

  /**
   * Generate smart distractors for quiz mode
   * Prefers: same part-of-speech > same word length > random
   */
  generateDistracters(targetEntry, count = 3) {
    if (!this.data) return [];
    const all = Object.values(this.data.entries).filter(
      e => e.id !== targetEntry.id && e.translation
    );
    if (all.length < count) return all.map(e => e.translation);

    const targetPOS = targetEntry.definitions?.[0]?.partOfSpeech || '';
    const targetLen = targetEntry.translation.length;

    // Score each candidate
    const scored = all.map(e => {
      let score = 0;
      // Same POS bonus
      if (targetPOS && e.definitions?.[0]?.partOfSpeech === targetPOS) score += 3;
      // Similar translation length bonus
      const lenDiff = Math.abs(e.translation.length - targetLen);
      if (lenDiff <= 2) score += 2;
      else if (lenDiff <= 5) score += 1;
      // Add randomness to avoid always same distractors
      score += Math.random() * 2;
      return { entry: e, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, count).map(s => s.entry.translation);
  }

  // ==================== Group Management ====================

  addGroup(name, color = '#6b7280') {
    if (!name || name.length > 30) return null;
    if (this.data.groups.some(g => g.name === name)) return null;
    const group = {
      id: `group_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      name, color, createdAt: Date.now()
    };
    this.data.groups.push(group);
    this._save();
    return group;
  }

  async removeGroup(groupId) {
    if (groupId === 'default') return false;
    const idx = this.data.groups.findIndex(g => g.id === groupId);
    if (idx === -1) return false;
    this.data.groups.splice(idx, 1);
    Object.values(this.data.entries).forEach(entry => {
      const gIdx = entry.groups.indexOf(groupId);
      if (gIdx !== -1) {
        entry.groups.splice(gIdx, 1);
        if (entry.groups.length === 0) entry.groups.push('default');
      }
    });
    await this._save();
    return true;
  }

  async renameGroup(groupId, newName) {
    if (groupId === 'default' || !newName || newName.length > 30) return false;
    if (this.data.groups.some(g => g.name === newName && g.id !== groupId)) return false;
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return false;
    group.name = newName;
    await this._save();
    return true;
  }

  async setGroupColor(groupId, color) {
    const group = this.data.groups.find(g => g.id === groupId);
    if (!group) return false;
    group.color = color;
    await this._save();
    return true;
  }

  getGroups() {
    return this.data ? this.data.groups : [];
  }

  async moveToGroup(entryIds, targetGroupId) {
    await this.init();
    const group = this.data.groups.find(g => g.id === targetGroupId);
    if (!group) return false;
    entryIds.forEach(id => {
      const entry = this.data.entries[id];
      if (entry && !entry.groups.includes(targetGroupId)) entry.groups.push(targetGroupId);
    });
    await this._save();
    return true;
  }

  async batchDelete(entryIds) {
    await this.init();
    entryIds.forEach(id => delete this.data.entries[id]);
    await this._save();
    return true;
  }

  // ==================== Stats ====================

  getStats() { return this.data ? this.data.stats : null; }

  getStatusDistribution() {
    if (!this.data) return { new: 0, learning: 0, review: 0, mastered: 0 };
    const dist = { new: 0, learning: 0, review: 0, mastered: 0 };
    Object.values(this.data.entries).forEach(e => {
      dist[e.review.status] = (dist[e.review.status] || 0) + 1;
    });
    return dist;
  }

  getLast7DaysHistory() {
    if (!this.data) return [];
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const key = date.toISOString().split('T')[0];
      const dayStats = this.data.stats.dailyHistory[key] || { reviewed: 0, correct: 0, newWords: 0 };
      days.push({ date: key, ...dayStats });
    }
    return days;
  }

  _updateDailyStats(field, increment) {
    const today = new Date().toISOString().split('T')[0];
    if (!this.data.stats.dailyHistory[today]) {
      this.data.stats.dailyHistory[today] = { reviewed: 0, correct: 0, newWords: 0 };
    }
    this.data.stats.dailyHistory[today][field] += increment;
  }

  _updateStreak() {
    const today = new Date().toISOString().split('T')[0];
    if (this.data.stats.lastStudyDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    if (this.data.stats.lastStudyDate === yesterdayStr) {
      this.data.stats.streakDays += 1;
    } else {
      this.data.stats.streakDays = 1;
    }
    this.data.stats.lastStudyDate = today;
  }

  _cleanOldHistory() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 90);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    Object.keys(this.data.stats.dailyHistory).forEach(date => {
      if (date < cutoffStr) delete this.data.stats.dailyHistory[date];
    });
  }

  // ==================== Persistence ====================

  async _save() {
    this._cleanOldHistory();
    try {
      await chrome.storage.local.set({ wordbook: this.data });
    } catch (e) {
      console.error('[WordbookService] Save failed:', e);
    }
  }

  getData() { return this.data; }

  async importData(importedData) {
    await this.init();
    if (!importedData || !importedData.entries) return;
    Object.values(importedData.entries).forEach(imported => {
      const existing = this.findByWord(imported.word, imported.targetLang);
      if (existing) {
        if (imported.review.repetitions > existing.review.repetitions) {
          this.data.entries[existing.id] = { ...imported, id: existing.id };
        }
      } else {
        this.data.entries[imported.id] = imported;
      }
    });
    if (importedData.groups) {
      importedData.groups.forEach(g => {
        if (!this.data.groups.some(eg => eg.id === g.id)) this.data.groups.push(g);
      });
    }
    await this._save();
  }
}

const wordbookService = new WordbookService();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { WordbookService, wordbookService };
}
