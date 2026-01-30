import React, { useState, useEffect } from 'react';
import { useContextMenuStore } from '../store/useContextMenuStore';
import { useTabStore } from '../store/useTabStore';
import { useNotesStore } from '../store/useNotesStore';
import { Copy, Search, Sparkles, FileText, Settings, X, Volume2, BookmarkPlus, Languages, Share2 } from 'lucide-react';

export const ContextMenu: React.FC = () => {
    const { isOpen, x, y, selectedText, closeMenu, type } = useContextMenuStore();
    const { isSidebarOpen, toggleSidebar } = useTabStore();
    const { folders, addNote } = useNotesStore();

    // We would use useAIController but we might need to manipulate the sidebar input directly or send a message
    // For now, let's just assume we open the sidebar.

    const [showNotionSettings, setShowNotionSettings] = useState(false);
    const [notionKey, setNotionKey] = useState(localStorage.getItem('saturn-notion-key') || '');
    const [notionPageId, setNotionPageId] = useState(localStorage.getItem('saturn-notion-page') || '');

    useEffect(() => {
        const handleClick = () => closeMenu();
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, [closeMenu]);

    const handleCopy = () => {
        navigator.clipboard.writeText(selectedText);
        closeMenu();
    };

    const handleSearch = () => {
        if (selectedText) {
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(selectedText.trim())}`;
            useTabStore.getState().addTab(searchUrl);
        }
        closeMenu();
    };

    const handleDeepSearch = () => {
        if (selectedText) {
            const searchUrl = `https://www.perplexity.ai/search?q=${encodeURIComponent(selectedText.trim())}`;
            useTabStore.getState().addTab(searchUrl);
        }
        closeMenu();
    };

    const handleAddToJessiSpace = async (folderId: string) => {
        if (!selectedText) return;

        await addNote({
            content: selectedText,
            folderId: folderId,
            sourceUrl: window.location.href // This might be the app's URL, not the webview's.Ideally we get it from active tab.
        });
        // We might want to show a toast or notification here
        // alert(`Added to ${folders.find(f => f.id === folderId)?.name}`);
        closeMenu();
    };

    const handleAskAI = () => {
        if (!isSidebarOpen) toggleSidebar();
        // Here we'd ideally emit an event or update store to pre-fill the AI input
        // For now: Just open sidebar.
        closeMenu();
    };

    const handleSaveToNotion = async () => {
        const storedKey = localStorage.getItem('saturn-notion-key');
        const storedPage = localStorage.getItem('saturn-notion-page');

        if (!storedKey || !storedPage) {
            setShowNotionSettings(true);
            return;
        }

        // Trigger IPC call to Main process to save to Notion
        // We use window.ipcRenderer directly
        try {
            // @ts-ignore
            window.ipcRenderer.send('save-to-notion', {
                text: selectedText,
                apiKey: storedKey,
                pageId: storedPage
            });
            alert("Sent to Notion!");
        } catch (e) {
            alert("Failed to send to Notion");
        }
        closeMenu();
    };

    const saveNotionSettings = () => {
        localStorage.setItem('saturn-notion-key', notionKey);
        localStorage.setItem('saturn-notion-page', notionPageId);
        setShowNotionSettings(false);
        // Retry save if we have text?
        if (selectedText) handleSaveToNotion();
    };

    if (showNotionSettings) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={(e) => e.stopPropagation()}>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-96 shadow-2xl space-y-4">
                    <div className="flex justify-between items-center text-white mb-2">
                        <h2 className="text-lg font-semibold flex items-center gap-2"><Settings size={18} /> Notion Setup</h2>
                        <button onClick={() => setShowNotionSettings(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 uppercase font-bold">Internal Integration Token</label>
                        <input
                            value={notionKey}
                            onChange={e => setNotionKey(e.target.value)}
                            type="password"
                            placeholder="secret_..."
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs text-slate-400 uppercase font-bold">Page ID (Parent)</label>
                        <input
                            value={notionPageId}
                            onChange={e => setNotionPageId(e.target.value)}
                            placeholder="32 character ID"
                            className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white text-sm focus:border-indigo-500 outline-none"
                        />
                        <p className="text-[10px] text-slate-500">The ID of the page where you want to append blocks.</p>
                    </div>

                    <button
                        onClick={saveNotionSettings}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-lg transition-colors"
                    >
                        Save Configuration
                    </button>
                </div>
            </div>
        )
    }

    const [isVisible, setIsVisible] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            setIsClosing(false);
        } else if (isVisible) {
            // Start closing animation
            setIsClosing(true);
            const timer = setTimeout(() => {
                setIsVisible(false);
                setIsClosing(false);
            }, 150); // Match CSS animation duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isVisible && !isOpen) return null;

    // Adjust position to stay on screen
    const menuStyle = {
        top: Math.min(y, window.innerHeight - (type === 'selection-popup' ? 80 : 300)),
        left: Math.min(x, window.innerWidth - (type === 'selection-popup' ? 140 : 250)),
    };

    const handleReadAloud = () => {
        if (!selectedText) return;
        const utterance = new SpeechSynthesisUtterance(selectedText);
        window.speechSynthesis.speak(utterance);
        closeMenu();
    };

    const handleQuickSave = async () => {
        if (!selectedText) return;
        await addNote({
            content: selectedText,
            folderId: 'Personal',
            sourceUrl: window.location.href
        });
        closeMenu();
    };

    const handleTranslate = () => {
        if (!selectedText) return;
        const translateUrl = `https://translate.google.com/?sl=auto&tl=en&text=${encodeURIComponent(selectedText.trim())}&op=translate`;
        useTabStore.getState().addTab(translateUrl);
        closeMenu();
    };

    const handleShare = () => {
        if (!selectedText) return;
        // Share to X (Twitter)
        const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(selectedText.trim())}`;
        useTabStore.getState().addTab(shareUrl);
        closeMenu();
    };

    if (type === 'selection-popup') {
        return (
            <div
                className={`fixed z-50 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md border border-indigo-500/30 rounded-full shadow-xl px-2 py-1.5 animation-scale-in text-slate-200 ${isClosing ? 'animation-fade-out' : 'animation-fade-in'}`}
                style={{ ...menuStyle, transform: 'translate(-50%, -120%)' }} // Center above selection
                onClick={(e) => e.stopPropagation()}
            >
                <button onClick={handleAskAI} className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 rounded-full transition-colors whitespace-nowrap">
                    <Sparkles size={14} className="text-indigo-400" /> Ask Jessi
                </button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <button onClick={handleReadAloud} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Read Aloud">
                    <Volume2 size={14} />
                </button>
                <button onClick={handleQuickSave} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Quick Save to Personal">
                    <BookmarkPlus size={14} />
                </button>
                <button onClick={handleTranslate} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Translate">
                    <Languages size={14} />
                </button>
                <button onClick={handleShare} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Share to X">
                    <Share2 size={14} />
                </button>
                <button onClick={handleCopy} className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors" title="Copy">
                    <Copy size={14} />
                </button>
                <button onClick={handleDeepSearch} className="p-1.5 text-slate-400 hover:text-teal-400 hover:bg-white/10 rounded-full transition-colors" title="Deep Search">
                    <Search size={14} />
                </button>
                {/* Close X */}
                <button onClick={() => closeMenu()} className="p-1.5 text-slate-500 hover:text-white rounded-full transition-colors">
                    <X size={12} />
                </button>
            </div>
        );
    }

    return (
        <div
            className={`fixed z-50 w-64 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl shadow-2xl py-1.5 overflow-hidden flex flex-col text-slate-200 ${isClosing ? 'animation-fade-out' : 'animation-fade-in'}`}
            style={menuStyle}
            onClick={(e) => e.stopPropagation()} // Prevent closing immediately
        >
            <div className="px-3 py-2 border-b border-white/5 mb-1 bg-white/5">
                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Selected Text</p>
                <p className="text-slate-200 text-sm truncate italic opacity-80" style={{ maxWidth: '100%' }}>"{selectedText.substring(0, 25)}..."</p>
            </div>

            <button onClick={handleCopy} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                <Copy size={16} className="text-slate-400 group-hover:text-white" /> Copy
            </button>

            <button onClick={handleSearch} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                <Search size={16} className="text-slate-400 group-hover:text-white" /> Google Search
            </button>

            <button onClick={handleDeepSearch} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                {/* Using Sparkles as generic AI Icon or we can omit icon */}
                <Sparkles size={16} className="text-teal-400 group-hover:text-white" /> Deep Search (Perplexity)
            </button>

            <button onClick={handleAskAI} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                <Sparkles size={16} className="text-indigo-400 group-hover:text-white" /> Ask Jessi
            </button>

            <div className="h-px bg-white/10 my-1 mx-2" />

            <div className="px-4 py-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Add to Jessi Space
            </div>

            {/* Folder List */}
            <div className="max-h-32 overflow-y-auto custom-scrollbar">
                {folders.length === 0 && (
                    <button onClick={() => handleAddToJessiSpace('Personal')} className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                        <FileText size={14} className="text-slate-500 group-hover:text-white" /> Personal
                    </button>
                )}
                {folders.map(folder => (
                    <button
                        key={folder.id}
                        onClick={() => handleAddToJessiSpace(folder.id)}
                        className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group"
                    >
                        {/* We could use a Folder icon here if we import it, defaulting to FileText for now as in original imports */}
                        <FileText size={14} className="text-slate-500 group-hover:text-white" /> {folder.name}
                    </button>
                ))}
            </div>

            <div className="h-px bg-white/10 my-1 mx-2" />

            <button onClick={handleSaveToNotion} className="flex items-center gap-3 px-4 py-2 text-sm hover:bg-indigo-600 hover:text-white transition-colors text-left group">
                <FileText size={16} className="text-slate-400 group-hover:text-white" /> Save to Notion
            </button>
        </div>
    );
};
