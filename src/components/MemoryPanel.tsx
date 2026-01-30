import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabStore } from '../store/useTabStore';
import { useMemoryStore, Memory } from '../store/useMemoryStore';
import {
    Brain, Search, X, Clock, Trash2, ExternalLink,
    Sparkles, Database, Zap, Activity
} from 'lucide-react';

export function MemoryPanel() {
    const { isSidebarOpen, sidebarView, toggleSidebar, addTab } = useTabStore();
    const {
        searchResults,
        recentMemories,
        stats,
        isLoading,
        isEngineOnline,
        isStarting,
        searchQuery,
        search,
        loadRecent,
        loadStats,
        deleteMemory,
        checkHealth,
        setSearchQuery,
        startEngine,
        stopEngine
    } = useMemoryStore();

    const [showRecent, setShowRecent] = useState(true);

    // Check health and load data on mount - with retry for startup timing
    useEffect(() => {
        if (isSidebarOpen && sidebarView === 'memory') {
            // Initial check
            checkHealth();
            loadStats();
            loadRecent();

            // Poll for health while offline (engine might still be starting)
            const pollInterval = setInterval(() => {
                if (!isEngineOnline) {
                    console.log('[Memory] Polling health check...');
                    checkHealth();
                    loadStats();
                    loadRecent();
                } else {
                    clearInterval(pollInterval);
                }
            }, 3000); // Check every 3 seconds

            return () => clearInterval(pollInterval);
        }
    }, [isSidebarOpen, sidebarView, isEngineOnline]);

    // Debounced search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery.trim()) {
                search(searchQuery);
                setShowRecent(false);
            } else {
                setShowRecent(true);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleOpenUrl = (url: string) => {
        addTab(url);
        toggleSidebar();
    };

    const formatDate = (timestamp: number) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        return date.toLocaleDateString();
    };

    const memories = showRecent ? recentMemories : searchResults;

    if (!isSidebarOpen || sidebarView !== 'memory') return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 420, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="h-full bg-black border-l border-zinc-800/50 flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/50 bg-zinc-950/50">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
                            <Brain className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-sm font-medium text-zinc-100">Semantic Memory</span>
                        {isEngineOnline && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                <Activity className="w-3 h-3 text-emerald-400" />
                                <span className="text-[10px] text-emerald-400">Online</span>
                            </span>
                        )}
                    </div>
                    <button
                        onClick={() => toggleSidebar()}
                        className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Engine Toggle Control - Crystal Clear UI */}
                <div className="mx-3 mt-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {/* Status Indicator */}
                            {isStarting ? (
                                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                            ) : isEngineOnline ? (
                                <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                            ) : (
                                <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                            )}
                            <span className="text-sm text-zinc-300">Memory Engine</span>
                            {/* Status Badge */}
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isStarting
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : isEngineOnline
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {isStarting ? (isEngineOnline ? 'STOPPING' : 'STARTING') : isEngineOnline ? 'RUNNING' : 'STOPPED'}
                            </span>
                        </div>
                        <button
                            onClick={async () => {
                                if (isEngineOnline) {
                                    await stopEngine();
                                    // Force a re-check after stopping
                                    setTimeout(() => checkHealth(), 500);
                                } else {
                                    await startEngine();
                                }
                            }}
                            disabled={isStarting}
                            className={`
                                relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                                ${isStarting ? 'opacity-50 cursor-wait' : 'cursor-pointer'}
                                ${isEngineOnline
                                    ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20'
                                }
                            `}
                        >
                            {isStarting ? (
                                <span className="flex items-center gap-1.5">
                                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                    {isEngineOnline ? 'Stopping...' : 'Starting...'}
                                </span>
                            ) : (
                                isEngineOnline ? '■ Stop' : '▶ Start'
                            )}
                        </button>
                    </div>
                    {!isEngineOnline && !isStarting && (
                        <p className="text-[10px] text-zinc-500 mt-2">
                            Start the engine to enable semantic memory search.
                        </p>
                    )}
                    {isEngineOnline && (
                        <p className="text-[10px] text-emerald-500/70 mt-2">
                            ✓ Pages visited for 10s+ with 2+ scrolls are auto-memorized.
                        </p>
                    )}
                </div>

                {/* Search Bar */}
                <div className="p-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search your memories by topic..."
                            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-zinc-800 rounded-lg 
                       text-sm text-zinc-100 placeholder-zinc-500
                       focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20
                       transition-all"
                        />
                        {isLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <div className="w-4 h-4 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Bar */}
                {stats && (
                    <div className="px-3 pb-2 flex items-center gap-3 text-[10px] text-zinc-500">
                        <div className="flex items-center gap-1">
                            <Database className="w-3 h-3" />
                            <span>{stats.total_memories ?? 0} memories</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Zap className="w-3 h-3" />
                            <span>{(stats.index_size_mb ?? 0).toFixed(1)} MB</span>
                        </div>
                    </div>
                )}

                {/* Memory List */}
                <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
                    {memories.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/50 mb-4">
                                <Sparkles className="w-8 h-8 text-violet-400/50" />
                            </div>
                            <h3 className="text-sm font-medium text-zinc-300 mb-1">
                                {showRecent ? 'No Memories Yet' : 'No Matches Found'}
                            </h3>
                            <p className="text-xs text-zinc-500">
                                {showRecent
                                    ? 'Browse the web and pages you read will be remembered.'
                                    : 'Try describing what you remember about the page.'}
                            </p>
                        </div>
                    ) : (
                        <>
                            {!showRecent && searchQuery && (
                                <div className="text-xs text-zinc-500 mb-2">
                                    {memories.length} results for "{searchQuery}"
                                </div>
                            )}
                            {memories.map((memory) => (
                                <MemoryCard
                                    key={memory.id}
                                    memory={memory}
                                    onOpen={() => handleOpenUrl(memory.url)}
                                    onDelete={() => deleteMemory(memory.id)}
                                    formatDate={formatDate}
                                />
                            ))}
                        </>
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// Memory Card Component
function MemoryCard({
    memory,
    onOpen,
    onDelete,
    formatDate
}: {
    memory: Memory;
    onOpen: () => void;
    onDelete: () => void;
    formatDate: (ts: number) => string;
}) {
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = async () => {
        setIsDeleting(true);
        await onDelete();
        setIsDeleting(false);
    };

    // Extract domain from URL
    const domain = (() => {
        try {
            return new URL(memory.url).hostname.replace('www.', '');
        } catch {
            return memory.url;
        }
    })();

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group p-3 rounded-lg bg-zinc-900/30 border border-zinc-800/50 
                 hover:bg-zinc-900/50 hover:border-zinc-700/50 transition-all cursor-pointer"
            onClick={onOpen}
        >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-sm font-medium text-zinc-200 line-clamp-2 leading-tight">
                    {memory.title}
                </h4>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        disabled={isDeleting}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onOpen();
                        }}
                        className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-violet-400 transition-colors"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

            {/* Summary */}
            <p className="text-xs text-zinc-400 line-clamp-2 mb-2 leading-relaxed">
                {memory.summary}
            </p>

            {/* Footer */}
            <div className="flex items-center justify-between text-[10px] text-zinc-500">
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(memory.timestamp)}
                </span>
                <span className="truncate max-w-[150px]" title={memory.url}>
                    {domain}
                </span>
                {memory.similarity !== undefined && (
                    <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400">
                        {(memory.similarity * 100).toFixed(0)}% match
                    </span>
                )}
            </div>
        </motion.div>
    );
}
