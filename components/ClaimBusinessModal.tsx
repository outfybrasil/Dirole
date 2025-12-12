
import React, { useState } from 'react';
import { Location, User } from '../types';
import { claimBusiness } from '../services/mockService';

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
        await claimBusiness(location.id, currentUser.id, {
            description,
            instagram,
            whatsapp
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-dirole-bg w-full max-w-md rounded-2xl border border-yellow-500/30 p-6 animate-slide-up shadow-2xl overflow-y-auto max-h-[90vh]">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center border border-yellow-500/50">
                <i className="fas fa-certificate text-yellow-500"></i>
             </div>
             <div>
                <h2 className="text-xl font-bold text-white leading-tight">Sou o Dono</h2>
                <p className="text-xs text-slate-400">Verificação de Propriedade</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="bg-slate-800/50 p-3 rounded-xl border border-white/5 mb-6 flex gap-3 items-center">
            <img src={location.imageUrl} className="w-12 h-12 rounded-lg object-cover" />
            <div>
                <p className="font-bold text-white text-sm">{location.name}</p>
                <p className="text-xs text-slate-400 truncate max-w-[200px]">{location.address}</p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="bg-yellow-900/10 border border-yellow-500/20 rounded-lg p-3">
             <p className="text-[10px] text-yellow-500 leading-relaxed text-justify">
                <i className="fas fa-lock mr-1"></i>
                Para garantir a segurança, solicitamos alguns dados para verificar se você realmente representa este estabelecimento.
             </p>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CNPJ (Apenas números)</label>
             <input 
                type="text" 
                placeholder="00.000.000/0001-00"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
             />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Telefone / WhatsApp</label>
             <input 
                type="tel" 
                placeholder="(41) 99999-9999"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                required
                className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-yellow-500 focus:outline-none"
             />
          </div>

          <div className="border-t border-white/10 pt-4 mt-4">
             <h3 className="text-sm font-bold text-white mb-3">Informações Oficiais</h3>
             
             <div className="mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Instagram (@usuario)</label>
                <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500">@</span>
                    <input 
                        type="text" 
                        placeholder="seubar"
                        value={instagram}
                        onChange={e => setInstagram(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 pl-8 text-white text-sm focus:border-dirole-primary focus:outline-none"
                    />
                </div>
             </div>

             <div className="mb-3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Descrição Oficial (Bio)</label>
                <textarea 
                    placeholder="Descreva a vibe do seu estabelecimento, horário de funcionamento, promoções..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-dirole-primary focus:outline-none resize-none"
                ></textarea>
             </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-yellow-600 to-yellow-500 text-black font-bold py-3.5 rounded-xl shadow-lg shadow-yellow-500/20 active:scale-95 transition-transform"
          >
            {isSubmitting ? 'Verificando...' : 'Solicitar Verificação Oficial'}
          </button>

        </form>
      </div>
    </div>
  );
};
