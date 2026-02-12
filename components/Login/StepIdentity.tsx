import React, { useState } from 'react';

// Reusing avatars from LoginScreen
const AVATARS = ['😎', '👽', '👾', '🦊', '🐯', '🦁', '🐷', '🦄', '🐝', '🤠', '🥳', '💃', '🕺', '🍻', '🌮', '🔥'];

interface StepIdentityProps {
    nickname: string;
    setNickname: (v: string) => void;
    avatar: string;
    setAvatar: (v: string) => void;
    setAvatarFile: (f: File | null) => void;
    onSubmit: () => void;
    onBack: () => void;
    isLoading: boolean;
}

export const StepIdentity: React.FC<StepIdentityProps> = ({
    nickname, setNickname,
    avatar, setAvatar,
    setAvatarFile,
    onSubmit, onBack,
    isLoading
}) => {
    const [mode, setMode] = useState<'emoji' | 'photo'>('emoji');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                alert('Arquivo muito grande! Máximo 5MB.');
                return;
            }


            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setAvatarFile(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit();
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
            <div className="text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-tr from-dirole-primary to-dirole-secondary rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-white shadow-[0_0_20px_rgba(139,92,246,0.5)] overflow-hidden relative">
                    {mode === 'photo' && previewUrl ? (
                        <img src={previewUrl} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-4xl filter drop-shadow no-clip">{avatar}</span>
                    )}
                </div>
                <h3 className="text-xl font-bold text-white">Sua Identidade</h3>
                <p className="text-slate-400 text-xs">Como a galera vai te conhecer.</p>
            </div>

            <div className="space-y-4">
                <div className="relative group">
                    <i className="fas fa-at absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-dirole-primary transition-colors"></i>
                    <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder="Apelido (ex: Rei do Camarote)"
                        required
                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3.5 pl-12 pr-4 text-white focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary focus:outline-none backdrop-blur-sm transition-all text-sm placeholder:text-slate-600 font-bold"
                    />
                </div>

                <div>
                    <div className="flex justify-center gap-4 mb-3">
                        <button
                            type="button"
                            onClick={() => { setMode('emoji'); setAvatarFile(null); }}
                            className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${mode === 'emoji' ? 'bg-white text-black' : 'bg-white/10 text-slate-400'}`}
                        >
                            Escolher Avatar
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode('photo')}
                            className={`text-xs font-bold px-4 py-2 rounded-full transition-all ${mode === 'photo' ? 'bg-white text-black' : 'bg-white/10 text-slate-400'}`}
                        >
                            Enviar Foto
                        </button>
                    </div>

                    {mode === 'emoji' ? (
                        <div className="grid grid-cols-4 gap-2 sm:gap-3 p-2 bg-black/20 rounded-2xl border border-white/5 max-h-48 overflow-y-auto no-scrollbar animate-fade-in">
                            {AVATARS.map(av => (
                                <button
                                    key={av}
                                    type="button"
                                    onClick={() => setAvatar(av)}
                                    className={`aspect-square rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all ${avatar === av ? 'bg-dirole-primary scale-110 border-2 border-white shadow-lg' : 'bg-white/5 hover:bg-white/10 border border-white/5'}`}
                                >
                                    {av}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-black/20 rounded-2xl border border-white/5 p-6 flex flex-col items-center justify-center gap-4 animate-fade-in border-dashed min-h-[140px]">
                            {previewUrl ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-dirole-primary shadow-lg">
                                        <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                    </div>
                                    <p className="text-xs text-green-400 font-bold">✓ Imagem selecionada</p>
                                    <label className="text-xs text-slate-400 cursor-pointer hover:text-white transition-colors underline">
                                        <span>Trocar imagem</span>
                                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                    </label>
                                </div>
                            ) : (
                                <>
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                                        <i className="fas fa-cloud-upload-alt text-slate-400"></i>
                                    </div>
                                    <div className="text-center">
                                        <label className="block text-sm font-bold text-white cursor-pointer hover:text-dirole-primary transition-colors">
                                            <span>Clique para carregar</span>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                        </label>
                                        <p className="text-xs text-slate-500 mt-1">PNG, JPG até 5MB</p>
                                        <p className="text-[10px] text-green-400 mt-1 font-bold">Alta qualidade</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isLoading}
                    className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all text-sm disabled:opacity-50"
                >
                    Voltar
                </button>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-[2] bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:grayscale"
                >
                    {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : (
                        <>
                            <span>Finalizar</span>
                            <i className="fas fa-check"></i>
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
