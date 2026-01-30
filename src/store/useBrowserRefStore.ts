import { create } from 'zustand';

interface BrowserRefState {
    webviewRefs: Record<string, any>; // Using any for WebviewTag temporarily to avoid type battles
    setWebviewRef: (tabId: string, ref: any) => void;
    removeWebviewRef: (tabId: string) => void;
    getWebview: (tabId: string) => any | undefined;
}

export const useBrowserRefStore = create<BrowserRefState>((set, get) => ({
    webviewRefs: {},
    setWebviewRef: (tabId, ref) => set((state) => ({
        webviewRefs: { ...state.webviewRefs, [tabId]: ref }
    })),
    removeWebviewRef: (tabId) => set((state) => {
        const { [tabId]: _, ...rest } = state.webviewRefs;
        return { webviewRefs: rest };
    }),
    getWebview: (tabId) => get().webviewRefs[tabId],
}));
