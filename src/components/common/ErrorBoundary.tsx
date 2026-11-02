import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Terminal } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full min-h-screen bg-[#030712] flex items-center justify-center p-6 text-slate-100">
          <div className="max-w-xl w-full bg-slate-950 border border-rose-900/60 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-800">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">System Runtime Exception</h2>
                <p className="text-xs text-slate-400 font-mono">Telemetry recovered before unmount</p>
              </div>
            </div>

            <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800 font-mono text-xs text-rose-300 space-y-1 overflow-x-auto">
              <div className="font-semibold text-rose-400">
                {this.state.error?.name}: {this.state.error?.message}
              </div>
              {this.state.errorInfo?.componentStack && (
                <pre className="text-[10px] text-slate-400 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                <span>Isolated by Neural Barrier</span>
              </span>
              <button
                onClick={this.handleReset}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium text-xs shadow-lg transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
