import React, { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { useJessicaStore } from '../store/useJessicaStore';
import { ArrowLeft, ArrowRight, RotateCw, StickyNote, Menu, Shield, Sparkles, Star, Home, Brain } from 'lucide-react';
import { clsx } from 'clsx';

export const NavBar: React.FC = () => {
    const { activeTabId, tabs, updateTab, toggleSidebar, isSidebarOpen, sidebarView, toggleSettings, addTab } = useTabStore();
    const { getWebview } = useBrowserRefStore();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (activeTab) {
            setInputValue(activeTab.url === 'saturn://newtab' ? '' : activeTab.url);
        }
    }, [activeTab?.url, activeTabId]);

    // Num Pad Shortcuts
    const { numPadShortcuts } = useJessicaStore();

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore if typing in input/textarea
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) {
                return;
            }

            // Check for 0-9
            if (/^[0-9]$/.test(e.key)) {
                const url = numPadShortcuts[e.key];
                if (url) {
                    let targetUrl = url;
                    if (!targetUrl.startsWith('http')) {
                        targetUrl = `https://${targetUrl}`;
                    }
                    addTab(targetUrl);
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [numPadShortcuts, activeTabId, getWebview, updateTab]);

    const handleBack = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        webview?.canGoBack() && webview.goBack();
    };

    const handleForward = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        webview?.canGoForward() && webview.goForward();
    };

    const handleReload = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        webview?.reload();
    };

    const handleHome = () => {
        if (activeTabId) {
            updateTab(activeTabId, { url: 'saturn://newtab' });
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && activeTabId) {
            let url = inputValue;
            if (!url) return;
            if (!url.startsWith('http')) {
                if (url.includes('.') && !url.includes(' ')) {
                    url = `https://${url}`;
                } else {
                    url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
                }
            }
            const webview = getWebview(activeTabId);
            if (webview) webview.loadURL(url);
            updateTab(activeTabId, { url });
        }
    };

    if (!activeTab) return null;

    return (
        <div className="w-full flex justify-center z-40 my-1 pointer-events-none">
            {/* ISLAND CONTAINER */}
            <div className="glass-panel rounded-xl flex items-center p-1.5 gap-3 pointer-events-auto transition-all duration-300 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)] w-[calc(100%-1rem)] mx-2">

                {/* Nav Controls Group */}
                <div className="flex items-center gap-1 pl-1">
                    <button onClick={handleBack} className="p-2 rounded-xl glass-button text-slate-400" title="Back">
                        <ArrowLeft size={16} strokeWidth={2} />
                    </button>
                    <button onClick={handleForward} className="p-2 rounded-xl glass-button text-slate-400" title="Forward">
                        <ArrowRight size={16} strokeWidth={2} />
                    </button>
                    <button onClick={handleReload} className="p-2 rounded-xl glass-button text-slate-400" title="Reload">
                        <RotateCw size={16} strokeWidth={2} />
                    </button>
                </div>

                {/* Address Input Area */}
                <div className="flex-1 relative group">
                    <div className="absolute inset-0 bg-white/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex items-center h-10 px-3 transition-all">
                        <div className="mr-2 text-cyan-400 opacity-70">
                            <Shield size={14} />
                        </div>
                        <input
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-slate-500 h-full font-medium tracking-wide"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Search the cosmos..."
                            onFocus={(e) => e.target.select()}
                        />
                        <div className="ml-2 text-slate-600">
                            <Star size={14} />
                        </div>
                    </div>
                </div>

                {/* Right Side Tools */}
                <div className="flex items-center gap-1 pr-1">
                    <button
                        onClick={() => toggleSidebar('ai')}
                        className={clsx(
                            "p-2 rounded-xl transition-all duration-200 glass-button",
                            isSidebarOpen && sidebarView === 'ai' ? "text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.3)] border-white/20" : "text-slate-400"
                        )}
                        title="AI Companion"
                    >
                        <Sparkles size={16} />
                    </button>

                    <button
                        onClick={() => toggleSidebar('memory')}
                        className={clsx(
                            "p-2 rounded-xl transition-all duration-200 glass-button",
                            isSidebarOpen && sidebarView === 'memory' ? "text-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.3)] border-white/20" : "text-slate-400"
                        )}
                        title="Semantic Memory"
                    >
                        <Brain size={16} />
                    </button>

                    <button
                        onClick={() => toggleSidebar('notes')}
                        className={clsx(
                            "p-2 rounded-xl transition-all duration-200 glass-button",
                            isSidebarOpen && sidebarView === 'notes' ? "text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.3)] border-white/20" : "text-slate-400"
                        )}
                        title="Notes"
                    >
                        <StickyNote size={16} />
                    </button>

                    <div className="w-px h-6 bg-white/10 mx-1" />

                    <button onClick={handleHome} className="p-2 rounded-xl glass-button text-slate-400" title="Home">
                        <Home size={16} strokeWidth={2} />
                    </button>

                    <button onClick={() => toggleSettings()} className="p-2 rounded-xl glass-button text-slate-400" title="Settings">
                        <Menu size={16} strokeWidth={2} />
                    </button>
                </div>
            </div>
        </div>
    );
};
