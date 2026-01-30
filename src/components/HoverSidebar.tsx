import React, { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Plus, X, Globe, LayoutGrid, Inbox, History } from 'lucide-react';

export const HoverSidebar: React.FC = () => {
    const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useTabStore();
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className="h-full relative z-40"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Base Width Placeholder (Always visible) */}
            <div className="w-10 h-full bg-[#1E1F22] border-r border-white/5 flex flex-col items-center py-2 gap-4" />

            {/* Expanding Sidebar Panel */}
            <motion.div
                initial={{ width: '2.5rem' }} // w-10
                animate={{ width: isHovered ? '16rem' : '2.5rem' }} // w-64 vs w-10
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="absolute top-0 left-0 h-full bg-[#1E1F22] border-r border-white/5 overflow-hidden flex flex-col shadow-2xl"
            >
                {/* Static Icons Strip (Visible when collapsed) */}
                {/* We render the full content, but masking/layout handles the collapsed state */}

                {/* Top Actions */}
                <div className="flex flex-col gap-2 p-2 shrink-0">
                    <button className="flex items-center gap-3 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <LayoutGrid size={18} />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap opacity-0 animate-in fade-in duration-200" style={{ opacity: isHovered ? 1 : 0 }}>Dashboard</span>
                    </button>

                    {/* Fake items from image */}
                    <button className="flex items-center gap-3 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <Inbox size={18} />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap opacity-0 animate-in fade-in duration-200" style={{ opacity: isHovered ? 1 : 0 }}>Inbox</span>
                    </button>

                    <div className="w-full h-px bg-white/5 my-1" />
                </div>

                {/* Vertical Tabs List */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar px-2 flex flex-col gap-1">
                    <div className={clsx("text-xs font-semibold text-gray-500 px-2 py-1 uppercase tracking-wider transition-opacity duration-200", isHovered ? "opacity-100" : "opacity-0 hidden")}>
                        Open Tabs
                    </div>

                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={clsx(
                                "flex items-center gap-3 p-1.5 rounded-md transition-all group relative w-full text-left",
                                activeTabId === tab.id ? "bg-white/10 text-white shadow-sm" : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
                            )}
                            title={tab.title}
                        >
                            {/* Favicon / Icon */}
                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                {tab.favicon ? (
                                    <img src={tab.favicon} className="w-4 h-4 rounded-sm" onError={e => e.currentTarget.style.display = 'none'} />
                                ) : (
                                    <Globe size={14} />
                                )}
                            </div>

                            {/* Title (Hidden when collapsed) */}
                            <span
                                className="text-sm truncate flex-1 opacity-0 transition-opacity duration-200 font-medium"
                                style={{ opacity: isHovered ? 1 : 0 }}
                            >
                                {tab.title}
                            </span>

                            {/* Close Button (Hover only) */}
                            {isHovered && (
                                <div
                                    onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/20 rounded-full transition-opacity absolute right-2"
                                >
                                    <X size={12} />
                                </div>
                            )}
                        </button>
                    ))}
                </div>

                {/* Bottom Actions */}
                <div className="p-2 shrink-0 border-t border-white/5 flex flex-col gap-1">
                    <button
                        onClick={() => addTab()}
                        className="flex items-center gap-3 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <Plus size={18} />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap opacity-0 transition-opacity duration-200" style={{ opacity: isHovered ? 1 : 0 }}>New Tab</span>
                    </button>

                    <button className="flex items-center gap-3 p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                        <div className="w-6 h-6 flex items-center justify-center shrink-0">
                            <History size={18} />
                        </div>
                        <span className="text-sm font-medium whitespace-nowrap opacity-0 transition-opacity duration-200" style={{ opacity: isHovered ? 1 : 0 }}>History</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
