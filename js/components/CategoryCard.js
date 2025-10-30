/**
 * Cortex - CategoryCard Component
 * CategoryCard.js
 * Category container with bookmarks
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Displays a category card with collapse/expand and reorder functionality
 * @author Kerem Can ONEMLI
 */

import { BookmarkCard } from './BookmarkCard.js';
import { Icon } from './Icon.js';

const { createElement: h } = React;

export function CategoryCard({
  category,
  categoryIndex,
  totalCategories,
  theme,
  settings,
  config,
  cardWidth,
  onAddBookmark,
  onEditBookmark,
  onDeleteBookmark,
  onDeleteCategory,
  onToggleVisibility,
  onMoveUp,
  onMoveDown,
  t
}) {
  const isCollapsed = category.isCollapsed || false;
  const canMoveUp = categoryIndex > 0;
  const canMoveDown = categoryIndex < totalCategories - 1;

  return h('div', {
    className: 'category-card',
    style: {
      backgroundColor: theme.card,
      borderRadius: '10px',
      border: `1px solid ${theme.border}`,
      padding: '20px',
      marginBottom: '16px',
      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease'
    }
  },
    // Header
    h('div', {
      style: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: isCollapsed ? '0' : '16px',
        cursor: 'pointer'
      }
    },
      // Left side: Eye icon + Category name
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flex: 1
        },
        onClick: () => onToggleVisibility(category.id)
      },
        // Eye icon (toggle visibility)
        h('button', {
          onClick: (e) => {
            e.stopPropagation();
            onToggleVisibility(category.id);
          },
          title: isCollapsed ? t.showBookmarks || 'Show bookmarks' : t.hideBookmarks || 'Hide bookmarks',
          style: {
            padding: '6px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
            outline: 'none',
            opacity: 0.6
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.color = theme.accent;
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.color = theme.textSecondary;
          }
        },
          h(Icon, {
            name: isCollapsed ? 'eye-slash' : 'eye',
            theme,
            size: 18
          })
        ),

        // Category name + bookmark count
        h('div', {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
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

          // Bookmark count badge
          h('span', {
            style: {
              padding: '3px 10px',
              backgroundColor: theme.cardHover,
              border: `1px solid ${theme.border}`,
              borderRadius: '12px',
              fontSize: 'var(--font-sm)',
              color: theme.textSecondary,
              fontWeight: 500
            }
          }, category.bookmarks.length)
        )
      ),

      // Right side: Action buttons
      h('div', {
        style: {
          display: 'flex',
          gap: '6px',
          alignItems: 'center'
        }
      },
        // Move Up button
        h('button', {
          onClick: () => onMoveUp(category.id),
          disabled: !canMoveUp,
          title: t.moveUp || 'Move up',
          style: {
            padding: '6px 8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: canMoveUp ? theme.textSecondary : theme.border,
            cursor: canMoveUp ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            opacity: canMoveUp ? 0.6 : 0.3,
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          onMouseEnter: (e) => {
            if (canMoveUp) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = theme.accent;
            }
          },
          onMouseLeave: (e) => {
            if (canMoveUp) {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.color = theme.textSecondary;
            }
          }
        },
          h(Icon, { name: 'chevron-up', theme, settings, size: 16 })
        ),

        // Move Down button
        h('button', {
          onClick: () => onMoveDown(category.id),
          disabled: !canMoveDown,
          title: t.moveDown || 'Move down',
          style: {
            padding: '6px 8px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: canMoveDown ? theme.textSecondary : theme.border,
            cursor: canMoveDown ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 500,
            opacity: canMoveDown ? 0.6 : 0.3,
            transition: 'all 0.2s',
            outline: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          },
          onMouseEnter: (e) => {
            if (canMoveDown) {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.color = theme.accent;
            }
          },
          onMouseLeave: (e) => {
            if (canMoveDown) {
              e.currentTarget.style.opacity = '0.6';
              e.currentTarget.style.color = theme.textSecondary;
            }
          }
        },
          h(Icon, { name: 'chevron-down', theme, settings, size: 16 })
        ),

        // Add bookmark button
        h('button', {
          onClick: () => onAddBookmark(category.id),
          title: t.addBookmark || 'Add bookmark',
          style: {
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: 'transparent',
            color: theme.accent,
            opacity: 0.6,
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
            transition: 'all 0.2s',
            outline: 'none'
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.opacity = '1';
            e.currentTarget.style.transform = 'scale(1.05)';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.opacity = '0.6';
            e.currentTarget.style.transform = 'scale(1)';
          }
        }, '+'),

        // Delete category button
        h('button', {
          onClick: () => onDeleteCategory(category.id),
          title: t.deleteCategory || 'Delete category',
          style: {
            padding: '6px 10px',
            border: 'none',
            background: 'none',
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 'var(--font-xl)',
            transition: 'all 0.2s',
            outline: 'none'
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.color = '#f85149';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.color = theme.textSecondary;
          }
        }, '×')
      )
    ),

    // Bookmarks grid (only show if not collapsed)
    !isCollapsed && h('div', {
      style: settings.cardLayout === 'vertical'
        ? {
          // Vertical: Grid kullan
          display: 'grid',
          gridTemplateColumns: `repeat(auto-fill, minmax(180px, 1fr))`,
          gap: '12px'
        }
        : {
          // Horizontal
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px'
        }
    },
      category.bookmarks.length > 0
        ? category.bookmarks.map((bookmark, idx) =>
          h(BookmarkCard, {
            key: `${category.id}-${bookmark.id}-${idx}`,
            bookmark,
            theme,
            settings,
            config,
            cardWidth,
            onEdit: () => onEditBookmark(category.id, bookmark),
            onDelete: (bookmarkId) => onDeleteBookmark(category.id, bookmarkId),
            t
          })
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
  );
}