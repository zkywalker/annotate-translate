/**
 * Event Listener Manager
 * Provides centralized event listener management to prevent memory leaks
 * Automatically tracks and cleans up event listeners
 */

/**
 * Event Listener Manager Class
 * Tracks all event listeners and provides cleanup functionality
 */
class EventListenerManager {
  constructor() {
    // Store all registered listeners
    // Structure: Map<element, Map<eventType, Set<{listener, options, controller}>>>
    this.listeners = new Map();

    // Statistics
    this.stats = {
      added: 0,
      removed: 0,
      cleanedUp: 0
    };
  }

  /**
   * Add an event listener with automatic tracking
   * @param {EventTarget} element - The element to attach listener to
   * @param {string} eventType - The event type (e.g., 'click', 'mouseup')
   * @param {Function} listener - The event listener function
   * @param {Object|boolean} options - Event listener options or useCapture
   * @returns {AbortController} AbortController for manual cleanup
   */
  add(element, eventType, listener, options = {}) {
    if (!element || typeof listener !== 'function') {
      console.warn('[EventListenerManager] Invalid element or listener');
      return null;
    }

    // Create AbortController for this listener
    const controller = new AbortController();

    // Merge options with signal
    const listenerOptions = typeof options === 'boolean'
      ? { capture: options, signal: controller.signal }
      : { ...options, signal: controller.signal };

    // Add the event listener
    element.addEventListener(eventType, listener, listenerOptions);

    // Track the listener
    this.trackListener(element, eventType, listener, listenerOptions, controller);

    this.stats.added++;

    return controller;
  }

  /**
   * Track a listener for cleanup
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener function
   * @param {Object} options - Listener options
   * @param {AbortController} controller - Abort controller
   */
  trackListener(element, eventType, listener, options, controller) {
    if (!this.listeners.has(element)) {
      this.listeners.set(element, new Map());
    }

    const elementListeners = this.listeners.get(element);

    if (!elementListeners.has(eventType)) {
      elementListeners.set(eventType, new Set());
    }

    elementListeners.get(eventType).add({
      listener,
      options,
      controller
    });
  }

  /**
   * Remove a specific event listener
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener function
   * @returns {boolean} True if listener was found and removed
   */
  remove(element, eventType, listener) {
    const elementListeners = this.listeners.get(element);

    if (!elementListeners) {
      return false;
    }

    const typeListeners = elementListeners.get(eventType);

    if (!typeListeners) {
      return false;
    }

    // Find and remove the listener
    for (const entry of typeListeners) {
      if (entry.listener === listener) {
        // Abort the listener (removes it from element)
        entry.controller.abort();

        // Remove from tracking
        typeListeners.delete(entry);

        // Cleanup empty maps
        if (typeListeners.size === 0) {
          elementListeners.delete(eventType);
        }

        if (elementListeners.size === 0) {
          this.listeners.delete(element);
        }

        this.stats.removed++;
        return true;
      }
    }

    return false;
  }

  /**
   * Remove all listeners from a specific element
   * @param {EventTarget} element - The element
   * @returns {number} Number of listeners removed
   */
  removeAllFromElement(element) {
    const elementListeners = this.listeners.get(element);

    if (!elementListeners) {
      return 0;
    }

    let removed = 0;

    for (const typeListeners of elementListeners.values()) {
      for (const entry of typeListeners) {
        entry.controller.abort();
        removed++;
        this.stats.removed++;
      }
    }

    this.listeners.delete(element);

    return removed;
  }

  /**
   * Remove all listeners of a specific type from an element
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @returns {number} Number of listeners removed
   */
  removeType(element, eventType) {
    const elementListeners = this.listeners.get(element);

    if (!elementListeners) {
      return 0;
    }

    const typeListeners = elementListeners.get(eventType);

    if (!typeListeners) {
      return 0;
    }

    let removed = 0;

    for (const entry of typeListeners) {
      entry.controller.abort();
      removed++;
      this.stats.removed++;
    }

    elementListeners.delete(eventType);

    if (elementListeners.size === 0) {
      this.listeners.delete(element);
    }

    return removed;
  }

