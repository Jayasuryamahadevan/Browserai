import { ipcRenderer, contextBridge } from 'electron'

console.log('PRELOAD SCRIPT STARTING...');

const api = {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('ipcRenderer', api)
    console.log('Exposed ipcRenderer via contextBridge');
  } catch (error) {
    console.error('contextBridge failed:', error);
  }
} else {
  console.log('contextIsolation is false, assigning ipcRenderer to window');
  (window as any).ipcRenderer = api;
}

// Listen for selection changes in the guest page
window.addEventListener('mouseup', () => {
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const text = selection.toString().trim();

    // We send screen coordinates mostly, but rect is viewport relative.
    // The host needs to know where to show it. 
    // We'll send the client coordinates of the selection end.
    ipcRenderer.sendToHost('text-selected', {
      text,
      x: rect.left,
      y: rect.bottom, // Show below the selection
      width: rect.width,
      height: rect.height
    });
  } else {
    ipcRenderer.sendToHost('text-unselected');
  }
});

window.addEventListener('keyup', (_e) => {
  // Also check on keyup (shift+arrow selection)
  const selection = window.getSelection();
  if (selection && selection.toString().trim().length > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    ipcRenderer.sendToHost('text-selected', {
      text: selection.toString().trim(),
      x: rect.left,
      y: rect.bottom,
      width: rect.width,
      height: rect.height
    });
  } else {
    ipcRenderer.sendToHost('text-unselected');
  }
});
// --- YouTube Ad Blocker (Brave-like script injection) ---
if (window.location.hostname.includes('youtube.com')) {
  window.addEventListener('DOMContentLoaded', () => {
    // 1. Cosmetic Filtering (CSS)
    const style = document.createElement('style');
    style.innerHTML = `
            .video-ads, .ytp-ad-module, .ytp-ad-image-overlay,
            .ytd-ad-slot-renderer, ytd-ad-slot-renderer,
            #masthead-ad, ytd-rich-item-renderer:has(.ytd-ad-slot-renderer),
            .ytd-in-feed-ad-layout-renderer,
            .ytd-banner-promo-renderer-background
            { display: none !important; }
        `;
    document.head.appendChild(style);

    // 2. Video Ad Skipper (JS)
    setInterval(() => {
      // Click "Skip" button
      const skipBtn = document.querySelector('.ytp-ad-skip-button, .ytp-ad-skip-button-modern, .ytp-skip-ad-button');
      if (skipBtn) {
        (skipBtn as HTMLElement).click();
        console.log('Ad Skipped');
      }

      // Speed up / End unskippable ads
      const video = document.querySelector('video');
      const adModule = document.querySelector('.ytp-ad-module');
      // If ad module has content, likely an ad is playing
      if (video && adModule && adModule.children.length > 0) {
        // Check if it's actually an ad video
        const isAd = document.querySelector('.ad-interrupting');
        if (isAd) {
          video.playbackRate = 16.0;
          video.currentTime = video.duration || video.currentTime;
          // Mute to avoid high-pitched noise
          video.muted = true;
        } else {
          // specific check for unmuted original content? 
          // Usually we don't want to unmute automatically in case user muted it.
        }
      }

      // Close overlays
      const closeOverlay = document.querySelector('.ytp-ad-overlay-close-button');
      if (closeOverlay) (closeOverlay as HTMLElement).click();

    }, 500); // Check every 500ms
  });
}
// --- AI Auto-Submitter ---
const aiSites = ['chatgpt.com', 'gemini.google.com', 'claude.ai', 'perplexity.ai', 'x.com'];
if (aiSites.some(site => window.location.hostname.includes(site))) {
  window.addEventListener('DOMContentLoaded', () => {
    const checkAndSubmit = () => {
      // ChatGPT
      if (window.location.hostname.includes('chatgpt.com')) {
        const promptTextarea = document.querySelector('#prompt-textarea');
        const sendButton = document.querySelector('[data-testid="send-button"]');
        if (promptTextarea && promptTextarea.textContent && sendButton) {
          (sendButton as HTMLElement).click();
          console.log('[AutoSubmit] ChatGPT sent');
          return true; // Done
        }
      }

      // Gemini
      if (window.location.hostname.includes('gemini.google.com')) {
        const editor = document.querySelector('.ql-editor'); // Gemini often uses Quill or similar contenteditable
        const sendButton = document.querySelector('.send-button') || document.querySelector('button[aria-label="Send message"]');
        if (editor && editor.textContent?.trim() && sendButton) {
          (sendButton as HTMLElement).click();
          console.log('[AutoSubmit] Gemini sent');
          return true;
        }
      }

      // Claude
      if (window.location.hostname.includes('claude.ai')) {
        const contentEditable = document.querySelector('[contenteditable="true"]');
        // Claude's send button usually has an aria-label or specific icon
        const sendButton = document.querySelector('button[aria-label="Send Message"]') || document.querySelector('button:has(svg)');
        if (contentEditable && contentEditable.textContent?.trim() && sendButton) {
          // Often Claude requires a specialized click or event
          (sendButton as HTMLElement).click();
          console.log('[AutoSubmit] Claude sent');
          return true;
        }
      }

      // Perplexity (Usually auto-submits, but just in case)
      if (window.location.hostname.includes('perplexity.ai')) {
        // If there's a textarea with text and a submit button
        const textarea = document.querySelector('textarea');
        const button = document.querySelector('button[aria-label="Submit"]');
        if (textarea && textarea.value && button) {
          (button as HTMLElement).click();
          return true;
        }
      }

      return false;
    };

    // Attempt immediately
    if (!checkAndSubmit()) {
      // Retry for a few seconds
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (checkAndSubmit() || attempts > 20) { // 10 seconds max (20 * 500ms)
          clearInterval(interval);
        }
      }, 500);
    }
  });
}
