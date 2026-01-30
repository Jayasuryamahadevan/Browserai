import React, { useState } from 'react';
import { useTabStore } from '../store/useTabStore';
import { useNotesStore } from '../store/useNotesStore';
import { X, Plus, Trash2, Edit2, ExternalLink, StickyNote, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const NotesPanel: React.FC = () => {
    const { isSidebarOpen, sidebarView, toggleSidebar } = useTabStore();
    const { notes, folders, activeFolderId, addNote, deleteNote, updateNote, setActiveFolder, addFolder, deleteFolder, fetchData } = useNotesStore();
    const [newNoteContent, setNewNoteContent] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreatingFolder, setIsCreatingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    React.useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = () => {
        if (!newNoteContent.trim()) return;
        addNote({ content: newNoteContent });
        setNewNoteContent('');
    };

    if (!isSidebarOpen || sidebarView !== 'notes') return null;

    return (
        <div className="w-[400px] flex flex-col h-full shadow-2xl z-40 shrink-0 bg-black/90 backdrop-blur-xl border-l border-white/5">
            {/* Header */}
            <div className="h-14 border-b border-white/5 flex items-center justify-between px-6 bg-black/50 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-2.5 text-amber-400 font-bold text-lg tracking-wide">
                    <div className="p-1.5 bg-amber-500/10 rounded-lg shadow-[0_0_10px_rgba(251,191,36,0.1)] border border-amber-500/20">
                        <StickyNote size={18} className="" />
                    </div>
                    <span className="bg-gradient-to-r from-amber-200 to-amber-500 bg-clip-text text-transparent font-['Outfit']">Notes</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => fetchData()} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10" title="Refresh Notes">
                        <RotateCw size={14} />
                    </button>
                    <button onClick={() => toggleSidebar('notes')} className="text-slate-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Folders List */}
            <div className="px-4 py-3 border-b border-white/5 flex gap-2 overflow-x-auto no-scrollbar shrink-0 bg-black/20 backdrop-blur-sm">
                <button
                    onClick={() => setActiveFolder('all')}
                    className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeFolderId === 'all' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}`}
                >
                    All
                </button>
                {folders.map(folder => (
                    <div key={folder.id} className="relative group/folder">
                        <button
                            onClick={() => setActiveFolder(folder.id)}
                            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${activeFolderId === folder.id ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}`}
                        >
                            {folder.name}
                        </button>
                        {!folder.isDefault && (
                            <button
                                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/folder:opacity-100 transition-opacity transform scale-75 hover:scale-100"
                            >
                                <X size={10} />
                            </button>
                        )}
                    </div>
                ))}

                {isCreatingFolder ? (
                    <div className="flex items-center bg-white/10 rounded-full px-3 py-1 border border-white/10">
                        <input
                            autoFocus
                            className="bg-transparent text-xs outline-none w-20 text-white placeholder-slate-500"
                            placeholder="Name..."
                            value={newFolderName}
                            onChange={e => setNewFolderName(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && newFolderName) {
                                    addFolder(newFolderName);
                                    setNewFolderName('');
                                    setIsCreatingFolder(false);
                                }
                            }}
                            onBlur={() => setIsCreatingFolder(false)}
                        />
                    </div>
                ) : (
                    <button onClick={() => setIsCreatingFolder(true)} className="p-1.5 rounded-full bg-white/5 text-slate-400 hover:bg-amber-500/20 hover:text-amber-300 transition-colors border border-transparent hover:border-amber-500/30">
                        <Plus size={14} />
                    </button>
                )}
            </div>

            {/* Create Input */}
            <div className="p-4 bg-transparent shrink-0">
                <div className="glass-panel bg-white/5 rounded-2xl group focus-within:bg-white/10 transition-colors duration-300 p-3 space-y-3 border-white/10 focus-within:border-amber-500/30 ring-0 focus-within:ring-1 focus-within:ring-amber-500/20">
                    <textarea
                        className="w-full resize-none outline-none text-slate-200 placeholder:text-slate-500 text-sm bg-transparent leading-relaxed"
                        rows={2}
                        placeholder={`Take a note in ${activeFolderId === 'all' ? 'Personal' : activeFolderId}...`}
                        value={newNoteContent}
                        onChange={(e) => setNewNoteContent(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleCreate();
                            }
                        }}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={handleCreate}
                            disabled={!newNoteContent.trim()}
                            className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-black px-4 py-1.5 rounded-lg disabled:opacity-50 disabled:grayscale transition-all shadow-lg shadow-amber-500/20"
                        >
                            Add Note
                        </button>
                    </div>
                </div>
            </div>

            {/* Notes Grid/List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 hover:scrollbar-thumb-white/20">
                <AnimatePresence mode="popLayout">
                    {notes
                        .filter(n => activeFolderId === 'all' ? true : n.folderId === activeFolderId || (!n.folderId && activeFolderId === 'Personal'))
                        .length === 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 opacity-60 flex flex-col items-center">
                                <div className="p-4 bg-white/5 rounded-full mb-4">
                                    <StickyNote size={32} className="text-slate-500" />
                                </div>
                                <p className="text-slate-400 text-sm font-medium">Space is empty in {activeFolderId}</p>
                                <p className="text-slate-600 text-xs mt-1">Start typing above to create a note</p>
                            </motion.div>
                        )}

                    {notes
                        .filter(n => activeFolderId === 'all' ? true : n.folderId === activeFolderId || (!n.folderId && activeFolderId === 'Personal'))
                        .map((note) => (
                            <motion.div
                                key={note.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className={`group relative rounded-xl p-4 shadow-sm border border-white/5 hover:border-white/10 hover:shadow-lg hover:shadow-black/20 transition-all bg-white/5 backdrop-blur-md`}
                            >
                                {/* Content */}
                                {editingId === note.id ? (
                                    <textarea
                                        className="w-full bg-transparent resize-none outline-none text-slate-200 text-sm h-full min-h-[60px] leading-relaxed"
                                        value={note.content}
                                        onChange={(e) => updateNote(note.id, e.target.value)}
                                        onBlur={() => setEditingId(null)}
                                        autoFocus
                                    />
                                ) : (
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {note.content}
                                        </p>
                                        {note.sourceUrl && (
                                            <div className="inline-flex items-center gap-1.5 text-[10px] bg-white/5 px-2.5 py-1 rounded-full text-amber-400/80 hover:text-amber-300 hover:bg-white/10 cursor-pointer transition-colors border border-white/5" onClick={() => {
                                                if (note.sourceUrl?.startsWith('http')) {
                                                    window.open(note.sourceUrl, '_blank');
                                                }
                                            }}>
                                                <ExternalLink size={10} />
                                                {(() => {
                                                    try {
                                                        return new URL(note.sourceUrl).hostname;
                                                    } catch {
                                                        return note.sourceUrl;
                                                    }
                                                })()}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => setEditingId(note.id)}
                                        className="p-1.5 bg-black/40 rounded-lg hover:bg-indigo-500 hover:text-white text-slate-400 backdrop-blur-md transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 size={12} />
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        className="p-1.5 bg-black/40 rounded-lg hover:bg-red-500 hover:text-white text-slate-400 backdrop-blur-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                </AnimatePresence>
            </div>
        </div>
    );
};
