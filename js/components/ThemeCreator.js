/** 
 * Cortex - ThemeCreator Component
 * ThemeCreator.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Modal for creating and editing custom Themes with full element control
 * @author Kerem Can ONEMLI
 */

import { Icon } from './Icon.js';

const { useState, createElement: h } = React;

export function ThemeCreator({
  isOpen,
  themeForm,
  isEditing,
  theme,
  settings,
  onFormChange,
  onSave,
  onClose,
  t
}) {
  if (!isOpen || !themeForm) return null;

  const [activeColorIndex, setActiveColorIndex] = useState(null);

  const colorFields = [
    {
      key: 'bg',
      label: 'Background',
      description: 'Main background color - the overall page background'
    },
    {
      key: 'bgSecondary',
      label: 'Secondary Background',
      description: 'Secondary background - header and section backgrounds'
    },
    {
      key: 'card',
      label: 'Card Background',
      description: 'Card background - bookmark and category cards'
    },
    {
      key: 'cardHover',
      label: 'Card Hover',
      description: 'Card background color when hovering'
    },
    {
      key: 'border',
      label: 'Border Color',
      description: 'Normal border lines and dividers'
    },
    {
      key: 'borderHover',
      label: 'Border Hover',
      description: 'Border color on hover state'
    },
    {
      key: 'text',
      label: 'Text Color',
      description: 'Main text color - headings and normal text'
    },
    {
      key: 'textSecondary',
      label: 'Secondary Text',
      description: 'Secondary text - helper text and labels'
    },
    {
      key: 'accent',
      label: 'Accent Color',
      description: 'Accent color - buttons, links and important elements'
    },
    {
      key: 'logoColor',
      label: 'Logo Color',
      description: 'Logo and icon color'
    }
  ];

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
      zIndex: 1000,
      padding: '20px'

    }
  },
    h('div', {
      style: {
        backgroundColor: theme.card,
        borderRadius: '12px',
        padding: 0,
        width: '100%',
        maxWidth: '900px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column'
      }
    },
      // Header
      h('div', {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px 28px',
          borderBottom: `1px solid ${theme.border}`
        }
      },
        h('h3', {
          style: {
            margin: 0,
            fontSize: 'var(--font-3xl)',
            fontWeight: 600,
            color: theme.text
          }
        }, isEditing ? 'Edit Theme' : 'Create Theme'),

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
        },
          h(Icon, { name: 'times', theme, settings, size: 24 })
        )
      ),

      // Content
      h('div', {
        style: {
          flex: 1,
          overflowY: 'auto',
          padding: '28px'
        }
      },
        // Theme Name
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '12px',
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              color: theme.text
            }
          }, 'Theme Name'),

          h('input', {
            type: 'text',
            placeholder: 'Enter theme name',
            value: themeForm.name || '',
            onChange: (e) => onFormChange({ name: e.target.value }),
            style: {
              width: '100%',
              padding: '12px',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              backgroundColor: theme.cardHover,
              color: theme.text,
              fontSize: 'var(--font-md)',
              outline: 'none',
              boxSizing: 'border-box'
            }
          })
        ),

        // Theme Type
        h('div', { style: { marginBottom: '24px' } },
          h('label', {
            style: {
              display: 'block',
              marginBottom: '12px',
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              color: theme.text
            }
          }, 'Theme Type'),

          h('div', { style: { display: 'flex', gap: '8px' } },
            h('button', {
              onClick: () => onFormChange({ type: 'dark' }),
              style: {
                flex: 1,
                padding: '12px',
                border: themeForm.type === 'dark'
                  ? `2px solid ${theme.accent}`
                  : `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: themeForm.type === 'dark'
                  ? `${theme.accent}20`
                  : theme.cardHover,
                color: themeForm.type === 'dark' ? theme.accent : theme.text,
                cursor: 'pointer',
                fontSize: 'var(--font-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }
            },
              h(Icon, { name: 'moon', theme, settings, size: 18 }),
              'Dark'
            ),

            h('button', {
              onClick: () => onFormChange({ type: 'light' }),
              style: {
                flex: 1,
                padding: '12px',
                border: themeForm.type === 'light'
                  ? `2px solid ${theme.accent}`
                  : `1px solid ${theme.border}`,
                borderRadius: '6px',
                backgroundColor: themeForm.type === 'light'
                  ? `${theme.accent}20`
                  : theme.cardHover,
                color: themeForm.type === 'light' ? theme.accent : theme.text,
                cursor: 'pointer',
                fontSize: 'var(--font-md)',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }
            },
              h(Icon, { name: 'sun', theme, settings, size: 18 }),
              'Light'
            )
          )
        ),

        // Color Fields Section Header
        h('div', {
          style: {
            marginBottom: '20px'
          }
        },
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }
          },
            h(Icon, { name: 'palette', theme, settings, size: 24 }),
            h('label', {
              style: {
                fontSize: 'var(--font-2xl)',
                fontWeight: 600,
                color: theme.text,
                margin: 0
              }
            }, 'Theme Colors')
          ),

          h('p', {
            style: {
              margin: '8px 0 0',
              fontSize: 'var(--font-md)',
              color: theme.textSecondary
            }
          }, 'Click on any color field to customize. Each color controls a specific part of the interface.')
        ),

        // Color Fields Grid
        h('div', {
          style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '12px',
            marginBottom: '24px'
          }
        },
          colorFields.map((field, idx) =>
            h('div', {
              key: field.key,
              style: {
                padding: '14px',
                backgroundColor: theme.cardHover,
                borderRadius: '8px',
                border: `1px solid ${activeColorIndex === idx ? theme.accent : theme.border}`,
                transition: 'all 0.2s'
              }
            },
              h('div', {
                style: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '12px'
                }
              },
                h('label', {
                  style: {
                    fontSize: 'var(--font-md)',
                    fontWeight: 600,
                    color: theme.text,
                    margin: 0
                  }
                }, field.label),

                h('button', {
                  onClick: () => setActiveColorIndex(activeColorIndex === idx ? null : idx),
                  title: field.description,
                  style: {
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    border: `2px solid ${theme.accent}`,
                    backgroundColor: 'transparent',
                    color: theme.accent,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }
                },
                  h(Icon, { name: 'info-circle', theme, settings, size: 14 })
                )
              ),

              h('div', {
                style: {
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center'
                }
              },
                h('input', {
                  type: 'color',
                  value: themeForm[field.key] || '#000000',
                  onChange: (e) => onFormChange({ [field.key]: e.target.value }),
                  style: {
                    width: '50px',
                    height: '44px',
                    border: `2px solid ${theme.border}`,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    padding: '3px'
                  }
                }),

                h('div', {
                  style: {
                    flex: 1,
                    fontSize: 'var(--font-sm)',
                    color: theme.textSecondary,
                    wordWrap: 'break-word'
                  }
                }, themeForm[field.key] || '#000000')
              ),

              activeColorIndex === idx && h('div', {
                style: {
                  marginTop: '12px',
                  padding: '10px',
                  backgroundColor: theme.card,
                  borderRadius: '6px',
                  border: `1px solid ${theme.border}`,
                  fontSize: 'var(--font-sm)',
                  color: theme.text,
                  lineHeight: '1.5'
                }
              },
                h('div', {
                  style: {
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }
                },
                  h(Icon, { name: 'lightbulb', theme, settings, size: 14 }),
                  field.description
                )
              )
            )
          )
        ),

        // Color Legend / Guide
        h('div', {
          style: {
            padding: '16px',
            backgroundColor: theme.cardHover,
            borderRadius: '8px',
            border: `1px solid ${theme.border}`,
            marginBottom: '24px'
          }
        },
          h('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '12px'
            }
          },
            h(Icon, { name: 'book', theme, settings, size: 18 }),
            h('h4', {
              style: {
                margin: 0,
                fontSize: 'var(--font-lg)',
                fontWeight: 600,
                color: theme.text
              }
            }, 'Color Usage Guide')
          ),

          h('div', {
            style: {
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              fontSize: 'var(--font-sm)',
              color: theme.textSecondary
            }
          },
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Background: Main page background'
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Secondary BG: Headers and sections'
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Card: Bookmark containers'
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Borders: Lines and dividers'
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Text: All text and headings'
            ),
            h('div', {
              style: {
                display: 'flex',
                gap: '8px',
                alignItems: 'flex-start'
              }
            },
              h(Icon, { name: 'square', theme, settings, size: 14 }),
              'Accent: Buttons and highlights'
            )
          )
        ),

        // Contrast Info
        h('div', {
          style: {
            padding: '12px',
            backgroundColor: `${theme.accent}15`,
            border: `1px solid ${theme.accent}30`,
            borderRadius: '8px',
            marginBottom: '0',
            fontSize: 'var(--font-sm)',
            color: theme.text,
            display: 'flex',
            gap: '12px',
            alignItems: 'flex-start'
          }
        },
          h(Icon, { name: 'exclamation-circle', theme, settings, size: 16 }),
          h('div', null,
            h('div', {
              style: {
                fontWeight: 600,
                marginBottom: '6px'
              }
            }, 'Contrast Tip:'),
            'Ensure text color has sufficient contrast with background color for better readability. Light text on dark backgrounds and vice versa.'
          )
        )
      ),

      // Action Buttons
      h('div', {
        style: {
          display: 'flex',
          gap: '12px',
          padding: '20px 28px',
          borderTop: `1px solid ${theme.border}`,
          backgroundColor: theme.bgSecondary
        }
      },
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
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        },
          h(Icon, { name: 'times', theme, settings, size: 16 }),
          'Cancel'
        ),

        h('button', {
          onClick: onSave,
          disabled: !themeForm.name || !themeForm.name.trim(),
          style: {
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: themeForm.name?.trim() ? theme.accent : theme.borderHover,
            color: '#fff',
            cursor: themeForm.name?.trim() ? 'pointer' : 'not-allowed',
            fontSize: 'var(--font-md)',
            fontWeight: 500,
            opacity: themeForm.name?.trim() ? 1 : 0.6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }
        },
          h(Icon, { name: isEditing ? 'save' : 'plus', theme, settings, size: 16 }),
          isEditing ? 'Update Theme' : 'Create Theme'
        )
      )
    )
  );
}