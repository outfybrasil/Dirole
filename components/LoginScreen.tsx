import React, { useState } from 'react';
import { signUpWithEmail, signInWithEmail } from '../services/supabaseClient';
import { saveUserProfileLocal, triggerHaptic } from '../services/mockService';
import { User } from '../types';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const AVATARS = ['😎', '👽', '👾', '🦊', '🐯', '🦁', '🐷', '🦄', '🐝', '🤠', '🥳', '💃', '🕺', '🍻', '🌮', '🔥'];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
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
  const [gender, setGender] = useState('Outro');
  const [avatar, setAvatar] = useState('😎');
  const [guestName, setGuestName] = useState('');
  const [isGuestInputVisible, setIsGuestInputVisible] = useState(false);
  
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
      await signInWithEmail(email, password);
      // Login bem-sucedido será detectado pelo listener no App.tsx
    } catch (error: any) {
      console.error(error);
      setErrorMsg("Email ou senha incorretos.");
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
      const result = await signUpWithEmail(email, password, {
          name,
          nickname,
          age: parseInt(age),
          gender,
          avatar
      });
      
      if (result.user && !result.session) {
          setIsLoading(false);
          setIsSuccess(true); 
          return;
      }
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes("already registered") || error.code === "user_already_exists") {
          setErrorMsg("Este e-mail já está cadastrado. Tente fazer login.");
      } else if (error.message?.includes("Password should be")) {
          setErrorMsg("A senha deve ter pelo menos 6 caracteres.");
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
        <div className="fixed inset-0 z-[9999] bg-[#0f0518] flex flex-col items-center justify-center p-6 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 fixed"></div>
            
            <div className="relative z-10 w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8 text-center animate-slide-up shadow-2xl">
                <div className="w-20 h-20 bg-dirole-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-dirole-primary/50">
                    <i className="fas fa-envelope-open-text text-4xl text-dirole-primary"></i>
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-2">Verifique seu E-mail!</h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                    Enviamos um link de confirmação para:<br/>
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
      );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0f0518] flex flex-col items-center justify-center p-6 relative overflow-y-auto">
      
      <PrivacyPolicyModal isOpen={isPrivacyOpen} onClose={() => setIsPrivacyOpen(false)} />

      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20 fixed"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center my-auto py-10">
        
        <div className="mb-8 text-center">
            <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 mb-2 drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] pr-2 py-2">
                DIROLE
            </h1>
            <p className="text-slate-400 font-medium tracking-[0.2em] text-xs uppercase">O Termômetro do Rolê</p>
        </div>

        {!isGuestInputVisible && (
            <div className="flex bg-white/5 p-1 rounded-xl mb-6 w-full border border-white/10">
                <button 
                    onClick={() => { setIsRegistering(false); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${!isRegistering ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                    Entrar
                </button>
                <button 
                    onClick={() => { setIsRegistering(true); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-bold rounded-lg transition-all ${isRegistering ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400'}`}
                >
                    Criar Conta
                </button>
            </div>
        )}

        {isGuestInputVisible ? (
             <form onSubmit={handleGuestSubmit} className="w-full space-y-4 animate-slide-up">
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
                    className="w-full bg-black/40 border border-white/20 rounded-xl p-4 text-center text-white font-bold text-lg focus:border-dirole-primary focus:outline-none"
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
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-dirole-primary focus:outline-none"
                            />
                        </div>
                        <div>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Senha"
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-xl p-4 text-white focus:border-dirole-primary focus:outline-none"
                            />
                        </div>

                        {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{errorMsg}</p>}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center"
                        >
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Entrar'}
                        </button>
                        
                        <div className="pt-4 border-t border-white/10">
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
                    <form onSubmit={handleRegister} className="w-full space-y-3 animate-fade-in">
                        <div className="mb-4">
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 text-center">Escolha seu Avatar</label>
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar justify-start sm:justify-center">
                                {AVATARS.map(av => (
                                    <button
                                        key={av}
                                        type="button"
                                        onClick={() => setAvatar(av)}
                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 transition-all ${avatar === av ? 'bg-dirole-primary scale-110 border-2 border-white' : 'bg-white/5 border border-white/10'}`}
                                    >
                                        {av}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <input 
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Nome Completo"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                        />
                        
                        <div className="flex gap-2">
                             <input 
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Apelido (ex: Guga)"
                                required
                                className="flex-[2] bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                            />
                            <input 
                                type="number"
                                value={age}
                                onChange={(e) => setAge(e.target.value)}
                                placeholder="Idade"
                                required
                                min="18"
                                max="99"
                                className="flex-1 bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                            />
                        </div>

                        <select
                             value={gender}
                             onChange={(e) => setGender(e.target.value)}
                             className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none appearance-none"
                        >
                            <option value="Outro">Prefiro não dizer / Outro</option>
                            <option value="Masculino">Masculino</option>
                            <option value="Feminino">Feminino</option>
                        </select>

                        <input 
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                        />

                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Senha (mín. 6 caracteres)"
                            required
                            minLength={6}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                        />

                        <input 
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirmar Senha"
                            required
                            minLength={6}
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white focus:border-dirole-primary focus:outline-none"
                        />

                        {/* EULA CHECKBOX */}
                        <div className="flex items-start gap-2 px-1 pt-2">
                            <input 
                                type="checkbox" 
                                id="terms" 
                                checked={acceptedTerms}
                                onChange={(e) => setAcceptedTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-white/30 bg-black/30 accent-dirole-primary"
                            />
                            <label htmlFor="terms" className="text-xs text-slate-400">
                                Li e concordo com os <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-dirole-primary hover:underline font-bold">Termos de Uso e Política de Privacidade</button>.
                            </label>
                        </div>

                        {errorMsg && <p className="text-red-400 text-xs text-center font-bold bg-red-500/10 p-2 rounded">{errorMsg}</p>}

                        <button
                            type="submit"
                            disabled={isLoading || !acceptedTerms}
                            className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center mt-4 disabled:opacity-50 disabled:grayscale"
                        >
                            {isLoading ? <i className="fas fa-circle-notch fa-spin"></i> : 'Criar Conta e Entrar'}
                        </button>
                    </form>
                )}
            </>
        )}
        
        <div className="mt-8 text-center">
            <button type="button" onClick={() => setIsPrivacyOpen(true)} className="text-[10px] text-slate-600 hover:text-slate-400">
                Política de Privacidade
            </button>
        </div>

      </div>
    </div>
  );
};