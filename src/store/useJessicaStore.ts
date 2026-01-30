import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Model {
    name: string;
    size?: number;
    digest?: string;
    details?: {
        format?: string;
        family?: string;
        families?: string[];
        parameter_size?: string;
        quantization_level?: string;
    }
}

interface JessicaState {
    // Layout
    tabLayout: 'horizontal' | 'vertical'; // top vs left

    // AI / Ollama
    ollamaHost: string;
    selectedModel: string;
    availableModels: Model[];

    // Shortcuts
    numPadShortcuts: Record<string, string>;

    // Actions
    setTabLayout: (layout: 'horizontal' | 'vertical') => void;
    setOllamaHost: (host: string) => void;
    setSelectedModel: (model: string) => void;
    setNumPadShortcut: (key: string, url: string) => void;
    fetchModels: () => Promise<void>;
}

export const useJessicaStore = create<JessicaState>()(
    persist(
        (set, get) => ({
            tabLayout: 'vertical',
            ollamaHost: 'http://localhost:11434',
            selectedModel: 'llama3', // Default attempt
            availableModels: [],

            numPadShortcuts: { '0': '', '1': '', '2': '', '3': '', '4': '', '5': '', '6': '', '7': '', '8': '', '9': '' },

            setTabLayout: (layout) => set({ tabLayout: layout }),
            setOllamaHost: (host) => set({ ollamaHost: host }),
            setSelectedModel: (model) => set({ selectedModel: model }),
            setNumPadShortcut: (key, url) => set(state => ({ numPadShortcuts: { ...state.numPadShortcuts, [key]: url } })),

            fetchModels: async () => {
                const { ollamaHost } = get();
                try {
                    const res = await fetch(`${ollamaHost}/api/tags`);
                    if (!res.ok) throw new Error('Failed to fetch models');
                    const data = await res.json();
                    set({ availableModels: data.models || [] });
                } catch (e) {
                    console.error("Failed to fetch Ollama models:", e);
                    set({ availableModels: [] });
                }
            }
        }),
        {
            name: 'jessica-settings',
        }
    )
);
