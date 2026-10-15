import React, { useState, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Square,
  ShieldAlert,
  ShieldCheck,
  Radio,
  PanelLeft,
} from 'lucide-react';
import { AssistantState } from '../../types';

interface HeaderProps {
  assistantState: AssistantState;
  isMuted: boolean;
  onToggleMute: () => void;
  volume: number;
  onChangeVolume: (vol: number) => void;
  onInterrupt: () => void;
  companionConnected: boolean;
  onOpenCompanionModal: () => void;
  wakeWordEnabled: boolean;
  onToggleWakeWord: () => void;
  isSidebarVisible: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  assistantState,
  isMuted,
  onToggleMute,
  volume,
  onChangeVolume,
  onInterrupt,
  companionConnected,
  onOpenCompanionModal,
  wakeWordEnabled,
  onToggleWakeWord,
  isSidebarVisible,
  onToggleSidebar,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const isSpeaking = assistantState === 'speaking';

  return (
    <header className="h-16 bg-[#080a0e]/95 border-b border-amber-500/15 px-6 flex items-center justify-between z-10 select-none">
      {/* Left: Menu toggle when sidebar hidden, and Wake Word indicator */}
      <div className="flex items-center space-x-4">
        {!isSidebarVisible && (
          <button
            onClick={onToggleSidebar}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 font-tech text-xs tracking-wider transition-all"
            title="Open Menu Bar"
          >
            <PanelLeft className="w-4 h-4 text-amber-400" />
            <span>MENU</span>
          </button>
        )}

        {/* Wake Word indicator */}
        <div
          onClick={onToggleWakeWord}
          className={`cursor-pointer flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-mono-code transition-all border ${
            wakeWordEnabled
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-black/40 border-stone-800 text-stone-500'
          }`}
          title="Click to toggle hands-free 'Hey Shelby' wake-word detection"
        >
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span>WAKE: &quot;Hey Shelby&quot;</span>
          <span className="text-[9px] uppercase font-bold text-amber-400">
            [{wakeWordEnabled ? 'ON' : 'OFF'}]
          </span>
        </div>
      </div>

      {/* Right: Audio controls, Interruption, Companion status, Time */}
      <div className="flex items-center space-x-4">
        {/* Interrupt button (Stop & Switch policy) */}
        {isSpeaking && (
          <button
            onClick={onInterrupt}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 text-xs font-mono-code transition-all animate-pulse"
            title="Stop speaking immediately and switch to new command"
          >
            <Square className="w-3 h-3 fill-rose-400" />
            <span className="font-bold">STOP SPEECH</span>
          </button>
        )}

        {/* Spoken Response Volume Slider */}
        <div className="hidden lg:flex items-center space-x-2 bg-black/40 px-3 py-1 rounded border border-amber-500/20">
          {volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5 text-amber-500/50" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
          )}
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onChangeVolume(parseFloat(e.target.value))}
            className="w-16 h-1 accent-amber-400 cursor-pointer"
            title={`Assistant Spoken Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-[10px] font-mono-code text-amber-400 w-7 text-right">
            {Math.round(volume * 100)}%
          </span>
        </div>

        {/* Microphone Mute / Unmute Button */}
        <button
          onClick={onToggleMute}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-mono-code transition-all border ${
            isMuted
              ? 'bg-rose-950/40 border-rose-500/40 text-rose-300 hover:bg-rose-900/50'
              : 'bg-amber-500/10 border-amber-500/40 text-amber-300 hover:bg-amber-500/20'
          }`}
          title={isMuted ? 'Microphone is Muted (Click to Unmute)' : 'Microphone is Active'}
        >
          {isMuted ? (
            <>
              <MicOff className="w-3.5 h-3.5 text-rose-400" />
              <span>MUTED</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 text-amber-400" />
              <span>MIC LIVE</span>
            </>
          )}
        </button>

        {/* Companion Bridge Status */}
        <button
          onClick={onOpenCompanionModal}
          className={`hidden sm:flex items-center space-x-1 px-2.5 py-1.5 rounded text-xs font-mono-code border transition-all ${
            companionConnected
              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
              : 'bg-black/40 border-amber-500/20 text-amber-400/80 hover:border-amber-500/40'
          }`}
        >
          {companionConnected ? (
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500/60" />
          )}
          <span className="text-[11px]">WIN BRIDGE: {companionConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
        </button>

        {/* Digital Clock */}
        <div className="font-mono-code text-xs text-amber-300/80 px-2 py-1 bg-black/60 rounded border border-amber-500/20">
          {timeStr || '00:00:00 AM'}
        </div>
      </div>
    </header>
  );
};
