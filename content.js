// Content Script for Annotate Translate Extension

let settings = {
  enableTranslate: true,
  enableAnnotate: true,
  targetLanguage: 'en'
};

let annotations = new Map();

// Initialize the extension
init();

function init() {
  // Load settings from storage
  chrome.storage.sync.get({
    enableTranslate: true,
    enableAnnotate: true,
    targetLanguage: 'en'
  }, function(items) {
    settings = items;
  });

  // Listen for text selection
  document.addEventListener('mouseup', handleTextSelection);

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener(handleMessage);
}

// Handle text selection events
function handleTextSelection(event) {
  const selectedText = window.getSelection().toString().trim();
  
  if (selectedText && (settings.enableTranslate || settings.enableAnnotate)) {
    showContextMenu(event.pageX, event.pageY, selectedText);
  } else {
    hideContextMenu();
  }
}

// Show context menu for selected text
function showContextMenu(x, y, text) {
  hideContextMenu();
  
  const menu = document.createElement('div');
  menu.id = 'annotate-translate-menu';
  menu.className = 'annotate-translate-menu';
  menu.style.left = x + 'px';
  menu.style.top = y + 'px';

  if (settings.enableTranslate) {
    const translateBtn = document.createElement('button');
    translateBtn.textContent = 'Translate';
    translateBtn.className = 'menu-button';
    translateBtn.addEventListener('click', () => translateText(text));
    menu.appendChild(translateBtn);
  }

  if (settings.enableAnnotate) {
    const annotateBtn = document.createElement('button');
    annotateBtn.textContent = 'Annotate';
    annotateBtn.className = 'menu-button';
    annotateBtn.addEventListener('click', () => annotateText(text));
    menu.appendChild(annotateBtn);
  }

  document.body.appendChild(menu);

  // Hide menu when clicking outside
  setTimeout(() => {
    document.addEventListener('click', hideContextMenu, { once: true });
  }, 100);
}

// Hide context menu
function hideContextMenu() {
  const menu = document.getElementById('annotate-translate-menu');
  if (menu) {
    menu.remove();
  }
}

// Translate selected text
function translateText(text) {
  hideContextMenu();
  
  // Create translation tooltip
  const tooltip = document.createElement('div');
  tooltip.className = 'annotate-translate-tooltip';
  tooltip.textContent = 'Translating...';
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    tooltip.style.left = (rect.left + window.scrollX) + 'px';
    tooltip.style.top = (rect.bottom + window.scrollY + 5) + 'px';
  }
  
  document.body.appendChild(tooltip);

  // Simulate translation (in real implementation, call translation API)
  setTimeout(() => {
    tooltip.textContent = `Translation: [${text}]`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      tooltip.remove();
    }, 5000);
  }, 500);
}

// Annotate selected text
function annotateText(text) {
  hideContextMenu();
  
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    
    // Prompt user for annotation text
    const annotation = prompt('Enter annotation text:', '');
    if (annotation) {
      createRubyAnnotation(range, text, annotation);
    }
  }
}

// Create ruby annotation for context menu action
function annotateSelectedText(text) {
  const selection = window.getSelection();
  if (selection.rangeCount > 0 && selection.toString().trim() === text) {
    const range = selection.getRangeAt(0);
    
    // Prompt user for annotation text
    const annotation = prompt('Enter annotation for "' + text + '":', '');
    if (annotation) {
      createRubyAnnotation(range, text, annotation);
    }
  }
}

// Create ruby tag annotation
function createRubyAnnotation(range, baseText, annotationText) {
  try {
    // Create ruby element structure
    const ruby = document.createElement('ruby');
    ruby.className = 'annotate-translate-ruby';
    ruby.setAttribute('data-annotation', annotationText);
    ruby.setAttribute('data-base-text', baseText);
    
    // Add base text
    ruby.textContent = baseText;
    
    // Create rt (ruby text) element for annotation
    const rt = document.createElement('rt');
    rt.className = 'annotate-translate-rt';
    rt.textContent = annotationText;
    ruby.appendChild(rt);
    
    // Replace the selected text with the ruby element
    range.deleteContents();
    range.insertNode(ruby);
    
    // Store annotation
    annotations.set(ruby, {
      base: baseText,
      annotation: annotationText
    });
    
    // Save annotation to storage
    saveAnnotation(baseText, annotationText);
    
    // Clear selection
    window.getSelection().removeAllRanges();
  } catch (e) {
    console.error('Failed to create ruby annotation:', e);
    alert('Failed to annotate text. Please try selecting the text again.');
  }
}

// Save annotation to storage
function saveAnnotation(baseText, annotationText) {
  chrome.storage.local.get({annotations: []}, function(result) {
    const annotations = result.annotations;
    annotations.push({
      baseText: baseText,
      annotationText: annotationText || '',
      timestamp: Date.now(),
      url: window.location.href
    });
    chrome.storage.local.set({annotations: annotations});
  });
}

// Handle messages from popup or background
function handleMessage(request, sender, sendResponse) {
  if (request.action === 'updateSettings') {
    settings = request.settings;
    sendResponse({success: true});
  } else if (request.action === 'clearAnnotations') {
    clearAllAnnotations();
    sendResponse({success: true});
  } else if (request.action === 'annotate' && request.text) {
    // Handle annotate action from context menu
    annotateSelectedText(request.text);
    sendResponse({success: true});
  } else if (request.action === 'translate' && request.text) {
    // Handle translate action from context menu
    translateText(request.text);
    sendResponse({success: true});
  }
  return true;
}

// Clear all annotations from the page
function clearAllAnnotations() {
  // Clear old style highlights
  const highlights = document.querySelectorAll('.annotate-translate-highlight');
  highlights.forEach(highlight => {
    const parent = highlight.parentNode;
    while (highlight.firstChild) {
      parent.insertBefore(highlight.firstChild, highlight);
    }
    parent.removeChild(highlight);
  });
  
  // Clear ruby annotations
  const rubyElements = document.querySelectorAll('ruby.annotate-translate-ruby');
  rubyElements.forEach(ruby => {
    const baseText = ruby.getAttribute('data-base-text') || ruby.textContent;
    const textNode = document.createTextNode(baseText);
    ruby.parentNode.replaceChild(textNode, ruby);
  });
  
  annotations.clear();
  
  // Clear from storage
  chrome.storage.local.set({annotations: []});
}
