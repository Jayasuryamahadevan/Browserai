// =============================================================================
// SATURN YOUTUBE AD BLOCKER - uBlock Origin Style
// Based on: uBlock Origin's json-prune-fetch-response + AdGuard scriptlets
// Handles: Video ads, overlay ads, sidebar ads, promoted content
// =============================================================================

(function () {
    'use strict';

    // Execute immediately - don't wait for DOMContentLoaded
    const LOG = '[Saturn AdBlock]';
    const DEBUG = true;

    function log(...args) {
        if (DEBUG) console.log(LOG, ...args);
    }

    log('🚀 Initializing uBlock-style YouTube AdBlock...');

    // =============================================================================
    // 1. CRITICAL: Intercept ytInitialPlayerResponse BEFORE YouTube reads it
    // This is the main source of ad data - must be intercepted first
    // =============================================================================

    // Ad-related keys to remove from YouTube responses
    const AD_KEYS = new Set([
        'adPlacements',
        'playerAds',
        'adSlots',
        'adBreakHeartbeatParams',
        'ads',
        'adConfig',
        'adSafetyConfig',
        'interstitialPods',
        'adInterstitials',
        'showPremiumBranding',
        'premiumUpsell',
        'shimData',
        'attestation',
        'playerLegacyDesktopWatchAdsRenderer'
    ]);

    // Recursively remove ad data from object
    function removeAds(obj, depth = 0) {
        if (!obj || typeof obj !== 'object' || depth > 15) return obj;

        if (Array.isArray(obj)) {
            // Filter out ad-related items from arrays
            const filtered = obj.filter((item, index) => {
                if (item && typeof item === 'object') {
                    const keys = Object.keys(item);
                    const isAd = keys.some(k =>
                        k.includes('adSlotRenderer') ||
                        k.includes('promotedVideoRenderer') ||
                        k.includes('compactPromotedVideoRenderer') ||
                        k.includes('displayAdRenderer') ||
                        k.includes('adPlacementRenderer') ||
                        k.includes('promotedSparklesWebRenderer') ||
                        k.includes('bannerPromoRenderer') ||
                        k.includes('statementBannerRenderer') ||
                        k.includes('mealbarPromoRenderer') ||
                        k.includes('playerLegacyDesktopWatchAdsRenderer')
                    );
                    if (isAd) {
                        log('Removed ad item at index', index);
                        return false;
                    }
                    removeAds(item, depth + 1);
                }
                return true;
            });
            obj.length = 0;
            obj.push(...filtered);
            return obj;
        }

        for (const key of Object.keys(obj)) {
            if (AD_KEYS.has(key)) {
                log('Removed:', key);
                delete obj[key];
                continue;
            }

            // Remove ad-specific renderers
            if (key.toLowerCase().includes('ad') &&
                (key.endsWith('Renderer') || key.endsWith('renderer'))) {
                log('Removed renderer:', key);
                delete obj[key];
                continue;
            }

            if (obj[key] && typeof obj[key] === 'object') {
                removeAds(obj[key], depth + 1);
            }
        }

        return obj;
    }

    // =============================================================================
    // 2. HOOK: Object.defineProperty to catch ytInitialPlayerResponse
    // =============================================================================

    const originalDefineProperty = Object.defineProperty;
    Object.defineProperty = function (obj, prop, descriptor) {
        if (prop === 'ytInitialPlayerResponse' ||
            prop === 'ytInitialData' ||
            prop === 'ytPlayerPageData') {

            const originalSet = descriptor.set;
            const originalGet = descriptor.get;
            const originalValue = descriptor.value;

            if (originalValue && typeof originalValue === 'object') {
                removeAds(originalValue);
                log('Pruned', prop, 'value');
            }

            if (originalSet) {
                descriptor.set = function (val) {
                    if (val && typeof val === 'object') {
                        removeAds(val);
                        log('Pruned', prop, 'via setter');
                    }
                    return originalSet.call(this, val);
                };
            }

            if (originalGet) {
                descriptor.get = function () {
                    const val = originalGet.call(this);
                    if (val && typeof val === 'object') {
                        removeAds(val);
                    }
                    return val;
                };
            }
        }
        return originalDefineProperty.call(this, obj, prop, descriptor);
    };

    // =============================================================================
    // 3. HOOK: JSON.parse to intercept all parsed JSON
    // uBlock Origin's json-prune approach
    // =============================================================================

    const originalJSONParse = JSON.parse;
    JSON.parse = function (text, reviver) {
        let result;
        try {
            result = originalJSONParse.call(this, text, reviver);
        } catch (e) {
            throw e;
        }

        if (result && typeof result === 'object') {
            // Only process YouTube-related data
            const isYouTubeData =
                'playerResponse' in result ||
                'adPlacements' in result ||
                'playerAds' in result ||
                'playabilityStatus' in result ||
                'contents' in result ||
                'responseContext' in result;

            if (isYouTubeData) {
                removeAds(result);
            }
        }

        return result;
    };

    // =============================================================================
    // 4. HOOK: fetch API - Intercept and modify responses
    // Like uBlock's json-prune-fetch-response.js
    // =============================================================================

    const originalFetch = window.fetch;
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input : input?.url || '';

        // Block known ad endpoints entirely
        const blockedPatterns = [
            '/pagead/',
            '/ptracking',
            '/api/stats/ads',
            'doubleclick.net',
            'googlesyndication.com',
            '/generate_204',
            '/log_event',
            'play.google.com/log',
            '/api/stats/playback',
            'youtube.com/api/stats/qoe'
        ];

        for (const pattern of blockedPatterns) {
            if (url.includes(pattern)) {
                log('⛔ Blocked:', url.substring(0, 80));
                return new Response('', { status: 204, statusText: 'Blocked' });
            }
        }

        const response = await originalFetch.apply(this, arguments);

        // Intercept YouTube API responses
        const interceptPatterns = [
            '/youtubei/v1/player',
            '/youtubei/v1/next',
            '/youtubei/v1/browse',
            '/youtubei/v1/search',
            '/youtubei/v1/guide'
        ];

        const shouldIntercept = interceptPatterns.some(p => url.includes(p));

        if (shouldIntercept) {
            try {
                const clone = response.clone();
                const text = await clone.text();

                try {
                    let json = JSON.parse(text); // Will be processed by our JSON.parse hook
                    removeAds(json); // Extra pass for safety

                    log('✅ Pruned fetch response');

                    return new Response(JSON.stringify(json), {
                        status: response.status,
                        statusText: response.statusText,
                        headers: response.headers
                    });
                } catch (e) {
                    // Not JSON
                }
            } catch (e) {
                log('Fetch intercept error:', e);
            }
        }

        return response;
    };

    // =============================================================================
    // 5. HOOK: XMLHttpRequest
    // =============================================================================

    const originalXHROpen = XMLHttpRequest.prototype.open;
    const originalXHRSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (method, url) {
        this._saturn_url = url;

        // Block ad requests
        const blockedPatterns = ['/pagead/', '/ptracking', '/api/stats/ads', 'doubleclick'];
        for (const pattern of blockedPatterns) {
            if (String(url).includes(pattern)) {
                this._saturn_blocked = true;
                log('⛔ Blocked XHR:', String(url).substring(0, 60));
            }
        }

        return originalXHROpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
        if (this._saturn_blocked) {
            return; // Don't send blocked requests
        }

        const xhr = this;
        const url = String(xhr._saturn_url || '');

        const interceptPatterns = ['/youtubei/v1/player', '/youtubei/v1/next'];
        const shouldIntercept = interceptPatterns.some(p => url.includes(p));

        if (shouldIntercept) {
            const originalOnReadyStateChange = xhr.onreadystatechange;

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4 && xhr.status === 200) {
                    try {
                        const json = JSON.parse(xhr.responseText);
                        removeAds(json);

                        Object.defineProperty(xhr, 'responseText', {
                            get: () => JSON.stringify(json),
                            configurable: true
                        });
                        Object.defineProperty(xhr, 'response', {
                            get: () => JSON.stringify(json),
                            configurable: true
                        });

                        log('✅ Pruned XHR response');
                    } catch (e) { }
                }

                if (originalOnReadyStateChange) {
                    originalOnReadyStateChange.apply(this, arguments);
                }
            };
        }

        return originalXHRSend.apply(this, arguments);
    };

    // =============================================================================
    // 6. IMMEDIATE AD CLEANUP - Run right now, before DOM is ready
    // =============================================================================

    // Process existing ytInitialPlayerResponse if it exists
    if (typeof window.ytInitialPlayerResponse !== 'undefined') {
        removeAds(window.ytInitialPlayerResponse);
        log('Pruned existing ytInitialPlayerResponse');
    }

    if (typeof window.ytInitialData !== 'undefined') {
        removeAds(window.ytInitialData);
        log('Pruned existing ytInitialData');
    }

    // Set up property watchers
    let _ytInitialPlayerResponse = window.ytInitialPlayerResponse;
    try {
        Object.defineProperty(window, 'ytInitialPlayerResponse', {
            get: function () { return _ytInitialPlayerResponse; },
            set: function (val) {
                if (val && typeof val === 'object') {
                    removeAds(val);
                    log('Intercepted ytInitialPlayerResponse assignment');
                }
                _ytInitialPlayerResponse = val;
            },
            configurable: true
        });
    } catch (e) { }

    let _ytInitialData = window.ytInitialData;
    try {
        Object.defineProperty(window, 'ytInitialData', {
            get: function () { return _ytInitialData; },
            set: function (val) {
                if (val && typeof val === 'object') {
                    removeAds(val);
                    log('Intercepted ytInitialData assignment');
                }
                _ytInitialData = val;
            },
            configurable: true
        });
    } catch (e) { }

    // =============================================================================
    // 7. COMPREHENSIVE CSS HIDING - Inject immediately
    // =============================================================================

    const cssRules = `
        /* ========== VIDEO PLAYER ADS ========== */
        .video-ads,
        .ytp-ad-module,
        .ytp-ad-overlay-container,
        .ytp-ad-text-overlay,
        .ytp-ad-overlay-slot,
        .ytp-ad-overlay-close-container,
        .ytp-ad-player-overlay,
        .ytp-ad-player-overlay-layout,
        .ytp-ad-image-overlay,
        .ytp-ad-action-interstitial,
        .ytp-ad-action-interstitial-slot,
        .ytp-ad-progress,
        .ytp-ad-progress-list,
        .ad-showing .ytp-ad-module,
        #player-ads,
        .ytp-paid-content-overlay,
        .ytp-ad-skip-button-slot,
        
        /* ========== SIDEBAR SPONSORED ADS ========== */
        ytd-ad-slot-renderer,
        ytd-banner-promo-renderer,
        ytd-in-feed-ad-layout-renderer,
        ytd-display-ad-renderer,
        ytd-promoted-sparkles-web-renderer,
        ytd-promoted-video-renderer,
        ytd-compact-promoted-video-renderer,
        ytd-promoted-sparkles-text-search-renderer,
        ytd-player-legacy-desktop-watch-ads-renderer,
        ytd-statement-banner-renderer[is-brand-banner],
        ytd-search-pyv-renderer,
        ytd-primetime-promo-renderer,
        ytd-companion-slot-renderer,
        ytd-action-companion-ad-renderer,
        
        /* ========== MASTHEAD & HOMEPAGE ADS ========== */
        #masthead-ad,
        ytd-rich-item-renderer:has(ytd-ad-slot-renderer),
        ytd-rich-section-renderer:has(ytd-ad-slot-renderer),
        
        /* ========== ENGAGEMENT PANEL ADS ========== */
        ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"],
        
        /* ========== PREMIUM UPSELLS ========== */
        ytd-mealbar-promo-renderer,
        .ytd-mealbar-promo-renderer,
        tp-yt-paper-dialog:has(.ytd-mealbar-promo-renderer),
        ytd-popup-container:has(yt-mealbar-promo-renderer),
        #ytp-premium-upsell,
        
        /* ========== MERCH & SHOPPING ========== */
        ytd-merch-shelf-renderer,
        ytd-info-panel-content-renderer[target-id="infopanel-shopping"],
        
        /* ========== SURVEY ADS ========== */
        .ytp-survey,
        ytd-survey-creator-renderer,
        
        /* ========== OVERLAY PROMOTIONS ========== */
        .ytp-featured-product,
        .iv-branding,
        .annotation,
        
        /* ========== MISC ADS ========== */
        #sponsor-ads,
        #related #player-ads,
        ytd-movie-offer-module-renderer,
        .ytd-watch-flexy[is-two-columns_] ytd-companion-slot-renderer
        
        {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            max-height: 0 !important;
            min-height: 0 !important;
            width: 0 !important;
            max-width: 0 !important;
            overflow: hidden !important;
            pointer-events: none !important;
            position: absolute !important;
            z-index: -9999 !important;
        }

        /* Force remove ad-showing state */
        .ad-showing video {
            visibility: visible !important;
        }
        
        .ad-showing .ytp-ad-player-overlay,
        .ad-showing .ytp-ad-player-overlay-layout {
            display: none !important;
        }

        /* Ensure main video is always visible */
        .html5-video-container {
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
        }
    `;

    function injectCSS() {
        const styleId = 'saturn-adblock-css';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = cssRules;

        // Try to inject to head or documentElement
        const target = document.head || document.documentElement;
        if (target) {
            target.appendChild(style);
            log('✅ Injected CSS rules');
        } else {
            // If no target yet, wait and retry
            setTimeout(injectCSS, 10);
        }
    }

    injectCSS();

    // =============================================================================
    // 8. AD SKIP AUTOMATION - Aggressive Skip
    // =============================================================================

    function skipAds() {
        // Click all possible skip buttons
        const skipSelectors = [
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            '.ytp-skip-ad-button',
            'button.ytp-ad-skip-button-slot',
            '.ytp-ad-skip-button-container button',
            '[class*="skip-button"]',
            '.ytp-ad-overlay-close-button',
            '.videoAdUiSkipButton'
        ];

        for (const selector of skipSelectors) {
            const btn = document.querySelector(selector);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                log('⏭️ Clicked skip button');
                return true;
            }
        }

        // Force skip by video manipulation
        const video = document.querySelector('video.html5-main-video');
        const adModule = document.querySelector('.ad-showing');

        if (video && adModule) {
            // Skip to end of ad
            if (video.duration && video.duration < 300) { // Less than 5 min = likely ad
                video.currentTime = video.duration;
                video.playbackRate = 16;
                log('⏭️ Force skipping ad video');
            }
            // Mute ad
            video.muted = true;
        }

        return false;
    }

    function hideAdElements() {
        // Remove ad-showing class
        const player = document.getElementById('movie_player');
        if (player) {
            player.classList.remove('ad-showing');
            player.classList.remove('ad-interrupting');
        }

        // Force hide ad overlays
        const overlays = document.querySelectorAll('.ytp-ad-player-overlay, .ytp-ad-overlay-container');
        overlays.forEach(el => {
            el.style.setProperty('display', 'none', 'important');
        });
    }

    // =============================================================================
    // 9. MUTATION OBSERVER - Watch for dynamic ad injection
    // =============================================================================

    function setupObserver() {
        const observer = new MutationObserver((mutations) => {
            let shouldProcess = false;

            for (const mutation of mutations) {
                // Check for class changes (ad-showing added)
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target;
                    if (target.classList && target.classList.contains('ad-showing')) {
                        shouldProcess = true;
                        break;
                    }
                }

                // Check for new ad elements
                if (mutation.type === 'childList' && mutation.addedNodes.length) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1) {
                            const tag = node.tagName?.toLowerCase() || '';
                            const className = node.className || '';

                            if (tag.includes('ad') || className.includes('ad') ||
                                tag === 'ytd-ad-slot-renderer' ||
                                tag === 'ytd-banner-promo-renderer' ||
                                tag === 'ytd-promoted-video-renderer') {
                                shouldProcess = true;
                                break;
                            }
                        }
                    }
                }
            }

            if (shouldProcess) {
                requestAnimationFrame(() => {
                    skipAds();
                    hideAdElements();
                });
            }
        });

        const target = document.body || document.documentElement;
        if (target) {
            observer.observe(target, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class']
            });
            log('✅ Mutation observer active');
        }
    }

    // =============================================================================
    // 10. INITIALIZE
    // =============================================================================

    function init() {
        injectCSS();
        skipAds();
        hideAdElements();
        setupObserver();

        // Aggressive interval check
        setInterval(() => {
            skipAds();
            hideAdElements();
        }, 250); // More frequent checks

        log('✅ Saturn AdBlock fully initialized!');
    }

    // Run immediately
    if (document.body) {
        init();
    } else {
        // Wait for body
        const bodyObserver = new MutationObserver(() => {
            if (document.body) {
                bodyObserver.disconnect();
                init();
            }
        });
        bodyObserver.observe(document.documentElement, { childList: true });
    }

    // Also run on DOMContentLoaded as fallback
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    }

    log('🔧 All hooks installed!');

})();
