import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  ShieldAlert,
  Radio,
  Volume2,
  Mic,
  MicOff,
  AlertTriangle,
  CheckCircle,
  Activity,
  Edit2,
  X,
  Check,
  RotateCcw,
  Sliders,
  Cpu,
  ScanFace,
} from 'lucide-react';
import {
  AssistantState,
  ChatMessage,
  SystemHealth,
  TaskPlan,
  SmartNotification,
  LanguageMode,
  VoiceMetrics,
} from '../../types';
import { Shelby3DCore } from '../three/Shelby3DCore';
import { HoloAvatar } from '../three/HoloAvatar';

interface HomeViewProps {
  state: AssistantState;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  audioLevel: number;
  systemHealth: SystemHealth;
  activeTask: TaskPlan | null;
  onOpenTask: (task: TaskPlan) => void;
  notifications: SmartNotification[];
  reducedMotion: boolean;
  language: LanguageMode;
  onDeliverBriefing: () => void;
  onTriggerTaskPlanner: (goal: string) => void;
  liveTranscript?: string;
  liveTranscriptData?: { text: string; isFinal: boolean; confidence: number };
  onSendLiveTranscript?: (text: string) => void;
  onClearLiveTranscript?: () => void;
  voiceMetrics?: VoiceMetrics;
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  onRequestPermission: () => void;
  onInterruptSpeech: () => void;
  onTriggerWake: () => void;
  onStartDirectListening?: () => void;
  coreVisualMode?: 'orbit' | 'face';
  onToggleCoreMode?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  state,
  messages,
  onSendMessage,
  isMuted,
  onToggleMute,
  audioLevel,
  activeTask,
  onOpenTask,
  reducedMotion,
  language,
  onDeliverBriefing,
  onTriggerTaskPlanner,
  liveTranscript = '',
  liveTranscriptData,
  onSendLiveTranscript,
  onClearLiveTranscript,
  voiceMetrics,
  permissionState,
  onRequestPermission,
  onInterruptSpeech,
  onTriggerWake,
  onStartDirectListening,
  coreVisualMode = 'orbit',
  onToggleCoreMode,
}) => {
  const [inputText, setInputText] = useState('');
  const [editingTranscript, setEditingTranscript] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickPrompts = [
    { label: 'Morning Briefing', action: onDeliverBriefing },
    {
      label: 'Hindi / Hinglish Mode',
      action: () =>
        onSendMessage('नमस्ते शेल्बी, Hinglish में बात करते हैं। आज के क्या अपडेट्स हैं?'),
    },
    {
      label: 'Task: Audit Workspace Security',
      action: () => onTriggerTaskPlanner('Perform security audit and integrity check on SHELBY workspace'),
    },
    {
      label: 'Research: Local AI Fallback Architecture',
      action: () => onSendMessage('Research local AI fallback architectures for offline desktop operation'),
    },
  ];

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col xl:flex-row bg-[#050608] relative">
      {/* CENTER: 3D Animated Core, Reticle, and Hands-Free Voice Display */}
      <div className="flex-1 flex flex-col items-center justify-between relative overflow-hidden p-4">
        {/* Prominent Hands-Free Voice Status Banner & Controls */}
        <div className="w-full max-w-xl z-20 px-2 mt-2">
          {permissionState === 'prompt' && (
            <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-between gap-3 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="flex items-center space-x-2 text-xs font-mono-code text-amber-200">
                <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>ACTIVATE HANDS-FREE VOICE (&quot;Hey Shelby&quot;)</span>
              </div>
              <button
                onClick={onRequestPermission}
                className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-xs tracking-wider transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
              >
                ENABLE MICROPHONE
              </button>
            </div>
          )}

          {permissionState === 'denied' && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono-code flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>Microphone blocked in browser. Allow microphone in address bar to enable voice.</span>
              </div>
              <button
                onClick={onRequestPermission}
                className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px]"
              >
                Retry Access
              </button>
            </div>
          )}

          {permissionState === 'unsupported' && (
            <div className="p-2.5 rounded-lg bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs font-mono-code flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Speech Recognition not supported in this browser. Please use Chrome/Edge or type commands.</span>
            </div>
          )}

          {permissionState === 'granted' && (
            <div
              className={`p-2.5 rounded-xl border transition-all duration-300 font-mono-code text-xs space-y-2 ${
                isMuted
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-200 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                  : state === 'listening'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30 shadow-[0_0_25px_rgba(245,158,11,0.3)]'
                    : state === 'thinking'
                      ? 'bg-yellow-950/40 border-yellow-400/50 text-yellow-200'
                      : state === 'speaking'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                        : 'bg-black/70 border-amber-500/30 text-amber-300/90'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      isMuted
                        ? 'bg-rose-500'
                        : state === 'listening'
                          ? 'bg-amber-400 animate-ping'
                          : state === 'thinking'
                            ? 'bg-yellow-400 animate-pulse'
                            : state === 'speaking'
                              ? 'bg-amber-500 animate-pulse'
                              : 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                    }`}
                  />
                  <span className="font-bold tracking-wide uppercase text-[11px]">
                    {isMuted
                      ? 'MICROPHONE MUTED // PRIVACY ACTIVE'
                      : state === 'listening'
                        ? 'LISTENING... SPEAK YOUR COMMAND'
                        : state === 'thinking'
                          ? 'PROCESSING... REASONING WITH GEMINI'
                          : state === 'speaking'
                            ? 'SPEAKING... VOCALIZING RESPONSE'
                            : 'HANDS-FREE STANDBY // SAY "HEY SHELBY"'}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* Interrupt Button */}
                  {state === 'speaking' && (
                    <button
                      onClick={onInterruptSpeech}
                      className="px-2 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 border border-rose-500/50 text-[10px] uppercase font-bold"
                    >
                      Stop Speech
                    </button>
                  )}

                  {/* Visible Mute / Unmute Switch */}
                  <button
                    onClick={onToggleMute}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-[11px] font-mono-code transition-all border ${
                      isMuted
                        ? 'bg-rose-500 hover:bg-rose-400 text-black font-bold border-rose-400'
                        : 'bg-black/60 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                    }`}
                    title={isMuted ? 'Click to Unmute Microphone' : 'Click to Mute Microphone'}
                  >
                    {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isMuted ? 'UNMUTE MIC' : 'MUTE MIC'}</span>
                  </button>
                </div>
              </div>

              {/* Hardware DSP & Noise telemetry strip */}
              {!isMuted && (
                <div className="flex flex-wrap items-center justify-between text-[10px] font-mono-code text-amber-400/70 pt-1 border-t border-amber-500/15">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>NOISE FILTER</span>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>ECHO CANCEL</span>
                    </span>
                    <span className="flex items-center gap-1 text-amber-300">
                      <CheckCircle className="w-3 h-3" />
                      <span>SAFE GAIN</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[9px] text-amber-500/80">
                    <span>FLOOR: {Math.round((voiceMetrics?.noiseFloor || 0.05) * 100)}%</span>
                    {voiceMetrics && voiceMetrics.recoveryCount > 0 && (
                      <span className="text-emerald-400">
                        WATCHDOG HEALED: {voiceMetrics.recoveryCount}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Live Recognized Speech Card with Error Inspection & Correction */}
          {liveTranscript && (
            <div className="mt-2.5 p-3 rounded-xl bg-black/95 border-2 border-amber-400/60 shadow-[0_0_25px_rgba(245,158,11,0.3)] text-amber-200 text-xs font-tech animate-in fade-in space-y-2">
              <div className="flex items-center justify-between text-[10px] font-mono-code text-amber-400/80">
                <span className="flex items-center gap-1.5 uppercase font-bold text-amber-300">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  <span>
                    {liveTranscriptData?.isFinal
                      ? 'SPEECH CAPTURE [FINALIZED]'
                      : 'LIVE RECOGNITION [INTERIM]'}
                  </span>
                </span>
                <div className="flex items-center space-x-2">
                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Confidence: {Math.round((liveTranscriptData?.confidence || 0.85) * 100)}%
                  </span>
                  <span className="text-amber-500/60">
                    {voiceMetrics?.activeInputLang === 'hi-IN' ? 'Hindi Mode' : 'Indian English / Hinglish'}
                  </span>
                </div>
              </div>

              {editingTranscript !== null ? (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={editingTranscript}
                    onChange={(e) => setEditingTranscript(e.target.value)}
                    className="w-full bg-[#121520] border border-amber-400 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none focus:ring-1 focus:ring-amber-400"
                    placeholder="Correct misheard command..."
                    autoFocus
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingTranscript(null)}
                      className="px-2.5 py-1 rounded bg-black border border-stone-700 text-stone-300 text-[10px] font-mono-code"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (editingTranscript.trim() && onSendLiveTranscript) {
                          onSendLiveTranscript(editingTranscript.trim());
                        }
                        setEditingTranscript(null);
                      }}
                      className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-[10px] font-mono-code"
                    >
                      Execute Corrected
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="text-amber-100 text-sm font-tech leading-relaxed pl-1 py-1 bg-amber-500/5 rounded border border-amber-500/10">
                    &ldquo;{liveTranscript}&rdquo;
                  </p>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-mono-code text-amber-500/60 italic">
                      Verify recognition accuracy above before execution.
                    </span>

                    <div className="flex items-center space-x-1.5">
                      <button
                        onClick={() => setEditingTranscript(liveTranscript)}
                        className="px-2 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[10px] font-mono-code flex items-center space-x-1"
                        title="Click to fix any misrecognized words"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>

                      {onClearLiveTranscript && (
                        <button
                          onClick={onClearLiveTranscript}
                          className="px-2 py-1 rounded bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[10px] font-mono-code flex items-center space-x-1"
                          title="Discard recognized speech"
                        >
                          <X className="w-3 h-3" />
                          <span>Discard</span>
                        </button>
                      )}

                      {onSendLiveTranscript && (
                        <button
                          onClick={() => onSendLiveTranscript(liveTranscript)}
                          className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-[10px] tracking-wider flex items-center space-x-1"
                          title="Execute immediately without waiting for silence timeout"
                        >
                          <Check className="w-3 h-3" />
                          <span>Run Now</span>
                        </button>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* 3D Core Viewport */}
        <div className="relative w-full flex-1 max-h-[520px] flex flex-col items-center justify-center">
          {/* Quick HUD indicator for Core Visual Mode */}
          {onToggleCoreMode && (
            <div className="absolute top-2 right-4 z-10">
              <button
                onClick={onToggleCoreMode}
                className="px-2.5 py-1 rounded bg-black/80 hover:bg-amber-500/20 border border-amber-500/30 text-[10px] font-mono-code text-amber-300 flex items-center space-x-1.5 transition-all shadow-[0_0_10px_rgba(245,158,11,0.1)] hover:border-amber-400"
                title="Toggle between 3D Orbital Energy Core and Holographic Face Structure"
              >
                <ScanFace className="w-3 h-3 text-amber-400" />
                <span>CORE: {coreVisualMode === 'face' ? 'HOLO FACE' : '3D ORBIT'}</span>
              </button>
            </div>
          )}

          <div
            className="relative w-full flex-1 flex items-center justify-center cursor-pointer overflow-hidden"
            title="Click Shelby's Core to Talk"
          >
            {coreVisualMode === 'face' ? (
              <div className="w-full h-full flex items-center justify-center relative animate-in fade-in zoom-in-95 duration-300">
                <HoloAvatar
                  primaryColor="#f59e0b"
                  accentColor="#fef08a"
                  backgroundColor="transparent"
                  state={state}
                  isSpeaking={state === 'speaking'}
                  isMuted={isMuted}
                  audioLevel={audioLevel}
                  className="w-full h-full min-h-[380px] max-w-[540px]"
                  onClick={() => {
                    if (onStartDirectListening) {
                      onStartDirectListening();
                    } else {
                      onTriggerWake();
                    }
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center relative animate-in fade-in zoom-in-95 duration-300">
                <Shelby3DCore
                  state={state}
                  audioLevel={audioLevel}
                  reducedMotion={reducedMotion}
                  compactMode={false}
                  onCoreClick={() => {
                    if (onStartDirectListening) {
                      onStartDirectListening();
                    } else {
                      onTriggerWake();
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Direct Push-to-Talk / Voice Interaction Button */}
          <div className="z-10 mt-2 mb-1">
            <button
              onClick={() => {
                if (state === 'speaking') {
                  onInterruptSpeech();
                } else if (state === 'listening') {
                  onInterruptSpeech();
                } else {
                  if (onStartDirectListening) {
                    onStartDirectListening();
                  } else {
                    onTriggerWake();
                  }
                }
              }}
              className={`px-5 py-2 rounded-full font-tech text-xs tracking-wider font-bold transition-all flex items-center space-x-2 border shadow-lg ${
                state === 'listening'
                  ? 'bg-amber-400 text-black border-yellow-300 animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.6)] ring-2 ring-amber-300'
                  : state === 'speaking'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 hover:bg-rose-500/30'
                    : isMuted
                      ? 'bg-stone-900 text-stone-400 border-stone-800 hover:border-amber-500/30'
                      : 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-200 border-amber-500/40 hover:border-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              }`}
            >
              <Mic className={`w-3.5 h-3.5 ${state === 'listening' ? 'animate-bounce text-black' : 'text-amber-400'}`} />
              <span>
                {state === 'listening'
                  ? 'LISTENING... SPEAK YOUR COMMAND'
                  : state === 'speaking'
                    ? 'SHELBY VOCALIZING (CLICK TO INTERRUPT)'
                    : isMuted
                      ? 'MIC MUTED (CLICK TO TALK)'
                      : 'CLICK TO TALK TO SHELBY'}
              </span>
            </button>
          </div>
        </div>

        {/* Real-time Audio Waveform Visualizer */}
        <div className="w-full max-w-xl z-10 flex flex-col items-center space-y-1.5 mb-2">
          <div className="w-full flex items-center justify-between text-[10px] font-mono-code text-amber-400/70 px-2">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-amber-400" />
              <span>AUDIO FREQUENCY & FORMANT SPECTRUM</span>
            </span>
            <span className="font-bold">
              {isMuted
                ? 'MIC MUTED'
                : state === 'listening'
                  ? 'RECORDING ACTIVE'
                  : state === 'speaking'
                    ? 'PLAYBACK ACTIVE'
                    : 'SPEECH ENGINE READY'}
            </span>
          </div>

          <div className="w-full h-9 bg-black/80 border border-amber-500/25 rounded-md px-3 flex items-center justify-center space-x-1 overflow-hidden relative">
            {/* Visual Speech Threshold Line */}
            <div
              className="absolute left-0 right-0 border-t border-amber-400/40 pointer-events-none z-10"
              style={{
                top: `${Math.max(4, Math.min(32, 36 - ((voiceMetrics?.noiseFloor || 0.05) + 0.08) * 36))}px`,
              }}
              title="VAD Speech Activity Threshold"
            />

            {Array.from({ length: 48 }).map((_, i) => {
              const offset = Math.sin(i * 0.4 + Date.now() * 0.005);
              const height = isMuted
                ? 3
                : state === 'speaking' || state === 'listening'
                  ? Math.max(3, Math.min(30, audioLevel * 34 + Math.abs(offset) * 12))
                  : Math.max(2, Math.abs(offset) * 4);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isMuted
                      ? 'bg-rose-500/30'
                      : voiceMetrics?.vadStatus === 'speech'
                        ? 'bg-gradient-to-t from-amber-500 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                        : voiceMetrics?.vadStatus === 'noise'
                          ? 'bg-yellow-600/40'
                          : 'bg-amber-500/25'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>

          <div className="w-full flex items-center justify-between text-[9px] font-mono-code text-amber-500/50 px-2">
            <span>NOISE FLOOR: {Math.round((voiceMetrics?.noiseFloor || 0.05) * 100)}%</span>
            <span>THRESHOLD: {Math.round(((voiceMetrics?.noiseFloor || 0.05) + 0.08) * 100)}%</span>
            <span>LEVEL: {Math.round((audioLevel || 0) * 100)}%</span>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="w-full max-w-2xl flex items-center justify-center flex-wrap gap-2 z-10 mb-2">
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={p.action}
              className="px-3 py-1 rounded-full bg-black/60 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/40 text-[11px] font-tech text-amber-200 tracking-wide transition-all flex items-center space-x-1.5"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT COLUMN: Conversation Stream & Command Terminal */}
      <div className="w-full xl:w-96 border-t xl:border-t-0 xl:border-l border-amber-500/15 flex flex-col justify-between bg-[#080a0e]/90 z-10 h-72 xl:h-full">
        {/* Terminal Header */}
        <div className="p-3 border-b border-amber-500/15 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <h3 className="font-heading text-xs font-bold text-amber-300 tracking-wider">
              CONVERSATION LOG
            </h3>
          </div>
          <span className="text-[10px] font-mono-code text-amber-500/60">
            {messages.length} ENTRIES
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div
          ref={chatScrollRef}
          className="flex-1 p-4 overflow-y-auto space-y-3 font-tech text-xs tracking-wide"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg border leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-100 ml-4'
                  : 'bg-black/70 border-amber-500/15 text-amber-200/90 mr-4'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] font-mono-code text-amber-400/60 mb-1">
                <span className="uppercase font-bold">
                  {msg.role === 'user' ? 'USER // YOU' : 'SHELBY AI'}
                </span>
                <span>{msg.timestamp}</span>
              </div>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))}

          {state === 'thinking' && (
            <div className="p-3 rounded-lg bg-black/60 border border-amber-500/20 text-amber-400 font-mono-code text-xs flex items-center space-x-2 mr-4">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-ping" />
              <span>SHELBY is formulating reasoning with Gemini...</span>
            </div>
          )}
        </div>

        {/* Command Form */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-amber-500/15 bg-black/80">
          <div className="flex items-center space-x-2">
            {/* Command Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  state === 'listening'
                    ? 'Listening... Speak now or type command...'
                    : isMuted
                      ? 'Microphone muted. Type command here...'
                      : 'Type command or click mic to speak...'
                }
                className="w-full bg-[#10131a] text-amber-100 placeholder-amber-500/40 text-xs font-mono-code px-3.5 py-2.5 rounded-lg border border-amber-500/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all"
              />
            </div>

            {/* Click-to-Talk Microphone Button */}
            <button
              type="button"
              onClick={() => {
                if (state === 'listening') {
                  onInterruptSpeech();
                } else {
                  if (onStartDirectListening) {
                    onStartDirectListening();
                  } else {
                    onTriggerWake();
                  }
                }
              }}
              className={`p-2.5 rounded-lg border transition-all flex items-center justify-center ${
                state === 'listening'
                  ? 'bg-rose-500 hover:bg-rose-400 text-black border-rose-400 animate-pulse ring-2 ring-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : isMuted
                    ? 'bg-stone-900 text-stone-500 border-stone-800 hover:border-amber-500/30'
                    : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 hover:border-amber-300'
              }`}
              title={state === 'listening' ? 'Listening now (Click to stop)' : 'Click to speak to SHELBY'}
            >
              {state === 'listening' ? (
                <Mic className="w-4 h-4 animate-bounce text-black" />
              ) : isMuted ? (
                <MicOff className="w-4 h-4 text-stone-500" />
              ) : (
                <Mic className="w-4 h-4 text-amber-400" />
              )}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold transition-all"
              title="Send text command"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono-code text-amber-500/50 mt-2 px-1">
            <span>ENTER TO SEND</span>
            <span>CLICK MIC OR SAY &quot;HEY SHELBY&quot;</span>
          </div>
        </form>
      </div>
    </div>
  );
};
