import { useTabStore } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { useNotesStore } from '../store/useNotesStore';
import { useProjectsStore } from '../store/useProjectsStore';

export const useAIController = () => {
    const { activeTabId } = useTabStore();
    const { getWebview } = useBrowserRefStore();

    const getPageContent = async (): Promise<string> => {
        if (!activeTabId) return 'No active tab';
        const webview = getWebview(activeTabId);
        if (!webview) return 'Webview not ready';

        try {
            // Execute JS to get clean text
            const code = `
        (function() {
          // Simple readable text extraction
          return document.body.innerText || '';
        })()
      `;
            const result = await webview.executeJavaScript(code);
            return result;
        } catch (error: any) {
            console.error('Failed to extract content:', error);
            return `Error extracting content: ${error.message}`;
        }
    };

    const navigateTo = (url: string) => {
        if (!activeTabId) return;

        const finalUrl = url.startsWith('http') ? url : `https://${url}`;

        // 1. Update the store state. This drives the TabItem to switch from NewTabPage to <webview>
        useTabStore.getState().updateTab(activeTabId, { url: finalUrl });

        // 2. If the webview already exists (we are not on the New Tab Page), load the URL directly
        const webview = getWebview(activeTabId);
        if (webview) {
            webview.loadURL(finalUrl);
        }
    };

    const executeAction = async (actionType: string, params: any) => {
        if (!activeTabId) return;
        const webview = getWebview(activeTabId);
        if (!webview) return;

        if (actionType === 'navigate') {
            navigateTo(params.url);
            return "Navigating...";
        }

        // Placeholder for more complex actions
        return "Action executed";
    };

    // --- AGENTIC TOOLS ---

    const searchMemory = async (query: string): Promise<string> => {
        try {
            // @ts-ignore - IPC exposed in preload
            const results = await window.ipcRenderer.invoke('memory-search', {
                query,
                top_k: 5,
                min_score: 0.3
            });

            if (!results || results.length === 0) return "No relevant memories found.";

            return results.map((r: any) =>
                `[Title: ${r.title}] (Score: ${(r.similarity * 100).toFixed(0)}%)\nSummary: ${r.summary}\nFull Content Snippet: ${r.content.substring(0, 200)}...`
            ).join('\n\n');
        } catch (e: any) {
            return `Memory Search Error: ${e.message}`;
        }
    };

    const controlMedia = async (action: string): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        const code = `
            (function() {
                const media = document.querySelector('video, audio');
                if (!media) return 'No media found';
                
                switch('${action}') {
                    case 'play': media.play(); break;
                    case 'pause': media.pause(); break;
                    case 'mute': media.muted = true; break;
                    case 'unmute': media.muted = false; break;
                    case 'next': 
                        // Try typical "Next" buttons (Youtube, Spotify)
                        const nextBtn = document.querySelector('.ytp-next-button, [aria-label="Next"], [data-testid="control-button-skip-forward"]');
                        if (nextBtn) nextBtn.click();
                        else return 'Next button not found';
                        break;
                    default: return 'Unknown action';
                }
                return 'Media action ${action} executed';
            })()
        `;

        try {
            return await webview.executeJavaScript(code);
        } catch (e: any) {
            return `Media Control Error: ${e.message}`;
        }
    };

    const browserAction = async (action: string): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);

        /* 
           Using window.ipcRenderer directly because some actions might need Main process,
           but simple ones we handle here.
        */

        switch (action) {
            case 'reload':
                webview?.reload();
                return "Page reloaded";
            case 'back':
                if (webview?.canGoBack()) webview.goBack();
                return "Went back";
            case 'forward':
                if (webview?.canGoForward()) webview.goForward();
                return "Went forward";
            case 'close_tab':
                useTabStore.getState().removeTab(activeTabId);
                return "Tab closed";
            default:
                return "Action not supported yet";
        }
    };

    const readNotes = async (): Promise<string> => {
        try {
            await useNotesStore.getState().fetchData();
            const notes = useNotesStore.getState().notes;
            if (notes.length === 0) return "You have no notes or tasks saved.";

            return notes.map(n =>
                `[${new Date(n.createdAt).toLocaleDateString()}] ${n.content.substring(0, 100)}...`
            ).join('\n');
        } catch (e: any) {
            return `Error reading notes: ${e.message}`;
        }
    };

    const addNote = async (content: string): Promise<string> => {
        try {
            await useNotesStore.getState().addNote({ content });
            return "Note/Task saved successfully.";
        } catch (e: any) {
            return `Error adding note: ${e.message}`;
        }
    };

    // --- TASKS / CALENDAR ---

    const getTargetProjectId = async (): Promise<string> => {
        const store = useProjectsStore.getState();
        await store.fetchProjects();
        if (store.activeProjectId) return store.activeProjectId;
        if (store.projects.length > 0) return store.projects[0].id;

        await store.createProject("Inbox", "📥");
        return useProjectsStore.getState().projects[0].id;
    };

    const createTask = async (title: string, dueDate?: string, priority: any = 'medium'): Promise<string> => {
        try {
            const projectId = await getTargetProjectId();
            await useProjectsStore.getState().createTask(projectId, title, priority, dueDate);
            return `Task "${title}" created. ` + (dueDate ? `Due: ${dueDate}` : "");
        } catch (e: any) {
            return `Error creating task: ${e.message}`;
        }
    };

    const listTasks = async (date?: string, status: string = 'all'): Promise<string> => {
        try {
            await useProjectsStore.getState().fetchProjects();
            const projects = useProjectsStore.getState().projects;
            let allTasks = projects.flatMap(p => p.tasks || []);

            if (status !== 'all') allTasks = allTasks.filter(t => t.status === status);

            if (date) {
                const searchDate = new Date(date).toDateString();
                allTasks = allTasks.filter(t => t.dueDate && new Date(t.dueDate).toDateString() === searchDate);
            }

            if (allTasks.length === 0) return "No tasks found.";

            return allTasks.map(t =>
                `[${t.status === 'done' ? 'x' : ' '}] ${t.title} (Due: ${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'None'}) [ID: ${t.id}]`
            ).join('\n');
        } catch (e: any) {
            return `Error listing tasks: ${e.message}`;
        }
    };

    const findProjectByTaskId = (taskId: string) => {
        const projects = useProjectsStore.getState().projects;
        return projects.find(p => p.tasks.some(t => t.id === taskId));
    };

    const updateTask = async (taskId: string, status?: any, dueDate?: string): Promise<string> => {
        try {
            await useProjectsStore.getState().fetchProjects();
            const project = findProjectByTaskId(taskId);
            if (!project) return "Task not found.";

            const updates: any = {};
            if (status) updates.status = status;
            if (dueDate) updates.dueDate = dueDate;

            await useProjectsStore.getState().updateTask(project.id, taskId, updates);
            return `Task updated.`;
        } catch (e: any) {
            return `Error updating task: ${e.message}`;
        }
    };

    const deleteTask = async (taskId: string): Promise<string> => {
        try {
            await useProjectsStore.getState().fetchProjects();
            const project = findProjectByTaskId(taskId);
            if (!project) return "Task not found.";

            await useProjectsStore.getState().deleteTask(project.id, taskId);
            return `Task deleted.`;
        } catch (e: any) {
            return `Error deleting task: ${e.message}`;
        }
    };

    // --- PHASE 3: DEEP WEB AGENT TOOLS ---

    const captureScreen = async (): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        try {
            const image = await webview.capturePage();
            return image.toDataURL(); // Returns data:image/png;base64,...
        } catch (e: any) {
            return `Error capturing screen: ${e.message}`;
        }
    };

    const getPageStructure = async (): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        const code = `
            (function() {
                let idCounter = 1;
                const elements = [];
                const interactables = document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"]');
                
                interactables.forEach(el => {
                    // Check visibility
                    const rect = el.getBoundingClientRect();
                    if (rect.width === 0 || rect.height === 0 || rect.top < 0 || rect.top > window.innerHeight) return;

                    // Assign ID if not present
                    let aiId = el.getAttribute('data-ai-id');
                    if (!aiId) {
                        aiId = idCounter++;
                        el.setAttribute('data-ai-id', aiId);
                    } else {
                         // Ensure counter is ahead of existing IDs to avoid collision
                        idCounter = Math.max(idCounter, parseInt(aiId) + 1);
                    }

                    elements.push({
                        id: parseInt(aiId),
                        tag: el.tagName.toLowerCase(),
                        text: (el.innerText || el.value || el.getAttribute('aria-label') || '').slice(0, 50).replace(/\\s+/g, ' ').trim(),
                        type: el.type || '',
                        role: el.getAttribute('role') || ''
                    });
                });
                return JSON.stringify(elements);
            })()
        `;

        try {
            return await webview.executeJavaScript(code);
        } catch (e: any) {
            return `Error analyzing page: ${e.message}`;
        }
    };

    const clickElement = async (id: number): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        const code = `
            (function() {
                const el = document.querySelector('[data-ai-id="${id}"]');
                if (el) {
                    el.click();
                    return "Clicked element " + ${id};
                }
                return "Element " + ${id} + " not found";
            })()
        `;
        return await webview.executeJavaScript(code);
    };

    const typeInput = async (id: number, text: string): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        const code = `
            (function() {
                const el = document.querySelector('[data-ai-id="${id}"]');
                if (el) {
                    el.value = "${text}";
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    return "Typed into element " + ${id};
                }
                return "Element " + ${id} + " not found";
            })()
        `;
        return await webview.executeJavaScript(code);
    };

    const scrollPage = async (direction: "up" | "down"): Promise<string> => {
        if (!activeTabId) return "No active tab";
        const webview = getWebview(activeTabId);
        if (!webview) return "Webview not ready";

        const code = `
            (function() {
                window.scrollBy({
                    top: ${direction === 'down' ? 'window.innerHeight * 0.8' : '-window.innerHeight * 0.8'},
                    behavior: 'smooth'
                });
                return "Scrolled ${direction}";
            })()
        `;
        return await webview.executeJavaScript(code);
    };

    return {
        getPageContent,
        executeAction,
        navigateTo,
        searchMemory,
        controlMedia,
        browserAction,
        readNotes,
        addNote,
        createTask,
        listTasks,
        updateTask,
        deleteTask,
        // Phase 3
        captureScreen,
        getPageStructure,
        clickElement,
        typeInput,
        scrollPage
    };
};
