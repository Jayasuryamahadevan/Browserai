import { app, BrowserWindow, ipcMain, session } from 'electron';
import fsLib from 'node:fs';
import fs from 'node:fs'; // Alias for new code
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn, ChildProcess } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load YouTube AdBlock script - Load from source electron directory, not dist-electron
// During dev: __dirname is dist-electron, script is in ../electron/adblock-scripts/
// During prod: similar structure
const YOUTUBE_ADBLOCK_SCRIPT_PATH = path.join(__dirname, '..', 'electron', 'adblock-scripts', 'youtube.js');
let YOUTUBE_ADBLOCK_SCRIPT = '';
try {
  YOUTUBE_ADBLOCK_SCRIPT = fsLib.readFileSync(YOUTUBE_ADBLOCK_SCRIPT_PATH, 'utf-8');
  console.log('[AdBlock] Loaded YouTube adblock script from:', YOUTUBE_ADBLOCK_SCRIPT_PATH);
} catch (e) {
  console.error('[AdBlock] Failed to load YouTube adblock script:', e);
}

// Load Memory Tracker script for semantic memory
const MEMORY_TRACKER_SCRIPT_PATH = path.join(__dirname, '..', 'electron', 'memory-tracker.js');
let MEMORY_TRACKER_SCRIPT = '';
try {
  MEMORY_TRACKER_SCRIPT = fsLib.readFileSync(MEMORY_TRACKER_SCRIPT_PATH, 'utf-8');
  console.log('[Memory] Loaded memory tracker script from:', MEMORY_TRACKER_SCRIPT_PATH);
} catch (e) {
  console.error('[Memory] Failed to load memory tracker script:', e);
}

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// --- Memory Engine Auto-Start ---
let memoryEngineProcess: ChildProcess | null = null;
const MEMORY_ENGINE_DIR = path.join(process.env.APP_ROOT, 'memory-engine');
const MEMORY_ENGINE_SCRIPT = path.join(MEMORY_ENGINE_DIR, 'start_engine.py');

function startMemoryEngine() {
  // Check if memory engine script exists
  if (!fsLib.existsSync(MEMORY_ENGINE_SCRIPT)) {
    console.log('[Memory] Memory engine script not found at:', MEMORY_ENGINE_SCRIPT);
    return;
  }

  console.log('[Memory] Starting memory engine...');

  try {
    // Spawn Python process
    memoryEngineProcess = spawn('python', [MEMORY_ENGINE_SCRIPT], {
      cwd: MEMORY_ENGINE_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: false,
      shell: true
    });

    memoryEngineProcess.stdout?.on('data', (data) => {
      console.log('[Memory Engine]', data.toString().trim());
    });

    memoryEngineProcess.stderr?.on('data', (data) => {
      const msg = data.toString().trim();
      // Filter out INFO messages that uvicorn sends to stderr
      if (!msg.includes('INFO:')) {
        console.error('[Memory Engine]', msg);
      } else {
        console.log('[Memory Engine]', msg);
      }
    });

    memoryEngineProcess.on('error', (err) => {
      console.error('[Memory] Failed to start engine:', err.message);
      memoryEngineProcess = null;
    });

    memoryEngineProcess.on('exit', (code) => {
      console.log('[Memory] Engine exited with code:', code);
      memoryEngineProcess = null;
    });

    console.log('[Memory] Engine started with PID:', memoryEngineProcess.pid);
  } catch (err) {
    console.error('[Memory] Failed to spawn engine:', err);
  }
}

