import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface NtpState {
    showTasks: boolean;
    showStats: boolean;
    showClock: boolean;
    showTopSites: boolean;
    showSearch: boolean;
    backgroundImage: string;
    isCustomizeOpen: boolean;

    toggleTasks: () => void;
    toggleStats: () => void;
    toggleClock: () => void;
    toggleTopSites: () => void;
    toggleSearch: () => void;
    setBackgroundImage: (url: string) => void;
    toggleCustomize: () => void;
}

export const useNtpStore = create<NtpState>()(
    persist(
        (set) => ({
            showTasks: true,
            showStats: true,
            showClock: true,
            showTopSites: true,
            showSearch: true,
            // Default to the one currently in NewTabPage
            backgroundImage: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop",
            isCustomizeOpen: false,

            toggleTasks: () => set((state) => ({ showTasks: !state.showTasks })),
            toggleStats: () => set((state) => ({ showStats: !state.showStats })),
            toggleClock: () => set((state) => ({ showClock: !state.showClock })),
            toggleTopSites: () => set((state) => ({ showTopSites: !state.showTopSites })),
            toggleSearch: () => set((state) => ({ showSearch: !state.showSearch })),
            setBackgroundImage: (url) => set({ backgroundImage: url }),
            toggleCustomize: () => set((state) => ({ isCustomizeOpen: !state.isCustomizeOpen })),
        }),
        {
            name: 'ntp-storage',
        }
    )
);

