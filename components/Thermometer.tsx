
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
      <div className="flex items-center gap-4 text-sm bg-white/[0.03] px-4 py-2 rounded-[1rem] border border-white/5 w-fit shadow-inner">
        <div className="flex items-center gap-2" title="Lotação">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">LOT:</span>
          <span className="text-base leading-none">{getCrowdIcon(avgCrowd)}</span>
        </div>
        <div className="w-[1px] h-3 bg-white/10"></div>
        <div className="flex items-center gap-2" title="Vibe">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-tighter">VIBE:</span>
          <span className="text-base leading-none">{getVibeIcon(avgVibe)}</span>
        </div>
      </div>
    );
  }

  // Modo Completo (Usado nos Detalhes)
  return (
    <div className="bg-white/[0.02] p-6 rounded-[2rem] border border-white/5 backdrop-blur-md shadow-2xl relative overflow-hidden">

      {/* Glow Effect */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-dirole-primary/10 rounded-full blur-[40px] pointer-events-none"></div>

      <div className="grid grid-cols-2 gap-8 divide-x divide-white/5 relative z-10">

        {/* Lotação */}
        <div className="flex flex-col items-center justify-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Lotação</span>
          <div className="relative group">
            <span className="text-5xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-500 block">{getCrowdIcon(avgCrowd)}</span>
            {avgCrowd > 2.3 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 border-2 border-[#0f0518]"></span>
              </span>
            )}
          </div>
          <div className="mt-4 flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/5">
            <div className={`w-1.5 h-1.5 rounded-full ${avgCrowd <= 1.6 ? 'bg-green-500' : avgCrowd <= 2.3 ? 'bg-yellow-500' : 'bg-red-500'} shadow-[0_0_5px_currentColor]`}></div>
            <span className="text-[10px] font-black text-white uppercase tracking-widest leading-none">
              {avgCrowd <= 1.6 ? 'Tranquilo' : avgCrowd <= 2.3 ? 'Movimentado' : 'Lotado'}
            </span>
          </div>
        </div>

        {/* Vibe */}
        <div className="flex flex-col items-center justify-center pl-8">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Vibe Atual</span>
          <div className="group">
            <span className="text-5xl drop-shadow-[0_10px_10px_rgba(0,0,0,0.5)] transition-transform group-hover:scale-110 duration-500 block">{getVibeIcon(avgVibe)}</span>
          </div>
          <div className={`mt-4 px-4 py-1 rounded-full transition-all border ${avgVibe > 2.3
              ? 'bg-dirole-primary text-white border-dirole-primary/50 shadow-[0_0_20px_rgba(139,92,246,0.4)]'
              : 'bg-white/5 text-slate-400 border-white/5'
            }`}>
            <span className="text-[10px] font-black uppercase tracking-widest leading-none">
              {getVibeLabel(avgVibe).toUpperCase()}
            </span>
          </div>
        </div>

      </div>

      {(avgCrowd === 0 && avgVibe === 0) && (
        <div className="mt-6 text-center text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] bg-white/[0.02] py-2 rounded-xl border border-white/5 animate-pulse">
          SEM DADOS RECENTES • SEJA O PRIMEIRO A VOTAR
        </div>
      )}
    </div>
  );
};
