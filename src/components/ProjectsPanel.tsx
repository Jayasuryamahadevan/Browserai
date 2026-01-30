import React, { useState, useEffect } from 'react';
import { useTabStore } from '../store/useTabStore';
import { useProjectsStore, Task } from '../store/useProjectsStore';
import {
    X, Plus, Trash2, FolderKanban, ChevronLeft,
    Circle, Clock, CheckCircle2, MoreVertical,
    Flag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Status column configuration
const STATUS_CONFIG = {
    todo: { label: 'To Do', icon: Circle, color: 'text-slate-400', bg: 'bg-slate-50' },
    in_progress: { label: 'In Progress', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
    done: { label: 'Done', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50' }
} as const;

const PRIORITY_CONFIG = {
    low: { label: 'Low', color: 'text-slate-400', bg: 'bg-slate-100' },
    medium: { label: 'Medium', color: 'text-amber-500', bg: 'bg-amber-100' },
    high: { label: 'High', color: 'text-red-500', bg: 'bg-red-100' }
} as const;

const PROJECT_ICONS = ['📋', '🚀', '💡', '🎯', '📊', '🔧', '📱', '🌐', '🎨', '📝'];

// Task Card Component
const TaskCard: React.FC<{
    task: Task;
    projectId: string;
    onMove: (status: Task['status']) => void;
    onDelete: () => void;
}> = ({ task, onMove, onDelete }) => {
    const [showMenu, setShowMenu] = useState(false);
    const priorityConfig = PRIORITY_CONFIG[task.priority];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 font-medium truncate">{task.title}</p>
                    {task.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">{task.description}</p>
                    )}
                </div>
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1 rounded hover:bg-slate-100 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreVertical size={14} className="text-slate-400" />
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-6 bg-white rounded-lg shadow-lg border border-slate-100 py-1 z-10 min-w-[120px]">
                            {task.status !== 'todo' && (
                                <button
                                    onClick={() => { onMove('todo'); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Circle size={12} className="text-slate-400" /> To Do
                                </button>
                            )}
                            {task.status !== 'in_progress' && (
                                <button
                                    onClick={() => { onMove('in_progress'); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <Clock size={12} className="text-amber-500" /> In Progress
                                </button>
                            )}
                            {task.status !== 'done' && (
                                <button
                                    onClick={() => { onMove('done'); setShowMenu(false); }}
                                    className="w-full px-3 py-1.5 text-left text-xs hover:bg-slate-50 flex items-center gap-2"
                                >
                                    <CheckCircle2 size={12} className="text-emerald-500" /> Done
                                </button>
                            )}
                            <hr className="my-1 border-slate-100" />
                            <button
                                onClick={() => { onDelete(); setShowMenu(false); }}
                                className="w-full px-3 py-1.5 text-left text-xs hover:bg-red-50 text-red-500 flex items-center gap-2"
                            >
                                <Trash2 size={12} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${priorityConfig.bg} ${priorityConfig.color}`}>
                    <Flag size={10} className="inline mr-0.5" />
                    {priorityConfig.label}
                </span>
            </div>
        </motion.div>
    );
};

// Status Column Component
const StatusColumn: React.FC<{
    status: Task['status'];
    tasks: Task[];
    projectId: string;
    onAddTask: () => void;
}> = ({ status, tasks, projectId, onAddTask }) => {
    const { moveTask, deleteTask } = useProjectsStore();
    const config = STATUS_CONFIG[status];
    const Icon = config.icon;

    return (
        <div className={`flex-1 min-w-[200px] rounded-xl ${config.bg} p-3`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={16} className={config.color} />
                    <span className="text-sm font-semibold text-slate-700">{config.label}</span>
                    <span className="text-xs bg-white/60 px-1.5 py-0.5 rounded-full text-slate-500">
                        {tasks.length}
                    </span>
                </div>
                {status === 'todo' && (
                    <button
                        onClick={onAddTask}
                        className="p-1 rounded hover:bg-white/50 text-slate-400 hover:text-indigo-600"
                    >
                        <Plus size={16} />
                    </button>
                )}
            </div>
            <div className="space-y-2 max-h-[calc(100vh-320px)] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            projectId={projectId}
                            onMove={(newStatus) => moveTask(projectId, task.id, newStatus)}
                            onDelete={() => deleteTask(projectId, task.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

// Main Projects Panel
export const ProjectsPanel: React.FC = () => {
    const { isSidebarOpen, sidebarView, toggleSidebar } = useTabStore();
    const {
        projects, activeProjectId,
        fetchProjects, createProject, deleteProject, setActiveProject, createTask
    } = useProjectsStore();

    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('📋');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<Task['priority']>('medium');

    const activeProject = projects.find(p => p.id === activeProjectId);

    useEffect(() => {
        fetchProjects();
    }, []);

    if (!isSidebarOpen || sidebarView !== 'projects') return null;

    const handleCreateProject = () => {
        if (!newProjectName.trim()) return;
        createProject(newProjectName.trim(), selectedIcon);
        setNewProjectName('');
        setIsCreating(false);
    };

    const handleCreateTask = () => {
        if (!newTaskTitle.trim() || !activeProjectId) return;
        createTask(activeProjectId, newTaskTitle.trim(), newTaskPriority);
        setNewTaskTitle('');
        setIsAddingTask(false);
    };

    return (
        <div className="w-[500px] bg-slate-50 border-l border-slate-200 flex flex-col h-full shadow-2xl z-40 shrink-0">
            {/* Header */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white shrink-0">
                {activeProject ? (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setActiveProject(null)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xl">{activeProject.icon}</span>
                        <span className="font-bold text-slate-700">{activeProject.name}</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-lg">
                        <FolderKanban size={20} />
                        <span>Projects</span>
                    </div>
                )}
                <button
                    onClick={() => toggleSidebar('projects')}
                    className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-100 p-1.5 rounded-full hover:bg-slate-200"
                >
                    <X size={16} />
                </button>
            </div>

            {/* Content */}
            {activeProject ? (
                /* Kanban Board View */
                <div className="flex-1 p-4 overflow-hidden">
                    {/* Quick Add Task */}
                    {isAddingTask ? (
                        <div className="mb-4 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                            <input
                                autoFocus
                                className="w-full text-sm outline-none placeholder:text-slate-400"
                                placeholder="Task title..."
                                value={newTaskTitle}
                                onChange={e => setNewTaskTitle(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateTask()}
                            />
                            <div className="flex items-center justify-between mt-2">
                                <div className="flex gap-1">
                                    {(['low', 'medium', 'high'] as const).map(p => (
                                        <button
                                            key={p}
                                            onClick={() => setNewTaskPriority(p)}
                                            className={`text-[10px] px-2 py-1 rounded ${newTaskPriority === p
                                                ? `${PRIORITY_CONFIG[p].bg} ${PRIORITY_CONFIG[p].color}`
                                                : 'bg-slate-50 text-slate-400'
                                                }`}
                                        >
                                            {PRIORITY_CONFIG[p].label}
                                        </button>
                                    ))}
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsAddingTask(false)}
                                        className="text-xs text-slate-400 hover:text-slate-600"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleCreateTask}
                                        className="text-xs bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* Kanban Columns */}
                    <div className="flex gap-3 h-full overflow-x-auto pb-4">
                        {(['todo', 'in_progress', 'done'] as const).map(status => (
                            <StatusColumn
                                key={status}
                                status={status}
                                tasks={activeProject.tasks.filter(t => t.status === status)}
                                projectId={activeProject.id}
                                onAddTask={() => setIsAddingTask(true)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* Projects List View */
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Create Project */}
                    {isCreating ? (
                        <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
                            <div className="flex gap-2 mb-3 flex-wrap">
                                {PROJECT_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => setSelectedIcon(icon)}
                                        className={`text-xl p-1 rounded-lg ${selectedIcon === icon ? 'bg-indigo-100 ring-2 ring-indigo-300' : 'hover:bg-slate-100'
                                            }`}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                            <input
                                autoFocus
                                className="w-full text-sm outline-none placeholder:text-slate-400 border-b border-slate-100 pb-2"
                                placeholder="Project name..."
                                value={newProjectName}
                                onChange={e => setNewProjectName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="text-xs text-slate-400 hover:text-slate-600"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateProject}
                                    disabled={!newProjectName.trim()}
                                    className="text-xs bg-indigo-600 text-white px-4 py-1.5 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Create Project
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full bg-white hover:bg-indigo-50 border-2 border-dashed border-slate-200 hover:border-indigo-300 rounded-xl p-4 mb-4 flex items-center justify-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                            <Plus size={18} />
                            <span className="text-sm font-medium">New Project</span>
                        </button>
                    )}

                    {/* Projects Grid */}
                    <div className="space-y-2">
                        <AnimatePresence>
                            {projects.map(project => (
                                <motion.div
                                    key={project.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setActiveProject(project.id)}
                                    className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{project.icon}</span>
                                            <div>
                                                <h3 className="font-semibold text-slate-700">{project.name}</h3>
                                                <p className="text-xs text-slate-400">
                                                    {project.tasks.length} tasks
                                                    {project.tasks.filter(t => t.status === 'done').length > 0 && (
                                                        <span className="text-emerald-500 ml-1">
                                                            • {project.tasks.filter(t => t.status === 'done').length} done
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }}
                                            className="p-2 rounded-lg hover:bg-red-50 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    {/* Progress bar */}
                                    {project.tasks.length > 0 && (
                                        <div className="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                                                style={{
                                                    width: `${(project.tasks.filter(t => t.status === 'done').length / project.tasks.length) * 100}%`
                                                }}
                                            />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {projects.length === 0 && !isCreating && (
                            <div className="text-center py-10 opacity-50">
                                <FolderKanban size={48} className="mx-auto mb-2 text-slate-300" />
                                <p className="text-slate-400 text-sm">No projects yet.<br />Create one to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
