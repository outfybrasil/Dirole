import React, { useState } from 'react';
import { triggerHaptic } from '../services/mockService';

interface OnboardingModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const STEPS = [
    {
        title: "BEM-VINDO AO DIROLE",
        subtitle: "O Radar oficial da curtição",
        description: "Descubra o que está acontecendo nos melhores lugares da cidade em tempo real. Sem fakes, só a real da galera.",
        icon: "🚀",
        color: "from-dirole-primary to-dirole-secondary"
    },
    {
        title: "TERMÔMETRO SOCIAL",
        subtitle: "Como está o rolê agora?",
        description: "Veja a Vibe, os Preços e a Lotação de cada lugar antes de sair de casa. Economize tempo e dinheiro.",
        icon: "🔥",
        color: "from-orange-500 to-rose-600"
    },
    {
        title: "CONECTE-SE",
        subtitle: "Sua elite reunida",
        description: "Adicione seus amigos via QR Code e veja em qual rolê eles deram check-in. Nunca mais perca um encontro.",
        icon: "🤝",
        color: "from-blue-500 to-indigo-600"
    },
    {
        title: "GANHE RECOMPENSAS",
        subtitle: "Suba de nível",
        description: "Dê check-in, avalie os locais e ganhe XP. Desbloqueie medalhas exclusivas e domine o ranking da cidade.",
        icon: "🏆",
        color: "from-yellow-400 to-orange-500"
    }
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);

    if (!isOpen) return null;

    const handleNext = () => {
        triggerHaptic();
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            localStorage.setItem('dirole_onboarding_seen', 'true');
            onClose();
        }
    };

    const step = STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 sm:p-0">
            <div className="absolute inset-0 bg-[#0f0518]/95 backdrop-blur-xl animate-fade-in"></div>

            <div className="relative w-full max-w-sm flex flex-col items-center text-center animate-scale-in">
                <div className={`w-32 h-32 rounded-[2.5rem] bg-gradient-to-br ${step.color} flex items-center justify-center text-6xl shadow-2xl mb-10 transform transition-all duration-500 scale-110`}>
                    {step.icon}
                </div>

                <div className="space-y-4 mb-12">
                    <h2 className="text-3xl font-black italic tracking-tighter text-white">
                        {step.title}
                    </h2>
                    <p className="text-dirole-primary font-black uppercase tracking-[0.2em] text-[10px]">
                        {step.subtitle}
                    </p>
                    <p className="text-slate-400 text-sm leading-relaxed font-medium px-4">
                        {step.description}
                    </p>
                </div>

                <div className="flex gap-2 mb-12">
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-dirole-primary' : 'w-2 bg-white/10'}`}
                        ></div>
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-[0.2em] hover:bg-slate-200"
                >
                    {currentStep === STEPS.length - 1 ? 'Bora pro Rolê!' : 'Próximo'}
                </button>

                {currentStep < STEPS.length - 1 && (
                    <button
                        onClick={() => {
                            localStorage.setItem('dirole_onboarding_seen', 'true');
                            onClose();
                        }}
                        className="mt-6 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                        Pular Introdução
                    </button>
                )}
            </div>
        </div>
    );
};
