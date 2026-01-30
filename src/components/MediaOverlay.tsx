import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTabStore } from '../store/useTabStore';
import { useBrowserRefStore } from '../store/useBrowserRefStore';
import { Play, Pause, SkipBack, SkipForward, Repeat, Shuffle, Image as ImageIcon, X } from 'lucide-react';

export const MediaOverlay: React.FC = () => {
    const { isMediaOpen, toggleMedia, activeTabId } = useTabStore();
    const { getWebview } = useBrowserRefStore();
    const [isPlaying, setIsPlaying] = useState(false);
    const [title, setTitle] = useState('No media playing');
    const [artist, setArtist] = useState('Unknown Artist');
    const [progress, setProgress] = useState(0);

    // Poll for media status when open
    useEffect(() => {
        if (!isMediaOpen || !activeTabId) return;

        const webview = getWebview(activeTabId);
        if (!webview) return;

        const interval = setInterval(() => {
            // Check for media
            webview.executeJavaScript(`
                (function() {
                    const media = document.querySelector('video, audio');
                    if (!media) return null;
                    return {
                        paused: media.paused,
                        currentTime: media.currentTime,
                        duration: media.duration,
                        title: navigator.mediaSession?.metadata?.title || document.title,
                        artist: navigator.mediaSession?.metadata?.artist || window.location.hostname
                    };
                })()
            `).then((data: any) => {
                if (data) {
                    setIsPlaying(!data.paused);
                    setTitle(data.title);
                    setArtist(data.artist);
                    if (data.duration) {
                        setProgress((data.currentTime / data.duration) * 100);
                    }
                }
            }).catch(() => { });
        }, 1000);

        return () => clearInterval(interval);
    }, [isMediaOpen, activeTabId, getWebview]);

    const handlePlayPause = () => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        if (webview) {
            webview.executeJavaScript(`
                const media = document.querySelector('video, audio');
                if (media) {
                    media.paused ? media.play() : media.pause();
                }
            `);
            setIsPlaying(!isPlaying);
        }
    };

    const handleSkip = (seconds: number) => {
        const webview = activeTabId ? getWebview(activeTabId) : null;
        if (webview) {
            webview.executeJavaScript(`
                const media = document.querySelector('video, audio');
                if (media) media.currentTime += ${seconds};
            `);
        }
    };

    return (
        <AnimatePresence>
            {isMediaOpen && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="fixed top-12 right-2 z-50 w-80 bg-[#1E1F22] border border-white/10 rounded-xl shadow-2xl p-4 overflow-hidden"
                >
                    <div className="flex gap-4 items-center">
                        {/* Thumbnail Placeholder */}
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shrink-0 shadow-lg">
                            <ImageIcon className="text-white/50" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h3 className="text-white font-medium text-sm truncate">{title}</h3>
                            <p className="text-xs text-gray-400 truncate">{artist}</p>

                            {/* Progress */}
                            <div className="w-full h-1 bg-white/10 rounded-full mt-3 overflow-hidden">
                                <div
                                    className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-linear shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        {/* Close X */}
                        <button onClick={toggleMedia} className="absolute top-2 right-2 text-gray-500 hover:text-white">
                            <X size={14} />
                        </button>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4 mt-4">
                        <button className="text-gray-400 hover:text-white transition-colors" title="Loop">
                            <Repeat size={16} />
                        </button>
                        <button onClick={() => handleSkip(-10)} className="text-gray-300 hover:text-white transition-colors">
                            <SkipBack size={20} fill="currentColor" />
                        </button>
                        <button
                            onClick={handlePlayPause}
                            className="bg-white text-black p-2.5 rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                        >
                            {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-0.5" />}
                        </button>
                        <button onClick={() => handleSkip(10)} className="text-gray-300 hover:text-white transition-colors">
                            <SkipForward size={20} fill="currentColor" />
                        </button>
                        <button className="text-gray-400 hover:text-white transition-colors" title="Shuffle">
                            <Shuffle size={16} />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
