
import React, { useState } from 'react';
import { Report, User } from '../types';
import { submitReport, triggerHaptic } from '../services/mockService';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'location' | 'review' | 'photo' | 'user';
  targetName?: string;
  currentUser: User | null;
}

const REASONS = [
  "Notícia Falsa / Informação Incorreta",
  "Conteúdo Impróprio / Ofensivo",
  "Spam / Propaganda",
  "Foto não corresponde ao local",
  "Outro"
];

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetId,
  targetType,
  targetName,
  currentUser
}) => {
  const [reason, setReason] = useState(REASONS[0]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const report: Report = {
      targetId,
      targetType,
      reason,
      details,
      reporterId: currentUser?.id
    };

    await submitReport(report);

    // Abre o cliente de email
    const subject = `Denúncia Dirole: ${targetType} - ${reason}`;
    const body = `Olá, gostaria de denunciar o seguinte item no app Dirole:
    
Tipo: ${targetType}
ID do Alvo: ${targetId}
Nome (se houver): ${targetName || 'N/A'}
Motivo: ${reason}
Detalhes Adicionais: ${details}

Enviado por: ${currentUser?.name || 'Anônimo'} (${currentUser?.id || 'N/A'})`;

    const mailtoLink = `mailto:outfybrasil@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    window.location.href = mailtoLink;

    triggerHaptic([50, 50]);
    setIsSubmitting(false);
    onClose();
    alert("Denúncia registrada! Seu aplicativo de e-mail foi aberto para confirmar o envio.");
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
      <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col max-h-[90vh] sm:max-h-[80vh] overflow-hidden relative isolate">

        {/* Grabber Handle */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

        {/* HEADER */}
        <div className="p-8 pt-10 pb-4 relative z-10 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 text-red-500 text-xl shadow-[0_0_20px_rgba(239,68,68,0.1)]">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic">Denunciar</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  ALERTA DE IRREGULARIDADE
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 relative z-10 custom-scrollbar">

          <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Denunciando:</p>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">{targetName || targetType}</h3>
          </div>

          <div className="space-y-6">
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Selecione o Motivo</label>
              <div className="grid grid-cols-1 gap-2">
                {REASONS.map((r, idx) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => { triggerHaptic(); setReason(r); }}
                    className={`w-full text-left p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border animate-fade-in-up ${reason === r
                        ? 'bg-red-500/10 border-red-500/50 text-white ring-1 ring-red-500/30'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10 hover:border-white/10'
                      }`}
                    style={{ animationDelay: `${200 + (idx * 50)}ms` }}
                  >
                    {reason === r && <i className="fas fa-check-circle mr-3 text-red-500"></i>}
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '500ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Detalhes (Opcional)</label>
              <div className="bg-white/5 rounded-2xl border border-white/10 focus-within:border-red-500/50 focus-within:bg-white/10 transition-all shadow-inner overflow-hidden">
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="DESCREVA O PROBLEMA ENCONTRADO..."
                  className="w-full bg-transparent border-none p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:ring-0 resize-none h-32 font-medium"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 space-y-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-red-600 text-white font-black py-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(220,38,38,0.2)] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] hover:bg-red-500"
            >
              {isSubmitting ? 'PROCESSANDO...' : 'ENVIAR PARA MODERAÇÃO'}
            </button>

            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest text-center leading-relaxed px-10">
              Uma formalização será aberta no seu e-mail para confirmação oficial da denúncia.
            </p>
          </div>

        </form>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar {
            width: 4px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(255, 255, 255, 0.05);
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(239, 68, 68, 0.3);
            border-radius: 10px;
          }
        `}</style>
      </div>
    </div>
  );
};
