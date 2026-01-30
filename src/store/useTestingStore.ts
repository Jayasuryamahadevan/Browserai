import { create } from 'zustand';

export type TestCategory = 'accessibility' | 'performance' | 'security' | 'seo' | 'html' | 'bestpractices' | 'connectivity';
export type TestStatus = 'pass' | 'fail' | 'warning' | 'info' | 'running';

export interface TestResult {
    id: string;
    category: TestCategory;
    name: string;
    status: TestStatus;
    score?: number;
    details: string;
    elements?: string[]; // CSS selectors of affected elements
    suggestion?: string;
    timestamp: number;
}

export interface TestSummary {
    pass: number;
    fail: number;
    warning: number;
    info: number;
    total: number;
    score: number; // 0-100
    categoryScores: Record<TestCategory, number>;
}

interface TestingState {
    // State
    isOpen: boolean;
    isRunning: boolean;
    currentTest: string | null;
    results: TestResult[];
    summary: TestSummary;
    activeCategory: TestCategory | 'all';
    lastRunUrl: string | null;

    // Actions
    togglePanel: () => void;
    setActiveCategory: (category: TestCategory | 'all') => void;
    runAllTests: () => Promise<void>;
    runCategory: (category: TestCategory) => Promise<void>;
    addResult: (result: TestResult) => void;
    clearResults: () => void;
    setRunning: (running: boolean, testName?: string) => void;
    calculateSummary: () => void;
}

const initialSummary: TestSummary = {
    pass: 0,
    fail: 0,
    warning: 0,
    info: 0,
    total: 0,
    score: 0,
    categoryScores: {
        accessibility: 0,
        performance: 0,
        security: 0,
        seo: 0,
        html: 0,
        bestpractices: 0,
        connectivity: 0
    }
};

export const useTestingStore = create<TestingState>((set, get) => ({
    isOpen: false,
    isRunning: false,
    currentTest: null,
    results: [],
    summary: initialSummary,
    activeCategory: 'all',
    lastRunUrl: null,

    togglePanel: () => set(state => ({ isOpen: !state.isOpen })),

    setActiveCategory: (category) => set({ activeCategory: category }),

    addResult: (result) => {
        set(state => ({
            results: [...state.results, result]
        }));
        get().calculateSummary();
    },

    clearResults: () => set({
        results: [],
        summary: initialSummary,
        lastRunUrl: null
    }),

    setRunning: (running, testName) => set({
        isRunning: running,
        currentTest: testName || null
    }),

    calculateSummary: () => {
        const { results } = get();

        // Helper to calc score for a set of results
        const calculateScore = (items: TestResult[]) => {
            if (items.length === 0) return 0;
            const passed = items.filter(r => r.status === 'pass').length;
            const warnings = items.filter(r => r.status === 'warning').length;

            // Info counts as half a pass (neutral), Warning is half penalty

            // Better logic: Pass=100, Warn=50, Fail=0. Info ignored or neutral.
            // Let's stick to simple: Pass=1, Warn=0.5, Fail=0.
            const earned = passed + (warnings * 0.5);
            return Math.round((earned / items.length) * 100);
        };

        const categoryScores = { ...initialSummary.categoryScores };
        (Object.keys(categoryScores) as TestCategory[]).forEach(cat => {
            const catResults = results.filter(r => r.category === cat);
            categoryScores[cat] = calculateScore(catResults);
        });

        const summary: TestSummary = {
            pass: results.filter(r => r.status === 'pass').length,
            fail: results.filter(r => r.status === 'fail').length,
            warning: results.filter(r => r.status === 'warning').length,
            info: results.filter(r => r.status === 'info').length,
            total: results.length,
            score: calculateScore(results),
            categoryScores
        };

        set({ summary });
    },

    runAllTests: async () => {
        const { clearResults, setRunning } = get();
        clearResults();
        setRunning(true, 'Initializing...');

        try {
            // Get current webview URL using browser ref store (more reliable)
            // We import dynamically to avoid circular dependencies if possible, 
            // but here we rely on the service functions we'll import at the top
            const { getCurrentPageUrl } = await import('../lib/testing/testingService');
            const url = getCurrentPageUrl();
            set({ lastRunUrl: url });

            // Run all test categories
            const categories: TestCategory[] = ['accessibility', 'performance', 'security', 'seo', 'html', 'bestpractices'];

            for (const category of categories) {
                await get().runCategory(category);
                // Small delay for UI updates
                await new Promise(r => setTimeout(r, 100));
            }
        } catch (e) {
            console.error('[Testing] Run all tests error:', e);
        } finally {
            setRunning(false);
        }
    },

    runCategory: async (category) => {
        const { addResult, setRunning } = get();
        setRunning(true, `Running ${category} tests...`);

        try {
            // Import service dynamically to avoid circular dep issues during init
            const { runTestsInWebview } = await import('../lib/testing/testingService');
            const results = await runTestsInWebview(category);

            if (Array.isArray(results)) {
                results.forEach((result: TestResult) => {
                    addResult({
                        ...result,
                        category,
                        timestamp: Date.now()
                    });
                });
            }
        } catch (e) {
            console.error(`[Testing] ${category} tests error:`, e);
            addResult({
                id: `${category}-error`,
                category,
                name: `${category} tests`,
                status: 'fail',
                details: `Failed to run ${category} tests: ${e}`,
                timestamp: Date.now()
            });
        }
    }
}));