async function stopMemoryEngine() {
  if (memoryEngineProcess) {
    console.log('[Memory] Stopping memory engine...');
    const pid = memoryEngineProcess.pid;
    memoryEngineProcess = null; // Clear reference immediately to prevent race conditions

    try {
      if (process.platform === 'win32' && pid) {
        await new Promise<void>((resolve) => {
          const killer = spawn('taskkill', ['/pid', String(pid), '/f', '/t']);
          killer.on('exit', () => resolve());
          killer.on('error', () => resolve()); // If fails, we proceed
        });
      } else if (pid) {
        process.kill(pid, 'SIGTERM');
        // Give it a moment to die
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (err) {
      console.error('[Memory] Failed to stop engine:', err);
    }
    console.log('[Memory] Engine stopped');
  }
}

// Graceful shutdown
app.on('before-quit', async () => {
  await stopMemoryEngine();
});

app.on('will-quit', () => {
  // Sync kill attempt if possible, but async is hard here.
  // We rely on before-quit usually.
});

// ...

ipcMain.handle('memory-stop', async () => {
  await stopMemoryEngine();
  return true;
});

// MCP Server removed for stability

// ┌───────────────────────────────────────────────────────────────────────────┐
// │ CREATE WINDOW                                                             │
// └───────────────────────────────────────────────────────────────────────────┘

function createWindow() {
  win = new BrowserWindow({
    frame: false,
    width: 1200,
    height: 800,
    minHeight: 600,
    minWidth: 800,
    title: 'Saturn Browser', // Default title
    backgroundColor: '#000000', // Set default background black
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webviewTag: true, // Enable <webview> tag
      preload: path.join(__dirname, "preload.mjs"),
      webSecurity: false, // For advanced research features (adblock, etc.)
    },
  });

  // MCP Server initialization removed for stability
  // mcpServer.setMainWindow(win);
  // mcpServer.start(3005);

  // Maximize the window by default
  win.maximize();

  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  console.log('[Main] VITE_DEV_SERVER_URL:', VITE_DEV_SERVER_URL);
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // Fallback for dev if variable missing
    win.loadURL('http://localhost:5173').catch(() => {
      console.log('[Main] Failed to load localhost:5173, loading dist');
      win?.loadFile(path.join(RENDERER_DIST, 'index.html'))
    });
  }

  // --- BRAVE-LIKE PROTECTION (Per-Window) ---

  // 1. Popup & Redirect Protection
  // This must be per-webcontents (main window).
  // Note: For <webview> tags, they handle their own window open events often, but
  // if they bubble or if we want to catch renderer popups:
  win.webContents.setWindowOpenHandler(({ url: _url }) => {
    // console.log("Blocked Popup:", url);
    return { action: 'deny' };
  });
}


// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.

// IPC Handler for injecting YouTube adblock script into webviews
ipcMain.handle('get-youtube-adblock-script', () => {
  return YOUTUBE_ADBLOCK_SCRIPT;
});

// IPC Handler for injecting Memory Tracker script into webviews
ipcMain.handle('get-memory-tracker-script', () => {
  return MEMORY_TRACKER_SCRIPT;
});

ipcMain.handle('get-preload-path', () => {
  return path.join(__dirname, 'preload.mjs');
});


// --- ADVANCED AD BLOCKER (Brave-like) ---
const BLOCKLIST_URLS = [
  'https://raw.githubusercontent.com/justdomains/blocklists/master/lists/easylist-justdomains.txt',
  'https://raw.githubusercontent.com/justdomains/blocklists/master/lists/easyprivacy-justdomains.txt',
  'https://raw.githubusercontent.com/StevenBlack/hosts/master/hosts'
];

class BlocklistManager {
  private blockedDomains: Set<string> = new Set();
  private isReady: boolean = false;
  private cachePath: string;

  constructor() {
    this.cachePath = path.join(app.getPath('userData'), 'adblock-cache.json');
    this.init();
  }

  async init() {
    if (fs.existsSync(this.cachePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.cachePath, 'utf-8'));
        this.blockedDomains = new Set(data);
        this.isReady = true;
        console.log(`[AdBlock] Loaded ${this.blockedDomains.size} domains from cache.`);
      } catch (e) {
        console.error('[AdBlock] Cache corrupted, fetching new lists...');
      }
    }

    // Always update in background
    this.updateLists();
  }

  async updateLists() {
    console.log('[AdBlock] Updating blocklists...');
    const newSet = new Set<string>();

    for (const url of BLOCKLIST_URLS) {
      try {
        // Use Electron/Node global fetch
        const response = await fetch(url);
        const text = await response.text();

        const lines = text.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('!')) continue;

          // Handle hosts file format (0.0.0.0 domain.com)
          const parts = trimmed.split(/\s+/);
          if (parts.length >= 2 && (parts[0] === '0.0.0.0' || parts[0] === '127.0.0.1')) {
            newSet.add(parts[1]);
          } else {
            // Just domains
            newSet.add(trimmed);
          }
        }
      } catch (e) {
        console.error(`[AdBlock] Failed to fetch ${url}:`, e);
      }
    }

    if (newSet.size > 0) {
      this.blockedDomains = newSet;
      this.isReady = true;
      fs.writeFileSync(this.cachePath, JSON.stringify(Array.from(this.blockedDomains)));
      console.log(`[AdBlock] Update complete. Blocking ${this.blockedDomains.size} domains.`);
    }
  }

  shouldBlock(url: string): boolean {
    if (!this.isReady) return false;
    try {
      const hostname = new URL(url).hostname;
      // Check exact match
      if (this.blockedDomains.has(hostname)) return true;

      // Check subdomains (e.g. ads.google.com -> google.com)
      const parts = hostname.split('.');
      while (parts.length > 1) {
        if (this.blockedDomains.has(parts.join('.'))) return true;
        parts.shift();
      }
    } catch (e) {
      return false;
    }
    return false;
  }
}

