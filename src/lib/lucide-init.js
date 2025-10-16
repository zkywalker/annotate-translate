/**
 * Lucide Icons Initializer
 * 初始化 Lucide 图标库（用于 HTML 页面）
 */

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLucide);
} else {
  initLucide();
}

function initLucide() {
  if (typeof lucide !== 'undefined' && lucide.createIcons) {
    lucide.createIcons();
    console.log('[Lucide] Icons initialized in HTML page');
  } else {
    console.warn('[Lucide] Library not loaded');
  }
}
