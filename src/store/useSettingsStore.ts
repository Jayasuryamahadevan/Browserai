import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SearchEngine {
    id: string;
    name: string;
    url: string; // URL with %s placeholder for query
    icon?: string;
}

export interface SettingsState {
    // ═══════════════════════════════════════════════════════════════════════
    // 🛡️ SHIELDS & PRIVACY
    // ═══════════════════════════════════════════════════════════════════════
    masterShieldEnabled: boolean;
    adBlockEnabled: boolean;
    blockCrossSiteTrackers: boolean;
    upgradeToHttps: boolean;
    blockScripts: boolean;
    blockFingerprinting: boolean;
    dnsOverHttps: 'off' | 'automatic' | 'custom';
    customDnsServer: string;
    blockSocialTrackers: boolean;
    blockWebRTC: boolean;
    cookieControl: 'all' | 'third-party' | 'none';

    // ═══════════════════════════════════════════════════════════════════════
    // 🎨 APPEARANCE
    // ═══════════════════════════════════════════════════════════════════════
    theme: 'dark' | 'futuristic' | 'midnight' | 'aurora';
    accentColor: string;
    fontScale: number; // 0.8 - 1.4
    zoomLevel: number; // 50 - 200
    enableAnimations: boolean;
    reduceMotion: boolean;
    sidebarPosition: 'left' | 'right';
    compactMode: boolean;

    // ═══════════════════════════════════════════════════════════════════════
    // 🔍 SEARCH
    // ═══════════════════════════════════════════════════════════════════════
    searchEngine: string;
    showSearchSuggestions: boolean;
    showRecentSearches: boolean;
    privateSearchMode: boolean;
    customSearchEngines: SearchEngine[];

    // ═══════════════════════════════════════════════════════════════════════
    // 📑 TABS
    // ═══════════════════════════════════════════════════════════════════════
    tabHoverPreview: boolean;
    enableSleepingTabs: boolean;
    sleepingTabsTimeout: number; // minutes
    newTabPosition: 'end' | 'afterCurrent';
    showTabCloseButton: 'always' | 'hover' | 'never';
    pinnedTabsBehavior: 'compact' | 'normal';

    // ═══════════════════════════════════════════════════════════════════════
    // ⚙️ SYSTEM
    // ═══════════════════════════════════════════════════════════════════════
    startupBehavior: 'newTab' | 'continue' | 'custom';
    customStartupPages: string[];
    downloadsPath: string;
    askBeforeDownload: boolean;
    hardwareAcceleration: boolean;
    smoothScrolling: boolean;
    proxyEnabled: boolean;
    proxyServer: string;

    // ═══════════════════════════════════════════════════════════════════════
    // 🔒 PRIVACY & DATA
    // ═══════════════════════════════════════════════════════════════════════
    clearBrowsingDataOnExit: boolean;
    historyEnabled: boolean;
    saveFormData: boolean;
    doNotTrack: boolean;

    // ═══════════════════════════════════════════════════════════════════════
    // 💻 DEVELOPER
    // ═══════════════════════════════════════════════════════════════════════
    devToolsEnabled: boolean;
    experimentalFeatures: boolean;
    allowUnsafeScripts: boolean;
    showDebugInfo: boolean;

    // ═══════════════════════════════════════════════════════════════════════
    // ACTIONS
    // ═══════════════════════════════════════════════════════════════════════
    // Shields
    setMasterShieldEnabled: (enabled: boolean) => void;
    setAdBlockEnabled: (enabled: boolean) => void;
    setBlockCrossSiteTrackers: (enabled: boolean) => void;
    setUpgradeToHttps: (enabled: boolean) => void;
    setBlockScripts: (enabled: boolean) => void;
    setBlockFingerprinting: (enabled: boolean) => void;
    setDnsOverHttps: (mode: 'off' | 'automatic' | 'custom') => void;
    setCustomDnsServer: (server: string) => void;
    setBlockSocialTrackers: (enabled: boolean) => void;
    setBlockWebRTC: (enabled: boolean) => void;
    setCookieControl: (mode: 'all' | 'third-party' | 'none') => void;

