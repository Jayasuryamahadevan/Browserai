import React from 'react';
import { X, Minus, Square } from 'lucide-react';

export const WindowControls: React.FC = () => {
    const handleMinimize = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.send('minimize-window');
        }
    };

    const handleMaximize = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.send('maximize-window');
        }
    };

    const handleClose = () => {
        if (window.ipcRenderer) {
            window.ipcRenderer.send('close-window');
        }
    };

    return (
        <div className="flex items-center h-full" style={{ WebkitAppRegion: 'no-drag' } as any}>
            <button
                onClick={handleMinimize}
                className="h-full px-4 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center"
                title="Minimize"
            >
                <Minus size={16} strokeWidth={1.5} />
            </button>
            <button
                onClick={handleMaximize}
                className="h-full px-4 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors flex items-center justify-center"
                title="Maximize"
            >
                <Square size={14} strokeWidth={1.5} />
            </button>
            <button
                onClick={handleClose}
                className="h-full px-4 text-slate-400 hover:bg-red-600 hover:text-white transition-colors flex items-center justify-center"
                title="Close"
            >
                <X size={16} strokeWidth={1.5} />
            </button>
        </div>
    );
};
