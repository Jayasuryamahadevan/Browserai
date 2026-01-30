import { motion, AnimatePresence } from 'framer-motion';
import { useTestingStore, TestResult, TestCategory } from '../store/useTestingStore';
import {
    X, Play, CheckCircle2, XCircle, AlertTriangle, Info,
    Accessibility, Zap, Shield, Search, Code, Award, Link,
    ChevronDown, ChevronRight, Loader2, FileText, RefreshCw
} from 'lucide-react';
import { useState } from 'react';

const CATEGORY_CONFIG: Record<TestCategory, { icon: typeof Accessibility; label: string; color: string }> = {
    accessibility: { icon: Accessibility, label: 'Accessibility', color: '#8B5CF6' },
    performance: { icon: Zap, label: 'Performance', color: '#F59E0B' },
    security: { icon: Shield, label: 'Security', color: '#EF4444' },
    seo: { icon: Search, label: 'SEO', color: '#10B981' },
    html: { icon: Code, label: 'HTML', color: '#3B82F6' },
    bestpractices: { icon: Award, label: 'Best Practices', color: '#EC4899' },
    connectivity: { icon: Link, label: 'Connectivity', color: '#0EA5E9' }
};

const STATUS_ICONS = {
    pass: { icon: CheckCircle2, color: '#10B981', bg: 'rgba(16, 185, 129, 0.1)' },
    fail: { icon: XCircle, color: '#EF4444', bg: 'rgba(239, 68, 68, 0.1)' },
    warning: { icon: AlertTriangle, color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.1)' },
    info: { icon: Info, color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.1)' },
    running: { icon: Loader2, color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.1)' }
};

export function TestingPanel() {
    const {
        isOpen,
        isRunning,
        currentTest,
        results,
        summary,
        activeCategory,
        togglePanel,
        setActiveCategory,
        runAllTests,
        clearResults
    } = useTestingStore();

    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    if (!isOpen) return null;

    const toggleExpand = (id: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const filteredResults = activeCategory === 'all'
        ? results
        : results.filter(r => r.category === activeCategory);

    const getScoreColor = (score: number) => {
        if (score >= 90) return '#10B981';
        if (score >= 70) return '#F59E0B';
        return '#EF4444';
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 440, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="h-full bg-[var(--bg)] border-l border-[var(--border)] flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-surface)]">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-gradient-to-br from-violet-600/20 to-purple-600/20 border border-violet-500/20">
                            <FileText className="w-4 h-4 text-violet-400" />
                        </div>
                        <span className="text-sm font-medium text-[var(--text)]">Testing Toolkit</span>
                        {isRunning && (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20">
                                <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                                <span className="text-[10px] text-violet-400">Running</span>
                            </span>
                        )}
                    </div>
                    <button
                        onClick={togglePanel}
                        className="p-1.5 rounded-lg hover:bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Controls */}
                <div className="p-3 border-b border-[var(--border)] space-y-3">
                    <div className="flex gap-2">
                        <button
                            onClick={runAllTests}
                            disabled={isRunning}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg 
                                       bg-gradient-to-r from-violet-600 to-purple-600 text-white font-medium text-sm
                                       hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 transition-all
                                       shadow-lg shadow-violet-500/20"
                        >
                            {isRunning ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>{currentTest || 'Running...'}</span>
                                </>
                            ) : (
                                <>
                                    <Play className="w-4 h-4" />
                                    <span>Run All Tests</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={clearResults}
                            disabled={isRunning || results.length === 0}
                            className="p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]
                                       text-[var(--text-muted)] hover:text-[var(--text)] hover:border-[var(--border-hover)]
                                       disabled:opacity-50 transition-all"
                            title="Clear Results"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Score Banner */}
                    {summary.total > 0 && (
                        <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border)]">
                            <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                    <span className="text-[var(--text-muted)]">{summary.pass}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <XCircle className="w-3.5 h-3.5 text-red-400" />
                                    <span className="text-[var(--text-muted)]">{summary.fail}</span>
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                    <span className="text-[var(--text-muted)]">{summary.warning}</span>
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs text-[var(--text-dim)]">Score</span>
                                <span
                                    className="text-lg font-bold"
                                    style={{ color: getScoreColor(summary.score) }}
                                >
                                    {summary.score}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Category Tabs */}
                <div className="p-2 border-b border-[var(--border)] overflow-x-auto">
                    <div className="flex gap-1">
                        <CategoryTab
                            active={activeCategory === 'all'}
                            onClick={() => setActiveCategory('all')}
                            label="All"
                            count={results.length}
                            score={summary.score}
                        />
                        {(Object.keys(CATEGORY_CONFIG) as TestCategory[]).map(cat => {
                            const config = CATEGORY_CONFIG[cat];
                            const count = results.filter(r => r.category === cat).length;
                            const score = summary.categoryScores[cat];
                            return (
                                <CategoryTab
                                    key={cat}
                                    active={activeCategory === cat}
                                    onClick={() => setActiveCategory(cat)}
                                    label={config.label}
                                    count={count}
                                    color={config.color}
                                    score={score}
                                />
                            );
                        })}
                    </div>
                </div>

                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    {filteredResults.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center px-6">
                            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] mb-4">
                                <FileText className="w-8 h-8 text-violet-400/50" />
                            </div>
                            <h3 className="text-sm font-medium text-[var(--text-muted)] mb-1">
                                No Tests Run Yet
                            </h3>
                            <p className="text-xs text-[var(--text-dim)]">
                                Click "Run All Tests" to analyze the current page
                            </p>
                        </div>
                    ) : (
                        filteredResults.map(result => (
                            <TestResultCard
                                key={result.id}
                                result={result}
                                expanded={expandedItems.has(result.id)}
                                onToggle={() => toggleExpand(result.id)}
                            />
                        ))
                    )}
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

