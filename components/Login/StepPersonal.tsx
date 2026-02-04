import React, { useState, useMemo } from 'react';

interface StepPersonalProps {
    name: string;
    setName: (v: string) => void;
    birthYear: string;
    setBirthYear: (v: string) => void;
    gender: string;
    setGender: (v: string) => void;
    onNext: () => void;
    onBack: () => void;
}

export const StepPersonal: React.FC<StepPersonalProps> = ({
    name, setName,
    birthYear, setBirthYear,
    gender, setGender,
    onNext, onBack
}) => {
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const isUnderage = useMemo(() => {
        if (birthYear.length !== 4) return false;
        const year = parseInt(birthYear);
        if (isNaN(year)) return false;

        const currentYear = new Date().getFullYear();
        return (currentYear - year) < 18;
    }, [birthYear]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(null);

        if (!name.trim()) {
            setErrorMsg("O nome é obrigatório.");
            return;
        }

        if (birthYear.length !== 4) {
            setErrorMsg("Insira um ano válido (4 dígitos).");
            return;
        }

        if (isUnderage) {
            setErrorMsg("Você precisa ter pelo menos 18 anos.");
            return;
        }

        onNext();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 animate-fade-in">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-dirole-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-dirole-secondary/50 shadow-[0_0_15px_rgba(251,146,60,0.3)]">
                    <i className="fas fa-user text-2xl text-dirole-secondary"></i>
                </div>
                <h3 className="text-xl font-bold text-white">Sobre Você</h3>
                <p className="text-slate-400 text-xs">Precisamos saber quem você é.</p>
            </div>

            <div className="space-y-3">
                <div className="relative group">
                    <i className="fas fa-signature absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-secondary transition-colors"></i>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nome Completo"
                        required
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-secondary focus:ring-1 focus:ring-dirole-secondary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600"
                    />
                </div>

                <div className="relative group">
                    <i className="fas fa-calendar-alt absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-secondary transition-colors"></i>
                    <input
                        type="number"
                        value={birthYear}
                        onChange={(e) => setBirthYear(e.target.value.slice(0, 4))}
                        placeholder="Ano de Nascimento (ex: 2000)"
                        required
                        min="1900"
                        max={new Date().getFullYear()}
                        className={`w-full bg-black/30 border ${isUnderage ? 'border-red-500' : 'border-white/10'} rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-secondary focus:ring-1 focus:ring-dirole-secondary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600 appearance-none`}
                    />
                    {isUnderage && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">Menor de 18</span>}
                </div>

                <div className="relative group">
                    <i className="fas fa-venus-mars absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-secondary transition-colors"></i>
                    <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-secondary focus:ring-1 focus:ring-dirole-secondary focus:outline-none appearance-none backdrop-blur-sm transition-all text-sm"
                    >
                        <option value="Outro">Outro / Prefiro não dizer</option>
                        <option value="Masculino">Masculino</option>
                        <option value="Feminino">Feminino</option>
                    </select>
                    <i className="fas fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none"></i>
                </div>
            </div>

            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl animate-shake">
                    <p className="text-red-400 text-xs font-bold text-center">{errorMsg}</p>
                </div>
            )}

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
                    className="flex-[2] bg-gradient-to-r from-dirole-secondary to-orange-500 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all text-sm"
                >
                    Próximo
                </button>
            </div>
        </form>
    );
};
