/**
 * Cortex - CategoryManagement Component
 * CategoryManagement.js
 * @version 1.2.0
 * @license GPL-3.0
 * @description Modal for managing categories with full CRUD operations
 * @author Kerem Can ONEMLI
 * 
 */

import { TextSanitizer } from '../utils/validation.js';
const { useState, createElement: h } = React;
export function CategoryManagement({
  isOpen,
  theme,
  settings,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onClose,
  t
}) {
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryNameInput, setCategoryNameInput] = useState('');

  if (!isOpen) return null;

  const handleAddCategory = () => {
    const nameResult = TextSanitizer.sanitizeCategoryName(newCategoryName);
    if (!nameResult.isValid) {
      alert(`Invalid category name: ${nameResult.error}`);
      return;
    }

    onAddCategory(nameResult.sanitized);
    setNewCategoryName('');
  };

  const handleRenameCategory = (catId) => {
    const nameResult = TextSanitizer.sanitizeCategoryName(categoryNameInput);

    if (!nameResult.isValid) {
      alert(`Invalid category name: ${nameResult.error}`);
      return;
    }

    onRenameCategory(catId, nameResult.sanitized);
    setEditingCategory(null);
    setCategoryNameInput('');
  };

  const handleStartEdit = (category) => {
    setEditingCategory(category.id);
    setCategoryNameInput(category.name);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setCategoryNameInput('');
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
        }, t.categoryManagement || 'Category Management'),

        h('button', {
          onClick: () => {
            onClose();
            handleCancelEdit();
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

      // Add Category Section
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
            value: newCategoryName,
            onChange: (e) => setNewCategoryName(e.target.value),
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

      // Categories List
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
                  if (e.key === 'Enter') handleRenameCategory(cat.id);
                  if (e.key === 'Escape') handleCancelEdit();
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
                }, `(${cat.bookmarks.length} bookmark${cat.bookmarks.length !== 1 ? 's' : ''})`)
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
                    onClick: () => handleRenameCategory(cat.id),
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
                    onClick: handleCancelEdit,
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
                    onClick: () => handleStartEdit(cat),
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
                    onClick: () => onDeleteCategory(cat.id),
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
  );
}