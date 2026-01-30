import React, { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Star, Globe, Trash2, ExternalLink, Bookmark, Plus } from 'lucide-react';

interface Favorite {
    id: string;
    title: string;
    url: string;
    icon?: string;
}

const DEFAULT_FAVORITES: Favorite[] = [
    { id: '1', title: 'Google', url: 'https://google.com', icon: 'https://www.google.com/favicon.ico' },
    { id: '2', title: 'YouTube', url: 'https://youtube.com', icon: 'https://www.youtube.com/favicon.ico' },
    { id: '3', title: 'GitHub', url: 'https://github.com', icon: 'https://github.com/favicon.ico' },
    { id: '4', title: 'Gmail', url: 'https://mail.google.com', icon: 'https://mail.google.com/favicon.ico' },
    { id: '5', title: 'ChatGPT', url: 'https://chat.openai.com', icon: 'https://chat.openai.com/favicon.ico' },
];

export const BookmarksSidebar: React.FC = () => {
    const { activeTabId, updateTab, tabs } = useTabStore();
    const [isHovered, setIsHovered] = useState(false);
    const [favorites, setFavorites] = useState<Favorite[]>(() => {
        const saved = localStorage.getItem('saturn-favorites');
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });

    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('saturn-favorites');
            if (saved) setFavorites(JSON.parse(saved));
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleNavigate = (url: string) => {
        if (activeTabId) {
            updateTab(activeTabId, { url });
        }
    };

    const handleRemove = (id: string) => {
        const newFavorites = favorites.filter(f => f.id !== id);
        setFavorites(newFavorites);
        localStorage.setItem('saturn-favorites', JSON.stringify(newFavorites));
    };

    const handleAddCurrent = () => {
        const currentTab = tabs.find(t => t.id === activeTabId);
        if (currentTab && currentTab.url !== 'saturn://newtab') {
            const newFavorite: Favorite = {
                id: crypto.randomUUID(),
                title: currentTab.title || 'Untitled',
                url: currentTab.url,
                icon: currentTab.favicon
            };
            const newFavorites = [...favorites, newFavorite];
            setFavorites(newFavorites);
            localStorage.setItem('saturn-favorites', JSON.stringify(newFavorites));
        }
    };

    return (
        <div
            className="fixed top-12 right-0 h-[calc(100%-48px)] z-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Hover Trigger Zone */}
            <div className="absolute top-0 right-0 w-2 h-full" />

            {/* Expanding Sidebar Panel */}
            <motion.div
                initial={{ width: '0.5rem', opacity: 0.3 }}
                animate={{
                    width: isHovered ? '18rem' : '0.5rem',
                    opacity: isHovered ? 1 : 0.3
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                className={clsx(
                    "absolute top-0 right-0 h-full overflow-hidden flex flex-col",
                    "bg-black/95 backdrop-blur-xl border-l border-white/10 shadow-2xl"
                )}
            >
                {/* Header */}
                <div
                    className="flex items-center gap-3 px-4 py-4 border-b border-white/10 shrink-0"
                    style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                >
                    <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-500/30">
                        <Bookmark className="w-4 h-4 text-amber-400" />
                    </div>
                    <div>
                        <span className="text-sm font-semibold text-white tracking-wide">BOOKMARKS</span>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{favorites.length} SAVED</p>
                    </div>
                </div>

                {/* Bookmarks List */}
                <div
                    className="flex-1 overflow-y-auto px-3 py-3 space-y-1"
                    style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.15s' }}
                >
                    {favorites.map(fav => (
                        <div
                            key={fav.id}
                            className="group flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all cursor-pointer border border-transparent hover:border-white/10"
                            onClick={() => handleNavigate(fav.url)}
                        >
                            {/* Favicon */}
                            <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 overflow-hidden">
                                {fav.icon ? (
                                    <img
                                        src={fav.icon}
                                        className="w-5 h-5"
                                        onError={(e) => e.currentTarget.style.display = 'none'}
                                    />
                                ) : (
                                    <Globe className="w-4 h-4 text-zinc-500" />
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-white truncate">
                                    {fav.title}
                                </div>
                                <div className="text-[10px] text-zinc-500 truncate uppercase tracking-wide">
                                    {new URL(fav.url).hostname.replace('www.', '')}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNavigate(fav.url); }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-cyan-400 transition-colors"
                                    title="Open"
                                >
                                    <ExternalLink size={14} />
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleRemove(fav.id); }}
                                    className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-500 hover:text-red-400 transition-colors"
                                    title="Remove"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ))}

                    {favorites.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                            <Star className="w-8 h-8 text-zinc-700 mb-2" />
                            <p className="text-xs text-zinc-500 uppercase tracking-wider">NO BOOKMARKS YET</p>
                        </div>
                    )}
                </div>

                {/* Add Current Page Button */}
                <div
                    className="p-3 border-t border-white/10 shrink-0"
                    style={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}
                >
                    <button
                        onClick={handleAddCurrent}
                        className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 to-yellow-500/10 hover:from-amber-500/20 hover:to-yellow-500/20 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 transition-all text-sm font-medium uppercase tracking-wider"
                    >
                        <Plus size={16} />
                        <span>BOOKMARK THIS PAGE</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
