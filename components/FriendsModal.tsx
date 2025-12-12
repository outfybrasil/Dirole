
import React, { useState, useEffect } from 'react';
import { User, FriendUser, FriendshipStatus } from '../types';
import { getFriends, searchUsers, sendFriendRequest, respondToFriendRequest, triggerHaptic, getSuggestedUsers, blockUser } from '../services/mockService';

interface FriendsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  initialTab?: 'my_friends' | 'requests' | 'search';
  onLogout?: () => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, currentUser, initialTab = 'my_friends', onLogout }) => {
  const [activeTab, setActiveTab] = useState<'my_friends' | 'requests' | 'search'>(initialTab);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [requests, setRequests] = useState<FriendUser[]>([]);
  const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedUsers, setSuggestedUsers] = useState<FriendUser[]>([]);
  
  // QR Code State
  const [showQrCode, setShowQrCode] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<FriendUser | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const isGuest = currentUser?.id.startsWith('guest_');

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab); 
        setShowQrCode(false); // Reset QR state on open
        setIsScanning(false);
        setScanResult(null);
        setScanError(null);
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (isOpen && currentUser && !isGuest) {
        fetchData();
        setSuggestedUsers(getSuggestedUsers());
    }
  }, [isOpen, currentUser]);

  const fetchData = async () => {
      if (!currentUser || isGuest) return;
      setIsLoading(true);
      const allData = await getFriends(currentUser.id);
      
      setFriends(allData.filter(u => u.friendshipStatus === FriendshipStatus.ACCEPTED));
      setRequests(allData.filter(u => u.friendshipStatus === FriendshipStatus.PENDING_RECEIVED));
      setIsLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!currentUser || !searchQuery.trim() || isGuest) return;
      setIsLoading(true);
      const results = await searchUsers(searchQuery, currentUser.id);
      setSearchResults(results);
      setIsLoading(false);
  };

  const handleSendRequest = async (targetId: string) => {
      if (!currentUser || isGuest) return;
      triggerHaptic();
      await sendFriendRequest(currentUser.id, targetId);
      setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, friendshipStatus: FriendshipStatus.PENDING_SENT } : u));
      setSuggestedUsers(prev => prev.map(u => u.id === targetId ? { ...u, friendshipStatus: FriendshipStatus.PENDING_SENT } : u));
  };

  const handleResponse = async (friendshipId: string, accept: boolean) => {
      triggerHaptic();
      await respondToFriendRequest(friendshipId, accept);
      fetchData(); 
  };

  const handleBlock = async (targetId: string) => {
      if (!currentUser || isGuest) return;
      if (confirm("Deseja bloquear este usuário?")) {
          await blockUser(currentUser.id, targetId);
          fetchData();
          setSearchResults(prev => prev.filter(u => u.id !== targetId));
      }
  };

  // QR Code Logic
  const toggleQr = () => {
      triggerHaptic();
      setShowQrCode(!showQrCode);
      setIsScanning(false);
      setScanResult(null);
      setScanError(null);
  };

  const startScan = () => {
      triggerHaptic();
      setIsScanning(true);
      setScanResult(null);
      setScanError(null);
      
      // Simulate scanning process
      setTimeout(() => {
          triggerHaptic([50, 50]); // Failure/End haptic
          setIsScanning(false);
          setScanError("Nenhum código detectado.");
      }, 3000);
  };

  if (!isOpen) return null;

  if (isGuest) {
      return (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
            <div className="bg-dirole-bg w-full sm:w-[450px] h-[350px] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col animate-slide-up shadow-2xl overflow-hidden p-6 text-center">
                <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-times"></i>
                </button>
                
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 border-2 border-dashed border-slate-600">
                        <i className="fas fa-user-lock text-3xl text-slate-500"></i>
                    </div>
                    <h2 className="text-xl font-bold text-white mb-2">Recurso Bloqueado</h2>
                    <p className="text-sm text-slate-400 mb-6 max-w-[250px]">
                        Visitantes não podem adicionar amigos. Crie uma conta gratuita para conectar com a galera!
                    </p>
                    <button 
                        onClick={() => { 
                            if (onLogout) {
                                onClose(); 
                                onLogout(); 
                            }
                        }} 
                        className="w-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-all"
                    >
                        Criar Conta Agora
                    </button>
                </div>
            </div>
        </div>
      );
  }

  const renderUserCard = (user: FriendUser, type: 'friend' | 'request' | 'search') => (
      <div key={user.id} className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center justify-between mb-2 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/10 overflow-hidden flex items-center justify-center text-lg shrink-0">
                 {user.avatar?.startsWith('http') ? <img src={user.avatar} className="w-full h-full object-cover" /> : user.avatar}
             </div>
             <div>
                 <p className="font-bold text-white text-sm">{user.name}</p>
                 <p className="text-xs text-slate-500">Lvl {user.level} • {Math.floor(user.points / 10)} check-ins</p>
                 {type === 'friend' && user.lastCheckIn && (
                     <p className="text-[10px] text-dirole-primary flex items-center gap-1 mt-0.5 animate-pulse">
                         <i className="fas fa-map-marker-alt"></i> No {user.lastCheckIn}
                     </p>
                 )}
             </div>
          </div>
          
          <div>
              {type === 'request' && user.friendshipId && (
                  <div className="flex gap-2">
                      <button onClick={() => handleResponse(user.friendshipId!, true)} className="w-8 h-8 rounded-full bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500/40 transition-colors">
                          <i className="fas fa-check"></i>
                      </button>
                      <button onClick={() => handleResponse(user.friendshipId!, false)} className="w-8 h-8 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500/40 transition-colors">
                          <i className="fas fa-times"></i>
                      </button>
                  </div>
              )}
              
              {type === 'search' && (
                  <div className="flex gap-1">
                    {user.friendshipStatus === FriendshipStatus.NONE && (
                        <button onClick={() => handleSendRequest(user.id)} className="px-3 py-1.5 bg-dirole-primary/20 text-dirole-primary text-xs font-bold rounded-lg border border-dirole-primary/50 active:scale-95 transition-transform">
                            Adicionar
                        </button>
                    )}
                    {user.friendshipStatus === FriendshipStatus.PENDING_SENT && (
                        <span className="text-xs text-slate-500 italic bg-white/5 px-2 py-1 rounded">Enviado</span>
                    )}
                    {user.friendshipStatus === FriendshipStatus.ACCEPTED && (
                        <span className="text-xs text-green-500 font-bold flex items-center gap-1"><i className="fas fa-check"></i> Amigo</span>
                    )}
                    <button onClick={() => handleBlock(user.id)} className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-500" title="Bloquear">
                        <i className="fas fa-ban"></i>
                    </button>
                  </div>
              )}

              {type === 'friend' && (
                  <div className="flex items-center gap-2">
                      <button className="text-slate-500 text-xs hover:text-white p-2">
                          <i className="fas fa-chevron-right"></i>
                      </button>
                  </div>
              )}
          </div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto">
      <div className={`bg-dirole-bg w-full sm:w-[450px] ${showQrCode ? 'h-[90vh]' : 'h-[85vh]'} sm:h-[600px] rounded-t-3xl sm:rounded-3xl border border-white/10 flex flex-col animate-slide-up shadow-2xl overflow-hidden`}>
        
        {/* HEADER */}
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5 shrink-0">
            <div className="flex items-center gap-3">
                {showQrCode ? (
                    <button 
                        onClick={toggleQr}
                        className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-colors"
                    >
                        <i className="fas fa-arrow-left"></i>
                    </button>
                ) : (
                    <button 
                        onClick={toggleQr}
                        className="w-9 h-9 rounded-full flex items-center justify-center bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-colors"
                        title="Meu QR Code"
                    >
                        <i className="fas fa-qrcode"></i>
                    </button>
                )}
                <h2 className="text-xl font-bold text-white">{showQrCode ? 'Dirole ID' : 'Amigos'}</h2>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                <i className="fas fa-times"></i>
            </button>
        </div>

        {/* TABS (Only if NOT showing QR) */}
        {!showQrCode && (
            <div className="flex p-2 gap-2 border-b border-white/5 shrink-0">
                <button 
                    onClick={() => setActiveTab('my_friends')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'my_friends' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    Meus Amigos
                </button>
                <button 
                    onClick={() => setActiveTab('requests')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors relative ${activeTab === 'requests' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    Solicitações
                    {requests.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-black animate-pulse"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-colors ${activeTab === 'search' ? 'bg-dirole-primary text-white shadow-lg' : 'text-slate-400 hover:bg-white/5'}`}
                >
                    <i className="fas fa-search mr-1"></i> Buscar
                </button>
            </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 relative">
            
            {showQrCode ? (
                <div className="h-full flex flex-col items-center justify-start pt-6 animate-fade-in pb-10">
                    
                    {!isScanning && !scanResult && (
                        <div className="w-full max-w-[280px] bg-[#1e1b2e] rounded-3xl p-6 shadow-2xl relative flex flex-col items-center mt-4">
                            
                            {/* Gradient Top Border */}
                            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 rounded-t-3xl"></div>

                            {/* Avatar */}
                            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-3xl mb-4 relative z-10 border-4 border-[#1e1b2e] shadow-lg -mt-10">
                                {currentUser?.avatar?.startsWith('http') ? (
                                    <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover"/> 
                                ) : (
                                    currentUser?.avatar
                                )}
                            </div>
                            
                            {/* Info */}
                            <h3 className="text-xl font-bold text-white mb-0.5">{currentUser?.name}</h3>
                            <p className="text-slate-500 text-sm font-medium mb-4">@{currentUser?.nickname || 'usuario'}</p>
                            
                            {/* QR Code */}
                            <div className="bg-white p-3 rounded-2xl mb-4 shadow-inner">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=dirole:${currentUser?.id}&color=000000`} alt="QR Code" className="w-40 h-40" />
                            </div>
                            
                            {/* Level Pill */}
                            <div className="bg-white/10 px-3 py-1 rounded-full border border-white/5">
                                <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
                                    LEVEL {currentUser?.level}
                                </span>
                            </div>
                        </div>
                    )}

                    {isScanning && (
                        <div className="w-full max-w-[280px] aspect-square bg-black rounded-3xl border-2 border-white/20 relative overflow-hidden flex items-center justify-center shadow-2xl mt-4">
                            <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-black opacity-80"></div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                <i className="fas fa-camera text-6xl text-white"></i>
                            </div>
                            
                            <div className="w-48 h-48 border-2 border-dirole-primary rounded-xl relative z-10 animate-pulse">
                                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-dirole-secondary -mt-[2px] -ml-[2px]"></div>
                                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-dirole-secondary -mt-[2px] -mr-[2px]"></div>
                                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-dirole-secondary -mb-[2px] -ml-[2px]"></div>
                                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-dirole-secondary -mb-[2px] -mr-[2px]"></div>
                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_10px_#ef4444] animate-[scan_2s_ease-in-out_infinite]"></div>
                            </div>
                            
                            <p className="absolute bottom-6 text-white text-xs font-bold animate-pulse tracking-wider">PROCURANDO QR CODE...</p>
                            <style>{`
                                @keyframes scan {
                                    0%, 100% { top: 0%; opacity: 0; }
                                    10% { opacity: 1; }
                                    50% { top: 100%; }
                                    90% { opacity: 1; }
                                }
                            `}</style>
                        </div>
                    )}

                    {scanResult && (
                        <div className="w-full max-w-[280px] bg-slate-900 rounded-3xl p-6 border border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-center animate-slide-up relative overflow-hidden mt-4">
                            <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                            <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center text-3xl border-2 border-green-500">
                                {scanResult.avatar?.startsWith('http') ? <img src={scanResult.avatar} className="w-full h-full rounded-full object-cover"/> : scanResult.avatar}
                            </div>
                            <h3 className="text-xl font-bold text-white mb-1">{scanResult.name}</h3>
                            <div className="flex items-center justify-center gap-1 text-green-400 text-xs font-bold uppercase mb-6">
                                <i className="fas fa-check-circle"></i> ID Confirmado
                            </div>
                            
                            <button 
                                onClick={() => { handleSendRequest(scanResult.id); setScanResult(null); setShowQrCode(false); }}
                                className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform mb-3 hover:bg-green-500"
                            >
                                Adicionar Amigo
                            </button>
                            <button onClick={() => { setScanResult(null); setIsScanning(true); }} className="text-xs text-slate-400 hover:text-white">Escanear Outro</button>
                        </div>
                    )}

                    {scanError && (
                        <div className="w-full max-w-[280px] bg-red-900/20 border border-red-500/30 rounded-2xl p-4 text-center mt-4 mb-4">
                            <i className="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
                            <p className="text-white font-bold text-sm">{scanError}</p>
                            <button onClick={() => setScanError(null)} className="text-xs text-red-400 mt-2 underline">Tentar novamente</button>
                        </div>
                    )}

                    {!isScanning && !scanResult && (
                        <div className="mt-auto mb-6 w-full max-w-[280px]">
                            <button onClick={startScan} className="w-full bg-[#1e1b2e] border border-white/10 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-all shadow-lg active:scale-95">
                                <i className="fas fa-camera text-xl text-dirole-secondary"></i>
                                <span>Ler QR Code</span>
                            </button>
                            <p className="text-[10px] text-slate-500 text-center mt-4 max-w-[200px] mx-auto leading-relaxed">
                                Aponte a câmera para o Dirole ID de um amigo para adicionar instantaneamente.
                            </p>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    {activeTab === 'my_friends' && (
                        <>
                            {friends.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
                                    <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-white/5">
                                        <i className="fas fa-user-plus text-3xl opacity-30"></i>
                                    </div>
                                    <p className="mb-2 font-bold text-white">Nenhum amigo ainda</p>
                                    <p className="text-xs text-slate-400 mb-6 text-center max-w-[200px]">Adicione seus parceiros de rolê para competir no ranking!</p>
                                    <button 
                                        onClick={() => setActiveTab('search')} 
                                        className="bg-dirole-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-dirole-primary/20 active:scale-95 transition-all w-full"
                                    >
                                        <i className="fas fa-search mr-2"></i> Buscar Galera
                                    </button>
                                </div>
                            ) : (
                                friends.map(u => renderUserCard(u, 'friend'))
                            )}
                        </>
                    )}

                    {activeTab === 'requests' && (
                        <>
                            {requests.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-slate-500 pb-10">
                                    <i className="fas fa-inbox text-3xl mb-3 opacity-30"></i>
                                    <p>Nenhuma solicitação pendente.</p>
                                </div>
                            ) : (
                                requests.map(u => renderUserCard(u, 'request'))
                            )}
                        </>
                    )}

                    {activeTab === 'search' && (
                        <>
                            <form onSubmit={handleSearch} className="flex gap-2 mb-4 sticky top-0 bg-dirole-bg z-10 pb-2 pt-1">
                                <div className="relative flex-1">
                                    <i className="fas fa-search absolute left-4 top-3.5 text-slate-500 text-sm"></i>
                                    <input 
                                        type="text" 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Digite o nome ou apelido..."
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-dirole-primary"
                                        autoFocus
                                    />
                                </div>
                                <button 
                                    type="submit" 
                                    disabled={!searchQuery.trim()}
                                    className="bg-dirole-primary px-4 rounded-xl text-white font-bold text-sm disabled:opacity-50 disabled:bg-slate-700 transition-colors"
                                >
                                    Buscar
                                </button>
                            </form>

                            {!searchQuery && searchResults.length === 0 && (
                                <div className="mb-4 animate-fade-in">
                                    <p className="text-xs font-bold text-slate-500 uppercase mb-3 ml-1">Sugestões para você</p>
                                    {suggestedUsers.map(u => renderUserCard(u, 'search'))}
                                </div>
                            )}

                            {isLoading ? (
                                <div className="text-center py-10 text-slate-500">
                                    <i className="fas fa-circle-notch fa-spin"></i> Buscando...
                                </div>
                            ) : (
                                searchResults.map(u => renderUserCard(u, 'search'))
                            )}
                            
                            {searchResults.length === 0 && searchQuery && !isLoading && (
                                <div className="text-center text-slate-500 mt-10 text-sm">
                                    <i className="fas fa-ghost text-2xl mb-2 opacity-50 block"></i>
                                    Nenhum usuário encontrado com esse nome.
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

        </div>

      </div>
    </div>
  );
};
