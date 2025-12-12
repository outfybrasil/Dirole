

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
        await supabase.from('profiles').update({
            name,
            nickname,
            avatar: finalAvatar
        }).eq('id', updatedUser.id);
    }
    
    onSave(updatedUser);
    setIsSaving(false);
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="bg-dirole-bg w-full max-w-md rounded-3xl border border-white/10 p-0 animate-slide-up shadow-2xl relative overflow-hidden flex flex-col max-h-[95vh]">
        
        {/* HEADER */}
        <div className="p-4 pb-2 border-b border-white/5 bg-white/5 relative z-10 flex justify-between items-start">
             <div className="flex items-center gap-4">
                 <div className="relative">
                    <div className="w-16 h-16 rounded-full border-2 border-dirole-primary bg-slate-800 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(139,92,246,0.5)]">
                        {avatarMode === 'url' && customAvatarUrl ? (
                            <img src={customAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-3xl">{avatar}</span>
                        )}
                    </div>
                    {!isGuest && (
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-black font-black text-[10px] px-2 py-0.5 rounded-full shadow-md border border-yellow-300 whitespace-nowrap">
                            LVL {currentUser?.level || 1}
                        </div>
                    )}
                 </div>
                 <div>
                     <h2 className="text-xl font-black text-white leading-tight">{nickname || name || 'Usuário'}</h2>
                     <p className="text-dirole-primary font-bold text-xs tracking-wide uppercase">
                         {isGuest ? 'Visitante' : currentLevel.label}
                     </p>
                 </div>
             </div>
             
             <button 
                onClick={() => { triggerHaptic(); onClose(); }} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
             >
                <i className="fas fa-times"></i>
             </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-5 relative z-10">
            
            {showDeleteConfirm ? (
                <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-4 animate-fade-in">
                    <h3 className="text-red-500 font-bold text-lg mb-2">Zona de Perigo</h3>
                    <p className="text-sm text-white mb-4">
                        Tem certeza? Isso apagará <strong>permanentemente</strong> seu perfil, pontos, amigos e dados. Essa ação não pode ser desfeita.
                    </p>
                    <label className="text-xs text-slate-400 block mb-1">Digite <strong>DELETAR</strong> para confirmar:</label>
                    <input 
                        type="text" 
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        className="w-full bg-black/30 border border-red-500/30 rounded-lg p-2 text-white mb-4 focus:border-red-500 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 bg-slate-700 text-white font-bold py-2 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleDeleteAccount}
                            disabled={deleteConfirmText !== 'DELETAR'}
                            className="flex-1 bg-red-600 text-white font-bold py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Excluir Tudo
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    {/* XP BAR - HIDDEN FOR GUESTS */}
                    {!isGuest && (
                        <div className="mb-6">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                                <span>XP Atual: {currentUser?.xp || 0}</span>
                                <span>Próx: {nextLevel ? nextLevel.xp : 'MAX'}</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden border border-white/5">
                                <div 
                                    className="h-full bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-[0_0_10px_#d946ef]"
                                    style={{ width: `${progressPercent}%` }}
                                ></div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mb-6">
                        <button 
                            onClick={() => onOpenFriends('my_friends')}
                            className="bg-white/5 border border-white/10 rounded-xl py-3 flex flex-col items-center justify-center gap-1 hover:bg-white/10 active:scale-95 transition-all"
                        >
                            <i className={`fas fa-user-friends text-lg ${isGuest ? 'text-slate-500' : 'text-dirole-secondary'}`}></i>
                            <span className={`text-xs font-bold ${isGuest ? 'text-slate-500' : 'text-white'}`}>Meus Amigos</span>
                        </button>
                        <button 
                            onClick={() => onOpenFriends('search')}
                            className="bg-dirole-primary/10 border border-dirole-primary/30 rounded-xl py-3 flex flex-col items-center justify-center gap-1 hover:bg-dirole-primary/20 active:scale-95 transition-all"
                        >
                            <i className={`fas fa-search text-lg ${isGuest ? 'text-slate-500' : 'text-dirole-primary'}`}></i>
                            <span className={`text-xs font-bold ${isGuest ? 'text-slate-500' : 'text-white'}`}>Buscar Pessoas</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex bg-white/5 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setAvatarMode('emoji')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md ${avatarMode === 'emoji' ? 'bg-dirole-primary text-white' : 'text-slate-400'}`}
                            >
                                Emojis
                            </button>
                            <button
                                type="button"
                                onClick={() => setAvatarMode('url')}
                                className={`flex-1 py-2 text-xs font-bold rounded-md ${avatarMode === 'url' ? 'bg-dirole-primary text-white' : 'text-slate-400'}`}
                            >
                                Foto / Câmera
                            </button>
                        </div>

                        {avatarMode === 'emoji' ? (
                            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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
                        ) : (
                            <div className="space-y-2">
                                <button 
                                    type="button" 
                                    onClick={takePicture}
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl py-3 text-sm text-white flex items-center justify-center gap-2 hover:bg-slate-700"
                                >
                                    <i className="fas fa-camera text-dirole-primary"></i> Tirar Foto
                                </button>
                                <div className="text-center text-[10px] text-slate-500">- OU -</div>
                                <input
                                    type="url"
                                    value={customAvatarUrl}
                                    onChange={(e) => setCustomAvatarUrl(e.target.value)}
                                    placeholder="Cole o link da sua foto (https://...)"
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white text-xs focus:outline-none focus:border-dirole-primary"
                                />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Seu Apelido</label>
                            <input
                                type="text"
                                value={nickname}
                                onChange={(e) => setNickname(e.target.value)}
                                placeholder="Como quer ser chamado?"
                                maxLength={15}
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-dirole-primary font-bold text-sm"
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase ml-1">Nome Completo</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nome"
                                required
                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-dirole-primary text-sm"
                            />
                        </div>

                        <div className="pt-4 space-y-3">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-white/10 border border-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center text-sm"
                            >
                                {isSaving ? <i className="fas fa-circle-notch fa-spin"></i> : 'Salvar Alterações'}
                            </button>

                            {isGuest ? (
                                <button
                                    type="button"
                                    onClick={() => { if(onLogout) onLogout(); }}
                                    className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-3 rounded-xl shadow-lg active:scale-95 transition-all"
                                >
                                    Criar Conta Oficial
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="w-full text-red-500 font-bold bg-red-500/10 border border-red-500/20 py-3 rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                                >
                                    Sair da Conta
                                </button>
                            )}

                            <div className="pt-4 border-t border-white/10">
                                <p className="text-[10px] font-bold text-slate-500 uppercase mb-2 text-center">Privacidade e Dados</p>
                                <button
                                    type="button"
                                    onClick={onOpenPrivacy}
                                    className="w-full text-slate-400 text-xs py-2 hover:text-white transition-colors mb-2"
                                >
                                    Ler Política de Privacidade
                                </button>
                                {!isGuest && (
                                    <button
                                        type="button"
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="w-full text-red-800 text-xs py-2 hover:text-red-500 transition-colors"
                                    >
                                        Excluir Minha Conta Definitivamente
                                    </button>
                                )}
                            </div>
                        </div>
                    </form>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
