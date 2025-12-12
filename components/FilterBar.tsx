

import React, { useState } from 'react';
import { Filters } from '../types';
import { MOOD_PRESETS, Mood } from '../constants';

interface FilterBarProps {
  filters: Filters;
  onChange: (f: Filters) => void;
  onSearch: (query: string) => void;
  onClose?: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({ filters, onChange, onSearch, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Determine active mood based on current filters prop
  const activeMoodId = MOOD_PRESETS.find(m => {
      const p = m.filters;
      // Simple equality check for basic filters
      const typeMatch = JSON.stringify(p.types.sort()) === JSON.stringify(filters.types.sort());
      return typeMatch && p.minVibe === filters.minVibe && p.lowCost === filters.lowCost;
  })?.id || null;

  const handleMoodClick = (mood: Mood) => {
    if (activeMoodId === mood.id) {
      // Toggle off (keep distance setting & open setting)
      onChange({ 
          minVibe: false, 
          lowCost: false, 
          types: [], 
          maxDistance: filters.maxDistance,
          onlyOpen: filters.onlyOpen 
      });
    } else {
      // Activate mood (preserve user distance & open setting)
      onChange({ 
          ...mood.filters, 
          maxDistance: filters.maxDistance,
          onlyOpen: filters.onlyOpen 
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    onSearch(''); // Reset search results
    onChange({ minVibe: false, lowCost: false, types: [], maxDistance: 20, onlyOpen: false });
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
      e.preventDefault();
      onSearch(searchQuery);
  };

  const hasActiveFilters = activeMoodId !== null || filters.onlyOpen;

  return (
    <div className="bg-dirole-bg/95 backdrop-blur z-10 border-b border-slate-800 shadow-xl rounded-b-2xl relative">
      
      {/* HEADER WITH CLOSE BUTTON */}
      <div className="flex justify-between items-center px-4 pt-3 pb-1">
          <form onSubmit={handleSubmitSearch} className="relative flex-1 mr-2">
              <i className="fas fa-search absolute left-3 top-3 text-slate-500 text-xs"></i>
              <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar Janela, Porks, Shed..."
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-xl py-2.5 pl-9 pr-8 text-sm text-white focus:outline-none focus:border-dirole-primary focus:bg-slate-800 transition-all shadow-inner placeholder-slate-500"
              />
              {searchQuery && (
                  <button 
                    type="button" 
                    onClick={() => { setSearchQuery(''); onSearch(''); }}
                    className="absolute right-2 top-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
                  >
                      <i className="fas fa-times text-[10px]"></i>
                  </button>
              )}
          </form>
          
          {onClose && (
            <button 
                onClick={onClose}
                className="w-9 h-9 flex items-center justify-center text-slate-400 bg-slate-800 rounded-full hover:bg-slate-700 hover:text-white transition-colors"
                title="Fechar filtros"
            >
                <i className="fas fa-chevron-up text-sm"></i>
            </button>
          )}
      </div>

      {/* Mood Chips */}
      <div className="py-2 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 whitespace-nowrap items-center">
          
          {hasActiveFilters && (
              <button
                  onClick={clearFilters}
                  className="w-8 h-8 rounded-full bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center animate-fade-in flex-shrink-0"
              >
                  <i className="fas fa-times text-xs"></i>
              </button>
          )}
          
          {/* OPEN NOW BUTTON */}
          <button
            onClick={() => onChange({ ...filters, onlyOpen: !filters.onlyOpen })}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
                filters.onlyOpen
                ? 'bg-green-600 border-green-500 text-white shadow-lg'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
             <i className="fas fa-clock text-[9px]"></i>
             <span>Aberto Agora</span>
          </button>
          
          <div className="w-[1px] h-6 bg-slate-700 mx-1"></div>

          {MOOD_PRESETS.map(mood => {
            const isActive = activeMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border flex items-center gap-1.5 shadow-sm ${
                  isActive
                    ? `bg-gradient-to-r ${mood.color} text-white border-transparent shadow-lg scale-105`
                    : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="px-5 pb-3 pt-1 border-t border-white/5">
         <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
               Raio de Distância
            </span>
            <span className="text-[10px] font-bold text-dirole-primary bg-dirole-primary/10 px-2 py-0.5 rounded-md">
               {filters.maxDistance} km
            </span>
         </div>
         <div className="relative flex items-center">
            <input 
               type="range" 
               min="1" 
               max="30" 
               step="1"
               value={filters.maxDistance}
               onChange={(e) => onChange({ ...filters, maxDistance: Number(e.target.value) })}
               className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-dirole-primary z-10"
            />
         </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};