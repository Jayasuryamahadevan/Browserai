import React from 'react';
import { SearchWidget } from './SearchWidget';
import { useNtpStore } from '../../store/useNtpStore';

export const NewTabPage: React.FC = () => {
    console.log('[NewTabPage] Rendering...');

    const { showSearch } = useNtpStore();

    return (
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white select-none">
            {/* Subtle Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)',
                    backgroundSize: '24px 24px'
                }}
            />

            {/* Center Content */}
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center pb-24">

                {/* Logo / Branding */}
                <div className="mb-12 flex flex-col items-center">
                    <h1 className="text-7xl font-light text-white tracking-[-0.03em] mb-4 drop-shadow-lg">
                        Saturn
                    </h1>
                    <div className="text-cyan-400 text-xs uppercase tracking-[0.3em] font-medium">
                        Agentic Browser
                    </div>
                </div>

                {/* Search Widget */}
                {showSearch && (
                    <div className="w-full max-w-xl">
                        <SearchWidget />
                    </div>
                )}
            </div>
        </div>
    );
};


