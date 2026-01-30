import { ipcRenderer } from 'electron';
import { useTabStore } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { useTestingStore } from '../store/useTestingStore';

/**
 * MCP Bridge
 * Listens for requests from the MCP Server (Main Process) and executes actions in the Renderer.
 */
export function initMcpBridge() {
    console.log('[MCP Bridge] Initializing...');

    ipcRenderer.on('mcp:request', async (_, { id, action, payload }) => {
        console.log(`[MCP Bridge] Received request: ${action}`, payload);

        try {
            let result;

            switch (action) {
                case 'navigate':
                    if (payload.url) {
                        const { activeTabId, updateTab, addTab } = useTabStore.getState();
                        if (activeTabId) {
                            updateTab(activeTabId, { url: payload.url });
                        } else {
                            addTab(payload.url);
                        }
                        result = { success: true };
                    }
                    break;

                case 'run-tests':
                    // Import dynamically to avoid circular deps
                    const { runTestsInWebview } = await import('./testing/testingService');

                    if (payload.category === 'all') {
                        // This might be tricky to return all results at once if it takes time
                        // For now we'll trigger it and return a "started" message or wait?
                        // MCP expects a response. Let's run robustly.

                        // We need to gather results. 
                        // Let's modify runAllTestCategories or manually run them here.
                        const categories = ['accessibility', 'performance', 'security', 'seo', 'html', 'bestpractices'] as const;
                        const allResults = [];

                        for (const cat of categories) {
                            const res = await runTestsInWebview(cat);
                            allResults.push(...res);
                        }
                        result = allResults;
                    } else {
                        result = await runTestsInWebview(payload.category);
                    }

                    // Also update store for UI visibility
                    useTestingStore.getState().clearResults();
                    if (Array.isArray(result)) {
                        result.forEach(r => useTestingStore.getState().addResult(r));
                    }
                    break;

                case 'get-content':
                    const { getWebview } = useBrowserRefStore.getState();
                    const { activeTabId } = useTabStore.getState();
                    if (!activeTabId) throw new Error("No active tab");

                    const webview = getWebview(activeTabId);
                    if (!webview) throw new Error("No webview found");

                    // Inject script to get content
                    const script = payload.selector
                        ? `document.querySelector('${payload.selector}')?.innerText || ''`
                        : `document.body.innerText`;

                    result = await webview.executeJavaScript(script);
                    break;

                case 'get-links':
                    {
                        const { getWebview: gw } = useBrowserRefStore.getState();
                        const { activeTabId: at } = useTabStore.getState();
                        if (!at) throw new Error("No active tab");
                        const wv = gw(at);
                        if (!wv) throw new Error("No webview found");

                        // Get all hrefs
                        result = await wv.executeJavaScript(`
                            Array.from(document.querySelectorAll('a[href]'))
                                .map(a => a.href)
                                .filter(h => h.startsWith('http'))
                        `);
                    }
                    break;

                case 'execute-script':
                    {
                        const { getWebview: gw2 } = useBrowserRefStore.getState();
                        const { activeTabId: at2 } = useTabStore.getState();
                        const wv2 = gw2(at2!);
                        if (!wv2) throw new Error("No webview");

                        result = await wv2.executeJavaScript(payload.script);
                    }
                    break;

                default:
                    throw new Error(`Unknown action: ${action}`);
            }

            // Send response back
            ipcRenderer.invoke('mcp:response', { id, result });

        } catch (error) {
            console.error('[MCP Bridge] Error:', error);
            ipcRenderer.invoke('mcp:response', { id, result: null, error: String(error) });
        }
    });
}
