import { create } from 'zustand';

export interface Memory {
    id: string;
    url: string;
    title: string;
    summary: string;
    content: string;
    engagement_score: number;
    timestamp: number;
    similarity?: number;
}

export interface MemoryStats {
    total_memories: number;
    index_size_mb: number;
    oldest_memory: number | null;
    newest_memory: number | null;
}

interface MemoryState {
    // State
    searchResults: Memory[];
    recentMemories: Memory[];
    stats: MemoryStats | null;
    isLoading: boolean;
    isEngineOnline: boolean;
    isStarting: boolean;
    searchQuery: string;
    error: string | null;

    // Actions
    search: (query: string) => Promise<void>;
    loadRecent: () => Promise<void>;
    loadStats: () => Promise<void>;
    deleteMemory: (id: string) => Promise<boolean>;
    checkHealth: () => Promise<void>;
    setSearchQuery: (query: string) => void;
    startEngine: () => Promise<boolean>;
    stopEngine: () => Promise<boolean>;
}

export const useMemoryStore = create<MemoryState>((set, get) => ({
    searchResults: [],
    recentMemories: [],
    stats: null,
    isLoading: false,
    isEngineOnline: false,
    isStarting: false,
    searchQuery: '',
    error: null,

    search: async (query: string) => {
        if (!query.trim()) {
            set({ searchResults: [], error: null });
            return;
        }

        set({ isLoading: true, error: null });

        try {
            const results = await (window as any).ipcRenderer.invoke('memory-search', query, 20);
            set({ searchResults: results || [], isLoading: false });
        } catch (e) {
            console.error('[Memory] Search error:', e);
            set({ searchResults: [], isLoading: false, error: 'Search failed' });
        }
    },

    loadRecent: async () => {
        try {
            const memories = await (window as any).ipcRenderer.invoke('memory-list', 50, 0);
            set({ recentMemories: memories || [] });
        } catch (e) {
            console.error('[Memory] Load recent error:', e);
        }
    },

    loadStats: async () => {
        try {
            const stats = await (window as any).ipcRenderer.invoke('memory-stats');
            set({ stats });
        } catch (e) {
            console.error('[Memory] Load stats error:', e);
        }
    },

    deleteMemory: async (id: string) => {
        try {
            const success = await (window as any).ipcRenderer.invoke('memory-delete', id);
            if (success) {
                // Remove from local state
                const { searchResults, recentMemories } = get();
                set({
                    searchResults: searchResults.filter(m => m.id !== id),
                    recentMemories: recentMemories.filter(m => m.id !== id)
                });
                // Refresh stats
                get().loadStats();
            }
            return success;
        } catch (e) {
            console.error('[Memory] Delete error:', e);
            return false;
        }
    },

    checkHealth: async () => {
        try {
            const isOnline = await (window as any).ipcRenderer.invoke('memory-health');
            set({ isEngineOnline: isOnline });
        } catch (e) {
            set({ isEngineOnline: false });
        }
    },

    setSearchQuery: (query: string) => {
        set({ searchQuery: query });
    },

    startEngine: async () => {
        set({ isStarting: true });
        try {
            const success = await (window as any).ipcRenderer.invoke('memory-start');
            set({ isEngineOnline: success, isStarting: false });
            if (success) {
                // Load data after starting
                get().loadStats();
                get().loadRecent();
            }
            return success;
        } catch (e) {
            console.error('[Memory] Start engine error:', e);
            set({ isStarting: false, isEngineOnline: false });
            return false;
        }
    },

    stopEngine: async () => {
        set({ isStarting: true });
        try {
            await (window as any).ipcRenderer.invoke('memory-stop');
            set({ isEngineOnline: false, isStarting: false });
            return true;
        } catch (e) {
            console.error('[Memory] Stop engine error:', e);
            set({ isStarting: false });
            return false;
        }
    }
}));
