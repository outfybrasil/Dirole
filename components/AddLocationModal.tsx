import React, { useState, useEffect } from 'react';
import { LocationType, User } from '../types';
import { createLocation, triggerHaptic } from '../services/mockService';
import { LOCATION_ICONS } from '../constants';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userLat: number;
  userLng: number;
  currentUser: User | null;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userLat,
  userLng,
  currentUser
}) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [number, setNumber] = useState('');
  const [type, setType] = useState<LocationType>(LocationType.BAR);
  const [imageUrl, setImageUrl] = useState('');

  // Owner Fields
  const [isOwner, setIsOwner] = useState(false);
  const [cnpj, setCnpj] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [description, setDescription] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const pickFromGallery = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Photos
      });

      if (image.webPath) {
        setImageUrl(image.webPath);
      }
    } catch (e) {
      console.warn("Gallery pick failed:", e);
    }
  };

  const takePicture = async () => {
    try {
      let permissions = await Camera.checkPermissions();

      if (permissions.camera === 'prompt') {
        permissions = await Camera.requestPermissions();
      }

      if (permissions.camera !== 'granted') {
        alert('A permissão da câmera é necessária para tirar fotos.');
        return;
      }

      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: true,
        resultType: CameraResultType.Uri
      });

      if (image.webPath) {
        setImageUrl(image.webPath);
      }
    } catch (e) {
      console.warn("Camera failed:", e);
      alert("Não foi possível acessar a câmera.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Combine address and number
      const fullAddress = number ? `${address}, ${number}` : address;

      const locationData: any = {
        name,
        address: fullAddress,
        type,
        latitude: userLat,
        longitude: userLng,
        imageUrl: imageUrl || `https://images.unsplash.com/photo-1572116469696-31de0f17cc34?q=80&w=400&auto=format&fit=crop`
      };

      if (isOwner && currentUser) {
        locationData.isOfficial = true;
        locationData.ownerId = currentUser.id;
        locationData.officialDescription = description;
        locationData.instagram = instagram;
        locationData.whatsapp = whatsapp;
      }

      await createLocation(locationData);

      onSuccess();
      onClose();
      // Reset form
      setName('');
      setAddress('');
      setNumber('');
      setType(LocationType.BAR);
      setImageUrl('');
      setIsOwner(false);
      setCnpj('');
      setWhatsapp('');
      setInstagram('');
      setDescription('');
    } catch (error) {
      console.error(error);
      alert("Erro ao criar local.");
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
          <div>
            <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic">Novo Rolê</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-dirole-primary animate-pulse"></div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                ADICIONAR LOCAL À COMUNIDADE
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-8 pb-10 space-y-8 relative z-10 custom-scrollbar">

          <div className="space-y-6">
            {/* Warning about Location */}
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-4 flex gap-3 animate-fade-in">
              <i className="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
              <div>
                <p className="text-[10px] uppercase font-black text-yellow-500 mb-1 tracking-widest">Atenção</p>
                <p className="text-xs text-yellow-200/80 leading-relaxed font-medium">
                  Para evitar erros no mapa, certifique-se de que você <strong>está no local exato</strong> ou com o <strong>marcador centralizado</strong> corretamente antes de confirmar.
                </p>
              </div>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Nome do Local</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium shadow-inner"
                placeholder="Ex: BAR DO BETO"
              />
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Localização (Rua)</label>
                  <div className="relative group">
                    <i className="fas fa-map-marker-alt absolute left-5 top-5 text-slate-500 group-focus-within:text-dirole-primary transition-colors"></i>
                    <input
                      type="text"
                      required
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 pl-14 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium shadow-inner"
                      placeholder="RUA EXEMPLO"
                    />
                  </div>
                </div>
                <div className="w-28">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Número</label>
                  <input
                    type="text"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm text-white placeholder-slate-700 focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium shadow-inner text-center"
                    placeholder="123"
                  />
                </div>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Tipo de Rolê</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(LocationType).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { triggerHaptic(); setType(t); }}
                    className={`p-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${type === t
                      ? 'bg-white text-black border-transparent shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-[1.02]'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:bg-white/10'
                      }`}
                  >
                    <i className={`fas ${LOCATION_ICONS[t]} ${type === t ? 'text-dirole-primary' : 'text-slate-600'}`}></i>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '400ms' }}>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Identidade Visual</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={takePicture}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all shadow-inner group"
                >
                  <i className="fas fa-camera text-2xl group-hover:scale-110 transition-transform text-dirole-primary"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Câmera</span>
                </button>
                <button
                  type="button"
                  onClick={pickFromGallery}
                  className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-slate-400 hover:text-white hover:bg-white/10 active:scale-[0.98] transition-all shadow-inner group"
                >
                  <i className="fas fa-images text-2xl group-hover:scale-110 transition-transform text-dirole-secondary"></i>
                  <span className="text-[10px] font-black uppercase tracking-widest">Galeria</span>
                </button>
              </div>
              {imageUrl && (
                <div className="mt-4 h-32 w-full rounded-2xl overflow-hidden border border-white/10 animate-scale-in">
                  <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
              )}
            </div>

            {/* Owner Toggle */}
            <div className="pt-4 animate-fade-in" style={{ animationDelay: '500ms' }}>
              <div className="flex items-center justify-between p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] mb-6 shadow-inner">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all ${isOwner ? 'bg-yellow-500/10 text-yellow-500' : 'bg-slate-500/10 text-slate-500'}`}>
                    <i className="fas fa-crown"></i>
                  </div>
                  <div>
                    <span className="text-sm font-black text-white block uppercase tracking-tight">Sou o Proprietário</span>
                    <p className="text-[10px] font-bold text-slate-500 mt-0.5 uppercase tracking-tighter">Gerenciar página oficial</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => { triggerHaptic(); setIsOwner(!isOwner); }}
                  className={`w-14 h-8 rounded-full transition-all relative ${isOwner ? 'bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.4)]' : 'bg-white/10'}`}
                >
                  <div className={`w-6 h-6 bg-white rounded-full shadow-lg absolute top-1 transition-all ${isOwner ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {isOwner && (
                <div className="space-y-6 animate-fade-in-up bg-yellow-500/[0.03] p-6 rounded-[2rem] border border-yellow-500/10 shadow-2xl mb-8">

                  <div className="p-4 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex gap-3">
                    <i className="fas fa-info-circle text-yellow-500 mt-1"></i>
                    <p className="text-[10px] text-yellow-200/70 font-bold uppercase tracking-wide leading-relaxed">
                      O local receberá o selo de <strong className="text-yellow-500">Verificado</strong> e <strong className="text-yellow-500">Oficial</strong> automaticamente após verificação.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-3 ml-1">CNPJ</label>
                    <input
                      type="text"
                      required={isOwner}
                      value={cnpj}
                      onChange={(e) => setCnpj(e.target.value)}
                      placeholder="00.000.000/0001-00"
                      className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 text-sm text-white placeholder-yellow-900 focus:border-yellow-500 focus:outline-none transition-all font-medium shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-3 ml-1">WhatsApp de Contato</label>
                    <input
                      type="tel"
                      required={isOwner}
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="(41) 99999-9999"
                      className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 text-sm text-white placeholder-yellow-900 focus:border-yellow-500 focus:outline-none transition-all font-medium shadow-inner"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-yellow-500/50 uppercase tracking-[0.2em] mb-3 ml-1">Bio Oficial</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      placeholder="FALE SOBRE SEU LOCAL, MÚSICA, CARDÁPIO..."
                      className="w-full bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-4 text-sm text-white placeholder-yellow-900 focus:border-yellow-500 focus:outline-none resize-none transition-all font-medium shadow-inner"
                    />
                  </div>

                </div>
              )}
            </div>

            {!isOwner && (
              <div className="flex items-start gap-4 p-5 bg-white/[0.02] border border-white/5 rounded-[1.5rem] animate-fade-in" style={{ animationDelay: '600ms' }}>
                <div className="w-10 h-10 rounded-xl bg-slate-500/10 flex items-center justify-center text-slate-500 shrink-0">
                  <i className="fas fa-shield-alt"></i>
                </div>
                <div>
                  <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Moderação Comunitária</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tight leading-relaxed">
                    O local passará por aprovação da elite antes de ser listado como verificado.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-4 animate-fade-in" style={{ animationDelay: '700ms' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full font-black py-5 rounded-[1.5rem] shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 text-xs uppercase tracking-[0.2em] ${isOwner
                  ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                  : 'bg-white text-black hover:bg-slate-200'
                  }`}
              >
                {isSubmitting ? (
                  <><div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"></div> CRIANDO...</>
                ) : (isOwner ? 'Publicar Página Oficial' : 'Confirmar Novo Local')}
              </button>
            </div>
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
