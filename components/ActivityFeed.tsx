import React from 'react';

export const ActivityFeed: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center py-24 px-8 text-center animate-fade-in">
            <div className="relative mb-10">
                <div className="w-24 h-24 bg-gradient-to-br from-dirole-primary/20 to-dirole-secondary/20 rounded-[2rem] flex items-center justify-center text-4xl shadow-[0_0_50px_rgba(139,92,246,0.1)] rotate-12">
                    ⚡
                </div>
                <div className="absolute -bottom-2 -left-2 w-10 h-10 bg-[#0f0518] border border-white/10 rounded-full flex items-center justify-center text-lg animate-pulse">
                    📡
                </div>
            </div>

            <h3 className="text-2xl font-black text-white mb-3 tracking-tight uppercase italic">Pulso da Cidade</h3>
            <p className="text-slate-500 text-center max-w-[260px] mb-8 font-bold text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                Em breve você poderá acompanhar cada check-in, review e foto da galera em tempo real.
            </p>

            <div className="px-6 py-3 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-dirole-primary animate-ping"></div>
                <span className="text-[10px] font-black text-dirole-primary uppercase tracking-widest">Sincronizando Motores</span>
            </div>
        </div>
    );
};
