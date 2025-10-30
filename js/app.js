/**
 * Cortex - App Main
 * app.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Main React application for managing bookmarks with categories, tags, and themes
 * @author Kerem Can ONEMLI
 */

// IndexedDB Initialization
import { cortexDB } from './utils/indexedDB.js';

// Initialize before anything else
await cortexDB.init();

// Şimdi mevcut import'lar devam eder...
import { Storage } from './utils/storage.js';
import { loadCurrentTab } from './utils/browser.js';
import { useTheme } from './hooks/useTheme.js';
import { useSettings } from './hooks/useSettings.js';
import { useCategories } from './hooks/useCategories.js';
import { Header } from './components/Header.js';
import { CategoryCard } from './components/CategoryCard.js';
import { BookmarkModal } from './components/BookmarkModal.js';
import { SettingsModal } from './components/SettingsModal.js';
import { TagManagement } from './components/TagManagement.js';
import { CategoryManagement } from './components/CategoryManagement.js';
import { ThemeCreator } from './components/ThemeCreator.js';
import { ConfirmDialog } from './components/ConfirmDialog.js';

const { useState, useEffect, useMemo, createElement: h } = React;
const { createRoot } = ReactDOM;

function CortexApp() {
  // Core state for app logic
  const [config, setConfig] = useState(null);
  const { settings, setSettings, updateSettings } = useSettings();
  const {
    categories,
    setCategories,
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
  } = useCategories();

  const { theme, userThemes, setUserThemes } = useTheme(config, settings);

  // UI state for modals and menus
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [showThemeCreator, setShowThemeCreator] = useState(false);

  // State for bookmark modal
  const [showBookmarkModal, setShowBookmarkModal] = useState(null);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '', tags: [] });

  // State for theme creator modal
  const [themeForm, setThemeForm] = useState(null);
  const [editingThemeName, setEditingThemeName] = useState(null);

  // State for confirmation dialog
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });



  // Set hover effect class on body based on settings
  useEffect(() => {
    if (!settings) return;

    document.body.classList.remove('hover-none', 'hover-subtle', 'hover-fancy', 'hover-border');

    const hoverMode = settings.hoverEffect || 'hover-border';
    document.body.classList.add(`hover-${hoverMode}`);

    console.log('✨ Hover mode:', hoverMode);
  }, [settings?.hoverEffect]);


  // Initial setup: load config and handle pending bookmark if any
  useEffect(() => {
    async function init() {
      const configData = await Storage.loadConfig();
      setConfig(configData);
    }

    init();
  }, []);


  window.CortexConstants = {
    ICON_STYLES: {
      solid: { label: 'Solid', class: 'fa-solid', description: 'Bold and filled icons' },
      regular: { label: 'Regular', class: 'fa-regular', description: 'Balanced line weight icons' },
    }
  };

  useEffect(() => {
    async function handlePendingBookmark() {
      if (categories.length === 0) return;

      console.log('🔍 Checking for pending bookmark...');

      // Wait a moment to ensure categories are fully loaded
      await new Promise(resolve => setTimeout(resolve, 150));

      const pendingBookmark = await Storage.checkPendingBookmark();

      if (pendingBookmark) {
        console.log('📌 Pending bookmark found:', pendingBookmark);

        // Fill form
        setBookmarkForm({
          title: pendingBookmark.title || '',
          url: pendingBookmark.url || '',
          tags: []
        });

        // Open modal for first category
        setShowBookmarkModal(categories[0].id);
      } else {
        console.log('ℹ️ No pending bookmark found');

        // If no pending, try to get current tab info
        const tabInfo = await loadCurrentTab();
        if (tabInfo) {
          setBookmarkForm(prev => ({
            ...prev,
            url: tabInfo.url,
            title: tabInfo.title
          }));
        }
      }
    }

    handlePendingBookmark();
  }, [categories]); // categories dependency önemli!


  // Translation object for current language
  const t = config && settings ? config.locales[settings.language] : {};

  // Filter categories and bookmarks by search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;

    return categories.map(cat => ({
      ...cat,
      bookmarks: cat.bookmarks.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.tags && b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    })).filter(cat => cat.bookmarks.length > 0);
  }, [categories, searchQuery]);

  // Calculate card width based on grid settings
  const cardWidth = settings ? `${100 / settings.gridColumns}%` : '33.33%';



  // Show loading screen until config and settings are loaded


  // Open modal to add a new bookmark
  const handleOpenBookmarkModal = (categoryId) => {
    setEditingBookmark(null);
    setBookmarkForm({ title: '', url: '', tags: [] });
    setShowBookmarkModal(categoryId);
  };

  // Open modal to edit an existing bookmark
  const handleEditBookmark = (categoryId, bookmark) => {
    setEditingBookmark({
      ...bookmark,
      originalCategoryId: categoryId
    });
    setBookmarkForm({
      title: bookmark.title,
      url: bookmark.url,
      tags: bookmark.tags || []
    });
    setShowBookmarkModal(categoryId);
  };

  // Save a bookmark (add or update)
  const handleSaveBookmark = (sanitizedData) => {
    if (editingBookmark) {
      const originalCategoryId = editingBookmark.originalCategoryId;
      const newCategoryId = showBookmarkModal;

      // Check if the bookmark is being moved to a different category
      if (originalCategoryId !== newCategoryId) {
        console.log('📦 Moving bookmark to different category');

        // Remove from old category
        deleteBookmark(originalCategoryId, editingBookmark.id);

        // Add to new category with the same ID
        addBookmark(newCategoryId, {
          ...sanitizedData,
          id: editingBookmark.id
        });
      } else {
        // Update bookmark in the same category
        updateBookmark(
          originalCategoryId,
          editingBookmark.id,
          sanitizedData
        );
      }
    } else {
      // Add new bookmark
      addBookmark(showBookmarkModal, sanitizedData);
    }

    // Reset modal state
    setBookmarkForm({ title: '', url: '', tags: [] });
    setShowBookmarkModal(null);
    setEditingBookmark(null);
  };

  // Close the bookmark modal and reset form
  const handleCloseBookmarkModal = () => {
    setShowBookmarkModal(null);
    setEditingBookmark(null);
    setBookmarkForm({ title: '', url: '', tags: [] });
  };

  // Show confirmation dialog before deleting a bookmark
  const handleDeleteBookmarkWithConfirm = (categoryId, bookmarkId) => {
    setConfirmDialog({
      isOpen: true,
      title: t.confirmDelete,
      message: t.confirmDeleteBookmark,
      onConfirm: () => {
        deleteBookmark(categoryId, bookmarkId);
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  // Show confirmation dialog before deleting a category with bookmarks
  const handleDeleteCategoryWithConfirm = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);

    if (category.bookmarks.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: t.confirmDelete,
        message: t.confirmDeleteCategory,
        onConfirm: () => {
          deleteCategory(categoryId);
          setConfirmDialog({ isOpen: false });
        }
      });
    } else {
      deleteCategory(categoryId);
    }
  };

  // Set color for a tag
  const handleSetTagColor = (tag, colorName) => {
    updateSettings({
      tagColors: { ...settings.tagColors, [tag]: colorName }
    });
  };

  // Delete a tag from all bookmarks and remove its color
  const handleDeleteTag = (tag) => {
    deleteTagFromAll(tag);
    const newTagColors = { ...settings.tagColors };
    delete newTagColors[tag];
    updateSettings({ tagColors: newTagColors });
  };

  // Open the theme creator modal for a new theme
  const handleOpenThemeCreator = () => {
    const defaultLight = {
      name: '',
      type: 'light',
      bg: '#ffffff',
      bgSecondary: '#f6f8fa',
      card: '#ffffff',
      cardHover: '#f6f8fa',
      border: '#d0d7de',
      borderHover: '#a8b1bb',
      text: '#24292f',
      textSecondary: '#57606a',
      accent: '#0969da',
      logoColor: '#000000'
    };

    setThemeForm(defaultLight);
    setEditingThemeName(null);
    setShowThemeCreator(true);
  };

  // Open the theme creator modal for editing an existing theme
  const handleEditTheme = () => {
    const themeToEdit = userThemes.find(
      t => t.name.toLowerCase().replace(/ /g, '-') === settings.theme
    );

    if (themeToEdit) {
      setEditingThemeName(settings.theme);
      setThemeForm(themeToEdit);
      setShowThemeCreator(true);
    }
  };

  // Save a new or edited theme
  const handleSaveTheme = async () => {
    if (!themeForm.name?.trim()) {
      alert('Theme name is required.');
      return;
    }

    const newThemeKey = themeForm.name.toLowerCase().replace(/ /g, '-');
    let newThemes = [...userThemes];

    if (editingThemeName) {
      newThemes = newThemes.map(t =>
        t.name.toLowerCase().replace(/ /g, '-') === editingThemeName
          ? themeForm
          : t
      );
    } else {
      const existingIndex = newThemes.findIndex(
        t => t.name.toLowerCase().replace(/ /g, '-') === newThemeKey
      );

      if (existingIndex > -1) {
        newThemes[existingIndex] = themeForm;
      } else {
        newThemes.push(themeForm);
      }
    }

    setUserThemes(newThemes);
    await Storage.saveUserThemes(newThemes);

    setShowThemeCreator(false);
    setThemeForm(null);
    setEditingThemeName(null);
    updateSettings({ theme: newThemeKey });
  };

  if (!config || !settings || !theme || !theme.bg) {
    // Boş döndür, HTML'deki inline style gösterir
    return null;
  }
  // Render the main app UI
  return h('div', {
    style: {
      width: '100%',
      height: '100%',
      backgroundColor: theme.bg,
      color: theme.text,
      display: 'flex',
      flexDirection: 'column'
    }
  },
    // Header component
    h(Header, {
      theme,
      settings,
      searchQuery,
      onSearchChange: setSearchQuery,
      showMenu,
      onMenuToggle: setShowMenu,
      onOpenSettings: () => setShowSettings(true),
      onOpenTagManagement: () => setShowTagManagement(true),
      onOpenCategoryManagement: () => setShowCategoryManagement(true),
      categories,
      t
    }),

    // Main content area
    h('div', {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        backgroundColor: theme.bg
      }
    },
      filteredCategories.length > 0
        ? filteredCategories.map((category, idx) =>
          h(CategoryCard, {
            key: `cat-${category.id}-${idx}`,
            category,
            categoryIndex: idx,
            totalCategories: filteredCategories.length,
            theme,
            settings,
            config,
            cardWidth,
            onAddBookmark: handleOpenBookmarkModal,
            onEditBookmark: handleEditBookmark,
            onDeleteBookmark: handleDeleteBookmarkWithConfirm,
            onDeleteCategory: handleDeleteCategoryWithConfirm,
            onToggleVisibility: toggleCategoryVisibility,
            onMoveUp: moveCategoryUp,
            onMoveDown: moveCategoryDown,
            t
          })
        )
        : h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: theme.textSecondary,
            fontSize: 'var(--font-xl)'
          }
        }, searchQuery ? 'No results found' : t.noBookmarks)
    ),

    // Bookmark modal for adding/editing bookmarks
    h(BookmarkModal, {
      isOpen: showBookmarkModal !== null,
      categoryId: showBookmarkModal,
      categories,
      bookmarkForm,
      editingBookmark,
      theme,
      settings,
      config,
      onClose: handleCloseBookmarkModal,
      onSave: handleSaveBookmark,
      onFormChange: (updates) => setBookmarkForm(prev => ({ ...prev, ...updates })),
      onCategoryChange: setShowBookmarkModal,
      pendingBookmarkActive: bookmarkForm.url && bookmarkForm.title,
      updateSettings: updateSettings,
      t
    }),

    // Settings modal for app preferences
    h(SettingsModal, {
      isOpen: showSettings,
      settings,
      config,
      theme,
      userThemes,
      categories,
      onClose: () => setShowSettings(false),
      onSettingsChange: updateSettings,
      onCategoriesChange: setCategories,
      onUserThemesChange: setUserThemes,
      onOpenThemeCreator: handleOpenThemeCreator,
      onEditTheme: handleEditTheme,
      getAllTags: getAllTags,
      onDeleteTag: handleDeleteTag,
      onSetTagColor: handleSetTagColor,
      onDeleteCategory: handleDeleteCategoryWithConfirm,
      onAddCategory: addCategory,
      onRenameCategory: renameCategory,
      onConfirm: (dialog) => setConfirmDialog({ ...dialog, isOpen: true }),
      t
    }),

    // Tag management modal
    h(TagManagement, {
      isOpen: showTagManagement,
      theme,
      settings,
      config,
      categories,
      getAllTags,
      onDeleteTag: handleDeleteTag,
      onSetTagColor: handleSetTagColor,
      onClose: () => setShowTagManagement(false),
      onConfirm: (dialog) => setConfirmDialog({ ...dialog, isOpen: true }),
      t
    }),

    // Category management modal
    h(CategoryManagement, {
      isOpen: showCategoryManagement,
      theme,
      settings,
      categories,
      onAddCategory: addCategory,
      onRenameCategory: renameCategory,
      onDeleteCategory: handleDeleteCategoryWithConfirm,
      onClose: () => setShowCategoryManagement(false),
      t
    }),

    // Theme creator modal
    h(ThemeCreator, {
      isOpen: showThemeCreator,
      themeForm,
      isEditing: !!editingThemeName,
      theme,
      settings,
      onFormChange: (updates) => setThemeForm(prev => ({ ...prev, ...updates })),
      onSave: handleSaveTheme,
      onClose: () => {
        setShowThemeCreator(false);
        setThemeForm(null);
        setEditingThemeName(null);
      },
      t
    }),

    // Confirmation dialog for destructive actions
    h(ConfirmDialog, {
      isOpen: confirmDialog.isOpen,
      title: confirmDialog.title,
      message: confirmDialog.message,
      onConfirm: () => {
        confirmDialog.onConfirm();
        setConfirmDialog({ isOpen: false });
      },
      onCancel: () => setConfirmDialog({ isOpen: false }),
      confirmText: t.delete,
      cancelText: t.cancel,
      requireConfirmation: confirmDialog.requireConfirmation,
      confirmationText: confirmDialog.confirmationText,
      theme,
      settings
    })
  );
}

// Initialize React app and mount to DOM
const root = createRoot(document.getElementById('root'));
root.render(h(CortexApp));