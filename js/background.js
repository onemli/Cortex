/**
 * Cortex - Background Service Worker
 * background.js
 * @version 1.2.0
 * @license GPL-3.0
 * @description Background service worker for handling context menu actions and inter-component messaging
 * @author Kerem Can ONEMLI
 * 
 */

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

console.log('🚀 Cortex Background Worker Started');

// Initialize on install
browserAPI.runtime.onInstalled.addListener(() => {
  console.log('📦 Cortex installed');

  browserAPI.contextMenus.removeAll(() => {
    browserAPI.contextMenus.create({
      id: 'cortex-add-bookmark',
      title: 'Add to Cortex',
      contexts: ['page', 'link', 'selection']
    }, () => {
      if (browserAPI.runtime.lastError) {
        console.error('❌ Context menu error:', browserAPI.runtime.lastError);
      } else {
        console.log('✅ Context menu created');
      }
    });
  });
});

// Startup cleanup
browserAPI.runtime.onStartup.addListener(() => {
  console.log('🔄 Cortex startup');

  browserAPI.contextMenus.removeAll(() => {
    browserAPI.contextMenus.create({
      id: 'cortex-add-bookmark',
      title: 'Add to Cortex',
      contexts: ['page', 'link', 'selection']
    });
  });
});

// Context menu handler cross-browser
browserAPI.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log('🖱️ Context menu clicked:', info);

  if (info.menuItemId === 'cortex-add-bookmark') {
    try {
      const url = info.linkUrl || info.pageUrl || tab.url;
      const title = info.selectionText || info.linkText || tab.title || 'Untitled';

      console.log('💾 Preparing bookmark:', { url, title });

      const pendingId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      const pendingData = {
        id: pendingId,
        url: url,
        title: title,
        timestamp: Date.now()
      };

      await browserAPI.storage.local.set({
        pendingBookmark: pendingData
      });

      console.log('✅ Bookmark saved to storage:', pendingId);

      await new Promise(resolve => setTimeout(resolve, 100));

      // Identify browser and open popup
      const isFirefox = typeof browser !== 'undefined' && browser.runtime;
      const isChrome = typeof chrome !== 'undefined' && chrome.runtime;

      if (isFirefox) {
        try {
          // Firefox Manifest V2
          if (browser.browserAction && browser.browserAction.openPopup) {
            await browser.browserAction.openPopup();
            console.log('✅ Firefox popup opened (V2)');
          }
          // Firefox Manifest V3
          else if (browser.action && browser.action.openPopup) {
            await browser.action.openPopup();
            console.log('✅ Firefox popup opened (V3)');
          }
          // Fallback: Open new tab with popup.html
          else {
            await browser.tabs.create({
              url: browser.runtime.getURL('popup.html'),
              active: true
            });
            console.log('✅ Firefox fallback: new tab opened');
          }
        } catch (firefoxError) {
          console.warn('⚠️ Firefox popup error:', firefoxError);
          await browser.tabs.create({
            url: browser.runtime.getURL('popup.html'),
            active: true
          });
        }
      }
      else if (isChrome) {
        try {
          // Chrome Manifest V3
          if (chrome.action && chrome.action.openPopup) {
            await chrome.action.openPopup();
            console.log('✅ Chrome popup opened (V3)');
          }
          // Chrome Manifest V2
          else if (chrome.browserAction && chrome.browserAction.openPopup) {
            chrome.browserAction.openPopup();
            console.log('✅ Chrome popup opened (V2)');
          }
          else {
            await chrome.tabs.create({
              url: chrome.runtime.getURL('popup.html'),
              active: true
            });
            console.log('✅ Chrome fallback: new tab opened');
          }
        } catch (chromeError) {
          console.warn('⚠️ Chrome popup error:', chromeError);
          await chrome.tabs.create({
            url: chrome.runtime.getURL('popup.html'),
            active: true
          });
        }
      }

    } catch (error) {
      console.error('❌ Context menu error:', error);

      if (browserAPI.notifications) {
        browserAPI.notifications.create({
          type: 'basic',
          iconUrl: 'assets/icons/icon128.png',
          title: 'Cortex Error',
          message: 'Failed to save bookmark',
          priority: 2
        });
      }
    }
  }
});

// Message handler
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Message received:', request);

  if (request.action === 'getActiveTab') {
    browserAPI.tabs.query({ active: true, currentWindow: true })
      .then(tabs => {
        sendResponse({ tab: tabs[0] });
      })
      .catch(error => {
        console.error('❌ getActiveTab error:', error);
        sendResponse({ error: error.message });
      });
    return true; // Keep channel open for async
  }

  if (request.action === 'ping') {
    sendResponse({ status: 'ok', timestamp: Date.now() });
    return false;
  }
});

console.log('✅ Cortex Background Worker Ready');