
// ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 bg-[#0f0518] text-white flex flex-col items-center justify-center p-6 text-center z-[9999]">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <i className="fas fa-bug text-4xl text-red-500"></i>
                    </div>
                    <h1 className="text-2xl font-black mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-slate-400 mb-8 max-w-xs text-sm">
                        Tivemos um problema técnico inesperado. Nossa equipe já foi notificada.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-white text-black font-black rounded-xl hover:bg-slate-200 active:scale-95 transition-all text-sm uppercase tracking-wider"
                    >
                        Reiniciar App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
