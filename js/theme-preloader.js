/**
 * Cortex - Theme Pre-loader
 * theme-preloader.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Loads theme BEFORE React to prevent flash
 * @author Kerem Can ONEMLI
 */

(async function () {
  'use strict';

  try {
    // Browser API - Cross-browser compatibility
    const browserAPI = (typeof browser !== 'undefined' && browser.runtime)
      ? browser
      : (typeof chrome !== 'undefined' && chrome.runtime)
        ? chrome
        : null;

    if (!browserAPI) {
      console.warn('Browser API not available');
      return;
    }

    // 1. Retrieve user settings from localStorage
    const settings = JSON.parse(localStorage.getItem('cortex_settings') || '{}');
    const themeName = settings.theme || 'cortex-dark';

    // 2. Fetch themes.json from extension files
    const themesUrl = browserAPI.runtime.getURL('config/themes.json');
    const response = await fetch(themesUrl);
    const themesData = await response.json();

    // 3. Search in preset themes
    let theme = null;

    // Search in presets
    if (themesData.presets && themesData.presets[themeName]) {
      theme = themesData.presets[themeName];
    }

    // 4. Bulamazsa custom temalardan ara (localStorage/chrome.storage)
    if (!theme) {
      // Önce localStorage'dan dene (sync)
      try {
        const userThemesData = localStorage.getItem('userThemes');
        if (userThemesData) {
          const userThemes = JSON.parse(userThemesData);
          if (Array.isArray(userThemes)) {
            const customTheme = userThemes.find(t =>
              t.name && t.name.toLowerCase().replace(/ /g, '-') === themeName
            );
            if (customTheme && customTheme.bg) {
              theme = customTheme;
            }
          }
        }
      } catch (e) {
        console.warn('localStorage custom theme error:', e);
      }

      // If still not found, try chrome.storage (async)
      if (!theme && browserAPI.storage) {
        try {
          const result = await browserAPI.storage.local.get(['userThemes']);
          const userThemes = result.userThemes || [];
          if (Array.isArray(userThemes)) {
            const customTheme = userThemes.find(t =>
              t.name && t.name.toLowerCase().replace(/ /g, '-') === themeName
            );
            if (customTheme && customTheme.bg) {
              theme = customTheme;
            }
          }
        } catch (e) {
          console.warn('chrome.storage custom theme error:', e);
        }
      }
    }

    // 5. Fallback to cortex-dark
    if (!theme) {
      theme = themesData.presets['cortex-dark'] || {
        bg: '#0f1014',
        bgSecondary: '#0d0e12',
        card: '#111317',
        cardHover: '#21242b',
        border: '#1e2027',
        borderHover: '#24262e',
        text: '#b1b1b1',
        textSecondary: '#6c7187',
        accent: '#d7a156'
      };
    }

    // 6. Apply theme CSS variables
    const root = document.documentElement;
    const body = document.body;

    const props = {
      '--bg': theme.bg,
      '--bg-secondary': theme.bgSecondary,
      '--card': theme.card,
      '--card-hover': theme.cardHover || theme.card,
      '--border': theme.border,
      '--border-hover': theme.borderHover || theme.border,
      '--text': theme.text,
      '--text-secondary': theme.textSecondary || theme.text,
      '--accent': theme.accent
    };

    // Apply to :root
    Object.entries(props).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value);
      }
    });

    // Apply to html and body (double insurance)
    root.style.backgroundColor = theme.bg;
    root.style.color = theme.text;
    body.style.backgroundColor = theme.bg;
    body.style.color = theme.text;

    // 7. Font preferences (if exist)
    if (settings.fontFamily) {
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

      const fontFamily = fontFamilies[settings.fontFamily] || fontFamilies.system;
      body.style.fontFamily = fontFamily;
    }

    // 8. Font size scale (if exist)
    if (settings.fontSize) {
      const scales = {
        small: 0.9,
        medium: 1.0,
        large: 1.15,
        xlarge: 1.3
      };

      const scale = scales[settings.fontSize] || 1.0;
      root.style.setProperty('--font-scale', scale.toString());

      // Set base font sizes
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
        root.style.setProperty(key, `${size * scale}px`);
      });
    }

    console.log('✅ Theme pre-loaded:', themeName, theme.name || '(unnamed)');

  } catch (e) {
    // Silent catch with warning
    console.error('❌ Theme pre-loader error:', e);

    // Emergency fallback
    const root = document.documentElement;
    root.style.backgroundColor = '#0f1014';
    root.style.color = '#b1b1b1';
    document.body.style.backgroundColor = '#0f1014';
    document.body.style.color = '#b1b1b1';
  }
})();