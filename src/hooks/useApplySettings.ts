import { useEffect } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';

// Theme definitions with comprehensive color palettes
const THEMES = {
    dark: {
        bg: '#0f172a',           // slate-900
        bgDeep: '#020617',       // slate-950
        bgSurface: '#1e293b',    // slate-800
        bgFloating: 'rgba(30, 41, 59, 0.95)',
        border: 'rgba(255, 255, 255, 0.08)',
        borderHover: 'rgba(255, 255, 255, 0.15)',
        text: '#f8fafc',         // slate-50
        textMuted: '#94a3b8',    // slate-400
        textDim: '#64748b',      // slate-500
    },
    futuristic: {
        bg: '#030304',
        bgDeep: '#000000',
        bgSurface: '#0a0a0c',
        bgFloating: 'rgba(10, 10, 15, 0.95)',
        border: 'rgba(255, 255, 255, 0.06)',
        borderHover: 'rgba(255, 255, 255, 0.12)',
        text: '#f0f0f0',
        textMuted: '#9ca3af',
        textDim: '#6b7280',
    },
    midnight: {
        bg: '#0a0a1a',
        bgDeep: '#050510',
        bgSurface: '#12122a',
        bgFloating: 'rgba(18, 18, 42, 0.95)',
        border: 'rgba(100, 100, 255, 0.1)',
        borderHover: 'rgba(100, 100, 255, 0.2)',
        text: '#e8e8ff',
        textMuted: '#a0a0d0',
        textDim: '#7070a0',
    },
    aurora: {
        bg: '#0a1210',
        bgDeep: '#050a08',
        bgSurface: '#0f1f1a',
        bgFloating: 'rgba(15, 31, 26, 0.95)',
        border: 'rgba(16, 185, 129, 0.1)',
        borderHover: 'rgba(16, 185, 129, 0.2)',
        text: '#e8fff8',
        textMuted: '#a0d0c0',
        textDim: '#70a090',
    },
};

/**
 * Hook that applies settings from the store to the actual application behavior.
 * Should be called once at the root level (App.tsx).
 */
export function useApplySettings() {
    const settings = useSettingsStore();

    // Apply theme & accent color to CSS variables
    useEffect(() => {
        const root = document.documentElement;
        const theme = THEMES[settings.theme] || THEMES.futuristic;

        // Set data-theme attribute for CSS targeting
        root.setAttribute('data-theme', settings.theme);

        // Apply theme colors
        root.style.setProperty('--bg', theme.bg);
        root.style.setProperty('--bg-deep', theme.bgDeep);
        root.style.setProperty('--bg-surface', theme.bgSurface);
        root.style.setProperty('--bg-floating', theme.bgFloating);
        root.style.setProperty('--border', theme.border);
        root.style.setProperty('--border-hover', theme.borderHover);
        root.style.setProperty('--text', theme.text);
        root.style.setProperty('--text-muted', theme.textMuted);
        root.style.setProperty('--text-dim', theme.textDim);

        // Accent color
        root.style.setProperty('--accent', settings.accentColor);
        root.style.setProperty('--accent-hover', `${settings.accentColor}dd`);
        root.style.setProperty('--accent-muted', `${settings.accentColor}40`);
        root.style.setProperty('--accent-glow', `${settings.accentColor}60`);

        // Compute accent RGB for advanced effects
        const hex = settings.accentColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        root.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);

        console.log('[Theme] Applied:', settings.theme, 'Accent:', settings.accentColor);

    }, [settings.theme, settings.accentColor]);

    // Apply font scale
    useEffect(() => {
        document.documentElement.style.fontSize = `${settings.fontScale * 100}%`;
    }, [settings.fontScale]);

    // Apply zoom level
    useEffect(() => {
        const zoomFactor = settings.zoomLevel / 100;
        document.body.style.zoom = String(zoomFactor);
    }, [settings.zoomLevel]);

    // Apply animations preference
    useEffect(() => {
        if (settings.reduceMotion || !settings.enableAnimations) {
            document.documentElement.classList.add('reduce-motion');
        } else {
            document.documentElement.classList.remove('reduce-motion');
        }
    }, [settings.enableAnimations, settings.reduceMotion]);

    // Apply smooth scrolling
    useEffect(() => {
        document.documentElement.style.scrollBehavior = settings.smoothScrolling ? 'smooth' : 'auto';
    }, [settings.smoothScrolling]);

    // Notify Electron main process
    useEffect(() => {
        try {
            (window as any).ipcRenderer?.send?.('settings-update', {
                doNotTrack: settings.doNotTrack,
                hardwareAcceleration: settings.hardwareAcceleration,
            });
        } catch (e) {
            // IPC not available
        }
    }, [settings.doNotTrack, settings.hardwareAcceleration]);
}

/**
 * Get the search URL for the selected search engine
 */
export function useSearchEngine() {
    const { searchEngine, customSearchEngines } = useSettingsStore();

    const getSearchUrl = (query: string): string => {
        const engine = customSearchEngines.find(e => e.id === searchEngine);
        if (engine) {
            return engine.url.replace('%s', encodeURIComponent(query));
        }
        return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    };

    return { getSearchUrl, searchEngine };
}
