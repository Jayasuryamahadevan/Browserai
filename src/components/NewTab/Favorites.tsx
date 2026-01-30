import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { useTabStore } from '../../store/useTabStore';

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

export const Favorites: React.FC = () => {
    const [favorites, setFavorites] = useState<Favorite[]>(() => {
        const saved = localStorage.getItem('saturn-favorites');
        return saved ? JSON.parse(saved) : DEFAULT_FAVORITES;
    });
    const [isAdding, setIsAdding] = useState(false);
    const [newUrl, setNewUrl] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [mounted, setMounted] = useState(false);
    const { activeTabId, updateTab } = useTabStore();

    useEffect(() => {
        setMounted(true);
        localStorage.setItem('saturn-favorites', JSON.stringify(favorites));
    }, [favorites]);

    const handleNavigate = (url: string) => {
        if (activeTabId) {
            updateTab(activeTabId, { url });
        }
    };

    const addFavorite = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newUrl) return;

        let cleanUrl = newUrl;
        if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;

        const domain = new URL(cleanUrl).hostname;
        const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;

        const newFav: Favorite = {
            id: crypto.randomUUID(),
            title: newTitle || domain,
            url: cleanUrl,
            icon
        };

        setFavorites([...favorites, newFav]);
        setIsAdding(false);
        setNewUrl('');
        setNewTitle('');
    };

    const removeFavorite = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setFavorites(favorites.filter(f => f.id !== id));
    };

    return (
        <div className={`w-full max-w-4xl mx-auto mt-12 transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
            }`}>
            <div className="flex flex-wrap items-center justify-center gap-6">
                {favorites.map((fav, index) => (
                    <div
                        key={fav.id}
                        onClick={() => handleNavigate(fav.url)}
                        className="group relative flex flex-col items-center justify-center cursor-pointer"
                        style={{
                            animationDelay: `${index * 50}ms`,
                            transitionDelay: mounted ? `${index * 50}ms` : '0ms'
                        }}
                    >
                        <div className="w-16 h-16 mb-2 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 shadow-lg group-hover:bg-white/20 group-hover:scale-110 group-active:scale-95 transition-all duration-300 relative">
                            <button
                                onClick={(e) => removeFavorite(e, fav.id)}
                                className="absolute -top-1 -right-1 p-0.5 bg-neutral-800/80 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500 border border-white/10"
                            >
                                <X size={10} className="text-white" />
                            </button>
                            <img src={fav.icon} alt={fav.title} className="w-8 h-8 object-cover rounded shadow-sm" onError={(e) => (e.currentTarget.src = '')} />
                        </div>
                        <span className="text-xs font-medium text-white/90 drop-shadow-md group-hover:text-white transition-colors max-w-[80px] truncate text-center">{fav.title}</span>
                    </div>
                ))}

                <button
                    onClick={() => setIsAdding(true)}
                    className="flex flex-col items-center justify-center group"
                >
                    <div className="w-16 h-16 mb-2 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/5 border-dashed group-hover:border-white/20 group-hover:bg-white/10 group-hover:scale-105 transition-all duration-300">
                        <Plus size={20} className="text-white/50 group-hover:text-white/80" />
                    </div>
                    <span className="text-xs font-medium text-white/50 group-hover:text-white/80">Add</span>
                </button>
            </div>

            {/* Modal with fade animation */}
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all duration-300 ${isAdding ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsAdding(false)}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    className={`w-full max-w-md p-6 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl transition-all duration-300 ${isAdding ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
                        }`}
                >
                    <h3 className="text-lg font-semibold text-white mb-4">Add Shortcut</h3>
                    <form onSubmit={addFavorite} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Name</label>
                            <input
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="My Site"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">URL</label>
                            <input
                                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200"
                                value={newUrl}
                                onChange={e => setNewUrl(e.target.value)}
                                placeholder="example.com"
                                autoFocus={isAdding}
                            />
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setIsAdding(false)}
                                className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
                            >
                                Add Shortcut
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
