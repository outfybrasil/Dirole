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
  isSidebar?: boolean;
}

export const ListView: React.FC<ListViewProps> = ({ locations, onCheckIn, favorites, onToggleFavorite, onOpenDetails, isLoading, isSidebar }) => {
  if (isLoading) {
    return (
      <div className={`pb-32 px-4 pt-6 grid gap-5 max-w-7xl mx-auto ${isSidebar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
        {[...Array(6)].map((_, i) => <LocationCardSkeleton key={i} />)}
      </div>
    );
  }

  return (
    <div className={`pb-32 px-4 pt-6 grid gap-8 max-w-7xl mx-auto ${isSidebar ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
      {locations.map((loc, index) => {
        const isFav = favorites.includes(loc.id);

        return (
          <div
            key={loc.id}
            onClick={() => onOpenDetails(loc)}
            className="group relative bg-[#1a0f2e]/40 backdrop-blur-xl rounded-[2.5rem] border border-white/5 overflow-hidden transition-all duration-700 hover:scale-[1.015] hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6),0_0_30px_rgba(139,92,246,0.15)] cursor-pointer flex flex-col items-stretch animate-staggered-slide-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            {/* Image & Overlay Section */}
            <div className={`relative ${isSidebar ? 'h-40' : 'h-52'} overflow-hidden shrink-0`}>
              <img
                src={loc.imageUrl}
                alt={loc.name}
                className="w-full h-full object-cover transition-transform duration-[1.5s] cubic-bezier(0.16, 1, 0.3, 1) group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#140a24] via-[#140a24]/30 to-transparent"></div>

              {/* Status Pills */}
              <div className="absolute top-4 left-4 flex flex-wrap gap-2 pr-14">
                <div className={`px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-2 shadow-lg transition-transform group-hover:scale-105 ${loc.isOpen ? 'bg-green-500/20 border-green-500/30' : 'bg-slate-900/60 border-white/10'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${loc.isOpen ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${loc.isOpen ? 'text-green-400' : 'text-slate-400'}`}>
                    {loc.isOpen ? 'ON' : 'OFF'}
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-[9px] font-black text-white/90 uppercase tracking-widest flex items-center gap-2 group-hover:border-dirole-primary/40 transition-colors shadow-lg">
                  <i className="fas fa-tag text-dirole-primary/70 text-[8px]"></i>
                  {loc.type}
                </div>
              </div>

              {/* VIP/BOMBANDO Badge */}
              {loc.stats.avgVibe > 2.3 && (
                <div className="absolute -right-8 top-6 rotate-45 bg-gradient-to-r from-dirole-primary to-dirole-secondary px-10 py-1 shadow-2xl z-20">
                  <span className="text-[8px] font-black text-white uppercase tracking-[0.2em]">HIT!</span>
                </div>
              )}

              {/* Favorite Button (Premium Heart) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(loc.id);
                }}
                className="absolute top-4 right-4 w-10 h-10 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white active:scale-75 transition-all hover:bg-white/10 hover:border-red-500/30 shadow-2xl group/fav z-30"
              >
                <i className={`fas fa-heart transition-all duration-500 ${isFav ? 'text-red-500 scale-125 drop-shadow-[0_0_15px_rgba(239,68,68,0.7)]' : 'text-white/40 group-hover/fav:text-white/80'}`}></i>
              </button>
            </div>

            {/* Content Body */}
            <div className="px-7 pt-5 pb-7 flex-1 flex flex-col relative">
              <div className="flex justify-between items-start gap-3 mb-4">
                <div className="flex-1">
                  <h3 className="font-black text-2xl text-white leading-none tracking-tighter mb-2 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all duration-500">
                    {loc.name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 tracking-tight">
                      <i className="fas fa-map-marker-alt text-dirole-primary/60"></i>
                      {loc.address.split(',')[0]}
                    </p>
                    <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                    <p className="text-[10px] font-black text-dirole-secondary tracking-widest uppercase">
                      {loc.distance ? `${(loc.distance / 1000).toFixed(1)} km` : '...'}
                    </p>
                  </div>
                </div>

                {/* Integrated Vibe Pill */}
                <div className="group/therm mt-1">
                  <Thermometer stats={loc.stats} compact />
                </div>
              </div>

              {/* Dynamic Crowd Meter */}
              <div className="bg-white/[0.03] rounded-2xl p-4 border border-white/5 mb-6 group-hover:bg-white/[0.05] transition-colors">
                <div className="flex justify-between items-end mb-2.5">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <i className="fas fa-users-rays text-dirole-primary/60"></i>
                    Movimento
                  </span>
                  <span className="text-[10px] font-black text-white px-2 py-0.5 rounded-lg bg-dirole-primary/20 border border-dirole-primary/30">
                    {loc.stats.avgCrowd > 2.3 ? 'Lotado' : loc.stats.avgCrowd > 1.6 ? 'Movimentado' : 'Tranquilo'}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden flex gap-0.5 p-[1px]">
                  <div className={`h-full rounded-l-full transition-all duration-[1s] ease-out ${loc.stats.avgCrowd > 0.5 ? 'bg-dirole-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'bg-white/5'}`} style={{ width: '33.33%' }}></div>
                  <div className={`h-full transition-all duration-[1s] ease-out delay-100 ${loc.stats.avgCrowd > 1.6 ? 'bg-dirole-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'bg-white/5'}`} style={{ width: '33.33%' }}></div>
                  <div className={`h-full rounded-r-full transition-all duration-[1s] ease-out delay-200 ${loc.stats.avgCrowd > 2.3 ? 'bg-dirole-primary shadow-[0_0_8px_rgba(139,92,246,0.4)]' : 'bg-white/5'}`} style={{ width: '33.33%' }}></div>
                </div>
              </div>

              {/* Action Area */}
              <div className="flex gap-3 mt-auto">
                <button
                  onClick={(e) => { e.stopPropagation(); onCheckIn(loc); }}
                  className="flex-1 bg-white text-[#0f0518] font-black py-4 rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2.5 shadow-xl hover:bg-dirole-primary hover:text-white group/btn"
                >
                  <i className="fas fa-bolt-lightning text-xs group-hover:animate-bounce"></i>
                  <span className="text-[10px] tracking-widest uppercase">CHECK-IN</span>
                </button>
                <div className="w-14 h-14 bg-white/5 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center border border-white/10 group-hover:border-dirole-secondary/30 transition-colors">
                  <span className="text-white font-black text-sm mb-[-2px]">{'$'.repeat(Math.max(1, Math.min(3, Math.round(loc.stats.avgPrice || 1))))}</span>
                  <span className="text-[7px] font-black text-slate-500 uppercase tracking-tighter">Preço</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {locations.length === 0 && (
        <div className="col-span-full flex flex-col items-center justify-center py-20 px-8 glass-panel rounded-[3rem] mx-4 animate-staggered-slide-up text-center border-white/5 bg-white/[0.02]">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-dirole-primary/20 to-dirole-secondary/20 rounded-3xl flex items-center justify-center text-5xl shadow-[0_0_50px_rgba(139,92,246,0.15)] animate-pulse-ring-slow">
              🔭
            </div>
            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#0f0518] border border-white/10 rounded-xl flex items-center justify-center text-lg shadow-2xl">
              ✨
            </div>
          </div>

          <h3 className="text-2xl font-black text-white mb-3 tracking-tighter">Silêncio no rádio...</h3>
          <p className="text-slate-400 text-center max-w-xs mb-8 font-bold leading-relaxed uppercase text-[9px] tracking-[0.3em] opacity-70">
            Nenhum rolê encontrado com esses filtros. Experimente ajustar seu raio de busca.
          </p>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-add-location'))}
            className="px-10 py-4 bg-white text-[#0f0518] font-black rounded-2xl shadow-2xl active:scale-95 transition-all text-[10px] tracking-widest uppercase hover:bg-dirole-primary hover:text-white"
          >
            Sugerir Novo Local
          </button>
        </div>
      )}
    </div>
  );
};