let adBlocker: BlocklistManager | null = null;

app.whenReady().then(() => {
  // Memory Engine auto-start disabled - was causing 16GB memory allocation failure
  // startMemoryEngine();

  // Initialize AdBlocker now that App is ready (so getPath works)
  adBlocker = new BlocklistManager();

  // 1. Ad & Tracker Blocking (Global Session)
  session.defaultSession.webRequest.onBeforeRequest({ urls: ["<all_urls>"] }, (details, callback) => {
    const url = details.url;

    // 1. Whitelist Localhost / DevTools (including WebSocket for Vite HMR)
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1') ||
      url.startsWith('ws://localhost') || url.startsWith('ws://127.0.0.1') ||
      url.startsWith('wss://localhost') || url.startsWith('wss://127.0.0.1') ||
      url.startsWith('devtools:')) {
      callback({ cancel: false });
      return;
    }

    // 2. Whitelist Critical Domains (Main Frame)
    // Prevents accidental blocking of Google/YouTube main pages if they appear in blocklists
    const hostname = new URL(url).hostname;
    if (hostname.endsWith('google.com') || hostname.endsWith('youtube.com') || hostname.endsWith('github.com')) {
      // Allow main navigation to these sites always
      if (details.resourceType === 'mainFrame') {
        callback({ cancel: false });
        return;
      }
    }

    // 3. AdBlock Check
    // Generally avoid blocking mainFrame unless absolutely necessary, to prevent crash-like errors
    if (adBlocker && adBlocker.shouldBlock(url)) {
      // If it's a mainFrame request, be lenient?
      // Some blocklists include redirect domains, so blocking main_frame is valid sometimes.
      // But for now, let's log it.
      console.log(`[AdBlock] Blocked: ${url} (Type: ${details.resourceType})`);
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });

  // 2. Security Headers (Global Session)
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({ responseHeaders: { ...details.responseHeaders } });
  });

  createWindow();
})

// --- IPC HANDLERS ---
import { net } from 'electron';

const JESSICA_BASE_DIR = 'D:\\JessicaSpace';
const DEBUG_LOG = 'D:\\jessi_debug.log';

function log(msg: string) {
  try {
    fs.appendFileSync(DEBUG_LOG, `[${new Date().toISOString()}] ${msg}\n`);
  } catch (e) {
    console.error('Failed to log', e);
  }
}

// Ensure base dir exists
if (!fs.existsSync(JESSICA_BASE_DIR)) {
  try {
    fs.mkdirSync(JESSICA_BASE_DIR, { recursive: true });
    log('Created base directory');
  } catch (e) {
    log(`Failed to create base dir: ${e}`);
    console.error('Failed to create base dir', e);
  }
}

