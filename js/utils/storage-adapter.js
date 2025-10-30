/**
 * Cortex - Storage Adapter
 * storage-adapter.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Adapter to make existing Storage class work with IndexedDB
 * @author Kerem Can ONEMLI
 * 
 */

import { cortexDB } from './indexedDB.js';

export class StorageAdapter {
  /**
   * Load categories from IndexedDB
   */
  static async loadCategories() {
    try {
      const categories = await cortexDB.getCategories();

      if (!categories || categories.length === 0) {
        return [];
      }

      // Load bookmarks for each category
      const categoriesWithBookmarks = await Promise.all(
        categories.map(async (cat) => {
          const bookmarks = await cortexDB.getBookmarksByCategory(cat.id);
          return {
            ...cat,
            bookmarks: bookmarks || []
          };
        })
      );
      categoriesWithBookmarks.sort((a, b) => (a.order || 0) - (b.order || 0));

      return categoriesWithBookmarks;
    } catch (error) {
      console.error('Failed to load categories from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Save categories to IndexedDB (FULL SYNC)
   */
  static async saveCategories(categories) {
    try {
      // Get current state from IndexedDB
      const existingCategories = await cortexDB.getCategories();
      const existingBookmarks = await cortexDB.getBookmarks();

      const existingCategoryIds = new Set(existingCategories.map(c => c.id));
      const newCategoryIds = new Set(categories.map(c => c.id));

      // Find categories to delete
      const categoriesToDelete = existingCategories.filter(c => !newCategoryIds.has(c.id));

      // Delete removed categories
      for (const cat of categoriesToDelete) {
        await cortexDB.deleteCategory(cat.id);
        // Also delete their bookmarks
        const catBookmarks = await cortexDB.getBookmarksByCategory(cat.id);
        for (const bm of catBookmarks) {
          await cortexDB.deleteBookmark(bm.id);
        }
      }

      // Save/update categories and bookmarks
      for (const category of categories) {
        // Save or update category
        if (existingCategoryIds.has(category.id)) {
          await cortexDB.updateCategory({
            id: category.id,
            name: category.name,
            order: category.order || 0,
            isCollapsed: category.isCollapsed || false 
          });
        } else {
          await cortexDB.addCategory({
            id: category.id,
            name: category.name,
            order: category.order || 0,
          });
        }

        // Get current bookmarks for this category
        const currentBookmarks = await cortexDB.getBookmarksByCategory(category.id);
        const currentBookmarkIds = new Set(currentBookmarks.map(b => b.id));
        const newBookmarkIds = new Set((category.bookmarks || []).map(b => b.id));

        // Delete removed bookmarks
        for (const bm of currentBookmarks) {
          if (!newBookmarkIds.has(bm.id)) {
            await cortexDB.deleteBookmark(bm.id);
          }
        }

        // Save or update bookmarks
        if (category.bookmarks) {
          for (const bookmark of category.bookmarks) {
            const bookmarkData = {
              id: bookmark.id,
              title: bookmark.title,
              url: bookmark.url,
              tags: bookmark.tags || [],
              categoryId: category.id
            };

            try {
              if (currentBookmarkIds.has(bookmark.id)) {
                await cortexDB.updateBookmark(bookmarkData);
              } else {
                await cortexDB.addBookmark(bookmarkData);
              }
            } catch (error) {
              // If add fails (duplicate), try update
              if (error.name === 'ConstraintError') {
                await cortexDB.updateBookmark(bookmarkData);
              } else {
                console.error('Failed to save bookmark:', bookmark.title, error);
              }
            }
          }
        }
      }

      console.log('💾 Full sync completed to IndexedDB');
    } catch (error) {
      console.error('Failed to save categories to IndexedDB:', error);
      throw error;
    }
  }
}