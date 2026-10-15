import React, { useState } from 'react';
import {
  CheckSquare,
  Play,
  Pause,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Plus,
  Terminal,
  Clock,
  CheckCircle,
  FileText,
  CornerDownRight,
  ShieldAlert,
} from 'lucide-react';
import { TaskPlan, TaskStep } from '../../types';

interface TasksViewProps {
  tasks: TaskPlan[];
  activeTask: TaskPlan | null;
  onExecutePlan: (plan: TaskPlan) => void;
  onAbortTask: (taskId: string) => void;
  onCreateTask: (goal: string) => void;
  onRetryTask: (taskId: string) => void;
}

export const TasksView: React.FC<TasksViewProps> = ({
  tasks,
  activeTask,
  onExecutePlan,
  onAbortTask,
  onCreateTask,
  onRetryTask,
}) => {
  const [newGoal, setNewGoal] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskPlan | null>(activeTask || tasks[0] || null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoal.trim()) return;
    onCreateTask(newGoal.trim());
    setNewGoal('');
  };

  const riskBadgeColors = {
    LOW: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    MEDIUM: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    HIGH: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  };

  const currentDisplayTask = selectedTask || activeTask || tasks[0] || null;

  return (
    <div className="flex-1 h-full overflow-hidden flex flex-col md:flex-row bg-[#050608]">
      {/* Task List Panel */}
      <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-amber-500/15 p-4 flex flex-col justify-between bg-[#080a0e]/60">
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/15">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-4 h-4 text-amber-400" />
              <h2 className="font-heading text-sm font-bold tracking-wider text-amber-300">
                TASK PIPELINE
              </h2>
            </div>
            <span className="text-[10px] font-mono-code text-amber-500/60">
              {tasks.length} REGISTERED
            </span>
          </div>

          {/* Form to initiate a new multi-step task */}
          <form onSubmit={handleCreateSubmit} className="space-y-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Formulate multi-step task goal..."
              className="w-full bg-[#10131a] border border-amber-500/20 rounded p-2 text-xs font-mono-code text-amber-100 placeholder-amber-500/40 focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              disabled={!newGoal.trim()}
              className="w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 disabled:opacity-40 text-amber-300 border border-amber-500/40 text-xs font-tech flex items-center justify-center space-x-1.5 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Formulate Plan with Gemini</span>
            </button>
          </form>

          {/* List of Tasks */}
          <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
            {tasks.map((t) => {
              const isSelected = currentDisplayTask?.id === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTask(t)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                      : 'bg-black/50 border-amber-500/10 hover:border-amber-500/25'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono-code mb-1">
                    <span
                      className={`uppercase px-1.5 py-0.5 rounded ${
                        t.status === 'completed'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : t.status === 'executing'
                            ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                            : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      {t.status}
                    </span>
                    <span className="text-amber-500/50">
                      ~{t.estimatedSeconds}s
                    </span>
                  </div>
                  <h4 className="font-tech text-xs text-amber-200 line-clamp-1 font-semibold">
                    {t.title}
                  </h4>
                  <p className="text-[10px] text-amber-500/60 font-mono-code mt-1">
                    {t.steps.filter((s) => s.status === 'completed').length} / {t.steps.length} steps completed
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-amber-500/15 text-[10px] font-mono-code text-amber-500/60">
          APPROVAL GATE REQUIRED FOR CONSEQUENTIAL OPS
        </div>
      </div>

      {/* Task Execution Detail & Step Approval Gate */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6">
        {currentDisplayTask ? (
          <div className="space-y-6 max-w-4xl">
            {/* Task Header & State Badge */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-amber-500/15">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono-code text-xs text-amber-400/70">
                    ID // {currentDisplayTask.id}
                  </span>
                  <span
                    className={`text-[10px] font-mono-code px-2 py-0.5 rounded border uppercase font-bold ${
                      riskBadgeColors[currentDisplayTask.riskLevel]
                    }`}
                  >
                    RISK LEVEL: {currentDisplayTask.riskLevel}
                  </span>
                </div>
                <h2 className="font-heading text-2xl font-bold text-amber-300 mt-1">
                  {currentDisplayTask.title}
                </h2>
                <p className="font-tech text-xs text-amber-100/80 mt-1">
                  Goal: {currentDisplayTask.goal}
                </p>
              </div>

              {/* Action Controls */}
              <div className="flex items-center space-x-3">
                {currentDisplayTask.status === 'awaiting_approval' && (
                  <button
                    onClick={() => onExecutePlan(currentDisplayTask)}
                    className="px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-xs tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>AUTHORIZE & EXECUTE PLAN</span>
                  </button>
                )}

                {currentDisplayTask.status === 'executing' && (
                  <button
                    onClick={() => onAbortTask(currentDisplayTask.id)}
                    className="px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/50 font-mono-code text-xs flex items-center space-x-2 transition-all"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    <span>ABORT / SAFE RECOVERY</span>
                  </button>
                )}

                {currentDisplayTask.status === 'failed' && (
                  <button
                    onClick={() => onRetryTask(currentDisplayTask.id)}
                    className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-mono-code text-xs flex items-center space-x-2 transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>SAFE RETRY</span>
                  </button>
                )}
              </div>
            </div>

            {/* Risk Assessment & Verification Explanation */}
            <div className="p-4 rounded-xl bg-black/60 border border-amber-500/20 space-y-2">
              <div className="flex items-center space-x-2 text-xs font-mono-code text-amber-400 font-bold">
                <ShieldAlert className="w-4 h-4" />
                <span>GOVERNANCE & PERMISSION AUDIT</span>
              </div>
              <p className="font-tech text-xs text-amber-100/90 leading-relaxed">
                {currentDisplayTask.riskExplanation}
              </p>
            </div>

            {/* Step-by-Step Execution Plan */}
            <div className="space-y-3">
              <h3 className="font-heading text-sm font-bold text-amber-300 tracking-wider">
                EXECUTION SEQUENCE ({currentDisplayTask.steps.length} MILESTONES)
              </h3>

              <div className="space-y-2">
                {currentDisplayTask.steps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-4 rounded-lg border transition-all ${
                      step.status === 'completed'
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                        : step.status === 'running'
                          ? 'bg-amber-500/15 border-amber-500/50 text-amber-200 ring-1 ring-amber-400/30'
                          : step.status === 'failed'
                            ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                            : 'bg-black/50 border-amber-500/15 text-amber-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-mono-code">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-bold text-[10px] text-amber-400">
                          {idx + 1}
                        </span>
                        <span className="font-tech font-bold text-sm tracking-wide text-amber-200">
                          {step.title}
                        </span>
                      </div>
                      <span className="uppercase text-[10px] font-bold">
                        {step.status}
                      </span>
                    </div>

                    <p className="text-xs font-tech text-amber-100/80 mt-2 pl-7">
                      {step.description}
                    </p>

                    {step.log && (
                      <div className="mt-2 ml-7 p-2 bg-black/80 rounded border border-amber-500/20 font-mono-code text-[11px] text-amber-300/80">
                        <Terminal className="w-3 h-3 inline mr-1 text-amber-400" />
                        {step.log}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Execution Result Summary when completed */}
            {currentDisplayTask.resultSummary && (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400 text-xs font-mono-code font-bold">
                  <CheckCircle className="w-4 h-4" />
                  <span>TASK OUTCOME VERIFIED</span>
                </div>
                <p className="font-tech text-xs text-emerald-100/90 leading-relaxed">
                  {currentDisplayTask.resultSummary}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 text-amber-500/60 font-mono-code text-xs space-y-2">
            <CheckSquare className="w-10 h-10 text-amber-500/40" />
            <p>Select a task or formulate a new goal with the input panel.</p>
          </div>
        )}
      </div>
    </div>
  );
};
