import React from 'react';
import { Button } from './Button';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onCancel}></div>
      <div className="bg-[#0f0518] w-full max-w-sm rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col overflow-hidden relative isolate">

        {/* Grabber Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

        <div className="p-8 pt-12 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6 border border-red-500/20 text-red-500 text-2xl shadow-[0_0_20px_rgba(239,68,68,0.1)] animate-pulse">
            <AlertTriangle size={32} />
          </div>

          <h3 className="text-2xl font-black text-white uppercase italic tracking-tight mb-3 px-4">{title}</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-8 leading-relaxed px-6">
            {message}
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button
              onClick={onConfirm}
              className="w-full bg-red-600 text-white font-black py-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(220,38,38,0.2)] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] hover:bg-red-500"
            >
              Sim, Confirmar
            </button>
            <button
              onClick={onCancel}
              className="w-full bg-white/5 text-slate-400 font-black py-5 rounded-[1.5rem] active:scale-95 transition-all text-[10px] uppercase tracking-[0.3em] hover:text-white"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};