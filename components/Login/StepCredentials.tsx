import React, { useState } from 'react';

interface StepCredentialsProps {
    email: string;
    setEmail: (v: string) => void;
    pass: string;
    setPass: (v: string) => void;
    confirmPass: string;
    setConfirmPass: (v: string) => void;
    acceptedTerms: boolean;
    setAcceptedTerms: (v: boolean) => void;
    onOpenPrivacy: () => void;
    onNext: () => void;
    onBack: () => void;
}

export const StepCredentials: React.FC<StepCredentialsProps> = ({
    email, setEmail,
    pass, setPass,
    confirmPass, setConfirmPass,
    acceptedTerms, setAcceptedTerms,
    onOpenPrivacy,
    onNext, onBack
}) => {
    const [showPass, setShowPass] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-dirole-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dirole-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                    <i className="fas fa-key text-2xl text-dirole-primary"></i>
                </div>
                <h3 className="text-xl font-bold text-white">Criar Acesso</h3>
                <p className="text-slate-400 text-xs">Comece com seu email e uma senha segura.</p>
            </div>

            <div className="space-y-3">
                <div className="relative group">
                    <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-primary transition-colors"></i>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Seu melhor Email"
                        required
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600"
                    />
                </div>

                <div className="relative group">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-primary transition-colors"></i>
                    <input
                        type={showPass ? "text" : "password"}
                        value={pass}
                        onChange={(e) => setPass(e.target.value)}
                        placeholder="Senha (mín. 8 caracteres)"
                        required
                        minLength={8}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-12 text-white focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPass(!showPass)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none"
                    >
                        <i className={`fas ${showPass ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                    </button>
                </div>

                <div className="relative group">
                    <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-primary transition-colors"></i>
                    <input
                        type={showPass ? "text" : "password"}
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="Confirmar Senha"
                        required
                        minLength={8}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600"
                    />
                </div>
            </div>

            {/* LGPD Consent */}
            <div className="flex items-start gap-4 px-2 py-4 mt-2 bg-white/5 rounded-2xl border border-white/5">
                <div className="pt-1">
                    <input
                        type="checkbox"
                        id="terms"
                        checked={acceptedTerms}
                        onChange={(e) => setAcceptedTerms(e.target.checked)}
                        className="w-5 h-5 rounded border-white/30 bg-black/30 accent-dirole-primary cursor-pointer transition-all"
                    />
                </div>
                <label htmlFor="terms" className="text-[10px] text-slate-400 font-medium leading-relaxed cursor-pointer select-none">
                    Li e concordo com os <button type="button" onClick={onOpenPrivacy} className="text-dirole-primary hover:underline font-black uppercase">Termos de Uso e Política de Privacidade</button> do Dirole. Autorizo o tratamento dos meus dados para fins de funcionamento da plataforma.
                </label>
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all text-sm"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={!acceptedTerms}
                    className="flex-[2] bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-sm disabled:opacity-50 disabled:grayscale"
                >
                    Próximo
                </button>
            </div>
        </form>
    );
};
