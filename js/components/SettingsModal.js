/**
 * Cortex - SettingsModal Component
 * Main settings interface with tabs
 * SettingsModal.js
 * @version 1.2.0
 * @license GNU GPL-3.0
 * @description Comprehensive settings modal with tabs and integrated management
 * @author Kerem Can ONEMLI
 */

import { Icon } from './Icon.js';
import { Storage } from '../utils/storage.js';
import { exportThemes, importThemes } from '../utils/theme.js';
import { syncBrowserBookmarks } from '../utils/browser.js';
import { getTagColor } from '../utils/theme.js';
import { TextSanitizer } from '../utils/validation.js';


const { useRef, useState, createElement: h } = React;

export function SettingsModal({
    isOpen,
    settings,
    config,
    theme,
    userThemes,
    categories,
    onClose,
    onSettingsChange,
    onCategoriesChange,
    onUserThemesChange,
    onOpenThemeCreator,
    onEditTheme,
    getAllTags,
    onDeleteTag,
    onSetTagColor,
    onDeleteCategory,
    onAddCategory,
    onRenameCategory,
    onConfirm,
    t
}) {
    const fileInputRef = useRef(null);
    const themeInputRef = useRef(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [selectedTagForColor, setSelectedTagForColor] = useState(null);
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategoryName, setEditingCategoryName] = useState('');
    const [editingTagName, setEditingTagName] = useState(null);
    const [editingTagNewName, setEditingTagNewName] = useState('');
    const [editingTagError, setEditingTagError] = useState('');
    const [deletingDuplicates, setDeletingDuplicates] = useState(false);
    const [selectedTag, setSelectedTag] = useState(null);
    if (!isOpen) return null;

    // Tab definitions with dynamic labels
    const tabs = [
        { id: 'general', label: t.general || 'General', icon: 'cog' },
        { id: 'appearance', label: t.appearance || 'Appearance', icon: 'palette' },
        { id: 'tags', label: t.tags || 'Tags', icon: 'tag' },
        { id: 'categories', label: t.categories || 'Categories', icon: 'folder' },
        { id: 'data', label: t.data || 'Data', icon: 'database' }
    ];
    // Remove Duplicates Handler
    const handleRemoveDuplicates = () => {
        const totalBefore = categories.reduce((sum, cat) => sum + cat.bookmarks.length, 0);

        //  Collect all bookmarks and check the URL's
        const seenUrls = new Set();
        const updatedCategories = categories.map(cat => ({
            ...cat,
            bookmarks: cat.bookmarks.filter(bookmark => {
                const url = bookmark.url.toLowerCase().trim();
                if (seenUrls.has(url)) {
                    return false; // Duplicate bookmark remove
                }
                seenUrls.add(url);
                return true; // New bookmark keep
            })
        })).filter(cat => cat.bookmarks.length > 0); // Remove empty categories

        const totalAfter = updatedCategories.reduce((sum, cat) => sum + cat.bookmarks.length, 0);
        const duplicatesRemoved = totalBefore - totalAfter;

        if (duplicatesRemoved === 0) {
            alert('✅ No duplicates found! All your bookmarks are unique.');
            return;
        }

        onCategoriesChange(updatedCategories);
        alert(`✅ Cleanup complete!\n\n📊 Results:\n• Duplicates removed: ${duplicatesRemoved}\n• Bookmarks remaining: ${totalAfter}`);
    };

    // Delete All Data Handler - Uses ConfirmDialog with text confirmation
    const handleDeleteAllData = () => {
        const totalBookmarks = categories.reduce((sum, cat) => sum + cat.bookmarks.length, 0);
        const totalCategories = categories.length;

        if (totalBookmarks === 0 && totalCategories === 0) {
            alert('ℹ️ No data to delete.');
            return;
        }

        onConfirm({
            title: '💀 Delete All Data',
            message: `⚠️ WARNING: You are about to delete EVERYTHING!\n\n• ${totalBookmarks} bookmark(s)\n• ${totalCategories} categor${totalCategories !== 1 ? 'ies' : 'y'}\n\nThis action CANNOT be undone.`,
            confirmText: 'Delete Everything',
            requireConfirmation: true,
            confirmationText: 'DELETE',
            onConfirm: async () => {
                // remove all data from storage
                await Storage.clearAllData();

                // Update state
                onCategoriesChange([]);

                // Modal'ı kapat
                onClose();
            }
        });
    };
    const handleExport = () => {
        Storage.exportData(categories, settings);
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const data = await Storage.importData(file);
            if (data.categories) onCategoriesChange(data.categories);
            if (data.settings) onSettingsChange(data.settings);
        } catch (error) {
            alert(error.message);
        }
    };

    const handleExportThemes = () => {
        exportThemes(userThemes);
    };

    const handleImportThemes = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const importedThemes = await importThemes(file);
            const newThemes = [...userThemes];

            importedThemes.forEach(theme => {
                const index = newThemes.findIndex(t => t.name === theme.name);
                if (index > -1) {
                    newThemes[index] = theme;
                } else {
                    newThemes.push(theme);
                }
            });

            onUserThemesChange(newThemes);
            alert('Custom themes imported successfully.');
        } catch (error) {
            alert(error.message);
        }
    };

    const handleSyncBookmarks = async () => {
        if (isSyncing) return;

        setIsSyncing(true);

        try {
            const allBookmarks = await syncBrowserBookmarks();

            if (allBookmarks.length === 0) {
                alert('No bookmarks found in browser');
                setIsSyncing(false);
                return;
            }

            const existingUrls = new Set();
            categories.forEach(cat => {
                cat.bookmarks.forEach(bm => existingUrls.add(bm.url));
            });

            const newBookmarks = allBookmarks.filter(bm => !existingUrls.has(bm.url));

            if (newBookmarks.length === 0) {
                alert('All bookmarks are already synced!');
                setIsSyncing(false);
                return;
            }

            // Unique ID generation
            let baseId = Date.now();
            let counter = 0;

            const bookmarksByCategory = {};
            newBookmarks.forEach(bm => {
                if (!bookmarksByCategory[bm.category]) {
                    bookmarksByCategory[bm.category] = [];
                }
                bookmarksByCategory[bm.category].push({
                    id: baseId + counter++,
                    title: bm.title,
                    url: bm.url,
                    tags: bm.tags
                });
            });

            const newCategories = [...categories];

            Object.keys(bookmarksByCategory).forEach(categoryName => {
                const existingCategory = newCategories.find(c => c.name === categoryName);

                if (existingCategory) {
                    existingCategory.bookmarks.push(...bookmarksByCategory[categoryName]);
                } else {
                    newCategories.push({
                        id: baseId + counter++,
                        name: categoryName,
                        bookmarks: bookmarksByCategory[categoryName]
                    });
                }
            });

            onCategoriesChange(newCategories);

            const skipped = allBookmarks.length - newBookmarks.length;
            let message = `✅ Successfully synced ${newBookmarks.length} bookmark${newBookmarks.length !== 1 ? 's' : ''}!`;

            if (skipped > 0) {
                message += `\n\n⚠️ ${skipped} duplicate bookmark${skipped !== 1 ? 's were' : ' was'} skipped.`;
            }

            alert(message);
        } catch (error) {
            console.error('Bookmark sync error:', error);
            alert('❌ Failed to sync bookmarks: ' + error.message);
        } finally {
            setIsSyncing(false);
        }
    };

    // Tag editing handler
    const handleStartEditTag = (tagName) => {
        setEditingTagName(tagName);
        setEditingTagNewName(tagName);
        setEditingTagError('');
    };

    const handleSaveEditTag = (oldTagName) => {
        const newTagName = editingTagNewName.trim().toLowerCase();
        setEditingTagError('');

        // Tag needs to be non-empty
        if (!newTagName) {
            setEditingTagError('Tag name cannot be empty');
            return;
        }

        // Tag needs to be unique
        if (newTagName === oldTagName) {
            setEditingTagName(null);
            setEditingTagNewName('');
            return;
        }

        // Duplicate tag check
        const allTags = getAllTags();
        if (allTags.includes(newTagName) && newTagName !== oldTagName) {
            setEditingTagError('This tag already exists');
            return;
        }

        // Tag sanitization
        const sanitizeResult = TextSanitizer.sanitizeTag(newTagName);
        if (!sanitizeResult.isValid) {
            setEditingTagError(sanitizeResult.error || 'Invalid tag name');
            return;
        }


        const finalTagName = sanitizeResult.sanitized;

        // Update categories with new tag name
        const updatedCategories = categories.map(cat => ({
            ...cat,
            bookmarks: cat.bookmarks.map(bookmark => ({
                ...bookmark,
                tags: bookmark.tags ? bookmark.tags.map(t => t === oldTagName ? finalTagName : t) : []
            }))
        }));

        onCategoriesChange(updatedCategories);


        const newTagColors = { ...settings.tagColors };
        if (newTagColors[oldTagName]) {
            newTagColors[finalTagName] = newTagColors[oldTagName];
            delete newTagColors[oldTagName];
            onSettingsChange({ tagColors: newTagColors });
        }


        setEditingTagName(null);
        setEditingTagNewName('');
    };

    const handleCancelEditTag = () => {
        setEditingTagName(null);
        setEditingTagNewName('');
        setEditingTagError('');
    };

    // General Tab Content
    const renderGeneralTab = () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
        // Grid Columns
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text,
                    opacity: settings.cardLayout === 'vertical' ? 0.5 : 1
                }
            }, t.gridColumns),

            h('div', { style: { display: 'flex', gap: '8px' } },
                [1, 2, 3, 4, 5].map(num =>
                    h('button', {
                        key: num,
                        onClick: () => settings.cardLayout !== 'vertical' && onSettingsChange({ gridColumns: num }),
                        disabled: settings.cardLayout === 'vertical',
                        style: {
                            flex: 1,
                            padding: '12px',
                            border: settings.gridColumns === num
                                ? `2px solid ${theme.accent}`
                                : `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            backgroundColor: settings.gridColumns === num
                                ? `${theme.accent}20`
                                : theme.cardHover,
                            color: settings.gridColumns === num ? theme.accent : theme.text,
                            cursor: settings.cardLayout === 'vertical' ? 'not-allowed' : 'pointer',
                            fontSize: 'var(--font-md)',
                            fontWeight: 600,
                            opacity: settings.cardLayout === 'vertical' ? 0.3 : 1
                        }
                    }, num)
                )
            )
        ),
        // Card Layout
        h('div', { style: { marginBottom: '20px' } },
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '8px',
                    fontSize: 'var(--font-md)',
                    fontWeight: 500,
                    color: theme.text
                }
            }, t.cardLayout || 'Card Layout'),

            h('select', {
                value: settings.cardLayout || 'horizontal',
                onChange: (e) => onSettingsChange({ cardLayout: e.target.value }),
                style: {
                    width: '100%',
                    padding: '10px',
                    backgroundColor: theme.card,
                    color: theme.text,
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    fontSize: 'var(--font-md)',
                    cursor: 'pointer'
                }
            },
                h('option', { value: 'horizontal' }, t.horizontal || 'Horizontal (Wide)'),
                h('option', { value: 'vertical' }, t.vertical || 'Vertical (Tall)')
            )
        ),
        // Language
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.language),

            h('select', {
                value: settings.language,
                onChange: (e) => onSettingsChange({ language: e.target.value }),
                style: {
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    backgroundColor: theme.cardHover,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                }
            },
                h('option', { value: 'en' }, 'English'),
                h('option', { value: 'tr' }, 'Türkçe'),
                h('option', { value: 'de' }, 'Deutsch'),
                h('option', { value: 'fr' }, 'Français'),
                h('option', { value: 'es' }, 'Español')
            )
        ),

        // Open Links In
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.openIn),

            h('div', { style: { display: 'flex', gap: '8px' } },
                h('button', {
                    onClick: () => onSettingsChange({ openInNewTab: true }),
                    style: {
                        flex: 1,
                        padding: '12px',
                        border: settings.openInNewTab
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: settings.openInNewTab
                            ? `${theme.accent}20`
                            : theme.cardHover,
                        color: settings.openInNewTab ? theme.accent : theme.text,
                        cursor: 'pointer',
                        fontSize: 'var(--font-md)',
                        fontWeight: 500
                    }
                }, t.newTab),

                h('button', {
                    onClick: () => onSettingsChange({ openInNewTab: false }),
                    style: {
                        flex: 1,
                        padding: '12px',
                        border: !settings.openInNewTab
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: !settings.openInNewTab
                            ? `${theme.accent}20`
                            : theme.cardHover,
                        color: !settings.openInNewTab ? theme.accent : theme.text,
                        cursor: 'pointer',
                        fontSize: 'var(--font-md)',
                        fontWeight: 500
                    }
                }, t.sameTab)
            )
        )
    );

    // Appearance Tab Content
    const renderAppearanceTab = () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
        // Theme Selection
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.theme),

            h('select', {
                value: settings.theme,
                onChange: (e) => onSettingsChange({ theme: e.target.value }),
                style: {
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    backgroundColor: theme.cardHover,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    cursor: 'pointer',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                }
            },
                h('optgroup', { label: 'Dark Themes' },
                    Object.values(config.themes.presets)
                        .filter(th => th.type === 'dark')
                        .map(th => h('option', {
                            key: th.name,
                            value: th.name.toLowerCase().replace(/ /g, '-')
                        }, th.name))
                ),

                h('optgroup', { label: 'Light Themes' },
                    Object.values(config.themes.presets)
                        .filter(th => th.type === 'light')
                        .map(th => h('option', {
                            key: th.name,
                            value: th.name.toLowerCase().replace(/ /g, '-')
                        }, th.name))
                ),

                userThemes.length > 0 && h('optgroup', { label: 'Custom Themes' },
                    userThemes.map(th => h('option', {
                        key: th.name,
                        value: th.name.toLowerCase().replace(/ /g, '-')
                    }, th.name))
                )
            ),

            h('div', { style: { display: 'flex', gap: '8px' } },
                h('button', {
                    onClick: onOpenThemeCreator,
                    style: {
                        flex: 1,
                        padding: '10px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: theme.cardHover,
                        color: theme.text,
                        cursor: 'pointer',
                        fontSize: 'var(--font-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }
                },
                    h(Icon, { name: 'plus', theme, settings, size: 16 }),
                    t.createTheme || 'Create Theme'
                ),

                userThemes.some(t => t.name.toLowerCase().replace(/ /g, '-') === settings.theme) &&
                h('button', {
                    onClick: onEditTheme,
                    style: {
                        flex: 1,
                        padding: '10px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: theme.accent,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 'var(--font-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }
                },
                    h(Icon, { name: 'edit', theme, settings, size: 16 }),
                    t.editTheme || 'Edit Theme'
                )
            )
        ),

        // Font Family
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.fontFamily || 'Font Family'),

            h('select', {
                value: settings.fontFamily,
                onChange: (e) => onSettingsChange({ fontFamily: e.target.value }),
                style: {
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    backgroundColor: theme.cardHover,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                }
            },
                h('option', { value: 'system' }, 'System Default'),
                h('option', { value: 'inter' }, 'Inter'),
                h('option', { value: 'roboto' }, 'Roboto'),
                h('option', { value: 'opensans' }, 'Open Sans'),
                h('option', { value: 'lato' }, 'Lato'),
                h('option', { value: 'poppins' }, 'Poppins'),
                h('option', { value: 'montserrat' }, 'Montserrat'),
                h('option', { value: 'ibmplexmono' }, 'IBM Plex Mono'),
                h('option', { value: 'cascadia' }, 'Cascadia Mono')
            )
        ),
        // Font Size
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.fontSize || 'Font Size'),

            h('div', { style: { display: 'flex', gap: '8px' } },
                [
                    { value: 'small', label: t.small || 'Small' },
                    { value: 'medium', label: t.medium || 'Medium' },
                    { value: 'large', label: t.large || 'Large' },
                    { value: 'xlarge', label: t.extraLarge || 'XL' }
                ].map((size, idx) =>
                    h('button', {
                        key: size.value,
                        onClick: () => onSettingsChange({ fontSize: size.value }),
                        style: {
                            flex: 1,
                            padding: '12px 8px',
                            border: settings.fontSize === size.value
                                ? `2px solid ${theme.accent}`
                                : `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            backgroundColor: settings.fontSize === size.value
                                ? `${theme.accent}20`
                                : theme.cardHover,
                            color: settings.fontSize === size.value ? theme.accent : theme.text,
                            cursor: 'pointer',
                            fontSize: 'var(--font-md)',
                            fontWeight: 600,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }
                    },
                        h('span', {
                            style: { fontSize: 'var(--font-lg)' }
                        }, 'A'),
                        h('span', {
                            style: { fontSize: 'var(--font-sm)', fontWeight: 500 }
                        }, size.label)
                    )
                )
            )
        ),
        // Icon Style
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.iconStyle || 'Icon Style'),

            h('select', {
                value: settings.iconStyle || 'solid',
                onChange: (e) => onSettingsChange({ iconStyle: e.target.value }),
                style: {
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '6px',
                    backgroundColor: theme.cardHover,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    cursor: 'pointer',
                    boxSizing: 'border-box'
                }
            },
                Object.entries(config.ICON_STYLES || {
                    solid: { label: 'Solid', description: 'Bold and filled icons' },
                    regular: { label: 'Regular', description: 'Balanced line weight icons' },
                }).map(([key, value]) =>
                    h('option', {
                        key,
                        value: key,
                        title: value.description
                    }, value.label)
                )
            ),

            // Icon Style Preview
            h('div', {
                style: {
                    marginTop: '12px',
                    padding: '16px',
                    backgroundColor: theme.cardHover,
                    borderRadius: '8px',
                    border: `1px solid ${theme.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    flexWrap: 'wrap'
                }
            },
                h('div', {
                    style: {
                        fontSize: 'var(--font-sm)',
                        color: theme.textSecondary,
                        width: '100%',
                        marginBottom: '8px'
                    }
                }, 'Preview:'),

                // Preview icons
                ['bookmark', 'heart', 'star', 'tag', 'cog', 'trash', 'edit', 'eye'].map(iconName =>
                    h('div', {
                        key: iconName,
                        style: {
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                        }
                    },
                        h(Icon, {
                            name: iconName,
                            theme,
                            settings,
                            size: 24
                        }),
                        h('span', {
                            style: {
                                fontSize: 'var(--font-xs)',
                                color: theme.textSecondary
                            }
                        }, iconName)
                    )
                )
            )
        ),
        // Hover Effects Selection
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, 'Bookmark Hover Effects'),

            h('div', {
                style: {
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                }
            },
                // Option 1: None
                h('label', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px',
                        backgroundColor: settings.hoverEffect === 'none'
                            ? `${theme.accent}15`
                            : theme.cardHover,
                        border: settings.hoverEffect === 'none'
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (settings.hoverEffect !== 'none') {
                            e.currentTarget.style.backgroundColor = theme.card;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (settings.hoverEffect !== 'none') {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                        }
                    }
                },
                    h('input', {
                        type: 'radio',
                        name: 'hoverEffect',
                        value: 'none',
                        checked: settings.hoverEffect === 'none',
                        onChange: (e) => onSettingsChange({ hoverEffect: e.target.value }),
                        style: {
                            width: '18px',
                            height: '18px',
                            marginRight: '12px',
                            cursor: 'pointer',
                            accentColor: theme.accent
                        }
                    }),

                    h('div', { style: { flex: 1 } },
                        h('div', {
                            style: {
                                fontSize: 'var(--font-md)',
                                fontWeight: 600,
                                color: theme.text,
                                marginBottom: '4px'
                            }
                        }, 'None'),

                        h('div', {
                            style: {
                                fontSize: 'var(--font-sm)',
                                color: theme.textSecondary,
                                lineHeight: '1.4'
                            }
                        }, 'No hover effects - minimal feedback only')
                    )
                ),

                // Option 2: Subtle
                h('label', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px',
                        backgroundColor: settings.hoverEffect === 'subtle'
                            ? `${theme.accent}15`
                            : theme.cardHover,
                        border: settings.hoverEffect === 'subtle'
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (settings.hoverEffect !== 'subtle') {
                            e.currentTarget.style.backgroundColor = theme.card;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (settings.hoverEffect !== 'subtle') {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                        }
                    }
                },
                    h('input', {
                        type: 'radio',
                        name: 'hoverEffect',
                        value: 'subtle',
                        checked: settings.hoverEffect === 'subtle',
                        onChange: (e) => onSettingsChange({ hoverEffect: e.target.value }),
                        style: {
                            width: '18px',
                            height: '18px',
                            marginRight: '12px',
                            cursor: 'pointer',
                            accentColor: theme.accent
                        }
                    }),

                    h('div', { style: { flex: 1 } },
                        h('div', {
                            style: {
                                fontSize: 'var(--font-md)',
                                fontWeight: 600,
                                color: theme.text,
                                marginBottom: '4px'
                            }
                        }, 'Subtle'),

                        h('div', {
                            style: {
                                fontSize: 'var(--font-sm)',
                                color: theme.textSecondary,
                                lineHeight: '1.4'
                            }
                        }, 'Gentle lift with gray border highlight')
                    )
                ),

                // Option 3: Fancy (Recommended)
                h('label', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px',
                        backgroundColor: settings.hoverEffect === 'fancy' // ✅ glow → fancy
                            ? `${theme.accent}15`
                            : theme.cardHover,
                        border: settings.hoverEffect === 'fancy'
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (settings.hoverEffect !== 'fancy') {
                            e.currentTarget.style.backgroundColor = theme.card;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (settings.hoverEffect !== 'fancy') {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                        }
                    }
                },

                    h('input', {
                        type: 'radio',
                        name: 'hoverEffect',
                        value: 'fancy', // ✅ glow → fancy
                        checked: settings.hoverEffect === 'fancy',
                        onChange: (e) => onSettingsChange({ hoverEffect: e.target.value }),
                        style: {
                            width: '18px',
                            height: '18px',
                            marginRight: '12px',
                            cursor: 'pointer',
                            accentColor: theme.accent
                        }
                    }),

                    h('div', { style: { flex: 1 } },
                        h('div', {
                            style: {
                                fontSize: 'var(--font-md)',
                                fontWeight: 600,
                                color: theme.text,
                                marginBottom: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }
                        },
                            'Fancy', // ✅ Glow → Fancy
                            h('span', {
                                style: {
                                    padding: '2px 8px',
                                    fontSize: 'var(--font-xs)',
                                    fontWeight: 600,
                                    backgroundColor: theme.accent,
                                    color: '#fff',
                                    borderRadius: '4px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }
                            }, 'Recommended')
                        ),

                        h('div', {
                            style: {
                                fontSize: 'var(--font-sm)',
                                color: theme.textSecondary,
                                lineHeight: '1.4'
                            }
                        }, 'Shimmer animation with gradient glow effect'),

                    )
                ),
                // Option 4: Border
                h('label', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        padding: '14px',
                        backgroundColor: settings.hoverEffect === 'border'
                            ? `${theme.accent}15`
                            : theme.cardHover,
                        border: settings.hoverEffect === 'border'
                            ? `2px solid ${theme.accent}`
                            : `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        if (settings.hoverEffect !== 'border') {
                            e.currentTarget.style.backgroundColor = theme.card;
                        }
                    },
                    onMouseLeave: (e) => {
                        if (settings.hoverEffect !== 'border') {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                        }
                    }
                },
                    h('input', {
                        type: 'radio',
                        name: 'hoverEffect',
                        value: 'border',
                        checked: settings.hoverEffect === 'border',
                        onChange: (e) => onSettingsChange({ hoverEffect: e.target.value }),
                        style: {
                            width: '18px',
                            height: '18px',
                            marginRight: '12px',
                            cursor: 'pointer',
                            accentColor: theme.accent
                        }
                    }),

                    h('div', { style: { flex: 1 } },
                        h('div', {
                            style: {
                                fontSize: 'var(--font-md)',
                                fontWeight: 600,
                                color: theme.text,
                                marginBottom: '4px'
                            }
                        }, 'Border'),

                        h('div', {
                            style: {
                                fontSize: 'var(--font-sm)',
                                color: theme.textSecondary,
                                lineHeight: '1.4'
                            }
                        }, 'Clean accent border highlight only')
                    )
                ),
            )
        ),
    );

    // Tags Tab Content
    const renderTagsTab = () => {
        const allTags = getAllTags();

        const getTagUsageCount = (tag) => {
            return categories.reduce((sum, cat) =>
                sum + cat.bookmarks.filter(b => b.tags?.includes(tag)).length, 0
            );
        };

        return h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
            // Info box
            allTags.length === 0 && h('div', {
                style: {
                    padding: '16px',
                    backgroundColor: `${theme.accent}15`,
                    border: `1px solid ${theme.accent}30`,
                    borderRadius: '8px',
                    fontSize: 'var(--font-sm)',
                    color: theme.text
                }
            },
                h('div', {
                    style: {
                        marginBottom: '8px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }
                },
                    h(Icon, { name: 'lightbulb', theme, settings, size: 16 }),
                    'No tags yet'
                ),
                h('div', null, 'Tags are created automatically when you add them to bookmarks. Manage them here.')
            ),

            // 2 Column Layout
            allTags.length > 0 && h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 380px',
                    gap: '20px',
                    '@media (max-width: 768px)': {
                        gridTemplateColumns: '1fr'
                    }
                }
            },
                // Left Column: Tag List
                h('div', {
                    style: {
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        maxHeight: '500px',
                        overflowY: 'auto',
                        paddingRight: '12px'
                    }
                },
                    allTags.map(tag => {
                        const color = getTagColor(tag, settings, config);
                        const usageCount = getTagUsageCount(tag);
                        const isSelected = selectedTag === tag;
                        const isEditing = editingTagName === tag;

                        return h('div', {
                            key: tag,
                            onClick: () => !isEditing && setSelectedTag(tag),
                            style: {
                                padding: '16px',
                                backgroundColor: isSelected ? `${theme.accent}15` : theme.cardHover,
                                borderRadius: '8px',
                                border: `2px solid ${isSelected ? theme.accent : theme.border}`,
                                cursor: isEditing ? 'default' : 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            },
                            onMouseEnter: (e) => {
                                if (!isEditing && !isSelected) {
                                    e.currentTarget.style.borderColor = theme.borderHover;
                                }
                            },
                            onMouseLeave: (e) => {
                                if (!isEditing && !isSelected) {
                                    e.currentTarget.style.borderColor = theme.border;
                                }
                            }
                        },
                            h('div', {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    flex: 1
                                }
                            },
                                // Tag badge
                                h('span', {
                                    style: {
                                        padding: '6px 14px',
                                        fontSize: 'var(--font-md)',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        backgroundColor: color.bg,
                                        color: color.text,
                                        border: `1px solid ${color.border}`
                                    }
                                }, tag),

                                // Usage count
                                h('span', {
                                    style: {
                                        fontSize: 'var(--font-sm)',
                                        color: theme.textSecondary
                                    }
                                }, `${usageCount} bookmark${usageCount !== 1 ? 's' : ''}`)
                            ),

                            // Selection indicator
                            isSelected && h(Icon, {
                                name: 'chevron-right',
                                theme,
                                size: 18
                            })
                        );
                    })
                ),

                // Right Column: Action Panel
                h('div', {
                    style: {
                        position: 'sticky',
                        top: 0,
                        height: 'fit-content'
                    }
                },
                    !selectedTag
                        ? // No tag selected
                        h('div', {
                            style: {
                                padding: '40px 20px',
                                textAlign: 'center',
                                backgroundColor: theme.cardHover,
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`
                            }
                        },
                            h(Icon, { name: 'hand-pointer', theme, settings, size: 32 }),
                            h('div', {
                                style: {
                                    marginTop: '16px',
                                    fontSize: 'var(--font-md)',
                                    color: theme.textSecondary
                                }
                            }, 'Select a tag to edit, change color, or delete')
                        )
                        : // Tag selected - Show action panel
                        h('div', {
                            style: {
                                padding: '20px',
                                backgroundColor: theme.cardHover,
                                borderRadius: '8px',
                                border: `1px solid ${theme.border}`
                            }
                        },
                            // Selected tag preview
                            h('div', {
                                style: {
                                    marginBottom: '20px',
                                    paddingBottom: '16px',
                                    borderBottom: `1px solid ${theme.border}`
                                }
                            },
                                h('div', {
                                    style: {
                                        fontSize: 'var(--font-sm)',
                                        color: theme.textSecondary,
                                        marginBottom: '8px',
                                        fontWeight: 500
                                    }
                                }, 'Selected Tag:'),

                                h('span', {
                                    style: {
                                        padding: '8px 16px',
                                        fontSize: 'var(--font-lg)',
                                        fontWeight: 600,
                                        borderRadius: '12px',
                                        backgroundColor: getTagColor(selectedTag, settings, config).bg,
                                        color: getTagColor(selectedTag, settings, config).text,
                                        border: `1px solid ${getTagColor(selectedTag, settings, config).border}`,
                                        display: 'inline-block'
                                    }
                                }, selectedTag),

                                h('div', {
                                    style: {
                                        marginTop: '8px',
                                        fontSize: 'var(--font-sm)',
                                        color: theme.textSecondary
                                    }
                                }, `Used in ${getTagUsageCount(selectedTag)} bookmark${getTagUsageCount(selectedTag) !== 1 ? 's' : ''}`)
                            ),

                            // Edit Section
                            editingTagName === selectedTag
                                ? h('div', {
                                    style: {
                                        marginBottom: '16px'
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
                                    }, 'Edit Tag Name:'),

                                    h('input', {
                                        type: 'text',
                                        value: editingTagNewName,
                                        onChange: (e) => {
                                            setEditingTagNewName(e.target.value);
                                            setEditingTagError('');
                                        },
                                        onKeyDown: (e) => {
                                            if (e.key === 'Enter') {
                                                handleSaveEditTag(selectedTag);
                                            }
                                            if (e.key === 'Escape') {
                                                handleCancelEditTag();
                                            }
                                        },
                                        placeholder: 'New tag name',
                                        autoFocus: true,
                                        style: {
                                            width: '100%',
                                            padding: '10px 12px',
                                            border: `1px solid ${editingTagError ? '#f85149' : theme.border}`,
                                            borderRadius: '6px',
                                            backgroundColor: theme.card,
                                            color: theme.text,
                                            fontSize: 'var(--font-md)',
                                            outline: 'none',
                                            boxSizing: 'border-box'
                                        }
                                    }),

                                    editingTagError && h('div', {
                                        style: {
                                            marginTop: '8px',
                                            fontSize: 'var(--font-xs)',
                                            color: '#f85149',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '6px'
                                        }
                                    },
                                        h(Icon, { name: 'exclamation-triangle', theme, settings, size: 14 }),
                                        editingTagError
                                    ),

                                    h('div', {
                                        style: {
                                            display: 'flex',
                                            gap: '8px',
                                            marginTop: '12px'
                                        }
                                    },
                                        h('button', {
                                            onClick: () => handleSaveEditTag(selectedTag),
                                            disabled: editingTagError !== '',
                                            style: {
                                                flex: 1,
                                                padding: '10px',
                                                border: 'none',
                                                borderRadius: '6px',
                                                backgroundColor: editingTagError ? theme.borderHover : theme.accent,
                                                color: '#fff',
                                                cursor: editingTagError ? 'not-allowed' : 'pointer',
                                                fontSize: 'var(--font-md)',
                                                fontWeight: 600,
                                                opacity: editingTagError ? 0.6 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }
                                        },
                                            h(Icon, { name: 'check', theme, settings, size: 16 }),
                                            'Save'
                                        ),

                                        h('button', {
                                            onClick: handleCancelEditTag,
                                            style: {
                                                flex: 1,
                                                padding: '10px',
                                                border: `1px solid ${theme.border}`,
                                                borderRadius: '6px',
                                                backgroundColor: theme.card,
                                                color: theme.text,
                                                cursor: 'pointer',
                                                fontSize: 'var(--font-md)',
                                                fontWeight: 600,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '6px'
                                            }
                                        },
                                            h(Icon, { name: 'times', theme, settings, size: 16 }),
                                            'Cancel'
                                        )
                                    )
                                )
                                : // Not editing - show action buttons
                                h('div', {
                                    style: {
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '10px'
                                    }
                                },
                                    // Change Color button
                                    h('button', {
                                        onClick: () => setSelectedTagForColor(selectedTag),
                                        disabled: editingTagName !== null,
                                        style: {
                                            width: '100%',
                                            padding: '12px',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '6px',
                                            backgroundColor: theme.card,
                                            color: theme.text,
                                            cursor: editingTagName ? 'not-allowed' : 'pointer',
                                            fontSize: 'var(--font-md)',
                                            fontWeight: 600,
                                            opacity: editingTagName ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        },
                                        onMouseEnter: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = theme.cardHover;
                                            }
                                        },
                                        onMouseLeave: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = theme.card;
                                            }
                                        }
                                    },
                                        h(Icon, { name: 'palette', theme, settings, size: 18 }),
                                        'Change Color'
                                    ),

                                    // Edit Name button
                                    h('button', {
                                        onClick: () => handleStartEditTag(selectedTag),
                                        disabled: editingTagName !== null,
                                        style: {
                                            width: '100%',
                                            padding: '12px',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '6px',
                                            backgroundColor: theme.card,
                                            color: theme.text,
                                            cursor: editingTagName ? 'not-allowed' : 'pointer',
                                            fontSize: 'var(--font-md)',
                                            fontWeight: 600,
                                            opacity: editingTagName ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            transition: 'all 0.2s'
                                        },
                                        onMouseEnter: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = theme.cardHover;
                                            }
                                        },
                                        onMouseLeave: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = theme.card;
                                            }
                                        }
                                    },
                                        h(Icon, { name: 'pencil', theme, settings, size: 18 }),
                                        'Edit Name'
                                    ),

                                    // Delete button
                                    h('button', {
                                        onClick: () => {
                                            onDeleteTag(selectedTag);
                                            setSelectedTag(null);
                                        },
                                        disabled: editingTagName !== null,
                                        style: {
                                            width: '100%',
                                            padding: '12px',
                                            border: 'none',
                                            borderRadius: '6px',
                                            backgroundColor: '#da363320',
                                            color: '#f85149',
                                            cursor: editingTagName ? 'not-allowed' : 'pointer',
                                            fontSize: 'var(--font-md)',
                                            fontWeight: 600,
                                            opacity: editingTagName ? 0.5 : 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            marginTop: '6px',
                                            transition: 'all 0.2s'
                                        },
                                        onMouseEnter: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = '#da3633';
                                                e.currentTarget.style.color = '#fff';
                                            }
                                        },
                                        onMouseLeave: (e) => {
                                            if (!editingTagName) {
                                                e.currentTarget.style.backgroundColor = '#da363320';
                                                e.currentTarget.style.color = '#f85149';
                                            }
                                        }
                                    },
                                        h(Icon, { name: 'trash', theme, settings, size: 18 }),
                                        'Delete Tag'
                                    )
                                )
                        )
                )
            )
        );
    };

    // Categories Tab Content
    const renderCategoriesTab = () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '20px' } },
        // Add new category
        h('div', {
            style: {
                padding: '16px',
                backgroundColor: theme.cardHover,
                borderRadius: '8px',
                border: `1px solid ${theme.border}`
            }
        },
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, 'Add New Category'),

            h('div', { style: { display: 'flex', gap: '8px' } },
                h('input', {
                    type: 'text',
                    placeholder: t.enterCategoryName || 'Enter category name',
                    value: newCategoryName,
                    onChange: (e) => setNewCategoryName(e.target.value),
                    onKeyDown: (e) => {
                        if (e.key === 'Enter') {
                            onAddCategory(newCategoryName);
                            setNewCategoryName('');
                        }
                    },
                    style: {
                        flex: 1,
                        padding: '10px 12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '6px',
                        backgroundColor: theme.card,
                        color: theme.text,
                        fontSize: 'var(--font-md)',
                        outline: 'none',
                        boxSizing: 'border-box'
                    }
                }),

                h('button', {
                    onClick: () => {
                        onAddCategory(newCategoryName);
                        setNewCategoryName('');
                    },
                    style: {
                        padding: '10px 16px',
                        border: 'none',
                        borderRadius: '6px',
                        backgroundColor: theme.accent,
                        color: '#fff',
                        cursor: 'pointer',
                        fontSize: 'var(--font-md)',
                        fontWeight: 500,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px'
                    }
                },
                    h(Icon, { name: 'plus', theme, settings, size: 16 }),
                    'Add'
                )
            )
        ),

        // Categories grid
        h('div', {
            style: {
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '12px'
            }
        },
            categories.length > 0
                ? categories.map(cat =>
                    h('div', {
                        key: cat.id,
                        style: {
                            padding: '14px',
                            backgroundColor: theme.cardHover,
                            borderRadius: '8px',
                            border: `1px solid ${editingCategoryId === cat.id ? theme.accent : theme.border}`,
                            transition: 'all 0.2s'
                        }
                    },
                        h('div', {
                            style: {
                                marginBottom: '12px'
                            }
                        },
                            editingCategoryId === cat.id
                                ? h('input', {
                                    type: 'text',
                                    value: editingCategoryName,
                                    onChange: (e) => setEditingCategoryName(e.target.value),
                                    onKeyDown: (e) => {
                                        if (e.key === 'Enter') {
                                            onRenameCategory(cat.id, editingCategoryName);
                                            setEditingCategoryId(null);
                                            setEditingCategoryName('');
                                        }
                                        if (e.key === 'Escape') {
                                            setEditingCategoryId(null);
                                            setEditingCategoryName('');
                                        }
                                    },
                                    autoFocus: true,
                                    style: {
                                        width: '100%',
                                        padding: '8px 10px',
                                        border: `1px solid ${theme.border}`,
                                        borderRadius: '4px',
                                        backgroundColor: theme.card,
                                        color: theme.text,
                                        fontSize: 'var(--font-md)',
                                        outline: 'none',
                                        boxSizing: 'border-box',
                                        fontWeight: 500
                                    }
                                })
                                : h('div', {
                                    style: {
                                        fontSize: 'var(--font-md)',
                                        fontWeight: 600,
                                        color: theme.text,
                                        wordBreak: 'break-word'
                                    }
                                }, cat.name)
                        ),

                        h('div', {
                            style: {
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                marginBottom: '12px',
                                fontSize: 'var(--font-sm)',
                                color: theme.textSecondary
                            }
                        },
                            h('div', {
                                style: {
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }
                            },
                                h(Icon, { name: 'bookmark', theme, settings, size: 14 }),
                                `${cat.bookmarks.length} bookmark${cat.bookmarks.length !== 1 ? 's' : ''}`
                            ),
                            editingCategoryId === cat.id && h('div', {
                                style: {
                                    fontSize: 'var(--font-xs)',
                                    color: theme.accent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px'
                                }
                            },
                                h(Icon, { name: 'pencil', theme, settings, size: 12 }),
                                'Editing...'
                            )
                        ),

                        h('div', {
                            style: {
                                display: 'flex',
                                gap: '6px'
                            }
                        },
                            editingCategoryId === cat.id
                                ? [
                                    h('button', {
                                        key: 'save',
                                        onClick: () => {
                                            onRenameCategory(cat.id, editingCategoryName);
                                            setEditingCategoryId(null);
                                            setEditingCategoryName('');
                                        },
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: theme.accent,
                                            color: '#fff',
                                            cursor: 'pointer',
                                            fontSize: 'var(--font-xs)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px'
                                        }
                                    },
                                        h(Icon, { name: 'check', theme, settings, size: 12 }),
                                        'Save'
                                    ),

                                    h('button', {
                                        key: 'cancel',
                                        onClick: () => {
                                            setEditingCategoryId(null);
                                            setEditingCategoryName('');
                                        },
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '4px',
                                            backgroundColor: theme.card,
                                            color: theme.text,
                                            cursor: 'pointer',
                                            fontSize: 'var(--font-xs)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '4px'
                                        }
                                    },
                                        h(Icon, { name: 'times', theme, settings, size: 12 }),
                                        'Cancel'
                                    )
                                ]
                                : [
                                    h('button', {
                                        key: 'edit',
                                        onClick: () => {
                                            setEditingCategoryId(cat.id);
                                            setEditingCategoryName(cat.name);
                                        },
                                        title: 'Edit category',
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            border: `1px solid ${theme.border}`,
                                            borderRadius: '4px',
                                            backgroundColor: theme.card,
                                            color: theme.text,
                                            cursor: 'pointer',
                                            fontSize: 'var(--font-xs)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }
                                    },
                                        h(Icon, { name: 'pencil', theme, settings, size: 14 })
                                    ),

                                    h('button', {
                                        key: 'delete',
                                        onClick: () => onDeleteCategory(cat.id),
                                        title: 'Delete category',
                                        style: {
                                            flex: 1,
                                            padding: '6px 8px',
                                            border: 'none',
                                            borderRadius: '4px',
                                            backgroundColor: '#da363320',
                                            color: '#f85149',
                                            cursor: 'pointer',
                                            fontSize: 'var(--font-xs)',
                                            fontWeight: 600,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }
                                    },
                                        h(Icon, { name: 'trash', theme, settings, size: 14 })
                                    )
                                ]
                        )
                    )
                )
                : h('div', {
                    style: {
                        gridColumn: '1 / -1',
                        padding: '40px',
                        textAlign: 'center',
                        color: theme.textSecondary,
                        fontSize: 'var(--font-md)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                    }
                },
                    h(Icon, { name: 'inbox', theme, settings, size: 24 }),
                    'No categories yet. Add one above!'
                )
        )
    );

    // Data Tab Content
    const renderDataTab = () => h('div', { style: { display: 'flex', flexDirection: 'column', gap: '24px' } },
        // Data Management
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.dataManagement || 'Data Management'),

            h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }
            },
                h('button', {
                    onClick: handleExport,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        backgroundColor: theme.cardHover,
                        color: theme.text,
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer'
                    }
                },
                    h(Icon, { name: 'download', theme, settings, size: 18 }),
                    t.exportData || 'Export'
                ),

                h('button', {
                    onClick: () => fileInputRef.current?.click(),
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        backgroundColor: theme.cardHover,
                        color: theme.text,
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer'
                    }
                },
                    h(Icon, { name: 'upload', theme, settings, size: 18 }),
                    t.importData || 'Import'
                )
            )
        ),

        // Bookmark Sync
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.bookmarkSync || 'Bookmark Sync'),

            h('button', {
                onClick: handleSyncBookmarks,
                disabled: isSyncing,
                style: {
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    padding: '12px',
                    border: `1px solid ${theme.border}`,
                    borderRadius: '8px',
                    backgroundColor: theme.cardHover,
                    color: theme.text,
                    fontSize: 'var(--font-md)',
                    cursor: isSyncing ? 'not-allowed' : 'pointer',
                    opacity: isSyncing ? 0.6 : 1
                }
            },
                h(Icon, { name: 'sync-alt', theme, settings, size: 18 }),
                isSyncing ? 'Syncing...' : (t.syncBrowserBookmarks || 'Sync Browser Bookmarks')
            )
        ),

        // Theme Management
        h('div', null,
            h('label', {
                style: {
                    display: 'block',
                    marginBottom: '12px',
                    fontSize: 'var(--font-lg)',
                    fontWeight: 600,
                    color: theme.text
                }
            }, t.themeManagement || 'Theme Management'),

            h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }
            },
                h('button', {
                    onClick: handleExportThemes,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        backgroundColor: theme.cardHover,
                        color: theme.text,
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer'
                    }
                },
                    h(Icon, { name: 'download', theme, settings, size: 18 }),
                    t.exportThemes || 'Export Themes'
                ),

                h('button', {
                    onClick: () => themeInputRef.current?.click(),
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: `1px solid ${theme.border}`,
                        borderRadius: '8px',
                        backgroundColor: theme.cardHover,
                        color: theme.text,
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer'
                    }
                },
                    h(Icon, { name: 'upload', theme, settings, size: 18 }),
                    t.importThemes || 'Import Themes'
                )
            )
        ),

        // Danger Zone - Delete & Cleanup Operations
        h('div', {
            style: {
                padding: '20px',
                backgroundColor: '#da363320',
                border: `2px solid #da3633`,
                borderRadius: '8px'
            }
        },
            h('div', {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginBottom: '16px'
                }
            },
                h(Icon, { name: 'exclamation-triangle', theme, settings, size: 20 }),
                h('label', {
                    style: {
                        fontSize: 'var(--font-lg)',
                        fontWeight: 600,
                        color: '#f85149',
                        margin: 0
                    }
                }, 'Danger Zone')
            ),

            h('p', {
                style: {
                    margin: '0 0 16px',
                    fontSize: 'var(--font-sm)',
                    color: '#f85149'
                }
            }, 'Be careful! These actions cannot be undone.'),

            h('div', {
                style: {
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px'
                }
            },
                // Remove Duplicates Button
                h('button', {
                    onClick: handleRemoveDuplicates,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#da363320',
                        color: '#f85149',
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor = '#da3633';
                        e.currentTarget.style.color = '#fff';
                    },
                    onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = '#da363320';
                        e.currentTarget.style.color = '#f85149';
                    }
                },
                    h(Icon, { name: 'copy', theme, settings, size: 16 }),
                    'Remove Duplicates'
                ),

                // Delete All Data Button
                h('button', {
                    onClick: handleDeleteAllData,
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '12px',
                        border: 'none',
                        borderRadius: '8px',
                        backgroundColor: '#da363320',
                        color: '#f85149',
                        fontSize: 'var(--font-md)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s'
                    },
                    onMouseEnter: (e) => {
                        e.currentTarget.style.backgroundColor = '#da3633';
                        e.currentTarget.style.color = '#fff';
                    },
                    onMouseLeave: (e) => {
                        e.currentTarget.style.backgroundColor = '#da363320';
                        e.currentTarget.style.color = '#f85149';
                    }
                },
                    h(Icon, { name: 'trash-alt', theme, settings, size: 16 }),
                    'Delete All Data' // ← Buton yazısı değişti
                )
            )
        )
    );

    // Render active tab content
    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return renderGeneralTab();
            case 'appearance':
                return renderAppearanceTab();
            case 'tags':
                return renderTagsTab();
            case 'categories':
                return renderCategoriesTab();
            case 'data':
                return renderDataTab();
            default:
                return renderGeneralTab();
        }
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
                maxWidth: '1000px',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column'
            }
        },
            // Header with title and close button
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
                }, t.settings),

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

            // Tab navigation
            h('div', {
                style: {
                    display: 'flex',
                    borderBottom: `1px solid ${theme.border}`,
                    backgroundColor: theme.bgSecondary,
                    overflowX: 'auto',
                    minHeight: '58px',
                    flexShrink: 0
                }
            },
                tabs.map(tab =>
                    h('button', {
                        key: tab.id,
                        onClick: () => setActiveTab(tab.id),
                        style: {
                            flex: 1,
                            minWidth: 'auto',
                            padding: '16px 12px',
                            border: 'none',
                            minHeight: '58px',
                            backgroundColor: 'transparent',
                            color: activeTab === tab.id ? theme.accent : theme.textSecondary,
                            cursor: 'pointer',
                            fontSize: 'var(--font-md)',
                            fontWeight: activeTab === tab.id ? 600 : 500,
                            borderBottom: activeTab === tab.id ? `3px solid ${theme.accent}` : `1px solid ${theme.bgSecondary}`,
                            transition: 'all 0.2s ease',
                            textAlign: 'center',
                            whiteSpace: 'nowrap',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            outline: 'none'
                        },
                        onMouseEnter: (e) => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.color = theme.text;
                            }
                        },
                        onMouseLeave: (e) => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.color = theme.textSecondary;
                            }
                        },
                        onFocus: (e) => {
                            e.currentTarget.style.outline = 'none';
                        }
                    },
                        h(Icon, { name: tab.icon, theme, settings, size: 16 }),
                        h('span', null, tab.label)
                    )
                )
            ),

            // Tab content
            h('div', {
                style: {
                    flex: 1,
                    overflowY: 'auto',
                    padding: '28px'
                }
            },
                renderTabContent(),

                // Color picker for tags
                selectedTagForColor && h('div', {
                    style: {
                        marginTop: '20px',
                        padding: '16px',
                        backgroundColor: theme.cardHover,
                        borderRadius: '8px',
                        border: `1px solid ${theme.border}`
                    }
                },
                    h('div', {
                        style: {
                            fontSize: 'var(--font-md)',
                            marginBottom: '12px',
                            color: theme.text,
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                        }
                    },
                        h(Icon, { name: 'palette', theme, settings, size: 18 }),
                        `Color for: ${selectedTagForColor}`
                    ),

                    h('div', {
                        style: {
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(50px, 1fr))',
                            gap: '8px',
                            marginBottom: '12px'
                        }
                    },
                        config.themes.tagColors.map(colorOption =>
                            h('button', {
                                key: colorOption.name,
                                onClick: () => {
                                    onSetTagColor(selectedTagForColor, colorOption.name);
                                    setSelectedTagForColor(null);
                                },
                                title: colorOption.name,
                                style: {
                                    height: '45px',
                                    borderRadius: '6px',
                                    border: `2px solid ${colorOption.border}`,
                                    backgroundColor: colorOption.bg,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: colorOption.text,
                                    fontSize: 'var(--font-xs)',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                },
                                onMouseEnter: (e) => {
                                    e.currentTarget.style.transform = 'scale(1.1)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                                },
                                onMouseLeave: (e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }
                            }, colorOption.name.charAt(0).toUpperCase())
                        )
                    ),

                    h('button', {
                        onClick: () => setSelectedTagForColor(null),
                        style: {
                            width: '100%',
                            padding: '8px',
                            border: `1px solid ${theme.border}`,
                            borderRadius: '6px',
                            backgroundColor: theme.card,
                            color: theme.text,
                            cursor: 'pointer',
                            fontSize: 'var(--font-sm)',
                            fontWeight: 500
                        }
                    }, 'Close Color Picker')
                )
            ),

            // Social links
            h('div', {
                style: {
                    padding: '20px 28px',
                    borderTop: `1px solid ${theme.border}`,
                    textAlign: 'center',
                    fontSize: '14px',
                    color: theme.textSecondary,
                    backgroundColor: theme.bgSecondary,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px'
                }
            },

                // Social Links
                h('div', {
                    style: {
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '16px'
                    }
                },
                    // GitHub Link
                    h('a', {
                        href: 'https://github.com/onemli/Cortex',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: 'Visit GitHub Repository',
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: theme.cardHover,
                            border: `1px solid ${theme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                        },
                        onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor = theme.accent;
                            e.currentTarget.style.borderColor = theme.accent;
                        },
                        onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                            e.currentTarget.style.borderColor = theme.border;
                        }
                    },
                        h(Icon, { name: 'github', theme, settings, size: 20 })
                    ),

                    // Chrome Link
                    h('a', {
                        href: 'https://chromewebstore.google.com/detail/fbcgjadbplmfcaghogbmnolpgjejkhae?utm_source=item-share-cb',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: 'Download from Chrome Web Store',
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: theme.cardHover,
                            border: `1px solid ${theme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                        },
                        onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor = theme.accent;
                            e.currentTarget.style.borderColor = theme.accent;
                        },
                        onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                            e.currentTarget.style.borderColor = theme.border;
                        }
                    },
                        h(Icon, { name: 'chrome', theme, settings, size: 20 })
                    ),

                    // Firefox Link
                    h('a', {
                        href: 'https://addons.mozilla.org/en-US/firefox/addon/cortex-find-that-one-link/',
                        target: '_blank',
                        rel: 'noopener noreferrer',
                        title: 'Download from Firefox Add-ons',
                        style: {
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: theme.cardHover,
                            border: `1px solid ${theme.border}`,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            textDecoration: 'none'
                        },
                        onMouseEnter: (e) => {
                            e.currentTarget.style.backgroundColor = theme.accent;
                            e.currentTarget.style.borderColor = theme.accent;
                        },
                        onMouseLeave: (e) => {
                            e.currentTarget.style.backgroundColor = theme.cardHover;
                            e.currentTarget.style.borderColor = theme.border;
                        }
                    },
                        h(Icon, { name: 'firefox', theme, settings, size: 20 })
                    )
                )
            ),

            // Hidden file inputs
            h('input', {
                ref: fileInputRef,
                type: 'file',
                accept: '.json',
                onChange: handleImport,
                style: { display: 'none' }
            }),

            h('input', {
                ref: themeInputRef,
                type: 'file',
                accept: '.json',
                onChange: handleImportThemes,
                style: { display: 'none' }
            }),
            h('input', {
                ref: fileInputRef,
                type: 'file',
                accept: '.json',
                onChange: handleImport,
                style: { display: 'none' }
            }),

            h('input', {
                ref: themeInputRef,
                type: 'file',
                accept: '.json',
                onChange: handleImportThemes,
                style: { display: 'none' }
            })
        )
    );
}