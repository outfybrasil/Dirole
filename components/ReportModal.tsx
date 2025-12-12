
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
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-dirole-bg w-full max-w-sm rounded-2xl border border-red-500/30 p-6 animate-slide-up shadow-2xl relative">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/50">
                <i className="fas fa-exclamation-triangle text-red-500 text-sm"></i>
              </div>
              <h2 className="text-lg font-bold text-white">Denunciar</h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <i className="fas fa-times text-lg"></i>
          </button>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-lg mb-4 text-xs text-slate-300 border border-white/5">
            Denunciando: <span className="font-bold text-white">{targetName || targetType}</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Motivo</label>
                <div className="space-y-2">
                    {REASONS.map(r => (
                        <button
                            key={r}
                            type="button"
                            onClick={() => setReason(r)}
                            className={`w-full text-left p-3 rounded-xl text-xs font-medium transition-colors border ${
                                reason === r 
                                ? 'bg-red-500/20 border-red-500 text-white' 
                                : 'bg-slate-800 border-white/5 text-slate-400 hover:bg-slate-700'
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Detalhes (Opcional)</label>
                <textarea
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    placeholder="Descreva o problema..."
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-xs focus:border-red-500 focus:outline-none resize-none h-20"
                ></textarea>
            </div>

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-red-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-red-900/40 active:scale-95 transition-transform"
            >
                {isSubmitting ? 'Processando...' : 'Enviar Denúncia'}
            </button>
            
            <p className="text-[10px] text-slate-500 text-center">
                Isso abrirá seu e-mail para envio oficial.
            </p>

        </form>

      </div>
    </div>
  );
};