ipcMain.handle('jessica-list-folders', async () => {
  log('jessica-list-folders called');
  const defaults = ['Personal', 'Research', 'To Watch', 'Summarize'];
  defaults.forEach(d => {
    const p = path.join(JESSICA_BASE_DIR, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  });

  try {
    const items = fs.readdirSync(JESSICA_BASE_DIR, { withFileTypes: true });
    const folders = items.filter(i => i.isDirectory()).map(i => ({
      id: i.name,
      name: i.name,
      isDefault: defaults.includes(i.name)
    }));
    log(`Listed ${folders.length} folders`);
    return folders;
  } catch (e) {
    log(`Error listing folders: ${e}`);
    console.error("Error listing folders", e);
    return [];
  }
});

ipcMain.handle('jessica-create-folder', async (_, name) => {
  log(`Creating folder: ${name}`);
  const p = path.join(JESSICA_BASE_DIR, name);
  if (!fs.existsSync(p)) fs.mkdirSync(p);
  return { id: name, name };
});

ipcMain.handle('jessica-delete-folder', async (_, name) => {
  log(`Deleting folder: ${name}`);
  const p = path.join(JESSICA_BASE_DIR, name);
  if (fs.existsSync(p)) fs.rmSync(p, { recursive: true, force: true });
  return name;
});

ipcMain.handle('jessica-list-notes', async () => {
  log('jessica-list-notes called');
  const notes: any[] = [];
  try {
    const items = fs.readdirSync(JESSICA_BASE_DIR, { withFileTypes: true });
    const folders = items.filter(i => i.isDirectory()).map(i => i.name);

    for (const folder of folders) {
      const folderPath = path.join(JESSICA_BASE_DIR, folder);
      const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.json'));
      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(folderPath, file), 'utf-8');
          const note = JSON.parse(content);
          note.folderId = folder;
          notes.push(note);
        } catch (e) {
          log(`Failed to load note ${file}: ${e}`);
        }
      }
    }
  } catch (e) {
    log(`Error listing notes: ${e}`);
  }
  log(`Listed ${notes.length} notes`);
  return notes;
});

ipcMain.handle('jessica-save-note', async (_, note) => {
  log(`Saving note: ${note.id} to ${note.folderId}`);
  const folder = note.folderId || 'Personal';
  const folderPath = path.join(JESSICA_BASE_DIR, folder);
  if (!fs.existsSync(folderPath)) fs.mkdirSync(folderPath, { recursive: true });

  const filePath = path.join(folderPath, `${note.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(note, null, 2));
  log(`Saved note to ${filePath}`);
  return note;
});

ipcMain.handle('jessica-delete-note', async (_, { id, folderId }) => {
  log(`Deleting note: ${id} from ${folderId}`);
  const filePath = path.join(JESSICA_BASE_DIR, folderId || 'Personal', `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return id;
});

// --- PROJECTS MANAGEMENT (Plane-inspired) ---
const PROJECTS_DIR = path.join(JESSICA_BASE_DIR, 'Projects');

// Ensure Projects directory exists
if (!fs.existsSync(PROJECTS_DIR)) {
  try {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    log('Created Projects directory');
  } catch (e) {
    log(`Failed to create Projects dir: ${e}`);
  }
}

ipcMain.handle('jessica-list-projects-data', async () => {
  log('jessica-list-projects-data called');
  const projects: any[] = [];
  try {
    if (!fs.existsSync(PROJECTS_DIR)) {
      fs.mkdirSync(PROJECTS_DIR, { recursive: true });
    }
    const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = fs.readFileSync(path.join(PROJECTS_DIR, file), 'utf-8');
        const project = JSON.parse(content);
        projects.push(project);
      } catch (e) {
        log(`Failed to load project ${file}: ${e}`);
      }
    }
  } catch (e) {
    log(`Error listing projects: ${e}`);
  }
  log(`Listed ${projects.length} projects`);
  return projects;
});

ipcMain.handle('jessica-save-project', async (_, project) => {
  log(`Saving project: ${project.id}`);
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
  const filePath = path.join(PROJECTS_DIR, `${project.id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(project, null, 2));
  log(`Saved project to ${filePath}`);
  return project;
});

ipcMain.handle('jessica-delete-project', async (_, id) => {
  log(`Deleting project: ${id}`);
  const filePath = path.join(PROJECTS_DIR, `${id}.json`);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return id;
});

ipcMain.on('save-to-notion', (_event, { text, apiKey, pageId }) => {
  // We want to append a block to the page. 
  // Notion API: PATCH https://api.notion.com/v1/blocks/{block_id}/children
  // block_id is the pageId

  const request = net.request({
    method: 'PATCH',
    url: `https://api.notion.com/v1/blocks/${pageId}/children`,
  });

  request.setHeader('Authorization', `Bearer ${apiKey}`);
  request.setHeader('Content-Type', 'application/json');
  request.setHeader('Notion-Version', '2022-06-28');

  const body = JSON.stringify({
    children: [
      {
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [
            {
              type: 'text',
              text: {
                content: text
              }
            }
          ]
        }
      }
    ]
  });

  request.on('response', (response) => {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      // Success
      console.log('Notion Save Success');
    } else {
      console.log('Notion Save Failed', response.statusCode);
      response.on('data', (chunk) => {
        console.log('Body: ' + chunk.toString());
      });
    }
  });

  request.on('error', (error) => {
    console.error('Notion Request Error', error);
  });

  request.write(body);
  request.end();
});

