
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
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md">
      <div className="bg-dirole-bg w-full sm:w-[450px] max-h-[90vh] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col animate-slide-up shadow-2xl">
        
        <div className="p-5 border-b border-white/10 flex justify-between items-center">
            <div>
                <h2 className="text-xl font-bold text-white">Bora pro Rolê? 🚀</h2>
                <p className="text-xs text-slate-400">Chamando para: <span className="text-dirole-primary font-bold">{location.name}</span></p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white">
                <i className="fas fa-times"></i>
            </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
            
            {friends.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                    <p>Adicione amigos primeiro para convidar!</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {friends.map(friend => {
                        const isSelected = selectedIds.includes(friend.id);
                        return (
                            <div 
                                key={friend.id}
                                onClick={() => toggleSelection(friend.id)}
                                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                    isSelected 
                                    ? 'bg-dirole-primary/20 border-dirole-primary' 
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-white/10 overflow-hidden">
                                        {friend.avatar?.startsWith('http') ? <img src={friend.avatar} className="w-full h-full object-cover" /> : friend.avatar}
                                    </div>
                                    <span className="text-white font-bold text-sm">{friend.name}</span>
                                </div>
                                <div className={`w-6 h-6 rounded-full border flex items-center justify-center ${isSelected ? 'bg-dirole-primary border-transparent' : 'border-slate-500'}`}>
                                    {isSelected && <i className="fas fa-check text-xs text-white"></i>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedIds.length > 0 && (
                <div className="mt-4">
                    <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Mensagem (Opcional)</label>
                    <textarea 
                        value={message}
                        onChange={e => setMessage(e.target.value)}
                        placeholder="Ex: Chego em 10 min, bora?"
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-dirole-primary resize-none h-20"
                    />
                </div>
            )}
        </div>

        <div className="p-4 border-t border-white/10 bg-black/20">
            <button
                onClick={handleSend}
                disabled={selectedIds.length === 0 || isSending}
                className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
                {isSending ? 'Enviando...' : `Enviar Convites (${selectedIds.length})`}
            </button>
        </div>

      </div>
    </div>
  );
};