function CategoryTab({
    active,
    onClick,
    label,
    count,
    color,
    score
}: {
    active: boolean;
    onClick: () => void;
    label: string;
    count: number;
    color?: string;
    score?: number;
}) {
    const getScoreColor = (s: number) => {
        if (s >= 90) return 'text-emerald-500';
        if (s >= 70) return 'text-amber-500';
        return 'text-red-500';
    };

    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap
                       ${active
                    ? 'bg-[var(--accent-muted)] text-[var(--accent)] border border-[var(--accent)]'
                    : 'bg-[var(--bg-surface)] text-[var(--text-dim)] hover:text-[var(--text-muted)] border border-transparent'
                }`}
            style={active && color ? {
                backgroundColor: `${color}20`,
                borderColor: `${color}40`,
                color: color
            } : undefined}
        >
            <span>{label}</span>
            {count > 0 && (
                <div className="flex items-center gap-1.5">
                    <span className="opacity-60">({count})</span>
                    {score !== undefined && (
                        <span className={`font-bold ${active ? 'opacity-100' : getScoreColor(score)}`}>
                            {score}
                        </span>
                    )}
                </div>
            )}
        </button>
    );
}

function TestResultCard({
    result,
    expanded,
    onToggle
}: {
    result: TestResult;
    expanded: boolean;
    onToggle: () => void;
}) {
    const statusConfig = STATUS_ICONS[result.status];
    const StatusIcon = statusConfig.icon;
    const categoryConfig = CATEGORY_CONFIG[result.category];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-lg border border-[var(--border)] overflow-hidden"
            style={{ backgroundColor: statusConfig.bg }}
        >
            <button
                onClick={onToggle}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
            >
                <StatusIcon
                    className={`w-4 h-4 flex-shrink-0 ${result.status === 'running' ? 'animate-spin' : ''}`}
                    style={{ color: statusConfig.color }}
                />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[var(--text)]">{result.name}</span>
                        <span
                            className="text-[10px] px-1.5 py-0.5 rounded"
                            style={{
                                backgroundColor: `${categoryConfig.color}20`,
                                color: categoryConfig.color
                            }}
                        >
                            {categoryConfig.label}
                        </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{result.details}</p>
                </div>
                {(result.suggestion || (result.elements && result.elements.length > 0)) && (
                    expanded ? (
                        <ChevronDown className="w-4 h-4 text-[var(--text-dim)]" />
                    ) : (
                        <ChevronRight className="w-4 h-4 text-[var(--text-dim)]" />
                    )
                )}
            </button>

            {expanded && result.suggestion && (
                <div className="px-3 pb-3 pt-0">
                    <div className="p-2.5 rounded-md bg-[var(--bg)] border border-[var(--border)]">
                        <p className="text-xs text-[var(--text-dim)]">
                            <span className="text-[var(--accent)] font-medium">Suggestion: </span>
                            {result.suggestion}
                        </p>
                        {result.elements && result.elements.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-[var(--border)]">
                                <p className="text-[10px] text-[var(--text-dim)] mb-1">Affected elements:</p>
                                <div className="space-y-1">
                                    {result.elements.slice(0, 3).map((el, i) => (
                                        <code key={i} className="block text-[10px] text-violet-400 bg-violet-500/10 px-2 py-1 rounded overflow-x-auto">
                                            {el}
                                        </code>
                                    ))}
                                    {result.elements.length > 3 && (
                                        <p className="text-[10px] text-[var(--text-dim)]">
                                            +{result.elements.length - 3} more
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
