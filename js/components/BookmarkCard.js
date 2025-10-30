/**
 * Cortex - BookmarkCard Component
 * BookmarkCard.js
 * @description Secure and interactive bookmark card
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @author Kerem Can ONEMLI
 * 
 */

import { getTagColor } from '../utils/theme.js';

const { createElement: h } = React;

export function BookmarkCard({
  bookmark,
  theme,
  settings,
  config,
  cardWidth,
  onOpen,
  onEdit,
  onDelete,
  t,
  hideUrl = false,
  hideActions = false,
  boardTagColors = null
}) {
  const handleClick = () => {
    if (settings.openInNewTab) {
      window.open(bookmark.url, '_blank');
    } else {
      window.location.href = bookmark.url;
    }
  };

  const isVertical = settings.cardLayout === 'vertical';

  return h('div', {
    className: 'bookmark-card',
    style: {
      width: isVertical
        ? '100%'
        : `calc(${cardWidth} - ${12 * (settings.gridColumns - 1) / settings.gridColumns}px)`,

      padding: isVertical ? '16px' : '14px',
      backgroundColor: theme.cardHover,
      borderRadius: isVertical ? '10px' : '8px',
      border: `1px solid ${theme.border}`,
      cursor: 'pointer',
      boxSizing: 'border-box',
      transition: 'all 0.2s',

      ...(isVertical && {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '280px',
        aspectRatio: '2/3',
        position: 'relative'
      })
    }
  },

    // Vertical Mode
    isVertical ? [
      // Action buttons - right top
      !hideActions && h('div', {
        style: {
          position: 'absolute',
          top: '12px',
          right: '12px',
          display: 'flex',
          gap: '4px',
          zIndex: 10
        }
      },
        h('button', {
          onClick: (e) => {
            e.stopPropagation();
            onEdit(bookmark);
          },
          style: {
            padding: '4px 6px',
            border: 'none',
            background: theme.card,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 'var(--font-md)',
            borderRadius: '4px'
          },
          title: t.edit
        }, '✎'),

        h('button', {
          onClick: (e) => {
            e.stopPropagation();
            onDelete(bookmark.id);
          },
          style: {
            padding: '4px 6px',
            border: 'none',
            background: theme.card,
            color: theme.textSecondary,
            cursor: 'pointer',
            fontSize: 'var(--font-lg)',
            borderRadius: '4px'
          },
          title: t.delete
        }, '×')
      ),

      // Vertical content
      h('div', {
        onClick: handleClick,
        style: {
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          paddingRight: !hideActions ? '50px' : '0'
        }
      },
        h('div', {
          style: {
            fontSize: 'var(--font-md)',
            fontWeight: 600,
            color: theme.text,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: '3',
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.4',
            marginBottom: '4px'
          }
        }, bookmark.title),

        !hideUrl && h('div', {
          style: {
            fontSize: 'var(--font-xs)',
            color: theme.textSecondary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            opacity: 0.8
          }
        }, bookmark.url)
      )
    ]

      // Horizontal Mode
      : [
        h('div', {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px'
          }
        },
          h('div', {
            onClick: handleClick,
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

            !hideUrl && h('div', {
              style: {
                fontSize: 'var(--font-sm)',
                color: theme.textSecondary,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }
            }, bookmark.url)
          ),

          !hideActions && h('div', { style: { display: 'flex', gap: '4px' } },
            h('button', {
              onClick: (e) => {
                e.stopPropagation();
                onEdit(bookmark);
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
                onDelete(bookmark.id);
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
        )
      ],

    // Tags
    bookmark.tags && bookmark.tags.length > 0 &&
    h('div', {
      style: {
        display: 'flex',
        gap: '6px',
        flexWrap: 'wrap'
      }
    },

      bookmark.tags.slice(0, 4).map((tag, idx) => {
        const color = boardTagColors
          ? boardTagColors[tag.charCodeAt(0) % boardTagColors.length]
          : getTagColor(tag, settings, config);

        return h('span', {
          key: `${bookmark.id}-${tag}-${idx}`,
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
      }),
      // +N badge
      bookmark.tags.length > 3 && h('span', {
        style: {
          padding: '3px 8px',
          fontSize: 'var(--font-xs)',
          fontWeight: 500,
          borderRadius: '10px',
          backgroundColor: theme.borderHover,
          color: theme.textSecondary,
          border: `1px solid ${theme.border}`
        }
      }, `+${bookmark.tags.length - 3}`)

    )
  );
}