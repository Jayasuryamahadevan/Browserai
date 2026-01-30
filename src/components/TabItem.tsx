import React from 'react';
import { useTabStore, Tab } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { useContextMenuStore } from '../store/useContextMenuStore';

import { NewTabPage } from './NewTab/NewTabPage';

interface TabItemProps {
    tab: Tab;
    isActive: boolean;
}

export const TabItem: React.FC<TabItemProps> = React.memo(({ tab, isActive }) => {
    const { updateTab } = useTabStore();
    const setWebviewRef = useBrowserRefStore((state) => state.setWebviewRef);
    const removeWebviewRef = useBrowserRefStore((state) => state.removeWebviewRef);
    const webviewRef = useBrowserRefStore((state) => state.webviewRefs[tab.id]);

    const handleRef = (ref: any) => {
        if (ref) {
            setWebviewRef(tab.id, ref);
        } else {
            removeWebviewRef(tab.id);
        }
    };

    const memoizedRef = React.useCallback(handleRef, [tab.id, setWebviewRef, removeWebviewRef]);

    const openContextMenu = useContextMenuStore(state => state.openMenu);

    React.useEffect(() => {
        const webview = webviewRef;
        if (!webview) return;

        const handleContextMenu = (e: any) => {
            const params = e.params;
            if (params && params.selectionText) {
                openContextMenu(params.x, params.y, params.selectionText);
            }
        };

        const handleIpcMessage = (e: any) => {
            const { channel, args } = e;
            if (channel === 'text-selected') {
                // args[0] is the payload { text, x, y, width, height }
                const payload = args[0];
                if (payload && payload.text) {
                    // We need to offset the y coordinate by the top bar height (approx 40px)
                    // The payload.x/y are relative to the viewport of the webview
                    // Webview is below TitleBar (40px) + NavBar (40px) + BookmarksBar (if any)
                    // For now, let's assume a fixed offset or use getBoundingClientRect if we had a ref to the container
                    // But simpler: just add a rough offset. TitleBar is 40px. NavBar 40px. Total 80px + Bookmarks?
                    // Let's rely on client coordinates + absolute positioning on top.
                    // The App structure is: TitleBar -> NavBar -> Bookmarks -> Content.
                    // Let's assume ~112px offset (40+40+32?)
                    const toolBarHeight = 112;
                    useContextMenuStore.getState().showSelectionMenu(
                        payload.x,
                        payload.y + toolBarHeight,
                        payload.text
                    );
                }
            } else if (channel === 'text-unselected') {
                // Optional: close selection menu if it's open? 
                // useContextMenuStore.getState().closeMenu(); 
                // But we don't want to close if user just clicked the menu itself.
                // The store handles 'isClosing' logic, maybe we can just ignore or strictly close 'selection-popup' type.
                const state = useContextMenuStore.getState();
                if (state.isOpen && state.type === 'selection-popup') {
                    state.closeMenu();
                }
            }
        };

        const handleTitleUpdated = (e: any) => {
            updateTab(tab.id, { title: e.title });
        };

        const handleFaviconUpdated = (e: any) => {
            if (e.favicons && e.favicons.length > 0) {
                updateTab(tab.id, { favicon: e.favicons[0] });
            }
        };

        const handleDidStopLoading = () => {
            updateTab(tab.id, { isLoading: false, title: webview.getTitle() });
        };

        const handleNavigate = (e: any) => {
            updateTab(tab.id, { url: e.url });
        };

        // Cache the adblock script to avoid repeated IPC calls
        let cachedAdblockScript: string | null = null;
        let cachedMemoryTrackerScript: string | null = null;

        const injectAdblockScript = async (reason: string) => {
            try {
                const currentUrl = webview.getURL();
                if (currentUrl && currentUrl.includes('youtube.com')) {
                    if (!cachedAdblockScript) {
                        // @ts-ignore - ipcRenderer is available via preload
                        cachedAdblockScript = await window.ipcRenderer.invoke('get-youtube-adblock-script');
                    }
                    if (cachedAdblockScript) {
                        // Execute in main world for maximum effectiveness
                        webview.executeJavaScript(cachedAdblockScript);
                        console.log(`[AdBlock] Injected script (${reason})`);
                    }
                }
            } catch (err) {
                console.error('[AdBlock] Failed to inject script:', err);
            }
        };

        const injectMemoryTracker = async () => {
            try {
                // Validate webview is still valid and loaded
                if (!webview || typeof webview.getURL !== 'function') {
                    return;
                }

                const currentUrl = webview.getURL();
                // Skip internal pages and empty URLs
                if (!currentUrl ||
                    currentUrl === '' ||
                    currentUrl === 'about:blank' ||
                    currentUrl.startsWith('saturn://') ||
                    currentUrl.startsWith('chrome://') ||
                    currentUrl.startsWith('about:') ||
                    currentUrl.startsWith('file://') ||
                    currentUrl.includes('localhost') ||
                    currentUrl.includes('127.0.0.1')) {
                    return;
                }

                if (!cachedMemoryTrackerScript) {
                    // @ts-ignore - ipcRenderer is available via preload
                    cachedMemoryTrackerScript = await window.ipcRenderer.invoke('get-memory-tracker-script');
                }
                if (cachedMemoryTrackerScript) {
                    // Use try-catch for executeJavaScript to handle race conditions
                    try {
                        await webview.executeJavaScript(cachedMemoryTrackerScript);
                        console.log('[Memory] Injected tracker script');
                    } catch (execErr: any) {
                        // Silently ignore common navigation errors
                        if (!execErr?.message?.includes('ERR_ABORTED')) {
                            console.debug('[Memory] Script execution skipped:', execErr?.message);
                        }
                    }
                }
            } catch (err: any) {
                // Only log non-navigation related errors
                if (!err?.message?.includes('destroyed') && !err?.message?.includes('ERR_ABORTED')) {
                    console.error('[Memory] Failed to inject tracker:', err);
                }
            }
        };

        const handleDomReady = async (_e: any) => {
            updateTab(tab.id, { title: webview.getTitle() });
            // Inject on DOM ready (backup)
            await injectAdblockScript('dom-ready');
            // Inject memory tracker for engagement tracking
            await injectMemoryTracker();
        };

        // Also inject on commit (earlier than dom-ready)
        const handleDidCommitNavigation = async (_e: any) => {
            await injectAdblockScript('did-commit-navigation');
        };

        // Inject on navigate (for SPA navigation like YouTube)
        const handleDidNavigateInPage = async (_e: any) => {
            await injectAdblockScript('did-navigate-in-page');
        };

        const handleDidStartLoading = () => {
            updateTab(tab.id, { isLoading: true });
        };

        // Monitor console messages for memory saving (Console Bridge)
        const handleConsoleMessage = async (e: any) => {
            if (e.message && e.message.startsWith('SATURN_MEMORY_SAVE:')) {
                try {
                    const jsonStr = e.message.replace('SATURN_MEMORY_SAVE:', '');
                    const payload = JSON.parse(jsonStr);
                    // Proxy to main process via IPC
                    // @ts-ignore
                    const success = await window.ipcRenderer.invoke('memory-store', payload);
                    if (success) {
                        console.log('[TabItem] Memory saved via bridge:', payload.title);
                    } else {
                        console.warn('[TabItem] Failed to save memory via bridge');
                    }
                } catch (err) {
                    console.error('[TabItem] Failed to parse memory payload:', err);
                }
            }
        };

        webview.addEventListener('context-menu', handleContextMenu);
        webview.addEventListener('ipc-message', handleIpcMessage);
        webview.addEventListener('console-message', handleConsoleMessage);
        webview.addEventListener('page-title-updated', handleTitleUpdated);
        webview.addEventListener('page-favicon-updated', handleFaviconUpdated);
        webview.addEventListener('did-stop-loading', handleDidStopLoading);
        webview.addEventListener('did-start-loading', handleDidStartLoading);
        webview.addEventListener('dom-ready', handleDomReady);
        webview.addEventListener('did-navigate', handleNavigate);
        webview.addEventListener('did-navigate-in-page', handleNavigate);
        // AdBlock: Inject on early navigation events
        webview.addEventListener('did-commit-navigation', handleDidCommitNavigation);
        webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);

        try {
            if (webview.getTitle()) updateTab(tab.id, { title: webview.getTitle() });
        } catch (_e) { }

        return () => {
            try {
                webview.removeEventListener('context-menu', handleContextMenu);
                webview.removeEventListener('ipc-message', handleIpcMessage);
                webview.removeEventListener('console-message', handleConsoleMessage);
                webview.removeEventListener('page-title-updated', handleTitleUpdated);
                webview.removeEventListener('page-favicon-updated', handleFaviconUpdated);
                webview.removeEventListener('did-stop-loading', handleDidStopLoading);
            } catch (_e) { }
        };
    }, [tab.id, webviewRef, openContextMenu, updateTab]);

    const [preloadPath, setPreloadPath] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const fetchPreload = async () => {
            try {
                // @ts-ignore
                const path = await window.ipcRenderer.invoke('get-preload-path');
                // Ensure protocol for Windows
                const url = path.startsWith('file://') ? path : `file://${path}`;
                setPreloadPath(url);
            } catch (e) {
                console.error("Failed to get preload path", e);
            }
        };
        fetchPreload();
    }, []);

    const isNewTab = tab.url === 'saturn://newtab';

    return (
        <div
            className="absolute inset-0 w-full h-full bg-slate-100"
            style={{
                display: isActive ? 'block' : 'none',
                visibility: isActive ? 'visible' : 'hidden'
            }}
        >
            {isNewTab ? (
                <NewTabPage />
            ) : (
                <webview
                    ref={memoizedRef}
                    src={tab.url}
                    className="w-full h-full"
                    preload={preloadPath}
                    // @ts-ignore
                    allowpopups="true"
                />
            )}
        </div>
    );
});
