import React, { useState } from 'react';
import { X, Image as ImageIcon, Layout, Clock, BarChart2, Link, Search } from 'lucide-react';
import { useNtpStore } from '../../store/useNtpStore';
import { clsx } from 'clsx';

export const CustomizeModal: React.FC = () => {
    const {
        isCustomizeOpen, toggleCustomize,
        showStats, toggleStats,
        showClock, toggleClock,
        showTopSites, toggleTopSites,
        showSearch, toggleSearch,
        backgroundImage, setBackgroundImage
    } = useNtpStore();

    const [activeTab, setActiveTab] = useState<'background' | 'widgets'>('background');

    if (!isCustomizeOpen) return null;

    const backgrounds = [
        { id: 'default', url: "https://images.unsplash.com/photo-1620121692029-d088224ddc74?q=80&w=2832&auto=format&fit=crop", name: "Abstract Deep" },
        { id: 'cosmos', url: "https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=2048&auto=format&fit=crop", name: "Cosmos" },
        { id: 'nature', url: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2048&auto=format&fit=crop", name: "Misty Mountains" },
        { id: 'city', url: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2048&auto=format&fit=crop", name: "City Lights" },
        { id: 'minimal', url: "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?q=80&w=2048&auto=format&fit=crop", name: "Minimal Grey" },
        { id: 'cyberpunk', url: "https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2048&auto=format&fit=crop", name: "Cyberpunk" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                onClick={toggleCustomize}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <div className="relative w-[700px] h-[500px] bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex">
                {/* Sidebar */}
                <div className="w-48 bg-slate-950/80 p-4 border-r border-slate-800 flex flex-col gap-2">
                    <h2 className="text-lg font-bold text-white px-2 mb-4">Customize</h2>

                    <button
                        onClick={() => setActiveTab('background')}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'background' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <ImageIcon size={18} />
                        Background image
                    </button>
                    <button
                        onClick={() => setActiveTab('widgets')}
                        className={clsx(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                            activeTab === 'widgets' ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white hover:bg-slate-800"
                        )}
                    >
                        <Layout size={18} />
                        Widgets
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto bg-slate-900/90">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-white capitalize">{activeTab === 'background' ? 'Background Image' : 'Dashboard Widgets'}</h3>
                        <button onClick={toggleCustomize} className="text-slate-400 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {activeTab === 'background' && (
                        <div className="grid grid-cols-2 gap-4">
                            {backgrounds.map((bg) => (
                                <button
                                    key={bg.id}
                                    onClick={() => setBackgroundImage(bg.url)}
                                    className={clsx(
                                        "group relative aspect-video rounded-xl overflow-hidden border-2 transition-all",
                                        backgroundImage === bg.url ? "border-indigo-500 scale-[1.02] shadow-lg shadow-indigo-500/20" : "border-transparent hover:border-slate-600"
                                    )}
                                >
                                    <div className="absolute inset-0 bg-slate-800 animate-pulse" />
                                    <img
                                        src={bg.url}
                                        alt={bg.name}
                                        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white font-medium text-sm drop-shadow-md">{bg.name}</span>
                                    </div>
                                    {backgroundImage === bg.url && (
                                        <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center shadow-sm">
                                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}

                    {activeTab === 'widgets' && (
                        <div className="space-y-4">
                            <WidgetToggle
                                label="Brave Stats"
                                description="Show trackers blocked and data saved"
                                icon={BarChart2}
                                checked={showStats}
                                onChange={toggleStats}
                            />
                            <WidgetToggle
                                label="Clock"
                                description="Show the current time"
                                icon={Clock}
                                checked={showClock}
                                onChange={toggleClock}
                            />
                            <WidgetToggle
                                label="Top Sites"
                                description="Show your frequently visited sites"
                                icon={Link}
                                checked={showTopSites}
                                onChange={toggleTopSites}
                            />
                            <WidgetToggle
                                label="Search Bar"
                                description="Show the central search input"
                                icon={Search}
                                checked={showSearch}
                                onChange={toggleSearch}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const WidgetToggle: React.FC<{
    label: string,
    description: string,
    icon: React.ElementType,
    checked: boolean,
    onChange: () => void
}> = ({ label, description, icon: Icon, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
        <div className="flex items-center gap-4">
            <div className={clsx("p-2.5 rounded-lg", checked ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-700/50 text-slate-400")}>
                <Icon size={20} />
            </div>
            <div>
                <h4 className="font-medium text-white">{label}</h4>
                <p className="text-sm text-slate-400">{description}</p>
            </div>
        </div>
        <button
            onClick={onChange}
            className={clsx(
                "w-12 h-6 rounded-full relative transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900",
                checked ? "bg-green-500" : "bg-slate-600"
            )}
        >
            <span
                className={clsx(
                    "block w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-200 ease-in-out absolute top-1",
                    checked ? "translate-x-7" : "translate-x-1"
                )}
            />
        </button>
    </div>
);
