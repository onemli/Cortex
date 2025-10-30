/**
 * Cortex - Icon Component
 * Font Awesome icon renderer with theme and style support
 * Icon.js
 * @version 2.1.0
 * @license GNU GPL-3.0
 * @description Renders Font Awesome icons with dynamic theming and user-selectable styles
 * @author Kerem Can ONEMLI
 */

const { createElement: h } = React;

/**
 * Icon name mapping - converts our simple names to Font Awesome icon names
 * Note: Style prefix (fa-solid, fa-regular, etc.) is applied dynamically based on settings
 */
const ICON_NAMES = {
  // Settings & Actions
  'cog': 'gear',
  'gear': 'gear',
  'settings': 'gear',
  'times': 'xmark',
  'xmark': 'xmark',
  'close': 'xmark',
  'check': 'check',
  'plus': 'plus',
  'minus': 'minus',

  // Navigation
  'chevron-up': 'chevron-up',
  'chevron-down': 'chevron-down',
  'chevron-left': 'chevron-left',
  'chevron-right': 'chevron-right',
  'arrow-up': 'arrow-up',
  'arrow-down': 'arrow-down',

  // Visibility
  'eye': 'eye',
  'eye-slash': 'eye-slash',

  // Edit & Delete
  'edit': 'pen',
  'pencil': 'pencil',
  'pen': 'pen',
  'trash': 'trash',
  'trash-alt': 'trash-can',

  // Files & Data
  'download': 'download',
  'upload': 'upload',
  'save': 'floppy-disk',
  'folder': 'folder',
  'file': 'file',
  'database': 'database',
  'copy': 'copy',

  // Bookmarks & Tags
  'bookmark': 'bookmark',
  'tag': 'tag',
  'tags': 'tags',

  // Theme & Appearance
  'palette': 'palette',
  'moon': 'moon',
  'sun': 'sun',
  'paintbrush': 'paintbrush',

  // Alerts & Info
  'exclamation-triangle': 'triangle-exclamation',
  'exclamation-circle': 'circle-exclamation',
  'info-circle': 'circle-info',
  'lightbulb': 'lightbulb',

  // Sync & Refresh
  'sync-alt': 'arrows-rotate',
  'refresh': 'arrows-rotate',
  'rotate': 'rotate',

  // UI Elements
  'expand': 'up-right-and-down-left-from-center',
  'square': 'square',
  'inbox': 'inbox',
  'book': 'book',

  // Misc
  'search': 'magnifying-glass',
  'filter': 'filter',
  'sort': 'sort'
};

/**
 * Brand icons - these always use fa-brands regardless of style setting
 */
const BRAND_ICONS = {
  'chrome': 'chrome',
  'firefox': 'firefox-browser',
  'github': 'github',
  'google': 'google',
  'apple': 'apple',
  'microsoft': 'microsoft'
};

/**
 * Icon Component
 * @param {string} name - Icon name (e.g., 'cog', 'trash', 'github')
 * @param {object} theme - Current theme object for dynamic coloring
 * @param {object} settings - Settings object containing iconStyle preference
 * @param {number} size - Icon size in pixels (default: 18)
 * @param {object} style - Additional inline styles
 * @param {string} className - Additional CSS classes
 */
export function Icon({
  name,
  theme,
  settings = null,
  size = 18,
  style = {},
  className = ''
}) {
  // Check if this is a brand icon
  const isBrandIcon = BRAND_ICONS.hasOwnProperty(name);

  // Get the actual Font Awesome icon name
  const iconName = isBrandIcon
    ? BRAND_ICONS[name]
    : (ICON_NAMES[name] || name);

  // Determine icon style class
  let iconStyleClass;
  if (isBrandIcon) {
    // Brand icons always use fa-brands
    iconStyleClass = 'fa-brands';
  } else if (settings?.iconStyle) {
    // Use user's selected icon style from settings
    const { ICON_STYLES } = window.CortexConstants || {};
    if (ICON_STYLES && ICON_STYLES[settings.iconStyle]) {
      iconStyleClass = ICON_STYLES[settings.iconStyle].class;
    } else {
      iconStyleClass = 'fa-solid'; // fallback
    }
  } else {
    // Default to solid if no settings
    iconStyleClass = 'fa-solid';
  }

  // Build full Font Awesome class
  const iconClass = `${iconStyleClass} fa-${iconName}`;

  // Determine color based on theme
  const color = theme
    ? (theme.type === 'dark'
      ? (theme.logoColor || theme.text || '#ffffff')
      : (theme.text || '#000000'))
    : 'currentColor';

  return h('i', {
    className: `${iconClass} ${className}`.trim(),
    style: {
      fontSize: `${size}px`,
      color: color,
      lineHeight: 1,
      display: 'inline-block',
      verticalAlign: 'middle',
      ...style
    },
    'aria-hidden': 'true'
  });
}