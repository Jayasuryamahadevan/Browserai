/**
 * Saturn Memory Tracker
 * =====================
 * Injected into webviews to:
 * 1. Track user engagement (time spent, scroll depth)
 * 2. Extract main content when engagement threshold is met
 * 3. Send to memory engine for embedding and storage
 */

(() => {
    // Skip internal pages
    const url = window.location.href;
    if (
        url.startsWith('saturn://') ||
        url.startsWith('chrome://') ||
        url.startsWith('about:') ||
        url.startsWith('file://') ||
        url.startsWith('devtools:') ||
        url.includes('127.0.0.1') ||
        url.includes('localhost')
    ) {
        return;
    }

    // Configuration - User Requirements
    const CONFIG = {
        MIN_TIME_MS: 10000,           // 10 seconds minimum dwell time
        MIN_SCROLL_COUNT: 2,          // At least 2 scroll events required
        MIN_CONTENT_LENGTH: 200,      // Minimum characters
        CHECK_INTERVAL_MS: 3000,      // Check every 3 seconds
        MEMORY_ENGINE_URL: 'http://127.0.0.1:7420',
    };

    // State
    const state = {
        startTime: Date.now(),
        maxScrollDepth: 0,
        scrollCount: 0,               // NEW: Track number of scroll events
        hasSaved: false,
        isVisible: true,
        totalVisibleTime: 0,
        lastVisibleCheck: Date.now(),
    };

    console.log('[Memory] Tracker initialized for:', url);

    // Track scroll depth and count
    let scrollDebounce = null;
    const updateScrollDepth = () => {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight > 0) {
            const depth = scrollTop / scrollHeight;
            state.maxScrollDepth = Math.max(state.maxScrollDepth, depth);
        }

        // Count distinct scroll events (debounced)
        if (!scrollDebounce) {
            scrollDebounce = setTimeout(() => {
                state.scrollCount++;
                console.debug(`[Memory] Scroll event #${state.scrollCount}`);
                scrollDebounce = null;
            }, 300); // 300ms debounce
        }
    };

    // Track visibility
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Page hidden - update visible time
            state.totalVisibleTime += Date.now() - state.lastVisibleCheck;
            state.isVisible = false;
        } else {
            // Page visible again
            state.lastVisibleCheck = Date.now();
            state.isVisible = true;
        }
    });

    window.addEventListener('scroll', updateScrollDepth, { passive: true });

    // Content extraction (simplified Readability)
    const extractContent = () => {
        const removeSelectors = [
            'script', 'style', 'nav', 'header', 'footer', 'aside',
            'iframe', 'noscript', 'form', '.nav', '.navigation', '.sidebar',
            '.footer', '.header', '.menu', '.comment', '.advertisement',
            '.ad', '.social', '.share', '.related', '.newsletter', '.cookie',
            '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]'
        ];

        // Clone body to avoid modifying actual page
        const clone = document.body.cloneNode(true);

        // Remove noise
        removeSelectors.forEach(sel => {
            clone.querySelectorAll(sel).forEach(el => el.remove());
        });

        // Try to find main content
        let mainContent =
            clone.querySelector('article') ||
            clone.querySelector('main') ||
            clone.querySelector('[role="main"]') ||
            clone.querySelector('.content') ||
            clone.querySelector('.article') ||
            clone.querySelector('.post') ||
            clone;

        // Get text
        const text = mainContent.textContent || mainContent.innerText || '';

        // Clean whitespace
        return text.replace(/\s+/g, ' ').trim();
    };

    // Save memory
    const saveMemory = () => {
        if (state.hasSaved) return;

        const content = extractContent();
        if (content.length < CONFIG.MIN_CONTENT_LENGTH) {
            console.log('[Memory] Content too short, skipping');
            return;
        }

        const title = document.title || url;

        const payload = {
            url: url,
            title: title,
            content: content,
            is_html: false, // Already extracted
            engagement_score: state.maxScrollDepth + (state.totalVisibleTime / 60000), // scroll + minutes
            timestamp: Date.now()
        };

        // Use Console Bridge to bypass CSP/Mixed Content issues
        // TabItem.tsx listens for this prefix and proxies to main process via IPC
        console.log('SATURN_MEMORY_SAVE:' + JSON.stringify(payload));
        state.hasSaved = true;
        console.log('[Memory] ✓ Engagement met, sent to host:', title);
    };

    // Periodic check
    const checkEngagement = () => {
        if (state.hasSaved) return;

        // Update scroll depth
        updateScrollDepth();

        // Update visible time if currently visible
        if (state.isVisible) {
            state.totalVisibleTime += Date.now() - state.lastVisibleCheck;
            state.lastVisibleCheck = Date.now();
        }

        const timeSpent = state.totalVisibleTime;
        const scrollDepth = state.maxScrollDepth;

        console.debug(`[Memory] Time: ${Math.round(timeSpent / 1000)}s, Scrolls: ${state.scrollCount}, Depth: ${Math.round(scrollDepth * 100)}%`);

        // Check thresholds - require BOTH 10s dwell AND 2+ scroll events
        if (timeSpent >= CONFIG.MIN_TIME_MS && state.scrollCount >= CONFIG.MIN_SCROLL_COUNT) {
            console.log(`[Memory] ✓ Engagement met: ${Math.round(timeSpent / 1000)}s dwell, ${state.scrollCount} scrolls`);
            saveMemory();
        }
    };

    // Start checking
    setInterval(checkEngagement, CONFIG.CHECK_INTERVAL_MS);

    // Also save on page unload if engaged enough
    window.addEventListener('beforeunload', () => {
        if (!state.hasSaved) {
            // Final time update
            if (state.isVisible) {
                state.totalVisibleTime += Date.now() - state.lastVisibleCheck;
            }

            if (state.totalVisibleTime >= CONFIG.MIN_TIME_MS && state.scrollCount >= CONFIG.MIN_SCROLL_COUNT) {
                // Use Console Bridge instead of sendBeacon
                const content = extractContent();
                if (content.length >= CONFIG.MIN_CONTENT_LENGTH) {
                    const payload = {
                        url: url,
                        title: document.title || url,
                        content: content,
                        is_html: false,
                        engagement_score: state.maxScrollDepth + (state.totalVisibleTime / 60000),
                        timestamp: Date.now()
                    };
                    console.log('SATURN_MEMORY_SAVE:' + JSON.stringify(payload));
                }
            }
        }
    });
})();
