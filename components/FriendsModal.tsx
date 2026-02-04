
import React, { useState, useEffect } from 'react';
import { User, FriendUser, FriendshipStatus } from '../types';
import { getFriends, searchUsers, sendFriendRequest, respondToFriendRequest, triggerHaptic, getSuggestedUsers, blockUser } from '../services/mockService';
import UserAvatar from './UserAvatar';
import { CapacitorNfc } from '@capgo/capacitor-nfc';

// Type declaration for Capacitor
declare global {
    interface Window {
        Capacitor?: {
            isNativePlatform?: () => boolean;
        };
    }
}


interface FriendsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentUser: User | null;
    initialTab?: 'my_friends' | 'requests' | 'search';
    initialView?: 'default' | 'qr';
    onLogout?: () => void;
    onOpenScanner?: () => void;
    scannedUser?: User | null;
    onShowToast?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
}

export const FriendsModal: React.FC<FriendsModalProps> = ({ isOpen, onClose, currentUser, initialTab = 'my_friends', initialView = 'default', onLogout, onOpenScanner, scannedUser, onShowToast }) => {
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
    const [hasNfc, setHasNfc] = useState(false);
    const [isNfcWriting, setIsNfcWriting] = useState(false);

    useEffect(() => {
        const checkNfc = async () => {
            try {
                // Check if running in Capacitor native environment
                const isNative = window.Capacitor?.isNativePlatform?.();

                if (isNative) {
                    try {
                        const { status } = await CapacitorNfc.getStatus();

                        if (status === 'NFC_OK' || status === 'NFC_DISABLED') {
                            setHasNfc(true);
                        }
                    } catch (e: any) {
                        setHasNfc(false);
                    }
                } else {
                    if ('NDEFReader' in window) {
                        setHasNfc(true);
                    }
                }
            } catch (e) {
                console.error('[NFC] Unexpected error during NFC check:', e);
                setHasNfc(false);

            }
        };
        checkNfc();
    }, []);

    const isGuest = currentUser?.id.startsWith('guest_');

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);

            if (scannedUser) {
                setShowQrCode(true);
                setScanResult(scannedUser);
                setIsScanning(false);
            } else if (initialView === 'qr') {
                setShowQrCode(true);
                setScanResult(null);
                setIsScanning(false);
            } else {
                setShowQrCode(false); // Reset QR state on open
                setIsScanning(false);
                setScanResult(null);
            }
            setScanError(null);
        }
    }, [isOpen, initialTab, scannedUser, initialView]);

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

        // Optimistic UI updates
        setSearchResults(prev => prev.map(u => u.id === targetId ? { ...u, friendshipStatus: FriendshipStatus.PENDING_SENT } : u));
        setSuggestedUsers(prev => prev.map(u => u.id === targetId ? { ...u, friendshipStatus: FriendshipStatus.PENDING_SENT } : u));

        const result = await sendFriendRequest(currentUser.id, targetId);
        if (result.success) {
            if (onShowToast) onShowToast("Convite Enviado! 📨", "Aguarde a aprovação do seu amigo.", 'success');
        } else {
            // Rollback if needed, but for now just warn
            if (onShowToast) onShowToast("Erro ao enviar", result.error || "Tente novamente.", 'error');
        }
    };

    const handleResponse = async (friendshipId: string, accept: boolean) => {
        triggerHaptic();
        await respondToFriendRequest(friendshipId, accept);
        fetchData();
    };

    const handleBlock = async (targetId: string) => {
        if (!currentUser || isGuest) return;
        // eslint-disable-next-line
        if (confirm("Deseja bloquear este usuário?")) {
            await blockUser(currentUser.id, targetId);
            fetchData();
            setSearchResults(prev => prev.filter(u => u.id !== targetId));
        }
    };

    const toggleQr = () => {
        triggerHaptic();
        setShowQrCode(!showQrCode);
        setIsScanning(false);
        setScanResult(null);
        setScanError(null);
        setIsNfcWriting(false);
    };

    const shareViaNFC = async () => {
        if (!hasNfc || !currentUser) return;
        triggerHaptic();
        setIsNfcWriting(true);

        const profileUrl = `https://dirole.appwrite.network/u/${currentUser.id}`;

        try {
            const isNative = window.Capacitor?.isNativePlatform?.();

            if (isNative) {
                // --- NATIVE FLOW (Capacitor) ---
                // Helper to encode NDEF URL record
                const createUrlRecord = (url: string) => {
                    const urlBytes = new TextEncoder().encode(url.replace('https://', ''));
                    return {
                        tnf: 1, // Well Known
                        type: [85], // 'U'
                        id: [],
                        payload: [4, ...Array.from(urlBytes)] // 4 = https:// prefix
                    };
                };

                const record = createUrlRecord(profileUrl);

                // On iOS, we MUST call startScanning before write
                await CapacitorNfc.startScanning({
                    alertMessage: "Aproxime um dispositivo ou tag NFC para compartilhar seu perfil."
                });

                // Listen for tag discovery to write
                const listener = await CapacitorNfc.addListener('nfcEvent', async () => {
                    try {
                        await CapacitorNfc.write({ records: [record] });
                        triggerHaptic([50, 50, 50]);
                        if (onShowToast) onShowToast("Sucesso! 🎉", "Perfil compartilhado via NFC.", 'success');
                        else {
                            onShowToast("Sucesso", "Perfil compartilhado via NFC com sucesso!", 'success');
                        }
                        await CapacitorNfc.stopScanning();
                        setIsNfcWriting(false);
                        listener.remove();
                    } catch (e) {
                        console.error("Write failed:", e);
                    }
                });

                // Timeout after 30 seconds
                setTimeout(async () => {
                    if (isNfcWriting) {
                        try {
                            await CapacitorNfc.stopScanning();
                        } catch (e) { }
                        setIsNfcWriting(false);
                        listener.remove();
                    }
                }, 30000);
            } else if ('NDEFReader' in window) {
                // --- WEB FLOW (Chrome Android) ---
                try {
                    // @ts-ignore - NDEFReader is not in standard TS types yet
                    const ndef = new window.NDEFReader();
                    await ndef.write(profileUrl);

                    triggerHaptic([50, 50, 50]);
                    if (onShowToast) onShowToast("Sucesso! 🎉", "Link gravado na tag NFC.", 'success');
                    else {
                        onShowToast("Sucesso", "Link gravado na tag NFC!", 'success');
                    }
                    setIsNfcWriting(false);
                } catch (error: any) {
                    console.error("Web NFC failed:", error);
                    if (onShowToast) onShowToast("Erro NFC", "Não foi possível gravar na tag. Verifique se o NFC está ativo.", 'error');
                    setIsNfcWriting(false);
                }
            } else {
                setIsNfcWriting(false);
            }

        } catch (error) {
            console.error("NFC shared failed:", error);
            setIsNfcWriting(false);
        }
    };

    const startScan = () => {
        triggerHaptic();
        if (onOpenScanner) {
            onOpenScanner();
        } else {
            alert("Scanner não configurado corretamente.");
        }
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

    const renderUserCard = (user: FriendUser, type: 'friend' | 'request' | 'search') => {
        const isSelf = currentUser && user.id === currentUser.id;

        return (
            <div key={user.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between mb-2 group relative overflow-hidden active:bg-white/10 transition-colors">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <UserAvatar avatar={user.avatar} size="md" />
                        {user.level && (
                            <div className="absolute -bottom-1 -right-1 bg-yellow-500 text-black text-[8px] font-black px-1.5 py-0.5 rounded-full border border-[#0f0518]">
                                {user.level}
                            </div>
                        )}
                    </div>
                    <div>
                        <h4 className="font-bold text-white text-sm">{user.name}</h4>
                        <p className="text-xs text-slate-500 font-medium">@{user.nickname}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* BUSCA: Botões Dinâmicos */}
                    {type === 'search' && !isSelf && (
                        <>
                            {user.friendshipStatus === FriendshipStatus.NONE && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleSendRequest(user.id); }}
                                    className="bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-90 shadow-lg shadow-indigo-500/20"
                                >
                                    Adicionar
                                </button>
                            )}
                            {user.friendshipStatus === FriendshipStatus.PENDING_SENT && (
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter bg-white/5 px-2 py-1 rounded-md">
                                    Solicitado
                                </span>
                            )}
                            {user.friendshipStatus === FriendshipStatus.PENDING_RECEIVED && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleResponse(user.friendshipId || '', true); }}
                                    className="bg-green-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all active:scale-90"
                                >
                                    Aceitar
                                </button>
                            )}
                            {user.friendshipStatus === FriendshipStatus.ACCEPTED && (
                                <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                                    <i className="fas fa-check text-xs"></i>
                                </div>
                            )}
                        </>
                    )}

                    {/* AMIGOS / REQUESTS: Botões Standard */}
                    {type === 'friend' && (
                        <button className="text-slate-500 text-xs hover:text-white p-2">
                            <i className="fas fa-chevron-right"></i>
                        </button>
                    )}

                    {type === 'request' && (
                        <div className="flex gap-2">
                            <button
                                onClick={(e) => { e.stopPropagation(); handleResponse(user.friendshipId || '', true); }}
                                className="bg-indigo-500 text-white px-3 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-indigo-500/20 active:scale-95"
                            >
                                Aceitar
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleResponse(user.friendshipId || '', false); }}
                                className="bg-white/5 text-slate-400 px-3 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-white/10 active:scale-95 border border-white/5"
                            >
                                Recusar
                            </button>
                        </div>
                    )}

                    {/* DENÚNCIA: Sempre visível se não for eu */}
                    {!isSelf && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(`Deseja denunciar ${user.name}? Nossa equipe analisará o perfil.`)) {
                                    if (onShowToast) onShowToast("Denúncia Enviada", "Obrigado por sua colaboração.", 'info');
                                    else {
                                        onShowToast("Denúncia", "Denúncia enviada.", 'success');
                                    }
                                }
                            }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-600 hover:text-red-500 hover:bg-red-500/10 transition-all sm:opacity-0 group-hover:opacity-100"
                            title="Denunciar Usuário"
                        >
                            <i className="fas fa-flag text-xs"></i>
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto transition-opacity" onClick={onClose}></div>
            <div className={`bg-[#0f0518] w-full max-w-lg ${showQrCode ? 'h-[96vh] sm:h-[750px]' : 'h-[85vh] sm:h-[650px]'} rounded-t-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col overflow-hidden relative isolate transition-all duration-300`}>

                {/* Grabber Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                {/* DYNAMIC HEADER */}
                <div className="p-6 pt-8 pb-4 relative z-10 grid grid-cols-[40px_1fr_40px] items-center bg-white/[0.02]">
                    <div className="flex justify-start">
                        {showQrCode ? (
                            <button
                                onClick={toggleQr}
                                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:bg-slate-200 transition-all active:scale-90 shadow-lg"
                            >
                                <i className="fas fa-arrow-left"></i>
                            </button>
                        ) : activeTab === 'requests' ? (
                            <button
                                onClick={() => setActiveTab('my_friends')}
                                className="w-10 h-10 rounded-full flex items-center justify-center bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all active:scale-90"
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

                    <div className="flex flex-col items-center">
                        <h2 className="text-xl font-black text-white leading-tight tracking-tight uppercase italic text-center drop-shadow-md">
                            {showQrCode ? 'Dirole ID' : activeTab === 'my_friends' ? 'Meus Amigos' : activeTab === 'requests' ? 'Convites' : 'Explorar'}
                        </h2>
                        {!showQrCode && (
                            <button
                                onClick={() => { triggerHaptic(); fetchData(); }}
                                disabled={isLoading}
                                className={`text-[10px] uppercase font-bold tracking-widest mt-1 ${isLoading ? 'text-dirole-primary animate-pulse' : 'text-slate-500 hover:text-white'}`}
                            >
                                {isLoading ? 'Atualizando...' : 'Atualizar'} <i className={`fas fa-sync-alt ml-1 ${isLoading ? 'animate-spin' : ''}`}></i>
                            </button>
                        )}
                    </div>

                    <div className="flex justify-end">
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* NO TABS - SINGLE VIEW MODE */}


                <div className="flex-1 overflow-y-auto p-6 relative custom-scrollbar flex flex-col">

                    {showQrCode ? (
                        <div className="w-full flex flex-col items-center justify-start min-h-full py-8 animate-fade-in">

                            {!isScanning && !scanResult && (
                                <div className="w-full max-w-[300px] bg-[#1a1a2e] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative flex flex-col items-center overflow-hidden animate-slide-up mx-auto mb-4">

                                    {/* Header / Avatar */}
                                    <div className="flex flex-col items-center mb-5 z-10">
                                        <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-dirole-primary to-dirole-secondary shadow-[0_0_20px_rgba(139,92,246,0.3)] mb-3">
                                            <UserAvatar
                                                avatar={currentUser?.avatar}
                                                size="lg"
                                                className="w-full h-full border-2 border-[#1a1a2e]"
                                            />
                                        </div>
                                        <h3 className="text-lg font-black text-white mb-1 leading-none truncate max-w-[220px]">
                                            {currentUser?.name}
                                        </h3>
                                        <p className="text-dirole-secondary text-[10px] font-black tracking-[0.2em] uppercase opacity-80">
                                            @{currentUser?.nickname}
                                        </p>
                                    </div>

                                    {/* QR Code - White Background for readability */}
                                    <div className="bg-white p-3 rounded-2xl mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)] shrink-0">
                                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=dirole:${currentUser?.id}&color=000000`} alt="QR Code" className="w-40 h-40 mix-blend-multiply" />
                                    </div>

                                    {/* Actions */}
                                    <div className="w-full flex gap-3">
                                        <button
                                            onClick={startScan}
                                            className="flex-1 bg-white text-black font-black py-3.5 rounded-xl flex flex-col items-center justify-center gap-1 hover:bg-slate-200 transition-all shadow-lg active:scale-95"
                                        >
                                            <i className="fas fa-camera text-base"></i>
                                            <span className="text-[10px] uppercase tracking-wider">Escanear</span>
                                        </button>

                                        <button
                                            onClick={() => {
                                                if (hasNfc) {
                                                    shareViaNFC();
                                                } else {
                                                    const message = window.Capacitor?.isNativePlatform?.()
                                                        ? "NFC não disponível neste dispositivo. Verifique se o NFC está ativado nas configurações."
                                                        : "NFC não suportado neste navegador. Use o QR Code ou abra no app.";
                                                    if (onShowToast) onShowToast("NFC Indisponível", message, "error");
                                                    else {
                                                        onShowToast("Convite", message, 'success');
                                                    }
                                                }
                                            }}
                                            className={`flex-1 font-black py-3.5 rounded-xl flex flex-col items-center justify-center gap-1 transition-all shadow-lg active:scale-95 border ${hasNfc ? 'bg-dirole-primary text-white border-dirole-primary hover:bg-dirole-primary/80' : 'bg-white/5 text-slate-500 border-white/10 hover:bg-white/10 cursor-not-allowed'}`}
                                            disabled={!hasNfc}
                                        >
                                            <i className="fas fa-wifi rotate-90 text-base"></i>
                                            <span className="text-[10px] uppercase tracking-wider">NFC</span>
                                            {!hasNfc && <span className="text-[8px] opacity-60">N/D</span>}

                                        </button>
                                    </div>

                                    {/* ID Label */}
                                    <div className="mt-4 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                                        DIROLE ID
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
                                    <div className="w-20 h-20 rounded-full mx-auto mb-3">
                                        <UserAvatar avatar={scanResult.avatar} size="lg" className="border-2 border-green-500" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-1">{scanResult.name}</h3>
                                    <div className="flex items-center justify-center gap-1 text-green-400 text-xs font-bold uppercase mb-6">
                                        <i className="fas fa-check-circle"></i> ID Confirmado
                                    </div>

                                    <button
                                        onClick={async () => {
                                            await handleSendRequest(scanResult.id);
                                            setScanResult(null);
                                            setShowQrCode(false);
                                        }}
                                        className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-lg active:scale-95 transition-transform mb-3 hover:bg-green-500"
                                    >
                                        Adicionar Amigo
                                    </button>
                                    <button onClick={() => { setScanResult(null); setIsScanning(true); }} className="text-xs text-slate-400 hover:text-white mt-1 underline">Escanear Outro</button>
                                </div>
                            )}

                            {
                                scanError && (
                                    <div className="w-full max-w-[280px] bg-red-900/20 border border-red-500/30 rounded-2xl p-4 text-center mt-4 mb-4">
                                        <i className="fas fa-exclamation-circle text-red-500 text-2xl mb-2"></i>
                                        <p className="text-white font-bold text-sm">{scanError}</p>
                                        <button onClick={() => setScanError(null)} className="text-xs text-red-400 mt-2 underline">Tentar novamente</button>
                                    </div>
                                )
                            }

                            {
                                !isScanning && !scanResult && (
                                    <p className="text-[10px] font-bold text-slate-500 text-center mt-2 max-w-[220px] mx-auto leading-relaxed opacity-50">
                                        Mostre este código para conectar
                                    </p>
                                )
                            }
                        </div>
                    ) : (
                        <div className="animate-fade-in-up">
                            <div className="flex gap-2 mb-6 bg-white/5 p-1 rounded-xl">
                                <button
                                    onClick={() => { triggerHaptic(); setActiveTab('requests'); }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Solicitações
                                    {requests.length > 0 && (
                                        <span className="ml-2 px-2 py-0.5 text-xs bg-red-500 text-white rounded-full">
                                            {requests.length}
                                        </span>
                                    )}
                                </button>
                                <button
                                    onClick={() => { triggerHaptic(); setActiveTab('my_friends'); }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'my_friends'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Amigos
                                    <span className="ml-2 text-xs opacity-60">
                                        {friends.length}
                                    </span>
                                </button>
                                <button
                                    onClick={() => { triggerHaptic(); setActiveTab('search'); }}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeTab === 'search'
                                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    Buscar
                                </button>
                            </div>
                            {activeTab === 'my_friends' && (
                                <div className="space-y-3">
                                    {requests.length > 0 && (
                                        <button
                                            onClick={() => setActiveTab('requests')}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-center justify-between hover:bg-white/10 transition-all group mb-4"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 relative">
                                                    <i className="fas fa-envelope"></i>
                                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-black text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[#0f0518]">
                                                        {requests.length}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-black text-white uppercase tracking-wider">Convites Pendentes</p>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Toque para responder</p>
                                                </div>
                                            </div>
                                            <i className="fas fa-chevron-right text-slate-600 group-hover:text-white transition-colors"></i>
                                        </button>
                                    )}

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
                </div >

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
            </div >
        </div >
    );
};