  /**
   * Clean up all event listeners
   * @returns {number} Number of listeners cleaned up
   */
  cleanup() {
    let cleaned = 0;

    for (const elementListeners of this.listeners.values()) {
      for (const typeListeners of elementListeners.values()) {
        for (const entry of typeListeners) {
          entry.controller.abort();
          cleaned++;
        }
      }
    }

    this.listeners.clear();
    this.stats.cleanedUp += cleaned;

    return cleaned;
  }

  /**
   * Clean up listeners from removed DOM elements
   * @returns {number} Number of listeners cleaned up
   */
  cleanupOrphaned() {
    let cleaned = 0;

    for (const [element, elementListeners] of this.listeners.entries()) {
      // Check if element is still in the DOM
      if (element instanceof Node && !document.contains(element)) {
        for (const typeListeners of elementListeners.values()) {
          for (const entry of typeListeners) {
            entry.controller.abort();
            cleaned++;
            this.stats.cleanedUp++;
          }
        }

        this.listeners.delete(element);
      }
    }

    return cleaned;
  }

  /**
   * Get statistics about tracked listeners
   * @returns {Object} Statistics
   */
  getStats() {
    let totalListeners = 0;

    for (const elementListeners of this.listeners.values()) {
      for (const typeListeners of elementListeners.values()) {
        totalListeners += typeListeners.size;
      }
    }

    return {
      ...this.stats,
      active: totalListeners,
      elements: this.listeners.size
    };
  }

  /**
   * Create a one-time event listener
   * Automatically removes itself after firing once
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener function
   * @param {Object|boolean} options - Options
   * @returns {AbortController} Abort controller
   */
  once(element, eventType, listener, options = {}) {
    const onceOptions = typeof options === 'boolean'
      ? { capture: options, once: true }
      : { ...options, once: true };

    return this.add(element, eventType, listener, onceOptions);
  }

  /**
   * Create a delegated event listener
   * Listens on a parent element but filters by child selector
   * @param {EventTarget} parent - Parent element
   * @param {string} eventType - Event type
   * @param {string} selector - CSS selector for child elements
   * @param {Function} listener - Listener function
   * @param {Object|boolean} options - Options
   * @returns {AbortController} Abort controller
   */
  delegate(parent, eventType, selector, listener, options = {}) {
    const delegatedListener = (event) => {
      const target = event.target.closest(selector);

      if (target && parent.contains(target)) {
        listener.call(target, event);
      }
    };

    return this.add(parent, eventType, delegatedListener, options);
  }

  /**
   * Create a throttled event listener
   * Limits how often the listener can fire
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener function
   * @param {number} delay - Throttle delay in milliseconds
   * @param {Object|boolean} options - Options
   * @returns {AbortController} Abort controller
   */
  throttle(element, eventType, listener, delay, options = {}) {
    let lastCall = 0;

    const throttledListener = (event) => {
      const now = Date.now();

      if (now - lastCall >= delay) {
        lastCall = now;
        listener(event);
      }
    };

    return this.add(element, eventType, throttledListener, options);
  }

  /**
   * Create a debounced event listener
   * Waits for a pause in events before firing
   * @param {EventTarget} element - The element
   * @param {string} eventType - Event type
   * @param {Function} listener - Listener function
   * @param {number} delay - Debounce delay in milliseconds
   * @param {Object|boolean} options - Options
   * @returns {AbortController} Abort controller
   */
  debounce(element, eventType, listener, delay, options = {}) {
    let timeoutId = null;

    const debouncedListener = (event) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(() => {
        listener(event);
        timeoutId = null;
      }, delay);
    };

    return this.add(element, eventType, debouncedListener, options);
  }
}

// Create a global instance
const eventManager = new EventListenerManager();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EventListenerManager, eventManager };
}
