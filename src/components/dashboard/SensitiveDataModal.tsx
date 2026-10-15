import React from 'react';
import { ShieldAlert, Check, X, AlertTriangle } from 'lucide-react';

interface SensitiveDataModalProps {
  isOpen: boolean;
  actionTitle: string;
  actionDetails: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const SensitiveDataModal: React.FC<SensitiveDataModalProps> = ({
  isOpen,
  actionTitle,
  actionDetails,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0a0c10] border border-amber-500/50 rounded-xl p-6 space-y-5 shadow-[0_0_40px_rgba(245,158,11,0.25)]">
        <div className="flex items-center space-x-3 pb-3 border-b border-amber-500/20">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono-code text-amber-400 uppercase tracking-widest block font-bold">
              POLICY // ASK EACH TIME
            </span>
            <h3 className="font-heading text-lg font-bold text-amber-200">
              {actionTitle}
            </h3>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-black/60 border border-amber-500/20 text-xs font-tech text-amber-100/90 leading-relaxed">
          {actionDetails}
        </div>

        <div className="p-2.5 rounded bg-amber-500/10 border border-amber-500/20 text-[11px] font-mono-code text-amber-300/80">
          SHELBY does not retain sensitive credentials or execute unauthorized operations.
        </div>

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-black/60 hover:bg-black/90 text-amber-400 border border-amber-500/30 font-mono-code text-xs transition-all flex items-center space-x-1"
          >
            <X className="w-3.5 h-3.5" />
            <span>Deny Permission</span>
          </button>

          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)] flex items-center space-x-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Authorize Action</span>
          </button>
        </div>
      </div>
    </div>
  );
};
