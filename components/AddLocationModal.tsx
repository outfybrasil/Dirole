

import React, { useState } from 'react';
import { LocationType, User } from '../types';
import { createLocation } from '../services/mockService';
import { LOCATION_ICONS } from '../constants';
import { Camera, CameraResultType } from '@capacitor/camera';

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
      const locationData: any = {
        name,
        address,
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
        // Mock verification trigger could go here in real app
      }

      await createLocation(locationData);
      
      onSuccess();
      onClose();
      // Reset form
      setName('');
      setAddress('');
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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md transition-opacity">
      <div className="bg-dirole-bg/95 w-full sm:w-[450px] rounded-t-3xl sm:rounded-3xl border border-white/10 p-6 animate-slide-up shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Decorative Background Blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-dirole-primary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

        <div className="flex justify-between items-center mb-6 relative z-10 shrink-0">
          <div>
            <h2 className="text-2xl font-bold text-white">Novo Rolê</h2>
            <p className="text-xs text-slate-400">Adicione um local e comece a votar</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10 overflow-y-auto pr-1">
          
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Nome do Local</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl p-3 text-white placeholder-slate-600 focus:outline-none focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary transition-all"
              placeholder="Ex: Bar do Beto"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Endereço</label>
            <div className="relative">
                <i className="fas fa-map-marker-alt absolute left-3 top-3.5 text-slate-500"></i>
                <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-slate-600 focus:outline-none focus:border-dirole-primary focus:ring-1 focus:ring-dirole-primary transition-all"
                placeholder="Rua Exemplo, 123"
                />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tipo de Rolê</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(LocationType).map(t => (
                <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        type === t 
                        ? 'bg-dirole-primary/20 border-dirole-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' 
                        : 'bg-black/20 border-white/5 text-slate-400 hover:bg-white/5'
                    }`}
                >
                    <i className={`fas ${LOCATION_ICONS[t]}`}></i>
                    {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Foto da Fachada</label>
            <div className="flex gap-2">
                <button
                    type="button"
                    onClick={takePicture}
                    className="bg-slate-800 border border-white/10 rounded-xl p-3 text-white hover:bg-slate-700 active:scale-95 transition-all"
                >
                    <i className="fas fa-camera text-lg"></i>
                </button>
                <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="flex-1 bg-black/20 border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-dirole-primary transition-all"
                    placeholder="Cole a URL ou tire uma foto"
                />
            </div>
            {imageUrl && (
                <div className="mt-2 h-20 w-full rounded-lg overflow-hidden border border-white/10">
                    <img src={imageUrl} className="w-full h-full object-cover" alt="Preview" />
                </div>
            )}
          </div>

          {/* Owner Toggle */}
          <div className="border-t border-white/10 pt-4">
              <div className="flex items-center justify-between mb-4">
                  <div>
                      <span className="text-sm font-bold text-white block">Sou o Proprietário</span>
                      <span className="text-[10px] text-slate-400">Quero gerenciar a página oficial</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOwner(!isOwner)}
                    className={`w-12 h-7 rounded-full transition-colors relative ${isOwner ? 'bg-yellow-500' : 'bg-slate-700'}`}
                  >
                      <div className={`w-5 h-5 bg-white rounded-full shadow-md absolute top-1 transition-transform ${isOwner ? 'left-6' : 'left-1'}`}></div>
                  </button>
              </div>

              {isOwner && (
                  <div className="space-y-4 animate-fade-in bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                      
                      <div className="p-2 bg-yellow-900/20 border border-yellow-500/20 rounded-lg flex gap-2">
                         <i className="fas fa-info-circle text-yellow-500 mt-0.5"></i>
                         <p className="text-[10px] text-yellow-200">
                             Simulação: Ao criar como proprietário, o local receberá o selo de <strong>Verificado</strong> e <strong>Oficial</strong> automaticamente.
                         </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">CNPJ</label>
                        <input
                            type="text"
                            required={isOwner}
                            value={cnpj}
                            onChange={(e) => setCnpj(e.target.value)}
                            placeholder="00.000.000/0001-00"
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">WhatsApp</label>
                        <input
                            type="tel"
                            required={isOwner}
                            value={whatsapp}
                            onChange={(e) => setWhatsapp(e.target.value)}
                            placeholder="(41) 99999-9999"
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Instagram (Opcional)</label>
                        <input
                            type="text"
                            value={instagram}
                            onChange={(e) => setInstagram(e.target.value)}
                            placeholder="usuario_sem_arroba"
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Bio Oficial</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            placeholder="Descrição oficial do local..."
                            className="w-full bg-black/30 border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-yellow-500 focus:outline-none resize-none"
                        />
                      </div>

                  </div>
              )}
          </div>
          
          {!isOwner && (
            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                <i className="fas fa-shield-alt mt-1 text-yellow-500"></i>
                <div>
                    <p className="text-xs text-yellow-500/90 font-bold mb-1">Moderação da Comunidade</p>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        Este local aparecerá no mapa como <strong>"Não Verificado"</strong> até que outros usuários confirmem que ele existe.
                    </p>
                </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-2 text-white font-bold py-4 rounded-xl shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isOwner 
                ? 'bg-gradient-to-r from-yellow-600 to-yellow-500 shadow-yellow-500/30' 
                : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-purple-500/30 hover:shadow-purple-500/50'
            }`}
          >
            {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                    <i className="fas fa-circle-notch fa-spin"></i> Criando...
                </span>
            ) : (isOwner ? 'Criar Local Oficial' : 'Criar Local')}
          </button>
        </form>
      </div>
    </div>
  );
};
