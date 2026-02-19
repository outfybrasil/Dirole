import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface RateAppModalProps {
    isOpen: boolean;
    onClose: () => void;
    onRate: () => void;
    onFeedback: () => void;
}

export const RateAppModal: React.FC<RateAppModalProps> = ({ isOpen, onClose, onRate, onFeedback }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-[#1a0b2e] border border-white/10 rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl"
            >
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg animate-pulse">
                        <i className="fas fa-star text-3xl text-white"></i>
                    </div>

                    <h2 className="text-2xl font-black text-white italic mb-2">Curtindo o Dirole?</h2>
                    <p className="text-slate-300 text-sm mb-6 leading-relaxed">
                        Sua avaliação nos ajuda a descobrir e lotar mais rolês por aí! Que tal dar uma força?
                    </p>

                    <button
                        onClick={onRate}
                        className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-4 rounded-xl mb-3 shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                    >
                        <i className="fab fa-google-play"></i>
                        AVALIAR AGORA
                    </button>

                    <button
                        onClick={onFeedback}
                        className="w-full bg-white/5 text-white font-bold py-3 rounded-xl mb-3 border border-white/10 active:scale-95 transition-transform"
                    >
                        Quero sugerir melhorias
                    </button>

                    <button
                        onClick={onClose}
                        className="text-slate-500 text-xs font-bold uppercase tracking-widest py-2 active:opacity-70"
                    >
                        Agora não
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
