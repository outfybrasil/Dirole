import React from 'react';
import { Smartphone, Download, X } from 'lucide-react';

interface PWAInstallBannerProps {
    onInstall: () => void;
    onDismiss: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall, onDismiss }) => {
    return (
        <div className="fixed bottom-28 left-4 right-4 z-[100] animate-slide-up">
            <div className="glass-panel p-5 rounded-[2rem] flex items-center justify-between gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                {/* Background Glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 to-transparent opacity-50"></div>

                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 to-pink-500 p-0.5 shadow-lg flex-shrink-0 animate-pulse">
                        <div className="w-full h-full rounded-[0.9rem] bg-[#0f0518] flex items-center justify-center">
                            <Smartphone className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-black italic uppercase tracking-tight text-white leading-tight">
                            Instalar Dirole App
                        </h4>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                            Melhor experiência no mobile
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 relative z-10">
                    <button
                        onClick={onInstall}
                        className="px-5 py-2.5 bg-white text-black text-[10px] font-black italic uppercase rounded-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
                    >
                        <Download className="w-3.5 h-3.5" />
                        INSTALAR
                    </button>
                    <button
                        onClick={onDismiss}
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PWAInstallBanner;
