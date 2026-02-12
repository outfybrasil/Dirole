import React, { useState, useEffect, useMemo } from 'react';
import { Location, Review, LocationEvent, GalleryItem, Story } from '../types';
import { Thermometer } from './Thermometer';
import { verifyLocation, triggerHaptic, getReviewsForLocation, getEventsForLocation, getGalleryForLocation, blockUser, submitReview, getUserProfile, checkVerification, calculateDistance, getStoriesByLocation, markStoryAsViewed } from '../services/mockService';
import { StoryViewer } from './StoryViewer';

interface LocationDetailsModalProps {
    location: Location | null;
    isOpen: boolean;
    onClose: () => void;
    onCheckIn: (loc: Location) => void;
    onClaim?: (loc: Location) => void;
    onReport?: (id: string, type: 'location' | 'review' | 'photo', name?: string) => void;
    onInvite?: (loc: Location) => void;
    onPostStory?: (loc: Location) => void;
    onShowToast?: (title: string, message: string, type: 'success' | 'error' | 'info') => void;
    userLocation: { lat: number; lng: number } | null;
}

type TabType = 'overview' | 'agenda' | 'gallery' | 'stories';

export const LocationDetailsModal: React.FC<LocationDetailsModalProps> = ({
    location,
    isOpen,
    onClose,
    onCheckIn,
    onClaim,
    onReport,
    onInvite,
    onPostStory,
    onShowToast,
    userLocation
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [hasVoted, setHasVoted] = useState(false);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [events, setEvents] = useState<LocationEvent[]>([]);
    const [gallery, setGallery] = useState<GalleryItem[]>([]);
    const [stories, setStories] = useState<Story[]>([]);
    const [isStoryViewerOpen, setIsStoryViewerOpen] = useState(false);
    const [loadingData, setLoadingData] = useState(false);

    // Quick Vote State
    const [isVoting, setIsVoting] = useState(false);

    const distance = useMemo(() => {
        if (!userLocation || !location) return null;
        return calculateDistance(
            userLocation.lat,
            userLocation.lng,
            location.latitude,
            location.longitude
        );
    }, [userLocation, location]);

    const isTooFar = distance !== null && distance > 300;

    useEffect(() => {
        if (isOpen && location) {
            setLoadingData(true);
            setActiveTab('overview');
            setHasVoted(false); // Reset vote state on open

            // Safety timeout: stop loading after 8s no matter what
            const safetyTimer = setTimeout(() => {
                setLoadingData((current) => {
                    if (current) console.warn("Forcing stop loading data in modal due to timeout");
                    return false;
                });
            }, 8000);

            Promise.all([
                getReviewsForLocation(location.id),
                getEventsForLocation(location),
                getGalleryForLocation(location.id),
                getStoriesByLocation(location.id)
            ]).then(([revs, evts, pics, strs]) => {
                setReviews(revs);
                setEvents(evts);
                setGallery(pics);
                setStories(strs);

                // Check if user already voted
                const user = getUserProfile();
                if (user) {
                    if (revs.some(r => r.userId === user.id)) {
                        setHasVoted(true);
                    } else {
                        // Check verifications collection specifically for the "Validar Local" button
                        checkVerification(location.id, user.id).then(voted => {
                            if (voted) setHasVoted(true);
                        });
                    }
                }
            }).catch(err => {
                console.error("Error loading location details:", err);
            }).finally(() => {
                clearTimeout(safetyTimer);
                setLoadingData(false);
            });

            return () => clearTimeout(safetyTimer);
        }
    }, [isOpen, location]);

    if (!isOpen || !location) return null;

    const formatTime = (date: Date) => {
        const diff = Math.floor((new Date().getTime() - new Date(date).getTime()) / 60000);
        if (diff < 1) return 'agora mesmo';
        if (diff < 60) return `há ${diff} min`;
        const hours = Math.floor(diff / 60);
        if (hours < 24) return `há ${hours}h`;
        return 'há mais de 1 dia';
    };

    const handleVerify = async () => {
        const user = getUserProfile();
        if (!user || user.id.startsWith('guest_')) {
            alert("Faça login para validar locais!");
            return;
        }

        // GEOFENCING CHECK
        if (isTooFar) {
            alert(`Você precisa estar no local para validar! 📍\nDistância atual: ${Math.round(distance || 0)}m`);
            return;
        }

        if (!userLocation) {
            alert("Ative seu GPS para validar este local!");
            return;
        }

        triggerHaptic();
        setHasVoted(true);
        await verifyLocation(location.id, user.id);
    }

    const handleQuickVote = async (crowdLevel: number, vibeLevel: number) => {
        const user = getUserProfile();
        if (!user || user.id.startsWith('guest_')) {
            if (confirm("Crie uma conta para votar!")) {
                onClose();
                // Logic to redirect to login handled by parent usually, but here we just close
            }
            return;
        }

        // GEOFENCING CHECK
        if (isTooFar) {
            alert(`Você precisa estar no local para o check-in rápido! 📍\nDistância atual: ${Math.round(distance || 0)}m`);
            return;
        }

        if (!userLocation) {
            alert("Ative seu GPS para fazer o check-in rápido!");
            return;
        }

        setIsVoting(true);
        triggerHaptic([50, 50]);

        try {
            // Create a minimal review
            const review: Review = {
                userId: user.id,
                userName: user.name,
                userAvatar: user.avatar,
                locationId: location.id,
                price: 0,
                crowd: crowdLevel,
                gender: 0,
                vibe: vibeLevel,
                comment: '', // No comment for quick vote
                createdAt: new Date()
            };

            const success = await submitReview(review, location);
            if (success) {
                setHasVoted(true);
                // Refresh reviews to show the new vote (even if empty comment, it updates stats)
                const newRevs = await getReviewsForLocation(location.id);
                setReviews(newRevs);
            }
        } finally {
            setIsVoting(false);
        }
    };

    const handleBlock = async (userId: string) => {
        if (confirm("Deseja bloquear este usuário? Você não verá mais conteúdo dele.")) {
            const stored = localStorage.getItem('dirole_user_profile');
            if (stored) {
                const me = JSON.parse(stored);
                await blockUser(me.id, userId);
                const newRevs = await getReviewsForLocation(location.id);
                setReviews(newRevs);
            }
        }
    };

    const handleShare = async () => {
        triggerHaptic();
        const shareUrl = `${window.location.origin}/?loc=${location.id}`;
        const shareText = `Olha esse rolê no Dirole: ${location.name} - ${location.address}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Vem pro ${location.name}!`,
                    text: shareText,
                    url: shareUrl
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            // Fallback for desktop or non-supported browsers
            try {
                await navigator.clipboard.writeText(shareUrl);
                if (onShowToast) {
                    onShowToast("Link Copiado! 🔗", "Compartilhe com seus amigos.", 'success');
                } else {
                    alert("Link copiado para a área de transferência!");
                }
            } catch (err) {
                console.error('Failed to copy', err);
            }
        }
    };

    const uberLink = `https://m.uber.com/ul/?action=setPickup&client_id=&pickup=my_location&dropoff[latitude]=${location.latitude}&dropoff[longitude]=${location.longitude}&dropoff[nickname]=${encodeURIComponent(location.name)}`;

    // Tab Content Renderers
    const renderOverview = () => (
        <div className="space-y-4 animate-fade-in">

            {/* QUICK VOTE SECTION - THE SIMPLE WAY */}
            {!hasVoted && (
                <div className="bg-gradient-to-r from-dirole-primary/10 to-dirole-secondary/10 border border-dirole-primary/20 rounded-xl p-4 mb-4">
                    <h3 className="text-center text-sm font-bold text-white mb-3">Como está aí agora?</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={() => handleQuickVote(3, 3)}
                            disabled={isVoting || isTooFar}
                            className={`flex-1 ${isTooFar ? 'bg-slate-800 border-white/5 text-slate-500 opacity-50 grayscale' : 'bg-red-500/20 border-red-500/50 hover:bg-red-500/40 text-white'} border py-3 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95`}
                        >
                            <span className="text-xl">🔥</span>
                            <span className="text-[10px] font-bold uppercase">{isTooFar ? 'Bloqueado' : 'Bombando'}</span>
                        </button>

                        <button
                            onClick={() => handleQuickVote(2, 2)}
                            disabled={isVoting || isTooFar}
                            className={`flex-1 ${isTooFar ? 'bg-slate-800 border-white/5 text-slate-500 opacity-50 grayscale' : 'bg-yellow-500/20 border-yellow-500/50 hover:bg-yellow-500/40 text-white'} border py-3 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95`}
                        >
                            <span className="text-xl">🙂</span>
                            <span className="text-[10px] font-bold uppercase">{isTooFar ? 'Bloqueado' : 'Legal'}</span>
                        </button>

                        <button
                            onClick={() => handleQuickVote(1, 1)}
                            disabled={isVoting || isTooFar}
                            className={`flex-1 ${isTooFar ? 'bg-slate-800 border-white/5 text-slate-500 opacity-50 grayscale' : 'bg-blue-500/20 border-blue-500/50 hover:bg-blue-500/40 text-white'} border py-3 rounded-lg flex flex-col items-center gap-1 transition-all active:scale-95`}
                        >
                            <span className="text-xl">🧊</span>
                            <span className="text-[10px] font-bold uppercase">{isTooFar ? 'Bloqueado' : 'Vazio'}</span>
                        </button>
                    </div>
                </div>
            )}

            {hasVoted && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center animate-fade-in mb-4">
                    <p className="text-green-500 font-bold text-sm flex items-center justify-center gap-2">
                        <i className="fas fa-check-circle"></i> Voto Registrado!
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Obrigado por ajudar a comunidade.</p>
                </div>
            )}

            {/* OFFICIAL INFO SECTION */}
            {location.isOfficial && location.officialDescription && (
                <div className="mt-2 p-4 rounded-xl bg-gradient-to-br from-slate-800 to-black border border-yellow-500/20 shadow-lg relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                    <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                        <i className="fas fa-store-alt"></i> Informações do Local
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {location.officialDescription}
                    </p>
                    <div className="mt-3 flex gap-3">
                        {location.instagram && (
                            <a href={`https://instagram.com/${location.instagram}`} target="_blank" className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors">
                                <i className="fab fa-instagram text-pink-500"></i> @{location.instagram}
                            </a>
                        )}
                        {location.whatsapp && (
                            <a href="#" className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 hover:bg-white/20 transition-colors">
                                <i className="fab fa-whatsapp text-green-500"></i> Contato
                            </a>
                        )}
                    </div>
                </div>
            )}

            {/* King of the Spot */}
            {location.king && (
                <div className="p-0.5 rounded-xl bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500">
                    <div className="bg-slate-900 rounded-[10px] p-3 flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-full border-2 border-yellow-500 overflow-hidden bg-slate-800 flex items-center justify-center">
                                {location.king.userAvatar.startsWith('http') ? <img src={location.king.userAvatar} className="w-full h-full object-cover" /> : location.king.userAvatar}
                            </div>
                            <div className="absolute -top-2 -right-1 text-base">👑</div>
                        </div>
                        <div>
                            <p className="text-[10px] text-yellow-500 font-bold uppercase tracking-wider">Prefeito do Rolê 👑</p>
                            <p className="text-sm font-bold text-white">{location.king.userName} <span className="text-slate-500 font-normal text-xs">({location.king.checkInCount} check-ins)</span></p>
                        </div>
                    </div>
                </div>
            )}

            {!location.verified && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-between">
                    <div className="mr-2">
                        <p className="text-xs font-bold text-yellow-500 mb-0.5">Local em Moderação</p>
                        <p className="text-[10px] text-slate-400">Este local foi criado recentemente pela comunidade.</p>
                    </div>
                    {!hasVoted ? (
                        <button
                            onClick={handleVerify}
                            disabled={isTooFar}
                            className={`px-3 py-1.5 ${isTooFar ? 'bg-slate-800 text-slate-500 border border-white/10 cursor-not-allowed' : 'bg-yellow-600 text-white hover:bg-yellow-500 transition-colors'} text-xs font-bold rounded-lg whitespace-nowrap`}
                        >
                            Validar Local
                        </button>
                    ) : (
                        <span className="text-xs text-green-500 font-bold"><i className="fas fa-check"></i> Votado</span>
                    )}
                </div>
            )}

            {/* Thermometer */}
            <div className="mb-4">
                <Thermometer stats={location.stats} />
            </div>

            {/* Reviews */}
            <div>
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                    <h3 className="text-lg font-bold text-white">Comentários ao Vivo</h3>
                </div>
                <div className="space-y-4">
                    {loadingData ? (
                        <div className="text-center py-4 text-slate-500">
                            <i className="fas fa-circle-notch fa-spin"></i>
                        </div>
                    ) : reviews.length > 0 ? (
                        reviews.map((review) => (
                            <div key={review.id} className="bg-white/5 rounded-xl p-4 border border-white/5 relative group">
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                    <button
                                        onClick={() => handleBlock(review.userId)}
                                        className="text-slate-600 hover:text-slate-400 p-1"
                                        title="Bloquear Usuário"
                                    >
                                        <i className="fas fa-ban text-xs"></i>
                                    </button>
                                    <button
                                        onClick={() => onReport && onReport(review.id || '', 'review', `Review de ${review.userName}`)}
                                        className="text-slate-600 hover:text-red-500 p-1"
                                        title="Denunciar Comentário"
                                    >
                                        <i className="fas fa-flag text-xs"></i>
                                    </button>
                                </div>

                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg border border-white/10 overflow-hidden">
                                            {review.userAvatar?.startsWith('http') ? (
                                                <img src={review.userAvatar} alt="user" className="w-full h-full object-cover" />
                                            ) : (
                                                review.userAvatar || '👤'
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-sm font-bold text-white block leading-none">
                                                {review.userName || 'Anônimo'}
                                            </span>
                                            <span className="text-[10px] text-slate-500">
                                                {formatTime(review.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-1 pr-10">
                                        {review.vibe > 2.3 && <span title="Vibe Boa">🔥</span>}
                                        {review.crowd < 1.7 && <span title="Vazio">🧊</span>}
                                        {review.crowd > 2.3 && <span title="Cheio">🥵</span>}
                                    </div>
                                </div>
                                {review.comment && review.comment.trim() !== "" && (
                                    <p className="text-sm text-slate-300 leading-relaxed italic">"{review.comment}"</p>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 text-slate-500 border-2 border-dashed border-white/5 rounded-xl">
                            <p>Nenhum comentário ainda.</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-8 pt-4 border-t border-white/5 text-center flex justify-center gap-4">
                {!location.isOfficial && onClaim && (
                    <button
                        onClick={() => { triggerHaptic(); onClose(); onClaim(location); }}
                        className="text-xs text-slate-500 hover:text-white transition-colors underline decoration-slate-700"
                    >
                        É proprietário? Reivindicar
                    </button>
                )}

                {onReport && (
                    <button
                        onClick={() => onReport(location.id, 'location', location.name)}
                        className="text-xs text-red-900/50 hover:text-red-500 transition-colors flex items-center gap-1"
                    >
                        <i className="fas fa-flag"></i> Denunciar Local
                    </button>
                )}
            </div>
        </div>
    );

    const renderAgenda = () => (
        <div className="space-y-4 animate-fade-in pt-2">
            {events.length > 0 ? (
                events.map(event => (
                    <div key={event.id} className="bg-white/5 rounded-xl border border-white/5 overflow-hidden flex">
                        <div className="w-24 bg-slate-800 relative">
                            <img src={event.imageUrl} className="w-full h-full object-cover opacity-60" />
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <span className="text-lg font-bold text-white">{event.date.getDate()}</span>
                                <span className="text-[10px] uppercase font-bold text-slate-300">
                                    {event.date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')}
                                </span>
                            </div>
                        </div>
                        <div className="p-4 flex-1">
                            <span className="text-[10px] font-bold text-dirole-primary bg-dirole-primary/10 px-2 py-0.5 rounded uppercase tracking-wider mb-1 inline-block">
                                {event.category}
                            </span>
                            <h4 className="font-bold text-white text-lg leading-tight">{event.title}</h4>
                            <p className="text-xs text-slate-400 mt-1">{event.description}</p>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/[0.02] border border-white/5 rounded-3xl animate-fade-in">
                    <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 text-3xl">
                        📅
                    </div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Programação em Breve</h4>
                    <p className="text-[10px] text-slate-500 max-w-[200px] font-medium leading-relaxed uppercase tracking-wider">
                        Estamos alinhando os melhores eventos para este local. Fique de olho!
                    </p>
                </div>
            )}
        </div>
    );

    const renderGallery = () => (
        <div className="animate-fade-in pt-2">
            <div className="grid grid-cols-3 gap-1">
                {gallery.map(item => (
                    <div key={item.id} className="relative aspect-square group overflow-hidden bg-slate-800 rounded-lg">
                        <img src={item.imageUrl} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />

                        <button
                            onClick={() => onReport && onReport(item.id, 'photo', 'Foto da Galeria')}
                            className="absolute top-1 right-1 bg-black/50 text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Denunciar Foto"
                        >
                            <i className="fas fa-flag text-[10px]"></i>
                        </button>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 pointer-events-none">
                            <div className="flex items-center gap-1">
                                <span className="text-xs">{item.userAvatar}</span>
                                <span className="text-[10px] text-white truncate max-w-[60px]">{item.userName}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            {gallery.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-white/[0.02] border border-white/5 rounded-3xl animate-fade-in">
                    <div className="w-16 h-16 bg-slate-800/30 rounded-full flex items-center justify-center mb-6 text-3xl opacity-50">
                        📸
                    </div>
                    <h4 className="text-white font-black uppercase tracking-widest text-sm mb-2">Sem Flash ainda</h4>
                    <p className="text-[10px] text-slate-500 max-w-[180px] font-medium leading-relaxed uppercase tracking-wider">
                        Seja o primeiro a registrar a vibe deste rolê!
                    </p>
                </div>
            )}
            <div className="mt-4 text-center">
                <button className="text-xs text-dirole-primary border border-dirole-primary/30 rounded-full px-4 py-2 hover:bg-dirole-primary/10 transition-colors">
                    <i className="fas fa-camera mr-2"></i> Adicionar Foto
                </button>
            </div>
        </div>
    );

    const renderStories = () => (
        <div className="space-y-4 animate-fade-in">
            {stories.length === 0 ? (
                <div className="text-center py-12">
                    <i className="fas fa-camera text-slate-600 text-4xl mb-3"></i>
                    <p className="text-slate-400 text-sm">Nenhum story ativo neste local</p>
                    <p className="text-slate-500 text-xs mt-1">Stories expiram em 6 horas</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3">
                    {stories.map((story) => (
                        <button
                            key={story.id}
                            onClick={() => {
                                triggerHaptic();
                                setIsStoryViewerOpen(true);
                            }}
                            className="relative aspect-[9/16] rounded-2xl overflow-hidden border-2 border-purple-500 hover:scale-105 transition-transform"
                        >
                            <img
                                src={story.photoUrl}
                                alt="Story"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                                <p className="text-white text-xs font-bold truncate">{story.userNickname || story.userName}</p>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center pointer-events-none sm:p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto transition-opacity duration-500" onClick={onClose}></div>

            <div className="bg-[#0f0518] w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2rem] border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.8)] pointer-events-auto animate-slide-up flex flex-col h-[90vh] sm:h-[85vh] overflow-hidden relative isolate">

                {/* Grabber Handle */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-12 h-1 bg-white/20 rounded-full z-50"></div>

                <div className="relative h-64 shrink-0">
                    <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0f0518] via-[#0f0518]/60 to-transparent"></div>

                    <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 bg-black/20 hover:bg-black/50 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all border border-white/10">
                        <i className="fas fa-times"></i>
                    </button>

                    <div className="absolute bottom-4 left-6 right-6">
                        <div className="flex justify-between items-end">
                            <div className="flex-1 pr-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${location.verified ? 'text-dirole-primary bg-dirole-primary/10 border-dirole-primary/20' : 'text-slate-400 bg-slate-800/50 border-white/10'}`}>
                                        {location.type}
                                    </span>
                                    <span className="text-xs font-black text-slate-500 tracking-[0.2em] ml-2">
                                        {'$'.repeat(Math.max(1, Math.min(3, Math.round(location.stats.avgPrice || 1))))}
                                    </span>
                                    {location.verified && <span className="text-[10px] text-green-400 font-bold flex items-center gap-1"><i className="fas fa-check-circle"></i> Oficial</span>}
                                </div>
                                <h2 className="text-4xl font-black text-white leading-none tracking-tight mb-2">{location.name}</h2>
                                <p className="text-sm text-slate-300 font-medium truncate opacity-80">{location.address}</p>
                            </div>
                            <div className="text-center bg-white/5 rounded-2xl p-3 backdrop-blur-md border border-white/5 min-w-[70px]">
                                <span className="block text-2xl font-black text-white">{location.stats.reviewCount}</span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Reviews</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-6 border-b border-white/5 flex gap-8 text-sm font-bold shrink-0 bg-[#0f0518]/50 backdrop-blur-md sticky top-0 z-40">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 relative transition-colors tracking-wide ${activeTab === 'overview' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        VISÃO GERAL
                        {activeTab === 'overview' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-[0_0_15px_#8b5cf6]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('agenda')}
                        className={`py-4 relative transition-colors tracking-wide ${activeTab === 'agenda' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        AGENDA
                        {activeTab === 'agenda' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-[0_0_15px_#8b5cf6]"></div>}
                    </button>
                    <button
                        onClick={() => setActiveTab('gallery')}
                        className={`py-4 relative transition-colors tracking-wide ${activeTab === 'gallery' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        FOTOS
                        {activeTab === 'gallery' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-[0_0_15px_#8b5cf6]"></div>}
                    </button>
                    <button
                        onClick={() => { triggerHaptic(); setActiveTab('stories'); }}
                        className={`py-4 relative transition-colors tracking-wide ${activeTab === 'stories' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        STORIES {stories.length > 0 && `(${stories.length})`}
                        {activeTab === 'stories' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_15px_#a855f7]"></div>}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 pb-32 pt-6 custom-scrollbar">
                    {activeTab === 'overview' && renderOverview()}
                    {activeTab === 'agenda' && renderAgenda()}
                    {activeTab === 'gallery' && renderGallery()}
                    {activeTab === 'stories' && renderStories()}
                </div>

                {/* Floating Bottom Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#0f0518] via-[#0f0518] to-transparent z-50">
                    <div className="flex gap-3 mb-3">
                        <a
                            href={uberLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => triggerHaptic()}
                            className="flex-1 bg-slate-900/80 backdrop-blur text-white border border-white/10 font-bold py-4 rounded-2xl active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-2 group"
                        >
                            <span className="text-lg group-hover:-translate-y-1 transition-transform">🚗</span>
                            <span className="text-sm">Uber</span>
                        </a>
                        <button
                            onClick={handleShare}
                            className="flex-1 bg-slate-900/80 backdrop-blur text-white border border-white/10 font-bold py-4 rounded-2xl active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-2 group"
                        >
                            <span className="text-lg group-hover:-translate-y-1 transition-transform">🔗</span>
                            <span className="text-sm">Compartilhar</span>
                        </button>
                        <button
                            onClick={() => { if (onInvite) onInvite(location); }}
                            className="flex-1 bg-slate-900/80 backdrop-blur text-white border border-white/10 font-bold py-4 rounded-2xl active:scale-95 transition-all hover:bg-slate-800 flex items-center justify-center gap-2 group"
                        >
                            <span className="text-lg group-hover:-translate-y-1 transition-transform">✉️</span>
                            <span className="text-sm">Convidar</span>
                        </button>
                    </div>

                    {/* Story Button - Second Row */}
                    {onPostStory && (
                        <div className="mb-3">
                            <button
                                onClick={() => { triggerHaptic(); onPostStory(location); }}
                                disabled={isTooFar}
                                className={`w-full ${isTooFar ? 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed grayscale' : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-[0_5px_20px_rgba(168,85,247,0.3)] hover:shadow-[0_5px_30px_rgba(168,85,247,0.5)]'} font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10`}
                            >
                                <i className="fas fa-camera"></i> {isTooFar ? 'LONGE DEMAIS' : 'POSTAR STORY'}
                            </button>
                        </div>
                    )}

                    <button
                        onClick={() => { triggerHaptic(); onClose(); onCheckIn(location); }}
                        disabled={isTooFar}
                        className={`w-full ${isTooFar ? 'bg-slate-800 text-slate-500 border-white/5 cursor-not-allowed grayscale shadow-none' : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-[0_5px_20px_rgba(139,92,246,0.3)] hover:shadow-[0_5px_30px_rgba(139,92,246,0.5)]'} font-black py-4 rounded-2xl active:scale-95 transition-all flex items-center justify-center gap-2 border border-white/10`}
                    >
                        <i className="fas fa-edit"></i> {isTooFar ? 'LONGE DEMAIS' : 'CHECK-IN DETALHADO'}
                    </button>
                    {isTooFar && (
                        <p className="text-center text-[10px] font-black text-red-500/80 uppercase tracking-[0.2em] mt-3 animate-pulse">
                            📍 Fora de alcance ({Math.round(distance || 0)}m / Limite 300m)
                        </p>
                    )}
                </div>

                {/* Story Viewer */}
                {isStoryViewerOpen && stories.length > 0 && (
                    <StoryViewer
                        isOpen={isStoryViewerOpen}
                        stories={stories}
                        currentUserId={getUserProfile()?.id || ''}
                        onClose={() => setIsStoryViewerOpen(false)}
                        onStoryViewed={(storyId) => {
                            const user = getUserProfile();
                            if (user) markStoryAsViewed(storyId, user.id);
                        }}
                    />
                )}

            </div>
        </div >
    );
};