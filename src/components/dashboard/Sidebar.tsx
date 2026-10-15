import React from 'react';
import {
  Home,
  Calendar,
  CheckSquare,
  FolderLock,
  Globe,
  Settings,
  Disc,
  Radio,
  ExternalLink,
  PanelLeftClose,
} from 'lucide-react';
import { LanguageMode } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  language: LanguageMode;
  onChangeLanguage: (lang: LanguageMode) => void;
  companionConnected: boolean;
  onOpenCompanionModal: () => void;
  onOpenOrbMode: () => void;
  onHideSidebar: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  language,
  onChangeLanguage,
  companionConnected,
  onOpenCompanionModal,
  onOpenOrbMode,
  onHideSidebar,
}) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, badge: null },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 'Briefing' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, badge: null },
    { id: 'files', label: 'Files', icon: FolderLock, badge: 'Workspace' },
    { id: 'browser', label: 'Browser', icon: Globe, badge: 'Research' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  return (
    <aside className="w-64 bg-[#080a0e] border-r border-amber-500/15 flex flex-col justify-between p-4 z-20 select-none transition-all duration-300">
      {/* Brand Header */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-amber-500/15">
          <div className="flex items-center space-x-3">
            <div className="relative w-9 h-9 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center glow-amber-box">
              <Disc className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
              <div className="absolute w-1.5 h-1.5 rounded-full bg-amber-400 top-1.5 right-1.5 shadow-[0_0_6px_#f59e0b]" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold tracking-widest text-amber-400 glow-amber-text leading-tight">
                SHELBY
              </h1>
              <p className="font-mono-code text-[10px] text-amber-500/70 tracking-wider">
                AI PERSONAL ASSISTANT
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5">
            <button
              onClick={onOpenOrbMode}
              title="Switch to Compact Floating Orb Mode"
              className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all text-xs font-mono-code flex items-center space-x-1"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="text-[10px]">ORB</span>
            </button>
            <button
              onClick={onHideSidebar}
              title="Hide Menu Bar"
              className="p-1.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-all hover:border-amber-500/40"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="mt-6 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg font-tech text-sm tracking-wide transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.15)] font-semibold'
                    : 'text-amber-100/60 hover:text-amber-300 hover:bg-amber-500/5 border border-transparent'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-500/60'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400/80 border border-amber-500/20">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer controls & Companion status */}
      <div className="pt-4 border-t border-amber-500/15 space-y-3">
        {/* Language Quick Selector */}
        <div className="space-y-1">
          <label className="text-[10px] font-mono-code text-amber-500/70 tracking-wider uppercase block">
            Language Mode
          </label>
          <div className="grid grid-cols-3 gap-1 bg-black/50 p-1 rounded-md border border-amber-500/20">
            {(['English', 'Hindi', 'Hinglish'] as LanguageMode[]).map((lang) => (
              <button
                key={lang}
                onClick={() => onChangeLanguage(lang)}
                className={`py-1 text-[10px] font-mono-code rounded transition-all ${
                  language === lang
                    ? 'bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-amber-100/50 hover:text-amber-200'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Companion Status Pill */}
        <div
          onClick={onOpenCompanionModal}
          className="p-2.5 rounded-lg bg-black/60 border border-amber-500/20 hover:border-amber-500/40 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  companionConnected ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]' : 'bg-rose-500/80'
                }`}
              />
              <span className="text-[11px] font-mono-code text-amber-200">
                {companionConnected ? 'Companion Active' : 'Companion Bridge'}
              </span>
            </div>
            <ExternalLink className="w-3 h-3 text-amber-500/50 group-hover:text-amber-300 transition-colors" />
          </div>
          <p className="text-[10px] text-amber-500/60 font-mono-code mt-1">
            {companionConnected ? 'Port 41829 Synced' : 'Offline (Click to Inspect)'}
          </p>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-code text-amber-500/50 pt-1">
          <span>AI STUDIO STAGE 1</span>
          <span>GEMINI 3.8</span>
        </div>
      </div>
    </aside>
  );
};
