import React, { useState } from 'react';
import { sendVerificationEmail, signOut } from '../services/authService';
import { triggerHaptic } from '../services/mockService';

interface VerificationPendingScreenProps {
    email: string;
    onVerified: () => void;
}

export const VerificationPendingScreen: React.FC<VerificationPendingScreenProps> = ({ email, onVerified }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    const handleResend = async () => {
        setIsLoading(true);
        triggerHaptic();
        try {
            await sendVerificationEmail();
            setMessage("E-mail reenviado com sucesso! Verifique sua caixa de entrada.");
        } catch (error) {
            console.error(error);
            setMessage("Erro ao reenviar e-mail. Tente novamente mais tarde.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = async () => {
        triggerHaptic();
        await signOut();
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-[#0f0518] overflow-y-auto flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none"></div>

            <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 text-center animate-slide-up shadow-2xl backdrop-blur-md relative z-10">
                <div className="w-20 h-20 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-yellow-500/50 animate-pulse">
                    <i className="fas fa-exclamation-triangle text-4xl text-yellow-500"></i>
                </div>

                <h2 className="text-2xl font-bold text-white mb-2">Verificação Necessária</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Para acessar o Dirole, você precisa verificar seu e-mail.<br />
                    Enviamos um link para:<br />
                    <span className="text-white font-bold block mt-1 text-lg">{email}</span>
                </p>

                {message && (
                    <div className={`mb-6 p-3 rounded-xl text-xs font-bold ${message.includes('Sucesso') ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                        {message}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-dirole-primary hover:bg-dirole-primary/80 text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-95"
                    >
                        Já verifiquei!
                    </button>

                    <button
                        onClick={handleResend}
                        disabled={isLoading}
                        className="w-full bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50"
                    >
                        {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Reenviar E-mail'}
                    </button>

                    <button
                        onClick={handleLogout}
                        className="w-full text-slate-500 text-xs py-2 hover:text-white transition-colors"
                    >
                        Sair / Trocar Conta
                    </button>
                </div>
            </div>
        </div>
    );
};
