import React from 'react';
import { User } from '../types';

interface DataPrivacyModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
}

export const DataPrivacyModal: React.FC<DataPrivacyModalProps> = ({ isOpen, onClose, currentUser }) => {
    if (!isOpen || !currentUser) return null;

    return (
        <div className="fixed inset-0 z-[702] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh] overflow-hidden relative isolate">

                {/* Grabber */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                {/* Header */}
                <div className="p-8 pt-10 pb-6 relative z-10 flex justify-between items-center bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <i className="fas fa-database"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white leading-tight tracking-tight uppercase italic">Meus Dados</h2>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Transparência LGPD</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-8 py-4 custom-scrollbar">
                    <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                        Conforme a Lei Geral de Proteção de Dados (LGPD), você tem total acesso aos dados que armazenamos sobre você.
                    </p>

                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Identificador Único (ID)</label>
                            <code className="text-xs text-dirole-primary font-mono block break-all">{currentUser.id}</code>
                        </div>

                        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nome de Exibição</label>
                            <p className="text-sm text-white font-bold">{currentUser.name}</p>
                        </div>

                        {currentUser.email && (
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">E-mail Cadastrado</label>
                                <p className="text-sm text-white font-bold">{currentUser.email}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Status</label>
                                <span className="text-xs font-black text-green-400 uppercase bg-green-400/10 px-2 py-1 rounded-md">Ativo</span>
                            </div>
                            <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Nível</label>
                                <span className="text-xs font-black text-yellow-400 uppercase bg-yellow-400/10 px-2 py-1 rounded-md">Level {currentUser.level}</span>
                            </div>
                        </div>

                        <div className="border-t border-white/5 pt-4 mt-4">
                            <a
                                href="mailto:privacidade@dirole.app?subject=Solicitação de Dados - Dirole"
                                className="flex items-center justify-center gap-2 w-full bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 font-black py-4 rounded-2xl transition-all text-[10px] uppercase tracking-widest border border-blue-500/20"
                            >
                                <i className="fas fa-file-export"></i> Solicitar Cópia Completa
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
