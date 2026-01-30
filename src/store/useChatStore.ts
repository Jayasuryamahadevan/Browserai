import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

interface ChatState {
    messages: Message[];
    isTyping: boolean;

    // Actions
    addMessage: (role: 'user' | 'assistant', content: string) => void;
    setTyping: (typing: boolean) => void;
    clearHistory: () => void;
}

export const useChatStore = create<ChatState>()(
    persist(
        (set) => ({
            messages: [{
                role: 'assistant',
                content: 'Hello! I am Jessi, your agentic browser assistant. I remember our past conversations now. How can I help?',
                timestamp: Date.now()
            }],
            isTyping: false,

            addMessage: (role, content) => {
                const newMessage: Message = { role, content, timestamp: Date.now() };
                set(state => ({ messages: [...state.messages, newMessage] }));

                // --- EPISODIC MEMORY INDEXING ---
                // If it's a user message, save it to the Vector DB so Jessi can "remember" it later.
                if (role === 'user') {
                    try {
                        // @ts-ignore
                        if (typeof window !== 'undefined' && window.ipcRenderer) {
                            // @ts-ignore
                            window.ipcRenderer.invoke('memory-store', {
                                url: `chat://history/${Date.now()}`, // Unique ID for this utterance
                                title: `Chat Memory: ${content.substring(0, 30)}...`,
                                content: content, // The actual user statement
                                engagement: { timeSpent: 100, scrollDepth: 1, contentLength: content.length } // Mock engagement
                            });
                        }
                    } catch (e) {
                        console.error("[EpisodicMemory] Failed to index chat:", e);
                    }
                }
            },

            setTyping: (typing) => set({ isTyping: typing }),

            clearHistory: () => set({
                messages: [{
                    role: 'assistant',
                    content: 'Memory cleared. I am ready for a fresh start.',
                    timestamp: Date.now()
                }]
            })
        }),
        {
            name: 'jessi-chat-history', // key in localStorage
        }
    )
);
