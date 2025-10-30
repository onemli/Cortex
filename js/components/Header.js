/**
 * Cortex - Header Component
 * Header.js
 * @version 1.3.2
 * @license GNU GPL-3.0
 * @description Responsive header with autoComplete.js library - Fixed dropdown background
 * @author Kerem Can ONEMLI
 */

import { Icon } from './Icon.js';
import { browserAPI, openFullPage, isPopupMode } from '../utils/browser.js';

const { useRef, useEffect, useMemo, createElement: h } = React;

export function Header({
  theme,
  settings,
  searchQuery,
  onSearchChange,
  showMenu,
  onMenuToggle,
  onOpenSettings,
  categories,
  t
}) {
  const menuRef = useRef(null);
  const searchInputRef = useRef(null);
  const autoCompleteInstance = useRef(null);
  const isInitialized = useRef(false);

  // Close menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onMenuToggle(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // Collect all searchable items: tags, titles, and URLs
  const searchSuggestions = useMemo(() => {
    if (!categories) return [];

    const suggestions = new Set();

    categories.forEach(cat => {
      cat.bookmarks.forEach(bookmark => {
        // Add title
        if (bookmark.title && bookmark.title.trim()) {
          suggestions.add(bookmark.title.trim());
        }

        // Add tags
        if (bookmark.tags && Array.isArray(bookmark.tags)) {
          bookmark.tags.forEach(tag => {
            if (tag && tag.trim()) {
              suggestions.add(tag.trim());
            }
          });
        }

        // Optionally add domain from URL
        try {
          if (bookmark.url) {
            const url = new URL(bookmark.url);
            const domain = url.hostname.replace('www.', '');
            suggestions.add(domain);
          }
        } catch (e) {
          // Invalid URL, skip
        }
      });
    });

    return Array.from(suggestions).sort();
  }, [categories]);

  // Initialize autoComplete.js when categories load
  useEffect(() => {
    // Skip if already initialized
    if (isInitialized.current) {
      return;
    }

    if (!searchInputRef.current || !window.autoComplete) {
      return;
    }

    // Wait for categories to be loaded
    if (!categories || categories.length === 0) {
      return;
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      try {
        autoCompleteInstance.current = new window.autoComplete({
          selector: () => searchInputRef.current,
          placeHolder: t.search || 'Search bookmarks...',
          data: {
            src: searchSuggestions,
            cache: false, // Changed to false for dynamic updates
          },
          resultsList: {
            element: (list, data) => {
              if (!data.results.length) {
                const message = document.createElement("div");
                message.setAttribute("class", "no_result");
                message.style.padding = '12px 14px';
                message.style.color = theme.textSecondary;
                message.style.textAlign = 'center';
                message.style.fontSize = 'var(--font-sm)';
                message.innerHTML = `<span>No results for "${data.query}"</span>`;
                list.prepend(message);
              }
            },
            noResults: true,
            maxResults: 10,
            tabSelect: true
          },
          resultItem: {
            element: (item, data) => {
              item.style.display = 'flex';
              item.style.alignItems = 'center';
              item.style.gap = '8px';

              // Determine icon based on suggestion type
              const suggestion = data.value;
              const icon = document.createElement('i');
              icon.style.fontSize = '12px';
              icon.style.opacity = '0.6';
              icon.style.color = theme.textSecondary;

              // Check if it's a domain (contains a dot but no spaces)
              if (suggestion.includes('.') && !suggestion.includes(' ')) {
                icon.className = 'fa-solid fa-globe';
              }
              // Check if it matches any tag
              else {
                let isTag = false;
                categories.forEach(cat => {
                  cat.bookmarks.forEach(bookmark => {
                    if (bookmark.tags && bookmark.tags.includes(suggestion)) {
                      isTag = true;
                    }
                  });
                });
                icon.className = isTag ? 'fa-solid fa-tag' : 'fa-solid fa-bookmark';
              }

              item.innerHTML = '';
              item.appendChild(icon);

              const textSpan = document.createElement('span');
              textSpan.innerHTML = data.match;
              item.appendChild(textSpan);
            },
            highlight: true
          },
          events: {
            input: {
              selection: (event) => {
                const selection = event.detail.selection.value;
                onSearchChange(selection);
                searchInputRef.current.value = selection;
              }
            }
          },
          threshold: 0,
          debounce: 100,
        });

        isInitialized.current = true;
        console.log('✅ autoComplete.js initialized');
        console.log('📊 Suggestions data:', searchSuggestions);
        console.log('📊 Suggestions count:', searchSuggestions.length);
      } catch (error) {
        console.error('❌ autoComplete.js initialization error:', error);
      }
    }, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (autoCompleteInstance.current && isInitialized.current) {
        try {
          // Add safety check before unInit
          if (searchInputRef.current && searchInputRef.current.parentNode) {
            autoCompleteInstance.current.unInit();
          }
          autoCompleteInstance.current = null;
          isInitialized.current = false;
          console.log('🧹 autoComplete.js cleaned up');
        } catch (error) {
          console.warn('⚠️ autoComplete cleanup warning:', error);
        }
      }
    };
  }, [categories]); // Re-run when categories load

  // Update data source when suggestions change
  useEffect(() => {
    if (autoCompleteInstance.current && isInitialized.current && searchSuggestions.length > 0) {
      try {
        autoCompleteInstance.current.data.src = searchSuggestions;
        console.log('🔄 Updated autocomplete data:', searchSuggestions.length);
      } catch (error) {
        console.warn('⚠️ Failed to update autocomplete data:', error);
      }
    }
  }, [searchSuggestions]);

  // Apply theme to autoComplete dropdown
  useEffect(() => {
    if (!theme) return;

    const styleId = 'autocomplete-theme-override';
    let styleEl = document.getElementById(styleId);

    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    styleEl.textContent = `
      /* Override autoComplete.js default styles with theme */
      .autoComplete_wrapper > ul {
        background-color: ${theme.card} !important;
        border: 1px solid ${theme.border} !important;
        border-radius: 8px !important;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25) !important;
        margin-top: 8px !important;
        padding: 6px !important;
        max-height: 300px !important;
        overflow-y: auto !important;
        z-index: 9999 !important;
      }

      .autoComplete_wrapper > ul > li {
        background-color: ${theme.card} !important;
        color: ${theme.text} !important;
        padding: 10px 14px !important;
        border-radius: 6px !important;
        margin: 2px 0 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
        list-style: none !important;
      }

      .autoComplete_wrapper > ul > li:hover,
      .autoComplete_wrapper > ul > li[aria-selected="true"] {
        background-color: ${theme.cardHover} !important;
        transform: translateX(2px) !important;
      }

      .autoComplete_wrapper > ul > li mark {
        color: ${theme.accent} !important;
        background-color: transparent !important;
        font-weight: 600 !important;
      }

      .autoComplete_wrapper > ul::-webkit-scrollbar {
        width: 8px;
      }

      .autoComplete_wrapper > ul::-webkit-scrollbar-track {
        background: ${theme.bgSecondary};
        border-radius: 4px;
      }

      .autoComplete_wrapper > ul::-webkit-scrollbar-thumb {
        background: ${theme.border};
        border-radius: 4px;
      }

      .autoComplete_wrapper > ul::-webkit-scrollbar-thumb:hover {
        background: ${theme.accent};
      }

      .autoComplete_wrapper > input {
        background-image: none !important;
        padding: 12px 18px !important;
        border: 1px solid ${theme.border} !important;
        border-radius: 24px !important;
        background-color: ${theme.card} !important;
        color: ${theme.text} !important;
        font-size: var(--font-md) !important;
        width: 100% !important;
        max-width: 600px !important;
        height: auto !important;
        margin: 0 !important;
        box-sizing: border-box !important;
        transition: all 0.2s ease !important;
      }

      /* Prevent white flash on load */
      #searchInput {
        background-color: ${theme.card} !important;
        color: ${theme.text} !important;
        border-color: ${theme.border} !important;
      }

      .autoComplete_wrapper > input::placeholder {
        color: ${theme.textSecondary} !important;
      }

      .autoComplete_wrapper > input:hover {
        border-color: ${theme.accent} !important;
        color: ${theme.text} !important;
      }

      .autoComplete_wrapper > input:focus {
        border-color: ${theme.accent} !important;
        color: ${theme.text} !important;
        outline: none !important;
      }

      .autoComplete_wrapper {
        width: 100% !important;
        max-width: 600px !important;
      }
    `;
  }, [theme]);

  return h('div', {
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
    // Full page button (popup only)
    isPopupMode() && h('button', {
      onClick: openFullPage,
      title: t.openFullPage || 'Open Full Page',
      style: {
        position: 'absolute',
        top: '20px',
        left: '24px',
        padding: '8px 12px',
        border: `1px solid ${theme.border}`,
        borderRadius: '6px',
        backgroundColor: theme.card,
        color: theme.text,
        cursor: 'pointer',
        fontSize: '18px',
        transition: 'all 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      },
      onMouseEnter: (e) => {
        e.currentTarget.style.backgroundColor = theme.cardHover;
        e.currentTarget.style.borderColor = theme.accent;
      },
      onMouseLeave: (e) => {
        e.currentTarget.style.backgroundColor = theme.card;
        e.currentTarget.style.borderColor = theme.border;
      }
    },
      h(Icon, { name: 'expand', theme, settings, size: 18 })
    ),

    // Settings button
    h('div', {
      ref: menuRef,
      style: {
        position: 'absolute',
        top: '20px',
        right: '24px'
      }
    },
      h('button', {
        onClick: () => onOpenSettings(),
        title: t.settings || 'Settings',
        style: {
          padding: '8px 14px',
          border: `1px solid ${theme.border}`,
          borderRadius: '6px',
          backgroundColor: theme.card,
          color: theme.text,
          cursor: 'pointer',
          transition: 'all 0.2s',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        },
        onMouseEnter: (e) => {
          e.currentTarget.style.backgroundColor = theme.cardHover;
          e.currentTarget.style.borderColor = theme.accent;
        },
        onMouseLeave: (e) => {
          e.currentTarget.style.backgroundColor = theme.card;
          e.currentTarget.style.borderColor = theme.border;
        }
      },
        h(Icon, { name: 'cog', theme, settings, size: 18 })
      )
    ),

    // Logo
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
              const coloredSvg = svg.replace(/<g([^>]*)>/g,
                `<g$1 style="fill:${theme.logoColor || '#dddddd'};">`
              );
              el.innerHTML = coloredSvg;
            })
            .catch(err => console.error('SVG load error', err));
        }
      }
    }),

    // Search bar with autoComplete
    h('input', {
      ref: searchInputRef,
      id: 'searchInput',
      type: 'text',
      value: searchQuery,
      onChange: (e) => onSearchChange(e.target.value),
      autoComplete: 'off',
      style: {
        width: '100%',
        maxWidth: '600px',
        padding: '12px 18px',
        border: `1px solid ${theme.border}`,
        borderRadius: '24px',
        backgroundColor: theme.card,
        color: theme.text,
        fontSize: 'var(--font-md)',
        outline: 'none',
        transition: 'all 0.2s ease',
        boxSizing: 'border-box'
      }
    })
  );
}