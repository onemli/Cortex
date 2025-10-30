/**
 * Cortex - Browser API Utilities
 * browser.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Cross-browser utilities for interacting with browser APIs
 * @author Kerem Can ONEMLI
 */

import { BLOCKED_URLS } from '../constants/index.js';

// Cross-browser API compatibility
export const browserAPI = (() => {
  // Firefox kontrolü
  if (typeof browser !== 'undefined' && browser.runtime) {
    return browser;
  }

  // Chrome/Edge Control
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    return chrome;
  }

  // Fallback [for test]
  console.warn('⚠️ No browser API found, using mock');
  return {
    runtime: { getURL: (path) => path },
    storage: null,
    tabs: null,
    bookmarks: null
  };
})();

/**
 * Browser detection
 */
export function getBrowserInfo() {
  const isFirefox = typeof browser !== 'undefined' && browser.runtime;
  const isChrome = typeof chrome !== 'undefined' && chrome.runtime && !isFirefox;

  return {
    isFirefox,
    isChrome,
    name: isFirefox ? 'Firefox' : isChrome ? 'Chrome' : 'Unknown'
  };
}

/**
 * Load current active tab information
 */
export async function loadCurrentTab() {
  if (!browserAPI.tabs) return null;

  try {
    const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });

    if (!tab?.url) return null;

    const isBlocked = BLOCKED_URLS.some(blocked => tab.url.startsWith(blocked));
    if (isBlocked) return null;

    return {
      url: tab.url,
      title: tab.title || ''
    };
  } catch (error) {
    console.log('Could not access tab info:', error);
    return null;
  }
}

/**
 * Open full page in new tab (for popup mode)
 */
export function openFullPage() {
  if (browserAPI.tabs) {
    browserAPI.tabs.create({
      url: browserAPI.runtime.getURL('newtab.html')
    });
  }
}

/**
 * Check if running in popup mode
 */
export function isPopupMode() {
  return document.body.classList.contains('popup');
}

/**
 * Sync bookmarks from browser
 */
export async function syncBrowserBookmarks() {
  const { isFirefox } = getBrowserInfo();

  // Firefox'ta chrome.bookmarks yerine browser.bookmarks
  const bookmarksAPI = isFirefox ? browser.bookmarks : chrome.bookmarks;

  if (!bookmarksAPI) {
    throw new Error('Bookmark API not available');
  }

  const processBookmarkNode = (node, path = []) => {
    const results = [];

    if (node.url) {
      const categoryName = path.length > 0 ? path.join('/') : 'Imported';
      results.push({
        title: node.title || 'Untitled',
        url: node.url,
        category: categoryName,
        tags: ['imported']
      });
    }

    if (node.children) {
      const newPath = node.title && node.id !== '0' ? [...path, node.title] : path;
      node.children.forEach(child => {
        results.push(...processBookmarkNode(child, newPath));
      });
    }

    return results;
  };

  const bookmarkTree = await bookmarksAPI.getTree();
  return bookmarkTree.flatMap(node => processBookmarkNode(node));
}