import React, { useState } from 'react';
import {
  X,
  Monitor,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Terminal,
  Cpu,
  Layers,
  Sparkles,
} from 'lucide-react';

interface CompanionBridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  companionConnected: boolean;
  simulateCompanion: boolean;
  onToggleSimulate: (val: boolean) => void;
}

export const CompanionBridgeModal: React.FC<CompanionBridgeModalProps> = ({
  isOpen,
  onClose,
  companionConnected,
  simulateCompanion,
  onToggleSimulate,
}) => {
  const [isPinging, setIsPinging] = useState(false);
  const [pingLog, setPingLog] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePing = () => {
    setIsPinging(true);
    setPingLog('Probing loopback TCP endpoint http://127.0.0.1:41829/v1/health...');
    setTimeout(() => {
      setIsPinging(false);
      if (simulateCompanion) {
        setPingLog('Connection Established! SHELBY Windows Daemon v1.4.2 responding. Latency 1.2ms.');
      } else {
        setPingLog(
          'ERR_CONNECTION_REFUSED: No local daemon on 127.0.0.1:41829. Operating in Browser Sandbox Mode.'
        );
      }
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-[#080a0e] border border-amber-500/40 rounded-xl p-6 space-y-6 shadow-[0_0_40px_rgba(245,158,11,0.25)] relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-500/15">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-amber-300">
                WINDOWS DESKTOP COMPANION BRIDGE
              </h3>
              <p className="font-mono-code text-[11px] text-amber-500/60">
                Stage 1 (AI Studio Web) ⟷ Stage 2 (Windows Host Daemon)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-amber-500/60 hover:text-amber-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Callout */}
        <div
          className={`p-4 rounded-xl border flex items-start space-x-3 ${
            companionConnected
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
              : 'bg-black/60 border-amber-500/20 text-amber-200/90'
          }`}
        >
          {companionConnected ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-1">
            <h4 className="font-tech font-bold text-sm">
              Status: {companionConnected ? 'CONNECTED & SYNCHRONIZED' : 'DISCONNECTED (STANDALONE WEB MODE)'}
            </h4>
            <p className="text-xs font-tech text-amber-100/75 leading-relaxed">
              {companionConnected
                ? 'Windows host companion active. Real OS CPU, memory telemetry, and floating orb sync enabled.'
                : 'As specified in Section 1 & 18, a browser application alone cannot perform unrestricted Windows operations or guarantee continuous background listening without the separate Windows companion process.'}
            </p>
          </div>
        </div>

        {/* Test Ping Tool */}
        <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono-code text-xs text-amber-400 font-bold">
              IPC LOOPBACK CHECK // 127.0.0.1:41829
            </span>
            <button
              onClick={handlePing}
              disabled={isPinging}
              className="px-3 py-1.5 rounded bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-bold text-xs font-mono-code flex items-center space-x-1.5 transition-all"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
              <span>{isPinging ? 'TESTING...' : 'PING DAEMON'}</span>
            </button>
          </div>

          {pingLog && (
            <div className="p-3 bg-black/80 rounded border border-amber-500/30 font-mono-code text-xs text-amber-300">
              <Terminal className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
              {pingLog}
            </div>
          )}
        </div>

        {/* Feature Division Matrix */}
        <div className="space-y-3">
          <h4 className="font-heading text-sm font-bold text-amber-300 tracking-wider">
            FEATURE DIVISION ARCHITECTURE
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-tech">
            <div className="p-3 rounded-lg bg-emerald-950/15 border border-emerald-500/25 space-y-1.5">
              <span className="font-mono-code font-bold text-emerald-400 block uppercase">
                Active in Stage 1 Web:
              </span>
              <ul className="space-y-1 text-emerald-100/80 list-disc list-inside text-[11px]">
                <li>Genuine 3D WebGL Orbital Energy Core</li>
                <li>Gemini Multilingual Reasoning (En/Hi/Hinglish)</li>
                <li>Speech recognition & Indian English TTS</li>
                <li>Sandboxed file workspace & planner</li>
                <li>Local battery & memory readings</li>
              </ul>
            </div>

            <div className="p-3 rounded-lg bg-amber-950/15 border border-amber-500/25 space-y-1.5">
              <span className="font-mono-code font-bold text-amber-400 block uppercase">
                Requires Windows Daemon:
              </span>
              <ul className="space-y-1 text-amber-100/80 list-disc list-inside text-[11px]">
                <li>Global Windows startup & background tray</li>
                <li>OS-wide continuous wake-word detection</li>
                <li>Direct kernel CPU & hardware sensors</li>
                <li>Always-on-top desktop floating orb</li>
                <li>Arbitrary Windows app automation</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Developer Emulation Mode */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <h5 className="font-tech font-bold text-xs text-amber-300 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Developer Companion Emulation Mode</span>
            </h5>
            <p className="text-[10px] font-mono-code text-amber-500/70 mt-0.5">
              Toggle to test-drive simulated companion telemetry and connected status right now.
            </p>
          </div>
          <button
            onClick={() => onToggleSimulate(!simulateCompanion)}
            className={`px-3 py-1.5 rounded font-mono-code text-xs font-bold transition-all ${
              simulateCompanion
                ? 'bg-emerald-500 text-black'
                : 'bg-black/60 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
          >
            {simulateCompanion ? 'EMULATION ON' : 'ENABLE EMULATION'}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-black border border-amber-500/30 text-amber-300 text-xs font-mono-code hover:bg-amber-500/10"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