    // Appearance
    setTheme: (theme: 'dark' | 'futuristic' | 'midnight' | 'aurora') => void;
    setAccentColor: (color: string) => void;
    setFontScale: (scale: number) => void;
    setZoomLevel: (level: number) => void;
    setEnableAnimations: (enabled: boolean) => void;
    setReduceMotion: (enabled: boolean) => void;
    setSidebarPosition: (position: 'left' | 'right') => void;
    setCompactMode: (enabled: boolean) => void;

    // Search
    setSearchEngine: (engine: string) => void;
    setShowSearchSuggestions: (enabled: boolean) => void;
    setShowRecentSearches: (enabled: boolean) => void;
    setPrivateSearchMode: (enabled: boolean) => void;
    addCustomSearchEngine: (engine: SearchEngine) => void;
    removeCustomSearchEngine: (id: string) => void;

    // Tabs
    setTabHoverPreview: (enabled: boolean) => void;
    setEnableSleepingTabs: (enabled: boolean) => void;
    setSleepingTabsTimeout: (minutes: number) => void;
    setNewTabPosition: (position: 'end' | 'afterCurrent') => void;
    setShowTabCloseButton: (mode: 'always' | 'hover' | 'never') => void;
    setPinnedTabsBehavior: (behavior: 'compact' | 'normal') => void;

    // System
    setStartupBehavior: (behavior: 'newTab' | 'continue' | 'custom') => void;
    setCustomStartupPages: (pages: string[]) => void;
    setDownloadsPath: (path: string) => void;
    setAskBeforeDownload: (enabled: boolean) => void;
    setHardwareAcceleration: (enabled: boolean) => void;
    setSmoothScrolling: (enabled: boolean) => void;
    setProxyEnabled: (enabled: boolean) => void;
    setProxyServer: (server: string) => void;

    // Privacy
    setClearBrowsingDataOnExit: (enabled: boolean) => void;
    setHistoryEnabled: (enabled: boolean) => void;
    setSaveFormData: (enabled: boolean) => void;
    setDoNotTrack: (enabled: boolean) => void;

    // Developer
    setDevToolsEnabled: (enabled: boolean) => void;
    setExperimentalFeatures: (enabled: boolean) => void;
    setAllowUnsafeScripts: (enabled: boolean) => void;
    setShowDebugInfo: (enabled: boolean) => void;

    // Utility
    resetSection: (section: 'shields' | 'appearance' | 'search' | 'tabs' | 'system' | 'privacy' | 'developer') => void;
    resetAll: () => void;
}

