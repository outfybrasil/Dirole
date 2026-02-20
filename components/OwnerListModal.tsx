import React, { useState, useEffect } from 'react';
import { User, Location } from '../types';
import { getLocationsByUser, triggerHaptic } from '../services/mockService';
import { DEFAULT_LOCATION_IMAGES } from '../constants';

interface OwnerListModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    onOpenLocation: (loc: Location) => void;
}

const OwnerListModal: React.FC<OwnerListModalProps> = ({
    isOpen,
    onClose,
    currentUser,
    onOpenLocation
}) => {
    const [locations, setLocations] = useState<Location[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && currentUser) {
            setIsLoading(true);
            getLocationsByUser(currentUser.id)
                .then(docs => {
                    const owned = docs.filter(l => l.ownerId === currentUser.id);
                    setLocations(owned);
                })
                .catch(err => console.error("Error fetching owner locations:", err))
                .finally(() => setIsLoading(false));
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col h-[80vh] sm:h-[70vh] relative isolate">
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                <div className="p-8 pb-4 flex justify-between items-center border-b border-white/5 relative z-10 shrink-0 mt-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-yellow-500/20 text-yellow-500 flex items-center justify-center text-lg shadow-inner border border-yellow-500/30">
                            <i className="fas fa-crown"></i>
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-wider">Meus Negócios</h2>
                            <p className="text-[10px] text-yellow-500 font-black uppercase tracking-widest mt-0.5">Painel do Proprietário</p>
                        </div>
                    </div>
                    <button
                        onClick={() => { triggerHaptic(); onClose(); }}
                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 active:scale-90 flex items-center justify-center transition-all text-slate-400 group"
                    >
                        <i className="fas fa-times group-hover:text-white transition-colors"></i>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-4">
                            <i className="fas fa-circle-notch animate-spin text-yellow-500 text-3xl"></i>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Buscando locais...</p>
                        </div>
                    ) : locations.length > 0 ? (
                        <div className="space-y-4">
                            {locations.map(loc => (
                                <button
                                    key={loc.id}
                                    onClick={() => { triggerHaptic(); onOpenLocation(loc); }}
                                    className="w-full text-left group bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl p-4 flex gap-4 transition-all active:scale-95 shadow-lg"
                                >
                                    <div className="w-16 h-16 rounded-xl bg-slate-800 shrink-0 overflow-hidden border border-white/5 relative">
                                        <img
                                            src={loc.imageUrl || DEFAULT_LOCATION_IMAGES[loc.type]}
                                            className="w-full h-full object-cover"
                                            alt={loc.name}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    </div>
                                    <div className="flex flex-col justify-center flex-1 min-w-0">
                                        <h3 className="text-white font-black text-lg uppercase tracking-tight truncate group-hover:text-yellow-500 transition-colors">{loc.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 truncate">{loc.address.split(',')[0]}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center text-yellow-500/50 group-hover:text-yellow-500 transition-colors">
                                        <i className="fas fa-chevron-right"></i>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
                            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center text-slate-600 mb-2 border border-white/5">
                                <i className="fas fa-store-slash text-3xl"></i>
                            </div>
                            <h3 className="text-white font-black text-lg uppercase tracking-wider">Nenhum local</h3>
                            <p className="text-xs text-slate-400 font-medium">Você ainda não tem nenhum local verificado no Dirole.</p>
                            <p className="text-[10px] text-slate-500 mt-2 px-4 uppercase tracking-widest">Encontre seu estabelecimento no mapa e toque em "Reivindicar Local" nos detalhes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OwnerListModal;
