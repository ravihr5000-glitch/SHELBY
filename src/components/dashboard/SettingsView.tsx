import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Volume2,
  Mic,
  Brain,
  Shield,
  Monitor,
  Trash2,
  Edit2,
  Plus,
  Save,
  Check,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { ShelbySettings, MemoryItem, LanguageMode } from '../../types';

interface SettingsViewProps {
  settings: ShelbySettings;
  onUpdateSettings: (s: ShelbySettings) => void;
  memories: MemoryItem[];
  onSaveMemories: (m: MemoryItem[]) => void;
  onOpenCompanionModal: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  memories,
  onSaveMemories,
  onOpenCompanionModal,
}) => {
  const [activeTab, setActiveTab] = useState<'voice' | 'memory' | 'privacy' | 'companion' | 'display'>('voice');
  const [editingMemoryId, setEditingMemoryId] = useState<string | null>(null);
  const [editKeyValue, setEditKeyValue] = useState<{ key: string; value: string }>({ key: '', value: '' });
  const [newMemoryKey, setNewMemoryKey] = useState('');
  const [newMemoryVal, setNewMemoryVal] = useState('');
  const [newMemoryCategory, setNewMemoryCategory] = useState<'preference' | 'project' | 'routine' | 'fact'>('preference');

  const handleUpdate = (patch: Partial<ShelbySettings>) => {
    onUpdateSettings({ ...settings, ...patch });
  };

  const handleDeleteMemory = (id: string) => {
    onSaveMemories(memories.filter((m) => m.id !== id));
  };

  const handleClearAllMemories = () => {
    if (window.confirm('Clear all long-term memories? This action is irreversible.')) {
      onSaveMemories([]);
    }
  };

  const handleAddMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    const newItem: MemoryItem = {
      id: `mem-${Date.now()}`,
      category: newMemoryCategory,
      key: newMemoryKey.trim(),
      value: newMemoryVal.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      confidence: 1.0,
    };
    onSaveMemories([...memories, newItem]);
    setNewMemoryKey('');
    setNewMemoryVal('');
  };

  const startEditMemory = (m: MemoryItem) => {
    setEditingMemoryId(m.id);
    setEditKeyValue({ key: m.key, value: m.value });
  };

  const saveEditMemory = (id: string) => {
    onSaveMemories(
      memories.map((m) =>
        m.id === id
          ? {
              ...m,
              key: editKeyValue.key,
              value: editKeyValue.value,
              updatedAt: new Date().toISOString(),
            }
          : m
      )
    );
    setEditingMemoryId(null);
  };

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col md:flex-row bg-[#050608]">
      {/* Settings Navigation Tabs */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-amber-500/15 p-4 bg-[#080a0e]/60 space-y-2">
        <div className="flex items-center space-x-2 pb-3 border-b border-amber-500/15">
          <SettingsIcon className="w-5 h-5 text-amber-400" />
          <h2 className="font-heading text-base font-bold tracking-wider text-amber-300">
            CONFIGURATION
          </h2>
        </div>

        <nav className="space-y-1 font-tech text-xs tracking-wide">
          {[
            { id: 'voice', label: 'Voice & Language', icon: Volume2 },
            { id: 'memory', label: 'Memory & Context', icon: Brain },
            { id: 'privacy', label: 'Privacy & Security', icon: Shield },
            { id: 'companion', label: 'Windows Companion', icon: Monitor },
            { id: 'display', label: 'Visuals & Motion', icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 font-bold'
                    : 'text-amber-100/60 hover:text-amber-200 hover:bg-amber-500/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-amber-500/50'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Settings Tab Contents */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {/* TAB 1: Voice & Language */}
        {activeTab === 'voice' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-heading text-xl font-bold text-amber-300">
                Voice & Multilingual Configuration
              </h3>
              <p className="font-mono-code text-xs text-amber-500/70 mt-1">
                Configure vocal acoustics, Indian English accent priority, and wake-word sensitivity.
              </p>
            </div>

            {/* Language Selection */}
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <label className="text-xs font-mono-code text-amber-400 font-bold block">
                Primary Language Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['English', 'Hindi', 'Hinglish'] as LanguageMode[]).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => handleUpdate({ language: lang })}
                    className={`py-2 rounded border font-mono-code text-xs transition-all ${
                      settings.language === lang
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-black/40 border-amber-500/15 text-amber-100/60 hover:text-amber-200'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Accent */}
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <label className="text-xs font-mono-code text-amber-400 font-bold block">
                Speech Synthesis Voice Persona
              </label>
              <select
                value={settings.voiceAccent}
                onChange={(e) => handleUpdate({ voiceAccent: e.target.value as any })}
                className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
              >
                <option value="Indian English">Indian English (Natural, Calm, Clear)</option>
                <option value="Hindi Native">Hindi Native (शुद्ध एवं स्वाभाविक)</option>
                <option value="British Neutral">British Neutral (Formal)</option>
                <option value="American Tech">American Tech (Direct)</option>
              </select>
            </div>

            {/* Independent Spoken Volume Slider */}
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between text-xs font-mono-code text-amber-400">
                <span className="font-bold">SHELBY Spoken-Response Volume (Independent)</span>
                <span>{Math.round(settings.ttsVolume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.ttsVolume}
                onChange={(e) => handleUpdate({ ttsVolume: parseFloat(e.target.value) })}
                className="w-full h-1.5 accent-amber-400 cursor-pointer"
              />
              <p className="text-[10px] font-mono-code text-amber-500/50">
                Adjusts SHELBY spoken vocal volume without altering computer master volume.
              </p>
            </div>

            {/* Wake Word Controls */}
            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-tech font-bold text-xs text-amber-300">
                    Continuous Hands-Free Wake Phrase (&quot;Hey Shelby&quot;)
                  </h4>
                  <p className="text-[10px] font-mono-code text-amber-500/60 mt-0.5">
                    Stage 1 uses browser Web Speech API. Stage 2 provides background Windows OS listening.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.wakeWordEnabled}
                  onChange={(e) => handleUpdate({ wakeWordEnabled: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Memory & Context */}
        {activeTab === 'memory' && (
          <div className="space-y-6 max-w-3xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading text-xl font-bold text-amber-300">
                  Persistent Local Memory Engine
                </h3>
                <p className="font-mono-code text-xs text-amber-500/70 mt-1">
                  Local-first storage surviving reloads. Zero plain API keys or passwords stored.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleUpdate({ memoryCollectionPaused: !settings.memoryCollectionPaused })}
                  className={`px-3 py-1.5 rounded text-xs font-mono-code border transition-all flex items-center space-x-1.5 ${
                    settings.memoryCollectionPaused
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  }`}
                >
                  {settings.memoryCollectionPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                  <span>{settings.memoryCollectionPaused ? 'RESUME LOGGING' : 'PAUSE LOGGING'}</span>
                </button>

                <button
                  onClick={handleClearAllMemories}
                  className="px-3 py-1.5 rounded bg-black/60 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-mono-code transition-all"
                >
                  CLEAR ALL
                </button>
              </div>
            </div>

            {/* Add Memory Item */}
            <form onSubmit={handleAddMemory} className="p-4 rounded-xl bg-black/60 border border-amber-500/20 space-y-3">
              <h4 className="font-heading text-sm font-bold text-amber-300">Add Memory Anchor</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newMemoryCategory}
                  onChange={(e) => setNewMemoryCategory(e.target.value as any)}
                  className="bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100"
                >
                  <option value="preference">Preference</option>
                  <option value="routine">Routine</option>
                  <option value="project">Project</option>
                  <option value="fact">Fact</option>
                </select>
                <input
                  type="text"
                  value={newMemoryKey}
                  onChange={(e) => setNewMemoryKey(e.target.value)}
                  placeholder="Key (e.g. Daily Standup)"
                  className="bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100"
                />
                <input
                  type="text"
                  value={newMemoryVal}
                  onChange={(e) => setNewMemoryVal(e.target.value)}
                  placeholder="Value / Detail"
                  className="bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono-code"
                >
                  Record Memory
                </button>
              </div>
            </form>

            {/* List of Memories */}
            <div className="space-y-2">
              <div className="text-xs font-mono-code text-amber-500/70">
                ACTIVE MEMORIES ({memories.length})
              </div>
              {memories.map((m) => {
                const isEditing = editingMemoryId === m.id;
                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-lg bg-black/50 border border-amber-500/15 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    {isEditing ? (
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={editKeyValue.key}
                          onChange={(e) => setEditKeyValue({ ...editKeyValue, key: e.target.value })}
                          className="w-full bg-[#12151e] border border-amber-500/40 rounded p-1.5 text-xs font-mono-code text-amber-100"
                        />
                        <input
                          type="text"
                          value={editKeyValue.value}
                          onChange={(e) => setEditKeyValue({ ...editKeyValue, value: e.target.value })}
                          className="w-full bg-[#12151e] border border-amber-500/40 rounded p-1.5 text-xs font-mono-code text-amber-100"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => saveEditMemory(m.id)}
                            className="px-3 py-1 bg-amber-500 text-black font-bold text-xs rounded"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingMemoryId(null)}
                            className="px-3 py-1 bg-black text-amber-300 text-xs rounded border border-amber-500/30"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 uppercase">
                            {m.category}
                          </span>
                          <span className="font-tech font-bold text-xs text-amber-200">{m.key}</span>
                        </div>
                        <p className="font-tech text-xs text-amber-100/80 mt-1 pl-1">{m.value}</p>
                      </div>
                    )}

                    {!isEditing && (
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => startEditMemory(m)}
                          className="p-1.5 rounded bg-black/60 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20"
                          title="Edit Memory"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteMemory(m.id)}
                          className="p-1.5 rounded bg-black/60 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                          title="Delete Memory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Privacy & Security */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-heading text-xl font-bold text-amber-300">
                Privacy & Sensitive Information
              </h3>
              <p className="font-mono-code text-xs text-amber-500/70 mt-1">
                Zero silent access policy. Every sensitive operation requires authorization.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-mono-code font-bold">
                <Shield className="w-4 h-4" />
                <span>POLICY // ASK EACH TIME</span>
              </div>
              <p className="text-xs font-tech text-amber-100/80 leading-relaxed">
                Whenever SHELBY encounters credentials, external payments, or irreversible file modifications,
                it pauses execution and presents an explicit approval dialogue.
              </p>
              <div className="pt-2 text-[11px] font-mono-code text-emerald-400 flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Enforced across all modules.</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-2">
              <h4 className="font-tech text-xs font-bold text-amber-300">Microphone Governance</h4>
              <p className="text-xs font-tech text-amber-100/70">
                Microphone audio streams strictly into client SpeechRecognition and local Web Audio FFT.
                Audio is not transmitted or recorded silently.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: Windows Companion */}
        {activeTab === 'companion' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-heading text-xl font-bold text-amber-300">
                Windows Companion Desktop Bridge
              </h3>
              <p className="font-mono-code text-xs text-amber-500/70 mt-1">
                Bridge architecture for Stage 2 Windows daemon (Port 41829).
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-tech text-xs font-bold text-amber-300">
                    Stage 1 vs Stage 2 Division
                  </h4>
                  <p className="text-[10px] font-mono-code text-amber-500/60 mt-1">
                    Browser applications cannot perform unrestricted OS operations or guarantee background listening.
                  </p>
                </div>
                <button
                  onClick={onOpenCompanionModal}
                  className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono-code flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Bridge Diagnostic</span>
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-tech text-xs font-bold text-amber-300">
                    Developer Companion Simulation
                  </h4>
                  <p className="text-[10px] font-mono-code text-amber-500/60 mt-0.5">
                    Simulate active companion connection to test OS telemetry and UI synchronization.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.simulateCompanion}
                  onChange={(e) => handleUpdate({ simulateCompanion: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Visuals & Motion */}
        {activeTab === 'display' && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h3 className="font-heading text-xl font-bold text-amber-300">
                Visual Realism & Motion Settings
              </h3>
              <p className="font-mono-code text-xs text-amber-500/70 mt-1">
                Control Three.js 3D core motion and accessibility parameters.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-black/50 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-tech text-xs font-bold text-amber-300">
                    Reduced Motion Mode
                  </h4>
                  <p className="text-[10px] font-mono-code text-amber-500/60 mt-0.5">
                    Damps 3D core gyroscopic spin rates and particle velocities for low-stimulus environments.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={settings.reducedMotion}
                  onChange={(e) => handleUpdate({ reducedMotion: e.target.checked })}
                  className="w-4 h-4 accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
