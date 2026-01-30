import React from 'react';
import { useTabStore } from '../store/useTabStore';
import { TabItem } from './TabItem';

export const BrowserView: React.FC = () => {
    const { tabs, activeTabId } = useTabStore();

    return (
        <div className="flex-1 bg-white relative min-w-0 rounded-tl-xl rounded-tr-xl overflow-hidden shadow-2xl mx-1 mb-1">
            {tabs.map((tab) => (
                <TabItem
                    key={tab.id}
                    tab={tab}
                    isActive={tab.id === activeTabId}
                />
            ))}

            {tabs.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500">
                    No tabs open
                </div>
            )}
        </div>
    );
};
