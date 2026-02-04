import React, { useEffect } from 'react';

export interface ToastData {
    id: string;
    title: string;
    message: string;
    type: 'invite' | 'friend_request' | 'success' | 'info' | 'error' | 'system';
    action?: () => void;
    actionLabel?: string;
}

interface InAppToastProps {
    toast: ToastData;
    onClose: (id: string) => void;
}

export const InAppToast: React.FC<InAppToastProps> = ({ toast, onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose(toast.id);
        }, 6000);
        return () => clearTimeout(timer);
    }, [toast.id, onClose]);

    const getIcon = () => {
        switch (toast.type) {
            case 'invite': return '📩';
            case 'friend_request': return '👥';
            case 'success': return '✅';
            case 'error': return '❌';
            case 'system': return '⚙️';
            default: return '🔔';
        }
    };

    return (
        <div className="fixed top-[max(1.5rem,env(safe-area-inset-top))] left-4 right-4 z-[9999] animate-slide-down pointer-events-auto">
            <div
                className="bg-[#1a0b2e]/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4 transition-all active:scale-95"
                onClick={() => onClose(toast.id)}
            >
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-dirole-primary/20 to-dirole-secondary/20 flex items-center justify-center text-2xl shadow-inner">
                    {getIcon()}
                </div>

                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-black text-white leading-tight uppercase tracking-tight italic">{toast.title}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 line-clamp-1">
                        {toast.message}
                    </p>
                </div>

                {toast.action && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            toast.action?.();
                            onClose(toast.id);
                        }}
                        className="bg-dirole-primary text-white text-[10px] font-black px-4 py-2 rounded-xl shadow-lg shadow-purple-900/40 uppercase tracking-widest whitespace-nowrap"
                    >
                        {toast.actionLabel || 'VER'}
                    </button>
                )}
            </div>
        </div>
    );
};