const defaultSearchEngines: SearchEngine[] = [
    { id: 'google', name: 'Google', url: 'https://www.google.com/search?q=%s' },
    { id: 'brave', name: 'Brave Search', url: 'https://search.brave.com/search?q=%s' },
    { id: 'duckduckgo', name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s' },
    { id: 'bing', name: 'Bing', url: 'https://www.bing.com/search?q=%s' },
    { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=%s' },
];

const initialState = {
    // Shields
    masterShieldEnabled: true,
    adBlockEnabled: true,
    blockCrossSiteTrackers: true,
    upgradeToHttps: true,
    blockScripts: false,
    blockFingerprinting: true,
    dnsOverHttps: 'automatic' as const,
    customDnsServer: '',
    blockSocialTrackers: true,
    blockWebRTC: false,
    cookieControl: 'third-party' as const,

    // Appearance
    theme: 'futuristic' as const,
    accentColor: '#3B82F6', // Blue
    fontScale: 1.0,
    zoomLevel: 100,
    enableAnimations: true,
    reduceMotion: false,
    sidebarPosition: 'right' as const,
    compactMode: false,

    // Search
    searchEngine: 'google',
    showSearchSuggestions: true,
    showRecentSearches: true,
    privateSearchMode: false,
    customSearchEngines: defaultSearchEngines,

    // Tabs
    tabHoverPreview: true,
    enableSleepingTabs: true,
    sleepingTabsTimeout: 30,
    newTabPosition: 'end' as const,
    showTabCloseButton: 'always' as const,
    pinnedTabsBehavior: 'compact' as const,

    // System
    startupBehavior: 'newTab' as const,
    customStartupPages: [],
    downloadsPath: '',
    askBeforeDownload: false,
    hardwareAcceleration: true,
    smoothScrolling: true,
    proxyEnabled: false,
    proxyServer: '',

    // Privacy
    clearBrowsingDataOnExit: false,
    historyEnabled: true,
    saveFormData: true,
    doNotTrack: true,

    // Developer
    devToolsEnabled: true,
    experimentalFeatures: false,
    allowUnsafeScripts: false,
    showDebugInfo: false,
};

export const useSettingsStore = create<SettingsState>()(
    persist(
        (set) => ({
            ...initialState,

            // ═══ Shields Actions ═══
            setMasterShieldEnabled: (enabled) => set({ masterShieldEnabled: enabled }),
            setAdBlockEnabled: (enabled) => set({ adBlockEnabled: enabled }),
            setBlockCrossSiteTrackers: (enabled) => set({ blockCrossSiteTrackers: enabled }),
            setUpgradeToHttps: (enabled) => set({ upgradeToHttps: enabled }),
            setBlockScripts: (enabled) => set({ blockScripts: enabled }),
            setBlockFingerprinting: (enabled) => set({ blockFingerprinting: enabled }),
            setDnsOverHttps: (mode) => set({ dnsOverHttps: mode }),
            setCustomDnsServer: (server) => set({ customDnsServer: server }),
            setBlockSocialTrackers: (enabled) => set({ blockSocialTrackers: enabled }),
            setBlockWebRTC: (enabled) => set({ blockWebRTC: enabled }),
            setCookieControl: (mode) => set({ cookieControl: mode }),

            // ═══ Appearance Actions ═══
            setTheme: (theme) => set({ theme }),
            setAccentColor: (color) => set({ accentColor: color }),
            setFontScale: (scale) => set({ fontScale: scale }),
            setZoomLevel: (level) => set({ zoomLevel: level }),
            setEnableAnimations: (enabled) => set({ enableAnimations: enabled }),
            setReduceMotion: (enabled) => set({ reduceMotion: enabled }),
            setSidebarPosition: (position) => set({ sidebarPosition: position }),
            setCompactMode: (enabled) => set({ compactMode: enabled }),

            // ═══ Search Actions ═══
            setSearchEngine: (engine) => set({ searchEngine: engine }),
            setShowSearchSuggestions: (enabled) => set({ showSearchSuggestions: enabled }),
            setShowRecentSearches: (enabled) => set({ showRecentSearches: enabled }),
            setPrivateSearchMode: (enabled) => set({ privateSearchMode: enabled }),
            addCustomSearchEngine: (engine) => set((state) => ({
                customSearchEngines: [...state.customSearchEngines, engine]
            })),
            removeCustomSearchEngine: (id) => set((state) => ({
                customSearchEngines: state.customSearchEngines.filter((e) => e.id !== id)
            })),

            // ═══ Tabs Actions ═══
            setTabHoverPreview: (enabled) => set({ tabHoverPreview: enabled }),
            setEnableSleepingTabs: (enabled) => set({ enableSleepingTabs: enabled }),
            setSleepingTabsTimeout: (minutes) => set({ sleepingTabsTimeout: minutes }),
            setNewTabPosition: (position) => set({ newTabPosition: position }),
            setShowTabCloseButton: (mode) => set({ showTabCloseButton: mode }),
            setPinnedTabsBehavior: (behavior) => set({ pinnedTabsBehavior: behavior }),

            // ═══ System Actions ═══
            setStartupBehavior: (behavior) => set({ startupBehavior: behavior }),
            setCustomStartupPages: (pages) => set({ customStartupPages: pages }),
            setDownloadsPath: (path) => set({ downloadsPath: path }),
            setAskBeforeDownload: (enabled) => set({ askBeforeDownload: enabled }),
            setHardwareAcceleration: (enabled) => set({ hardwareAcceleration: enabled }),
            setSmoothScrolling: (enabled) => set({ smoothScrolling: enabled }),
            setProxyEnabled: (enabled) => set({ proxyEnabled: enabled }),
            setProxyServer: (server) => set({ proxyServer: server }),

            // ═══ Privacy Actions ═══
            setClearBrowsingDataOnExit: (enabled) => set({ clearBrowsingDataOnExit: enabled }),
            setHistoryEnabled: (enabled) => set({ historyEnabled: enabled }),
            setSaveFormData: (enabled) => set({ saveFormData: enabled }),
            setDoNotTrack: (enabled) => set({ doNotTrack: enabled }),

            // ═══ Developer Actions ═══
            setDevToolsEnabled: (enabled) => set({ devToolsEnabled: enabled }),
            setExperimentalFeatures: (enabled) => set({ experimentalFeatures: enabled }),
            setAllowUnsafeScripts: (enabled) => set({ allowUnsafeScripts: enabled }),
            setShowDebugInfo: (enabled) => set({ showDebugInfo: enabled }),

            // ═══ Utility Actions ═══
            resetSection: (section) => {
                const sectionDefaults: Record<string, Partial<SettingsState>> = {
                    shields: {
                        masterShieldEnabled: initialState.masterShieldEnabled,
                        adBlockEnabled: initialState.adBlockEnabled,
                        blockCrossSiteTrackers: initialState.blockCrossSiteTrackers,
                        upgradeToHttps: initialState.upgradeToHttps,
                        blockScripts: initialState.blockScripts,
                        blockFingerprinting: initialState.blockFingerprinting,
                        dnsOverHttps: initialState.dnsOverHttps,
                        customDnsServer: initialState.customDnsServer,
                        blockSocialTrackers: initialState.blockSocialTrackers,
                        blockWebRTC: initialState.blockWebRTC,
                        cookieControl: initialState.cookieControl,
                    },
                    appearance: {
                        theme: initialState.theme,
                        accentColor: initialState.accentColor,
                        fontScale: initialState.fontScale,
                        zoomLevel: initialState.zoomLevel,
                        enableAnimations: initialState.enableAnimations,
                        reduceMotion: initialState.reduceMotion,
                        sidebarPosition: initialState.sidebarPosition,
                        compactMode: initialState.compactMode,
                    },
                    search: {
                        searchEngine: initialState.searchEngine,
                        showSearchSuggestions: initialState.showSearchSuggestions,
                        showRecentSearches: initialState.showRecentSearches,
                        privateSearchMode: initialState.privateSearchMode,
                        customSearchEngines: initialState.customSearchEngines,
                    },
                    tabs: {
                        tabHoverPreview: initialState.tabHoverPreview,
                        enableSleepingTabs: initialState.enableSleepingTabs,
                        sleepingTabsTimeout: initialState.sleepingTabsTimeout,
                        newTabPosition: initialState.newTabPosition,
                        showTabCloseButton: initialState.showTabCloseButton,
                        pinnedTabsBehavior: initialState.pinnedTabsBehavior,
                    },
                    system: {
                        startupBehavior: initialState.startupBehavior,
                        customStartupPages: initialState.customStartupPages,
                        downloadsPath: initialState.downloadsPath,
                        askBeforeDownload: initialState.askBeforeDownload,
                        hardwareAcceleration: initialState.hardwareAcceleration,
                        smoothScrolling: initialState.smoothScrolling,
                        proxyEnabled: initialState.proxyEnabled,
                        proxyServer: initialState.proxyServer,
                    },
                    privacy: {
                        clearBrowsingDataOnExit: initialState.clearBrowsingDataOnExit,
                        historyEnabled: initialState.historyEnabled,
                        saveFormData: initialState.saveFormData,
                        doNotTrack: initialState.doNotTrack,
                    },
                    developer: {
                        devToolsEnabled: initialState.devToolsEnabled,
                        experimentalFeatures: initialState.experimentalFeatures,
                        allowUnsafeScripts: initialState.allowUnsafeScripts,
                        showDebugInfo: initialState.showDebugInfo,
                    },
                };
                set(sectionDefaults[section] || {});
            },
            resetAll: () => set(initialState),
        }),
        {
            name: 'saturn-settings',
        }
    )
);
