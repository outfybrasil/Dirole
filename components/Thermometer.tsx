
import React from 'react';
import {
  getCrowdIcon,
  getVibeIcon,
  getVibeLabel
} from '../constants';

interface ThermometerProps {
  stats: {
    avgPrice: number;
    avgCrowd: number;
    avgGender: number;
    avgVibe: number;
    lastUpdated?: string | Date; // Adicionado lastUpdated
  };
  compact?: boolean;
}

export const Thermometer: React.FC<ThermometerProps> = ({ stats, compact = false }) => {
  const { avgCrowd, avgVibe, lastUpdated } = stats;

  const getStaleInfo = () => {
    if (!lastUpdated) return { isStale: true, label: 'Sem dados' };
    const diff = Date.now() - new Date(lastUpdated).getTime();
    const hours = diff / (1000 * 60 * 60);
    const mins = Math.floor(diff / (1000 * 60));

    if (hours >= 4) return { isStale: true, label: `Atualizado há ${Math.floor(hours)}h` };
    if (mins < 1) return { isStale: false, label: 'agora mesmo' };
    if (mins < 60) return { isStale: false, label: `há ${mins}min` };
    return { isStale: false, label: `há ${Math.floor(hours)}h` };
  };

  const staleInfo = getStaleInfo();

  // Modo CompactO (Usado na Lista) - REFACTORED FOR SLEEK PILL LOOK
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-sm ${staleInfo.isStale ? 'bg-white/[0.02] opacity-40' : 'bg-white/10'} px-3 py-1.5 rounded-full border border-white/5 transition-all duration-300 group-hover/therm:bg-white/20 shadow-lg`}>
        <div className="flex items-center gap-1.5" title="Lotação">
          <span className="text-sm">
            {staleInfo.isStale && avgCrowd === 0 ? '❔' : getCrowdIcon(avgCrowd)}
          </span>
        </div>
        <div className="w-[1px] h-3 bg-white/10 mx-0.5"></div>
        <div className="flex items-center gap-1.5" title="Vibe">
          <span className="text-sm">
            {staleInfo.isStale && avgVibe === 0 ? '😶' : getVibeIcon(avgVibe)}
          </span>
        </div>
      </div>
    );
  }

  // Modo Completo (Usado nos Detalhes)
  return (
    <div className={`bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden transition-all ${staleInfo.isStale ? 'grayscale-[0.5] opacity-80' : ''}`}>

      {/* Glow Effect */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 ${staleInfo.isStale ? 'bg-slate-500/10' : 'bg-dirole-primary/10'} rounded-full blur-[40px] pointer-events-none`}></div>

      {/* Stale Warning */}
      {staleInfo.isStale && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-amber-500/20 border border-amber-500/30 px-3 py-0.5 rounded-full flex items-center gap-1.5 z-20">
          <i className="fas fa-clock text-[8px] text-amber-500"></i>
          <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Informação Antiga</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:gap-8 divide-x divide-white/5 relative z-10 pt-2">

        {/* Lotação */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-5">Lotação</span>
          <div className="relative group">
            <span className="text-6xl drop-shadow-[0_15px_15px_rgba(0,0,0,0.6)] transition-transform group-hover:scale-110 duration-500 block">
              {staleInfo.isStale && avgCrowd === 0 ? '❔' : getCrowdIcon(avgCrowd)}
            </span>
            {!staleInfo.isStale && avgCrowd > 2.3 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-[#0f0518]"></span>
              </span>
            )}
          </div>
          <div className="mt-5 flex items-center gap-2.5 bg-white/5 px-4 py-1.5 rounded-xl border border-white/10">
            <div className={`w-2 h-2 rounded-full ${staleInfo.isStale ? 'bg-slate-500' : (avgCrowd <= 1.6 ? 'bg-green-500' : avgCrowd <= 2.3 ? 'bg-yellow-500' : 'bg-red-500')} shadow-[0_0_10px_currentColor]`}></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
              {staleInfo.isStale && avgCrowd === 0 ? 'Incerto' : (avgCrowd <= 1.6 ? 'Tranquilo' : avgCrowd <= 2.3 ? 'Movimentado' : 'Lotado')}
            </span>
          </div>
        </div>

        {/* Vibe */}
        <div className="flex flex-col items-center justify-center pl-4 sm:pl-8">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Vibe</span>
          <div className="group w-full flex justify-center overflow-visible">
            <span className="text-4xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-500 whitespace-nowrap">
              {staleInfo.isStale && avgVibe === 0 ? '😶' : getVibeIcon(avgVibe)}
            </span>
          </div>
          <div className={`mt-4 px-4 py-1 rounded-full transition-all border ${!staleInfo.isStale && avgVibe > 2.3
            ? 'bg-dirole-primary text-white border-dirole-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
            : 'bg-white/5 text-slate-400 border-white/5'
            }`}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {staleInfo.isStale && avgVibe === 0 ? 'Desconhecida' : getVibeLabel(avgVibe).toUpperCase()}
            </span>
          </div>
        </div>

      </div>

      <div className="mt-6 text-center">
        <div className="inline-block bg-white/[0.02] py-1 px-3 rounded-lg border border-white/5">
          <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
            Último update: {staleInfo.label}
          </span>
        </div>
      </div>
    </div>
  );
};
