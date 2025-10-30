/**
 * Cortex - IndexedDB Wrapper
 * indexedDB.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description IndexedDB wrapper using idb library
 * @author Kerem Can ONEMLI
 */

import { openDB } from '../../assets/libs/idb.js';

const DB_NAME = 'cortex_db';
const DB_VERSION = 1;

class CortexDB {
  constructor() {
    this.db = null;
  }

  async init() {
    this.db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('categoryId', 'categoryId', { unique: false });
          bookmarkStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }

        // Categories store
        if (!db.objectStoreNames.contains('categories')) {
          const categoryStore = db.createObjectStore('categories', { keyPath: 'id' });
          categoryStore.createIndex('order', 'order', { unique: false });
        }

        // Settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        // Themes store
        if (!db.objectStoreNames.contains('themes')) {
          db.createObjectStore('themes', { keyPath: 'id' });
        }

        // Board Layout store
        if (!db.objectStoreNames.contains('boardLayout')) {
          db.createObjectStore('boardLayout', { keyPath: 'categoryId' });
        }
      }
    });

    console.log('✅ IndexedDB initialized');
    return this.db;
  }

  // Bookmarks
  async getBookmarks() {
    return await this.db.getAll('bookmarks');
  }

  async getBookmarksByCategory(categoryId) {
    return await this.db.getAllFromIndex('bookmarks', 'categoryId', categoryId);
  }

  async addBookmark(bookmark) {
    return await this.db.add('bookmarks', bookmark);
  }

  async updateBookmark(bookmark) {
    return await this.db.put('bookmarks', bookmark);
  }

  async deleteBookmark(id) {
    return await this.db.delete('bookmarks', id);
  }

  // Categories
  async getCategories() {
    return await this.db.getAll('categories');
  }

  async addCategory(category) {
    return await this.db.add('categories', category);
  }

  async updateCategory(category) {
    return await this.db.put('categories', category);
  }

  async deleteCategory(id) {
    return await this.db.delete('categories', id);
  }

  // Settings
  async getSetting(key) {
    const result = await this.db.get('settings', key);
    return result?.value;
  }

  async setSetting(key, value) {
    return await this.db.put('settings', { key, value });
  }

  // Themes
  async getThemes() {
    return await this.db.getAll('themes');
  }

  async getTheme(id) {
    return await this.db.get('themes', id);
  }

  async addTheme(theme) {
    return await this.db.add('themes', theme);
  }

  async updateTheme(theme) {
    return await this.db.put('themes', theme);
  }

  async deleteTheme(id) {
    return await this.db.delete('themes', id);
  }

  // Board Layout
  async getBoardLayout(categoryId) {
    return await this.db.get('boardLayout', categoryId);
  }

  async setBoardLayout(categoryId, layout) {
    return await this.db.put('boardLayout', { categoryId, ...layout });
  }

  async getAllBoardLayouts() {
    return await this.db.getAll('boardLayout');
  }
}

export const cortexDB = new CortexDB();