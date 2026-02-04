import React from 'react';
import { Location } from '../types';
import { Thermometer } from './Thermometer';
import { LocationCardSkeleton } from './Skeleton';

interface ListViewProps {
  locations: Location[];
  onCheckIn: (loc: Location) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDetails: (loc: Location) => void;
  isLoading?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({ locations, onCheckIn, favorites, onToggleFavorite, onOpenDetails, isLoading }) => {
  if (isLoading) {
    return (
      <div className="pb-32 px-4 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
        {[...Array(6)].map((_, i) => <LocationCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className="pb-32 px-4 pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      {locations.map((loc, index) => {
        const isFav = favorites.includes(loc.id);

        return (
          <div
            key={loc.id}
            onClick={() => onOpenDetails(loc)}
            className="group relative bg-[#1a0f2e]/50 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4),0_0_20px_rgba(139,92,246,0.1)] cursor-pointer flex flex-col items-stretch animate-fade-in-up"
            style={{ animationDelay: `${index * 80}ms` }}
          >
            {/* Image Section */}
            <div className="h-48 relative shrink-0 overflow-hidden">
              <img
                src={loc.imageUrl}
                alt={loc.name}
                className="w-full h-full object-cover transition-transform duration-1000 cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a0f2e] via-[#1a0f2e]/20 to-transparent"></div>

              {/* Badges Top Left */}
              <div className="absolute top-4 left-4 flex gap-2">
                {loc.isOpen ? (
                  <div className="bg-green-500 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 border border-white/10">
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span> Aberto
                  </div>
                ) : (
                  <div className="bg-slate-800 text-slate-400 text-[9px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg border border-white/5">
                    Fechado
                  </div>
                )}
                {loc.stats.avgVibe > 2.3 && (
                  <div className="bg-indigo-600 text-white text-[9px] font-black uppercase px-3 py-1.5 rounded-xl shadow-lg border border-white/10 flex items-center gap-1.5">
                    <i className="fas fa-bolt text-[10px]"></i> Bombando
                  </div>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(loc.id);
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-90 transition-all hover:bg-black/60 group/fav"
              >
                <i className={`fas fa-heart transition-all duration-300 ${isFav ? 'text-red-500 scale-110 drop-shadow-[0_0_10px_rgba(239,68,68,0.6)]' : 'text-slate-300 group-hover/fav:text-white'}`}></i>
              </button>
            </div>

            {/* Content Section */}
            <div className="px-6 pb-6 pt-0 flex-1 flex flex-col relative z-20 -mt-6">

              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-dirole-primary/10 border border-dirole-primary/20 text-[8px] font-black text-dirole-primary uppercase tracking-widest">
                      {loc.type}
                    </span>
                    <span className="text-[10px] font-black text-slate-500 tracking-widest ml-1">
                      {'$'.repeat(Math.max(1, Math.min(3, Math.round(loc.stats.avgPrice || 1))))}
                    </span>
                  </div>
                  <h3 className="font-black text-2xl text-white leading-tight mb-2 tracking-tight group-hover:text-dirole-primary transition-colors">{loc.name}</h3>
                  <p className="text-xs text-slate-400 truncate flex items-center gap-1.5 font-medium">
                    <i className="fas fa-map-marker-alt text-[10px] text-dirole-primary opacity-70"></i>
                    {loc.distance ? `${(loc.distance / 1000).toFixed(1)} km` : '...'} • {loc.address.split(',')[0]}
                  </p>
                </div>

                {/* Score badge */}
                <div className="shrink-0 flex flex-col items-end">
                  <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center shadow-inner group-hover:border-dirole-primary/30 transition-colors">
                    <span className="text-lg font-black text-white leading-none">{loc.stats.avgCrowd.toFixed(1)}</span>
                    <span className="text-[7px] font-black text-slate-500 uppercase mt-0.5 tracking-tighter">Vibe</span>
                  </div>
                </div>
              </div>

              {/* Progress meters */}
              <div className="mt-4 mb-6">
                <Thermometer stats={loc.stats} compact />
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(loc);
                }}
                className="w-full mt-auto bg-gradient-to-r from-white/5 to-white/[0.08] hover:from-dirole-primary hover:to-dirole-secondary border border-white/10 hover:border-transparent text-white font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-3 group/btn shadow-lg"
              >
                <i className="fas fa-plus-circle text-dirole-primary group-hover/btn:text-white transition-colors"></i>
                <span className="text-[10px] tracking-[0.1em] uppercase">Check-in Rápido</span>
              </button>

            </div>
          </div>
        );
      })}

      {locations.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-24 px-10 glass-panel rounded-[3rem] mx-4 animate-fade-in text-center">
          <div className="relative mb-10">
            <div className="w-32 h-32 bg-gradient-to-br from-dirole-primary/20 to-indigo-500/20 rounded-[2.5rem] flex items-center justify-center text-6xl shadow-[0_0_80px_rgba(139,92,246,0.2)] rotate-3">
              🛰️
            </div>
            <div className="absolute -top-3 -right-3 w-12 h-12 bg-[#0f0518] border border-white/10 rounded-2xl flex items-center justify-center text-xl animate-pulse shadow-xl">
              ✨
            </div>
          </div>

          <h3 className="text-3xl font-black text-white mb-4 tracking-tight">Vazio absoluto por aqui.</h3>
          <p className="text-slate-400 text-center max-w-sm mb-10 font-medium leading-relaxed uppercase text-[11px] tracking-widest">
            Não encontramos nenhum rolê operando neste quadrante. Que tal descobrir um agora?
          </p>

          <div className="w-full max-w-sm space-y-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-location'))}
              className="w-full bg-gradient-to-r from-dirole-primary via-indigo-500 to-dirole-secondary text-white font-black py-5 rounded-[2rem] shadow-[0_20px_40px_rgba(139,92,246,0.3)] active:scale-95 transition-all text-sm tracking-widest uppercase"
            >
              Adicionar Localização
            </button>
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] opacity-50">
              Ou tente expandir seu raio nos filtros
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
