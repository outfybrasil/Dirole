import React, { useEffect, useState } from 'react';
import { User, Invite, FriendUser, FriendshipStatus } from '../types';
import { getPendingInvites, getPendingFriendRequests, updateInviteStatus, respondToFriendRequest, triggerHaptic } from '../services/mockService';

interface NotificationsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose, currentUser }) => {
    const [invites, setInvites] = useState<Invite[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'invites' | 'friends'>('friends');

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch pending invites
            const inviteData = await getPendingInvites(currentUser.id);
            setInvites(inviteData);

            // 2. Fetch pending friend requests
            const validRequests = await getPendingFriendRequests(currentUser.id);
            setFriendRequests(validRequests);
        } catch (e) {
            console.error("[Notifications] Error in fetchNotifications:", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInviteAction = async (inviteId: string, status: 'accepted' | 'declined') => {
        triggerHaptic();
        try {
            const success = await updateInviteStatus(inviteId, status);
            if (success) {
                setInvites(prev => prev.filter(i => i.id !== inviteId));
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleFriendAction = async (friendshipId: string, accept: boolean) => {
        triggerHaptic();
        const success = await respondToFriendRequest(friendshipId, accept);
        if (success) {
            setFriendRequests(prev => prev.filter(f => f.friendshipId !== friendshipId));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[85vh] overflow-hidden">

                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                <div className="p-8 pt-10 pb-4">
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic">Radar Social</h2>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-dirole-primary animate-pulse"></div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                            SEUS ALERTAS E CONVITES
                        </p>
                    </div>
                </div>

                <div className="px-8 mb-6">
                    <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                        <button
                            onClick={() => setActiveTab('friends')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'friends' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-500'}`}
                        >
                            Pedidos ({friendRequests.length})
                        </button>
                        <button
                            onClick={() => setActiveTab('invites')}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'invites' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-500'}`}
                        >
                            Convites ({invites.length})
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-8 pb-10 space-y-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="w-8 h-8 border-2 border-dirole-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sintonizando...</span>
                        </div>
                    ) : activeTab === 'invites' ? (
                        invites.length === 0 ? (
                            <div className="py-16 text-center opacity-50">
                                <div className="text-4xl mb-4">🏜️</div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nenhum convite pendente</p>
                            </div>
                        ) : (
                            invites.map(invite => (
                                <div key={invite.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-5 animate-fade-in">
                                    <h4 className="text-white font-black text-sm uppercase tracking-tight leading-tight mb-1">
                                        Bora pro {invite.locationName}?
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-4 leading-relaxed">
                                        "{invite.message || 'Bora pro rolê!'}"
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleInviteAction(invite.id, 'accepted')}
                                            className="flex-1 bg-white text-black text-[10px] font-black py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            Vou!
                                        </button>
                                        <button
                                            onClick={() => handleInviteAction(invite.id, 'declined')}
                                            className="bg-white/5 text-slate-500 text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest active:scale-95 transition-all"
                                        >
                                            Não dá
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    ) : (
                        friendRequests.length === 0 ? (
                            <div className="py-16 text-center opacity-50">
                                <div className="text-4xl mb-4">👤</div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sem solicitações no momento</p>
                            </div>
                        ) : (
                            friendRequests.map(user => (
                                <div key={user.id} className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 flex items-center gap-4 animate-fade-in">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-800 overflow-hidden shrink-0">
                                        {user.avatar?.startsWith('http') ? (
                                            <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl">{user.avatar}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1 truncate">{user.name}</h4>
                                        <span className="text-[9px] font-black text-dirole-secondary uppercase tracking-widest">LVL {user.level}</span>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleFriendAction(user.friendshipId!, true)}
                                            className="w-10 h-10 rounded-xl bg-dirole-primary text-white flex items-center justify-center shadow-lg shadow-purple-900/40 active:scale-90 transition-all font-black text-lg"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => handleFriendAction(user.friendshipId!, false)}
                                            className="w-10 h-10 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center active:scale-90 transition-all font-black text-lg border border-red-500/20 shadow-lg shadow-red-900/20"
                                        >
                                            ×
                                        </button>
                                    </div>
                                </div>
                            ))
                        )
                    )}
                </div>
            </div>
            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 4px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.3); border-radius: 10px; }
            `}</style>
        </div>
    );
};
