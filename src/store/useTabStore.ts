import { create } from 'zustand';

export interface Tab {
    id: string;
    url: string;
    title: string;
    favicon?: string; // URL to favicon
    isLoading?: boolean;
    isMuted?: boolean;
}

interface TabState {
    tabs: Tab[];
    activeTabId: string | null;
    isSidebarOpen: boolean;
    sidebarView: 'ai' | 'notes' | 'projects' | 'memory';
    isSettingsOpen: boolean; // Brave-like Settings Menu

    addTab: (url?: string) => void;
    removeTab: (id: string) => void;
    updateTab: (id: string, updates: Partial<Tab>) => void;
    setActiveTab: (id: string) => void;
    toggleSidebar: (view?: 'ai' | 'notes' | 'projects' | 'memory') => void;
    toggleSettings: () => void;
    isCalendarOpen: boolean;
    toggleCalendar: () => void;
    isMediaOpen: boolean;
    toggleMedia: () => void;
}

export const useTabStore = create<TabState>((set, get) => ({
    tabs: [
        { id: '1', url: 'saturn://newtab', title: 'New Tab', isLoading: false }
    ],
    activeTabId: '1',
    sidebarView: 'ai',
    isSidebarOpen: false,
    isSettingsOpen: false,

    addTab: (url) => {
        const newTab: Tab = {
            id: crypto.randomUUID(),
            url: url || 'saturn://newtab',
            title: url ? 'Loading...' : 'New Tab',
            isLoading: !!url
        };
        set(state => ({ tabs: [...state.tabs, newTab], activeTabId: newTab.id }));
    },
    removeTab: (id) => {
        const { tabs, activeTabId } = get();
        const newTabs = tabs.filter(t => t.id !== id);
        if (newTabs.length === 0) {
            // Don't close last tab, just reset it? Or allow closing app?
            // For now, keep at least one tab or create new one
            const newTab = { id: crypto.randomUUID(), url: 'saturn://newtab', title: 'New Tab' };
            set({ tabs: [newTab], activeTabId: newTab.id });
            return;
        }

        let newActiveId = activeTabId;
        if (id === activeTabId) {
            const index = tabs.findIndex(t => t.id === id);
            // Try to go into next tab, or previous
            const nextTab = newTabs[index] || newTabs[index - 1];
            newActiveId = nextTab.id;
        }
        set({ tabs: newTabs, activeTabId: newActiveId });
    },
    updateTab: (id, updates) => {
        set(state => ({
            tabs: state.tabs.map(t => t.id === id ? { ...t, ...updates } : t)
        }));
    },
    setActiveTab: (id) => set({ activeTabId: id }),
    toggleSidebar: (view) => set(state => {
        if (view) {
            if (state.isSidebarOpen && state.sidebarView === view) {
                return { isSidebarOpen: false };
            }
            return { isSidebarOpen: true, sidebarView: view };
        }
        return { isSidebarOpen: !state.isSidebarOpen };
    }),
    toggleSettings: () => set(state => ({ isSettingsOpen: !state.isSettingsOpen })),
    isCalendarOpen: false,
    toggleCalendar: () => set(state => ({ isCalendarOpen: !state.isCalendarOpen })),
    isMediaOpen: false,
    toggleMedia: () => set(state => ({ isMediaOpen: !state.isMediaOpen })),
}));
