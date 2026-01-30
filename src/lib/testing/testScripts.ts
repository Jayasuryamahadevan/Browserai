/**
 * Saturn Testing Toolkit - Test Runners
 * 
 * Each function returns an array of TestResult objects.
 * These run in the renderer context and use IPC to execute
 * scripts in the webview context.
 */

import { TestCategory } from '../../store/useTestingStore';

// ═══════════════════════════════════════════════════════════════════════════
// ACCESSIBILITY TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const accessibilityTestScript = `
(function() {
    const results = [];
    
    // 1. Images without alt text
    const imagesNoAlt = document.querySelectorAll('img:not([alt])');
    const imagesEmptyAlt = document.querySelectorAll('img[alt=""]');
    results.push({
        id: 'a11y-alt-text',
        name: 'Image Alt Text',
        status: imagesNoAlt.length === 0 ? 'pass' : 'fail',
        details: imagesNoAlt.length === 0 
            ? 'All images have alt attributes' 
            : \`\${imagesNoAlt.length} images missing alt text\`,
        elements: Array.from(imagesNoAlt).map(el => el.outerHTML.slice(0, 100)),
        suggestion: 'Add descriptive alt text to all images for screen readers'
    });
    
    // 2. Buttons/links without accessible text
    const emptyButtons = document.querySelectorAll('button:empty:not([aria-label])');
    const emptyLinks = document.querySelectorAll('a:empty:not([aria-label])');
    const noTextCount = emptyButtons.length + emptyLinks.length;
    results.push({
        id: 'a11y-interactive-labels',
        name: 'Interactive Element Labels',
        status: noTextCount === 0 ? 'pass' : 'fail',
        details: noTextCount === 0 
            ? 'All interactive elements have accessible labels'
            : \`\${noTextCount} elements missing accessible text\`,
        suggestion: 'Add text content or aria-label to buttons and links'
    });
    
    // 3. Form inputs without labels
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="button"])');
    let unlabeledInputs = 0;
    inputs.forEach(input => {
        const id = input.id;
        const hasLabel = id && document.querySelector(\`label[for="\${id}"]\`);
        const hasAriaLabel = input.hasAttribute('aria-label') || input.hasAttribute('aria-labelledby');
        const wrappedInLabel = input.closest('label');
        if (!hasLabel && !hasAriaLabel && !wrappedInLabel) unlabeledInputs++;
    });
    results.push({
        id: 'a11y-form-labels',
        name: 'Form Input Labels',
        status: unlabeledInputs === 0 ? 'pass' : 'fail',
        details: unlabeledInputs === 0 
            ? 'All form inputs have associated labels'
            : \`\${unlabeledInputs} inputs missing labels\`,
        suggestion: 'Associate labels with inputs using for/id or wrap inputs in label elements'
    });
    
    // 4. Heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let skippedLevels = false;
    let prevLevel = 0;
    headings.forEach(h => {
        const level = parseInt(h.tagName[1]);
        if (prevLevel > 0 && level > prevLevel + 1) {
            skippedLevels = true;
        }
        prevLevel = level;
    });
    const h1Count = document.querySelectorAll('h1').length;
    results.push({
        id: 'a11y-headings',
        name: 'Heading Hierarchy',
        status: !skippedLevels && h1Count === 1 ? 'pass' : (skippedLevels ? 'fail' : 'warning'),
        details: h1Count === 0 ? 'No H1 found' : 
                 h1Count > 1 ? \`Multiple H1 tags (\${h1Count})\` :
                 skippedLevels ? 'Heading levels are skipped' : 
                 'Proper heading hierarchy',
        suggestion: 'Use one H1 per page and don\\'t skip heading levels (e.g., H1→H3)'
    });
    
    // 5. Language attribute
    const htmlLang = document.documentElement.lang;
    results.push({
        id: 'a11y-lang',
        name: 'Language Attribute',
        status: htmlLang ? 'pass' : 'fail',
        details: htmlLang ? \`Page language: \${htmlLang}\` : 'Missing lang attribute on <html>',
        suggestion: 'Add lang="en" (or appropriate language) to the html element'
    });
    
    // 6. Skip link
    const skipLink = document.querySelector('a[href="#main"], a[href="#content"], .skip-link, [class*="skip"]');
    results.push({
        id: 'a11y-skip-link',
        name: 'Skip Navigation Link',
        status: skipLink ? 'pass' : 'warning',
        details: skipLink ? 'Skip link found' : 'No skip link detected',
        suggestion: 'Add a skip link at the top for keyboard users to bypass navigation'
    });
    
    // 7. Color contrast (basic check - text on backgrounds)
    // This is a simplified check; full contrast checking requires computed styles
    results.push({
        id: 'a11y-contrast',
        name: 'Color Contrast',
        status: 'info',
        details: 'Manual review recommended for WCAG contrast ratios',
        suggestion: 'Ensure text has at least 4.5:1 contrast ratio with background'
    });
    
    // 8. Focus visible
    const focusHidden = document.querySelectorAll('[tabindex="-1"]:not([role])');
    results.push({
        id: 'a11y-focus',
        name: 'Keyboard Focus',
        status: focusHidden.length < 5 ? 'pass' : 'warning',
        details: \`\${focusHidden.length} elements with tabindex="-1"\`,
        suggestion: 'Ensure all interactive elements are keyboard accessible'
    });
    
    // 9. ARIA roles validation
    const ariaElements = document.querySelectorAll('[role]');
    let invalidRoles = 0;
    const validRoles = ['button', 'link', 'navigation', 'main', 'banner', 'contentinfo', 'complementary', 
                        'search', 'dialog', 'alert', 'alertdialog', 'tab', 'tablist', 'tabpanel', 
                        'menu', 'menuitem', 'listbox', 'option', 'checkbox', 'radio', 'textbox'];
    ariaElements.forEach(el => {
        if (!validRoles.includes(el.getAttribute('role'))) invalidRoles++;
    });
    results.push({
        id: 'a11y-aria',
        name: 'ARIA Roles',
        status: invalidRoles === 0 ? 'pass' : 'warning',
        details: invalidRoles === 0 
            ? \`\${ariaElements.length} ARIA roles found, all valid\` 
            : \`\${invalidRoles} potentially invalid ARIA roles\`,
        suggestion: 'Use standard ARIA roles and ensure required attributes are present'
    });
    
    // 10. Touch targets (minimum 44x44px recommended)
    const interactives = document.querySelectorAll('button, a, input[type="submit"], input[type="button"]');
    let smallTargets = 0;
    interactives.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width < 44 || rect.height < 44) smallTargets++;
    });
    results.push({
        id: 'a11y-touch-targets',
        name: 'Touch Target Size',
        status: smallTargets === 0 ? 'pass' : 'warning',
        details: smallTargets === 0 
            ? 'All touch targets are adequately sized'
            : \`\${smallTargets} elements smaller than 44x44px\`,
        suggestion: 'Ensure buttons and links are at least 44x44px for mobile users'
    });
    
    // 11. Tables with headers
    const tables = document.querySelectorAll('table');
    let tablesWithoutHeaders = 0;
    tables.forEach(table => {
        if (!table.querySelector('th')) tablesWithoutHeaders++;
    });
    results.push({
        id: 'a11y-tables',
        name: 'Table Headers',
        status: tables.length === 0 ? 'info' : (tablesWithoutHeaders === 0 ? 'pass' : 'warning'),
        details: tables.length === 0 
            ? 'No tables found' 
            : (tablesWithoutHeaders === 0 
                ? 'All tables have header cells'
                : \`\${tablesWithoutHeaders} tables missing <th> elements\`),
        suggestion: 'Use <th> elements to define table headers'
    });
    
    // 12. Landmark regions
    const hasMain = document.querySelector('main, [role="main"]');
    const hasNav = document.querySelector('nav, [role="navigation"]');
    results.push({
        id: 'a11y-landmarks',
        name: 'Landmark Regions',
        status: hasMain && hasNav ? 'pass' : (hasMain || hasNav ? 'warning' : 'fail'),
        details: \`Main: \${hasMain ? '✓' : '✗'} | Nav: \${hasNav ? '✓' : '✗'}\`,
        suggestion: 'Use semantic elements (main, nav, header, footer) or ARIA landmark roles'
    });
    
    return results;
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const performanceTestScript = `
(function() {
    const results = [];
    
    // 1. Page load timing
    const perf = performance.getEntriesByType('navigation')[0];
    if (perf) {
        const loadTime = Math.round(perf.loadEventEnd - perf.startTime);
        results.push({
            id: 'perf-load-time',
            name: 'Page Load Time',
            status: loadTime < 3000 ? 'pass' : (loadTime < 5000 ? 'warning' : 'fail'),
            details: \`\${loadTime}ms\`,
            suggestion: loadTime > 3000 ? 'Optimize assets and reduce blocking resources' : undefined
        });
        
        // DOM Content Loaded
        const dcl = Math.round(perf.domContentLoadedEventEnd - perf.startTime);
        results.push({
            id: 'perf-dcl',
            name: 'DOM Content Loaded',
            status: dcl < 1500 ? 'pass' : (dcl < 3000 ? 'warning' : 'fail'),
            details: \`\${dcl}ms\`,
            suggestion: dcl > 1500 ? 'Reduce JavaScript blocking the DOM' : undefined
        });
    }
    
    // 2. Resource count
    const resources = performance.getEntriesByType('resource');
    results.push({
        id: 'perf-requests',
        name: 'Total Requests',
        status: resources.length < 50 ? 'pass' : (resources.length < 100 ? 'warning' : 'fail'),
        details: \`\${resources.length} requests\`,
        suggestion: resources.length > 50 ? 'Reduce number of requests by bundling assets' : undefined
    });
    
    // 3. Total transfer size
    let totalSize = 0;
    resources.forEach(r => { totalSize += r.transferSize || 0; });
    const sizeMB = (totalSize / 1024 / 1024).toFixed(2);
    results.push({
        id: 'perf-size',
        name: 'Total Transfer Size',
        status: totalSize < 2000000 ? 'pass' : (totalSize < 5000000 ? 'warning' : 'fail'),
        details: \`\${sizeMB} MB\`,
        suggestion: totalSize > 2000000 ? 'Compress and optimize assets' : undefined
    });
    
    // 4. Image count and lazy loading
    const images = document.querySelectorAll('img');
    const belowFoldImages = Array.from(images).filter(img => {
        const rect = img.getBoundingClientRect();
        return rect.top > window.innerHeight;
    });
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    results.push({
        id: 'perf-lazy-images',
        name: 'Image Lazy Loading',
        status: belowFoldImages.length === 0 || lazyImages.length >= belowFoldImages.length / 2 ? 'pass' : 'warning',
        details: \`\${lazyImages.length}/\${images.length} images use lazy loading\`,
        suggestion: 'Add loading="lazy" to images below the fold'
    });
    
    // 5. Render-blocking scripts
    const blockingScripts = document.querySelectorAll('head script:not([async]):not([defer])');
    results.push({
        id: 'perf-blocking-scripts',
        name: 'Render-Blocking Scripts',
        status: blockingScripts.length === 0 ? 'pass' : 'warning',
        details: \`\${blockingScripts.length} blocking scripts in <head>\`,
        suggestion: 'Add async or defer to scripts, or move to end of body'
    });
    
    // 6. External fonts
    const fontResources = resources.filter(r => r.name.includes('font') || r.name.includes('woff'));
    results.push({
        id: 'perf-fonts',
        name: 'Web Fonts',
        status: fontResources.length <= 4 ? 'pass' : 'warning',
        details: \`\${fontResources.length} font files loaded\`,
        suggestion: fontResources.length > 4 ? 'Limit font variations and use font-display: swap' : undefined
    });
    
    // 7. Third-party scripts
    const currentHost = window.location.hostname;
    const thirdParty = resources.filter(r => {
        try { return new URL(r.name).hostname !== currentHost; }
        catch { return false; }
    });
    results.push({
        id: 'perf-third-party',
        name: 'Third-Party Resources',
        status: thirdParty.length < 20 ? 'pass' : 'warning',
        details: \`\${thirdParty.length} external resources\`,
        suggestion: thirdParty.length >= 20 ? 'Review and minimize third-party dependencies' : undefined
    });
    
    // 8. DOM size
    const domNodes = document.getElementsByTagName('*').length;
    results.push({
        id: 'perf-dom-size',
        name: 'DOM Size',
        status: domNodes < 1500 ? 'pass' : (domNodes < 3000 ? 'warning' : 'fail'),
        details: \`\${domNodes} DOM nodes\`,
        suggestion: domNodes > 1500 ? 'Reduce DOM complexity and remove unnecessary elements' : undefined
    });
    
    // 9. CSS files
    const cssFiles = resources.filter(r => r.name.endsWith('.css') || r.initiatorType === 'css');
    let cssSize = 0;
    cssFiles.forEach(r => { cssSize += r.transferSize || 0; });
    results.push({
        id: 'perf-css',
        name: 'CSS Size',
        status: cssSize < 100000 ? 'pass' : (cssSize < 300000 ? 'warning' : 'fail'),
        details: \`\${(cssSize / 1024).toFixed(1)} KB across \${cssFiles.length} files\`,
        suggestion: cssSize > 100000 ? 'Minify CSS and remove unused styles' : undefined
    });
    
    // 10. JavaScript size
    const jsFiles = resources.filter(r => r.name.endsWith('.js') || r.initiatorType === 'script');
    let jsSize = 0;
    jsFiles.forEach(r => { jsSize += r.transferSize || 0; });
    results.push({
        id: 'perf-js',
        name: 'JavaScript Size',
        status: jsSize < 500000 ? 'pass' : (jsSize < 1000000 ? 'warning' : 'fail'),
        details: \`\${(jsSize / 1024).toFixed(1)} KB across \${jsFiles.length} files\`,
        suggestion: jsSize > 500000 ? 'Code-split and tree-shake JavaScript' : undefined
    });
    
    return results;
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// SECURITY TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const securityTestScript = `
(function() {
    const results = [];
    
    // 1. HTTPS
    results.push({
        id: 'sec-https',
        name: 'HTTPS Connection',
        status: location.protocol === 'https:' ? 'pass' : 'fail',
        details: location.protocol === 'https:' ? 'Site uses HTTPS' : 'Site uses insecure HTTP',
        suggestion: 'Enable HTTPS for all pages'
    });
    
    // 2. Mixed content (HTTP resources on HTTPS page)
    const allResources = performance.getEntriesByType('resource');
    const httpResources = allResources.filter(r => r.name.startsWith('http://'));
    results.push({
        id: 'sec-mixed-content',
        name: 'Mixed Content',
        status: httpResources.length === 0 ? 'pass' : 'fail',
        details: httpResources.length === 0 
            ? 'No mixed content detected' 
            : \`\${httpResources.length} insecure resources\`,
        elements: httpResources.slice(0, 5).map(r => r.name),
        suggestion: 'Load all resources over HTTPS'
    });
    
    // 3. External links with target="_blank"
    const unsafeLinks = document.querySelectorAll('a[target="_blank"]:not([rel*="noopener"])');
    results.push({
        id: 'sec-noopener',
        name: 'External Link Safety',
        status: unsafeLinks.length === 0 ? 'pass' : 'warning',
        details: unsafeLinks.length === 0 
            ? 'All external links are safe' 
            : \`\${unsafeLinks.length} links missing rel="noopener"\`,
        suggestion: 'Add rel="noopener noreferrer" to external links'
    });
    
    // 4. Password fields security
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    const insecurePasswords = location.protocol !== 'https:' && passwordInputs.length > 0;
    results.push({
        id: 'sec-password',
        name: 'Password Field Security',
        status: !insecurePasswords ? 'pass' : 'fail',
        details: passwordInputs.length === 0 
            ? 'No password fields found' 
            : (insecurePasswords ? 'Password field on insecure page!' : 'Password fields on HTTPS'),
        suggestion: 'Never have password fields on HTTP pages'
    });
    
    // 5. Iframe sandboxing
    const iframes = document.querySelectorAll('iframe');
    const unsandboxedIframes = document.querySelectorAll('iframe:not([sandbox])');
    results.push({
        id: 'sec-iframe',
        name: 'Iframe Sandboxing',
        status: iframes.length === 0 || unsandboxedIframes.length === 0 ? 'pass' : 'warning',
        details: iframes.length === 0 
            ? 'No iframes found' 
            : \`\${unsandboxedIframes.length}/\${iframes.length} iframes without sandbox\`,
        suggestion: 'Add sandbox attribute to iframes with restricted permissions'
    });
    
    // 6. Form actions
    const insecureForms = document.querySelectorAll('form[action^="http://"]');
    results.push({
        id: 'sec-form-action',
        name: 'Form Action Security',
        status: insecureForms.length === 0 ? 'pass' : 'fail',
        details: insecureForms.length === 0 
            ? 'All forms submit securely' 
            : \`\${insecureForms.length} forms submit to HTTP\`,
        suggestion: 'Ensure all form actions use HTTPS'
    });
    
    // 7. Inline event handlers (potential XSS vectors)
    const inlineHandlers = document.querySelectorAll('[onclick], [onerror], [onload], [onmouseover]');
    results.push({
        id: 'sec-inline-handlers',
        name: 'Inline Event Handlers',
        status: inlineHandlers.length < 5 ? 'pass' : 'warning',
        details: \`\${inlineHandlers.length} inline event handlers\`,
        suggestion: 'Use addEventListener instead of inline handlers for CSP compatibility'
    });
    
    // 8. Sensitive patterns in HTML (credit cards, SSN)
    const bodyText = document.body.innerText;
    const ccPattern = /\\b(?:\\d{4}[-\\s]?){3}\\d{4}\\b/g;
    const ssnPattern = /\\b\\d{3}-\\d{2}-\\d{4}\\b/g;
    const ccMatches = (bodyText.match(ccPattern) || []).length;
    const ssnMatches = (bodyText.match(ssnPattern) || []).length;
    results.push({
        id: 'sec-sensitive-data',
        name: 'Sensitive Data Exposure',
        status: ccMatches === 0 && ssnMatches === 0 ? 'pass' : 'fail',
        details: ccMatches === 0 && ssnMatches === 0 
            ? 'No sensitive data patterns found' 
            : \`Potential exposure: \${ccMatches} CC, \${ssnMatches} SSN patterns\`,
        suggestion: 'Never display full credit card numbers or SSNs in the DOM'
    });
    
    // 9. Autocomplete on sensitive fields
    const creditCardFields = document.querySelectorAll('input[type="text"][name*="card"], input[type="text"][name*="credit"]');
    const noAutocomplete = document.querySelectorAll('input[autocomplete="off"]');
    results.push({
        id: 'sec-autocomplete',
        name: 'Autocomplete Security',
        status: 'info',
        details: \`\${noAutocomplete.length} fields disable autocomplete\`,
        suggestion: 'Use autocomplete="off" for sensitive fields, but allow on login forms'
    });
    
    // 10. Document.write usage (security/performance risk)
    results.push({
        id: 'sec-document-write',
        name: 'Document.write Usage',
        status: 'info',
        details: 'Cannot detect document.write from DOM alone',
        suggestion: 'Avoid document.write() as it can be exploited and blocks parsing'
    });
    
    return results;
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// SEO TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const seoTestScript = `
(function() {
    const results = [];
    
    // 1. Meta title
    const title = document.title;
    results.push({
        id: 'seo-title',
        name: 'Page Title',
        status: title && title.length >= 30 && title.length <= 60 ? 'pass' : 
                (title ? 'warning' : 'fail'),
        details: title ? \`"\${title}" (\${title.length} chars)\` : 'No title found',
        suggestion: 'Title should be 50-60 characters for optimal display'
    });
    
    // 2. Meta description
    const metaDesc = document.querySelector('meta[name="description"]');
    const descContent = metaDesc?.getAttribute('content') || '';
    results.push({
        id: 'seo-description',
        name: 'Meta Description',
        status: descContent && descContent.length >= 120 && descContent.length <= 160 ? 'pass' :
                (descContent ? 'warning' : 'fail'),
        details: descContent 
            ? \`\${descContent.length} characters\` 
            : 'No meta description',
        suggestion: 'Description should be 150-160 characters'
    });
    
    // 3. Canonical URL
    const canonical = document.querySelector('link[rel="canonical"]');
    results.push({
        id: 'seo-canonical',
        name: 'Canonical URL',
        status: canonical ? 'pass' : 'warning',
        details: canonical ? canonical.getAttribute('href') : 'No canonical URL defined',
        suggestion: 'Define a canonical URL to prevent duplicate content issues'
    });
    
    // 4. Open Graph tags
    const ogTitle = document.querySelector('meta[property="og:title"]');
    const ogDesc = document.querySelector('meta[property="og:description"]');
    const ogImage = document.querySelector('meta[property="og:image"]');
    const ogScore = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
    results.push({
        id: 'seo-og',
        name: 'Open Graph Tags',
        status: ogScore === 3 ? 'pass' : (ogScore > 0 ? 'warning' : 'fail'),
        details: \`Title: \${ogTitle ? '✓' : '✗'} | Desc: \${ogDesc ? '✓' : '✗'} | Image: \${ogImage ? '✓' : '✗'}\`,
        suggestion: 'Add og:title, og:description, og:image for social sharing'
    });
    
    // 5. Twitter Card
    const twitterCard = document.querySelector('meta[name="twitter:card"]');
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    results.push({
        id: 'seo-twitter',
        name: 'Twitter Card',
        status: twitterCard ? 'pass' : 'warning',
        details: twitterCard 
            ? \`Card type: \${twitterCard.getAttribute('content')}\` 
            : 'No Twitter Card meta tags',
        suggestion: 'Add twitter:card, twitter:title, twitter:description'
    });
    
    // 6. Structured data
    const jsonLd = document.querySelectorAll('script[type="application/ld+json"]');
    const microdata = document.querySelectorAll('[itemscope]');
    results.push({
        id: 'seo-structured',
        name: 'Structured Data',
        status: jsonLd.length > 0 || microdata.length > 0 ? 'pass' : 'warning',
        details: \`JSON-LD: \${jsonLd.length} | Microdata: \${microdata.length}\`,
        suggestion: 'Add Schema.org structured data for rich search results'
    });
    
    // 7. Robots meta
    const robotsMeta = document.querySelector('meta[name="robots"]');
    results.push({
        id: 'seo-robots',
        name: 'Robots Meta',
        status: robotsMeta ? 'pass' : 'info',
        details: robotsMeta 
            ? robotsMeta.getAttribute('content') 
            : 'No robots meta (default: index, follow)',
        suggestion: 'Use robots meta to control indexing if needed'
    });
    
    // 8. Heading structure (SEO perspective)
    const h1s = document.querySelectorAll('h1');
    results.push({
        id: 'seo-h1',
        name: 'H1 Tag',
        status: h1s.length === 1 ? 'pass' : (h1s.length > 1 ? 'warning' : 'fail'),
        details: h1s.length === 0 
            ? 'No H1 tag found' 
            : (h1s.length === 1 ? h1s[0].textContent.slice(0, 60) : \`\${h1s.length} H1 tags\`),
        suggestion: 'Have exactly one H1 containing the primary keyword'
    });
    
    return results;
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// HTML VALIDATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const htmlTestScript = `
(function() {
    const results = [];
    
    // 1. Doctype
    const hasDoctype = document.doctype !== null;
    results.push({
        id: 'html-doctype',
        name: 'HTML5 Doctype',
        status: hasDoctype ? 'pass' : 'fail',
        details: hasDoctype ? 'Valid doctype present' : 'Missing doctype declaration',
        suggestion: 'Start the document with <!DOCTYPE html>'
    });
    
    // 2. Duplicate IDs
    const allIds = document.querySelectorAll('[id]');
    const idMap = {};
    let duplicates = 0;
    allIds.forEach(el => {
        const id = el.id;
        if (idMap[id]) duplicates++;
        idMap[id] = true;
    });
    results.push({
        id: 'html-duplicate-ids',
        name: 'Duplicate IDs',
        status: duplicates === 0 ? 'pass' : 'fail',
        details: duplicates === 0 
            ? \`\${allIds.length} unique IDs\` 
            : \`\${duplicates} duplicate IDs found\`,
        suggestion: 'Each ID must be unique on the page'
    });
    
    // 3. Deprecated elements
    const deprecated = document.querySelectorAll('center, font, marquee, blink, frame, frameset');
    results.push({
        id: 'html-deprecated',
        name: 'Deprecated Elements',
        status: deprecated.length === 0 ? 'pass' : 'fail',
        details: deprecated.length === 0 
            ? 'No deprecated elements' 
            : \`\${deprecated.length} deprecated elements found\`,
        suggestion: 'Replace deprecated HTML with modern equivalents and CSS'
    });
    
    // 4. Viewport meta
    const viewport = document.querySelector('meta[name="viewport"]');
    results.push({
        id: 'html-viewport',
        name: 'Viewport Meta',
        status: viewport ? 'pass' : 'fail',
        details: viewport 
            ? viewport.getAttribute('content') 
            : 'Missing viewport meta tag',
        suggestion: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">'
    });
    
    // 5. Charset
    const charset = document.querySelector('meta[charset]') || 
                   document.querySelector('meta[http-equiv="Content-Type"]');
    results.push({
        id: 'html-charset',
        name: 'Character Encoding',
        status: charset ? 'pass' : 'warning',
        details: charset 
            ? (charset.getAttribute('charset') || 'Content-Type declared') 
            : 'No charset declaration',
        suggestion: 'Add <meta charset="UTF-8"> early in <head>'
    });
    
    // 6. Empty links/buttons
    const emptyLinks = document.querySelectorAll('a[href="#"], a[href=""], a[href="javascript:void(0)"]');
    results.push({
        id: 'html-empty-links',
        name: 'Empty/Invalid Links',
        status: emptyLinks.length === 0 ? 'pass' : 'warning',
        details: \`\${emptyLinks.length} links with empty/placeholder hrefs\`,
        suggestion: 'Use proper URLs or button elements instead'
    });
    
    return results;
})();
`;

// ═══════════════════════════════════════════════════════════════════════════
// BEST PRACTICES TESTS
// ═══════════════════════════════════════════════════════════════════════════

export const bestPracticesTestScript = `
(function() {
    const results = [];
    
    // 1. Favicon
    const favicon = document.querySelector('link[rel="icon"], link[rel="shortcut icon"]');
    results.push({
        id: 'bp-favicon',
        name: 'Favicon',
        status: favicon ? 'pass' : 'warning',
        details: favicon ? 'Favicon found' : 'No favicon detected',
        suggestion: 'Add a favicon for browser tabs and bookmarks'
    });
    
    // 2. Print stylesheet
    const printCss = document.querySelector('link[media="print"]');
    const hasPrintStyles = printCss || 
                          Array.from(document.styleSheets).some(s => 
                              s.media?.mediaText?.includes('print'));
    results.push({
        id: 'bp-print',
        name: 'Print Stylesheet',
        status: hasPrintStyles ? 'pass' : 'info',
        details: hasPrintStyles ? 'Print styles defined' : 'No print-specific styles',
        suggestion: 'Add @media print styles for better printed output'
    });
    
    // 3. Mobile-friendly tap areas
    const smallClickables = document.querySelectorAll('a, button');
    let tooSmall = 0;
    smallClickables.forEach(el => {
        const rect = el.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.width < 32 || rect.height < 32)) {
            tooSmall++;
        }
    });
    results.push({
        id: 'bp-tap-targets',
        name: 'Mobile Tap Targets',
        status: tooSmall < 5 ? 'pass' : 'warning',
        details: tooSmall === 0 
            ? 'All tap targets are adequately sized' 
            : \`\${tooSmall} elements may be too small for touch\`,
        suggestion: 'Ensure clickable elements are at least 44x44 CSS pixels'
    });
    
    // 4. Console errors (we can't fully detect, but check for error handlers)
    results.push({
        id: 'bp-errors',
        name: 'JavaScript Errors',
        status: 'info',
        details: 'Check browser console for errors',
        suggestion: 'Fix any JavaScript errors shown in the console'
    });
    
    return results;
})();
`;

// Category to script mapping
export const testScripts: Record<TestCategory, string> = {
    accessibility: accessibilityTestScript,
    performance: performanceTestScript,
    security: securityTestScript,
    seo: seoTestScript,
    html: htmlTestScript,
    bestpractices: bestPracticesTestScript
};
