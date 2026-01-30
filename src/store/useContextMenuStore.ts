import { create } from 'zustand';

interface ContextMenuState {
    isOpen: boolean;
    type: 'context-menu' | 'selection-popup';
    x: number;
    y: number;
    selectedText: string;
    openMenu: (x: number, y: number, text: string) => void;
    showSelectionMenu: (x: number, y: number, text: string) => void; // Non-blocking, subtle popup
    closeMenu: () => void;
}

export const useContextMenuStore = create<ContextMenuState>((set) => ({
    isOpen: false,
    type: 'context-menu',
    x: 0,
    y: 0,
    selectedText: '',
    openMenu: (x, y, text) => set({ isOpen: true, type: 'context-menu', x, y, selectedText: text }),
    showSelectionMenu: (x, y, text) => set({ isOpen: true, type: 'selection-popup', x, y, selectedText: text }),
    closeMenu: () => set({ isOpen: false }),
}));
