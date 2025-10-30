/**
 * Cortex - useCategories Hook
 * useCategories.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Custom React hook for managing categories and bookmarks with persistent storage
 * @author Kerem Can ONEMLI
 */

import { Storage } from '../utils/storage.js';

const { useState, useEffect } = React;

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load categories on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const loadedCategories = await Storage.loadCategories();
        setCategories(loadedCategories);
      } catch (error) {
        console.error('Failed to load categories:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save categories when changed
  useEffect(() => {
    async function saveData() {
      if (categories.length > 0 && !loading) {
        try {
          await Storage.saveCategories(categories);
        } catch (error) {
          console.error('Failed to save categories:', error);
        }
      }
    }
    saveData();
  }, [categories, loading]);

  // Add category
  const addCategory = (name) => {
    if (!name.trim()) return;

    const newCategory = {
      id: Date.now(),
      name: name.trim(),
      bookmarks: [],
      isCollapsed: false
    };

    setCategories(prev => [...prev, newCategory]);
  };

  // Delete category
  const deleteCategory = (categoryId) => {
    setCategories(prev => prev.filter(c => c.id !== categoryId));
  };

  // Rename category
  const renameCategory = (categoryId, newName) => {
    if (!newName.trim()) return;

    setCategories(prev => prev.map(cat =>
      cat.id === categoryId ? { ...cat, name: newName.trim() } : cat
    ));
  };

  // Add bookmark
  const addBookmark = (categoryId, bookmark) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? {
          ...cat,
          bookmarks: [
            ...cat.bookmarks,
            {
              id: bookmark.id || Date.now(),
              title: bookmark.title,
              url: bookmark.url,
              tags: bookmark.tags || []
            }
          ]
        }
        : cat
    ));
  };

  // Update bookmark
  const updateBookmark = (categoryId, bookmarkId, updates) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? {
          ...cat,
          bookmarks: cat.bookmarks.map(b =>
            b.id === bookmarkId ? { ...b, ...updates } : b
          )
        }
        : cat
    ));
  };

  // Delete bookmark
  const deleteBookmark = (categoryId, bookmarkId) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, bookmarks: cat.bookmarks.filter(b => b.id !== bookmarkId) }
        : cat
    ));
  };

  // Delete tag from all bookmarks
  const deleteTagFromAll = (tag) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      bookmarks: cat.bookmarks.map(bookmark => ({
        ...bookmark,
        tags: bookmark.tags ? bookmark.tags.filter(t => t !== tag) : []
      }))
    })));
  };

  // Get all unique tags
  const getAllTags = () => {
    const tags = new Set();
    categories.forEach(cat => {
      cat.bookmarks.forEach(bookmark => {
        if (bookmark.tags) {
          bookmark.tags.forEach(tag => tags.add(tag));
        }
      });
    });
    return Array.from(tags);
  };
  // Toggle category visibility
  const toggleCategoryVisibility = (categoryId) => {
    setCategories(prev => prev.map(cat =>
      cat.id === categoryId
        ? { ...cat, isCollapsed: !cat.isCollapsed }
        : cat
    ));
  };

  // Move category up
  const moveCategoryUp = (categoryId) => {
    setCategories(prev => {
      const index = prev.findIndex(c => c.id === categoryId);
      if (index <= 0) return prev;

      const newCategories = [...prev];
      [newCategories[index - 1], newCategories[index]] =
        [newCategories[index], newCategories[index - 1]];

      // YENİ: Order property'lerini güncelle
      const updatedWithOrder = newCategories.map((cat, idx) => ({
        ...cat,
        order: idx
      }));

      // Kaydet
      Storage.saveCategories(updatedWithOrder).catch(err => {
        console.error('Failed to save category order:', err);
      });

      return updatedWithOrder;  // order'lı versiyonu döndür
    });
  };

  // Move category down
  const moveCategoryDown = (categoryId) => {
    setCategories(prev => {
      const index = prev.findIndex(c => c.id === categoryId);
      if (index === -1 || index >= prev.length - 1) return prev;

      const newCategories = [...prev];
      [newCategories[index], newCategories[index + 1]] =
        [newCategories[index + 1], newCategories[index]];

      // YENİ: Update the order properties
      const updatedWithOrder = newCategories.map((cat, idx) => ({
        ...cat,
        order: idx
      }));

      // Save
      Storage.saveCategories(updatedWithOrder).catch(err => {
        console.error('Failed to save category order:', err);
      });

      return updatedWithOrder;  // order'lı versiyonu döndür
    });
  };
  return {
    categories,
    setCategories,
    loading,
    addCategory,
    deleteCategory,
    renameCategory,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    deleteTagFromAll,
    getAllTags,
    toggleCategoryVisibility,
    moveCategoryUp,
    moveCategoryDown

  };
}