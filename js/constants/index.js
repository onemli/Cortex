/**
 * Cortex - Application Constants
 * index.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Centralized constants for Cortex Application
 * @author Kerem Can ONEMLI
 * 
 */

export const APP_VERSION = '1.1.0';

export const STORAGE_KEYS = {
  CATEGORIES: 'cortex_categories',
  SETTINGS: 'cortex_settings',
  USER_THEMES: 'userThemes',
  PENDING_BOOKMARK: 'pendingBookmark'
};

export const DEFAULT_CATEGORY = {
  id: 1,
  name: 'General',
  bookmarks: []
};

export const DEFAULT_SETTINGS = {
  gridColumns: 3,
  language: 'en',
  theme: 'cortex-dark',
  fontFamily: 'system',
  fontSize: 'medium',
  iconStyle: 'solid',
  openInNewTab: true,
  tagColors: {},
  hoverEffect: 'border',
  cardLayout: 'horizontal',
};

export const ICON_STYLES = {
  solid: {
    label: 'Solid',
    class: 'fa-solid',
    description: 'Bold and filled icons'
  },
  regular: {
    label: 'Regular',
    class: 'fa-regular',
    description: 'Balanced line weight icons'
  },
};

export const FONT_FAMILIES = {
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

export const FONT_SIZE_SCALES = {
  small: 0.9,
  medium: 1.0,
  large: 1.15,
  xlarge: 1.3
};

export const MAX_TAGS_PER_BOOKMARK = 7;
export const PENDING_BOOKMARK_TIMEOUT = 5000; // 5 seconds

export const BLOCKED_URLS = [
  'chrome://',
  'about:',
  'edge://',
  'moz-extension://'
];