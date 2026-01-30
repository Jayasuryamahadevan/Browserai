import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';

export const Clock: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div
            className={`flex flex-col items-start text-white drop-shadow-lg select-none transition-all duration-700 ease-out ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
                }`}
        >
            <h1 className="text-8xl font-normal tracking-tight opacity-100">
                {format(time, 'h:mm')}
            </h1>
            <p className="text-xl font-medium tracking-wide opacity-90 ml-1">
                {format(time, 'EEEE, MMMM do')}
            </p>
        </div>
    );
};
