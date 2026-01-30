import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabStore } from '../store/useTabStore';
import { TasksWidget } from './NewTab/TasksWidget';
import { X } from 'lucide-react';

export const CalendarOverlay: React.FC = () => {
    const { isCalendarOpen, toggleCalendar } = useTabStore();

    // Close on Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isCalendarOpen) {
                toggleCalendar();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isCalendarOpen, toggleCalendar]);

    return (
        <AnimatePresence>
            {isCalendarOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={toggleCalendar}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                        className="relative z-10 w-full max-w-5xl px-6 pointer-events-none flex justify-center"
                    >
                        {/* Wrapper to re-enable pointer events and position close button */}
                        <div className="relative pointer-events-auto w-full max-w-4xl">
                            {/* Close Button */}
                            <button
                                onClick={toggleCalendar}
                                className="absolute -top-10 right-0 p-2 text-white/50 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-full"
                            >
                                <X size={20} />
                            </button>

                            {/* The Widget */}
                            <TasksWidget />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
