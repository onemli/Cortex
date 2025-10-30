/**
 * Cortex - ConfirmDialog Component
 * ConfirmDialog.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Reusable confirmation dialog for critical user actions with optional text confirmation
 * @author Kerem Can ONEMLI
 */

const { useState, createElement: h } = React;

export function ConfirmDialog({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  theme,
  settings,
  requireConfirmation,
  confirmationText = "DELETE"
}) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const isConfirmDisabled = requireConfirmation && inputValue !== confirmationText;

  const handleConfirm = () => {
    if (!isConfirmDisabled) {
      onConfirm();
      setInputValue('');
    }
  };

  const handleCancel = () => {
    onCancel();
    setInputValue('');
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
      zIndex: 10000,
      animation: 'fadeIn 0.2s ease'
    },
    onClick: handleCancel
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
      },
      onClick: (e) => e.stopPropagation()
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
          lineHeight: '1.5',
          whiteSpace: 'pre-line'
        }
      }, message),

      // Input field (if requireConfirmation is true)
      requireConfirmation && h('div', {
        style: {
          marginBottom: '20px'
        }
      },
        h('label', {
          style: {
            display: 'block',
            marginBottom: '8px',
            fontSize: 'var(--font-sm)',
            color: theme.textSecondary,
            fontWeight: 500
          }
        }, `Type "${confirmationText}" to confirm:`),

        h('input', {
          type: 'text',
          value: inputValue,
          onChange: (e) => setInputValue(e.target.value),
          onKeyDown: (e) => {
            if (e.key === 'Enter' && !isConfirmDisabled) {
              handleConfirm();
            }
            if (e.key === 'Escape') {
              handleCancel();
            }
          },
          placeholder: confirmationText,
          autoFocus: true,
          style: {
            width: '100%',
            padding: '10px 12px',
            border: `1px solid ${inputValue === confirmationText ? '#238636' : theme.border}`,
            borderRadius: '6px',
            backgroundColor: theme.cardHover,
            color: theme.text,
            fontSize: 'var(--font-md)',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'monospace',
            letterSpacing: '1px'
          }
        })
      ),

      h('div', {
        style: {
          display: 'flex',
          gap: '10px',
          justifyContent: 'flex-end'
        }
      },
        h('button', {
          onClick: handleCancel,
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
          onClick: handleConfirm,
          disabled: isConfirmDisabled,
          style: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '6px',
            backgroundColor: isConfirmDisabled ? theme.borderHover : theme.accent,
            color: '#fff',
            cursor: isConfirmDisabled ? 'not-allowed' : 'pointer',
            fontSize: 'var(--font-md)',
            fontWeight: 500,
            opacity: isConfirmDisabled ? 0.5 : 1
          }
        }, confirmText)
      )
    )
  );
}