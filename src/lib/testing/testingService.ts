/**
 * Testing Service
 * 
 * Provides methods to execute tests in the active webview
 * and collect results. This bridges the testing store with
 * the webview execution context.
 */

import { testScripts } from './testScripts';
import { TestCategory, TestResult, useTestingStore } from '../../store/useTestingStore';
import { useBrowserRefStore } from '../../store/useBrowserRefStore';
import { useTabStore } from '../../store/useTabStore';

/**
 * Execute all tests for a given category in the active webview
 */
export async function runTestsInWebview(category: TestCategory): Promise<TestResult[]> {
    // Get the active webview
    const { activeTabId } = useTabStore.getState();
    const { getWebview } = useBrowserRefStore.getState();

    if (!activeTabId) {
        console.error('[Testing] No active tab');
        return [{
            id: `${category}-no-tab`,
            category,
            name: 'Tab Not Found',
            status: 'fail',
            details: 'No active tab to run tests on',
            timestamp: Date.now()
        }];
    }

    const webview = getWebview(activeTabId);
    if (!webview) {
        console.error('[Testing] No webview found');
        return [{
            id: `${category}-no-webview`,
            category,
            name: 'Webview Not Found',
            status: 'fail',
            details: 'Could not access the webview',
            timestamp: Date.now()
        }];
    }

    // Check if it's a new tab page - can't run tests on internal pages
    const tab = useTabStore.getState().tabs.find(t => t.id === activeTabId);
    if (tab?.url === 'saturn://newtab' || !tab?.url.startsWith('http')) {
        return [{
            id: `${category}-internal-page`,
            category,
            name: 'Cannot Test Internal Page',
            status: 'info',
            details: 'Navigate to a website first to run tests',
            timestamp: Date.now()
        }];
    }

    try {
        // AXE-CORE INTEGRATION FOR ACCESSIBILITY
        if (category === 'accessibility') {
            try {
                // Fetch Axe script provided by main process
                const axeScript = await (window as any).ipcRenderer.invoke('testing-get-axe-script');
                if (axeScript) {
                    // Inject Axe-core
                    await webview.executeJavaScript(axeScript);

                    // Run Axe analysis and map results
                    const axeRunner = `
                        (async () => {
                            try {
                                const results = await axe.run();
                                return results.violations.map(v => ({
                                    id: 'axe-' + v.id,
                                    category: 'accessibility',
                                    name: v.help,
                                    status: 'fail', // Axe only reports violations here
                                    score: 0,
                                    details: v.description,
                                    elements: v.nodes.map(n => n.target.join(', ')),
                                    suggestion: v.helpUrl,
                                    timestamp: Date.now()
                                }));
                            } catch (e) {
                                return [{
                                    id: 'axe-error',
                                    category: 'accessibility',
                                    name: 'Axe Execution Failed',
                                    status: 'fail',
                                    details: String(e),
                                    timestamp: Date.now()
                                }];
                            }
                        })()
                    `;

                    console.log(`[Testing] Running Axe-core analysis...`);
                    const results = await webview.executeJavaScript(axeRunner);

                    if (Array.isArray(results)) {
                        return results;
                    }
                }
            } catch (e) {
                console.error('[Testing] Axe-core failed, falling back to basic tests:', e);
                // Fall through to standard script
            }
        }

        // CONNECTIVITY CHECKS (Dead Link Checker)
        if (category === 'connectivity') {
            try {
                // 1. Extract all unique links
                const extractScript = `
                    (function() {
                        const links = Array.from(document.querySelectorAll('a[href^="http"]'));
                        const unique = [...new Set(links.map(a => a.href))];
                        return unique.slice(0, 50); // Limit to 50 for performance
                    })();
                `;
                const urls = await webview.executeJavaScript(extractScript);

                if (!Array.isArray(urls) || urls.length === 0) {
                    return [{
                        id: 'conn-no-links',
                        category: 'connectivity',
                        name: 'Link Extraction',
                        status: 'info',
                        details: 'No external http/https links found on page',
                        timestamp: Date.now()
                    }];
                }

                // 2. Send to main process for concurrent HEAD checks
                console.log(`[Testing] Checking ${urls.length} links...`);

                // We'll define a new IPC handler for this batch check
                const checkResults = await (window as any).ipcRenderer.invoke('testing-check-links', urls);

                if (Array.isArray(checkResults)) {
                    return checkResults.map((r: any) => ({
                        id: `conn-${r.url}`,
                        category: 'connectivity',
                        name: 'Link Status',
                        status: r.status === 200 ? 'pass' : (r.status === 404 ? 'fail' : 'warning'),
                        details: `${r.status} - ${r.url}`,
                        suggestion: r.status === 404 ? 'Remove or fix broken link' : undefined,
                        timestamp: Date.now()
                    }));
                }

            } catch (e) {
                console.error('[Testing] Connectivity check failed:', e);
                return [{
                    id: 'conn-error',
                    category: 'connectivity',
                    name: 'Connectivity Check Failed',
                    status: 'fail',
                    details: String(e),
                    timestamp: Date.now()
                }];
            }
        }



        // PERFORMANCE TESTS (Web Vitals + Navigation Timing)
        if (category === 'performance') {
            try {
                // 1. Fetch and inject web-vitals library
                const vitalsScript = await (window as any).ipcRenderer.invoke('testing-get-web-vitals-script');
                if (vitalsScript) {
                    await webview.executeJavaScript(vitalsScript);
                }

                // 2. Run detailed performance analysis
                const perfRunner = `
                    (async () => {
                        const results = [];
                        
                        // A. Navigation Timing (Standard)
                        const perf = performance.getEntriesByType('navigation')[0];
                        if (perf) {
                            const loadTime = Math.round(perf.loadEventEnd - perf.startTime);
                            results.push({
                                id: 'perf-load', name: 'Load Time', 
                                status: loadTime < 2500 ? 'pass' : (loadTime < 4000 ? 'warning' : 'fail'),
                                details: \`\${loadTime}ms\`, score: loadTime < 2500 ? 100 : 50,
                                timestamp: Date.now()
                            });
                            const ttfb = Math.round(perf.responseStart - perf.startTime);
                            results.push({
                                id: 'perf-ttfb', name: 'TTFB',
                                status: ttfb < 600 ? 'pass' : 'warning',
                                details: \`\${ttfb}ms\`,
                                timestamp: Date.now()
                            });
                        }

                        // B. Core Web Vitals (LCP, CLS, FCP) via web-vitals library
                        if (window.webVitals) {
                            const getMetric = (name, timeout=1000) => new Promise(resolve => {
                                let resolved = false;
                                const done = (m) => {
                                    if (!resolved) { resolved = true; resolve(m); }
                                };
                                // Try to get metric
                                if (window.webVitals['on' + name]) {
                                    window.webVitals['on' + name](done, {reportAllChanges: true});
                                }
                                setTimeout(() => done(null), timeout);
                            });

                             // Gather metrics concurrently
                            const [lcp, cls, fcp] = await Promise.all([
                                getMetric('LCP'), 
                                getMetric('CLS'),
                                getMetric('FCP')
                            ]);

                            if (lcp) {
                                results.push({
                                    id: 'perf-lcp', name: 'Largest Contentful Paint (LCP)',
                                    status: lcp.value < 2500 ? 'pass' : (lcp.value < 4000 ? 'warning' : 'fail'),
                                    details: \`\${Math.round(lcp.value)}ms\`,
                                    timestamp: Date.now()
                                });
                            }
                            if (cls) {
                                results.push({
                                    id: 'perf-cls', name: 'Cumulative Layout Shift (CLS)',
                                    status: cls.value < 0.1 ? 'pass' : (cls.value < 0.25 ? 'warning' : 'fail'),
                                    details: cls.value.toFixed(3),
                                    timestamp: Date.now()
                                });
                            }
                            if (fcp) {
                                results.push({
                                    id: 'perf-fcp', name: 'First Contentful Paint (FCP)',
                                    status: fcp.value < 1800 ? 'pass' : 'warning',
                                    details: \`\${Math.round(fcp.value)}ms\`,
                                    timestamp: Date.now()
                                });
                            }
                        }

                        // C. Resource Heavy Checks
                        const resources = performance.getEntriesByType('resource');
                        const totalSize = resources.reduce((acc, r) => acc + (r.transferSize || 0), 0);
                        const mb = (totalSize / 1024 / 1024).toFixed(2);
                        results.push({
                            id: 'perf-weight', name: 'Page Weight',
                            status: totalSize < 3000000 ? 'pass' : 'warning', // 3MB limit
                            details: \`\${mb} MB transferred\`,
                            timestamp: Date.now()
                        });

                        return results;
                    })();
                `;

                console.log('[Testing] Running performance analysis...');
                const results = await webview.executeJavaScript(perfRunner);

                if (Array.isArray(results)) {
                    return results.map(r => ({ ...r, category: 'performance' }));
                }
            } catch (e) {
                console.error('[Testing] Standard performance test fallback:', e);
                // Fallthrough to standard script defined below
            }
        }



        // SECURITY TESTS (Headers + DOM)
        if (category === 'security') {
            const results: TestResult[] = [];

            try {
                // 1. Backend Header Analysis
                const url = await (window as any).ipcRenderer.invoke('testing-get-url') ||
                    useTestingStore.getState().lastRunUrl ||
                    (useTabStore.getState().tabs.find(t => t.id === activeTabId)?.url);

                if (url && url.startsWith('http')) {
                    const headers = await (window as any).ipcRenderer.invoke('testing-get-headers', url);

                    if (headers) {
                        // Check HSTS
                        const hsts = Object.keys(headers).find(k => k.toLowerCase() === 'strict-transport-security');
                        results.push({
                            id: 'sec-hsts', category: 'security', name: 'Strict-Transport-Security',
                            status: hsts ? 'pass' : 'fail',
                            details: hsts ? 'HSTS Enabled' : 'Missing HSTS header',
                            suggestion: 'Enable HSTS to prevent man-in-the-middle attacks',
                            timestamp: Date.now()
                        });

                        // Check CSP
                        const csp = Object.keys(headers).find(k => k.toLowerCase() === 'content-security-policy');
                        results.push({
                            id: 'sec-csp', category: 'security', name: 'Content-Security-Policy',
                            status: csp ? 'pass' : 'warning',
                            details: csp ? 'CSP Enabled' : 'Missing CSP header',
                            suggestion: 'Implement CSP to mitigate XSS and data injection',
                            timestamp: Date.now()
                        });

                        // Check X-Fram-Options
                        const xfo = Object.keys(headers).find(k => k.toLowerCase() === 'x-frame-options');
                        results.push({
                            id: 'sec-xfo', category: 'security', name: 'X-Frame-Options',
                            status: xfo ? 'pass' : 'warning',
                            details: xfo ? headers[xfo] : 'Missing X-Frame-Options',
                            suggestion: 'Set to DENY or SAMEORIGIN to prevent clickjacking',
                            timestamp: Date.now()
                        });

                        // Check X-Content-Type-Options
                        const xcto = Object.keys(headers).find(k => k.toLowerCase() === 'x-content-type-options');
                        results.push({
                            id: 'sec-xcto', category: 'security', name: 'X-Content-Type-Options',
                            status: xcto ? 'pass' : 'warning',
                            details: xcto ? 'nosniff' : 'Missing nosniff header',
                            suggestion: 'Set to "nosniff" to prevent MIME sniffing',
                            timestamp: Date.now()
                        });
                    }
                }
            } catch (e) {
                console.error('[Testing] Header check failed:', e);
            }

            // 2. Run Standard DOM Tests
            const script = testScripts[category];
            if (script) {
                try {
                    const domResults = await webview.executeJavaScript(script);
                    if (Array.isArray(domResults)) {
                        domResults.forEach(r => results.push({ ...r, category: 'security', timestamp: Date.now() }));
                    }
                } catch (e) {
                    console.error('[Testing] DOM security check failed:', e);
                }
            }

            return results;
        }

        // STANDARD TESTS (Fallback / Other Categories)
        const script = testScripts[category];
        if (!script) {
            return [{
                id: `${category}-no-script`,
                category,
                name: 'Script Not Found',
                status: 'fail',
                details: `No test script for category: ${category}`,
                timestamp: Date.now()
            }];
        }

        // Execute the script in the webview
        console.log(`[Testing] Running ${category} tests...`);
        const results = await webview.executeJavaScript(script);

        if (Array.isArray(results)) {
            // Add category and timestamp to each result
            return results.map(r => ({
                ...r,
                category,
                timestamp: Date.now()
            }));
        }

        return [{
            id: `${category}-invalid-results`,
            category,
            name: 'Invalid Results',
            status: 'fail',
            details: 'Test script did not return valid results',
            timestamp: Date.now()
        }];

    } catch (error) {
        console.error(`[Testing] Error running ${category} tests:`, error);
        return [{
            id: `${category}-error`,
            category,
            name: 'Execution Error',
            status: 'fail',
            details: String(error),
            timestamp: Date.now()
        }];
    }
}

/**
 * Run all test categories
 */
export async function runAllTestCategories(): Promise<void> {
    const store = useTestingStore.getState();
    const categories: TestCategory[] = ['accessibility', 'performance', 'security', 'seo', 'html', 'bestpractices'];

    store.clearResults();
    store.setRunning(true, 'Starting tests...');

    for (const category of categories) {
        store.setRunning(true, `Running ${category}...`);

        const results = await runTestsInWebview(category);
        results.forEach(result => store.addResult(result));

        // Small delay between categories for UI feedback
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    store.setRunning(false);
    console.log('[Testing] All tests complete');
}

/**
 * Get the current page URL for test context
 */
export function getCurrentPageUrl(): string | null {
    const { activeTabId, tabs } = useTabStore.getState();
    const tab = tabs.find(t => t.id === activeTabId);
    return tab?.url || null;
}
