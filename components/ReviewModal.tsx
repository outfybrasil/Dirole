
import React, { useState, useMemo } from 'react';
import { Location, Review, User } from '../types';
import { submitReview, triggerHaptic, calculateDistance } from '../services/mockService';
import { MOCK_USER_ID } from '../constants';

interface ReviewModalProps {
  location: Location;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (points: number) => void;
  onLogout?: () => void;
  userLocation: { lat: number; lng: number } | null;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ location, currentUser, isOpen, onClose, onSuccess, onLogout, userLocation }) => {
  // Simplified State - Defaults to "Average" (2)
  const [crowd, setCrowd] = useState(2);
  const [price, setPrice] = useState(2);
  const [vibe, setVibe] = useState(2);
  const [comment, setComment] = useState('');
  const [isOpenStatus, setIsOpenStatus] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isGuest = currentUser?.id.startsWith('guest_');

  const distance = useMemo(() => {
    if (!userLocation || !location) return null;
    return calculateDistance(
      userLocation.lat,
      userLocation.lng,
      location.latitude,
      location.longitude
    );
  }, [userLocation, location]);

  const isTooFar = distance !== null && distance > 300;

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

    // GEOFENCING CHECK (Extra safety)
    if (isTooFar) {
      alert(`Você está muito longe para fazer check-in! 📍\nDistância atual: ${Math.round(distance || 0)}m`);
      setIsSubmitting(false);
      return;
    }

    if (!userLocation) {
      alert("Não conseguimos validar sua localização. Ative o GPS e tente novamente!");
      setIsSubmitting(false);
      return;
    }

    const review: Review = {
      userId: currentUser?.id || MOCK_USER_ID,
      userName: currentUser?.name || 'Anônimo',
      userAvatar: currentUser?.avatar || '👻',
      locationId: location.id,
      // SIMPLIFIED DATA MODEL:
      price,
      crowd,
      gender: 0,
      vibe,
      comment,
      createdAt: new Date()
    };

    try {
      const success = await submitReview(review, location);

      if (!success) {
        // Error handled by service alerts
        return;
      }

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
      className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 active:scale-95 ${selected
        ? `${colorClass} text-white shadow-lg border-transparent transform scale-105`
        : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
        }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden relative isolate">

        {/* Grabber Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

        {/* HEADER */}
        <div className="p-8 pt-10 pb-4 relative z-10 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black text-white leading-tight tracking-tight">{location.name.toUpperCase()}</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-dirole-primary animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                {isGuest ? 'ACESSO LIMITADO' : 'CHECK-IN RÁPIDO (+10 XP)'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 relative z-10 custom-scrollbar">

          {/* PREÇO */}
          <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Faixa de Preço
            </label>
            <div className="flex gap-3">
              <OptionButton
                selected={price === 1}
                onClick={() => setPrice(1)}
                icon="💲"
                label="Barato"
                colorClass="bg-green-600 shadow-green-900/40"
              />
              <OptionButton
                selected={price === 2}
                onClick={() => setPrice(2)}
                icon="💵"
                label="Médio"
                colorClass="bg-blue-600 shadow-blue-900/40"
              />
              <OptionButton
                selected={price === 3}
                onClick={() => setPrice(3)}
                icon="💸"
                label="Caro"
                colorClass="bg-purple-600 shadow-purple-900/40"
              />
            </div>
          </div>

          {/* LOTAÇÃO */}
          <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Lotação Atual
            </label>
            <div className="flex gap-3">
              <OptionButton
                selected={crowd === 1}
                onClick={() => setCrowd(1)}
                icon="🟢"
                label="Tranquilo"
                colorClass="bg-emerald-600 shadow-emerald-900/40"
              />
              <OptionButton
                selected={crowd === 2}
                onClick={() => setCrowd(2)}
                icon="🟡"
                label="Normal"
                colorClass="bg-amber-500 shadow-amber-900/40"
              />
              <OptionButton
                selected={crowd === 3}
                onClick={() => setCrowd(3)}
                icon="🔴"
                label="Fervendo"
                colorClass="bg-rose-600 shadow-rose-900/40"
              />
            </div>
          </div>

          {/* VIBE */}
          <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">
              Vibe do Momento
            </label>
            <div className="flex gap-3">
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
                colorClass="bg-sky-600 shadow-sky-900/40"
              />
              <OptionButton
                selected={vibe === 3}
                onClick={() => setVibe(3)}
                icon="🔥"
                label="Incrível"
                colorClass="bg-orange-500 shadow-orange-900/40"
              />
            </div>
          </div>

          {/* ESTÁ ABERTO? (iOS Switch Style) */}
          <div className="flex items-center justify-between bg-white/5 p-5 rounded-[1.5rem] border border-white/5 animate-fade-in" style={{ animationDelay: '400ms' }}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${isOpenStatus ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                <i className={`fas ${isOpenStatus ? 'fa-door-open' : 'fa-door-closed'}`}></i>
              </div>
              <div>
                <span className="text-sm font-black text-white block uppercase tracking-tight">O local está aberto?</span>
                <p className="text-[10px] font-bold text-slate-500 mt-0.5">{isOpenStatus ? 'Todos podem entrar' : 'Reportar fechamento'}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { triggerHaptic(); setIsOpenStatus(!isOpenStatus); }}
              className={`w-14 h-8 rounded-full transition-all relative ${isOpenStatus ? 'bg-green-500' : 'bg-white/10'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full shadow-lg absolute top-1 transition-all ${isOpenStatus ? 'left-7' : 'left-1'}`}></div>
            </button>
          </div>

          {/* COMENTÁRIO */}
          <div className="space-y-3 animate-fade-in" style={{ animationDelay: '500ms' }}>
            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Comentário (Opcional)</label>
            <div className="bg-white/5 rounded-2xl border border-white/5 focus-within:border-dirole-primary focus-within:bg-white/10 transition-all shadow-inner overflow-hidden">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={140}
                placeholder={isGuest ? "Crie uma conta para detalhar seu rolê..." : "Alguma dica importante? Pessoas, música, preços..."}
                disabled={!!isGuest}
                className="w-full bg-transparent border-none p-5 text-sm text-white focus:outline-none focus:ring-0 resize-none h-24 placeholder-slate-700 font-medium"
              />
              <div className="bg-black/20 px-5 py-2 flex justify-end">
                <span className="text-[10px] font-black text-slate-700 uppercase">{comment.length}/140</span>
              </div>
            </div>
          </div>

          <div className="pt-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <button
              type="submit"
              disabled={isSubmitting || isTooFar}
              className={`w-full font-black py-5 rounded-[1.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] ${isGuest
                ? 'bg-white/5 text-slate-500 border border-white/5'
                : isTooFar
                  ? 'bg-slate-800 text-slate-500 border border-white/5 cursor-not-allowed'
                  : 'bg-white text-black hover:bg-slate-200'
                }`}
            >
              {isSubmitting ? (
                <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> ENVIANDO...</>
              ) : (
                isGuest ? 'FAZER LOGIN' : 'CONFIRMAR CHECK-IN'
              )}
            </button>
            {isTooFar && (
              <p className="text-center text-[10px] font-bold text-red-500/80 uppercase tracking-widest mt-4 animate-pulse">
                📍 Você está a {Math.round(distance || 0)}m (Limite: 300m)
              </p>
            )}
          </div>
        </form>
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
  );
};
