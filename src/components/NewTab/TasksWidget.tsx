import { useState, useMemo } from 'react';
import { useProjectsStore } from '../../store/useProjectsStore';
import { Plus, X, ChevronRight, ChevronLeft, CheckCircle2, Circle, Layout, List } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS_ICONS = {
    'todo': Circle,
    'in_progress': Circle,
    'done': CheckCircle2
};

const PRIORITY_COLORS = {
    'low': 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    'medium': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'high': 'bg-rose-500/10 text-rose-500 border-rose-500/20'
};

export const TasksWidget = () => {
    const { projects, activeProjectId, createTask, updateTask, deleteTask, createProject } = useProjectsStore();
    const [selectedProjectId, setSelectedProjectId] = useState<string | null>(activeProjectId || (projects[0]?.id || null));
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId), [projects, selectedProjectId]);

    // Calendar Logic
    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
        return days;
    }, [currentMonth]);

    const isSameDate = (d1: Date, d2: Date) =>
        d1.getDate() === d2.getDate() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getFullYear() === d2.getFullYear();

    const tasksForSelectedDate = useMemo(() => {
        if (!selectedProject?.tasks) return [];
        return selectedProject.tasks.filter(task => {
            if (viewMode === 'list' && !task.dueDate) return task.status !== 'done'; // Show backlog in list view if no date
            if (!task.dueDate) return false;
            const taskDate = new Date(task.dueDate);
            return isSameDate(taskDate, selectedDate);
        }).sort((a, b) => {
            if (a.status === 'done' && b.status !== 'done') return 1;
            if (a.status !== 'done' && b.status === 'done') return -1;
            return 0;
        });
    }, [selectedProject, selectedDate, viewMode]);

    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !selectedProjectId) return;
        // If in calendar mode, use selected date. If list mode, maybe no date? Or today? Default to Today.
        const dateToUse = viewMode === 'calendar' ? selectedDate.toISOString() : new Date().toISOString();
        await createTask(selectedProjectId, newTaskTitle, 'medium', dateToUse);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    const cycleTaskStatus = async (task: any) => {
        const nextStatus = task.status === 'done' ? 'todo' : 'done';
        await updateTask(selectedProjectId!, task.id, { status: nextStatus });
    };

    const changeMonth = (offset: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
        setCurrentMonth(newMonth);
    };

    // Removed early return to allow rendering empty state


    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-4xl bg-[#18181B] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[600px]"
        >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#202023]/50">
                <div className="flex items-center gap-4">
                    <h2 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs">✓</span>
                        Tasks
                    </h2>
                    <div className="h-4 w-px bg-white/10" />
                    {projects.length > 0 ? (
                        projects.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedProjectId(p.id)}
                                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${selectedProjectId === p.id
                                    ? 'bg-white/10 text-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                                    }`}
                            >
                                {p.name}
                            </button>
                        ))
                    ) : (
                        <div className="text-xs text-zinc-500 italic flex items-center gap-2">
                            No projects
                        </div>
                    )}
                    <button
                        onClick={async () => {
                            const name = prompt("Enter project name:");
                            if (name) {
                                await createProject(name);
                            }
                        }}
                        className="p-1 hover:bg-white/10 rounded text-zinc-400 hover:text-white"
                        title="Create Project"
                    >
                        <Plus size={14} />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <List size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('calendar')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white/10 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                        <Layout size={16} />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 overflow-hidden">
                {/* Calendar Side Panel (Conditional) */}
                <AnimatePresence initial={false}>
                    {viewMode === 'calendar' && (
                        <motion.div
                            initial={{ width: 0, opacity: 0 }}
                            animate={{ width: 300, opacity: 1 }}
                            exit={{ width: 0, opacity: 0 }}
                            className="bg-[#1C1C1E] border-r border-white/5 flex flex-col p-6 overflow-hidden"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <span className="font-medium text-white">
                                    {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white/5 rounded text-zinc-400"><ChevronLeft size={16} /></button>
                                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white/5 rounded text-zinc-400"><ChevronRight size={16} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center text-xs text-zinc-600 mb-2">
                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d}>{d}</div>)}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((date, i) => {
                                    if (!date) return <div key={i} />;
                                    const isSelected = isSameDate(date, selectedDate);
                                    const isToday = isSameDate(date, new Date());
                                    const hasTasks = selectedProject?.tasks?.some(t => t.dueDate && isSameDate(new Date(t.dueDate), date) && t.status !== 'done');

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(date)}
                                            className={`aspect-square rounded-md flex items-center justify-center text-xs relative ${isSelected
                                                ? 'bg-indigo-600 text-white font-medium shadow-sm'
                                                : 'text-zinc-400 hover:bg-white/5'
                                                } ${isToday && !isSelected ? 'text-indigo-400' : ''}`}
                                        >
                                            {date.getDate()}
                                            {hasTasks && !isSelected && <div className="absolute bottom-1 w-1 h-1 bg-indigo-500/50 rounded-full" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Task List */}
                <div className="flex-1 flex flex-col bg-[#121212]">
                    <div className="px-8 py-6 border-b border-white/5 flex items-end justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-white leading-none mb-2">
                                {viewMode === 'calendar'
                                    ? selectedDate.toLocaleDateString('default', { weekday: 'long', day: 'numeric', month: 'long' })
                                    : "All Tasks"
                                }
                            </h3>
                            <p className="text-zinc-500 text-sm">
                                {tasksForSelectedDate.length} tasks • {selectedProject?.name}
                            </p>
                        </div>
                        <button
                            onClick={() => setIsAddingTask(true)}
                            className="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-3 py-1.5 rounded-md hover:bg-indigo-500/10 transition-colors"
                        >
                            <Plus size={16} /> New Task
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-1 customize-scrollbar">
                        {isAddingTask && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
                                <input
                                    autoFocus
                                    className="w-full bg-[#1C1C1E] border border-indigo-500/30 rounded-lg px-4 py-3 text-white text-sm outline-none placeholder:text-zinc-600 focus:ring-1 focus:ring-indigo-500/50"
                                    placeholder={`Add task to ${viewMode === 'calendar' ? 'selected date' : 'list'}...`}
                                    value={newTaskTitle}
                                    onChange={e => setNewTaskTitle(e.target.value)}
                                    onKeyDown={e => {
                                        if (e.key === 'Enter') handleAddTask();
                                        if (e.key === 'Escape') setIsAddingTask(false);
                                    }}
                                />
                            </motion.div>
                        )}

                        <AnimatePresence>
                            {tasksForSelectedDate.length > 0 ? (
                                tasksForSelectedDate.map(task => {
                                    const StatusIcon = STATUS_ICONS[task.status];
                                    const isDone = task.status === 'done';
                                    return (
                                        <motion.div
                                            layout
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            key={task.id}
                                            className="group flex items-center gap-3 py-3 px-3 hover:bg-white/5 rounded-lg -mx-3 transition-colors border-b border-white/5 last:border-0 hover:border-transparent"
                                        >
                                            <button
                                                onClick={() => cycleTaskStatus(task)}
                                                className={`transition-colors ${isDone ? 'text-emerald-500' : 'text-zinc-600 hover:text-indigo-400'}`}
                                            >
                                                <StatusIcon size={20} strokeWidth={1.5} />
                                            </button>
                                            <span className={`flex-1 text-sm ${isDone ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                                                {task.title}
                                            </span>
                                            {task.priority !== 'medium' && (
                                                <span className={`text-[10px] px-2 py-0.5 rounded border uppercase tracking-wider font-medium ${PRIORITY_COLORS[task.priority]}`}>
                                                    {task.priority}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => deleteTask(selectedProjectId!, task.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-600 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                !isAddingTask && (
                                    <div className="h-40 flex flex-col items-center justify-center text-zinc-700">
                                        <p className="text-sm">No tasks pending</p>
                                    </div>
                                )
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
