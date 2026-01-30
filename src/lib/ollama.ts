export interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
    details: {
        family: string;
        parameter_size: string;
        quantization_level: string;
    };
}

export const OLLAMA_BASE_URL = 'http://localhost:11434';

export const isOllamaRunning = async (): Promise<boolean> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        return response.ok;
    } catch (e) {
        return false;
    }
};

export const fetchOllamaModels = async (): Promise<OllamaModel[]> => {
    try {
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
        if (!response.ok) return [];
        const data = await response.json();
        return data.models || [];
    } catch (e) {
        console.warn('Failed to fetch Ollama models:', e);
        return [];
    }
};
