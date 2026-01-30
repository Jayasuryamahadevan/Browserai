import { SYSTEM_PROMPT, ToolExecutor } from './agent/tools';

export const generateResponse = async (
    prompt: string,
    context: string,
    _apiKey?: string, // Legacy - kept for API compatibility
    modelName: string = 'llama3',
    executor?: ToolExecutor,
    image?: string // Base64 image
): Promise<string> => {

    // 1. Construct Messages (System + User)
    // We trim context to fit potential context windows
    const messages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        {
            role: 'user',
            content: `Context: ${context.substring(0, 1500)}\n\nUser Question: ${prompt}`,
            images: image ? [image] : undefined
        }
    ];

    let currentTurn = 0;
    const MAX_TURNS = 15; // Increased for Deep Web tasks

    try {
        while (currentTurn < MAX_TURNS) {
            currentTurn++;

            // Call LLM
            const responseText = await callOllama(messages, modelName);

            // Check for Tool Use (Expect Array)
            const toolCalls = extractToolCalls(responseText);

            if (toolCalls.length === 0 || !executor) {
                // No tool used, just return the text
                return responseText;
            }

            // Execute ALL tools
            const results: string[] = [];
            let capturedImage: string | undefined;

            for (const call of toolCalls) {
                const result = await executeTool(call, executor);
                results.push(`Tool '${call.name}' Output: ${result}`);

                if (call.name === 'capture_screen') {
                    capturedImage = result; // The result is the base64 string
                }
            }

            const combinedResult = results.join("\n\n");

            // Append Agent's Thought and Tool Output to history
            messages.push({ role: 'assistant', content: responseText });
            messages.push({
                role: 'user',
                content: capturedImage ? "Here is the screenshot. Proceed." : `Tool Outputs:\n${combinedResult}`,
                images: capturedImage ? [capturedImage] : undefined
            });

            // Loop continues...
        }

        return "I hit my maximum thought limit (15 steps).";

    } catch (e) {
        console.error("AI Error:", e);
        return "I am having trouble connecting to my brain (Ollama). Please ensure it is running.";
    }
};

// Helper: Call Ollama API
async function callOllama(messages: any[], model: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout for reasoning

    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: model,
                messages: messages,
                stream: false,
                options: {
                    temperature: 0.2 // Lower temp for tool precision
                }
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Ollama API failed');
        const data = await response.json();
        return data.message.content;
    } catch (error) {
        clearTimeout(timeoutId);
        throw error;
    }
}

// Helper: Extract ALL JSON tool calls
function extractToolCalls(text: string): { name: string, args: any }[] {
    const tools: { name: string, args: any }[] = [];
    try {
        const jsonRegex = /\{(?:[^{}]|(?:\{(?:[^{}]|(?:\{[^{}]*\}))*\}))*\}/g;
        const matches = text.match(jsonRegex);

        if (matches) {
            for (const match of matches) {
                try {
                    const data = JSON.parse(match);

                    if (data.tool_use) {
                        tools.push({ name: data.tool_use, args: data.arguments || {} });
                    } else if (data.url && !data.tool_use) {
                        // Hallucination fallback
                        tools.push({ name: "navigate", args: { url: data.url } });
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    } catch (e) { }
    return tools;
}

// Helper: Execute Tool
async function executeTool(call: { name: string, args: any }, executor: ToolExecutor): Promise<string> {
    const { name, args } = call;

    try {
        switch (name) {
            case 'navigate':
                return await executor.navigate(args.url);
            case 'search_memory':
                return await executor.searchMemory(args.query);
            case 'control_media':
                return await executor.controlMedia(args.action);
            case 'browser_action':
                return await executor.browserAction(args.action);
            case 'read_notes':
                return await executor.readNotes();
            case 'add_note':
                return await executor.addNote(args.content);
            case 'create_task':
                return await executor.createTask(args.title, args.dueDate, args.priority);
            case 'list_tasks':
                return await executor.listTasks(args.date, args.status);
            case 'update_task':
                return await executor.updateTask(args.taskId, args.status, args.dueDate);
            case 'delete_task':
                return await executor.deleteTask(args.taskId);

            // Phase 3: Deep Web Agent
            case 'capture_screen':
                return await executor.captureScreen();
            case 'get_page_structure':
                return await executor.getPageStructure();
            case 'click_element':
                return await executor.clickElement(args.id);
            case 'type_input':
                return await executor.typeInput(args.id, args.text);
            case 'scroll_page':
                return await executor.scrollPage(args.direction);

            default:
                return "Error: Unknown tool.";
        }
    } catch (e: any) {
        return `Error executing tool ${name}: ${e.message}`;
    }
}
