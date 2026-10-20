import { X, Mic, MicOff, Maximize2, Radio, ScanFace } from 'lucide-react';
import { AssistantState } from '../../types';
import { Shelby3DCore } from '../three/Shelby3DCore';
import { HoloAvatar } from '../three/HoloAvatar';

interface FloatingOrbModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AssistantState;
  audioLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  lastTranscript?: string;
  reducedMotion: boolean;
  coreVisualMode?: 'orbit' | 'face';
  onToggleCoreMode?: () => void;
}

export const FloatingOrbModal: React.FC<FloatingOrbModalProps> = ({
  isOpen,
  onClose,
  state,
  audioLevel,
  isMuted,
  onToggleMute,
  lastTranscript,
  reducedMotion,
  coreVisualMode = 'orbit',
  onToggleCoreMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 select-none animate-in fade-in zoom-in-95 duration-200">
      <div className="w-80 h-96 bg-[#080a0e]/95 border border-amber-500/40 rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col justify-between p-3 relative overflow-hidden backdrop-blur-none">
        {/* Top Header */}
        <div className="flex items-center justify-between z-10 px-1">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span className="font-heading text-xs font-bold text-amber-300 tracking-wider">
              SHELBY ORB // COMPACT
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {onToggleCoreMode && (
              <button
                onClick={onToggleCoreMode}
                className={`p-1 rounded transition-colors ${
                  coreVisualMode === 'face'
                    ? 'text-amber-300 bg-amber-500/20'
                    : 'text-amber-500/60 hover:text-amber-300'
                }`}
                title={coreVisualMode === 'face' ? 'Switch to Orbit Core' : 'Morph to Holographic Face'}
              >
                <ScanFace className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded text-amber-500/60 hover:text-amber-300 transition-colors"
              title="Expand to Full Dashboard"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-amber-500/60 hover:text-amber-300 transition-colors"
              title="Close Floating Orb"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mini 3D Core or Holo Face */}
        <div className="flex-1 w-full relative flex items-center justify-center overflow-hidden">
          {coreVisualMode === 'face' ? (
            <HoloAvatar
              primaryColor="#f59e0b"
              accentColor="#fef08a"
              backgroundColor="transparent"
              state={state}
              isSpeaking={state === 'speaking'}
              isMuted={isMuted}
              audioLevel={audioLevel}
              className="w-full h-full min-h-[220px]"
              onClick={onToggleMute}
            />
          ) : (
            <Shelby3DCore
              state={state}
              audioLevel={audioLevel}
              reducedMotion={reducedMotion}
              compactMode={true}
              onCoreClick={onToggleMute}
            />
          )}
        </div>

        {/* Floating Mini Transcript / Response */}
        <div className="z-10 bg-black/80 border border-amber-500/20 rounded-lg p-2.5 text-xs font-tech text-amber-200/90 max-h-20 overflow-y-auto">
          <p className="line-clamp-2">
            {lastTranscript || 'Hands-free active. Say "Hey Shelby" anytime.'}
          </p>
        </div>

        {/* Footer Voice Action Bar */}
        <div className="z-10 flex items-center justify-between pt-2 border-t border-amber-500/15">
          <div className="flex items-center space-x-2">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Microphone Muted (Click to Unmute)' : 'Microphone Live (Click to Mute for Privacy)'}
              className={`px-2 py-1 rounded border text-[10px] font-mono-code flex items-center space-x-1 transition-all ${
                isMuted
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
              }`}
            >
              {isMuted ? <MicOff className="w-3 h-3 text-rose-400" /> : <Radio className="w-3 h-3 text-amber-400 animate-pulse" />}
              <span>{isMuted ? 'MUTED' : 'HANDS-FREE'}</span>
            </button>
            <span className="text-[10px] font-mono-code text-amber-400 uppercase">
              {state}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-amber-400 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.max(3, Math.min(16, audioLevel * 20 + (i % 3) * 3))}px`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
