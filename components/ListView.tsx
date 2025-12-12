
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
    <div className="pb-24 px-4 pt-4 space-y-4">
      {locations.map((loc, index) => {
        const isFav = favorites.includes(loc.id);
        
        return (
          <div 
            key={loc.id} 
            onClick={() => onOpenDetails(loc)}
            className="glass-card rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] animate-fade-in relative group cursor-pointer border border-white/5 hover:border-dirole-primary/30"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            {/* Favorite Button with Pop Animation */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(loc.id);
              }}
              className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center z-10 transition-all duration-300 active:scale-90 ${
                isFav 
                ? 'bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                : 'bg-black/20 hover:bg-black/40'
              }`}
            >
              <i className={`fas fa-heart transition-all duration-300 ${
                isFav 
                ? 'text-red-500 pop-effect drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]' 
                : 'text-slate-500 hover:text-white'
              }`}></i>
            </button>

            <div className="flex gap-4">
              <div className="relative">
                <img 
                  src={loc.imageUrl} 
                  alt={loc.name} 
                  className="w-24 h-24 rounded-xl object-cover bg-slate-800 shadow-md"
                />
                {loc.stats.avgVibe > 2.3 && (
                  <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg">
                    🔥 HOT
                  </div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex justify-between items-start mb-1 pr-6">
                  <h3 className="font-bold text-lg leading-tight text-white truncate">{loc.name}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                   <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${loc.verified ? 'text-dirole-secondary bg-dirole-secondary/10 border-dirole-secondary/20' : 'text-slate-400 bg-slate-700/50 border-slate-600 border-dashed'}`}>
                      {loc.verified ? loc.type : 'Não Verificado'}
                   </span>
                   <span className="text-xs text-slate-400">
                      • {loc.distance ? `${(loc.distance / 1000).toFixed(1)} km` : '...'}
                   </span>
                </div>
                
                <Thermometer stats={loc.stats} compact />
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-white/10 flex gap-3">
              <div className="flex-1 flex items-center justify-center text-[10px] text-slate-400 bg-white/5 rounded-xl border border-white/5">
                <i className="fas fa-comment mr-1.5 text-dirole-primary"></i>
                {loc.stats.reviewCount} avaliações
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckIn(loc);
                }}
                className="flex-[2] bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white text-xs font-bold py-2.5 rounded-xl shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
              >
                Fazer Check-in (+10)
              </button>
            </div>
          </div>
        );
      })}
      
      {locations.length === 0 && (
        <div className="text-center text-slate-500 mt-20 p-8 glass-panel rounded-3xl mx-4">
          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
            😶‍🌫️
          </div>
          <p className="text-lg font-medium text-white mb-1">Nenhum rolê com essa vibe</p>
          <p className="text-sm">Tente escolher outro Mood ou limpar os filtros.</p>
        </div>
      )}

      {/* Styles for the Pop Animation */}
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        .pop-effect {
          animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};
