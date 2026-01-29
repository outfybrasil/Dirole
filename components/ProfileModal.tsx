

import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { supabase, deleteAccount } from '../services/supabaseClient';
import { saveUserProfileLocal, triggerHaptic } from '../services/mockService';
import { LEVEL_THRESHOLDS } from '../constants';
import { Camera, CameraResultType } from '@capacitor/camera';

interface ProfileModalProps {
    isOpen: boolean;
    currentUser: User | null;
    onSave: (user: User) => void;
    onClose: () => void;
    onOpenPrivacy: () => void;
    onOpenFriends: (tab: 'my_friends' | 'requests' | 'search') => void;
    onLogout?: () => void;
}

const AVATARS = ['😎', '👽', '👾', '🦊', '🐯', '🦁', '🐷', '🦄', '🐝', '🤠', '🥳', '💃', '🕺', '🍻', '🌮', '🔥'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    currentUser,
    onSave,
    onClose,
    onOpenPrivacy,
    onOpenFriends,
    onLogout
}) => {
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [customAvatarUrl, setCustomAvatarUrl] = useState('');
    const [avatarMode, setAvatarMode] = useState<'emoji' | 'url'>('emoji');
    const [isSaving, setIsSaving] = useState(false);

    // Deletion State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');

    const isGuest = currentUser?.id.startsWith('guest_');

    const currentLevel = LEVEL_THRESHOLDS.find(l => l.level === (currentUser?.level || 1)) || LEVEL_THRESHOLDS[0];
    const nextLevel = LEVEL_THRESHOLDS.find(l => l.level === (currentUser?.level || 1) + 1);
    const progressPercent = nextLevel && currentUser
        ? Math.min(100, Math.max(0, ((currentUser.xp - currentLevel.xp) / (nextLevel.xp - currentLevel.xp)) * 100))
        : 100;

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setNickname(currentUser.nickname || '');

            const isUrl = currentUser.avatar.startsWith('http') || currentUser.avatar.startsWith('data:');
            setAvatarMode(isUrl ? 'url' : 'emoji');

            if (isUrl) {
                setCustomAvatarUrl(currentUser.avatar);
                setAvatar('😎'); // fallback
            } else {
                setAvatar(currentUser.avatar);
                setCustomAvatarUrl('');
            }
        }
    }, [currentUser, isOpen]);

    if (!isOpen) return null;

    const takePicture = async () => {
        try {
            let permissions = await Camera.checkPermissions();

            if (permissions.camera === 'prompt') {
                permissions = await Camera.requestPermissions();
            }

            if (permissions.camera !== 'granted') {
                alert('A permissão da câmera é necessária para tirar fotos.');
                return;
            }

            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri
            });

            if (image.webPath) {
                setCustomAvatarUrl(image.webPath);
                setAvatarMode('url');
            }
        } catch (e) {
            console.warn("Camera failed:", e);
            // Fallback for web preview if camera fails
            alert("Não foi possível acessar a câmera neste dispositivo.");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setIsSaving(true);
        triggerHaptic();

        const finalAvatar = avatarMode === 'url' && customAvatarUrl ? customAvatarUrl : avatar;

        const updatedUser = {
            ...currentUser!,
            name,
            nickname,
            avatar: finalAvatar
        };

        // Salvar Local
        localStorage.setItem('dirole_user_profile', JSON.stringify(updatedUser));

        // Salvar no Supabase se não for guest
        if (!updatedUser.id.startsWith('guest_')) {
            try {
                const { error } = await supabase.from('profiles').update({
                    name,
                    nickname,
                    avatar: finalAvatar,
                    updated_at: new Date()
                }).eq('id', updatedUser.id);

                if (error) {
                    console.error("Erro ao salvar perfil:", error);
                    alert("Erro ao salvar alterações. Tente novamente.");
                    setIsSaving(false);
                    return;
                }
            } catch (e: any) {
                console.warn("Erro de conexão ao salvar perfil:", e);
                alert(`Erro ao salvar: ${e.message || JSON.stringify(e)}`);
                // Continue execution to save locally at least
            }
        }

        onSave(updatedUser);
        setIsSaving(false);
        alert("Perfil atualizado com sucesso! 🚀");
        onClose();
    };

    const handleLogout = async () => {
        triggerHaptic();
        if (onLogout) {
            onLogout();
        }
        onClose();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETAR') return;

        try {
            if (currentUser && !currentUser.id.startsWith('guest_')) {
                await deleteAccount(currentUser.id);
            } else {
                // If guest, just wipe local
                localStorage.removeItem('dirole_user_profile');
            }
            if (onLogout) onLogout();

            onClose();
        } catch (e) {
            alert("Erro ao excluir conta. Tente novamente.");
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden relative isolate">

                {/* Grabber Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                {/* HEADER */}
                <div className="p-8 pt-10 pb-4 relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center overflow-hidden border-2 border-slate-900">
                                    {avatarMode === 'url' && customAvatarUrl ? (
                                        <img src={customAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-4xl">{avatar}</span>
                                    )}
                                </div>
                            </div>
                            {!isGuest && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg border-2 border-[#0f0518] whitespace-nowrap">
                                    LVL {currentUser?.level || 1}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white leading-tight tracking-tight">{nickname || name || 'Paparazzo'}</h2>
                            <p className="text-dirole-secondary font-black text-[10px] tracking-[0.2em] uppercase mt-1">
                                {isGuest ? 'CONVIDADO' : currentLevel.label.toUpperCase()}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => { triggerHaptic(); onClose(); }}
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all active:scale-90"
                    >
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                {/* CONTENT */}
                <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar">

                    {showDeleteConfirm ? (
                        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 animate-fade-in mt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <i className="fas fa-exclamation-triangle text-red-500 text-xl"></i>
                                <h3 className="text-red-500 font-black text-sm uppercase tracking-widest">Zona de Perigo</h3>
                            </div>
                            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                                Tem certeza? Isso apagará <strong>permanentemente</strong> seu perfil, pontos, amigos e dados. Essa ação não pode ser desfeita.
                            </p>
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Confirme digitando <strong>DELETAR</strong>:</label>
                            <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                className="w-full bg-white/5 border border-red-500/20 rounded-2xl p-4 text-white mb-6 focus:border-red-500 focus:outline-none focus:bg-red-500/5 transition-all text-sm font-bold placeholder-slate-700"
                                placeholder="DELETAR"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDeleteAccount}
                                    disabled={deleteConfirmText !== 'DELETAR'}
                                    className="flex-1 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-red-900/40"
                                >
                                    Excluir Conta
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* XP BAR */}
                            {!isGuest && (
                                <div className="mb-8 mt-4">
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progresso de Nível</span>
                                        <span className="text-[10px] font-black text-dirole-primary bg-dirole-primary/10 px-2 py-0.5 rounded-md uppercase">
                                            {currentUser?.xp || 0} / {nextLevel ? nextLevel.xp : 'MAX'} XP
                                        </span>
                                    </div>
                                    <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                        <div
                                            className="h-full bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-1000"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button
                                    onClick={() => onOpenFriends('my_friends')}
                                    className="group relative bg-white/5 border border-white/10 rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-dirole-secondary/30 active:scale-95 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-dirole-secondary/10 flex items-center justify-center text-dirole-secondary text-xl transition-transform group-hover:scale-110">
                                        <i className="fas fa-user-friends"></i>
                                    </div>
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">Meus Amigos</span>
                                </button>
                                <button
                                    onClick={() => onOpenFriends('search')}
                                    className="group relative bg-white/5 border border-white/10 rounded-[1.5rem] p-6 flex flex-col items-center justify-center gap-3 hover:bg-white/10 hover:border-dirole-primary/30 active:scale-95 transition-all"
                                >
                                    <div className="w-12 h-12 rounded-2xl bg-dirole-primary/10 flex items-center justify-center text-dirole-primary text-xl transition-transform group-hover:scale-110">
                                        <i className="fas fa-search"></i>
                                    </div>
                                    <span className="text-[11px] font-black text-white uppercase tracking-wider">Explorar</span>
                                </button>
                            </div>

                            {/* LGPD DATA TRANSPARENCY SECTION */}
                            {!isGuest && (
                                <div className="mb-10 bg-indigo-500/5 rounded-[2rem] p-6 border border-indigo-500/10">
                                    <div className="flex items-center gap-3 mb-4">
                                        <i className="fas fa-fingerprint text-indigo-400"></i>
                                        <h3 className="text-white font-black text-[10px] uppercase tracking-[0.2em]">Dados & Privacidade (LGPD)</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Informações Armazenadas:</p>
                                            <div className="grid grid-cols-1 gap-1.5">
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-400">Nome:</span>
                                                    <span className="text-white font-bold">{currentUser?.name}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-400">E-mail:</span>
                                                    <span className="text-white font-bold">{currentUser?.email}</span>
                                                </div>
                                                <div className="flex justify-between text-[10px]">
                                                    <span className="text-slate-400">ID Único:</span>
                                                    <span className="text-slate-500 font-mono text-[8px]">{currentUser?.id}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-2">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Como usamos seus dados:</p>
                                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed uppercase tracking-tight">
                                                SUA LOCALIZAÇÃO É USADA APENAS PARA O "TERMÔMETRO" E NÃO É COMPARTILHADA COM TERCEIROS. SEU NOME E AVATAR SÃO VISÍVEIS PARA AMIGOS NO APP.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Avatar & Estilo</label>
                                    <div className="bg-white/5 p-1.5 rounded-[1.25rem] flex gap-1 border border-white/5">
                                        <button
                                            type="button"
                                            onClick={() => setAvatarMode('emoji')}
                                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${avatarMode === 'emoji' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Emojis
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAvatarMode('url')}
                                            className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${avatarMode === 'url' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                                        >
                                            Foto / URL
                                        </button>
                                    </div>

                                    {avatarMode === 'emoji' ? (
                                        <div className="flex gap-3 overflow-x-auto py-2 no-scrollbar scroll-smooth">
                                            {AVATARS.map(av => (
                                                <button
                                                    key={av}
                                                    type="button"
                                                    onClick={() => setAvatar(av)}
                                                    className={`w-12 h-12 rounded-[1rem] flex items-center justify-center text-2xl shrink-0 transition-all active:scale-90 ${avatar === av ? 'bg-dirole-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] border border-white/20' : 'bg-white/5 border border-white/10 opacity-40 hover:opacity-100 hover:bg-white/10'}`}
                                                >
                                                    {av}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-3 animate-fade-in">
                                            <button
                                                type="button"
                                                onClick={takePicture}
                                                className="w-full bg-white/5 border border-dirole-primary/30 rounded-2xl py-4 text-[11px] font-black uppercase tracking-widest text-white flex items-center justify-center gap-3 hover:bg-dirole-primary/10 transition-all active:scale-[0.98] shadow-inner"
                                            >
                                                <i className="fas fa-camera text-dirole-primary text-base"></i> Abrir Câmera
                                            </button>
                                            <input
                                                type="url"
                                                value={customAvatarUrl}
                                                onChange={(e) => setCustomAvatarUrl(e.target.value)}
                                                placeholder="ou cole o link (https://...)"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white text-xs focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium placeholder-slate-700"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Como quer ser visto</label>
                                        <input
                                            type="text"
                                            value={nickname}
                                            onChange={(e) => setNickname(e.target.value)}
                                            placeholder="Apelido"
                                            maxLength={15}
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-black text-base placeholder-slate-700 shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Identidade</label>
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            placeholder="Nome Completo"
                                            required
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all text-sm font-medium placeholder-slate-700 shadow-inner"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 grid grid-cols-1 gap-4">
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center text-xs uppercase tracking-[0.2em] shadow-xl"
                                    >
                                        {isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : 'Salvar Alterações'}
                                    </button>

                                    {isGuest ? (
                                        <button
                                            type="button"
                                            onClick={() => { if (onLogout) onLogout(); }}
                                            className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-5 rounded-[1.5rem] shadow-[0_10px_25px_rgba(139,92,246,0.3)] active:scale-95 transition-all text-xs uppercase tracking-[0.2em]"
                                        >
                                            Fazer Login Oficial
                                        </button>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-red-500 font-black bg-white/5 border border-red-500/10 py-5 rounded-[1.5rem] hover:bg-red-500/10 transition-all text-xs uppercase tracking-[0.2em]"
                                        >
                                            Sair da Conta
                                        </button>
                                    )}

                                    <div className="pt-6 border-t border-white/5 flex flex-col gap-4">
                                        <button
                                            type="button"
                                            onClick={onOpenPrivacy}
                                            className="text-slate-500 text-[10px] font-black uppercase tracking-widest py-2 hover:text-white transition-all flex items-center justify-center gap-2"
                                        >
                                            <i className="fas fa-shield-alt"></i> Política de Privacidade
                                        </button>
                                        {!isGuest && (
                                            <button
                                                type="button"
                                                onClick={() => setShowDeleteConfirm(true)}
                                                className="text-red-900/50 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                                            >
                                                Excluir minha conta definitivamente
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>

            <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(139, 92, 246, 0.3);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
        </div>
    );
};
