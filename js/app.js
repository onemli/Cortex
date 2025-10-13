/**
 * Cortex - Find that one link
 * Main Application
 * @author Kerem Can ONEMLI
 * @version 1.0.0
 */


// Cross-browser compatibility
const browserAPI = typeof browser !== 'undefined' ? browser : chrome;

const { useState, useEffect, useRef, useMemo } = React;
const { createRoot } = ReactDOM;
const h = React.createElement;

// State Management
class AppState {
  static async loadConfig() {
    try {
      const [themesRes, localesRes] = await Promise.all([
        fetch(browserAPI.runtime.getURL('config/themes.json')),
        fetch(browserAPI.runtime.getURL('config/locales.json'))
      ]);

      return {
        themes: await themesRes.json(),
        locales: await localesRes.json()
      };
    } catch (error) {
      console.error('Failed to load config:', error);
      return null;
    }
  }

  static async loadData() {
    const stored = localStorage.getItem('cortex_categories');
    const settings = localStorage.getItem('cortex_settings');

    return {
      categories: stored ? JSON.parse(stored) : [{ id: 1, name: 'General', bookmarks: [] }],
      settings: settings ? JSON.parse(settings) : {
        gridColumns: 3,
        language: 'en',
        theme: 'grafana',
        openInNewTab: true,
        tagColors: {}
      }
    };
  }

  static saveCategories(categories) {
    localStorage.setItem('cortex_categories', JSON.stringify(categories));
  }

  static saveSettings(settings) {
    localStorage.setItem('cortex_settings', JSON.stringify(settings));
  }
}

