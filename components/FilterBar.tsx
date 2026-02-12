

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
    const typeMatch = JSON.stringify(p.types.sort()) === JSON.stringify(filters.types.sort());
    return (
      typeMatch &&
      p.minVibe === filters.minVibe &&
      p.lowCost === filters.lowCost &&
      p.minCrowd === filters.minCrowd &&
      p.maxCrowd === filters.maxCrowd
    );
  })?.id || null;

  const handleMoodClick = (mood: Mood) => {
    if (activeMoodId === mood.id) {
      // Toggle off (keep distance setting & open setting)
      onChange({
        minVibe: false,
        lowCost: false,
        minCrowd: undefined,
        maxCrowd: undefined,
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
    onChange({
      minVibe: false,
      lowCost: false,
      minCrowd: undefined,
      maxCrowd: undefined,
      types: [],
      maxDistance: 20,
      onlyOpen: false
    });
  };

  const handleSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  const hasActiveFilters = activeMoodId !== null || filters.onlyOpen;

  return (
    <div className="glass-panel z-20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-b-[2.5rem] relative overflow-hidden border-t-0">
      {/* Decorative Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-24 bg-dirole-primary/10 blur-[80px] pointer-events-none"></div>

      {/* MOOD SELECTION HEADER */}
      <div className="px-6 pt-6 pb-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-dirole-primary"></span>
          Filtros de Vibe
        </h2>
      </div>

      {/* Mood Chips */}
      <div className="py-4 px-6 overflow-x-auto no-scrollbar">
        <div className="flex gap-3 whitespace-nowrap items-center">

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 flex items-center justify-center animate-fade-in flex-shrink-0 transition-all active:scale-90"
            >
              <i className="fas fa-trash-alt text-xs"></i>
            </button>
          )}

          {/* OPEN NOW BUTTON */}
          <button
            onClick={() => onChange({ ...filters, onlyOpen: !filters.onlyOpen })}
            className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 shadow-lg ${filters.onlyOpen
              ? 'bg-green-500 text-white border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)] scale-105'
              : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${filters.onlyOpen ? 'bg-white animate-pulse' : 'bg-green-500/50'}`}></div>
            <span>Aberto Agora</span>
          </button>

          <div className="w-[1px] h-8 bg-white/10 mx-1"></div>

          {MOOD_PRESETS.map(mood => {
            const isActive = activeMoodId === mood.id;
            return (
              <button
                key={mood.id}
                onClick={() => handleMoodClick(mood)}
                className={`px-5 py-3 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all border flex items-center gap-2 shadow-lg transform ${isActive
                  ? `bg-gradient-to-r ${mood.color} text-white border-transparent shadow-[0_0_20px_rgba(139,92,246,0.4)] scale-105 ring-1 ring-white/20`
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
      <div className="px-8 pb-8 pt-4 border-t border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-dirole-primary"></span>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Raio de Exploração
            </span>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-black text-white">{filters.maxDistance}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase">km</span>
          </div>
        </div>
        <div className="relative flex items-center h-6">
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={filters.maxDistance}
            onChange={(e) => onChange({ ...filters, maxDistance: Number(e.target.value) })}
            className="w-full premium-slider h-1.5 rounded-full appearance-none cursor-pointer z-10 transition-all"
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