// --- SEMANTIC MEMORY SYSTEM IPC HANDLERS ---
const MEMORY_ENGINE_URL = 'http://127.0.0.1:7420';

ipcMain.handle('memory-search', async (_, query: string, topK: number = 10) => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, top_k: topK })
    });
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (e) {
    console.error('[Memory] Search failed:', e);
    return [];
  }
});

ipcMain.handle('memory-stats', async () => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/stats`);
    if (response.ok) {
      return await response.json();
    }
    return null;
  } catch (e) {
    console.error('[Memory] Stats failed:', e);
    return null;
  }
});

ipcMain.handle('memory-store', async (_, payload: any) => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/store`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (e) {
    console.error('[Memory] Store failed:', e);
    return false;
  }
});

ipcMain.handle('memory-list', async (_, limit: number = 50, offset: number = 0) => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/memories?limit=${limit}&offset=${offset}`);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (e) {
    console.error('[Memory] List failed:', e);
    return [];
  }
});

ipcMain.handle('memory-delete', async (_, memoryId: string) => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/memory/${memoryId}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch (e) {
    console.error('[Memory] Delete failed:', e);
    return false;
  }
});

ipcMain.handle('memory-health', async () => {
  try {
    const response = await fetch(`${MEMORY_ENGINE_URL}/health`);
    return response.ok;
  } catch (e) {
    return false;
  }
});

// Memory Engine Control (Start/Stop)
ipcMain.handle('memory-start', async () => {
  if (memoryEngineProcess) {
    console.log('[Memory] Engine already running');
    return true;
  }
  startMemoryEngine();
  // Wait a bit for startup (fast now due to lazy loading)
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    // Trigger initialization
    fetch(`${MEMORY_ENGINE_URL}/init`, { method: 'POST' }).catch(console.error);

    const response = await fetch(`${MEMORY_ENGINE_URL}/health`);
    return response.ok;
  } catch (e) {
    return false;
  }
});

ipcMain.handle('memory-is-running', () => {
  return memoryEngineProcess !== null;
});

// ═══════════════════════════════════════════════════════════════════════════
// TESTING TOOLKIT IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// Get current URL from active webview
ipcMain.handle('testing-get-url', async () => {
  // This would need to be bridged from the renderer
  // For now, return a placeholder - the actual URL comes from the webview
  return null;
});

// Get Axe-core script content
ipcMain.handle('testing-get-axe-script', async () => {
  try {
    const axePath = require.resolve('axe-core/axe.min.js');
    return fs.readFileSync(axePath, 'utf-8');
  } catch (e) {
    console.error('Failed to load axe-core:', e);
    return null;
  }
});

// Get Web Vitals script content
ipcMain.handle('testing-get-web-vitals-script', async () => {
  try {
    // Try to resolve the IIFE build which assigns to window.webVitals
    const vitalPath = require.resolve('web-vitals/dist/web-vitals.iife.js');
    return fs.readFileSync(vitalPath, 'utf-8');
  } catch (e) {
    console.error('Failed to load web-vitals:', e);
    return null;
  }
});

// Run tests in webview by executing script
ipcMain.handle('testing-run-script', async (_event, _script: string) => {
  try {
    // This would execute the script in the active webview
    // The actual execution happens in the renderer via webview.executeJavaScript
    return { success: true, message: 'Script queued for execution' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// Get security headers for a URL
ipcMain.handle('testing-get-headers', async (_, url: string) => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  } catch (e) {
    console.error('[Testing] Failed to get headers:', e);
    return null;
  }
});

// Check connectivity for a batch of links (Dead Link Checker)
ipcMain.handle('testing-check-links', async (_, urls: string[]) => {
  console.log(`[Testing] Checking connectivity for ${urls.length} links...`);

  const checkLink = async (url: string) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeout);
      return { url, status: response.status };
    } catch (e) {
      return { url, status: 0, error: String(e) };
    }
  };

  // Run in parallel
  const results = await Promise.all(urls.map(url => checkLink(url)));
  return results;
});
