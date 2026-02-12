import React, { useState } from 'react';
import { triggerHaptic } from '../services/mockService';

interface SOSModalProps {
    isOpen: boolean;
    onClose: () => void;
    userLat: number;
    userLng: number;
}

export const SOSModal: React.FC<SOSModalProps> = ({ isOpen, onClose, userLat, userLng }) => {
    if (!isOpen) return null;

    const handleAction = (type: string) => {
        triggerHaptic([50, 50, 50]);
        let query = '';

        switch (type) {
            case 'pharmacy':
                query = 'farmácia 24h';
                break;
            case 'food':
                query = 'fast food aberto agora';
                break;
            case 'home':
                // Uber deep link to take me home (concept)
                // Since we don't have user address, we open Uber generic
                window.open('https://m.uber.com/ul/?action=setPickup&client_id=&pickup=my_location', '_blank');
                return;
        }

        if (query) {
            // Search on Google Maps generic since we want reliable emergency info
            window.open(`https://www.google.com/maps/search/${encodeURIComponent(query)}/@${userLat},${userLng},15z`, '_blank');
        }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-red-900/80 backdrop-blur-sm animate-fade-in" onClick={onClose}></div>

            <div className="relative w-full max-w-sm bg-dirole-bg border-2 border-red-500 rounded-3xl p-6 shadow-[0_0_50px_rgba(239,68,68,0.5)] animate-slide-up overflow-hidden">

                {/* Sirene Effect Background */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-500 animate-pulse"></div>

                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce shadow-lg shadow-red-500/50">
                        <i className="fas fa-kit-medical text-4xl text-white"></i>
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Modo S.O.S</h2>
                    <p className="text-red-200 text-sm">O rolê deu ruim? A gente te salva.</p>
                </div>

                <div className="space-y-3">
                    <button
                        onClick={() => handleAction('food')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl flex items-center gap-4 transition-colors group border border-white/5 active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-full bg-yellow-500/20 text-yellow-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fas fa-burger"></i>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold">Larica Agora</h3>
                            <p className="text-[10px] text-slate-400">Achar comida aberta</p>
                        </div>
                        <i className="fas fa-chevron-right ml-auto opacity-50"></i>
                    </button>

                    <button
                        onClick={() => handleAction('pharmacy')}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white p-4 rounded-xl flex items-center gap-4 transition-colors group border border-white/5 active:scale-95"
                    >
                        <div className="w-10 h-10 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fas fa-pills"></i>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold">Farmácia / Engov</h3>
                            <p className="text-[10px] text-slate-400">Remédio pra ressaca</p>
                        </div>
                        <i className="fas fa-chevron-right ml-auto opacity-50"></i>
                    </button>

                    <button
                        onClick={() => handleAction('home')}
                        className="w-full bg-white hover:bg-slate-200 text-black p-4 rounded-xl flex items-center gap-4 transition-colors group shadow-lg active:scale-95 border-b-4 border-slate-300"
                    >
                        <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                            <i className="fas fa-car"></i>
                        </div>
                        <div className="text-left">
                            <h3 className="font-bold">Me Tira Daqui</h3>
                            <p className="text-[10px] text-slate-600">Chamar Uber pra casa</p>
                        </div>
                        <i className="fas fa-chevron-right ml-auto opacity-50"></i>
                    </button>
                </div>

                <button onClick={onClose} className="mt-6 w-full py-3 text-slate-400 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors">
                    Cancelar e Voltar pro Rolê
                </button>

            </div>
        </div>
    );
};
