/**
 * Cortex - Theme Utilities
 * theme.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Utilities for managing and applying themes with user-defined options
 * @author Kerem Can ONEMLI
 */

import { FONT_FAMILIES, FONT_SIZE_SCALES } from '../constants/index.js';

/**
 * Get current theme based on settings
 */
export function getCurrentTheme(config, settings, userThemes) {
  if (!config || !settings) return {};

  const allThemes = {
    ...config.themes.presets,
    ...userThemes.reduce((acc, theme) => {
      acc[theme.name.toLowerCase().replace(/ /g, '-')] = theme;
      return acc;
    }, {})
  };

  return allThemes[settings.theme] || config.themes.presets['cortex-dark'];
}

/**
 * Apply theme to document
 */
export function applyTheme(theme, settings) {
  if (!theme || !settings) return;

  // Transition'ı geçici olarak devre dışı bırak
  document.documentElement.style.transition = 'none';

  // CSS custom properties
  const properties = {
    '--bg': theme.bg,
    '--bg-secondary': theme.bgSecondary,
    '--card': theme.card,
    '--card-hover': theme.cardHover,
    '--border': theme.border,
    '--border-hover': theme.borderHover,
    '--text': theme.text,
    '--text-secondary': theme.textSecondary,
    '--accent': theme.accent
  };

  Object.entries(properties).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });

  // Body'ye de uygula
  document.body.style.backgroundColor = theme.bg;
  document.body.style.color = theme.text;

  // Apply font family
  const fontFamily = FONT_FAMILIES[settings.fontFamily] || FONT_FAMILIES.system;
  document.body.style.fontFamily = fontFamily;
  document.documentElement.style.fontFamily = fontFamily;

  // Apply font size scale
  const scale = FONT_SIZE_SCALES[settings.fontSize] || 1.0;
  applyFontScale(scale);

  // Force reflow (tarayıcıyı repaint'e zorla)
  void document.documentElement.offsetHeight;

  // Transition'ı geri aç (sonraki değişiklikler için)
  requestAnimationFrame(() => {
    document.documentElement.style.transition = '';
  });
}

/**
 * Apply font scale to CSS variables
 */
function applyFontScale(scale) {
  document.documentElement.style.setProperty('--font-scale', scale);

  const baseSizes = {
    '--font-xs': 10,
    '--font-sm': 11,
    '--font-base': 13,
    '--font-md': 14,
    '--font-lg': 15,
    '--font-xl': 16,
    '--font-2xl': 18,
    '--font-3xl': 20
  };

  Object.entries(baseSizes).forEach(([key, size]) => {
    document.documentElement.style.setProperty(key, `${size * scale}px`);
  });
}

/**
 * Get tag color based on settings and config
 */
export function getTagColor(tag, settings, config) {
  if (settings.tagColors[tag]) {
    return config.themes.tagColors.find(c => c.name === settings.tagColors[tag])
      || config.themes.tagColors[0];
  }

  // Hash-based color selection
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return config.themes.tagColors[hash % config.themes.tagColors.length];
}

/**
 * Export custom themes
 */
export function exportThemes(userThemes) {
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
  URL.revokeObjectURL(url);
}

/**
 * Import custom themes
 */
export async function importThemes(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const importedThemes = JSON.parse(event.target.result);

        if (!Array.isArray(importedThemes)) {
          throw new Error('Invalid format');
        }

        const validThemes = importedThemes.filter(theme => isValidTheme(theme));

        if (validThemes.length === 0) {
          throw new Error('No valid themes found');
        }

        resolve(validThemes);
      } catch (error) {
        reject(new Error('Invalid file format for custom themes.'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Validate theme structure
 */
function isValidTheme(theme) {
  const required = ['name', 'type', 'bg', 'bgSecondary', 'card', 'cardHover',
    'border', 'borderHover', 'text', 'textSecondary', 'accent'];

  const hasAllFields = required.every(k =>
    typeof theme[k] === 'string' && theme[k].startsWith('#')
  );

  const validType = ['light', 'dark'].includes(theme.type);

  return hasAllFields && validType;
}