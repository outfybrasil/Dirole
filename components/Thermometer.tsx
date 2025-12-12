
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
  };
  compact?: boolean;
}

export const Thermometer: React.FC<ThermometerProps> = ({ stats, compact = false }) => {
  const { avgCrowd, avgVibe } = stats;

  // Modo Compacto (Usado na Lista)
  if (compact) {
    return (
      <div className="flex items-center gap-4 text-sm bg-black/20 px-3 py-1.5 rounded-lg border border-white/5 w-fit">
        <div className="flex items-center gap-1.5" title="Lotação">
           <span className="text-xs text-slate-400 uppercase font-bold">Lotação:</span>
           <span>{getCrowdIcon(avgCrowd)}</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10"></div>
        <div className="flex items-center gap-1.5" title="Vibe">
           <span className="text-xs text-slate-400 uppercase font-bold">Vibe:</span>
           <span>{getVibeIcon(avgVibe)}</span>
        </div>
      </div>
    );
  }

  // Modo Completo (Usado nos Detalhes)
  return (
    <div className="bg-dirole-card/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm">
      <div className="grid grid-cols-2 gap-4 divide-x divide-white/5">
        
        {/* Lotação */}
        <div className="flex flex-col items-center justify-center p-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Lotação</span>
          <div className="relative">
             <span className="text-4xl filter drop-shadow-lg">{getCrowdIcon(avgCrowd)}</span>
             {avgCrowd > 2.3 && <span className="absolute -top-1 -right-1 flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span></span>}
          </div>
          <span className="text-xs font-bold text-slate-300 mt-2 bg-white/5 px-2 py-0.5 rounded-full">
            {avgCrowd <= 1.6 ? 'Tranquilo' : avgCrowd <= 2.3 ? 'Movimentado' : 'Lotado'}
          </span>
        </div>

        {/* Vibe */}
        <div className="flex flex-col items-center justify-center p-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Vibe Atual</span>
          <span className="text-4xl filter drop-shadow-lg">{getVibeIcon(avgVibe)}</span>
          <span className={`text-xs font-black mt-2 px-3 py-0.5 rounded-full ${
              avgVibe > 2.3 ? 'bg-dirole-primary text-white shadow-[0_0_10px_#8b5cf6]' : 'bg-white/5 text-slate-300'
          }`}>
            {getVibeLabel(avgVibe).toUpperCase()}
          </span>
        </div>

      </div>
      
      {(avgCrowd === 0 && avgVibe === 0) && (
        <div className="mt-3 text-center text-[10px] text-slate-500 italic bg-black/20 py-1 rounded">
          Sem dados recentes. Seja o primeiro a votar!
        </div>
      )}
    </div>
  );
};
