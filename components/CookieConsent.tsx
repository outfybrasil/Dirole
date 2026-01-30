
import React, { useState, useEffect } from 'react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('dirole_lgpd_consent');
        if (!consent) {
            // Show after a small delay for better UX
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('dirole_lgpd_consent', 'accepted');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-6 left-6 right-6 z-[10000] animate-slide-up">
            <div className="bg-[#1a0b2e]/95 backdrop-blur-xl border border-white/10 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sm:flex-row items-center gap-6 max-w-4xl mx-auto">
                <div className="flex-1 space-y-2 text-center sm:text-left">
                    <h3 className="text-white font-black text-sm uppercase tracking-widest flex items-center justify-center sm:justify-start gap-2">
                        <i className="fas fa-shield-alt text-dirole-primary"></i>
                        Privacidade & LGPD
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
                        UTILIZAMOS COOKIES E SUA LOCALIZAÇÃO PARA O "TERMÔMETRO DO ROLÊ". AO CONTINUAR, VOCÊ CONCORDA COM NOSSA <span className="text-white border-b border-white/20">POLÍTICA DE PRIVACIDADE</span>.
                    </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={handleAccept}
                        className="flex-1 sm:px-8 py-3.5 bg-white text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-200 active:scale-95 transition-all shadow-lg"
                    >
                        Aceitar
                    </button>
                </div>
            </div>
        </div>
    );
};
