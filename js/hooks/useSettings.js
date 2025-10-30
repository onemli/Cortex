/**
 * Cortex - useSettings Hook
 * useSettings.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Custom React hook for managing application settings with persistent storage
 * @author Kerem Can ONEMLI
 * 
 */
import { Storage } from '../utils/storage.js';

const { useState, useEffect } = React;

export function useSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load settings on mount **Async**
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const loadedSettings = await Storage.loadSettings(); // await
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Save settings when changed **Async**
  useEffect(() => {
    async function saveData() {
      if (settings && !loading) {
        try {
          await Storage.saveSettings(settings); // await
        } catch (error) {
          console.error('Failed to save settings:', error);
        }
      }
    }
    saveData();
  }, [settings, loading]);

  const updateSettings = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  return {
    settings,
    setSettings,
    updateSettings,
    loading // loading state
  };
}