/**
 * Cortex - BookmarkModal Component
 * BookmarkModal.js
 * OWASP Compliant Input Validation
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Secure modal for adding/editing bookmarks with multi-layer validation
 * @author Kerem Can ONEMLI
 * 
 */

import { URLValidator, TextSanitizer, SecurityHelpers } from '../utils/validation.js';
import { getTagColor } from '../utils/theme.js';
import { MAX_TAGS_PER_BOOKMARK } from '../constants/index.js';
const { useState, createElement: h } = React;

export function BookmarkModal({
  isOpen,
  categoryId,
  categories,
  bookmarkForm,
  editingBookmark,
  theme,
  settings,
  config,
  onClose,
  onSave,
  onFormChange,
  onCategoryChange,
  updateSettings,
  t
}) {
  const [tagInput, setTagInput] = useState('');
  const [selectedTagForColor, setSelectedTagForColor] = useState(null);
  const [errors, setErrors] = useState({});

  if (!isOpen) return null;

  // Tag add handler with multiple validation steps
  const handleAddTag = () => {
    const trimmed = tagInput.trim();

    // Step 1: Check if tag is empty
    if (!trimmed) {
      setErrors({ ...errors, tag: 'Tag cannot be empty' });
      return;
    }

    // Step 2: Check tag count limit
    if (bookmarkForm.tags.length >= MAX_TAGS_PER_BOOKMARK) {
      setErrors({ ...errors, tag: `Maximum ${MAX_TAGS_PER_BOOKMARK} tags allowed` });
      return;
    }

    // Step 3: Sanitize tag
    const tagResult = TextSanitizer.sanitizeTag(trimmed);

    if (!tagResult.isValid) {
      setErrors({ ...errors, tag: tagResult.error });
      return;
    }

    // Step 4: Prevent duplicate tags
    if (bookmarkForm.tags.includes(tagResult.sanitized)) {
      setErrors({ ...errors, tag: 'Tag already exists' });
      return;
    }

    // Step 5: Check for malicious content
    if (containsMaliciousContent(tagResult.sanitized)) {
      setErrors({ ...errors, tag: 'Potentially malicious content detected' });
      return;
    }

    // All checks passed, add tag
    onFormChange({ tags: [...bookmarkForm.tags, tagResult.sanitized] });
    setTagInput('');
    setErrors({ ...errors, tag: null });
  };

  // Save handler with full validation
  const handleSaveBookmark = () => {
    const validationErrors = {};

    // Validate title
    const titleResult = TextSanitizer.sanitizeTitle(bookmarkForm.title);
    if (!titleResult.isValid) {
      validationErrors.title = titleResult.error;
    }

    // Validate URL
    const urlResult = URLValidator.validate(bookmarkForm.url);
    if (!urlResult.isValid) {
      validationErrors.url = urlResult.error;
    }

    // Validate tag count
    if (bookmarkForm.tags.length > MAX_TAGS_PER_BOOKMARK) {
      validationErrors.tags = `Too many tags (max ${MAX_TAGS_PER_BOOKMARK})`;
    }

    // If there are any errors, do not proceed
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // All validations passed, save sanitized bookmark
    const sanitizedBookmark = {
      title: titleResult.sanitized,
      url: urlResult.sanitized,
      tags: bookmarkForm.tags.map(tag => {
        const result = TextSanitizer.sanitizeTag(tag);
        return result.isValid ? result.sanitized : null;
      }).filter(Boolean)
    };

    onSave(sanitizedBookmark);
    setErrors({});
  };

  const handleRemoveTag = (tag) => {
    onFormChange({ tags: bookmarkForm.tags.filter(t => t !== tag) });
  };

  const handleTagColorSelect = (colorName) => {
    const updatedTagColors = { ...settings.tagColors, [selectedTagForColor]: colorName };
    updateSettings({ tagColors: updatedTagColors });
    setSelectedTagForColor(null);
  };

  // Checks for suspicious or dangerous content in a string
  const containsMaliciousContent = (text) => {
    const dangerous = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\(/i,
      /__proto__/i,
      /constructor/i,
      /prototype/i
    ];
    return dangerous.some(pattern => pattern.test(text));
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
        padding: '24px',
        width: '90%',
        maxWidth: '500px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        maxHeight: '90vh',
        overflowY: 'auto'
      }
    },
      // Modal header
      h('h3', {
        style: {
          margin: '0 0 16px',
          fontSize: 'var(--font-2xl)',
          fontWeight: 600,
          color: theme.text
        }
      }, editingBookmark ? t.editBookmark : t.newBookmark),

      // Category selector (always visible)
      h('div', {
        style: { marginBottom: '12px' }
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
          value: categoryId,
          onChange: (e) => onCategoryChange(Number(e.target.value)),
          style: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            cursor: 'pointer',
            outline: 'none'
          }
        },
          categories.map(cat =>
            h('option', { key: cat.id, value: cat.id }, cat.name)
          )
        )
      ),

      // Title input with error feedback
      h('div', { style: { marginBottom: '12px' } },
        h('input', {
          type: 'text',
          placeholder: t.bookmarkTitle,
          value: bookmarkForm.title,
          onChange: (e) => {
            onFormChange({ title: e.target.value });
            if (errors.title) {
              setErrors({ ...errors, title: null });
            }
          },
          maxLength: 200,
          style: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${errors.title ? '#f85149' : theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none',
            boxSizing: 'border-box'
          }
        }),
        errors.title && h('div', {
          style: {
            marginTop: '4px',
            fontSize: 'var(--font-sm)',
            color: '#f85149',
            wordWrap: 'break-word'
          }
        }, `⚠️ ${errors.title}`)
      ),

      // URL input with error feedback
      h('div', { style: { marginBottom: '12px' } },
        h('input', {
          type: 'text',
          placeholder: t.url,
          value: bookmarkForm.url,
          onChange: (e) => {
            onFormChange({ url: e.target.value });
            if (errors.url) {
              setErrors({ ...errors, url: null });
            }
          },
          maxLength: 2048, // Hard character limit for URL
          style: {
            width: '100%',
            padding: '12px',
            border: `1px solid ${errors.url ? '#f85149' : theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none',
            boxSizing: 'border-box'
          }
        }),
        errors.url && h('div', {
          style: {
            marginTop: '4px',
            fontSize: 'var(--font-sm)',
            color: '#f85149',
            wordWrap: 'break-word'
          }
        }, `⚠️ ${errors.url}`)
      ),

      // Tags section
      h('div', { style: { marginBottom: '16px' } },
        h('label', {
          style: {
            display: 'block',
            marginBottom: '8px',
            fontSize: 'var(--font-base)',
            color: theme.textSecondary
          }
        }, t.tags),

        // Display current tags
        h('div', {
          style: {
            display: 'flex',
            gap: '6px',
            marginBottom: '8px',
            flexWrap: 'wrap'
          }
        },
          bookmarkForm.tags.map(tag => {
            const color = getTagColor(tag, settings, config);
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

        // Tag color picker
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
                onClick: () => handleTagColorSelect(color.name),
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

        // Tag input and add button with error feedback
        bookmarkForm.tags.length < MAX_TAGS_PER_BOOKMARK &&
        h('div', { style: { marginBottom: '8px' } },
          h('div', { style: { display: 'flex', gap: '8px' } },
            h('input', {
              type: 'text',
              placeholder: t.addTag,
              value: tagInput,
              onChange: (e) => {
                setTagInput(e.target.value);
                if (errors.tag) {
                  setErrors({ ...errors, tag: null });
                }
              },
              onKeyDown: (e) => e.key === 'Enter' && handleAddTag(),
              maxLength: 30, // Hard character limit for tag
              style: {
                flex: 1,
                padding: '8px 12px',
                border: `1px solid ${errors.tag ? '#f85149' : theme.border}`,
                borderRadius: '6px',
                backgroundColor: theme.cardHover,
                color: theme.text,
                fontSize: 'var(--font-base)',
                outline: 'none',
                boxSizing: 'border-box',
                minWidth: 0
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
                fontSize: 'var(--font-base)',
                flexShrink: 0
              }
            }, '+')
          ),
          errors.tag && h('div', {
            style: {
              marginTop: '4px',
              fontSize: 'var(--font-sm)',
              color: '#f85149',
              wordWrap: 'break-word'
            }
          }, `⚠️ ${errors.tag}`)
        )
      ),

      // Modal action buttons
      h('div', { style: { display: 'flex', gap: '8px' } },
        h('button', {
          onClick: onClose,
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
          onClick: handleSaveBookmark,
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
  );
}