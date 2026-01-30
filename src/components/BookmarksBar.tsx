import React, { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { Plus, X, Globe, Grid } from 'lucide-react';
import { Reorder } from 'framer-motion';

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
];

export const BookmarksBar: React.FC = () => {
    const [favorites, setFavorites] = useState<Favorite[]>(() => {
        const saved = localStorage.getItem('saturn-favorites');
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });
    const { activeTabId, updateTab, tabs } = useTabStore();
    const [contextMenu, setContextMenu] = useState<{ x: number, y: number, id: string } | null>(null);

    useEffect(() => {
        const handleStorageChange = () => {
            const saved = localStorage.getItem('saturn-favorites');
            if (saved) setFavorites(JSON.parse(saved));
        };
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('click', () => setContextMenu(null));
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('click', () => setContextMenu(null));
        };
    }, []);

    const handleNavigate = (url: string) => {
        if (activeTabId) {
            updateTab(activeTabId, { url });
        }
    };

    const handleReorder = (newFavorites: Favorite[]) => {
        setFavorites(newFavorites);
        localStorage.setItem('saturn-favorites', JSON.stringify(newFavorites));
    };

    const handleAddBookmark = () => {
        const activeTab = tabs.find(t => t.id === activeTabId);
        if (!activeTab || !activeTab.url) return;

        if (favorites.some(f => f.url === activeTab.url)) return;

        const newFavorite: Favorite = {
            id: crypto.randomUUID(),
            title: activeTab.title || 'New Bookmark',
            url: activeTab.url,
            icon: activeTab.favicon
        };

        const newFavorites = [...favorites, newFavorite];
        handleReorder(newFavorites);
    };

    const handleContextMenu = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        setContextMenu({ x: e.clientX, y: e.clientY, id });
    };

    const removeFavorite = (id: string) => {
        const newFavorites = favorites.filter(f => f.id !== id);
        handleReorder(newFavorites);
        setContextMenu(null);
    };

    return (
        <div className="w-full flex justify-center z-30 my-1 pointer-events-none relative">
            <div className={`
                glass-panel rounded-xl flex items-center px-3 py-1.5 gap-2 
                pointer-events-auto transition-all duration-300 w-[calc(100%-1rem)] mx-2
                ${favorites.length === 0 ? 'opacity-0 h-0 overflow-hidden py-0 my-0' : 'opacity-100'}
            `}>

                {/* Apps Icon */}
                <button className="p-1.5 rounded-lg hover:bg-white/10 text-cyan-400/80 hover:text-cyan-300 transition-colors flex items-center gap-1 font-medium">
                    <Grid size={13} />
                </button>

                <div className="w-px h-3 bg-white/10 mx-0.5"></div>

                {/* Bookmarks List */}
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 mask-gradient-right">
                    <Reorder.Group
                        axis="x"
                        values={favorites}
                        onReorder={handleReorder}
                        className="flex items-center gap-1"
                    >
                        {favorites.map((fav) => (
                            <Reorder.Item
                                key={fav.id}
                                value={fav}
                                className="relative"
                                whileDrag={{ scale: 1.05, zIndex: 50 }}
                            >
                                <div
                                    onClick={() => handleNavigate(fav.url)}
                                    onContextMenu={(e) => handleContextMenu(e, fav.id)}
                                    className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-all group whitespace-nowrap cursor-pointer select-none border border-transparent hover:border-white/5"
                                    title={fav.url}
                                    role="button"
                                >
                                    {fav.icon ? (
                                        <img src={fav.icon} alt="" className="w-3.5 h-3.5 rounded-sm opacity-80 group-hover:opacity-100" onError={e => e.currentTarget.style.display = 'none'} />
                                    ) : (
                                        <Globe size={12} className="opacity-80 group-hover:opacity-100" />
                                    )}
                                    <span className="truncate max-w-[120px] text-xs font-medium">{fav.title}</span>
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>

                    {/* Add Bookmark Button */}
                    <button
                        onClick={handleAddBookmark}
                        className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-400/70 hover:text-emerald-300 transition-colors ml-1"
                        title="Bookmark this page"
                    >
                        <Plus size={13} />
                    </button>
                </div>

                {/* Context Menu for Remove */}
                {contextMenu && (
                    <div
                        className="fixed z-[100] glass-panel border border-white/10 rounded-xl shadow-2xl py-1 px-1 min-w-[120px] backdrop-blur-xl"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFavorite(contextMenu.id);
                            }}
                            className="w-full text-left px-3 py-2 flex items-center gap-2 text-red-400 hover:bg-white/5 hover:text-red-300 rounded-lg text-xs font-medium transition-colors"
                        >
                            <X size={13} />
                            Remove Bookmark
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
