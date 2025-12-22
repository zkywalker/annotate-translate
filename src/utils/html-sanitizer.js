/**
 * HTML Sanitizer Utility
 * Provides safe HTML sanitization to prevent XSS attacks
 *
 * This implementation uses DOM-based sanitization which is more secure
 * than regex-based approaches.
 */

/**
 * Sanitizes HTML by allowing only safe tags and attributes
 * @param {string} html - The HTML string to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML string
 */
function sanitizeHTML(html, options = {}) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Default allowed tags and attributes
  const defaultAllowedTags = ['b', 'i', 'em', 'strong', 'u', 'mark', 'span'];
  const defaultAllowedAttributes = ['class']; // Only allow class attribute

  const allowedTags = options.allowedTags || defaultAllowedTags;
  const allowedAttributes = options.allowedAttributes || defaultAllowedAttributes;

  // Create a temporary DOM element to parse the HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Recursively sanitize all nodes
  sanitizeNode(temp, allowedTags, allowedAttributes);

  return temp.innerHTML;
}

/**
 * Recursively sanitize a DOM node and its children
 * @param {Node} node - The DOM node to sanitize
 * @param {string[]} allowedTags - Array of allowed tag names
 * @param {string[]} allowedAttributes - Array of allowed attribute names
 */
function sanitizeNode(node, allowedTags, allowedAttributes) {
  // Process all child nodes
  const children = Array.from(node.childNodes);

  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const tagName = child.tagName.toLowerCase();

      // If tag is not allowed, replace it with its text content
      if (!allowedTags.includes(tagName)) {
        const textNode = document.createTextNode(child.textContent);
        node.replaceChild(textNode, child);
        continue;
      }

      // Remove all disallowed attributes
      const attributes = Array.from(child.attributes);
      for (const attr of attributes) {
        if (!allowedAttributes.includes(attr.name.toLowerCase())) {
          child.removeAttribute(attr.name);
        }
      }

      // Recursively sanitize children
      sanitizeNode(child, allowedTags, allowedAttributes);
    } else if (child.nodeType === Node.TEXT_NODE) {
      // Text nodes are safe, do nothing
      continue;
    } else {
      // Remove any other node types (comments, etc.)
      node.removeChild(child);
    }
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * Use this when you want to display HTML as text
 * @param {string} text - The text to escape
 * @returns {string} Escaped text
 */
function escapeHTML(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Unescape HTML entities back to characters
 * @param {string} html - The HTML to unescape
 * @returns {string} Unescaped text
 */
function unescapeHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent;
}

/**
 * Strip all HTML tags from a string
 * @param {string} html - The HTML string
 * @returns {string} Plain text without HTML tags
 */
function stripHTML(html) {
  if (!html || typeof html !== 'string') {
    return '';
  }

  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeHTML,
    escapeHTML,
    unescapeHTML,
    stripHTML
  };
}
