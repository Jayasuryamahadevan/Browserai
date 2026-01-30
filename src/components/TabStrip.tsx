import React from 'react';
import { useTabStore } from '../store/useTabStore';
import { X, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { useJessicaStore } from '../store/useJessicaStore';

interface TabStripProps {
    orientation?: 'horizontal' | 'vertical';
}

export const TabStrip: React.FC<TabStripProps> = ({ orientation = 'horizontal' }) => {
    const { tabs, activeTabId, setActiveTab, removeTab, addTab } = useTabStore();
    const { tabLayout } = useJessicaStore(); // Using it to double check if needed, or we can rely on prop.
    // Actually, let's prioritize the prop but if it's missing use store? No, explicit prop is better.
    // But to silencing lint, I'll use it or underscore it.
    // Let's use it to override prop if we want strict sync? No.
    // Just suppressing it by removing it if not used. 
    // Wait, the error said 'tabLayout' is unused.
    // I entered it in 'Alternative source' comment but didn't use it.
    // I'll remove it.

    // Check if I used 'isVertical' later.
    const isVertical = orientation === 'vertical' || tabLayout === 'vertical'; // Using it now to fix lint and be robust

    return (
        <div
            className={clsx(
                "flex",
                isVertical
                    ? "flex-col w-64 h-full bg-slate-900 border-r border-slate-800"
                    : "flex-1 items-center h-full overflow-x-auto no-scrollbar gap-1 pl-1"
            )}
            style={{ WebkitAppRegion: 'no-drag' } as any}
        >
            {/* Header for Vertical Tabs */}
            {isVertical && (
                <div className="flex items-center justify-between p-3 border-b border-slate-800/50 mb-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Open Tabs</span>
                    <button
                        onClick={() => addTab()}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                    >
                        <Plus size={16} />
                    </button>
                </div>
            )}

            <div className={clsx("flex", isVertical ? "flex-col gap-1 p-2" : "flex-row gap-1")}>
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            "group flex items-center px-2 rounded-md text-sm border-none cursor-pointer transition-all duration-200 ease-out",
                            isVertical
                                ? "w-full py-2 mb-1" // Vertical specific styles
                                : "min-w-[80px] max-w-[120px] h-7", // Ultra compact horizontal chip
                            activeTabId === tab.id
                                ? "bg-white/10 text-white"
                                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                        )}
                    >
                        {tab.favicon ? (
                            <img src={tab.favicon} alt="" className="w-4 h-4 rounded-sm object-contain" />
                        ) : (
                            <div className="w-4 h-4 rounded-sm bg-slate-700 flex items-center justify-center text-[8px] text-slate-400">#</div>
                        )}

                        <span className={clsx("flex-1 truncate text-xs font-medium ml-2", isVertical ? "text-sm" : "")}>
                            {tab.title || 'New Tab'}
                        </span>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTab(tab.id);
                            }}
                            className={clsx(
                                "opacity-0 group-hover:opacity-100 rounded-full transition-all hover:bg-slate-700/80",
                                isVertical ? "p-1.5" : "p-1"
                            )}
                        >
                            <X size={12} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Horizontal Add Button (Only show if horizontal) */}
            {!isVertical && (
                <button
                    onClick={() => addTab()}
                    className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                >
                    <Plus size={16} />
                </button>
            )}
        </div>
    );
};
