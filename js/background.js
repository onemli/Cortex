/**
 * Cortex - Bookmark Manager
 * Background Service Worker
 * @author Kerem Can ONEMLI
 * @version 1.0.0
*/

// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

// Initialize on install
browserAPI.runtime.onInstalled.addListener(() => {
    console.log('Cortex v1.0.0 installed successfully');
    
    // Remove existing context menu items first (prevent duplicate error)
    browserAPI.contextMenus.removeAll(() => {
      // Create context menu after cleanup
      browserAPI.contextMenus.create({
        id: 'cortex-add-bookmark',
        title: 'Add to Cortex',
        contexts: ['page', 'link', 'selection']
      }, () => {
        // Check for errors
        if (browserAPI.runtime.lastError) {
          console.log('Context menu creation error (ignored):', browserAPI.runtime.lastError);
        }
      });
    });
  });
  
  // Handle context menu clicks
  browserAPI.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'cortex-add-bookmark') {
      const url = info.linkUrl || info.pageUrl || tab.url;
      const title = info.selectionText || info.linkText || tab.title || '';
      
      // Store pending bookmark
      browserAPI.storage.local.set({
        pendingBookmark: {
          url: url,
          title: title,
          timestamp: Date.now()
        }
      }).catch(error => {
        console.error('Storage error:', error);
      });
      
      // Open popup
      browserAPI.action.openPopup().catch(error => {
        // Popup cannot be opened programmatically in some cases
        console.log('Popup open request:', error);
      });
    }
  });
  
  // Handle messages from content scripts
  browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getActiveTab') {
      browserAPI.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        sendResponse({ tab: tabs[0] });
      });
      return true; // Keep channel open for async response
    }
  });
  
  // Clean up on startup (prevent duplicate menus after browser restart)
  browserAPI.runtime.onStartup.addListener(() => {
    browserAPI.contextMenus.removeAll(() => {
      browserAPI.contextMenus.create({
        id: 'cortex-add-bookmark',
        title: 'Add to Cortex',
        contexts: ['page', 'link', 'selection']
      });
    });
  });