import React from 'react';
import { Location } from '../types';
import { Thermometer } from './Thermometer';

interface ListViewProps {
  locations: Location[];
  onCheckIn: (loc: Location) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onOpenDetails: (loc: Location) => void;
}

export const ListView: React.FC<ListViewProps> = ({ locations, onCheckIn, favorites, onToggleFavorite, onOpenDetails }) => {
  return (
    <div className="pb-32 px-4 pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-7xl mx-auto">
      {locations.map((loc, index) => {
        const isFav = favorites.includes(loc.id);

        return (
          <div
            key={loc.id}
            onClick={() => onOpenDetails(loc)}
            className="group relative bg-[#120822] rounded-[1.5rem] border border-white/5 overflow-hidden transition-all duration-300 hover:scale-[1.01] hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] cursor-pointer flex flex-col items-stretch animate-fade-in-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Image Section */}
            <div className="h-40 relative shrink-0 overflow-hidden">
              <img
                src={loc.imageUrl}
                alt={loc.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#120822] to-transparent"></div>

              {/* Badges Top Left */}
              <div className="absolute top-3 left-3 flex gap-2">
                {loc.isOpen ? (
                  <div className="bg-green-500/90 backdrop-blur text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1 border border-green-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Aberto
                  </div>
                ) : (
                  <div className="bg-red-500/90 backdrop-blur text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg border border-red-400/20">
                    Fechado
                  </div>
                )}
                {loc.stats.avgVibe > 2.3 && (
                  <div className="bg-orange-500/90 backdrop-blur text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-lg border border-orange-400/20 flex items-center gap-1">
                    <i className="fas fa-fire"></i> Hot
                  </div>
                )}
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(loc.id);
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur border border-white/10 flex items-center justify-center text-white active:scale-95 transition-all hover:bg-black/60"
              >
                <i className={`fas fa-heart transition-colors ${isFav ? 'text-red-500 fa-lg drop-shadow-[0_2px_10px_rgba(239,68,68,0.5)]' : 'text-slate-300'}`}></i>
              </button>
            </div>

            {/* Content Section */}
            <div className="px-5 pb-5 pt-0 flex-1 flex flex-col hover:bg-white/[0.02] transition-colors relative z-10 -mt-2">

              <div className="flex justify-between items-start mb-1">
                <div>
                  <span className="text-[10px] font-bold text-dirole-primary uppercase tracking-wider mb-1 block">
                    {loc.type}
                  </span>
                  <h3 className="font-extrabold text-xl text-white leading-tight mb-1">{loc.name}</h3>
                  <p className="text-xs text-slate-400 truncate max-w-[200px] flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-[10px] opacity-70"></i>
                    {loc.distance ? `${(loc.distance / 1000).toFixed(1)} km` : '...'} • {loc.address.split(',')[0]}
                  </p>
                </div>
                {/* Compact Review Circle */}
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-xl bg-[#1a0f2e] border border-dirole-primary/30 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.1)]">
                    <span className="text-sm font-black text-white">{loc.stats.avgCrowd.toFixed(1)}</span>
                  </div>
                  <span className="text-[8px] font-bold text-slate-500 mt-1 uppercase">Lotação</span>
                </div>
              </div>

              {/* Tags / Stats */}
              <div className="mt-4 mb-5">
                <Thermometer stats={loc.stats} compact />
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(loc);
                }}
                className="w-full mt-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-3.5 rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 group-hover:border-dirole-primary/30"
              >
                <i className="fas fa-plus-circle text-dirole-primary"></i> <span className="text-xs tracking-wide">CHECK-IN RÁPIDO</span>
              </button>

            </div>
          </div>
        );
      })}

      {locations.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-8 border border-white/5 rounded-[2.5rem] mx-4 bg-[#120822] animate-fade-in">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-dirole-primary/20 to-dirole-secondary/20 rounded-full flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(139,92,246,0.1)]">
              🔭
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0f0518] border border-white/10 rounded-full flex items-center justify-center text-lg animate-bounce">
              ✨
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-3 tracking-tight">O horizonte está vazio.</h3>
          <p className="text-slate-400 text-center max-w-xs mb-8 font-medium leading-relaxed">
            Não encontramos rolês neste raio de busca. Que tal ser o herói da noite e adicionar o primeiro?
          </p>

          <div className="w-full max-w-xs">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('open-add-location'))}
              className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-black py-4 rounded-2xl shadow-xl shadow-purple-900/30 active:scale-95 transition-all mb-4"
            >
              ADICIONAR NOVO LOCAL
            </button>
            <p className="text-[10px] text-slate-500 text-center uppercase tracking-[0.2em] font-bold">
              Ou tente expandir seu raio de busca
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
