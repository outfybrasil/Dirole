

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
    <div className="bg-[#0f0518]/90 backdrop-blur-xl z-20 border-b border-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.5)] rounded-b-[2rem] relative">

      {/* HEADER WITH CLOSE BUTTON */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <form onSubmit={handleSubmitSearch} className="relative flex-1 mr-2 group">
          <i className="fas fa-search absolute left-4 top-3.5 text-slate-500 text-xs transition-colors group-hover:text-white"></i>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-dirole-primary/50 focus:bg-white/10 transition-all placeholder-slate-600 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); onSearch(''); }}
              className="absolute right-3 top-2.5 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/20 transition-all"
            >
              <i className="fas fa-times text-[10px]"></i>
            </button>
          )}
        </form>

        {onClose && (
          <button
            onClick={onClose}
            className="w-11 h-11 flex items-center justify-center text-slate-400 bg-white/5 border border-white/5 rounded-full hover:bg-white/10 hover:text-white transition-all active:scale-95 shadow-lg"
            title="Fechar filtros"
          >
            <i className="fas fa-chevron-up text-sm"></i>
          </button>
        )}
      </div>

      {/* Mood Chips */}
      <div className="py-3 px-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 whitespace-nowrap items-center">

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-9 h-9 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center justify-center animate-fade-in flex-shrink-0 transition-colors"
            >
              <i className="fas fa-times text-xs"></i>
            </button>
          )}

          {/* OPEN NOW BUTTON */}
          <button
            onClick={() => onChange({ ...filters, onlyOpen: !filters.onlyOpen })}
            className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border flex items-center gap-2 shadow-sm ${filters.onlyOpen
              ? 'bg-green-500 text-white border-green-400 shadow-[0_0_15px_rgba(34,197,94,0.4)]'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            <i className="fas fa-clock text-[10px]"></i>
            <span>Aberto</span>
          </button>

          <div className="w-[1px] h-6 bg-white/10 mx-1"></div>

          {MOOD_PRESETS.map(mood => {
            const isActive = activeMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood)}
                className={`px-4 py-2 rounded-full text-[11px] font-bold transition-all border flex items-center gap-2 shadow-sm transform ${isActive
                  ? `bg-gradient-to-r ${mood.color} text-white border-transparent shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-105 ring-1 ring-white/20`
                  : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span>{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Distance Slider */}
      <div className="px-6 pb-4 pt-2 border-t border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Raio de Busca
          </span>
          <span className="text-[10px] font-bold text-dirole-primary bg-dirole-primary/10 border border-dirole-primary/20 px-2 py-0.5 rounded-md">
            {filters.maxDistance} km
          </span>
        </div>
        <div className="relative flex items-center h-4">
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={filters.maxDistance}
            onChange={(e) => onChange({ ...filters, maxDistance: Number(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded-full appearance-none cursor-pointer accent-dirole-primary z-10 hover:h-2 transition-all"
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