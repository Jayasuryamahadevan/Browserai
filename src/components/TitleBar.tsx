import React, { useState, useEffect } from 'react';
import { useJessicaStore } from '../store/useJessicaStore';
import { useTabStore } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { useTestingStore } from '../store/useTestingStore';
import { TabStrip } from './TabStrip';
import { WindowControls } from './WindowControls';
import { ArrowLeft, ArrowRight, RotateCw, Shield, Star, Sparkles, Brain, StickyNote, Menu, Home, FlaskConical } from 'lucide-react';
import { clsx } from 'clsx';

export const TitleBar: React.FC = () => {
    const { tabLayout, numPadShortcuts } = useJessicaStore();
    const { activeTabId, tabs, updateTab, toggleSidebar, isSidebarOpen, sidebarView, toggleSettings, addTab } = useTabStore();
    const { getWebview } = useBrowserRefStore();
    const { isOpen: isTestingOpen, togglePanel: toggleTesting } = useTestingStore();
    const activeTab = tabs.find(t => t.id === activeTabId);
    const [inputValue, setInputValue] = useState('');

    // Sync address bar with active tab URL
    useEffect(() => {
        if (activeTab) {
            setInputValue(activeTab.url === 'saturn://newtab' ? '' : activeTab.url);
        }
    }, [activeTab?.url, activeTabId]);

    // Numpad shortcuts
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement).isContentEditable) return;
            if (/^[0-9]$/.test(e.key)) {
                const url = numPadShortcuts[e.key];
                if (url) {
                    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
                    addTab(targetUrl);
                }
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [numPadShortcuts, addTab]);

    const handleBack = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        if (webview?.canGoBack()) webview.goBack();
    };

    const handleForward = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        if (webview?.canGoForward()) webview.goForward();
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
                url = url.includes('.') && !url.includes(' ')
                    ? `https://${url}`
                    : `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
            const webview = getWebview(activeTabId);
            if (webview) webview.loadURL(url);
            updateTab(activeTabId, { url });
        }
    };

    return (
        <div
            className="h-12 flex items-center px-2 gap-2 select-none bg-black/90 backdrop-blur-xl border-b border-white/5"
            style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
        >
            {/* ZONE 1: Tabs */}
            {tabLayout === 'horizontal' && (
                <div className="flex items-center max-w-[300px] overflow-hidden shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                    <TabStrip orientation="horizontal" />
                </div>
            )}

            {/* ZONE 2: Navigation Controls */}
            <div className="flex items-center gap-0.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button onClick={handleBack} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Back">
                    <ArrowLeft size={15} strokeWidth={2} />
                </button>
                <button onClick={handleForward} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Forward">
                    <ArrowRight size={15} strokeWidth={2} />
                </button>
                <button onClick={handleReload} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Reload">
                    <RotateCw size={14} strokeWidth={2} />
                </button>
            </div>

            {/* ZONE 3: Address Bar */}
            <div
                className="flex-1 flex items-center h-8 px-3 mx-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
                style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
            >
                <Shield size={13} className="text-cyan-400/70 mr-2 shrink-0" />
                <input
                    className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-slate-500 h-full font-medium"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search the cosmos..."
                    onFocus={(e) => e.target.select()}
                />
                <Star size={13} className="text-slate-600 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:text-yellow-400" />
            </div>

            {/* ZONE 4: Tool Buttons */}
            <div className="flex items-center gap-0.5 shrink-0" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
                <button
                    onClick={() => toggleSidebar('ai')}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        isSidebarOpen && sidebarView === 'ai' ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                    title="AI Companion"
                >
                    <Sparkles size={15} />
                </button>
                <button
                    onClick={() => toggleSidebar('memory')}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        isSidebarOpen && sidebarView === 'memory' ? "bg-violet-500/20 text-violet-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                    title="Semantic Memory"
                >
                    <Brain size={15} />
                </button>
                <button
                    onClick={() => toggleSidebar('notes')}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        isSidebarOpen && sidebarView === 'notes' ? "bg-emerald-500/20 text-emerald-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                    title="Notes"
                >
                    <StickyNote size={15} />
                </button>
                <button
                    onClick={toggleTesting}
                    className={clsx(
                        "p-2 rounded-lg transition-all",
                        isTestingOpen ? "bg-orange-500/20 text-orange-400" : "hover:bg-white/10 text-slate-400 hover:text-white"
                    )}
                    title="Testing Toolkit"
                >
                    <FlaskConical size={15} />
                </button>

                <div className="w-px h-5 bg-white/10 mx-1" />

                <button onClick={handleHome} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Home">
                    <Home size={15} strokeWidth={2} />
                </button>
                <button onClick={() => toggleSettings()} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="Settings">
                    <Menu size={15} strokeWidth={2} />
                </button>
            </div>

            {/* ZONE 5: Window Controls */}
            <WindowControls />
        </div>
    );
};
