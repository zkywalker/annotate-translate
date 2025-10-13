/**
 * Lucide Icons Loader
 * 从扩展包加载 Lucide 图标库
 */

(function() {
  // 检查是否已经加载
  if (typeof window.lucide !== 'undefined') {
    console.log('[Lucide] Already loaded');
    return;
  }

  // 从扩展包加载 Lucide
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('lucide.min.js');
  script.async = true;
  
  script.onload = function() {
    console.log('[Lucide] Loaded successfully from extension');
    
    // 初始化页面上的图标
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      console.log('[Lucide] Icons initialized');
    }
  };
  
  script.onerror = function() {
    console.error('[Lucide] Failed to load from extension');
  };
  
  // 添加到 head
  (document.head || document.documentElement).appendChild(script);
})();
