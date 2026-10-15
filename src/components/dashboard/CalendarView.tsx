import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Volume2,
  Plus,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CalendarEvent, ShelbySettings } from '../../types';

interface CalendarViewProps {
  events: CalendarEvent[];
  onToggleComplete: (id: string) => void;
  onAddEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  onDeliverBriefing: () => void;
  settings: ShelbySettings;
  onUpdateSettings: (s: ShelbySettings) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  onToggleComplete,
  onAddEvent,
  onDeliverBriefing,
  settings,
  onUpdateSettings,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTime, setNewTime] = useState('10:00');
  const [newDuration, setNewDuration] = useState(30);
  const [newPriority, setNewPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [newCategory, setNewCategory] = useState<'work' | 'personal' | 'system' | 'briefing'>('work');

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onAddEvent({
      title: newTitle.trim(),
      time: newTime,
      date: new Date().toISOString().split('T')[0],
      durationMinutes: newDuration,
      priority: newPriority,
      category: newCategory,
      completed: false,
    });
    setNewTitle('');
    setShowAddModal(false);
  };

  const priorityColors = {
    urgent: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    high: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    low: 'bg-neutral-500/20 text-neutral-300 border-neutral-500/30',
  };

  return (
    <div className="flex-1 h-full overflow-y-auto p-6 bg-[#050608] space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-amber-500/15">
        <div>
          <h2 className="font-heading text-2xl font-bold text-amber-300 tracking-wider flex items-center space-x-2">
            <CalendarIcon className="w-6 h-6 text-amber-400" />
            <span>DAILY SCHEDULE & MORNING BRIEFING</span>
          </h2>
          <p className="font-mono-code text-xs text-amber-500/70 mt-1">{todayStr}</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3.5 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-tech text-xs tracking-wide flex items-center space-x-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Commitment</span>
        </button>
      </div>

      {/* Morning Briefing Banner */}
      <div className="p-5 rounded-xl bg-gradient-to-r from-amber-950/40 via-black to-amber-950/20 border border-amber-500/30 relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="font-heading text-lg font-bold text-amber-300">
                SHELBY MORNING BRIEFING
              </span>
              <span className="text-[10px] font-mono-code px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                SCHEDULED: {settings.morningBriefingTime}
              </span>
            </div>
            <p className="text-xs text-amber-100/80 font-tech max-w-2xl">
              Includes priority objectives, upcoming commitments, system telemetry integrity, and
              Indian English vocal presentation.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onDeliverBriefing}
              className="px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-xs tracking-wider flex items-center space-x-2 shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all"
            >
              <Volume2 className="w-4 h-4" />
              <span>DELIVER BRIEFING ALOUD</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daily Time-Block List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono-code text-amber-500/70">
          <span>TIME-BLOCK COMMITMENTS</span>
          <span>{events.filter((e) => e.completed).length} OF {events.length} COMPLETED</span>
        </div>

        <div className="space-y-2">
          {events.map((evt) => (
            <div
              key={evt.id}
              className={`p-4 rounded-lg border transition-all flex items-center justify-between ${
                evt.completed
                  ? 'bg-black/40 border-amber-500/10 opacity-60'
                  : 'bg-black/60 border-amber-500/20 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onToggleComplete(evt.id)}
                  className="text-amber-400 hover:text-amber-300 transition-colors"
                >
                  {evt.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-amber-500/40 hover:text-amber-400" />
                  )}
                </button>
                <div>
                  <h4
                    className={`font-tech text-sm tracking-wide ${
                      evt.completed ? 'line-through text-amber-200/50' : 'text-amber-200'
                    }`}
                  >
                    {evt.title}
                  </h4>
                  <div className="flex items-center space-x-3 text-[11px] font-mono-code text-amber-500/60 mt-0.5">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-amber-400" />
                      <span>{evt.time}</span>
                    </span>
                    <span>•</span>
                    <span>{evt.durationMinutes} min</span>
                    <span>•</span>
                    <span className="uppercase">{evt.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span
                  className={`text-[10px] font-mono-code px-2 py-0.5 rounded border uppercase font-bold ${
                    priorityColors[evt.priority]
                  }`}
                >
                  {evt.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Commitment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <form
            onSubmit={handleAddSubmit}
            className="w-full max-w-md bg-[#0a0c10] border border-amber-500/40 rounded-xl p-6 space-y-4 shadow-[0_0_30px_rgba(245,158,11,0.2)]"
          >
            <h3 className="font-heading text-lg font-bold text-amber-300">Add Time-Block Event</h3>
            <div>
              <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                Event Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. SHELBY System Telemetry Calibration"
                className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none focus:border-amber-400"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                  Duration (Minutes)
                </label>
                <input
                  type="number"
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value, 10))}
                  className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                  Priority
                </label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value as any)}
                  className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-mono-code text-amber-500/70 block mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#12151e] border border-amber-500/30 rounded p-2 text-xs font-mono-code text-amber-100 focus:outline-none"
                >
                  <option value="work">Work</option>
                  <option value="system">System</option>
                  <option value="personal">Personal</option>
                  <option value="briefing">Briefing</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 rounded text-xs font-mono-code text-amber-400/70 hover:text-amber-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs font-mono-code"
              >
                Confirm Commitment
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
