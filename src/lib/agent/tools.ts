export interface Tool {
    name: string;
    description: string;
    parameters: {
        type: string;
        properties: Record<string, any>;
        required: string[];
    };
    execute: (args: any) => Promise<string>;
}

export const TOOLS_SCHEMA = [
    {
        name: "search_memory",
        description: "Search your semantic memory for previously learned information, pages, or topics.",
        parameters: {
            type: "object",
            properties: {
                query: { type: "string", description: "The semantic search query" }
            },
            required: ["query"]
        }
    },
    {
        name: "capture_screen",
        description: "Capture a screenshot of the current page to see what is visible.",
        parameters: { type: "object", properties: {}, required: [] }
    },
    {
        name: "get_page_structure",
        description: "Get a simplified structure of interactive elements (buttons, inputs) on the page with their numeric IDs.",
        parameters: { type: "object", properties: {}, required: [] }
    },
    {
        name: "click_element",
        description: "Click an element on the page using its numeric ID.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "number", description: "The numeric ID of the element to click (from get_page_structure)" }
            },
            required: ["id"]
        }
    },
    {
        name: "type_input",
        description: "Type text into an input field using its numeric ID.",
        parameters: {
            type: "object",
            properties: {
                id: { type: "number", description: "The numeric ID of the input field" },
                text: { type: "string", description: "The text to type" }
            },
            required: ["id", "text"]
        }
    },
    {
        name: "scroll_page",
        description: "Scroll the page up or down.",
        parameters: {
            type: "object",
            properties: {
                direction: { type: "string", enum: ["up", "down"], description: "Direction to scroll" }
            },
            required: ["direction"]
        }
    },
    {
        name: "navigate",
        description: "Navigate the current tab to a specific URL.",
        parameters: {
            type: "object",
            properties: {
                url: { type: "string", description: "The fully qualified URL (e.g., https://...)" }
            },
            required: ["url"]
        }
    },
    {
        name: "control_media",
        description: "Control media playback (Youtube, Spotify, etc.) on the current page.",
        parameters: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["play", "pause", "next", "prev", "mute", "unmute"] }
            },
            required: ["action"]
        }
    },
    {
        name: "browser_action",
        description: "Perform browser-level actions like closing tabs, reloading, or going back.",
        parameters: {
            type: "object",
            properties: {
                action: { type: "string", enum: ["close_tab", "close_other_tabs", "reload", "back", "forward", "new_tab"] }
            },
            required: ["action"]
        }
    },
    {
        name: "read_notes",
        description: "Read the user's saved notes and tasks.",
        parameters: {
            type: "object",
            properties: {},
            required: []
        }
    },
    {
        name: "create_task",
        description: "Create a new task with optional due date.",
        parameters: {
            type: "object",
            properties: {
                title: { type: "string", description: "Task title" },
                dueDate: { type: "string", description: "ISO Date string (YYYY-MM-DD or full ISO) for calendar events" },
                priority: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["title"]
        }
    },
    {
        name: "list_tasks",
        description: "List tasks. Can filter by date (for 'Calendar' view) or return all.",
        parameters: {
            type: "object",
            properties: {
                date: { type: "string", description: "Filter tasks by date (YYYY-MM-DD)" },
                status: { type: "string", enum: ["todo", "done", "all"] }
            },
            required: []
        }
    },
    {
        name: "update_task",
        description: "Update a task's status or details.",
        parameters: {
            type: "object",
            properties: {
                taskId: { type: "string", description: "ID of the task to update" },
                status: { type: "string", enum: ["todo", "in_progress", "done"] },
                dueDate: { type: "string" }
            },
            required: ["taskId"]
        }
    },
    {
        name: "delete_task",
        description: "Delete a task permanently.",
        parameters: {
            type: "object",
            properties: {
                taskId: { type: "string" }
            },
            required: ["taskId"]
        }
    }
];

export const SYSTEM_PROMPT = `
You are Jessi, an advanced agentic browser assistant.
You have access to the following tools:

${JSON.stringify(TOOLS_SCHEMA, null, 2)}

GUIDELINES:
1. **Media Playback**: If the user asks to play a specific song/video and you are NOT on a video site, use 'navigate' to go to YouTube search.
   - Example: "Play Oppenheimer theme" -> { "tool_use": "navigate", "arguments": { "url": "https://www.youtube.com/results?search_query=oppenheimer+theme" } }
2. **Navigation**: If the user provides a query instead of a URL (e.g., "Go to Reddit"), navigate to "https://reddit.com" or a Google search.
3. **Memory**: 
   - A section \`[Relevant Past Memories]\` may be provided in your context. **ALWAYS** check this first to see if you have discussed the topic before.
   - If the user asks about past topics, use this information to answer. 
   - Use 'search_memory' tool ONLY if you need *more* specific details than what is already provided in the context.
4. **Calendar/Tasks**: 
   - "Add event/task" -> \`create_task\`. If date is mentioned (e.g. "tomorrow"), calculate the ISO date.
   - "What's on my calendar?" -> \`list_tasks\` with \`date\`.
5. **Formatting**: Use **Markdown** (bullet points, **bold** text) to structure your answers.
6. **Tone**: Be **Formal**, **Concise**, and **Professional**. Do not use slang.

CRITICAL INSTRUCTIONS:
- To use a tool, you MUST output valid JSON following the schema: { "tool_use": "tool_name", "arguments": { ... } }
- do NOT output simplified JSON like { "url": "..." }.
- do NOT output multiple JSON objects in one turn unless necessary.
- If you cannot answer directly, output the TOOL CALL JSON only.
`;

export interface ToolExecutor {
    navigate: (url: string) => Promise<string>;
    searchMemory: (query: string) => Promise<string>;
    controlMedia: (action: string) => Promise<string>;
    browserAction: (action: string) => Promise<string>;
    readNotes: () => Promise<string>;
    addNote: (content: string) => Promise<string>;
    createTask: (title: string, dueDate?: string, priority?: string) => Promise<string>;
    listTasks: (date?: string, status?: string) => Promise<string>;
    updateTask: (taskId: string, status?: string, dueDate?: string) => Promise<string>;
    deleteTask: (taskId: string) => Promise<string>;
    // Phase 3: Deep Web Agent
    captureScreen: () => Promise<string>;
    getPageStructure: () => Promise<string>;
    clickElement: (id: number) => Promise<string>;
    typeInput: (id: number, text: string) => Promise<string>;
    scrollPage: (direction: "up" | "down") => Promise<string>;
}
