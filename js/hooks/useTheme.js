/**
 * Cortex - useTheme Hook
 * useTheme.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Custom React hook for managing and applying themes with user-defined options
 * @author Kerem Can ONEMLI
 */

import { getCurrentTheme, applyTheme } from '../utils/theme.js';

const { useState, useEffect } = React;

export function useTheme(config, settings) {
  const [userThemes, setUserThemes] = useState([]);
  const [theme, setTheme] = useState(null); // ❌ {} yerine null
  const [isReady, setIsReady] = useState(false);

  // Load user themes from storage
  useEffect(() => {
    async function loadUserThemes() {
      if (!config) return;

      const { Storage } = await import('../utils/storage.js');
      const themes = await Storage.loadUserThemes();
      setUserThemes(themes);
    }

    loadUserThemes();
  }, [config]);

  // Calculate current theme
  useEffect(() => {
    if (!config || !settings) return;

    const currentTheme = getCurrentTheme(config, settings, userThemes);
    setTheme(currentTheme);
    setIsReady(true);
  }, [config, settings, userThemes]);

  // Apply theme to document (ama sadece değişiklik varsa)
  useEffect(() => {
    if (!settings || !theme || !theme.bg || !isReady) return;

    // ⚡ OPTIMIZATION: Sadece tema değişirse uygula
    applyTheme(theme, settings);
  }, [theme, settings, isReady]);

  return {
    theme,
    userThemes,
    setUserThemes,
    isReady
  };
}