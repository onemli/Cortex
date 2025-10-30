/**
 * Cortex - TagManagement Component
 * TagManagement.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Modal for managing bookmark Tags
 * @author Kerem Can ONEMLI
 */

import { getTagColor } from '../utils/theme.js';

const { useState, createElement: h } = React;

export function TagManagement({
  isOpen,
  theme,
  settings,
  config,
  categories,
  getAllTags,
  onDeleteTag,
  onSetTagColor,
  onClose,
  onConfirm,
  t
}) {
  const [selectedTagForColor, setSelectedTagForColor] = useState(null);

  if (!isOpen) return null;

  const allTags = getAllTags();

  const getTagUsageCount = (tag) => {
    return categories.reduce((sum, cat) =>
      sum + cat.bookmarks.filter(b => b.tags?.includes(tag)).length, 0
    );
  };

  const handleDeleteTag = (tag) => {
    onConfirm({
      title: t.confirmDelete,
      message: `Delete tag "${tag}"?`,
      onConfirm: () => onDeleteTag(tag)
    });
  };

  const handleSetTagColor = (tag, colorName) => {
    onSetTagColor(tag, colorName);
    setSelectedTagForColor(null);
  };

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
      // Header
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
        }, t.tagManagement || 'Tag Management'),

        h('button', {
          onClick: onClose,
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

      // Tags list
      allTags.length > 0
        ? h('div', {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }
        },
          allTags.map(tag => {
            const color = getTagColor(tag, settings, config);
            const usageCount = getTagUsageCount(tag);

            return h('div', {
              key: tag,
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
                }, tag),

                h('span', {
                  style: {
                    fontSize: 'var(--font-base)',
                    color: theme.textSecondary
                  }
                }, `(${usageCount} bookmark${usageCount !== 1 ? 's' : ''})`)
              ),

              h('div', {
                style: {
                  display: 'flex',
                  gap: '8px'
                }
              },
                h('button', {
                  onClick: () => setSelectedTagForColor(tag),
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
                  onClick: () => handleDeleteTag(tag),
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
        }, t.noTags || 'No tags yet'),

      // Color picker
      selectedTagForColor &&
      h('div', {
        style: {
          marginTop: '20px',
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
        }, `Color for: ${selectedTagForColor}`),

        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '8px'
          }
        },
          config.themes.tagColors.map(color =>
            h('button', {
              key: color.name,
              onClick: () => handleSetTagColor(selectedTagForColor, color.name),
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
        ),

        h('button', {
          onClick: () => setSelectedTagForColor(null),
          style: {
            width: '100%',
            marginTop: '12px',
            padding: '10px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.card,
            color: theme.text,
            cursor: 'pointer',
            fontSize: 'var(--font-base)'
          }
        }, t.cancel)
      )
    )
  );
}