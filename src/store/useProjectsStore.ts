import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Task {
    id: string;
    title: string;
    description?: string;
    status: 'todo' | 'in_progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    dueDate?: string; // ISO Date string
    createdAt: string;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    icon: string;
    createdAt: string;
    tasks: Task[];
}

interface ProjectsState {
    projects: Project[];
    activeProjectId: string | null;
    isLoading: boolean;

    // Actions
    fetchProjects: () => Promise<void>;
    createProject: (name: string, icon?: string) => Promise<void>;
    deleteProject: (id: string) => Promise<void>;
    setActiveProject: (id: string | null) => void;

    // Task actions
    createTask: (projectId: string, title: string, priority?: Task['priority'], dueDate?: string) => Promise<void>;
    updateTask: (projectId: string, taskId: string, updates: Partial<Task>) => Promise<void>;
    deleteTask: (projectId: string, taskId: string) => Promise<void>;
    moveTask: (projectId: string, taskId: string, newStatus: Task['status']) => Promise<void>;
}

// Generate UUID
const generateId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useProjectsStore = create<ProjectsState>()(
    persist(
        (set, get) => ({
            projects: [],
            activeProjectId: null,
            isLoading: false,

            fetchProjects: async () => {
                set({ isLoading: true });
                try {
                    // @ts-ignore - ipcRenderer available via preload
                    if (typeof window !== 'undefined' && window.ipcRenderer) {
                        const projects = await window.ipcRenderer.invoke('jessica-list-projects-data');
                        set({ projects: projects || [], isLoading: false });
                    } else {
                        console.warn('[ProjectsStore] ipcRenderer not available');
                        set({ projects: [], isLoading: false });
                    }
                } catch (e) {
                    console.error('Failed to fetch projects:', e);
                    set({ projects: [], isLoading: false });
                }
            },

            createProject: async (name: string, icon = '📋') => {
                const project: Project = {
                    id: generateId(),
                    name,
                    icon,
                    createdAt: new Date().toISOString(),
                    tasks: []
                };

                try {
                    // @ts-ignore
                    await window.ipcRenderer.invoke('jessica-save-project', project);
                    set(state => ({
                        projects: [...state.projects, project],
                        activeProjectId: project.id
                    }));
                } catch (e) {
                    console.error('Failed to create project:', e);
                }
            },

            deleteProject: async (id: string) => {
                try {
                    // @ts-ignore
                    await window.ipcRenderer.invoke('jessica-delete-project', id);
                    set(state => ({
                        projects: state.projects.filter(p => p.id !== id),
                        activeProjectId: state.activeProjectId === id ? null : state.activeProjectId
                    }));
                } catch (e) {
                    console.error('Failed to delete project:', e);
                }
            },

            setActiveProject: (id) => set({ activeProjectId: id }),

            createTask: async (projectId: string, title: string, priority = 'medium', dueDate?: string) => {
                const task: Task = {
                    id: generateId(),
                    title,
                    status: 'todo',
                    priority,
                    dueDate,
                    createdAt: new Date().toISOString()
                };

                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === projectId
                            ? { ...p, tasks: [...(p.tasks || []), task] }
                            : p
                    )
                }));

                // Save to disk
                const { projects } = get();
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    try {
                        // @ts-ignore
                        await window.ipcRenderer.invoke('jessica-save-project', project);
                    } catch (e) {
                        console.error('Failed to save task:', e);
                    }
                }
            },

            updateTask: async (projectId: string, taskId: string, updates: Partial<Task>) => {
                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === projectId
                            ? {
                                ...p,
                                tasks: (p.tasks || []).map(t =>
                                    t.id === taskId ? { ...t, ...updates } : t
                                )
                            }
                            : p
                    )
                }));

                // Save to disk
                const { projects } = get();
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    try {
                        // @ts-ignore
                        await window.ipcRenderer.invoke('jessica-save-project', project);
                    } catch (e) {
                        console.error('Failed to update task:', e);
                    }
                }
            },

            deleteTask: async (projectId: string, taskId: string) => {
                set(state => ({
                    projects: state.projects.map(p =>
                        p.id === projectId
                            ? { ...p, tasks: (p.tasks || []).filter(t => t.id !== taskId) }
                            : p
                    )
                }));

                // Save to disk
                const { projects } = get();
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    try {
                        // @ts-ignore
                        await window.ipcRenderer.invoke('jessica-save-project', project);
                    } catch (e) {
                        console.error('Failed to delete task:', e);
                    }
                }
            },

            moveTask: async (projectId: string, taskId: string, newStatus: Task['status']) => {
                await get().updateTask(projectId, taskId, { status: newStatus });
            }
        }),
        {
            name: 'jessica-projects',
        }
    )
);
