import { create } from 'zustand';


export interface Folder {
    id: string;
    name: string;
    isDefault?: boolean;
}

export interface Note {
    id: string;
    content: string;
    createdAt: number;
    color?: string; // For that Google Keep feel
    sourceUrl?: string; // If clipped from web
    folderId?: string; // New: Folder association
}

interface NotesState {
    notes: Note[];
    folders: Folder[];
    activeFolderId: string; // 'all' or specific UUID

    fetchData: () => Promise<void>;
    addNote: (note: Omit<Note, 'id' | 'createdAt'>) => Promise<void>;
    deleteNote: (id: string) => Promise<void>;
    updateNote: (id: string, content: string) => Promise<void>;

    addFolder: (name: string) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    setActiveFolder: (id: string) => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
    notes: [],
    folders: [],
    activeFolderId: 'all',

    fetchData: async () => {
        try {
            // @ts-ignore
            const folders = await window.ipcRenderer.invoke('jessica-list-folders');
            // @ts-ignore
            const notes = await window.ipcRenderer.invoke('jessica-list-notes');
            set({ folders, notes: notes.sort((a: any, b: any) => b.createdAt - a.createdAt) });
        } catch (e) {
            console.error("Failed to fetch Jessica's space data", e);
        }
    },

    addNote: async (noteData) => {
        const { activeFolderId, fetchData } = get();
        // If 'all', default to Personal (handled by backend or we explicit here)
        const folderId = activeFolderId === 'all' ? 'Personal' : activeFolderId;

        const newNote = {
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            color: ['bg-yellow-100', 'bg-green-100', 'bg-blue-100', 'bg-red-100', 'bg-purple-100'][Math.floor(Math.random() * 5)],
            folderId,
            ...noteData
        };

        // @ts-ignore
        await window.ipcRenderer.invoke('jessica-save-note', newNote);
        await fetchData();
    },

    deleteNote: async (id) => {
        const note = get().notes.find(n => n.id === id);
        if (!note) return;
        // @ts-ignore
        await window.ipcRenderer.invoke('jessica-delete-note', { id, folderId: note.folderId });
        await get().fetchData();
    },

    updateNote: async (id, content) => {
        const note = get().notes.find(n => n.id === id);
        if (!note) return;
        const updatedNote = { ...note, content };
        // @ts-ignore
        await window.ipcRenderer.invoke('jessica-save-note', updatedNote);
        await get().fetchData();
    },

    addFolder: async (name) => {
        // @ts-ignore
        await window.ipcRenderer.invoke('jessica-create-folder', name);
        await get().fetchData();
    },

    deleteFolder: async (id) => {
        // @ts-ignore
        await window.ipcRenderer.invoke('jessica-delete-folder', id);
        set(state => ({
            activeFolderId: state.activeFolderId === id ? 'all' : state.activeFolderId
        }));
        await get().fetchData();
    },

    setActiveFolder: (id) => set({ activeFolderId: id }),
}));
