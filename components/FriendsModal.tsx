
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
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className={`bg-[#0f0518] w-full max-w-lg ${showQrCode ? 'h-[96vh] sm:h-[750px]' : 'h-[85vh] sm:h-[650px]'} rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col overflow-hidden relative isolate transition-all duration-300`}>

                {/* Grabber Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                {/* HEADER */}
                <div className="p-6 pt-8 pb-4 relative z-10 grid grid-cols-[40px_1fr_40px] items-center bg-white/[0.02]">
                    <div className="flex justify-start">
                        {showQrCode ? (
                            <button
                                onClick={toggleQr}
                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-all active:scale-90 shadow-lg"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        ) : (
                            <button
                                onClick={toggleQr}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
                                title="Meu QR Code"
                            >
                                <i className="fas fa-qrcode"></i>
                            </button>
                        )}
                    </div>

                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight uppercase italic text-center drop-shadow-md">
                        {showQrCode ? 'Dirole ID' : 'Galera'}
                    </h2>

                    <div className="flex justify-end">
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* TABS (Only if NOT showing QR) */}
                {!showQrCode && (
                    <div className="flex px-6 pb-2 gap-3 shrink-0 bg-white/[0.02] border-b border-white/5 justify-center">
                        <button
                            onClick={() => { triggerHaptic(); setActiveTab('my_friends'); }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm max-w-[100px] ${activeTab === 'my_friends' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)]' : 'text-slate-500 hover:text-white bg-white/5'}`}
                        >
                            Amigos
                        </button>
                        <button
                            onClick={() => { triggerHaptic(); setActiveTab('requests'); }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm max-w-[100px] relative ${activeTab === 'requests' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)]' : 'text-slate-500 hover:text-white bg-white/5'}`}
                        >
                            Convites
                            {requests.length > 0 && <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-[#0f0518] animate-pulse"></span>}
                        </button>
                        <button
                            onClick={() => { triggerHaptic(); setActiveTab('search'); }}
                            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all shadow-sm max-w-[100px] ${activeTab === 'search' ? 'bg-dirole-primary text-white shadow-[0_5px_15px_rgba(139,92,246,0.3)]' : 'text-slate-500 hover:text-white bg-white/5'}`}
                        >
                            Buscar
                        </button>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar flex flex-col">

                    {showQrCode ? (
                        <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-4 animate-fade-in">

                            {!isScanning && !scanResult && (
                                <div className="w-full max-w-[300px] bg-[#120822] rounded-[2.5rem] p-8 shadow-2xl relative flex flex-col items-center border border-white/5 overflow-hidden">

                                    {/* Gradient Animating BG */}
                                    <div className="absolute inset-0 bg-gradient-to-br from-dirole-primary/5 via-transparent to-dirole-secondary/5 pointer-events-none"></div>

                                    {/* Avatar */}
                                    <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_20px_rgba(139,92,246,0.3)] relative z-10 mb-6">
                                        <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-4xl border-2 border-slate-900 overflow-hidden">
                                            {currentUser?.avatar?.startsWith('http') ? (
                                                <img src={currentUser.avatar} className="w-full h-full object-cover" />
                                            ) : (
                                                currentUser?.avatar
                                            )}
                                        </div>
                                    </div>

                                    {/* Info */}
                                    <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{currentUser?.name?.toUpperCase()}</h3>
                                    <p className="text-dirole-primary text-xs font-black tracking-[0.2em] mb-8">@{currentUser?.nickname?.toUpperCase() || 'USUARIO'}</p>

                                    {/* QR Code */}
                                    <div className="bg-white p-4 rounded-3xl mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)] group transition-all hover:scale-[1.02]">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=dirole:${currentUser?.id}&color=000000`} alt="QR Code" className="w-48 h-48" />
                                    </div>

                                    {/* Level Pill */}
                                    <div className="bg-yellow-500/10 px-4 py-1.5 rounded-full border border-yellow-500/20 shadow-inner">
                                        <span className="text-[10px] font-black text-yellow-500 tracking-[0.3em] uppercase">
                                            ELITE NÍVEL {currentUser?.level}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isScanning && (
                                <div className="w-full max-w-[300px] aspect-square bg-slate-950 rounded-[2.5rem] border-2 border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl mt-4">
                                    <div className="absolute inset-0 bg-[#000] opacity-40"></div>

                                    <div className="w-56 h-56 border-2 border-dirole-primary/40 rounded-3xl relative z-10 animate-pulse">
                                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-dirole-primary rounded-tl-2xl -mt-[2px] -ml-[2px]"></div>
                                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-dirole-primary rounded-tr-2xl -mt-[2px] -mr-[2px]"></div>
                                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-dirole-primary rounded-bl-2xl -mb-[2px] -ml-[2px]"></div>
                                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-dirole-primary rounded-br-2xl -mb-[2px] -mr-[2px]"></div>
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-dirole-primary to-transparent shadow-[0_0_20px_#8b5cf6] animate-[scan_2.5s_ease-in-out_infinite]"></div>
                                    </div>

                                    <div className="absolute bottom-8 flex flex-col items-center gap-2">
                                        <div className="flex gap-1">
                                            <span className="w-1.5 h-1.5 bg-dirole-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-dirole-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                            <span className="w-1.5 h-1.5 bg-dirole-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                        </div>
                                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Scanning...</p>
                                    </div>
                                    <style>{`
                                @keyframes scan {
                                    0% { top: 0%; opacity: 0; }
                                    10% { opacity: 1; }
                                    90% { opacity: 1; }
                                    100% { top: 100%; opacity: 0; }
                                }
                            `}</style>
                                </div>
                            )}

                            {scanResult && (
                                <div className="w-full max-w-[280px] bg-slate-900 rounded-3xl p-6 border border-green-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] text-center animate-slide-up relative overflow-hidden mt-4">
                                    <div className="absolute top-0 left-0 w-full h-1 bg-green-500"></div>
                                    <div className="w-20 h-20 rounded-full bg-slate-800 mx-auto mb-3 flex items-center justify-center text-3xl border-2 border-green-500">
                                        {scanResult.avatar?.startsWith('http') ? <img src={scanResult.avatar} className="w-full h-full rounded-full object-cover" /> : scanResult.avatar}
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
                                <div className="mt-10 w-full max-w-[300px]">
                                    <button onClick={startScan} className="w-full bg-white text-black font-black py-5 rounded-[1.5rem] flex items-center justify-center gap-4 hover:bg-slate-200 transition-all shadow-xl active:scale-95 text-xs uppercase tracking-[0.2em]">
                                        <i className="fas fa-camera text-lg"></i>
                                        <span>Escanear Amigo</span>
                                    </button>
                                    <p className="text-[10px] font-bold text-slate-500 text-center mt-6 max-w-[220px] mx-auto leading-relaxed">
                                        Aponte a câmera para o QR Code de outro usuário para conectarem.
                                    </p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="animate-fade-in-up">
                            {activeTab === 'my_friends' && (
                                <div className="space-y-3">
                                    {friends.length === 0 ? (
                                        <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
                                            <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                                                <i className="fas fa-ghost text-3xl opacity-20"></i>
                                            </div>
                                            <p className="font-black text-white uppercase tracking-widest text-sm mb-2">Está meio vazio por aqui...</p>
                                            <p className="text-[10px] text-slate-500 mb-8 text-center max-w-[220px] font-medium uppercase tracking-wider leading-relaxed">Adicione a galera para ver quem está dominando as noites!</p>
                                            <button
                                                onClick={() => setActiveTab('search')}
                                                className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all active:scale-95 shadow-lg"
                                            >
                                                Explorar Dirole
                                            </button>
                                        </div>
                                    ) : (
                                        friends.map(u => renderUserCard(u, 'friend'))
                                    )}
                                </div>
                            )}

                            {activeTab === 'requests' && (
                                <div className="space-y-3">
                                    {requests.length === 0 ? (
                                        <div className="h-[400px] flex flex-col items-center justify-center text-slate-500">
                                            <i className="fas fa-inbox text-4xl mb-4 opacity-10"></i>
                                            <p className="text-[10px] font-black uppercase tracking-widest">Sem convites no momento</p>
                                        </div>
                                    ) : (
                                        requests.map(u => renderUserCard(u, 'request'))
                                    )}
                                </div>
                            )}

                            {activeTab === 'search' && (
                                <div className="space-y-6">
                                    <form onSubmit={handleSearch} className="relative group w-full">
                                        <div className="absolute left-5 top-1/2 -translate-y-1/2">
                                            <i className="fas fa-search text-slate-500 text-sm transition-colors group-focus-within:text-dirole-primary"></i>
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Nome ou @apelido..."
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl h-14 pl-12 pr-24 text-sm text-white focus:outline-none focus:border-dirole-primary focus:bg-white/10 transition-all font-medium placeholder-slate-600 shadow-inner"
                                            autoFocus
                                        />
                                        <button
                                            type="submit"
                                            disabled={!searchQuery.trim()}
                                            className="absolute right-2 top-2 bottom-2 bg-dirole-primary text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-wider disabled:opacity-50 transition-all active:scale-95 shadow-lg"
                                        >
                                            Buscar
                                        </button>
                                    </form>

                                    {!searchQuery && searchResults.length === 0 && (
                                        <div className="animate-fade-in space-y-4">
                                            <div className="flex items-center gap-2 px-1">
                                                <div className="w-1.5 h-1.5 rounded-full bg-dirole-primary"></div>
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Pessoas que você pode conhecer</p>
                                            </div>
                                            <div className="space-y-2">
                                                {suggestedUsers.map(u => renderUserCard(u, 'search'))}
                                            </div>
                                        </div>
                                    )}

                                    {isLoading ? (
                                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                                            <div className="w-10 h-10 border-4 border-dirole-primary/20 border-t-dirole-primary rounded-full animate-spin"></div>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Vasculhando a elite...</span>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {searchResults.map(u => renderUserCard(u, 'search'))}
                                        </div>
                                    )}

                                    {searchResults.length === 0 && searchQuery && !isLoading && (
                                        <div className="text-center py-20">
                                            <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 opacity-20">
                                                <i className="fas fa-question text-2xl"></i>
                                            </div>
                                            <p className="text-xs font-bold text-slate-500">Ninguém encontrado com esse nome.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                </div>

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
