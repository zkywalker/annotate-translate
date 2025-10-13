/**
 * Lucide Icons Loader
 * 动态加载 Lucide 图标库
 */

(function() {
  // 检查是否已经加载
  if (typeof window.lucide !== 'undefined') {
    console.log('[Lucide] Already loaded');
    return;
  }

  // 创建 script 标签加载 Lucide
  const script = document.createElement('script');
  script.src = 'https://unpkg.com/lucide@latest/dist/umd/lucide.min.js';
  script.async = true;
  
  script.onload = function() {
    console.log('[Lucide] Loaded successfully');
    
    // 初始化页面上的图标
    if (typeof lucide !== 'undefined' && lucide.createIcons) {
      lucide.createIcons();
      console.log('[Lucide] Icons initialized');
    }
  };
  
  script.onerror = function() {
    console.error('[Lucide] Failed to load');
  };
  
  // 添加到 head
  (document.head || document.documentElement).appendChild(script);
})();
