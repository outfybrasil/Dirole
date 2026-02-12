
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { signOut } from '../services/authService';
import { saveUserProfileLocal, triggerHaptic, uploadAvatar, syncUserProfile, updateUserProfile } from '../services/mockService';
import { LEVEL_THRESHOLDS } from '../constants';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import UserAvatar from './UserAvatar';

interface ProfileModalProps {
    isOpen: boolean;
    currentUser: User | null;
    onSave: (user: User) => void;
    onClose: () => void;
    onOpenPrivacy: () => void;
    onOpenData?: () => void;
    onOpenFriends: (tab: 'my_friends' | 'requests' | 'search') => void;
    onLogout?: () => void;
    onShowToast?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const AVATARS = ['😎', '👽', '👾', '🦊', '🐯', '🦁', '🐷', '🦄', '🐝', '🤠', '🥳', '💃', '🕺', '🍻', '🌮', '🔥'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
    isOpen,
    currentUser,
    onSave,
    onClose,
    onOpenPrivacy,
    onOpenData,
    onOpenFriends,
    onLogout,
    onShowToast
}) => {
    const [name, setName] = useState('');
    const [nickname, setNickname] = useState('');
    const [avatar, setAvatar] = useState(AVATARS[0]);
    const [isSaving, setIsSaving] = useState(false);

    // Deletion State
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [activeTab, setActiveTab] = useState<'stats' | 'edit' | 'settings'>('stats');

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
            setAvatar(currentUser.avatar || AVATARS[0]);
        }
    }, [currentUser, isOpen]);

    if (!isOpen) return null;

    const handleAvatarChange = (newAvatar: string) => {
        triggerHaptic();
        setAvatar(newAvatar);
    };

    const takePicture = async () => {
        try {
            let permissions = await Camera.checkPermissions();

            if (permissions.camera === 'prompt') {
                permissions = await Camera.requestPermissions();
            }

            if (permissions.camera !== 'granted') {
                if (onShowToast) onShowToast('Permissão da câmera necessária', 'error');
                else alert('A permissão da câmera é necessária para tirar fotos.');
                return;
            }

            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri
            });

            if (image.webPath) {
                setAvatar(image.webPath);
            }
        } catch (e) {
            console.warn("Camera failed:", e);
            if (onShowToast) onShowToast('Não foi possível acessar a câmera', 'error');
        }
    };

    const pickFromGallery = async () => {
        try {
            const image = await Camera.getPhoto({
                quality: 90,
                allowEditing: true,
                resultType: CameraResultType.Uri,
                source: CameraSource.Photos
            });

            if (image.webPath) {
                setAvatar(image.webPath);
            }
        } catch (e) {
            console.warn("Gallery pick failed:", e);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = name.trim();
        const trimmedNickname = nickname.trim();

        if (!trimmedName || isSaving) return;

        setIsSaving(true);
        triggerHaptic();

        try {
            console.log("[Profile] Iniciando salvamento...");
            let finalAvatar = avatar;

            // 1. Upload do Avatar se for um caminho local
            const isLocalPath = avatar.startsWith('blob:') || avatar.startsWith('file:') || avatar.startsWith('capacitor:');
            if (isLocalPath && currentUser && !currentUser.id.startsWith('guest_')) {
                try {
                    const uploadedUrl = await uploadAvatar(currentUser.id, avatar);
                    if (uploadedUrl) finalAvatar = uploadedUrl;
                } catch (upErr) {
                    console.warn("[Profile] Falha no upload, usando padrão:", upErr);
                    finalAvatar = '😎';
                }
            }

            const updatedUser = {
                ...currentUser!,
                name: trimmedName,
                nickname: trimmedNickname,
                avatar: finalAvatar
            };

            // 2. Salvar Localmente (Garante persistência imediata)
            localStorage.setItem('dirole_user_profile', JSON.stringify(updatedUser));

            // 3. Atualizar no Appwrite
            if (!updatedUser.id.startsWith('guest_')) {
                const result = await updateUserProfile(updatedUser.id, {
                    name: trimmedName,
                    nickname: trimmedNickname,
                    avatar: finalAvatar
                });

                if (!result.success) {
                    if (onShowToast) onShowToast(result.error || "Erro ao atualizar perfil", 'error');
                    setIsSaving(false);
                    return;
                }
            }

            // 4. Fechar e Atualizar App
            console.log("[Profile] Finalizando...");
            onSave(updatedUser);
            if (onClose) onClose(); // Close modal on success
            if (onShowToast) onShowToast("Perfil atualizado! 🚀", 'success');
            // Force reload removed. Updating via state callbacks.
            // window.location.reload();

        } catch (err: any) {
            console.error("[Profile] Erro crítico:", err);
            if (onShowToast) onShowToast("Erro ao salvar perfil", 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        triggerHaptic();
        await signOut();
        if (onLogout) {
            onLogout();
        }
        onClose();
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETAR') return;

        try {
            // MVP: Soft delete (logout + warning)
            // Permanent deletion requires Appwrite Function (server-side)
            if (currentUser && !currentUser.id.startsWith('guest_')) {
                console.log("[Appwrite] Account deletion requested for:", currentUser.id);
                // In a real app, you'd trigger a Cloud Function here
            }
            localStorage.removeItem('dirole_user_profile');
            await signOut();
            if (onLogout) onLogout();
            onClose();
        } catch (e) {
            console.error("Delete account flow failed:", e);
        }
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col h-[90vh] sm:h-[80vh] overflow-hidden relative isolate">

                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                <div className="p-8 pt-10 pb-4 relative z-10 flex justify-between items-center">
                    <div className="flex items-center gap-5">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_20px_rgba(139,92,246,0.4)] flex items-center justify-center">
                                <UserAvatar
                                    avatar={avatar}
                                    className="border-2 border-slate-900 !w-full !h-full shadow-none"
                                />
                            </div>
                            {!isGuest && (
                                <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black font-black text-[10px] px-2.5 py-1 rounded-full shadow-lg border-2 border-[#0f0518] whitespace-nowrap">
                                    LVL {currentUser?.level || 1}
                                </div>
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white leading-tight tracking-tighter italic uppercase pr-4 truncate">{nickname || name || 'Paparazzo'}</h2>
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

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="px-8 mb-6 mt-2">
                        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 relative">
                            <div
                                className="absolute top-1.5 bottom-1.5 transition-all duration-300 ease-out bg-white/10 rounded-xl"
                                style={{
                                    width: 'calc(33.33% - 4px)',
                                    left: activeTab === 'stats' ? '6px' : activeTab === 'edit' ? 'calc(33.33% + 4px)' : 'calc(66.66% + 2px)'
                                }}
                            />
                            <button
                                onClick={() => setActiveTab('stats')}
                                className={`flex-1 relative z-10 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-slate-500'}`}
                            >
                                <i className="fas fa-chart-line mr-2"></i>Status
                            </button>
                            <button
                                onClick={() => setActiveTab('edit')}
                                className={`flex-1 relative z-10 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'edit' ? 'text-white' : 'text-slate-500'}`}
                            >
                                <i className="fas fa-pen mr-2"></i>Perfil
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`flex-1 relative z-10 py-2.5 text-[10px] font-black uppercase tracking-wider transition-colors ${activeTab === 'settings' ? 'text-white' : 'text-slate-500'}`}
                            >
                                <i className="fas fa-cog mr-2"></i>Ajustes
                            </button>
                        </div>
                    </div>

                    <div className="px-8 pb-10">
                        {showDeleteConfirm ? (
                            <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-6 animate-fade-in">
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
                            <div className="animate-fade-in">
                                {activeTab === 'stats' && (
                                    <div className="space-y-8">
                                        {!isGuest && (
                                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                                <div className="flex justify-between items-end mb-3">
                                                    <div>
                                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Seu Progresso</p>
                                                        <span className="text-lg font-black text-white uppercase tracking-tight">Nível {currentUser?.level || 1}</span>
                                                    </div>
                                                    <span className="text-[10px] font-black text-dirole-primary bg-dirole-primary/10 px-3 py-1.5 rounded-full uppercase">
                                                        {currentUser?.xp || 0} / {nextLevel ? nextLevel.xp : 'MAX'} XP
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-black/40 rounded-full overflow-hidden border border-white/5 p-[1px]">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 rounded-full shadow-[0_0_15px_rgba(139,92,246,0.3)] transition-all duration-1000"
                                                        style={{ width: `${progressPercent}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => onOpenFriends('my_friends')}
                                                className="group relative h-40 bg-gradient-to-br from-dirole-secondary/20 to-transparent border border-white/10 rounded-[2rem] p-6 flex flex-col items-start justify-between hover:bg-white/5 transition-all shadow-xl overflow-hidden"
                                            >
                                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-dirole-secondary/10 rounded-full blur-2xl group-hover:bg-dirole-secondary/20 transition-all"></div>
                                                <div className="w-12 h-12 rounded-2xl bg-dirole-secondary/20 flex items-center justify-center text-dirole-secondary text-2xl shadow-[0_0_20px_rgba(167,139,250,0.2)]">
                                                    <i className="fas fa-user-friends"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-dirole-secondary uppercase tracking-[0.2em] mb-1">Social</p>
                                                    <span className="text-sm font-black text-white uppercase tracking-widest">Meus Amigos</span>
                                                </div>
                                            </button>
                                            <button
                                                onClick={() => onOpenFriends('search')}
                                                className="group relative h-40 bg-gradient-to-br from-dirole-primary/20 to-transparent border border-white/10 rounded-[2rem] p-6 flex flex-col items-start justify-between hover:bg-white/5 transition-all shadow-xl overflow-hidden"
                                            >
                                                <div className="absolute -right-4 -top-4 w-24 h-24 bg-dirole-primary/10 rounded-full blur-2xl group-hover:bg-dirole-primary/20 transition-all"></div>
                                                <div className="w-12 h-12 rounded-2xl bg-dirole-primary/20 flex items-center justify-center text-dirole-primary text-2xl shadow-[0_0_20px_rgba(139,92,246,0.2)]">
                                                    <i className="fas fa-globe-americas"></i>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-dirole-primary uppercase tracking-[0.2em] mb-1">Global</p>
                                                    <span className="text-sm font-black text-white uppercase tracking-widest">Explorar</span>
                                                </div>
                                            </button>
                                        </div>

                                        {/* Troféus Section */}
                                        {!isGuest && currentUser?.badges && currentUser.badges.length > 0 && (
                                            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <i className="fas fa-trophy text-yellow-500 text-lg"></i>
                                                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Troféus Desbloqueados</h3>
                                                </div>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {currentUser.badges.map((badge) => (
                                                        <div
                                                            key={badge.id}
                                                            className="group relative bg-white/5 border border-white/10 rounded-2xl p-3 flex flex-col items-center justify-center hover:bg-white/10 hover:border-yellow-500/30 transition-all cursor-pointer"
                                                            title={`${badge.name}: ${badge.description}`}
                                                        >
                                                            <span className="text-3xl mb-1">{badge.icon}</span>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase text-center leading-tight group-hover:text-yellow-500 transition-colors">{badge.name}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === 'edit' && (
                                    <form onSubmit={handleSubmit} className="space-y-8">
                                        <div className="space-y-5 bg-white/[0.02] p-6 rounded-[2.5rem] border border-white/5">
                                            <div className="flex flex-col items-center gap-6 mb-2">
                                                <div className="relative group flex items-center justify-center">
                                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_30px_rgba(139,92,246,0.5)] flex items-center justify-center">
                                                        <UserAvatar avatar={avatar} className="!w-full !h-full border-4 border-[#0f0518] shadow-none" />
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 w-full">
                                                    <button
                                                        type="button"
                                                        onClick={takePicture}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 text-[9px] font-black uppercase tracking-widest text-white flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                                    >
                                                        <i className="fas fa-camera text-dirole-primary text-lg"></i>
                                                        Câmera
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={pickFromGallery}
                                                        className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 text-[9px] font-black uppercase tracking-widest text-white flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                                    >
                                                        <i className="fas fa-images text-dirole-secondary text-lg"></i>
                                                        Galeria
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 overflow-x-auto py-3 px-1 no-scrollbar mask-linear-fade">
                                                {AVATARS.map(av => (
                                                    <button
                                                        key={av}
                                                        type="button"
                                                        onClick={() => handleAvatarChange(av)}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 transition-all active:scale-90 ${avatar === av ? 'bg-dirole-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)]' : 'bg-white/5 border border-white/5 opacity-50'}`}
                                                    >
                                                        {av}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Como quer ser visto</label>
                                                <input
                                                    type="text"
                                                    value={nickname}
                                                    onChange={(e) => setNickname(e.target.value)}
                                                    placeholder="Seu Apelido"
                                                    maxLength={15}
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-dirole-primary focus:bg-white/[0.08] transition-all font-black text-lg shadow-inner"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Nome Completo</label>
                                                <input
                                                    type="text"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    placeholder="Seu Nome"
                                                    required
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white focus:outline-none focus:border-dirole-primary focus:bg-white/[0.08] transition-all text-sm font-medium shadow-inner"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSaving}
                                            className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center text-xs uppercase tracking-[0.2em] shadow-xl"
                                        >
                                            {isSaving ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : 'Atualizar Perfil'}
                                        </button>
                                    </form>
                                )}

                                {activeTab === 'settings' && (
                                    <div className="space-y-8">
                                        <div className="bg-white/5 rounded-[2.5rem] border border-white/5 overflow-hidden">
                                            <button
                                                onClick={onOpenPrivacy}
                                                className="w-full flex items-center justify-between p-6 hover:bg-white/5 transition-all group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center text-orange-400">
                                                        <i className="fas fa-shield-alt"></i>
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-black text-white uppercase tracking-wider">Privacidade</p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Visibilidade e Dados</p>
                                                    </div>
                                                </div>
                                                <i className="fas fa-chevron-right text-slate-700 group-hover:text-white transition-colors"></i>
                                            </button>

                                            {!isGuest && (
                                                <button
                                                    onClick={() => { if (onOpenData) onOpenData(); }}
                                                    className="w-full flex items-center justify-between p-6 border-t border-white/5 hover:bg-white/5 transition-all group"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-400/10 flex items-center justify-center text-blue-400">
                                                            <i className="fas fa-database"></i>
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-sm font-black text-white uppercase tracking-wider">Meus Dados</p>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">Relatório LGPD</p>
                                                        </div>
                                                    </div>
                                                    <i className="fas fa-chevron-right text-slate-700 group-hover:text-white transition-colors"></i>
                                                </button>
                                            )}

                                            <div className="p-6 border-t border-white/5 bg-black/20">
                                                <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest text-center mb-4 italic">Versão 1.0.4 Beta</p>

                                                {isGuest ? (
                                                    <button
                                                        onClick={() => { if (onLogout) onLogout(); }}
                                                        className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-5 rounded-2xl shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-[0.2em]"
                                                    >
                                                        Fazer Login Oficial
                                                    </button>
                                                ) : (
                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full bg-white/5 text-slate-400 font-black py-4 rounded-2xl hover:bg-white/10 active:scale-95 transition-all text-[10px] uppercase tracking-widest"
                                                    >
                                                        <i className="fas fa-sign-out-alt mr-2"></i> Sair da Conta
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {!isGuest && (
                                            <div className="pt-4 flex justify-center">
                                                <button
                                                    onClick={() => setShowDeleteConfirm(true)}
                                                    className="text-red-900/40 hover:text-red-500 text-[10px] font-black uppercase tracking-widest transition-all"
                                                >
                                                    Excluir minha conta permanentemente
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
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
