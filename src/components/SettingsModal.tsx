import React from 'react';
import { useTabStore } from '../store/useTabStore';
import { useJessicaStore } from '../store/useJessicaStore';
import { useSettingsStore } from '../store/useSettingsStore';
import {
    X, Shield, Palette, Search, Monitor, Sparkles, RefreshCw,
    LayoutTemplate, Keyboard, Lock, Code, Info, ChevronRight,
    Globe, Eye, Zap, Moon, Sun, Sidebar, Minimize2,
    Download, Play, Gauge, Server, Trash2, History, FileText,
    Send, Bug, FlaskConical, RotateCcw
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════════════════
// ELITE UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

interface ToggleSwitchProps {
    enabled: boolean;
    onChange: (enabled: boolean) => void;
    size?: 'sm' | 'md';
    accentColor?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ enabled, onChange, size = 'md', accentColor }) => {
    const sizes = {
        sm: { track: 'w-9 h-5', thumb: 'w-3.5 h-3.5', translate: 'translate-x-4' },
        md: { track: 'w-11 h-6', thumb: 'w-4 h-4', translate: 'translate-x-5' }
    };
    const s = sizes[size];

    return (
        <button
            onClick={() => onChange(!enabled)}
            className={clsx(
                s.track, "relative rounded-full transition-all duration-300 ease-out",
                enabled
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                    : "bg-white/10 hover:bg-white/15"
            )}
            style={enabled && accentColor ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`,
                boxShadow: `0 0 20px ${accentColor}66`
            } : undefined}
        >
            <span className={clsx(
                s.thumb, "absolute top-1 left-1 bg-white rounded-full shadow-lg transition-transform duration-300 ease-out",
                enabled && s.translate
            )} />
        </button>
    );
};

interface SliderProps {
    value: number;
    min: number;
    max: number;
    step?: number;
    onChange: (value: number) => void;
    label?: string;
    unit?: string;
}

const Slider: React.FC<SliderProps> = ({ value, min, max, step = 1, onChange, label, unit = '' }) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="space-y-2">
            {label && (
                <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">{label}</span>
                    <span className="text-sm font-medium text-cyan-400">{value}{unit}</span>
                </div>
            )}
            <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                    className="absolute h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                />
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
            </div>
        </div>
    );
};

interface SelectProps {
    value: string;
    options: { value: string; label: string }[];
    onChange: (value: string) => void;
}

const Select: React.FC<SelectProps> = ({ value, options, onChange }) => (
    <div className="relative">
        <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3 
                       focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 
                       transition-all appearance-none cursor-pointer hover:bg-white/10 hover:border-white/20
                       text-sm"
        >
            {options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-slate-900">{opt.label}</option>
            ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
            <ChevronRight size={16} className="rotate-90" />
        </div>
    </div>
);

interface SettingRowProps {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    danger?: boolean;
}

const SettingRow: React.FC<SettingRowProps> = ({ icon, title, description, children, danger }) => (
    <div className={clsx(
        "flex items-center justify-between p-4 rounded-xl transition-all group",
        "hover:bg-white/5 border border-transparent hover:border-white/5",
        danger && "hover:bg-red-500/5 hover:border-red-500/20"
    )}>
        <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && (
                <div className={clsx(
                    "p-2 rounded-lg",
                    danger ? "bg-red-500/10 text-red-400" : "bg-white/5 text-slate-400 group-hover:text-cyan-400"
                )}>
                    {icon}
                </div>
            )}
            <div className="flex-1 min-w-0">
                <span className={clsx(
                    "block text-sm font-medium",
                    danger ? "text-red-400" : "text-white"
                )}>{title}</span>
                {description && <span className="block text-xs text-slate-500 mt-0.5">{description}</span>}
            </div>
        </div>
        <div className="ml-4 flex-shrink-0">{children}</div>
    </div>
);

interface SectionCardProps {
    title?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const SectionCard: React.FC<SectionCardProps> = ({ title, icon, children, className }) => (
    <div className={clsx(
        "rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01]",
        "border border-white/[0.06] backdrop-blur-xl overflow-hidden",
        className
    )}>
        {title && (
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.04]">
                {icon && <span className="text-cyan-400">{icon}</span>}
                <h3 className="text-base font-semibold text-white tracking-wide">{title}</h3>
            </div>
        )}
        <div className="divide-y divide-white/[0.04]">{children}</div>
    </div>
);

// Color palette for accent color picker
const ACCENT_COLORS = [
    '#3B82F6', '#06B6D4', '#10B981', '#8B5CF6', '#EC4899',
    '#F59E0B', '#EF4444', '#6366F1', '#14B8A6', '#F97316',
    '#84CC16', '#A855F7'
];

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const ShieldsSection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            {/* Master Shield Control */}
            <SectionCard>
                <div className="p-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={clsx(
                                "p-3 rounded-xl transition-all",
                                settings.masterShieldEnabled
                                    ? "bg-gradient-to-br from-blue-500/20 to-cyan-500/20 text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.2)]"
                                    : "bg-white/5 text-slate-500"
                            )}>
                                <Shield size={28} />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Master Shield</h3>
                                <p className="text-sm text-slate-400">Global protection toggle</p>
                            </div>
                        </div>
                        <ToggleSwitch
                            enabled={settings.masterShieldEnabled}
                            onChange={settings.setMasterShieldEnabled}
                        />
                    </div>
                </div>
            </SectionCard>

            {/* Protection Options */}
            <SectionCard title="Protection" icon={<Lock size={18} />}>
                <SettingRow icon={<Eye size={18} />} title="Block Trackers & Ads" description="Aggressively block advertising and tracking">
                    <ToggleSwitch size="sm" enabled={settings.adBlockEnabled} onChange={settings.setAdBlockEnabled} />
                </SettingRow>
                <SettingRow icon={<Globe size={18} />} title="Block Cross-site Trackers" description="Prevent third-party tracking">
                    <ToggleSwitch size="sm" enabled={settings.blockCrossSiteTrackers} onChange={settings.setBlockCrossSiteTrackers} />
                </SettingRow>
                <SettingRow icon={<Lock size={18} />} title="Upgrade to HTTPS" description="Auto-upgrade insecure connections">
                    <ToggleSwitch size="sm" enabled={settings.upgradeToHttps} onChange={settings.setUpgradeToHttps} />
                </SettingRow>
                <SettingRow icon={<Eye size={18} />} title="Block Fingerprinting" description="Prevent browser fingerprinting">
                    <ToggleSwitch size="sm" enabled={settings.blockFingerprinting} onChange={settings.setBlockFingerprinting} />
                </SettingRow>
                <SettingRow icon={<Globe size={18} />} title="Block WebRTC" description="Prevent IP address leaks">
                    <ToggleSwitch size="sm" enabled={settings.blockWebRTC} onChange={settings.setBlockWebRTC} />
                </SettingRow>
                <SettingRow icon={<Code size={18} />} title="Block Scripts" description="Disable JavaScript execution">
                    <ToggleSwitch size="sm" enabled={settings.blockScripts} onChange={settings.setBlockScripts} />
                </SettingRow>
            </SectionCard>

            {/* DNS & Cookies */}
            <SectionCard title="Network" icon={<Server size={18} />}>
                <div className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">DNS-over-HTTPS</label>
                        <Select
                            value={settings.dnsOverHttps}
                            options={[
                                { value: 'off', label: 'Off' },
                                { value: 'automatic', label: 'Automatic (Cloudflare)' },
                                { value: 'custom', label: 'Custom Server' }
                            ]}
                            onChange={(v) => settings.setDnsOverHttps(v as 'off' | 'automatic' | 'custom')}
                        />
                    </div>
                    {settings.dnsOverHttps === 'custom' && (
                        <input
                            type="text"
                            value={settings.customDnsServer}
                            onChange={(e) => settings.setCustomDnsServer(e.target.value)}
                            placeholder="https://dns.example.com/dns-query"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                                       focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                        />
                    )}
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Cookie Control</label>
                    <Select
                        value={settings.cookieControl}
                        options={[
                            { value: 'all', label: 'Block All Cookies' },
                            { value: 'third-party', label: 'Block Third-party Only' },
                            { value: 'none', label: 'Allow All Cookies' }
                        ]}
                        onChange={(v) => settings.setCookieControl(v as 'all' | 'third-party' | 'none')}
                    />
                </div>
            </SectionCard>

            {/* Social Blocking */}
            <SectionCard title="Social" icon={<Globe size={18} />}>
                <SettingRow icon={<Globe size={18} />} title="Block Social Trackers" description="Block Facebook, Twitter, and other social widgets">
                    <ToggleSwitch size="sm" enabled={settings.blockSocialTrackers} onChange={settings.setBlockSocialTrackers} />
                </SettingRow>
            </SectionCard>

            {/* Reset */}
            <button
                onClick={() => settings.resetSection('shields')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Shield Settings
            </button>
        </div>
    );
};

const AppearanceSection: React.FC = () => {
    const settings = useSettingsStore();

    const themes = [
        { id: 'dark', name: 'Dark', color: '#1e293b', icon: Moon },
        { id: 'futuristic', name: 'Futuristic', color: '#0f172a', icon: Zap, glow: '#3b82f6' },
        { id: 'midnight', name: 'Midnight', color: '#020617', icon: Moon },
        { id: 'aurora', name: 'Aurora', color: '#0d1117', icon: Sun, glow: '#10b981' },
    ];

    return (
        <div className="space-y-6">
            {/* Theme Selector */}
            <SectionCard title="Theme" icon={<Palette size={18} />}>
                <div className="p-5 grid grid-cols-2 gap-4">
                    {themes.map((theme) => (
                        <button
                            key={theme.id}
                            onClick={() => settings.setTheme(theme.id as typeof settings.theme)}
                            className={clsx(
                                "relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                settings.theme === theme.id
                                    ? "border-cyan-500 bg-cyan-500/10 shadow-[0_0_30px_rgba(6,182,212,0.15)]"
                                    : "border-white/10 hover:border-white/20 hover:bg-white/5"
                            )}
                        >
                            <div
                                className="w-full h-16 rounded-lg flex items-center justify-center relative overflow-hidden"
                                style={{ backgroundColor: theme.color }}
                            >
                                {theme.glow && (
                                    <div className="absolute inset-0 opacity-30"
                                        style={{ background: `radial-gradient(circle at center, ${theme.glow}, transparent)` }} />
                                )}
                                <theme.icon size={24} className={theme.glow ? 'text-white' : 'text-slate-400'} />
                            </div>
                            <span className={clsx(
                                "text-sm font-medium",
                                settings.theme === theme.id ? "text-cyan-400" : "text-slate-300"
                            )}>{theme.name}</span>
                        </button>
                    ))}
                </div>
            </SectionCard>

            {/* Accent Color */}
            <SectionCard title="Accent Color" icon={<Palette size={18} />}>
                <div className="p-5">
                    <div className="flex flex-wrap gap-3">
                        {ACCENT_COLORS.map((color) => (
                            <button
                                key={color}
                                onClick={() => settings.setAccentColor(color)}
                                className={clsx(
                                    "w-10 h-10 rounded-full transition-all",
                                    settings.accentColor === color
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110"
                                        : "hover:scale-110"
                                )}
                                style={{
                                    backgroundColor: color,
                                    boxShadow: settings.accentColor === color ? `0 0 20px ${color}` : undefined
                                }}
                            />
                        ))}
                    </div>
                </div>
            </SectionCard>

            {/* Display Options */}
            <SectionCard title="Display" icon={<Monitor size={18} />}>
                <div className="p-5 space-y-6">
                    <Slider
                        label="Font Scale"
                        value={Math.round(settings.fontScale * 100)}
                        min={80}
                        max={140}
                        step={5}
                        unit="%"
                        onChange={(v) => settings.setFontScale(v / 100)}
                    />
                    <Slider
                        label="Zoom Level"
                        value={settings.zoomLevel}
                        min={50}
                        max={200}
                        step={10}
                        unit="%"
                        onChange={settings.setZoomLevel}
                    />
                </div>
                <SettingRow icon={<Zap size={18} />} title="Enable Animations" description="Smooth UI transitions">
                    <ToggleSwitch size="sm" enabled={settings.enableAnimations} onChange={settings.setEnableAnimations} />
                </SettingRow>
                <SettingRow icon={<Eye size={18} />} title="Reduce Motion" description="For accessibility">
                    <ToggleSwitch size="sm" enabled={settings.reduceMotion} onChange={settings.setReduceMotion} />
                </SettingRow>
                <SettingRow icon={<Minimize2 size={18} />} title="Compact Mode" description="Smaller UI elements">
                    <ToggleSwitch size="sm" enabled={settings.compactMode} onChange={settings.setCompactMode} />
                </SettingRow>
            </SectionCard>

            {/* Layout */}
            <SectionCard title="Layout" icon={<Sidebar size={18} />}>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Sidebar Position</label>
                    <div className="grid grid-cols-2 gap-3">
                        {(['left', 'right'] as const).map((pos) => (
                            <button
                                key={pos}
                                onClick={() => settings.setSidebarPosition(pos)}
                                className={clsx(
                                    "py-3 rounded-xl text-sm font-medium transition-all capitalize",
                                    settings.sidebarPosition === pos
                                        ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/30"
                                        : "bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10"
                                )}
                            >
                                {pos}
                            </button>
                        ))}
                    </div>
                </div>
            </SectionCard>

            <button
                onClick={() => settings.resetSection('appearance')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Appearance Settings
            </button>
        </div>
    );
};

const SearchSection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            <SectionCard title="Search Engine" icon={<Search size={18} />}>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Default Search Engine</label>
                        <Select
                            value={settings.searchEngine}
                            options={settings.customSearchEngines.map((e) => ({ value: e.id, label: e.name }))}
                            onChange={settings.setSearchEngine}
                        />
                    </div>
                </div>
                <SettingRow icon={<Search size={18} />} title="Show Search Suggestions" description="Display autocomplete suggestions">
                    <ToggleSwitch size="sm" enabled={settings.showSearchSuggestions} onChange={settings.setShowSearchSuggestions} />
                </SettingRow>
                <SettingRow icon={<History size={18} />} title="Show Recent Searches" description="Display recent search history">
                    <ToggleSwitch size="sm" enabled={settings.showRecentSearches} onChange={settings.setShowRecentSearches} />
                </SettingRow>
                <SettingRow icon={<Lock size={18} />} title="Private Search Mode" description="Don't save search history">
                    <ToggleSwitch size="sm" enabled={settings.privateSearchMode} onChange={settings.setPrivateSearchMode} />
                </SettingRow>
            </SectionCard>

            <button
                onClick={() => settings.resetSection('search')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Search Settings
            </button>
        </div>
    );
};

const TabsSection: React.FC = () => {
    const { tabLayout, setTabLayout } = useJessicaStore();
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            {/* Layout Selector */}
            <SectionCard title="Tab Layout" icon={<LayoutTemplate size={18} />}>
                <div className="p-5 grid grid-cols-2 gap-4">
                    <button
                        onClick={() => setTabLayout('horizontal')}
                        className={clsx(
                            "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all text-left",
                            tabLayout === 'horizontal'
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="w-full h-20 bg-slate-900 rounded-lg flex flex-col overflow-hidden">
                            <div className="h-5 bg-slate-800 flex items-center px-2 gap-1">
                                <div className="w-12 h-3 bg-cyan-500/30 rounded-t" />
                                <div className="w-12 h-3 bg-slate-700/50 rounded-t" />
                            </div>
                            <div className="flex-1 bg-slate-900/50" />
                        </div>
                        <span className={clsx("text-sm font-medium", tabLayout === 'horizontal' ? "text-cyan-400" : "text-slate-300")}>
                            Horizontal
                        </span>
                    </button>
                    <button
                        onClick={() => setTabLayout('vertical')}
                        className={clsx(
                            "flex flex-col gap-3 p-4 rounded-xl border-2 transition-all text-left",
                            tabLayout === 'vertical'
                                ? "border-cyan-500 bg-cyan-500/10"
                                : "border-white/10 hover:border-white/20"
                        )}
                    >
                        <div className="w-full h-20 bg-slate-900 rounded-lg flex overflow-hidden">
                            <div className="w-12 bg-slate-800 flex flex-col gap-1 p-1">
                                <div className="w-full h-4 bg-cyan-500/30 rounded" />
                                <div className="w-full h-4 bg-slate-700/50 rounded" />
                            </div>
                            <div className="flex-1 bg-slate-900/50" />
                        </div>
                        <span className={clsx("text-sm font-medium", tabLayout === 'vertical' ? "text-cyan-400" : "text-slate-300")}>
                            Vertical
                        </span>
                    </button>
                </div>
            </SectionCard>

            {/* Tab Behavior */}
            <SectionCard title="Behavior" icon={<Play size={18} />}>
                <SettingRow icon={<Eye size={18} />} title="Tab Hover Preview" description="Show page preview on hover">
                    <ToggleSwitch size="sm" enabled={settings.tabHoverPreview} onChange={settings.setTabHoverPreview} />
                </SettingRow>
                <SettingRow icon={<Moon size={18} />} title="Sleeping Tabs" description="Suspend inactive tabs to save memory">
                    <ToggleSwitch size="sm" enabled={settings.enableSleepingTabs} onChange={settings.setEnableSleepingTabs} />
                </SettingRow>
                {settings.enableSleepingTabs && (
                    <div className="p-4">
                        <Slider
                            label="Sleep after inactivity"
                            value={settings.sleepingTabsTimeout}
                            min={5}
                            max={60}
                            step={5}
                            unit=" min"
                            onChange={settings.setSleepingTabsTimeout}
                        />
                    </div>
                )}
            </SectionCard>

            {/* More Options */}
            <SectionCard title="Options" icon={<Gauge size={18} />}>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">New Tab Position</label>
                    <Select
                        value={settings.newTabPosition}
                        options={[
                            { value: 'end', label: 'At the end' },
                            { value: 'afterCurrent', label: 'After current tab' }
                        ]}
                        onChange={(v) => settings.setNewTabPosition(v as 'end' | 'afterCurrent')}
                    />
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Show Close Button</label>
                    <Select
                        value={settings.showTabCloseButton}
                        options={[
                            { value: 'always', label: 'Always' },
                            { value: 'hover', label: 'On hover' },
                            { value: 'never', label: 'Never' }
                        ]}
                        onChange={(v) => settings.setShowTabCloseButton(v as 'always' | 'hover' | 'never')}
                    />
                </div>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Pinned Tabs Style</label>
                    <Select
                        value={settings.pinnedTabsBehavior}
                        options={[
                            { value: 'compact', label: 'Compact (icon only)' },
                            { value: 'normal', label: 'Normal (with title)' }
                        ]}
                        onChange={(v) => settings.setPinnedTabsBehavior(v as 'compact' | 'normal')}
                    />
                </div>
            </SectionCard>

            <button
                onClick={() => settings.resetSection('tabs')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Tab Settings
            </button>
        </div>
    );
};

const SystemSection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            <SectionCard title="Startup" icon={<Play size={18} />}>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">On Startup</label>
                    <Select
                        value={settings.startupBehavior}
                        options={[
                            { value: 'newTab', label: 'Open new tab' },
                            { value: 'continue', label: 'Continue where you left off' },
                            { value: 'custom', label: 'Open specific pages' }
                        ]}
                        onChange={(v) => settings.setStartupBehavior(v as 'newTab' | 'continue' | 'custom')}
                    />
                </div>
            </SectionCard>

            <SectionCard title="Downloads" icon={<Download size={18} />}>
                <div className="p-4">
                    <label className="block text-sm font-medium text-slate-300 mb-2">Downloads Location</label>
                    <input
                        type="text"
                        value={settings.downloadsPath}
                        onChange={(e) => settings.setDownloadsPath(e.target.value)}
                        placeholder="Default downloads folder"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                                   focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                    />
                </div>
                <SettingRow icon={<Download size={18} />} title="Ask Before Download" description="Prompt for location each time">
                    <ToggleSwitch size="sm" enabled={settings.askBeforeDownload} onChange={settings.setAskBeforeDownload} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Performance" icon={<Gauge size={18} />}>
                <SettingRow icon={<Zap size={18} />} title="Hardware Acceleration" description="Use GPU for better performance">
                    <ToggleSwitch size="sm" enabled={settings.hardwareAcceleration} onChange={settings.setHardwareAcceleration} />
                </SettingRow>
                <SettingRow icon={<Play size={18} />} title="Smooth Scrolling" description="Animated scroll behavior">
                    <ToggleSwitch size="sm" enabled={settings.smoothScrolling} onChange={settings.setSmoothScrolling} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Proxy" icon={<Server size={18} />}>
                <SettingRow icon={<Server size={18} />} title="Enable Proxy" description="Route traffic through proxy server">
                    <ToggleSwitch size="sm" enabled={settings.proxyEnabled} onChange={settings.setProxyEnabled} />
                </SettingRow>
                {settings.proxyEnabled && (
                    <div className="p-4">
                        <input
                            type="text"
                            value={settings.proxyServer}
                            onChange={(e) => settings.setProxyServer(e.target.value)}
                            placeholder="proxy.example.com:8080"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                                       focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                        />
                    </div>
                )}
            </SectionCard>

            <button
                onClick={() => settings.resetSection('system')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset System Settings
            </button>
        </div>
    );
};

const PrivacySection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            <SectionCard title="Privacy" icon={<Lock size={18} />}>
                <SettingRow icon={<Trash2 size={18} />} title="Clear Data on Exit" description="Automatically clear browsing data when closing">
                    <ToggleSwitch size="sm" enabled={settings.clearBrowsingDataOnExit} onChange={settings.setClearBrowsingDataOnExit} />
                </SettingRow>
                <SettingRow icon={<History size={18} />} title="Save History" description="Keep record of visited pages">
                    <ToggleSwitch size="sm" enabled={settings.historyEnabled} onChange={settings.setHistoryEnabled} />
                </SettingRow>
                <SettingRow icon={<FileText size={18} />} title="Save Form Data" description="Remember form inputs">
                    <ToggleSwitch size="sm" enabled={settings.saveFormData} onChange={settings.setSaveFormData} />
                </SettingRow>
                <SettingRow icon={<Send size={18} />} title="Do Not Track" description="Send DNT header to websites">
                    <ToggleSwitch size="sm" enabled={settings.doNotTrack} onChange={settings.setDoNotTrack} />
                </SettingRow>
            </SectionCard>

            <SectionCard>
                <SettingRow
                    icon={<Trash2 size={18} />}
                    title="Clear Browsing Data"
                    description="Clear history, cookies, cache, and more"
                    danger
                >
                    <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium 
                                       hover:bg-red-500/30 transition-all border border-red-500/30">
                        Clear Data
                    </button>
                </SettingRow>
            </SectionCard>

            <button
                onClick={() => settings.resetSection('privacy')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Privacy Settings
            </button>
        </div>
    );
};

const DeveloperSection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            <SectionCard title="Developer Tools" icon={<Code size={18} />}>
                <SettingRow icon={<Code size={18} />} title="Enable DevTools" description="Allow opening developer tools (F12)">
                    <ToggleSwitch size="sm" enabled={settings.devToolsEnabled} onChange={settings.setDevToolsEnabled} />
                </SettingRow>
                <SettingRow icon={<Bug size={18} />} title="Show Debug Info" description="Display debug overlay">
                    <ToggleSwitch size="sm" enabled={settings.showDebugInfo} onChange={settings.setShowDebugInfo} />
                </SettingRow>
            </SectionCard>

            <SectionCard title="Experimental" icon={<FlaskConical size={18} />}>
                <SettingRow icon={<FlaskConical size={18} />} title="Experimental Features" description="Enable beta features (may be unstable)">
                    <ToggleSwitch size="sm" enabled={settings.experimentalFeatures} onChange={settings.setExperimentalFeatures} />
                </SettingRow>
                <SettingRow
                    icon={<Code size={18} />}
                    title="Allow Unsafe Scripts"
                    description="Disable Content Security Policy"
                    danger
                >
                    <ToggleSwitch size="sm" enabled={settings.allowUnsafeScripts} onChange={settings.setAllowUnsafeScripts} />
                </SettingRow>
            </SectionCard>

            <button
                onClick={() => settings.resetSection('developer')}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm text-slate-400 
                           hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
                <RotateCcw size={16} />
                Reset Developer Settings
            </button>
        </div>
    );
};

const KeyboardSection: React.FC = () => {
    const { numPadShortcuts, setNumPadShortcut } = useJessicaStore();

    return (
        <div className="space-y-6">
            <SectionCard title="Num Pad Shortcuts" icon={<Keyboard size={18} />}>
                <div className="p-5">
                    <p className="text-sm text-slate-400 mb-6">
                        Assign URLs to number keys (0-9). Pressing the number key will navigate to the URL.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg 
                                                text-cyan-400 font-bold border border-white/10">
                                    {i}
                                </div>
                                <input
                                    type="text"
                                    value={numPadShortcuts[String(i)] || ''}
                                    onChange={(e) => setNumPadShortcut(String(i), e.target.value)}
                                    placeholder="https://example.com"
                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm
                                               focus:outline-none focus:border-cyan-500/50 placeholder:text-slate-600"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

const JessicaSection: React.FC = () => {
    const {
        ollamaHost, setOllamaHost,
        selectedModel, setSelectedModel,
        availableModels, fetchModels,
    } = useJessicaStore();
    const [isFetching, setIsFetching] = React.useState(false);

    const handleFetchModels = async () => {
        setIsFetching(true);
        await fetchModels();
        setIsFetching(false);
    };

    return (
        <div className="space-y-6">
            <SectionCard title="Ollama Configuration" icon={<Sparkles size={18} />}>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Host URL</label>
                        <input
                            type="text"
                            value={ollamaHost}
                            onChange={(e) => setOllamaHost(e.target.value)}
                            placeholder="http://localhost:11434"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                                       focus:outline-none focus:border-purple-500/50 placeholder:text-slate-600"
                        />
                    </div>
                    <div className="flex items-end gap-3">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-slate-300 mb-2">Selected Model</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm
                                           focus:outline-none focus:border-purple-500/50 appearance-none"
                            >
                                <option value="" disabled className="bg-slate-900">Select a model</option>
                                {availableModels.length > 0 ? (
                                    availableModels.map((m) => (
                                        <option key={m.name} value={m.name} className="bg-slate-900">{m.name}</option>
                                    ))
                                ) : (
                                    <option value={selectedModel} className="bg-slate-900">{selectedModel} (Not verified)</option>
                                )}
                            </select>
                        </div>
                        <button
                            onClick={handleFetchModels}
                            disabled={isFetching}
                            className="px-4 py-3 bg-purple-600/20 border border-purple-500/30 hover:bg-purple-600/30 
                                       text-purple-400 rounded-xl font-medium transition-all flex items-center gap-2 
                                       disabled:opacity-50 text-sm"
                        >
                            <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
                            Fetch
                        </button>
                    </div>
                </div>
            </SectionCard>
        </div>
    );
};

const AboutSection: React.FC = () => {
    const settings = useSettingsStore();

    return (
        <div className="space-y-6">
            <SectionCard>
                <div className="p-8 text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl 
                                    bg-gradient-to-br from-cyan-500/20 to-blue-500/20 mb-6
                                    shadow-[0_0_60px_rgba(6,182,212,0.3)]">
                        <span className="text-4xl">🪐</span>
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Saturn Browser</h2>
                    <p className="text-slate-400 mb-6">Version 1.0.0</p>
                    <div className="flex justify-center gap-3">
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400">Electron 28.0</span>
                        <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-slate-400">Chromium 120</span>
                    </div>
                </div>
            </SectionCard>

            <SectionCard>
                <SettingRow
                    icon={<RotateCcw size={18} />}
                    title="Reset All Settings"
                    description="Restore all settings to their default values"
                    danger
                >
                    <button
                        onClick={settings.resetAll}
                        className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium 
                                   hover:bg-red-500/30 transition-all border border-red-500/30"
                    >
                        Reset All
                    </button>
                </SettingRow>
            </SectionCard>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN SETTINGS MODAL
// ═══════════════════════════════════════════════════════════════════════════════

export const SettingsModal: React.FC = () => {
    const { isSettingsOpen, toggleSettings } = useTabStore();
    const [activeSection, setActiveSection] = React.useState('shields');

    if (!isSettingsOpen) return null;

    const navItems = [
        { id: 'shields', icon: Shield, label: 'Shields', description: 'Privacy protection' },
        { id: 'appearance', icon: Palette, label: 'Appearance', description: 'Theme & display' },
        { id: 'search', icon: Search, label: 'Search', description: 'Search engine' },
        { id: 'tabs', icon: LayoutTemplate, label: 'Tabs', description: 'Tab behavior' },
        { id: 'system', icon: Monitor, label: 'System', description: 'Performance' },
        { id: 'privacy', icon: Lock, label: 'Privacy', description: 'Data & history' },
        { id: 'developer', icon: Code, label: 'Developer', description: 'DevTools' },
        { id: 'keyboard', icon: Keyboard, label: 'Shortcuts', description: 'Key bindings' },
        { id: 'jessica', icon: Sparkles, label: 'Jessica AI', description: 'AI assistant' },
        { id: 'about', icon: Info, label: 'About', description: 'Version info' },
    ];

    const sections: Record<string, React.ReactNode> = {
        shields: <ShieldsSection />,
        appearance: <AppearanceSection />,
        search: <SearchSection />,
        tabs: <TabsSection />,
        system: <SystemSection />,
        privacy: <PrivacySection />,
        developer: <DeveloperSection />,
        keyboard: <KeyboardSection />,
        jessica: <JessicaSection />,
        about: <AboutSection />,
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={toggleSettings}
                    className="absolute inset-0 bg-black/90 backdrop-blur-2xl"
                />

                {/* Modal Window */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-[1000px] h-[700px] max-w-[95vw] max-h-[90vh] 
                               bg-gradient-to-br from-slate-900/95 via-slate-900/98 to-black 
                               rounded-3xl flex overflow-hidden 
                               shadow-[0_0_100px_rgba(0,0,0,0.8),0_0_40px_rgba(6,182,212,0.1)]
                               ring-1 ring-white/10 backdrop-blur-xl"
                >
                    {/* Sidebar */}
                    <div className="w-72 bg-black/40 border-r border-white/[0.06] p-6 flex flex-col">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-white tracking-tight 
                                           bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                                Settings
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">Configure Saturn Browser</p>
                        </div>

                        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 -mr-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveSection(item.id)}
                                    className={clsx(
                                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200",
                                        activeSection === item.id
                                            ? "bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.15)]"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <div className={clsx(
                                        "p-2 rounded-lg transition-colors",
                                        activeSection === item.id ? "bg-cyan-500/20" : "bg-white/5"
                                    )}>
                                        <item.icon size={18} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="block text-sm font-medium truncate">{item.label}</span>
                                        <span className="block text-xs text-slate-500 truncate">{item.description}</span>
                                    </div>
                                    {activeSection === item.id && (
                                        <ChevronRight size={16} className="text-cyan-500/50" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Content Area */}
                    <div className="flex-1 flex flex-col bg-black/20">
                        {/* Header */}
                        <div className="flex justify-between items-center px-8 py-6 border-b border-white/[0.04]">
                            <div>
                                <h1 className="text-xl font-semibold text-white capitalize tracking-tight">
                                    {navItems.find(i => i.id === activeSection)?.label}
                                </h1>
                                <p className="text-sm text-slate-500">
                                    {navItems.find(i => i.id === activeSection)?.description}
                                </p>
                            </div>
                            <button
                                onClick={toggleSettings}
                                className="p-2.5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeSection}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    {sections[activeSection]}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};
