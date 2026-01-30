import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { useTabStore } from '../store/useTabStore';
import { useAIController } from '../hooks/useAIController';
import { useChatStore } from '../store/useChatStore';
import { Send, Sparkles, ChevronRight, Loader2, Cpu } from 'lucide-react';
import { clsx } from 'clsx';
import { generateResponse } from '../lib/ai';
import { fetchOllamaModels, isOllamaRunning, OllamaModel } from '../lib/ollama';
import { ToolExecutor } from '../lib/agent/tools';



export const AISidePanel: React.FC = () => {
    const { isSidebarOpen, sidebarView, toggleSidebar } = useTabStore();
    const { getPageContent, navigateTo, searchMemory, controlMedia, browserAction, readNotes, addNote, createTask, listTasks, updateTask, deleteTask, captureScreen, getPageStructure, clickElement, typeInput, scrollPage } = useAIController();

    // Construct Executor
    const executor: ToolExecutor = {
        navigate: async (url: string) => {
            navigateTo(url);
            return `Navigated to ${url}`;
        },
        searchMemory,
        controlMedia,
        browserAction,
        readNotes,
        addNote,
        createTask,
        listTasks,
        updateTask,
        deleteTask,
        // Phase 3: Deep Web Agent
        captureScreen,
        getPageStructure,
        clickElement,
        typeInput,
        scrollPage
    };

    // Chat Store
    const { messages, addMessage, isTyping, setTyping } = useChatStore();
    const [input, setInput] = useState('');

    // Model Management
    const [models, setModels] = useState<OllamaModel[]>([]);
    const [selectedModel, setSelectedModel] = useState<string>('llama3');
    const [isOllamaOnline, setIsOllamaOnline] = useState(false);
    const [showModelSelector, setShowModelSelector] = useState(false);

    useEffect(() => {
        if (isSidebarOpen && sidebarView === 'ai') {
            checkOllama();
        }
    }, [isSidebarOpen, sidebarView]);

    const checkOllama = async () => {
        const online = await isOllamaRunning();
        setIsOllamaOnline(online);
        if (online) {
            const availableModels = await fetchOllamaModels();
            setModels(availableModels);
            if (availableModels.length > 0 && !availableModels.find(m => m.name === selectedModel)) {
                setSelectedModel(availableModels[0].name);
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim()) return;

        addMessage('user', input);
        const userQuery = input;
        setInput('');
        setTyping(true);

        try {
            // 1. Get Page Context
            const pageContent = await getPageContent();

            // 2. Get Memory Context (Conversational)
            // Note: searchMemory returns a pre-formatted string, not an array
            let memoryContext = "";
            try {
                const searchResults = await searchMemory(userQuery);
                if (searchResults && searchResults !== "No relevant memories found.") {
                    memoryContext = `\n\n[Relevant Past Memories]:\n${searchResults}\n`;
                }
            } catch (err) {
                console.warn("Memory search failed:", err);
            }

            // 3. Combine Contexts
            const combinedContext = `${pageContent}\n${memoryContext}`;

            // Context injection: Add recent chat history? Logic is handled inside generateResponse implicitly or we can optimize later.
            // For now, simple RAG is active via tools.

            const response = await generateResponse(userQuery, combinedContext, undefined, selectedModel, executor);
            addMessage('assistant', response);
        } catch (error) {
            console.error(error);
            addMessage('assistant', "Sorry, I encountered an error. Is Ollama running?");
        } finally {
            setTyping(false);
        }
    };

    if (!isSidebarOpen || sidebarView !== 'ai') return null;

    return (
        <div className="w-[380px] flex flex-col h-full shadow-2xl transition-all duration-300 shrink-0 bg-black/90 backdrop-blur-xl z-30 border-l border-white/5">
            {/* Header with Model Selector */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-purple-600/20 rounded-lg text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.3)]">
                        <Sparkles size={16} />
                    </div>
                    <div className="flex flex-col">
                        <span className="font-semibold text-white tracking-wide font-['Outfit'] leading-tight">Jessi AI</span>
                        <div
                            className="flex items-center gap-1 text-[10px] text-zinc-400 cursor-pointer hover:text-white transition-colors"
                            onClick={() => setShowModelSelector(!showModelSelector)}
                        >
                            <span className={clsx("w-1.5 h-1.5 rounded-full", isOllamaOnline ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]" : "bg-red-500")}></span>
                            {isOllamaOnline ? selectedModel : 'Offline'}
                            <ChevronRight size={10} className={clsx("transition-transform", showModelSelector ? "rotate-90" : "")} />
                        </div>
                    </div>
                </div>
                <button onClick={() => toggleSidebar()} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors">
                    <ChevronRight size={18} />
                </button>
            </div>

            {/* Model Selector Dropdown */}
            {showModelSelector && isOllamaOnline && (
                <div className="bg-zinc-900 border-b border-white/10 p-2 space-y-1 animate-in slide-in-from-top-2">
                    <p className="text-[10px] text-zinc-500 uppercase px-2 py-1 font-bold">Select Brain</p>
                    {models.map(m => (
                        <button
                            key={m.name}
                            onClick={() => { setSelectedModel(m.name); setShowModelSelector(false); }}
                            className={clsx(
                                "w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between",
                                selectedModel === m.name ? "bg-purple-600/20 text-purple-300 border border-purple-500/30" : "text-zinc-400 hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <span className="font-medium">{m.name}</span>
                            <span className="text-[10px] opacity-50">{(m.size / 1024 / 1024 / 1024).toFixed(1)}GB</span>
                        </button>
                    ))}
                    <div className="h-px bg-white/5 my-1" />
                    <button onClick={() => checkOllama()} className="w-full text-left px-3 py-2 rounded-lg text-xs text-zinc-500 hover:text-white flex items-center gap-2">
                        <Cpu size={12} /> Refresh Models
                    </button>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                {messages.map((msg, idx) => (
                    <div key={idx} className={clsx("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                        <div className={clsx(
                            "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg backdrop-blur-sm border",
                            msg.role === 'user'
                                ? "bg-purple-600/90 text-white border-purple-500/50 rounded-br-none" // Updated to Purple for Jessi
                                : "bg-white/5 text-slate-200 border-white/10 rounded-bl-none"
                        )}>
                            <div className="prose prose-invert prose-sm max-w-none text-sm leading-relaxed">
                                <Markdown
                                    components={{
                                        ul: ({ node, ...props }) => <ul className="list-disc pl-4 space-y-1 my-2" {...props} />,
                                        ol: ({ node, ...props }) => <ol className="list-decimal pl-4 space-y-1 my-2" {...props} />,
                                        li: ({ node, ...props }) => <li className="text-zinc-200" {...props} />,
                                        p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                                        strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                        a: ({ node, ...props }) => <a className="text-purple-400 hover:text-purple-300 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                                        h1: ({ node, ...props }) => <h1 className="text-lg font-bold text-white mt-4 mb-2" {...props} />,
                                        h2: ({ node, ...props }) => <h2 className="text-base font-bold text-white mt-3 mb-2" {...props} />,
                                        h3: ({ node, ...props }) => <h3 className="text-sm font-bold text-white mt-2 mb-1" {...props} />,
                                        code: ({ node, ...props }) => <code className="bg-white/10 rounded px-1 py-0.5 text-xs font-mono text-purple-200" {...props} />,
                                    }}
                                >
                                    {msg.content}
                                </Markdown>
                            </div>
                        </div>
                        <span className="text-[10px] text-slate-500 px-1 opacity-60">
                            {msg.role === 'user' ? 'You' : `Jessi (${selectedModel})`}
                        </span>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/5 rounded-2xl px-4 py-3 flex items-center gap-3">
                            <Loader2 size={16} className="animate-spin text-purple-400" />
                            <span className="text-xs text-slate-400 animate-pulse">Thinking...</span>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/5 bg-black/20 backdrop-blur-md">
                <div className="relative group">
                    <input
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:bg-white/10 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-slate-500 shadow-inner"
                        placeholder={isOllamaOnline ? `Message Jessi (${selectedModel})...` : "Ollama Offline - Check Connection"}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    />
                    <button
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-300 p-2 rounded-lg hover:bg-white/5 transition-all disabled:opacity-50"
                        onClick={handleSend}
                        disabled={isTyping}
                    >
                        <Send size={18} className={isTyping ? "opacity-50" : ""} />
                    </button>
                </div>
            </div>
        </div>
    );
};
