
import React, { useState } from 'react';
import { Location, Review, User } from '../types';
import { submitReview, triggerHaptic } from '../services/mockService';
import { MOCK_USER_ID } from '../constants';

interface ReviewModalProps {
  location: Location;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (points: number) => void;
  onLogout?: () => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ location, currentUser, isOpen, onClose, onSuccess, onLogout }) => {
  // Simplified State - Defaults to "Average" (2)
  const [crowd, setCrowd] = useState(2);
  const [vibe, setVibe] = useState(2);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGuest = currentUser?.id.startsWith('guest_');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // BLOCK GUEST ACTION
    if (isGuest) {
        if (confirm("Este recurso é exclusivo para membros. Deseja criar uma conta gratuita agora?")) {
            onClose();
            if (onLogout) onLogout();
        }
        return;
    }

    setIsSubmitting(true);

    const review: Review = {
      userId: currentUser?.id || MOCK_USER_ID,
      userName: currentUser?.name || 'Anônimo',
      userAvatar: currentUser?.avatar || '👻',
      locationId: location.id,
      // SIMPLIFIED DATA MODEL:
      // We send 0 for price/gender to satisfy DB constraints without bothering the user
      price: 0, 
      crowd,
      gender: 0, 
      vibe,
      comment,
      createdAt: new Date()
    };

    try {
      await submitReview(review, location);
      onSuccess(10);
      onClose();
      setComment('');
      // Reset defaults
      setCrowd(2);
      setVibe(2);
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const OptionButton = ({ 
      selected, 
      onClick, 
      icon, 
      label, 
      colorClass 
  }: { 
      selected: boolean, 
      onClick: () => void, 
      icon: string, 
      label: string, 
      colorClass: string 
  }) => (
      <button
          type="button"
          onClick={() => { triggerHaptic(); onClick(); }}
          className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${
              selected 
              ? `${colorClass} text-white shadow-lg border-transparent transform scale-105` 
              : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
          }`}
      >
          <span className="text-xl">{icon}</span>
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-dirole-bg w-full sm:w-[400px] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 animate-slide-up shadow-2xl relative overflow-hidden">
        
        {/* Decorative BG */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-dirole-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white">{location.name}</h2>
            <p className="text-xs text-slate-400">
                {isGuest ? 'Recurso bloqueado' : 'Check-in Rápido (+10 XP)'}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          
          {/* LOTAÇÃO */}
          <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <i className="fas fa-users"></i> Como está a Lotação?
              </label>
              <div className="flex gap-2">
                  <OptionButton 
                      selected={crowd === 1} 
                      onClick={() => setCrowd(1)} 
                      icon="🟢" 
                      label="Vazio" 
                      colorClass="bg-green-600"
                  />
                  <OptionButton 
                      selected={crowd === 2} 
                      onClick={() => setCrowd(2)} 
                      icon="🟡" 
                      label="Médio" 
                      colorClass="bg-yellow-600"
                  />
                  <OptionButton 
                      selected={crowd === 3} 
                      onClick={() => setCrowd(3)} 
                      icon="🔴" 
                      label="Lotado" 
                      colorClass="bg-red-600"
                  />
              </div>
          </div>

          {/* VIBE */}
          <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                  <i className="fas fa-fire"></i> Como está a Vibe?
              </label>
              <div className="flex gap-2">
                  <OptionButton 
                      selected={vibe === 1} 
                      onClick={() => setVibe(1)} 
                      icon="💤" 
                      label="Morta" 
                      colorClass="bg-slate-600"
                  />
                  <OptionButton 
                      selected={vibe === 2} 
                      onClick={() => setVibe(2)} 
                      icon="👌" 
                      label="Legal" 
                      colorClass="bg-blue-600"
                  />
                  <OptionButton 
                      selected={vibe === 3} 
                      onClick={() => setVibe(3)} 
                      icon="🔥" 
                      label="Incrível" 
                      colorClass="bg-orange-500"
                  />
              </div>
          </div>

          {/* COMENTÁRIO */}
          <div className="bg-white/5 p-1 rounded-xl border border-white/5">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={140}
              placeholder={isGuest ? "Crie uma conta para comentar..." : "Alguma dica? (Opcional)"}
              disabled={!!isGuest}
              className="w-full bg-transparent border-none p-3 text-sm text-white focus:outline-none focus:ring-0 resize-none h-16 placeholder-slate-500"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 ${
                isGuest 
                ? 'bg-slate-700 text-slate-300' 
                : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-purple-900/30'
            }`}
          >
            {isSubmitting ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Enviando...</>
            ) : (
                isGuest ? 'Criar Conta' : 'Confirmar Check-in'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
