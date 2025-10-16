/**
 * Lucide Icons Loader
 * 从扩展包加载 Lucide 图标库
 */

(function() {
  // 检查是否已经加载
  if (typeof window.lucide !== 'undefined') {
    console.log('[Lucide] Already loaded');
    // 触发自定义事件通知已加载
    window.dispatchEvent(new CustomEvent('lucide-ready'));
    return;
  }

  // 从扩展包加载 Lucide
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL('lucide.min.js');
  // 不使用 async，确保按顺序加载
  script.async = false;
  
  script.onload = function() {
    console.log('[Lucide] Loaded successfully from extension');
    
    // 初始化页面上的图标
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      console.log('[Lucide] Icons initialized');
      
      // 触发自定义事件通知加载完成
      window.dispatchEvent(new CustomEvent('lucide-ready'));
    }
  };
  
  script.onerror = function() {
    console.error('[Lucide] Failed to load from extension');
  };
  
  // 添加到 head
  (document.head || document.documentElement).appendChild(script);
})();
