import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('SHELBY Fatal Catch:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen w-screen bg-[#050608] flex items-center justify-center p-6 text-amber-100 font-sans select-none">
          <div className="max-w-md w-full bg-[#0a0c10] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-[0_0_40px_rgba(245,158,11,0.25)] text-center">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center mx-auto text-amber-400 font-mono-code font-bold text-xl">
              !
            </div>
            <h2 className="font-heading text-xl font-bold text-amber-300">
              SHELBY RECOVERY SYSTEM
            </h2>
            <p className="text-xs font-tech text-amber-200/80 leading-relaxed">
              A runtime exception was safely intercepted by SHELBY governance.
            </p>
            <div className="p-3 bg-black/80 rounded border border-amber-500/20 text-left font-mono-code text-[11px] text-amber-400 overflow-x-auto max-h-32">
              {this.state.error?.message || 'Unknown state anomaly'}
            </div>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-tech font-bold text-xs tracking-wider transition-all"
            >
              RESET TELEMETRY & RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
