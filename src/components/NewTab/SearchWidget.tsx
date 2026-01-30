import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Zap } from 'lucide-react';
import { useTabStore } from '../../store/useTabStore';
import { useSearchEngine } from '../../hooks/useApplySettings';

export const SearchWidget: React.FC = () => {
    const [query, setQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [focused, setFocused] = useState(false);
    const [isDeepSearch, setIsDeepSearch] = useState(false);
    const { activeTabId, updateTab, addTab } = useTabStore();
    const { getSearchUrl } = useSearchEngine();

    const [selectedProviders, setSelectedProviders] = useState<string[]>(['perplexity']);

    const providers = [
        { id: 'perplexity', name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=' },
        { id: 'gemini', name: 'Gemini', url: 'https://gemini.google.com/app?q=' },
        { id: 'chatgpt', name: 'ChatGPT', url: 'https://chatgpt.com/?q=' },
        { id: 'grok', name: 'Grok', url: 'https://x.com/i/grok?q=' },
        { id: 'claude', name: 'Claude', url: 'https://claude.ai/new?q=' }
    ];

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleProvider = (id: string) => {
        setSelectedProviders(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || !activeTabId) return;

        if (isDeepSearch) {
            // Open tabs for all selected providers
            selectedProviders.forEach((providerId, index) => {
                const provider = providers.find(p => p.id === providerId);
                if (provider) {
                    const targetUrl = `${provider.url}${encodeURIComponent(query)}`;
                    if (index === 0) {
                        // Use current tab for the first one
                        updateTab(activeTabId, { url: targetUrl, title: `Deep Search: ${provider.name}` });
                    } else {
                        addTab(targetUrl);
                    }
                }
            });
        } else {
            let url = query;
            if (!url.startsWith('http')) {
                if (url.includes('.') && !url.includes(' ')) {
                    url = `https://${url}`;
                } else {
                    // Use configured search engine from settings
                    url = getSearchUrl(url);
                }
            }
            updateTab(activeTabId, { url, title: 'Loading...' });
        }
    };

    return (
        <form
            onSubmit={handleSearch}
            className={`relative w-full max-w-2xl mx-auto transition-all duration-300 flex flex-col items-center gap-3 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
                }`}
        >
            <div className={`relative w-full`}>
                <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-200 z-10 ${focused ? 'text-zinc-300' : 'text-zinc-500'
                    }`}>
                    {isDeepSearch ? <Sparkles className="h-4 w-4" /> : <Search className="h-4 w-4" />}
                </div>

                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setFocused(false)}
                    placeholder={isDeepSearch ? "Deep research..." : "Search or type URL"}
                    className={`block w-full pl-11 pr-28 py-3 bg-slate-900/80 border rounded-lg text-white placeholder-zinc-400 focus:outline-none text-base transition-all duration-200 shadow-lg ${focused
                        ? 'border-cyan-500/50 ring-1 ring-cyan-500/30'
                        : 'border-white/10 hover:border-white/20'
                        }`}
                    autoFocus
                />

                {/* Deep Search Toggle */}
                <div className="absolute inset-y-0 right-1.5 flex items-center">
                    <button
                        type="button"
                        onClick={() => setIsDeepSearch(!isDeepSearch)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${isDeepSearch
                            ? 'bg-cyan-500 text-black hover:bg-cyan-400'
                            : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white'
                            }`}
                    >
                        <Zap size={12} className={isDeepSearch ? 'fill-black' : ''} />
                        <span>Deep</span>
                    </button>
                </div>
            </div>

            {/* Provider Selection */}
            <div className={`w-full transition-all duration-300 overflow-hidden ${isDeepSearch ? 'max-h-16 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                <div className="flex justify-center gap-1.5 flex-wrap">
                    {providers.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => toggleProvider(p.id)}
                            className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${selectedProviders.includes(p.id)
                                ? 'bg-zinc-700 text-white'
                                : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300'
                                }`}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>
        </form>
    );
};
