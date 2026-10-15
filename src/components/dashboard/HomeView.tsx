import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Sparkles,
  ShieldAlert,
  Radio,
  Volume2,
  MicOff,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  AssistantState,
  ChatMessage,
  SystemHealth,
  TaskPlan,
  SmartNotification,
  LanguageMode,
} from '../../types';
import { Shelby3DCore } from '../three/Shelby3DCore';

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
  permissionState: 'prompt' | 'granted' | 'denied' | 'unsupported';
  onRequestPermission: () => void;
  onInterruptSpeech: () => void;
  onTriggerWake: () => void;
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
  permissionState,
  onRequestPermission,
  onInterruptSpeech,
  onTriggerWake,
}) => {
  const [inputText, setInputText] = useState('');
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
        {/* Top Floating State Header */}
        <div className="w-full flex items-center justify-between z-10 px-4">
          <div className="flex items-center space-x-2">
            <span className="font-mono-code text-xs text-amber-400/80 uppercase tracking-widest">
              PRIMARY CORE // NEURAL MATRIX
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              ACCENT: INDIAN ENGLISH
            </span>
            <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              LANG: {language.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Prominent Hands-Free Voice Status Banner */}
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
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-500/40 text-rose-300 text-xs font-mono-code flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Microphone blocked in browser. Please enable microphone permission in your address bar.</span>
            </div>
          )}

          {permissionState === 'unsupported' && (
            <div className="p-2.5 rounded-lg bg-yellow-950/40 border border-yellow-500/40 text-yellow-300 text-xs font-mono-code flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />
              <span>Speech Recognition is not supported in this browser. Please use Chrome/Edge or text commands.</span>
            </div>
          )}

          {permissionState === 'granted' && (
            <div
              className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-between font-mono-code text-xs ${
                isMuted
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
                  : state === 'listening'
                    ? 'bg-amber-500/20 border-amber-400 text-amber-200 ring-2 ring-amber-400/30 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    : state === 'thinking'
                      ? 'bg-yellow-950/40 border-yellow-400/50 text-yellow-200'
                      : state === 'speaking'
                        ? 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                        : 'bg-black/60 border-amber-500/25 text-amber-400/90'
              }`}
            >
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
                    ? 'PRIVACY MODE: MICROPHONE MUTED'
                    : state === 'listening'
                      ? 'LISTENING... SPEAK YOUR COMMAND'
                      : state === 'thinking'
                        ? 'PROCESSING... REASONING WITH GEMINI'
                        : state === 'speaking'
                          ? 'SPEAKING... VOCALIZING RESPONSE'
                          : 'HANDS-FREE STANDBY // SAY "HEY SHELBY"'}
                </span>
              </div>

              {state === 'speaking' && (
                <button
                  onClick={onInterruptSpeech}
                  className="px-2 py-0.5 rounded bg-rose-500/30 hover:bg-rose-500/50 text-rose-200 border border-rose-500/50 text-[10px] uppercase font-bold"
                >
                  Stop Speech
                </button>
              )}
            </div>
          )}

          {/* Real-time live transcript bubble when user is speaking */}
          {liveTranscript && (
            <div className="mt-2 p-2.5 rounded-lg bg-black/90 border border-amber-400/40 shadow-[0_0_15px_rgba(245,158,11,0.2)] text-amber-200 text-xs font-tech animate-in fade-in">
              <span className="text-[10px] font-mono-code text-amber-500/70 block uppercase font-bold">
                Live Speech Capture:
              </span>
              <p className="mt-0.5 text-amber-100 italic">&ldquo;{liveTranscript}&rdquo;</p>
            </div>
          )}
        </div>

        {/* 3D Core Viewport */}
        <div className="relative w-full flex-1 max-h-[580px] flex items-center justify-center">
          <Shelby3DCore
            state={state}
            audioLevel={audioLevel}
            reducedMotion={reducedMotion}
            compactMode={false}
            onCoreClick={onToggleMute}
          />
        </div>

        {/* Real-time Audio Waveform Visualizer */}
        <div className="w-full max-w-xl z-10 flex flex-col items-center space-y-2 mb-2">
          <div className="w-full flex items-center justify-between text-[10px] font-mono-code text-amber-400/60 px-2">
            <span>VOICE SENSITIVITY // FREQUENCY SPECTRUM</span>
            <span>
              {isMuted
                ? 'MIC MUTED'
                : state === 'listening'
                  ? 'LISTENING ACTIVE'
                  : state === 'speaking'
                    ? 'VOCALIZING RESPONSE'
                    : 'WAKE PHRASE READY'}
            </span>
          </div>

          <div className="w-full h-8 bg-black/60 border border-amber-500/20 rounded-md px-3 flex items-center justify-center space-x-1 overflow-hidden">
            {Array.from({ length: 48 }).map((_, i) => {
              const offset = Math.sin(i * 0.4 + Date.now() * 0.005);
              const height = isMuted
                ? 3
                : state === 'speaking' || state === 'listening'
                  ? Math.max(3, Math.min(28, audioLevel * 32 + Math.abs(offset) * 12))
                  : Math.max(2, Math.abs(offset) * 4);
              return (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isMuted
                      ? 'bg-rose-500/40'
                      : state === 'speaking'
                        ? 'bg-gradient-to-t from-amber-500 to-yellow-300'
                        : state === 'listening'
                          ? 'bg-gradient-to-t from-amber-400 to-amber-200'
                          : 'bg-amber-500/30'
                  }`}
                  style={{ height: `${height}px` }}
                />
              );
            })}
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

        {/* Command Form (NO clickable mic button - automatic hands-free voice) */}
        <form onSubmit={handleSubmit} className="p-3 border-t border-amber-500/15 bg-black/80">
          <div className="flex items-center space-x-2">
            {/* Command Text Input */}
            <div className="flex-1 relative">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  isMuted
                    ? 'Microphone muted. Type command here...'
                    : 'Hands-free active (Say "Hey Shelby")... or type here...'
                }
                className="w-full bg-[#10131a] text-amber-100 placeholder-amber-500/40 text-xs font-mono-code px-3.5 py-2.5 rounded-lg border border-amber-500/20 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400/40 transition-all"
              />
            </div>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim()}
              className="p-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center justify-between text-[9px] font-mono-code text-amber-500/50 mt-2 px-1">
            <span>ENTER TO SEND</span>
            <span>HANDS-FREE WAKE WORD ACTIVE</span>
          </div>
        </form>
      </div>
    </div>
  );
};
