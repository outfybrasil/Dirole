
import React, { useState, useEffect } from 'react';
import { User, FriendUser, Location, FriendshipStatus } from '../types';
import { getFriends, sendInvites, triggerHaptic } from '../services/mockService';

interface InviteFriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    location: Location | null;
    onSuccess: () => void;
}

export const InviteFriendsModal: React.FC<InviteFriendsModalProps> = ({ isOpen, onClose, currentUser, location, onSuccess }) => {
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (isOpen && currentUser) {
            loadFriends();
        }
    }, [isOpen, currentUser]);

    const loadFriends = async () => {
        if (!currentUser) return;
        const all = await getFriends(currentUser.id);
        setFriends(all.filter(f => f.friendshipStatus === FriendshipStatus.ACCEPTED));
    };

    const toggleSelection = (id: string) => {
        triggerHaptic(10);
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleSend = async () => {
        if (!currentUser || !location || selectedIds.length === 0) return;
        setIsSending(true);

        const success = await sendInvites(currentUser, selectedIds, location.id, location.name, message);

        if (success) {
            triggerHaptic([50, 50]);
            onSuccess();
            onClose();
            // Reset
            setSelectedIds([]);
            setMessage('');
        } else {
            alert("Erro ao enviar convites.");
        }
        setIsSending(false);
    };

    if (!isOpen || !location) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden relative isolate">

                {/* Grabber Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                {/* HEADER */}
                <div className="p-8 pt-10 pb-4 relative z-10 flex justify-between items-start bg-white/[0.02]">
                    <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                        <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic">Bora pro Rolê?</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-dirole-primary animate-pulse"></div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                CHAMAR GALERA PARA <span className="text-dirole-primary">{location.name.toUpperCase()}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 relative z-10 custom-scrollbar">

                    {friends.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-500 animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/5">
                                <i className="fas fa-user-friends text-2xl opacity-20"></i>
                            </div>
                            <p className="text-[10px] font-black text-white uppercase tracking-widest text-center mb-2">Sua lista está vazia</p>
                            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter text-center max-w-[200px]">Adicione amigos para encontrá-los nos rolês!</p>
                        </div>
                    ) : (
                        <div className="space-y-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Selecione os convidados</label>
                            <div className="grid grid-cols-1 gap-2">
                                {friends.map((friend, idx) => {
                                    const isSelected = selectedIds.includes(friend.id);
                                    return (
                                        <div
                                            key={friend.id}
                                            onClick={() => toggleSelection(friend.id)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all animate-fade-in-up cursor-pointer overflow-hidden relative group ${isSelected
                                                    ? 'bg-dirole-primary/10 border-dirole-primary/50 ring-1 ring-dirole-primary/50'
                                                    : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                }`}
                                            style={{ animationDelay: `${200 + (idx * 50)}ms` }}
                                        >
                                            <div className="flex items-center gap-4 relative z-10">
                                                <div className={`w-12 h-12 rounded-full p-[2px] transition-all group-hover:scale-110 ${isSelected ? 'bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'bg-white/10'}`}>
                                                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center border-2 border-slate-900 overflow-hidden text-xl shadow-inner">
                                                        {friend.avatar?.startsWith('http') ? <img src={friend.avatar} className="w-full h-full object-cover" /> : friend.avatar}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white uppercase tracking-tight">{friend.name}</p>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">LVL {friend.level}</p>
                                                </div>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 transition-all relative z-10 flex items-center justify-center ${isSelected ? 'bg-white border-white' : 'border-white/10'}`}>
                                                {isSelected && <i className="fas fa-check text-[10px] text-black font-black"></i>}
                                            </div>

                                            {/* Selection Glow */}
                                            {isSelected && <div className="absolute inset-0 bg-dirole-primary/5 animate-pulse"></div>}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedIds.length > 0 && (
                        <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">O Recado (Opcional)</label>
                            <div className="bg-white/5 rounded-2xl border border-white/5 focus-within:border-dirole-primary focus-within:bg-white/10 transition-all shadow-inner overflow-hidden">
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder="EX: CHEGO EM 10 MIN, BORA?"
                                    className="w-full bg-transparent border-none p-5 text-sm text-white focus:outline-none focus:ring-0 resize-none h-24 placeholder-slate-700 font-medium"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-8 pb-10 border-t border-white/5 bg-white/[0.02] relative z-20">
                    <button
                        onClick={handleSend}
                        disabled={selectedIds.length === 0 || isSending}
                        className={`w-full font-black py-5 rounded-[1.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4 text-xs uppercase tracking-[0.2em] ${selectedIds.length > 0
                                ? 'bg-white text-black hover:bg-slate-200'
                                : 'bg-white/5 text-slate-600 border border-white/5 shadow-none'
                            }`}
                    >
                        {isSending ? (
                            <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> ENVIANDO...</>
                        ) : (
                            <>
                                <i className={`fas fa-paper-plane ${selectedIds.length > 0 ? 'text-dirole-primary' : 'text-slate-700'}`}></i>
                                {selectedIds.length === 0 ? 'SELECIONE AMIGOS' : `CONVOCAR ${selectedIds.length} ${selectedIds.length === 1 ? 'PARÇA' : 'PARÇAS'}`}
                            </>
                        )}
                    </button>
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
        `}</style>
            </div>
        </div>
    );
};
