import React, { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { useNotesStore } from '../store/useNotesStore';
import { StickyNote, Download } from 'lucide-react';

export const DropZone: React.FC = () => {
    const [isDragging, setIsDragging] = useState(false);
    const [isHoveringZone, setIsHoveringZone] = useState(false);
    const { addNote } = useNotesStore();
    const { toggleSidebar, tabs, activeTabId } = useTabStore();

    // We need to listen to drag events globally. 
    // Since drags originate from the <webview>, we might need to hook into the active webview's events via IPC or simple window events if it bubbles (it usually doesn't cross frame well).
    // However, Electron webviews have 'console-message' etc. For drag, we might need to inject code or handle 'ipc-message'.
    // A simpler approach for V1: Detect mouse location or check if we can catch the drag on the window.
    // Actually, capturing drag from a webview in the host is tricky. 
    //
    // ALTERNATIVE: The user might be dragging from the "Ask AI" panel or other parts of the UI.
    //
    // IF we can't easily detect the start of a drag inside the webview without preload scripts:
    // We will assume this DropZone works primarily for text dragged *successfully* out of the webview or from other app parts.
    // HTML5 DnD: The 'dragenter' event on the document should fire when dragging *into* the app window (even from webview).

    useEffect(() => {
        let dragTimeout: any;

        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault(); // allow drop
            // Check if it's text
            if (e.dataTransfer?.types.includes('text/plain')) {
                setIsDragging(true);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault(); // allow drop
            clearTimeout(dragTimeout);
        };

        const handleDragLeave = (e: DragEvent) => {
            // Debounce leaving to prevent flickering
            dragTimeout = setTimeout(() => {
                // setIsDragging(false); // We keep it open if we are just moving mouse
                // Actually we want to close if we leave the WINDOW.
                if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
                    setIsDragging(false);
                }
            }, 100);
        };

        const handleDrop = async (e: DragEvent) => {
            setIsDragging(false);
            e.preventDefault();
            // If dropped ON THE ZONE, it is handled by the zone's onDrop. 
            // This global one is just to reset state if dropped elsewhere.
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('drop', handleDrop);
        };
    }, []);

    const handleZoneDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const text = e.dataTransfer.getData('text/plain');
        if (text) {
            const activeTab = tabs.find(t => t.id === activeTabId);
            const sourceUrl = activeTab && activeTab.url !== 'saturn://newtab' ? activeTab.url : 'Dragged Content';
            addNote({ content: text, sourceUrl });
            toggleSidebar('notes');
        }
    };

    if (!isDragging) return null;

    return (
        <div
            className={`fixed right-0 top-1/4 h-1/2 w-32 z-50 transition-transform duration-300 ${isDragging ? 'translate-x-0' : 'translate-x-full'}`}
        >
            <div
                className={`w-full h-full rounded-l-3xl shadow-2xl flex flex-col items-center justify-center gap-4 transition-colors border-l-4 border-dashed
                    ${isHoveringZone ? 'bg-indigo-600 border-white/50 scale-105' : 'bg-slate-900/90 border-indigo-500 backdrop-blur-md'}
                `}
                onDragEnter={() => setIsHoveringZone(true)}
                onDragLeave={() => setIsHoveringZone(false)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleZoneDrop}
            >
                <div className={`p-4 rounded-full ${isHoveringZone ? 'bg-white/20' : 'bg-indigo-600'}`}>
                    {isHoveringZone ? <Download className="text-white animate-bounce" size={32} /> : <StickyNote className="text-white" size={32} />}
                </div>
                <p className="text-white font-bold text-center text-sm px-2">
                    {isHoveringZone ? "Drop it!" : "Drop to Save"}
                </p>
            </div>
        </div>
    );
};
