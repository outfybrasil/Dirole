import React, { useState } from 'react';
import { VibeType } from '../types';
import { triggerHaptic } from '../services/mockService';

interface VibeMatchModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectVibe: (vibe: VibeType) => void;
    currentVibe?: VibeType | null;
}

export const VibeMatchModal: React.FC<VibeMatchModalProps> = ({ isOpen, onClose, onSelectVibe, currentVibe }) => {
    const [selectedVibe, setSelectedVibe] = useState<VibeType | null>(currentVibe || null);

    if (!isOpen) return null;

    const vibes = [
        { type: VibeType.DANCE, icon: '🕺', label: 'Dançar', color: 'from-purple-500 to-pink-500', description: 'Quero pista!' },
        { type: VibeType.DRINK, icon: '🍻', label: 'Beber', color: 'from-amber-500 to-orange-500', description: 'Resenha e drinks' },
        { type: VibeType.FLIRT, icon: '💘', label: 'Paquerar', color: 'from-rose-500 to-red-500', description: 'Conhecer gente nova' },
    ];

    const handleSelect = (vibe: VibeType) => {
        triggerHaptic();
        setSelectedVibe(vibe);
        onSelectVibe(vibe);
        setTimeout(() => onClose(), 300);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-md w-full border border-white/10 shadow-2xl animate-slideUp">

                {/* Header */}
                <div className="text-center mb-8">
                    <h2 className="text-3xl font-black text-white mb-2">Qual sua vibe hoje?</h2>
                    <p className="text-sm text-slate-400">Vamos te mostrar onde tem gente com a mesma energia</p>
                </div>

                {/* Vibe Options */}
                <div className="space-y-4 mb-6">
                    {vibes.map((vibe) => (
                        <button
                            key={vibe.type}
                            onClick={() => handleSelect(vibe.type)}
                            className={`w-full p-6 rounded-2xl border-2 transition-all transform hover:scale-105 active:scale-95 ${selectedVibe === vibe.type
                                    ? `bg-gradient-to-r ${vibe.color} border-white shadow-[0_0_30px_rgba(255,255,255,0.3)]`
                                    : 'bg-white/5 border-white/10 hover:border-white/30'
                                }`}
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-5xl">{vibe.icon}</span>
                                <div className="text-left flex-1">
                                    <h3 className="text-xl font-black text-white">{vibe.label}</h3>
                                    <p className="text-xs text-slate-300">{vibe.description}</p>
                                </div>
                                {selectedVibe === vibe.type && (
                                    <i className="fas fa-check-circle text-2xl text-white"></i>
                                )}
                            </div>
                        </button>
                    ))}
                </div>

                {/* Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                        <i className="fas fa-info-circle text-blue-400 mt-0.5"></i>
                        <p className="text-xs text-blue-300 leading-relaxed">
                            Sua vibe fica ativa por <strong>6 horas</strong>. Vamos mostrar quantas pessoas com a mesma vibe estão em cada local.
                        </p>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all"
                >
                    Fechar
                </button>
            </div>
        </div>
    );
};
