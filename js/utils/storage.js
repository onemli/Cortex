/**
 * Cortex - Secure Storage Utilities
 * storage.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Storage wrapper with validation for data integrity
 * @author Kerem Can ONEMLI
 */

import { STORAGE_KEYS, DEFAULT_CATEGORY, DEFAULT_SETTINGS } from '../constants/index.js';
import { browserAPI } from './browser.js';
import { DataValidator, SecurityHelpers } from './validation.js';
import { cortexDB } from './indexedDB.js';           // YENİ
import { StorageAdapter } from './storage-adapter.js'; // YENİ
export class Storage {
  /**
   * Load configuration files (themes and locales)
   */
  static async loadConfig() {
    try {
      const [themesRes, localesRes] = await Promise.all([
        fetch(browserAPI.runtime.getURL('config/themes.json')),
        fetch(browserAPI.runtime.getURL('config/locales.json'))
      ]);

      const themes = await themesRes.json();
      const locales = await localesRes.json();

      // Validate config structure
      if (!themes || !themes.presets || !locales) {
        throw new Error('Invalid config structure');
      }

      return { themes, locales };
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  /**
   * Load categories from localStorage
   */
  static async loadCategories() {
    try {
      // Try IndexedDB first
      const idbCategories = await StorageAdapter.loadCategories();
      if (idbCategories && idbCategories.length > 0) {
        console.log('✅ Loaded categories from IndexedDB:', idbCategories.length);
        return idbCategories;
      }

      // Fallback to localStorage
      console.log('ℹ️ IndexedDB empty, trying localStorage...');
      const stored = localStorage.getItem(STORAGE_KEYS.CATEGORIES);

      if (stored) {
        const categories = JSON.parse(stored);

        // Validate and sanitize loaded data
        if (categories && Array.isArray(categories)) {
          const validCategories = categories.filter(cat => {
            const validation = DataValidator.validateCategory(cat);
            if (!validation.isValid) {
              console.warn('Invalid category detected and removed:', validation.errors);
              return false;
            }
            return true;
          });

          // If no valid categories, return default
          if (validCategories.length === 0) {
            return [DEFAULT_CATEGORY];
          }

          return validCategories;
        }
      }

      return [DEFAULT_CATEGORY];
    } catch (error) {
      console.error('Failed to load categories:', error);
      return [DEFAULT_CATEGORY];
    }
  }

  /**
   * Load settings from localStorage
   */
  static async loadSettings() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);

      if (stored) {
        const settings = JSON.parse(stored);

        // Validate settings
        if (settings && typeof settings === 'object') {
          // Ensure all required settings exist
          return {
            ...DEFAULT_SETTINGS,
            ...settings
          };
        }
      }

      return DEFAULT_SETTINGS;
    } catch (error) {
      console.error('Failed to load settings:', error);
      return DEFAULT_SETTINGS;
    }
  }

  /**
   * Save categories to localStorage
   */
  static async saveCategories(categories) {
    try {
      if (!Array.isArray(categories)) {
        throw new Error('Categories must be an array');
      }

      // Validate all categories before saving
      const validCategories = [];
      for (const cat of categories) {
        const validation = DataValidator.validateCategory(cat);
        if (validation.isValid) {
          validCategories.push(cat);
        } else {
          console.error('Invalid category not saved:', validation.errors);
        }
      }

      // Save to IndexedDB
      await StorageAdapter.saveCategories(validCategories);

      // Also save to localStorage as backup
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(validCategories));

      console.log('💾 Saved categories to IndexedDB + localStorage');
    } catch (error) {
      console.error('Failed to save categories:', error);
      throw error;
    }
  }

  /**
   * Save settings to localStorage
   */
  static async saveSettings(settings) {
    try {
      if (!settings || typeof settings !== 'object') {
        throw new Error('Settings must be an object');
      }

      // Sanitize settings
      const sanitizedSettings = SecurityHelpers.secureClone(settings);

      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(sanitizedSettings));
    } catch (error) {
      console.error('Failed to save settings:', error);
      throw error;
    }
  }

  /**
   * Load user themes from chrome.storage (with validation)
   */
  static async loadUserThemes() {
    if (!browserAPI.storage) return [];

    try {
      const result = await browserAPI.storage.local.get([STORAGE_KEYS.USER_THEMES]);
      const themes = result[STORAGE_KEYS.USER_THEMES] || [];

      // Validate themes
      if (!Array.isArray(themes)) {
        return [];
      }

      return themes.filter(theme => this.validateTheme(theme));
    } catch (error) {
      console.error('Failed to load user themes:', error);
      return [];
    }
  }

  /**
   * Validate theme structure
   */
  static validateTheme(theme) {
    const required = ['name', 'type', 'bg', 'bgSecondary', 'card', 'cardHover',
      'border', 'borderHover', 'text', 'textSecondary', 'accent'];

    if (!theme || typeof theme !== 'object') return false;

    // Check all required fields
    for (const field of required) {
      if (!theme[field] || typeof theme[field] !== 'string') {
        return false;
      }
      // Validate color format
      if (field !== 'name' && field !== 'type' && !theme[field].match(/^#[0-9A-Fa-f]{6}$/)) {
        return false;
      }
    }

    // Validate type
    if (!['light', 'dark'].includes(theme.type)) {
      return false;
    }

    return true;
  }

  /**
   * Save user themes to chrome.storage
   */
  static async saveUserThemes(themes) {
    if (!browserAPI.storage) return;

    try {
      if (!Array.isArray(themes)) {
        throw new Error('Themes must be an array');
      }

      // Validate all themes
      const validThemes = themes.filter(theme => this.validateTheme(theme));

      await browserAPI.storage.local.set({
        [STORAGE_KEYS.USER_THEMES]: validThemes
      });
    } catch (error) {
      console.error('Failed to save user themes:', error);
      throw error;
    }
  }
  /**
   * Check for pending bookmark from context menu
   */
  static async checkPendingBookmark() {
    if (!browserAPI.storage) return null;

    try {
      const result = await browserAPI.storage.local.get([STORAGE_KEYS.PENDING_BOOKMARK]);
      const pending = result[STORAGE_KEYS.PENDING_BOOKMARK];

      if (pending && Date.now() - pending.timestamp < 10000) { // 10 saniye timeout
        // Validate bookmark data
        if (pending.url && typeof pending.url === 'string') {
          // HEMEN storage'dan sil - böylece popup iki kez açılmaz
          await browserAPI.storage.local.remove([STORAGE_KEYS.PENDING_BOOKMARK]);

          console.log('✅ Pending bookmark found and cleared:', pending.id);

          return {
            title: pending.title || '',
            url: pending.url,
            tags: []
          };
        }
      } else if (pending) {
        // Timeout olmuş, temizle
        await browserAPI.storage.local.remove([STORAGE_KEYS.PENDING_BOOKMARK]);
        console.log('⏰ Expired pending bookmark cleared');
      }
    } catch (error) {
      console.log('⚠️ Pending bookmark check error:', error);
    }

    return null;
  }
  /**
   * Generate checksum for data integrity
   */
  static async generateChecksum(categories, settings) {
    const data = JSON.stringify({ categories, settings });
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Export all data (with security checks)
   */
  static async exportData(categories, settings) {
    try {
      // Validate before export
      const validCategories = categories.filter(cat => {
        const validation = DataValidator.validateCategory(cat);
        return validation.isValid;
      });

      const data = {
        categories: validCategories,
        settings: SecurityHelpers.secureClone(settings),
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        checksum: await this.generateChecksum(validCategories, settings)
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cortex-backup-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      throw new Error('Failed to export data');
    }
  }

  /**
   * Import data from JSON file (with validation)
   */
  static async importData(file) {
    return new Promise((resolve, reject) => {
      // 🔒 File validation
      if (file.size > 10 * 1024 * 1024) {
        reject(new Error('File too large (max 10MB)'));
        return;
      }

      if (file.type !== 'application/json') {
        reject(new Error('Invalid file type (must be JSON)'));
        return;
      }

      const reader = new FileReader();

      reader.onload = async (event) => {
        try {
          const content = event.target.result;

          if (content.length > 10 * 1024 * 1024) {
            throw new Error('Content too large');
          }

          // Parse JSON
          const data = JSON.parse(content);

          // Validate structure
          const validation = DataValidator.validateImportedData(data);
          if (!validation.isValid) {
            throw new Error(validation.errors.join(', '));
          }

          // Verify checksum if present
          if (data.checksum) {
            const computed = await this.generateChecksum(
              data.categories,
              data.settings
            );
            if (computed !== data.checksum) {
              console.warn('⚠️ Checksum mismatch - data may be corrupted');
            }
          }

          // 🔧 Sanitize using secureClone
          const sanitized = {
            categories: SecurityHelpers.secureClone(data.categories),
            settings: SecurityHelpers.secureClone(data.settings)
          };

          console.log('✅ Import successful');
          resolve(sanitized);

        } catch (error) {
          console.error('❌ Import error:', error);
          reject(new Error('Import failed: ' + error.message));
        }
      };

      reader.onerror = () => reject(new Error('File read failed'));
      reader.readAsText(file);
    });
  }

  /**
   * Clear all data
   */
  static async clearAllData() {
    try {
      // Clear IndexedDB first
      const categories = await cortexDB.getCategories();
      for (const cat of categories) {
        await cortexDB.deleteCategory(cat.id);
      }

      const bookmarks = await cortexDB.getBookmarks();
      for (const bm of bookmarks) {
        await cortexDB.deleteBookmark(bm.id);
      }

      // Clear localStorage
      localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);

      // Clear chrome.storage as well
      if (browserAPI.storage) {
        await browserAPI.storage.local.clear();
      }

      console.log('✅ All data cleared (IndexedDB + localStorage + chrome.storage)');
    } catch (error) {
      console.error('Failed to clear data:', error);
      throw error;
    }
  }
}