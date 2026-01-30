import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";
import cors from "cors";
import { BrowserWindow, ipcMain } from "electron";
import { z } from "zod";

/**
 * Saturn Browser MCP Server
 * Exposes browser capabilities to AI agents and IDEs via MCP protocol.
 */
export class SaturnMcpServer {
    private server: McpServer;
    private app: express.Express;
    private mainWindow: BrowserWindow | null = null;
    private pendingRequests = new Map<string, { resolve: (val: any) => void; reject: (err: any) => void }>();
    private transports = new Map<string, SSEServerTransport>();

    constructor() {
        this.server = new McpServer({
            name: "Saturn Browser",
            version: "1.0.0",
        });

        this.app = express();
        this.setupTools();
        this.setupIpcListeners();
    }

    public setMainWindow(window: BrowserWindow) {
        this.mainWindow = window;
    }

    public start(port = 3005) {
        this.app.use(cors());
        this.app.use(express.json());

        // SSE Endpoint
        this.app.get("/sse", async (_req, res) => {
            console.log("[MCP] New SSE connection");

            // Create a unique session ID for this connection
            const sessionId = crypto.randomUUID();

            // Create transport pointing to the message endpoint with session ID
            const transport = new SSEServerTransport(`/messages?sessionId=${sessionId}`, res);
            this.transports.set(sessionId, transport);

            // Clean up on close (with grace period)
            transport.onclose = () => {
                console.log(`[MCP] Connection closed: ${sessionId}. Keeping alive for 5s for reconnect.`);
                setTimeout(() => {
                    if (this.transports.get(sessionId) === transport) {
                        console.log(`[MCP] Cleaning up session: ${sessionId}`);
                        this.transports.delete(sessionId);
                    }
                }, 5000);
            };

            await this.server.connect(transport);
        });

        // Debug Endpoint
        this.app.get("/debug", (_req, res) => {
            res.json({
                activeSessions: Array.from(this.transports.keys())
            });
        });

        // POST Endpoint for messages
        this.app.post("/messages", async (req, res) => {
            const sessionId = req.query.sessionId as string;
            console.log(`[MCP] POST Request: ${req.url}`);
            console.log(`[MCP] Query Session: '${sessionId}'`);
            console.log(`[MCP] Active Sessions: ${JSON.stringify(Array.from(this.transports.keys()))}`);

            let transport = this.transports.get(sessionId);

            // Fallback: If session not found, but we have exactly one active session, use it.
            // This fixes issues where clients might reconnect transparently.
            if (!transport && this.transports.size > 0) {
                const latestSession = Array.from(this.transports.keys()).pop();
                console.warn(`[MCP] Session '${sessionId}' not found. Defaulting to '${latestSession}'`);
                transport = this.transports.get(latestSession!);
            }

            if (!transport) {
                console.error(`[MCP] ❌ Session not found: '${sessionId}'`);
                res.status(404).send(`Session not found. active=[${Array.from(this.transports.keys())}]`);
                return;
            }

            console.log(`[MCP] ✅ Routing message to transport`);
            await transport.handlePostMessage(req, res);
        });

        try {
            this.app.listen(port, "127.0.0.1", () => {
                console.log(`[MCP] Server running on http://127.0.0.1:${port}`);
            }).on('error', (err) => {
                console.error('[MCP] Failed to start server:', err);
            });
        } catch (e) {
            console.error('[MCP] Exception starting server:', e);
        }
    }

    // Helper to send request to Renderer and wait for response
    private async requestRenderer(action: string, payload: any = {}): Promise<any> {
        if (!this.mainWindow || this.mainWindow.isDestroyed()) {
            throw new Error("Browser window not available");
        }

        const requestId = crypto.randomUUID();
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(requestId, { resolve, reject });
            this.mainWindow!.webContents.send('mcp:request', { id: requestId, action, payload });

            // Timeout after 30s
            setTimeout(() => {
                if (this.pendingRequests.has(requestId)) {
                    this.pendingRequests.delete(requestId);
                    reject(new Error("Renderer request timed out"));
                }
            }, 30000);
        });
    }

    private setupIpcListeners() {
        ipcMain.handle('mcp:response', (_, { id, result, error }) => {
            const pending = this.pendingRequests.get(id);
            if (pending) {
                if (error) pending.reject(new Error(error));
                else pending.resolve(result);
                this.pendingRequests.delete(id);
            }
        });
    }

    private setupTools() {
        // Tool: Run Tests
        this.server.tool(
            "browser_run_tests",
            {
                category: z.enum(['accessibility', 'performance', 'security', 'seo', 'html', 'bestpractices', 'all']).optional(),
                url: z.string().optional(),
            },
            async ({ category, url }) => {
                console.log(`[MCP] Tool called: browser_run_tests`, { category, url });

                // If URL provided, navigate first (TODO)
                if (url) {
                    await this.requestRenderer('navigate', { url });
                    // Wait for load? basic delay
                    await new Promise(r => setTimeout(r, 2000));
                }

                const results = await this.requestRenderer('run-tests', { category: category || 'all' });

                // Format for MCP
                return {
                    content: [{
                        type: "text",
                        text: JSON.stringify(results, null, 2)
                    }],
                };
            }
        );

        // Tool: Get Page Content
        this.server.tool(
            "browser_get_content",
            {
                selector: z.string().optional().describe("CSS selector to screenshot or get text from"),
                format: z.enum(['text', 'html', 'markdown']).default('text'),
            },
            async ({ selector, format }) => {
                const content = await this.requestRenderer('get-content', { selector, format });
                return {
                    content: [{ type: "text", text: content }],
                };
            }
        );

        // Tool: Check Links (Backend Logic + Frontend extraction)
        this.server.tool(
            "browser_check_links",
            {},
            async () => {
                // 1. Get links from renderer
                const links = await this.requestRenderer('get-links');
                // 2. Check them in Main process (node) to bypass CORS
                const results = [];
                for (const link of links) {
                    try {
                        const response = await fetch(link, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
                        results.push({ url: link, status: response.status, ok: response.ok });
                    } catch (e) {
                        results.push({ url: link, status: 0, ok: false, error: String(e) });
                    }
                }

                return {
                    content: [{ type: "text", text: JSON.stringify(results, null, 2) }]
                };
            }
        );

        // Tool: Execute Script
        this.server.tool(
            "browser_execution",
            { script: z.string() },
            async ({ script }) => {
                const result = await this.requestRenderer('execute-script', { script });
                return {
                    content: [{ type: "text", text: JSON.stringify(result) }]
                };
            }
        );
    }
}

// Singleton instance
export const mcpServer = new SaturnMcpServer();