// Confirmation Dialog Component
function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, confirmText, cancelText, theme }) {
  if (!isOpen) return null;

  return h('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    }
  },
    h('div', {
      style: {
        backgroundColor: theme.card,
        borderRadius: '12px',
        padding: '24px',
        width: '90%',
        maxWidth: '400px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.3s ease'
      }
    },
      h('h3', {
        style: {
          margin: '0 0 12px',
          fontSize: 'var(--font-2xl)',
          fontWeight: 600,
          color: theme.text
        }
      }, title),
      h('p', {
        style: {
          margin: '0 0 20px',
          fontSize: 'var(--font-md)',
          color: theme.textSecondary,
          lineHeight: '1.5'
        }
      }, message),
      h('div', {
        style: {
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }
      },
        h('button', {
          onClick: onCancel,
          style: {
            padding: '10px 20px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            cursor: 'pointer',
            fontSize: 'var(--font-md)',
            fontWeight: 500
          }
        }, cancelText),
        h('button', {
          onClick: onConfirm,
          style: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: theme.accent,
            color: '#fff',
            cursor: 'pointer',
            fontSize: 'var(--font-md)',
            fontWeight: 500
          }
        }, confirmText)
      )
    )
  );
}
// For Inline Svg Icons From Fa
function Icon({ name, theme, size = 18 }) {
  const ref = React.useRef(null);

  React.useEffect(() => {
    if (!theme) return;

    // Color = Theme-Aware (White On Dark, Black On Light)
    const color =
      theme.type === 'dark'
        ? (theme.logoColor || '#ffffff')
        : (theme.text || '#000000');

    fetch(browserAPI.runtime.getURL(`assets/icons/fa/${name}.svg`))
      .then((res) => res.text())
      .then((svg) => {
        let modified = svg
          .replace(/(stroke|fill)="(?!none)[^"]*"/g, `$1="${color}"`)
          .replace(/(stroke|fill):\s*(#000|#000000|rgb\(0,0,0\)|currentColor)/g, `$1:${color}`)
          .replace(/color="[^"]*"/g, `color="${color}"`)
          .replace(/style="[^"]*"/g, (m) => {
            return m.replace(/(#000|#000000|rgb\(0,0,0\)|currentColor)/g, color);
          });

        modified = modified.replace(/<path(?![^>]*(stroke|fill)=)/g, `<path fill="${color}"`);

        if (ref.current) {
          ref.current.innerHTML = modified;
        }
      })
      .catch((err) => console.error('Icon load failed:', name, err));
  }, [name, theme]);

  return React.createElement('div', {
    ref,
    style: {
      width: `${size}px`,
      height: `${size}px`,
      display: 'inline-block',
      verticalAlign: 'middle',
      lineHeight: 0
    }
  });
}
// Main App Component
function CortexApp() {
  const [config, setConfig] = useState(null);
  const [categories, setCategories] = useState([]);
  const [settings, setSettings] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showBookmarkModal, setShowBookmarkModal] = useState(null);
  const [editingBookmark, setEditingBookmark] = useState(null);
  const [newCategory, setNewCategory] = useState('');
  const [bookmarkForm, setBookmarkForm] = useState({ title: '', url: '', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [selectedTagForColor, setSelectedTagForColor] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [showMenu, setShowMenu] = useState(false);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [showCategoryManagement, setShowCategoryManagement] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');
  const [showThemeCreator, setShowThemeCreator] = useState(false);
  const [themeCreatorForm, setThemeCreatorForm] = useState(null);
  const [userThemes, setUserThemes] = useState([]);
  const [editingThemeName, setEditingThemeName] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);


  // Initialize
  useEffect(() => {
    async function init() {
      const configData = await AppState.loadConfig();
      const data = await AppState.loadData();

      setConfig(configData);
      setCategories(data.categories);
      setSettings(data.settings);

      // Load User Themes From Storage
      if (typeof browserAPI !== 'undefined' && browserAPI.storage) {
        browserAPI.storage.local.get(['userThemes'], (result) => {
          if (result.userThemes) {
            setUserThemes(result.userThemes);
          }
        });
      }

      // Check For Pending Bookmark From Context Menu/Keyboard Shortcut
      if (typeof browserAPI !== 'undefined' && browserAPI.storage) {
        try {
          const result = await browserAPI.storage.local.get(['pendingBookmark']);
          if (result.pendingBookmark && Date.now() - result.pendingBookmark.timestamp < 5000) {
            setBookmarkForm({
              title: result.pendingBookmark.title || '',
              url: result.pendingBookmark.url || '',
              tags: []
            });

            if (data.categories.length > 0) {
              setShowBookmarkModal(data.categories[0].id);
            }

            browserAPI.storage.local.remove(['pendingBookmark']);
            return; // Load Tab Info Only If No Pending Bookmark
          }
        } catch (e) {
          console.log('Storage check error:', e);
        }
      }

      // Load Current Tab Info
      const tabInfo = await loadCurrentTab();
      if (tabInfo) {
        setBookmarkForm(prev => ({
          ...prev,
          url: tabInfo.url,
          title: tabInfo.title
        }));
      }
    }
    init();
  }, []);

  // Apply Theme
  useEffect(() => {
    if (!settings || !config) return;

    const theme = getCurrentTheme();
    document.body.style.backgroundColor = theme.bg;
    document.body.style.color = theme.text;

    document.documentElement.style.setProperty('--bg', theme.bg);
    document.documentElement.style.setProperty('--bg-secondary', theme.bgSecondary);
    document.documentElement.style.setProperty('--card', theme.card);
    document.documentElement.style.setProperty('--border', theme.border);
    document.documentElement.style.setProperty('--text', theme.text);
    document.documentElement.style.setProperty('--accent', theme.accent);

    const fontFamilies = {
      system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      inter: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      roboto: '"Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
      opensans: '"Open Sans", -apple-system, BlinkMacSystemFont, sans-serif',
      lato: '"Lato", -apple-system, BlinkMacSystemFont, sans-serif',
      poppins: '"Poppins", -apple-system, BlinkMacSystemFont, sans-serif',
      montserrat: '"Montserrat", -apple-system, BlinkMacSystemFont, sans-serif',
      ibmplexmono: '"IBM Plex Mono", "Courier New", monospace',
      cascadia: '"Cascadia Code", "Cascadia Mono", "Courier New", monospace'
    };

    const fontSizeScales = {
      small: 0.9,   // %90
      medium: 1.0,  // %100
      large: 1.15,  // %115
      xlarge: 1.3   // %130
    };

    const scale = fontSizeScales[settings.fontSize] || 1.0;

    // Apply Font Family
    document.body.style.fontFamily = fontFamilies[settings.fontFamily] || fontFamilies.system;


    document.documentElement.style.setProperty('--font-scale', scale);

    // Base Font Sizes
    document.documentElement.style.setProperty('--font-xs', `${10 * scale}px`);    // 10px -> 13px
    document.documentElement.style.setProperty('--font-sm', `${11 * scale}px`);    // 11px -> 14.3px
    document.documentElement.style.setProperty('--font-base', `${13 * scale}px`);  // 13px -> 16.9px
    document.documentElement.style.setProperty('--font-md', `${14 * scale}px`);    // 14px -> 18.2px
    document.documentElement.style.setProperty('--font-lg', `${15 * scale}px`);    // 15px -> 19.5px
    document.documentElement.style.setProperty('--font-xl', `${16 * scale}px`);    // 16px -> 20.8px
    document.documentElement.style.setProperty('--font-2xl', `${18 * scale}px`);   // 18px -> 23.4px
    document.documentElement.style.setProperty('--font-3xl', `${20 * scale}px`);   // 20px -> 26px
  }, [settings, config, userThemes]);

  // Close Menu On Outside Click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Save Data
  useEffect(() => {
    if (categories.length > 0) {
      AppState.saveCategories(categories);
    }
  }, [categories]);

  useEffect(() => {
    if (settings) {
      AppState.saveSettings(settings);
    }
  }, [settings]);

  const loadCurrentTab = async () => {
    if (typeof browserAPI !== 'undefined' && browserAPI.tabs) {
      try {
        const [tab] = await browserAPI.tabs.query({ active: true, currentWindow: true });
        if (tab?.url &&
          !tab.url.startsWith('chrome://') &&
          !tab.url.startsWith('about:') &&
          !tab.url.startsWith('edge://') &&
          !tab.url.startsWith('moz-extension://')) {
          return {
            url: tab.url,
            title: tab.title || ''
          };
        }
      } catch (e) {
        console.log('Could not access tab info:', e);
      }
    }
    return null;
  };

  useEffect(() => {
    async function loadTabForNewBookmark() {
      if (showBookmarkModal && !editingBookmark) {
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

    loadTabForNewBookmark();
  }, [showBookmarkModal, editingBookmark]);

  const getCurrentTheme = () => {
    if (!config || !settings) return {};
    const allThemes = {
      ...config.themes.presets,
      ...userThemes.reduce((acc, theme) => {
        acc[theme.name.toLowerCase().replace(/ /g, '-')] = theme;
        return acc;
      }, {})
    };
    return allThemes[settings.theme] || config.themes.presets['cortex-dark'];
  };

  const t = config && settings ? config.locales[settings.language] : {};
  const theme = getCurrentTheme();

  if (!config || !settings) {
    return h('div', {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#111217',
        color: '#d8d9da'
      }
    }, 'Loading...');
  }

  // Handlers
  const openBookmark = (url) => {
    if (settings.openInNewTab) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }
  };

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      setCategories(prev => [...prev, { id: Date.now(), name: newCategory, bookmarks: [] }]);
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleDeleteCategory = (catId) => {
    const category = categories.find(c => c.id === catId);
    if (category.bookmarks.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: t.confirmDelete,
        message: t.confirmDeleteCategory,
        onConfirm: () => {
          setCategories(prev => prev.filter(c => c.id !== catId));
          setConfirmDialog({ isOpen: false });
        }
      });
    } else {
      setCategories(prev => prev.filter(c => c.id !== catId));
    }
  };

  const handleSaveBookmark = (categoryId) => {
    if (!bookmarkForm.title || !bookmarkForm.url) return;

    if (editingBookmark) {
      setCategories(prev => prev.map(cat =>
        cat.id === categoryId
          ? {
            ...cat,
            bookmarks: cat.bookmarks.map(b =>
              b.id === editingBookmark.id
                ? { ...b, title: bookmarkForm.title, url: bookmarkForm.url, tags: bookmarkForm.tags }
                : b
            )
          }
          : cat
      ));
    } else {
      setCategories(prev => prev.map(cat =>
        cat.id === categoryId
          ? { ...cat, bookmarks: [...cat.bookmarks, { id: Date.now(), ...bookmarkForm }] }
          : cat
      ));
    }

    setBookmarkForm({ title: '', url: '', tags: [] });
    setShowBookmarkModal(null);
    setEditingBookmark(null);
  };

  const handleEditBookmark = (categoryId, bookmark) => {
    setEditingBookmark({ ...bookmark, categoryId });
    setBookmarkForm({ title: bookmark.title, url: bookmark.url, tags: bookmark.tags || [] });
    setShowBookmarkModal(categoryId);
  };

  const handleDeleteBookmark = (categoryId, bookmarkId) => {
    setConfirmDialog({
      isOpen: true,
      title: t.confirmDelete,
      message: t.confirmDeleteBookmark,
      onConfirm: () => {
        setCategories(prev => prev.map(cat =>
          cat.id === categoryId
            ? { ...cat, bookmarks: cat.bookmarks.filter(b => b.id !== bookmarkId) }
            : cat
        ));
        setConfirmDialog({ isOpen: false });
      }
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && bookmarkForm.tags.length < 5) {
      setBookmarkForm(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    setBookmarkForm(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const getTagColor = (tag) => {
    if (settings.tagColors[tag]) {
      return config.themes.tagColors.find(c => c.name === settings.tagColors[tag]) || config.themes.tagColors[0];
    }
    const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return config.themes.tagColors[hash % config.themes.tagColors.length];
  };

  const handleExport = () => {
    const data = {
      categories,
      settings,
      version: '1.0.0',
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cortex-backup-${Date.now()}.json`;
    a.click();
  };
  const handleOpenFullPage = () => {
    if (typeof browserAPI !== 'undefined' && browserAPI.tabs) {
      browserAPI.tabs.create({
        url: browserAPI.runtime.getURL('newtab.html')
      });
    }
  };

  const isPopup = document.body.classList.contains('popup');

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.categories) setCategories(data.categories);
          if (data.settings) {
            setSettings(data.settings);
          }
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };
const handleSyncBookmarks = async () => {
  //  Cross-browser bookmark API control
  const bookmarksAPI = (typeof browser !== 'undefined' && browser.bookmarks) || 
                       (typeof chrome !== 'undefined' && chrome.bookmarks);
  
  if (!bookmarksAPI) {
    alert('Bookmark API not available in this browser');
    return;
  }

  if (isSyncing) {
    return; // If already syncing, do nothing
  }

  setIsSyncing(true);

  try {
    // Recursive function to process bookmark tree
    const processBookmarkNode = (node, path = []) => {
      const results = [];
      
      if (node.url) {
        // This is a bookmark (not a folder)
        const categoryName = path.length > 0 ? path.join('/') : 'Imported';
        results.push({
          title: node.title || 'Untitled',
          url: node.url,
          category: categoryName,
          tags: ['Personal']
        });
      }
      
      if (node.children) {
        // This is a folder, process children
        const newPath = node.title && node.id !== '0' ? [...path, node.title] : path;
        node.children.forEach(child => {
          results.push(...processBookmarkNode(child, newPath));
        });
      }
      
      return results;
    };

    // Get all bookmarks
    const bookmarkTree = await bookmarksAPI.getTree();
    const allBookmarks = bookmarkTree.flatMap(node => processBookmarkNode(node));

    if (allBookmarks.length === 0) {
      alert('No bookmarks found in browser');
      setIsSyncing(false);
      return;
    }

    // Collect existing URLs to avoid duplicates
    const existingUrls = new Set();
    categories.forEach(cat => {
      cat.bookmarks.forEach(bm => {
        existingUrls.add(bm.url);
      });
    });

    // Filter out duplicates
    const newBookmarks = allBookmarks.filter(bm => !existingUrls.has(bm.url));

    if (newBookmarks.length === 0) {
      alert('✅ All bookmarks are already synced! No new bookmarks to add.');
      setIsSyncing(false);
      return;
    }

    // Group by category
    const bookmarksByCategory = {};
    newBookmarks.forEach(bm => {
      if (!bookmarksByCategory[bm.category]) {
        bookmarksByCategory[bm.category] = [];
      }
      bookmarksByCategory[bm.category].push({
        id: Date.now() + Math.random(),
        title: bm.title,
        url: bm.url,
        tags: bm.tags
      });
    });

    // Create or update categories
    setCategories(prev => {
      const newCategories = [...prev]; // Mevcut kategorileri kopyala
      
      Object.keys(bookmarksByCategory).forEach(categoryName => {
        const existingCategory = newCategories.find(c => c.name === categoryName);
        
        if (existingCategory) {
          // Check for duplicates within the category
          const existingCategoryUrls = new Set(existingCategory.bookmarks.map(b => b.url));
          const uniqueBookmarks = bookmarksByCategory[categoryName].filter(
            b => !existingCategoryUrls.has(b.url)
          );
          
          if (uniqueBookmarks.length > 0) {
            existingCategory.bookmarks.push(...uniqueBookmarks);
          }
        } else {
          // Create new category
          newCategories.push({
            id: Date.now() + Math.random(),
            name: categoryName,
            bookmarks: bookmarksByCategory[categoryName]
          });
        }
      });
      
      return newCategories;
    });

    const totalNew = newBookmarks.length;
    const skipped = allBookmarks.length - newBookmarks.length;
    
    let message = `✅ Successfully imported ${totalNew} new bookmark${totalNew !== 1 ? 's' : ''} into ${Object.keys(bookmarksByCategory).length} categor${Object.keys(bookmarksByCategory).length !== 1 ? 'ies' : 'y'}!`;
    
    if (skipped > 0) {
      message += `\n\n⚠️ ${skipped} duplicate bookmark${skipped !== 1 ? 's were' : ' was'} skipped.`;
    }
    
    alert(message);
  } catch (error) {
    console.error('Bookmark sync error:', error);
    alert('❌ Failed to sync bookmarks: ' + error.message);
  } finally {
    setIsSyncing(false);
  }
};
  const handleCustomThemeChange = (key, value) => {
    const newTheme = { ...customTheme, [key]: value };
    setCustomTheme(newTheme);
    setSettings(prev => ({ ...prev, customTheme: newTheme, theme: 'custom' }));
  };

  const handleResetTheme = () => {
    setCustomTheme(null);
    setSettings(prev => ({ ...prev, customTheme: null, theme: 'grafana' }));
  };

  // Tag Management Functions
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

  const deleteTagFromAllBookmarks = (tag) => {
    setCategories(prev => prev.map(cat => ({
      ...cat,
      bookmarks: cat.bookmarks.map(bookmark => ({
        ...bookmark,
        tags: bookmark.tags ? bookmark.tags.filter(t => t !== tag) : []
      }))
    })));

    setSettings(prev => {
      const newTagColors = { ...prev.tagColors };
      delete newTagColors[tag];
      return { ...prev, tagColors: newTagColors };
    });
  };

  // Category Management
  const handleRenameCategory = (catId, newName) => {
    if (newName.trim()) {
      setCategories(prev => prev.map(cat =>
        cat.id === catId ? { ...cat, name: newName } : cat
      ));
      setEditingCategory(null);
      setCategoryNameInput('');
    }
  };

  const handleOpenThemeCreator = (type) => {
    const defaultDark = { name: '', type: 'dark', bg: '#1a1b26', bgSecondary: '#16161e', card: '#24283b', cardHover: '#292e42', border: '#414868', borderHover: '#565f89', text: '#c0caf5', textSecondary: '#a9b1d6', accent: '#7aa2f7', logoSvg: '', logoColor: '#ffffff' };
    const defaultLight = { name: '', type: 'light', bg: '#ffffff', bgSecondary: '#f6f8fa', card: '#ffffff', cardHover: '#f6f8fa', border: '#d0d7de', borderHover: '#a8b1bb', text: '#24292f', textSecondary: '#57606a', accent: '#0969da', logoSvg: '', logoColor: '#000000' };

    setThemeCreatorForm(type === 'dark' ? defaultDark : defaultLight);
    setShowThemeCreator(true);
  };

  const handleEditTheme = () => {
    const themeToEdit = userThemes.find(t => t.name.toLowerCase().replace(/ /g, '-') === settings.theme);
    if (themeToEdit) {
      setEditingThemeName(settings.theme);
      setThemeCreatorForm(themeToEdit);
      setShowThemeCreator(true);
    }
  };

  const handleSaveTheme = () => {
    if (!themeCreatorForm.name.trim()) {
      alert('Theme name is required.');
      return;
    }
    const newThemeKey = themeCreatorForm.name.toLowerCase().replace(/ /g, '-');
    let newThemes = [...userThemes];

    if (editingThemeName) {
      // Update Existing Theme
      newThemes = newThemes.map(t => t.name.toLowerCase().replace(/ /g, '-') === editingThemeName ? themeCreatorForm : t);
    } else {
      // Add New Theme, Overwrite If Name Exists
      const existingIndex = newThemes.findIndex(t => t.name.toLowerCase().replace(/ /g, '-') === newThemeKey);
      if (existingIndex > -1) {
        newThemes[existingIndex] = themeCreatorForm;
      } else {
        newThemes.push(themeCreatorForm);
      }
    }

    setUserThemes(newThemes);
    if (typeof browserAPI !== 'undefined' && browserAPI.storage) {
      browserAPI.storage.local.set({ userThemes: newThemes });
    }
    setShowThemeCreator(false);
    setThemeCreatorForm(null);
    setEditingThemeName(null);
    setSettings(prev => ({ ...prev, theme: newThemeKey }));
  };

  const handleExportCustomThemes = () => {
    if (userThemes.length === 0) {
      alert('No custom themes to export.');
      return;
    }
    const blob = new Blob([JSON.stringify(userThemes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cortex-custom-themes-${Date.now()}.json`;
    a.click();
  };

  const handleImportCustomThemes = (e) => {
    const isValidTheme = (theme) => {
      const required = ['name', 'type', 'bg', 'bgSecondary', 'card', 'cardHover', 'border', 'borderHover', 'text', 'textSecondary', 'accent'];
      return required.every(k => typeof theme[k] === 'string' && theme[k].startsWith('#') || ['light', 'dark'].includes(theme.type));
    };
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const importedThemes = JSON.parse(event.target.result);

          const isValidTheme = (theme) => {
            const required = ['name', 'type', 'bg', 'bgSecondary', 'card', 'cardHover', 'border', 'borderHover', 'text', 'textSecondary', 'accent'];
            const hasAll = required.every(k => typeof theme[k] === 'string' && theme[k].startsWith('#'));
            const validType = ['light', 'dark'].includes(theme.type);
            return hasAll && validType;
          };
          if (Array.isArray(importedThemes)) {
            const newThemes = [...userThemes];
            importedThemes.forEach(theme => {
              if (isValidTheme(theme)) {
                const index = newThemes.findIndex(t => t.name === theme.name);
                if (index > -1) {
                  newThemes[index] = theme;
                } else {
                  newThemes.push(theme);
                }
              } else {
                console.warn('⛔ Skipped invalid theme:', theme);
              }
            });
            setUserThemes(newThemes);
            if (typeof browserAPI !== 'undefined' && browserAPI.storage) {
              browserAPI.storage.local.set({ userThemes: newThemes });
            }
            alert('Custom themes imported successfully.');
          } else {
            throw new Error('Invalid format');
          }
        } catch (error) {
          alert('Invalid file format for custom themes.');
        }
      };
      reader.readAsText(file);
    }
  };

  const cardWidth = `${100 / settings.gridColumns}%`;
  const filteredCategories = searchQuery
    ? categories.map(cat => ({
      ...cat,
      bookmarks: cat.bookmarks.filter(b =>
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.tags && b.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
      )
    })).filter(cat => cat.bookmarks.length > 0)
    : categories;

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
    // Header
    h('div', {
      style: {
        padding: '24px',
        backgroundColor: theme.bgSecondary,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative'
      }
    },
      isPopup && h('button', {
        onClick: handleOpenFullPage,
        title: t.openFullPage || 'Open Full Page',
        style: {
          position: 'absolute',
          top: '20px',
          left: '24px',
          padding: '8px',
          border: `1px solid ${theme.border}`,
          borderRadius: '6px',
          backgroundColor: theme.card,
          color: theme.text,
          cursor: 'pointer',
          fontSize: '18px',
          transition: 'all 0.2s'
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = theme.cardHover;
          e.currentTarget.style.borderColor = theme.accent;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = theme.card;
          e.currentTarget.style.borderColor = theme.border;
        }
      }, '⛶'),
      // Menu Button (Top Right)
      h('div', {
        ref: menuRef,
        style: {
          position: 'absolute',
          top: '20px',
          right: '24px'
        }
      },
        h('button', {
          onClick: () => setShowMenu(!showMenu),
          style: {
            padding: '8px 14px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.card,
            color: theme.text,
            cursor: 'pointer',
            fontSize: 'var(--font-2xl)'
          }
        }, '☰'),
        // Dropdown Menu
        showMenu && h('div', {
          style: {
            position: 'absolute',
            top: '100%',
            right: '0',
            marginTop: '8px',
            backgroundColor: theme.card,
            border: `1px solid ${theme.border}`,
            borderRadius: '8px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
            minWidth: '200px',
            zIndex: 1000,
            overflow: 'hidden'
          }
        },
          h('button', {
            onClick: () => {
              setShowTagManagement(true);
              setShowMenu(false);
            },
            style: {
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            },
            onMouseEnter: (e) => e.currentTarget.style.backgroundColor = theme.cardHover,
            onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
          }, h(Icon, { name: 'tag', theme, size: 16 }),
            t.tagManagement || 'Tag Management'
          ),

          h('button', {
            onClick: () => {
              setShowCategoryManagement(true);
              setShowMenu(false);
            },
            style: {
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            },
            onMouseEnter: (e) => e.currentTarget.style.backgroundColor = theme.cardHover,
            onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
          }, h(Icon, { name: 'folder', theme, size: 16 }),
            t.categoryManagement || 'Category Management'
          ),
          h('div', { style: { height: '1px', backgroundColor: theme.border, margin: '4px 0' } }),
          h('button', {
            onClick: () => {
              setShowSettings(true);
              setShowMenu(false);
            },
            style: {
              width: '100%',
              padding: '12px 16px',
              border: 'none',
              backgroundColor: 'transparent',
              color: theme.text,
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'background 0.2s'
            },
            onMouseEnter: (e) => e.currentTarget.style.backgroundColor = theme.cardHover,
            onMouseLeave: (e) => e.currentTarget.style.backgroundColor = 'transparent'
          },
            h(Icon, { name: 'settings', theme, size: 16 }),
            t.settings
          )

        )
      ),
      // Logo (Center)
      h('div', {
        style: {
          width: '64px',
          height: '64px',
          marginBottom: '20px'
        },
        ref: (el) => {
          if (el) {
            fetch(browserAPI.runtime.getURL('assets/icons/logo.svg'))
              .then(res => res.text())
              .then(svg => {
                // Apply Color To Svg Paths
                const coloredSvg = svg.replace(/<g([^>]*)>/g, `<g$1 style="fill:${theme.logoColor || '#dddddd'};">`);
                el.innerHTML = coloredSvg;
              })
              .catch(err => console.error('SVG load error', err));
          }
        }
      }),
      // Search Bar (Below Logo)
      h('input', {
        type: 'text',
        placeholder: t.search,
        value: searchQuery,
        onChange: (e) => setSearchQuery(e.target.value),
        style: {
          width: '100%',
          maxWidth: '600px',
          padding: '12px 18px',
          border: `1px solid ${theme.border}`,
          borderRadius: '24px',
          backgroundColor: theme.card,
          color: theme.text,
          fontSize: 'var(--font-md)',
          outline: 'none'
        }
      })
    ),

    // Content
    h('div', {
      style: {
        flex: 1,
        overflowY: 'auto',
        padding: '20px 24px',
        backgroundColor: theme.bg
      }
    },
      filteredCategories.length > 0
        ? filteredCategories.map((category, catIdx) =>
          h('div', {
            key: `cat-${category.id}-${catIdx}`,
            style: {
              backgroundColor: theme.card,
              borderRadius: '10px',
              border: `1px solid ${theme.border}`,
              padding: '20px',
              marginBottom: '16px'
            }
          },
            h('div', {
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px'
              }
            },
              h('h3', {
                style: {
                  margin: 0,
                  fontSize: 'var(--font-xl)',
                  fontWeight: 600,
                  color: theme.text
                }
              }, category.name),
              h('div', { style: { display: 'flex', gap: '8px' } },
                h('button', {
                  onClick: () => {
                    setEditingBookmark(null);
                    setBookmarkForm({ title: '', url: '', tags: [] });
                    setShowBookmarkModal(category.id);
                  },
                  style: {
                    padding: '6px 12px',
                    border: 'none',
                    borderRadius: '6px',
                    backgroundColor: theme.accent,
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 500
                  }
                }, '+'),
                h('button', {
                  onClick: () => handleDeleteCategory(category.id),
                  style: {
                    padding: '6px 10px',
                    border: 'none',
                    background: 'none',
                    color: theme.textSecondary,
                    cursor: 'pointer',
                    fontSize: 'var(--font-xl)'
                  }
                }, '×')
              )
            ),
            h('div', {
              style: {
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px'
              }
            },
              category.bookmarks.length > 0
                ? category.bookmarks.map((bookmark, idx) =>
                  h('div', {
                    key: `${category.id}-${bookmark.url}-${idx}`,
                    style: {
                      width: `calc(${cardWidth} - ${12 * (settings.gridColumns - 1) / settings.gridColumns}px)`,
                      padding: '14px',
                      backgroundColor: theme.cardHover,
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`,
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                      transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                      e.currentTarget.style.borderColor = theme.borderHover;
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    },
                    onMouseLeave: (e) => {
                      e.currentTarget.style.borderColor = theme.border;
                      e.currentTarget.style.transform = 'translateY(0)';
                    }
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '10px'
                      }
                    },
                      h('div', {
                        onClick: () => openBookmark(bookmark.url),
                        style: { flex: 1, minWidth: 0 }
                      },
                        h('div', {
                          style: {
                            fontSize: 'var(--font-base)',
                            fontWeight: 500,
                            color: theme.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            marginBottom: '4px'
                          }
                        }, bookmark.title),
                        h('div', {
                          style: {
                            fontSize: 'var(--font-sm)',
                            color: theme.textSecondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }
                        }, bookmark.url)
                      ),
                      h('div', { style: { display: 'flex', gap: '4px' } },
                        h('button', {
                          onClick: (e) => {
                            e.stopPropagation();
                            handleEditBookmark(category.id, bookmark);
                          },
                          style: {
                            padding: '4px',
                            border: 'none',
                            background: 'none',
                            color: theme.textSecondary,
                            cursor: 'pointer',
                            fontSize: 'var(--font-md)'
                          },
                          title: t.edit
                        }, '✎'),
                        h('button', {
                          onClick: (e) => {
                            e.stopPropagation();
                            handleDeleteBookmark(category.id, bookmark.id);
                          },
                          style: {
                            padding: '4px',
                            border: 'none',
                            background: 'none',
                            color: theme.textSecondary,
                            cursor: 'pointer',
                            fontSize: 'var(--font-xl)'
                          },
                          title: t.delete
                        }, '×')
                      )
                    ),
                    bookmark.tags && bookmark.tags.length > 0 &&
                    h('div', {
                      style: {
                        display: 'flex',
                        gap: '6px',
                        flexWrap: 'wrap'
                      }
                    },
                      bookmark.tags.slice(0, 3).map((tag, tagIdx) => {
                        const color = getTagColor(tag);
                        return h('span', {
                          key: `${bookmark.url}-${tag}-${tagIdx}`,
                          style: {
                            padding: '3px 8px',
                            fontSize: 'var(--font-xs)',
                            fontWeight: 500,
                            borderRadius: '10px',
                            backgroundColor: color.bg,
                            color: color.text,
                            border: `1px solid ${color.border}`
                          }
                        }, tag);
                      })
                    )
                  )
                )
                : h('div', {
                  style: {
                    width: '100%',
                    padding: '40px',
                    textAlign: 'center',
                    color: theme.textSecondary,
                    fontSize: 'var(--font-md)'
                  }
                }, t.noBookmarks)
            )
          )
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

    // Tag Management Modal
showTagManagement && h('div', {
    style: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }
  },
    h('div', {
      style: {
        backgroundColor: theme.card,
        borderRadius: '12px',
        padding: '28px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '85vh',
        display: 'flex', // Flexbox container for layout
        flexDirection: 'column' // Children will stack vertically
      }
    },
      // Header Section
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexShrink: 0 // Prevent header from shrinking
        }
      },
        h('h3', {
          style: {
            margin: 0,
            fontSize: 'var(--font-3xl)',
            fontWeight: 600,
            color: theme.text
          }
        }, t.tagManagement || 'Tag Management'),
        h('button', {
          onClick: () => setShowTagManagement(false),
          style: {
            border: 'none',
            background: 'none',
            color: theme.text,
            cursor: 'pointer',
            fontSize: '24px',
            padding: '0'
          }
        }, '×')
      ),

      // Scrollable Tags List
      h('div', {
        style: {
          overflowY: 'auto', // Make only this part scrollable
          paddingRight: '10px' // Add some padding for the scrollbar
        }
      },
        getAllTags().length > 0
          ? h('div', {
              style: {
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }
            },
              getAllTags().map(tag => {
                const color = getTagColor(tag);
                
                // We use a Fragment to return multiple elements for each tag
                return h(React.Fragment, { key: tag }, 
                  
                  // The main tag row
                  h('div', {
                    style: {
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '14px',
                      backgroundColor: theme.cardHover,
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`
                    }
                  },
                    h('div', {
                      style: {
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }
                    },
                      h('span', {
                        style: {
                          padding: '6px 14px',
                          fontSize: 'var(--font-base)',
                          fontWeight: 500,
                          borderRadius: '12px',
                          backgroundColor: color.bg,
                          color: color.text,
                          border: `1px solid ${color.border}`
                        }
                      }, tag)
                    ),
                    h('div', {
                      style: {
                        display: 'flex',
                        gap: '8px'
                      }
                    },
                      h('button', {
                        // This now toggles the color picker for the specific tag
                        onClick: () => setSelectedTagForColor(selectedTagForColor === tag ? null : tag),
                        style: {
                          padding: '6px 12px',
                          border: `1px solid ${theme.border}`,
                          borderRadius: '6px',
                          backgroundColor: theme.card,
                          color: theme.text,
                          cursor: 'pointer',
                          fontSize: '12px'
                        }
                      }, '🎨'),
                      h('button', {
                        onClick: () => {
                          setConfirmDialog({
                            isOpen: true,
                            title: t.confirmDelete,
                            message: `Delete tag "${tag}"?`,
                            onConfirm: () => {
                              deleteTagFromAllBookmarks(tag);
                              setConfirmDialog({ isOpen: false });
                            }
                          });
                        },
                        style: {
                          padding: '6px 12px',
                          border: 'none',
                          borderRadius: '6px',
                          backgroundColor: '#da363320',
                          color: '#f85149',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }
                      }, '🗑️')
                    )
                  ),

                  // This block now lives inside the map and only shows for the selected tag
                  selectedTagForColor === tag &&
                  h('div', {
                    style: {
                      marginTop: '10px', // A bit of space from the tag row
                      padding: '16px',
                      backgroundColor: theme.cardHover,
                      borderRadius: '8px',
                      border: `1px solid ${theme.border}`
                    }
                  },
                    h('div', {
                      style: {
                        fontSize: 'var(--font-base)',
                        marginBottom: '12px',
                        color: theme.text,
                        fontWeight: 500
                      }
                    }, `${t.colorFor || 'Color for'}: ${selectedTagForColor}`),
                    h('div', {
                      style: {
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', // Flexible grid
                        gap: '8px'
                      }
                    },
                      config.themes.tagColors.map(color =>
                        h('button', {
                          key: color.name,
                          onClick: () => {
                            setSettings(prev => ({
                              ...prev,
                              tagColors: { ...prev.tagColors, [selectedTagForColor]: color.name }
                            }));
                            setSelectedTagForColor(null); // Close picker after selection
                          },
                          style: {
                            height: '40px',
                            borderRadius: '6px',
                            border: `2px solid ${color.border}`,
                            backgroundColor: color.bg,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: color.text,
                            fontSize: 'var(--font-sm)',
                            fontWeight: 500
                          }
                        }, color.name)
                      )
                    )
                  )
                );
              })
            )
          : h('div', {
              style: {
                padding: '40px',
                textAlign: 'center',
                color: theme.textSecondary,
                fontSize: 'var(--font-md)'
              }
            }, t.noTags || 'No tags yet')
      )
    )
  ),

    // Category Management Modal
    showCategoryManagement && h('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      h('div', {
        style: {
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '28px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }
      },
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }
        },
          h('h3', {
            style: {
              margin: 0,
              fontSize: 'var(--font-3xl)',
              fontWeight: 600,
              color: theme.text
            }
          }, t.categoryManagement || 'Category Management'),
          h('button', {
            onClick: () => {
              setShowCategoryManagement(false);
              setEditingCategory(null);
              setCategoryNameInput('');
            },
            style: {
              border: 'none',
              background: 'none',
              color: theme.text,
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0'
            }
          }, '×')
        ),

        // Add Category
        h('div', {
          style: {
            padding: '16px',
            backgroundColor: theme.cardHover,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            marginBottom: '20px'
          }
        },
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('input', {
              type: 'text',
              placeholder: t.categoryName || 'Category name',
              value: newCategory,
              onChange: (e) => setNewCategory(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleAddCategory(),
              style: {
                flex: 1,
                padding: '10px 14px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.card,
                color: theme.text,
                fontSize: 'var(--font-md)',
                outline: 'none'
              }
            }),
            h('button', {
              onClick: handleAddCategory,
              style: {
                padding: '10px 20px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: theme.accent,
                color: '#fff',
                cursor: 'pointer',
                fontSize: 'var(--font-md)',
                fontWeight: 500
              }
            }, `+ ${t.add || 'Add'}`)
          )
        ),

        h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }
        },
          categories.map(cat =>
            h('div', {
              key: cat.id,
              style: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px',
                backgroundColor: theme.cardHover,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`
              }
            },
              editingCategory === cat.id
                ? h('input', {
                  type: 'text',
                  value: categoryNameInput,
                  onChange: (e) => setCategoryNameInput(e.target.value),
                  onKeyDown: (e) => {
                    if (e.key === 'Enter') handleRenameCategory(cat.id, categoryNameInput);
                    if (e.key === 'Escape') {
                      setEditingCategory(null);
                      setCategoryNameInput('');
                    }
                  },
                  autoFocus: true,
                  style: {
                    flex: 1,
                    padding: '8px 12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    backgroundColor: theme.card,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    outline: 'none'
                  }
                })
                : h('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                  }
                },
                  h('span', {
                    style: {
                      fontSize: 'var(--font-lg)',
                      fontWeight: 500,
                      color: theme.text
                    }
                  }, cat.name),
                  h('span', {
                    style: {
                      fontSize: 'var(--font-base)',
                      color: theme.textSecondary
                    }
                  }, `(${cat.bookmarks.length} bookmarks)`)
                ),
              h('div', {
                style: {
                  display: 'flex',
                  gap: '8px'
                }
              },
                editingCategory === cat.id
                  ? [
                    h('button', {
                      key: 'save',
                      onClick: () => handleRenameCategory(cat.id, categoryNameInput),
                      style: {
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: theme.accent,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }
                    }, '✓'),
                    h('button', {
                      key: 'cancel',
                      onClick: () => {
                        setEditingCategory(null);
                        setCategoryNameInput('');
                      },
                      style: {
                        padding: '6px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: theme.card,
                        color: theme.text,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }
                    }, '✕')
                  ]
                  : [
                    h('button', {
                      key: 'edit',
                      onClick: () => {
                        setEditingCategory(cat.id);
                        setCategoryNameInput(cat.name);
                      },
                      style: {
                        padding: '6px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: theme.card,
                        color: theme.text,
                        cursor: 'pointer',
                        fontSize: '12px'
                      }
                    }, '✎'),
                    h('button', {
                      key: 'delete',
                      onClick: () => handleDeleteCategory(cat.id),
                      style: {
                        padding: '6px 12px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: '#da363320',
                        color: '#f85149',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }
                    }, '🗑️')
                  ]
              )
            )
          )
        )
      )
    ),
    // Settings Modal
    showSettings && h('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      h('div', {
        style: {
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '28px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }
      },
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px'
          }
        },
          h('h3', {
            style: {
              margin: 0,
              fontSize: 'var(--font-3xl)',
              fontWeight: 600,
              color: theme.text
            }
          }, t.settings),
          h('button', {
            onClick: () => setShowSettings(false),
            style: {
              border: 'none',
              background: 'none',
              color: theme.text,
              cursor: 'pointer',
              fontSize: '24px',
              padding: '0'
            }
          }, '×')
        ),

        // Grid Columns
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.gridColumns),
          h('div', { style: { display: 'flex', gap: '8px' } },
            [1, 2, 3, 4, 5].map(num =>
              h('button', {
                key: num,
                onClick: () => setSettings(prev => ({ ...prev, gridColumns: num })),
                style: {
                  flex: 1,
                  padding: '12px',
                  border: settings.gridColumns === num ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  backgroundColor: settings.gridColumns === num ? `${theme.accent}20` : theme.cardHover,
                  color: settings.gridColumns === num ? theme.accent : theme.text,
                  cursor: 'pointer',
                  fontSize: 'var(--font-md)',
                  fontWeight: 600
                }
              }, num)
            )
          )
        ),

        // Language
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.language),
          h('select', {
            value: settings.language,
            onChange: (e) => setSettings(prev => ({ ...prev, language: e.target.value })),
            style: {
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: 'var(--font-md)',
              cursor: 'pointer'
            }
          },
            h('option', { value: 'en' }, 'English'),
            h('option', { value: 'tr' }, 'Türkçe'),
            h('option', { value: 'de' }, 'Deutsch'),
            h('option', { value: 'fr' }, 'Français'),
            h('option', { value: 'es' }, 'Español')
          )
        ),

        // Theme Management
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: '14px',
              fontWeight: 500,
              color: theme.text
            }
          }, t.theme),
          h('select', {
            value: settings.theme,
            onChange: (e) => setSettings(prev => ({ ...prev, theme: e.target.value })),
            style: {
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: '14px',
              cursor: 'pointer'
            }
          },
            h('optgroup', { label: '🌑 Dark Themes' },
              Object.values(config.themes.presets).filter(th => ['cortex-dark', 'dracula', 'nord', 'one-night', 'tokyo-night', 'github-dark'].includes(th.name.toLowerCase().replace(/ /g, '-'))).map(th => h('option', { key: th.name, value: th.name.toLowerCase().replace(/ /g, '-') }, th.name))
            ),
            h('optgroup', { label: '☀️ Light Themes' },
              Object.values(config.themes.presets).filter(th => ['cortex-light', 'solarized-light', 'one-light', 'nord-light', 'catppuccin-latte', 'ayu-light', 'github-light'].includes(th.name.toLowerCase().replace(/ /g, '-'))).map(th => h('option', { key: th.name, value: th.name.toLowerCase().replace(/ /g, '-') }, th.name))
            ),
            userThemes.length > 0 && h('optgroup', { label: 'Custom Themes' },
              userThemes.map(th => h('option', { key: th.name, value: th.name.toLowerCase().replace(/ /g, '-') }, th.name))
            )
          ),
          h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } },
            h('button', {
              onClick: () => {
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
                setThemeCreatorForm(defaultLight);
                setShowThemeCreator(true);
              },
              style: {
                flex: 1,
                padding: '10px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardHover,
                color: theme.text,
                cursor: 'pointer'
              }
            }, 'Create a Theme'),
            userThemes.some(t => t.name.toLowerCase().replace(/ /g, '-') === settings.theme) && h('button', {
              onClick: handleEditTheme,
              style: { flex: 1, padding: '10px', border: 'none', borderRadius: '6px', backgroundColor: theme.accent, color: '#fff', cursor: 'pointer' }
            }, 'Edit Theme')
          )
        ),
        // Font Family
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.fontFamily || 'Font Family'),
          h('select', {
            value: settings.fontFamily,
            onChange: (e) => setSettings(prev => ({ ...prev, fontFamily: e.target.value })),
            style: {
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: 'var(--font-md)',
              cursor: 'pointer'
            }
          },
            h('option', { value: 'system' }, 'System Default'),
            h('option', { value: 'inter' }, 'Inter'),
            h('option', { value: 'roboto' }, 'Roboto'),
            h('option', { value: 'opensans' }, 'Open Sans'),
            h('option', { value: 'lato' }, 'Lato'),
            h('option', { value: 'poppins' }, 'Poppins'),
            h('option', { value: 'montserrat' }, 'Montserrat'),
            h('option', { value: 'ibmplexmono' }, 'IBM Plex Mono'),
            h('option', { value: 'cascadia' }, 'Cascadia Mono')
          )
        ),

        // Font Size
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.fontSize || 'Font Size'),
          h('div', { style: { display: 'flex', gap: '8px' } },
            [
              { value: 'small', label: t.small || 'Small', icon: 'A' },
              { value: 'medium', label: t.medium || 'Medium', icon: 'A' },
              { value: 'large', label: t.large || 'Large', icon: 'A' },
              { value: 'xlarge', label: t.extraLarge || 'XL', icon: 'A' }
            ].map((size, idx) =>
              h('button', {
                key: size.value,
                onClick: () => setSettings(prev => ({ ...prev, fontSize: size.value })),
                style: {
                  flex: 1,
                  padding: '12px 8px',
                  border: settings.fontSize === size.value ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                  borderRadius: '6px',
                  backgroundColor: settings.fontSize === size.value ? `${theme.accent}20` : theme.cardHover,
                  color: settings.fontSize === size.value ? theme.accent : theme.text,
                  cursor: 'pointer',
                  fontSize: ['11px', '13px', '15px', '17px'][idx],
                  fontWeight: 600,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px'
                }
              },
                h('span', {
                  style: {
                    fontSize: ['14px', '16px', '18px', '20px'][idx]
                  }
                }, size.icon),
                h('span', {
                  style: {
                    fontSize: 'var(--font-sm)',
                    fontWeight: 500
                  }
                }, size.label)
              )
            )
          )
        ),
        // Open In
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.openIn),
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('button', {
              onClick: () => setSettings(prev => ({ ...prev, openInNewTab: true })),
              style: {
                flex: 1,
                padding: '12px',
                border: settings.openInNewTab ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: settings.openInNewTab ? `${theme.accent}20` : theme.cardHover,
                color: settings.openInNewTab ? theme.accent : theme.text,
                cursor: 'pointer',
                fontSize: 'var(--font-md)',
                fontWeight: 500
              }
            }, t.newTab),
            h('button', {
              onClick: () => setSettings(prev => ({ ...prev, openInNewTab: false })),
              style: {
                flex: 1,
                padding: '12px',
                border: !settings.openInNewTab ? `2px solid ${theme.accent}` : `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: !settings.openInNewTab ? `${theme.accent}20` : theme.cardHover,
                color: !settings.openInNewTab ? theme.accent : theme.text,
                cursor: 'pointer',
                fontSize: 'var(--font-md)',
                fontWeight: 500
              }
            }, t.sameTab)
          )
        ),

        // Data Management Section
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.dataManagement || 'Data Management'),
          h('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }
          },
            h('button', {
              onClick: handleExport,
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardHover,
                color: theme.text, fontSize: 'var(--font-md)', cursor: 'pointer'
              }
            }, h(Icon, { name: 'download', theme, size: 18 }), t.exportData || 'Export Data'),
            h('button', {
              onClick: () => fileInputRef.current?.click(),
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardHover,
                color: theme.text, fontSize: 'var(--font-md)', cursor: 'pointer'
              }
            }, h(Icon, { name: 'upload', theme, size: 18 }), t.importData || 'Import Data')
          )
        ),
        // Bookmark Sync Section
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.bookmarkSync || 'Bookmark Synchronization'),
          h('button', {
            onClick: handleSyncBookmarks,
            style: {
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '8px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: 'var(--font-md)',
              cursor: 'pointer'
            }
          }, h(Icon, { name: 'sync', theme, size: 18 }), t.syncBrowserBookmarks || 'Sync Browser Bookmarks')
        ),
        // Theme Management Section
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '10px',
              fontSize: 'var(--font-md)',
              fontWeight: 500,
              color: theme.text
            }
          }, t.themeManagement || 'Theme Management'),
          h('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }
          },
            h('button', {
              onClick: handleExportCustomThemes,
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardHover,
                color: theme.text, fontSize: 'var(--font-md)', cursor: 'pointer'
              }
            }, h(Icon, { name: 'palette', theme, size: 18 }), t.exportThemes || 'Export Themes'),
            h('button', {
              onClick: () => document.getElementById('import-themes-input')?.click(),
              style: {
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px',
                border: `1px solid ${theme.border}`, borderRadius: '8px', backgroundColor: theme.cardHover,
                color: theme.text, fontSize: 'var(--font-md)', cursor: 'pointer'
              }
            }, h(Icon, { name: 'import', theme, size: 18 }), t.importThemes || 'Import Themes')
          )
        ),

        h('input', { ref: fileInputRef, type: 'file', accept: '.json', onChange: handleImport, style: { display: 'none' } }),
        h('input', { id: 'import-themes-input', type: 'file', accept: '.json', onChange: handleImportCustomThemes, style: { display: 'none' } }),

        // Developer Credit
        h('div', {
          style: {
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: `1px solid ${theme.border}`,
            textAlign: 'center',
            fontSize: 'var(--font-sm)',
            color: theme.textSecondary,
            lineHeight: '1.5'
          }
        },
          'Built this to organize my bookmark graveyard.',
          h('br'),
          'Hope it helps yours too.'
        )
      )
    ),

    // Add Category Modal
    showAddCategory && h('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      h('div', {
        style: {
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '400px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }
      },
        h('h3', {
          style: {
            margin: '0 0 16px',
            fontSize: 'var(--font-2xl)',
            fontWeight: 600,
            color: theme.text
          }
        }, t.newCategory),
        h('input', {
          type: 'text',
          placeholder: t.categoryName,
          value: newCategory,
          onChange: (e) => setNewCategory(e.target.value),
          onKeyDown: (e) => e.key === 'Enter' && handleAddCategory(),
          autoFocus: true,
          style: {
            width: '100%',
            padding: '12px',
            marginBottom: '16px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none'
          }
        }),
        h('div', { style: { display: 'flex', gap: '8px' } },
          h('button', {
            onClick: () => {
              setShowAddCategory(false);
              setNewCategory('');
            },
            style: {
              flex: 1,
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              fontWeight: 500
            }
          }, t.cancel),
          h('button', {
            onClick: handleAddCategory,
            style: {
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: theme.accent,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              fontWeight: 500
            }
          }, t.create)
        )
      )
    ),

    // Add/Edit Bookmark Modal
    showBookmarkModal && h('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      h('div', {
        style: {
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }
      },

        h('h3', {
          style: {
            margin: '0 0 16px',
            fontSize: 'var(--font-2xl)',
            fontWeight: 600,
            color: theme.text
          }
        }, editingBookmark ? t.editBookmark : t.newBookmark),

        // Category Dropdown
        h('div', {
          style: {
            marginBottom: '12px'
          }
        },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '8px',
              fontSize: 'var(--font-base)',
              color: theme.textSecondary
            }
          }, t.category || 'Category'),
          h('select', {
            value: showBookmarkModal,
            onChange: (e) => setShowBookmarkModal(Number(e.target.value)),
            style: {
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: 'var(--font-md)',
              cursor: 'pointer',
              outline: 'none',
              boxSizing: 'border-box'
            }
          },
            categories.map(cat =>
              h('option', {
                key: cat.id,
                value: cat.id
              }, cat.name)
            )
          )
        ),

        // Current URL notification
        bookmarkForm.url && !editingBookmark &&
        h('div', {
          style: {
            padding: '8px 12px',
            marginBottom: '12px',
            backgroundColor: `${theme.accent}20`,
            border: `1px solid ${theme.accent}`,
            borderRadius: '6px',
            fontSize: '12px',
            color: theme.accent
          }
        }, t.currentUrl),

        // Title Input
        h('input', {
          type: 'text',
          placeholder: t.bookmarkTitle,
          value: bookmarkForm.title,
          onChange: (e) => setBookmarkForm(prev => ({ ...prev, title: e.target.value })),
          style: {
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none',
            boxSizing: 'border-box'
          }
        }),

        // Url Input
        h('input', {
          type: 'text',
          placeholder: t.url,
          value: bookmarkForm.url,
          onChange: (e) => setBookmarkForm(prev => ({ ...prev, url: e.target.value })),
          style: {
            width: '100%',
            padding: '12px',
            marginBottom: '12px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none',
            boxSizing: 'border-box'
          }
        }),

        // Tags Section
        h('div', { style: { marginBottom: '16px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '8px',
              fontSize: 'var(--font-base)',
              color: theme.textSecondary
            }
          }, t.tags),
          h('div', {
            style: {
              display: 'flex',
              gap: '6px',
              marginBottom: '8px',
              flexWrap: 'wrap'
            }
          },
            bookmarkForm.tags.map(tag => {
              const color = getTagColor(tag);
              return h('span', {
                key: tag,
                onClick: () => setSelectedTagForColor(tag),
                style: {
                  padding: '4px 10px',
                  fontSize: 'var(--font-sm)',
                  fontWeight: 500,
                  borderRadius: '12px',
                  backgroundColor: color.bg,
                  color: color.text,
                  border: `1px solid ${color.border}`,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }
              },
                tag,
                h('span', {
                  onClick: (e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  },
                  style: { fontSize: 'var(--font-md)' }
                }, '×')
              );
            })
          ),
          selectedTagForColor &&
          h('div', {
            style: {
              padding: '12px',
              marginBottom: '8px',
              backgroundColor: theme.cardHover,
              borderRadius: '6px',
              border: `1px solid ${theme.border}`
            }
          },
            h('div', {
              style: {
                fontSize: 'var(--font-sm)',
                marginBottom: '8px',
                color: theme.textSecondary
              }
            }, `Color for: ${selectedTagForColor}`),
            h('div', {
              style: {
                display: 'flex',
                gap: '6px',
                flexWrap: 'wrap'
              }
            },
              config.themes.tagColors.map(color =>
                h('button', {
                  key: color.name,
                  onClick: () => {
                    setSettings(prev => ({
                      ...prev,
                      tagColors: { ...prev.tagColors, [selectedTagForColor]: color.name }
                    }));
                    setSelectedTagForColor(null);
                  },
                  style: {
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    border: `2px solid ${color.border}`,
                    backgroundColor: color.bg,
                    cursor: 'pointer'
                  }
                })
              )
            )
          ),
          bookmarkForm.tags.length < 5 &&
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('input', {
              type: 'text',
              placeholder: t.addTag,
              value: tagInput,
              onChange: (e) => setTagInput(e.target.value),
              onKeyDown: (e) => e.key === 'Enter' && handleAddTag(),
              style: {
                flex: 1,
                padding: '8px 12px',
                border: `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardHover,
                color: theme.text,
                fontSize: 'var(--font-base)',
                outline: 'none'
              }
            }),
            h('button', {
              onClick: handleAddTag,
              style: {
                padding: '8px 16px',
                border: 'none',
                borderRadius: '6px',
                backgroundColor: theme.borderHover,
                color: theme.text,
                cursor: 'pointer',
                fontSize: 'var(--font-base)'
              }
            }, '+')
          )
        ),

        // Action Buttons
        h('div', { style: { display: 'flex', gap: '8px' } },
          h('button', {
            onClick: () => {
              setShowBookmarkModal(null);
              setEditingBookmark(null);
              setBookmarkForm({ title: '', url: '', tags: [] });
              setTagInput('');
              setSelectedTagForColor(null);
            },
            style: {
              flex: 1,
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              fontWeight: 500
            }
          }, t.cancel),
          h('button', {
            onClick: () => handleSaveBookmark(showBookmarkModal),
            style: {
              flex: 1,
              padding: '12px',
              border: 'none',
              borderRadius: '6px',
              backgroundColor: theme.accent,
              color: '#fff',
              cursor: 'pointer',
              fontSize: 'var(--font-md)',
              fontWeight: 500
            }
          }, editingBookmark ? t.save : t.add)
        )
      )
    ),

    // Confirm Dialog
    h(ConfirmDialog, {
      isOpen: confirmDialog.isOpen,
      title: confirmDialog.title,
      message: confirmDialog.message,
      onConfirm: confirmDialog.onConfirm,
      onCancel: () => setConfirmDialog({ isOpen: false }),
      confirmText: t.delete,
      cancelText: t.cancel,
      theme: theme
    }),

    showThemeCreator && themeCreatorForm && h('div', {
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }
    },
      h('div', {
        style: {
          backgroundColor: theme.card,
          borderRadius: '12px',
          padding: '24px',
          width: '90%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
        }
      },
        h('h3', { style: { margin: '0 0 16px', color: theme.text, fontSize: 'var(--font-2xl)' } }, 'Create Theme'),

        h('input', {
          type: 'text',
          placeholder: 'Theme Name',
          value: themeCreatorForm.name || '',
          onChange: (e) => setThemeCreatorForm(prev => ({ ...prev, name: e.target.value })),
          style: { width: '100%', padding: '12px', marginBottom: '12px', border: `1px solid ${theme.border}`, borderRadius: '6px', backgroundColor: theme.cardHover, color: theme.text, fontSize: 'var(--font-md)' }
        }),
        h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' } },
          Object.keys(themeCreatorForm).filter(k => k !== 'name' && k !== 'type' && k !== 'logoSvg').map(key =>
            h('div', { key: key, style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px', backgroundColor: theme.cardHover, borderRadius: '6px' } },
              h('label', { style: { color: theme.textSecondary, fontSize: 'var(--font-sm)' } }, key),
              h('input', {
                type: 'color',
                value: themeCreatorForm[key],
                onChange: (e) => setThemeCreatorForm(prev => ({ ...prev, [key]: e.target.value })),
                style: { border: 'none', background: 'none', width: '32px', height: '32px' }
              })
            )
          )
        ), h('div', { style: { display: 'flex', gap: '8px', marginTop: '20px' } },
          h('button', {
            onClick: () => setShowThemeCreator(false),
            style: { flex: 1, padding: '12px', border: `1px solid ${theme.border}`, borderRadius: '6px', backgroundColor: theme.cardHover, color: theme.text, cursor: 'pointer', fontSize: 'var(--font-md)' }
          }, 'Cancel'),
          h('button', {
            onClick: handleSaveTheme,
            style: { flex: 1, padding: '12px', border: 'none', borderRadius: '6px', backgroundColor: theme.accent, color: '#fff', cursor: 'pointer', fontSize: 'var(--font-md)' }
          }, 'Save Theme')
        )
      )
    ));
}

// Initialize
const root = createRoot(document.getElementById('root'));
root.render(h(CortexApp));