
import React, { useState } from 'react';
import { Location, User } from '../types';
import { requestBusinessClaim } from '../services/mockService';

interface ClaimBusinessModalProps {
  location: Location;
  currentUser: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimBusinessModal: React.FC<ClaimBusinessModalProps> = ({
  location,
  currentUser,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [description, setDescription] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    setIsSubmitting(true);
    try {
      await requestBusinessClaim(location.id, currentUser.id, {
        description,
        instagram,
        whatsapp,
        cnpj
      });
      onSuccess();
      onClose();
    } catch (err) {
      alert("Erro ao processar solicitação");
    } finally {
      setIsSubmitting(false);
    }
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
            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center border border-yellow-500/20 text-yellow-500 text-xl shadow-[0_0_20px_rgba(234,179,8,0.1)]">
              <i className="fas fa-crown"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic">Sou o Dono</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                  VERIFICAÇÃO DE PROPRIEDADE
                </p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 relative z-10 custom-scrollbar">

          <div className="p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 flex items-center gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
            <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/10 shrink-0">
              <img src={location.imageUrl} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">{location.name}</h3>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter truncate max-w-[200px]">{location.address}</p>
            </div>
          </div>

          <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3 animate-fade-in" style={{ animationDelay: '200ms' }}>
            <i className="fas fa-shield-alt text-yellow-500 mt-0.5"></i>
            <p className="text-[10px] text-yellow-100/60 font-medium uppercase tracking-wide leading-relaxed">
              Para garantir a segurança da plataforma, solicitamos dados para confirmar sua identidade como representante oficial deste local.
            </p>
          </div>

          <div className="space-y-6">
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">CNPJ do Estabelecimento</label>
              <input
                type="text"
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-yellow-500 focus:bg-white/10 transition-all font-medium shadow-inner"
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Telefone / WhatsApp Comercial</label>
              <input
                type="tel"
                placeholder="(41) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-yellow-500 focus:bg-white/10 transition-all font-medium shadow-inner"
              />
            </div>

            <div className="pt-4 space-y-6 border-t border-white/5 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em] ml-1">Informações Oficiais</h3>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Instagram (@apelido)</label>
                <div className="relative group">
                  <span className="absolute left-5 top-5 text-slate-500 group-focus-within:text-dirole-primary transition-colors font-black text-sm">@</span>
                  <input
                    type="text"
                    placeholder="SEUBAR"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-10 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium shadow-inner"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4 ml-1">Bio do Local (Bio)</label>
                <textarea
                  placeholder="FALE SOBRE A VIBE, MÚSICA, PROMOÇÕES..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium shadow-inner resize-none"
                ></textarea>
              </div>
            </div>
          </div>

          <div className="pt-4 animate-fade-in" style={{ animationDelay: '600ms' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-yellow-500 text-black font-black py-5 rounded-[1.5rem] shadow-[0_10px_30px_rgba(234,179,8,0.2)] active:scale-95 transition-all text-xs uppercase tracking-[0.2em] hover:bg-yellow-400"
            >
              {isSubmitting ? 'VERIFICANDO...' : 'SOLICITAR VERIFICAÇÃO OFICIAL'}
            </button>
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
            background: rgba(139, 92, 246, 0.3);
            border-radius: 10px;
          }
        `}</style>
      </div>
    </div>
  );
};
