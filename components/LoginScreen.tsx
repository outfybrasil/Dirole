import React, { useState } from 'react';
import { signUpWithEmail, signInWithEmail, signInWithGoogle, getCurrentSession, sendVerificationEmail } from '../services/authService';
import { saveUserProfileLocal, triggerHaptic, syncUserProfile, isNicknameAvailable } from '../services/mockService';
import { User } from '../types';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { RegisterWizard } from './Login/RegisterWizard';

interface LoginScreenProps {
    onLoginSuccess: (user: User) => void;
    isModal?: boolean;
    onClose?: () => void;
}

const AVATARS = ['😎', '👽', '👾', '🦊', '🐯', '🦁', '🐷', '🦄', '🐝', '🤠', '🥳', '💃', '🕺', '🍻', '🌮', '🔥'];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, isModal = false, onClose }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);

    // Form Fields
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('Prefiro não dizer');
    const [avatar, setAvatar] = useState('😎');
    const [guestName, setGuestName] = useState('');
    const [isGuestInputVisible, setIsGuestInputVisible] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // EULA
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    const resetForm = () => {
        setErrorMsg(null);
        setPassword('');
        setConfirmPassword('');
        setIsLoading(false);
        setIsSuccess(false);
        setAcceptedTerms(false);
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);
        try {
            await signInWithEmail(email.trim(), password);
            const session = await getCurrentSession();

            // CHECK VERIFICATION
            if (session && session.emailVerification === false) {
                window.location.reload(); // App.tsx will catch this and show VerificationScreen
                return;
            }

            if (session) {
                const user = await syncUserProfile(session.userId, { email: session.email, name: session.name });
                if (user) {
                    onLoginSuccess(user);
                } else {
                    setErrorMsg("Erro ao sincronizar perfil.");
                }
            }
        } catch (error: any) {
            console.error("[Login] Error:", error);
            if (error.code === 401 || error.type === 'user_invalid_credentials') {
                setErrorMsg("Senha incorreta ou usuário não encontrado.");
            } else if (error.code === 429) {
                setErrorMsg("Muitas tentativas. Tente novamente mais tarde.");
            } else {
                setErrorMsg(error.message || "Erro ao fazer login.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setErrorMsg(null);

        if (!acceptedTerms) {
            setErrorMsg("Você deve aceitar os Termos de Uso.");
            setIsLoading(false);
            return;
        }

        if (!name || !nickname || !age || !email || !password || !confirmPassword) {
            setErrorMsg("Preencha todos os campos obrigatórios.");
            setIsLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setErrorMsg("As senhas não coincidem.");
            setIsLoading(false);
            return;
        }

        try {
            // Check nickname uniqueness
            const available = await isNicknameAvailable(nickname);
            if (!available) {
                setErrorMsg("Este apelido já está em uso. Escolha outro.");
                setIsLoading(false);
                return;
            }

            await signUpWithEmail(email, password, name);

            // Send verification email immediately
            await sendVerificationEmail();

            // Sync profile explicitly before reload (optional but good for data consistency)
            const session = await getCurrentSession();
            if (session) {
                await syncUserProfile(session.userId, {
                    name,
                    nickname,
                    email,
                    avatar,
                    gender
                });
            }

            // Reload to force App.tsx to see the unverified session and block access
            window.location.reload();

        } catch (error: any) {
            console.error(error);
            if (error.message?.includes("already registered") || error.code === 409) {
                setErrorMsg("Este e-mail já está cadastrado. Tente fazer login.");
            } else if (error.message?.includes("Password") || error.code === 400) {
                setErrorMsg("A senha deve ter pelo menos 8 caracteres.");
            } else {
                setErrorMsg(error.message || "Erro ao criar conta.");
            }
            setIsLoading(false);
        }
    };

    const handleGuestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!guestName.trim()) return;

        if (!acceptedTerms) {
            setErrorMsg("Você deve aceitar os Termos de Uso.");
            return;
        }

        triggerHaptic();
        const guestUser = saveUserProfileLocal(guestName.trim(), '😎');
        onLoginSuccess(guestUser);
    };

    if (isSuccess) {
        return (
            <div className={`${isModal ? 'relative w-full h-full bg-[#0f0518] rounded-[2.5rem] overflow-hidden' : 'fixed inset-0 z-[9999] bg-[#0f0518] overflow-y-auto'}`}>
                {/* Background Fixo/Absoluto */}
                <div className={`${isModal ? 'absolute' : 'fixed'} inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 pointer-events-none`}></div>

                <div className="min-h-full w-full flex flex-col items-center justify-center p-6 relative z-10">
                    <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 text-center animate-slide-up shadow-2xl backdrop-blur-md">
                        <div className="w-20 h-20 bg-dirole-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-dirole-primary/50">
                            <i className="fas fa-envelope-open-text text-4xl text-dirole-primary"></i>
                        </div>

                        <h2 className="text-2xl font-bold text-white mb-2">Verifique seu E-mail!</h2>
                        <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                            Enviamos um link de confirmação para:<br />
                            <span className="text-white font-bold block mt-1 text-lg">{email}</span>
                        </p>

                        <button
                            onClick={() => { setIsSuccess(false); setIsRegistering(false); }}
                            className="w-full bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 transition-all"
                        >
                            Voltar para Login
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const handleGoogleLogin = async () => {
        try {
            setIsLoading(true);
            triggerHaptic();
            await signInWithGoogle();
        } catch (error: any) {
            console.error("Google Login Error:", error);
            setErrorMsg("Erro ao conectar com Google. Tente novamente.");
            setIsLoading(false);
        }
    };

    return (
        <div className={`${isModal ? 'w-full max-w-lg mx-auto bg-[#0f0518] rounded-[2.5rem] shadow-2xl border border-white/10 relative max-h-[90vh] overflow-y-auto hide-scrollbar' : 'fixed inset-0 z-[9999] bg-[#0f0518] overflow-y-auto safe-scroll'}`}>

            {/* Close Button for Modal */}
            {isModal && onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 flex items-center justify-center transition-all text-slate-400 hover:text-white"
                >
                    <i className="fas fa-times"></i>
                </button>
            )}

            <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

            {/* Background Gradient */}
            <div className={`${isModal ? 'absolute' : 'fixed'} inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900 pointer-events-none`}></div>

            {/* Wrapper de Conteúdo */}
            <div className={`${isModal ? 'flex flex-col items-center justify-center p-8 sm:p-12 pb-16 min-h-[500px]' : 'min-h-full w-full flex flex-col items-center justify-center p-6 sm:p-10'} relative z-10`}>

                <div className="w-full max-w-sm flex flex-col items-center my-auto transition-all">

                    {/* Header */}
                    <div className="mb-8 sm:mb-10 text-center animate-fade-in-up w-full">
                        <img
                            src="/og-image.png"
                            alt="Logo"
                            className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 object-contain drop-shadow-[0_0_25px_rgba(124,58,237,0.5)] hover:scale-110 transition-transform duration-500"
                        />
                        <h1 className="text-3xl sm:text-4xl font-[900] italic tracking-tight text-white mb-2 sm:mb-3">
                            {isRegistering ? 'CRIE SUA CONTA' : 'BEM-VINDO'}
                        </h1>
                        <p className="text-slate-400 text-base sm:text-lg font-medium">
                            {isRegistering ? 'Entre para o rolê mais exclusivo.' : 'Faça login para continuar.'}
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="w-full bg-red-500/10 border border-red-500/20 text-red-200 px-5 py-4 rounded-2xl mb-6 flex items-start gap-3 animate-shake">
                            <i className="fas fa-exclamation-circle mt-1 text-red-400"></i>
                            <span className="text-sm font-medium">{errorMsg}</span>
                        </div>
                    )}

                    {/* Google Login Button */}
                    <button
                        onClick={handleGoogleLogin}
                        disabled={isLoading}
                        className="w-full bg-white text-black font-extrabold py-3.5 sm:py-4 px-6 rounded-2xl flex items-center justify-center gap-3 hover:bg-slate-100 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.15)] mb-6 sm:mb-8 group relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent translate-x-[-100%] group-hover:animate-shine"></div>
                        <img src="https://www.google.com/favicon.ico" alt="G" className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="text-base sm:text-lg">Continuar com Google</span>
                    </button>

                    <div className="relative w-full text-center mb-6 sm:mb-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <span className="relative bg-[#0f0518] px-4 text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-widest">ou use seu e-mail</span>
                    </div>

                    {isGuestInputVisible ? (
                        <form onSubmit={handleGuestSubmit} className="w-full space-y-6 animate-slide-up">
                            <div className="text-center mb-2">
                                <p className="text-white font-bold text-lg">Como quer ser chamado?</p>
                            </div>
                            <input
                                type="text"
                                value={guestName}
                                onChange={(e) => setGuestName(e.target.value)}
                                placeholder="Seu Apelido"
                                maxLength={15}
                                autoFocus
                                required
                                className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-center text-white font-bold text-lg focus:border-dirole-primary focus:outline-none backdrop-blur-sm"
                            />

                            {/* EULA CHECKBOX */}
                            <div className="flex items-start gap-2 px-2">
                                <input
                                    type="checkbox"
                                    id="guestTerms"
                                    checked={acceptedTerms}
                                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                                    className="mt-1 w-4 h-4 rounded border-white/30 bg-black/30 accent-dirole-primary"
                                />
                                <label htmlFor="guestTerms" className="text-xs text-slate-400">
                                    Li e concordo com os <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-dirole-primary hover:underline font-bold">Termos de Uso e Política de Privacidade</button>.
                                </label>
                            </div>
                            {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{errorMsg}</p>}

                            <button type="submit" className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                                Entrar como Visitante
                            </button>
                            <button type="button" onClick={() => setIsGuestInputVisible(false)} className="w-full text-slate-500 text-xs py-2">
                                Voltar
                            </button>
                        </form>
                    ) : (
                        <>
                            {!isRegistering && (
                                <form onSubmit={handleLogin} className="w-full space-y-4 animate-fade-in">
                                    <div>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Email"
                                            required
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-dirole-primary focus:outline-none backdrop-blur-sm"
                                        />
                                    </div>
                                    <div className="relative group">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            placeholder="Senha"
                                            required
                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-4 pr-12 text-white focus:border-dirole-primary focus:outline-none backdrop-blur-sm"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white focus:outline-none"
                                        >
                                            <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="button" className="text-xs text-slate-400 hover:text-white transition-colors">
                                            Esqueceu a senha?
                                        </button>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center"
                                    >
                                        {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Entrar'}
                                    </button>

                                    <div className="flex items-center gap-4 my-4">
                                        <div className="h-px bg-white/10 flex-1"></div>
                                        <span className="text-slate-500 text-xs uppercase tracking-wider">Ou</span>
                                        <div className="h-px bg-white/10 flex-1"></div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleGoogleLogin}
                                        disabled={isLoading}
                                        className="w-full bg-white text-slate-900 font-bold py-3.5 rounded-xl transition-all transform active:scale-95 shadow-lg hover:bg-gray-100 flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
                                        <span>Entrar com Google</span>
                                    </button>

                                    <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed px-4">
                                        Ao continuar, você concorda com nossos <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-slate-400 font-bold hover:underline">Termos de Uso e Política de Privacidade (LGPD)</button>.
                                    </p>

                                    {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{errorMsg}</p>}

                                    <div className="pt-4 border-t border-white/10 mt-4">
                                        <button
                                            type="button"
                                            onClick={() => setIsGuestInputVisible(true)}
                                            className="w-full text-slate-500 text-xs py-2 hover:text-white"
                                        >
                                            Apenas dar uma olhadinha (Visitante)
                                        </button>
                                    </div>
                                </form>
                            )}

                            {isRegistering && (
                                <RegisterWizard
                                    onBack={() => setIsRegistering(false)}
                                    onOpenPrivacy={() => setIsPrivacyOpen(true)}
                                    isLoading={isLoading}
                                    errorMsg={errorMsg}
                                    onComplete={async (data) => {
                                        // Map wizard data to existing state vars for existing logic compatibility if needed, OR just call signUp here
                                        const { email: wEmail, pass: wPass, name: wName, age: wAge, gender: wGender, nickname: wNickname, avatar: wAvatar } = data;

                                        // Calculate actual age from birth year for database storage
                                        const currentYear = new Date().getFullYear();
                                        const calculatedAge = currentYear - parseInt(wAge);

                                        // Set local state just in case existing error logic relies on it? 
                                        // Actually better to just call logic directly using the data from wizard.

                                        // Temporary shim to reuse handleRegister logic structure or rewrite it inline here.
                                        setIsLoading(true);
                                        setErrorMsg(null);

                                        try {
                                            // Duplicate logic for safety and clarity in this new wizard flow
                                            const user = await signUpWithEmail(wEmail, wPass, wName); // This actually logs them in too usually, unless we changed it.

                                            // Handling Photo Upload
                                            let finalAvatar = wAvatar;
                                            if (data.avatarFile) {
                                                try {
                                                    const { uploadFile } = await import('../services/mockService');
                                                    finalAvatar = await uploadFile(data.avatarFile);
                                                } catch (uploadErr) {
                                                    console.error("Failed to upload avatar, falling back to emoji", uploadErr);
                                                }
                                            }

                                            await sendVerificationEmail();

                                            // Sync profile
                                            const session = await getCurrentSession();

                                            if (session) {
                                                await syncUserProfile(session.userId, {
                                                    name: wName,
                                                    nickname: wNickname,
                                                    email: wEmail,
                                                    avatar: finalAvatar,
                                                    gender: wGender,
                                                    age: calculatedAge.toString()
                                                });
                                            }

                                            // Reload page to trigger App.tsx verification check
                                            window.location.reload();


                                        } catch (error: any) {
                                            console.error(error);
                                            if (error.message?.includes("already registered") || error.code === 409) {
                                                setErrorMsg("Este e-mail já está cadastrado.");
                                            } else {
                                                setErrorMsg(error.message || "Erro ao criar conta.");
                                            }
                                            setIsLoading(false);
                                        }
                                    }}
                                />
                            )}
                        </>
                    )}

                    <div className="mt-8 text-center text-slate-400 text-sm">
                        Não tem conta? {' '}
                        <button onClick={() => { resetForm(); setIsRegistering(!isRegistering); }} className="text-dirole-primary font-bold hover:underline">
                            {isRegistering ? 'Fazer Login' : 'Cadastre-se'}
                        </button>
                    </div>

                    <div className="mt-4 text-center">
                        <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-[10px] text-slate-600 hover:text-slate-400">
                            Política de Privacidade
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};