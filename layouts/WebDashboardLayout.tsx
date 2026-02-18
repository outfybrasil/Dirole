import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';

// Lazy Load Heavy Components
const MapView = React.lazy(() => import('../components/MapView').then(module => ({ default: module.MapView })));
const ListView = React.lazy(() => import('../components/ListView').then(module => ({ default: module.ListView })));
const FilterBar = React.lazy(() => import('../components/FilterBar').then(module => ({ default: module.FilterBar })));
const Leaderboard = React.lazy(() => import('../components/Leaderboard').then(module => ({ default: module.Leaderboard })));

// Lazy Load Modals
const ReviewModal = React.lazy(() => import('../components/ReviewModal').then(module => ({ default: module.ReviewModal })));
const AddLocationModal = React.lazy(() => import('../components/AddLocationModal').then(module => ({ default: module.AddLocationModal })));
const ProfileModal = React.lazy(() => import('../components/ProfileModal').then(module => ({ default: module.ProfileModal })));
const LocationDetailsModal = React.lazy(() => import('../components/LocationDetailsModal').then(module => ({ default: module.LocationDetailsModal })));
const ClaimBusinessModal = React.lazy(() => import('../components/ClaimBusinessModal').then(module => ({ default: module.ClaimBusinessModal })));
const ReportModal = React.lazy(() => import('../components/ReportModal').then(module => ({ default: module.ReportModal })));
const InviteFriendsModal = React.lazy(() => import('../components/InviteFriendsModal').then(module => ({ default: module.InviteFriendsModal })));
const FriendsModal = React.lazy(() => import('../components/FriendsModal').then(module => ({ default: module.FriendsModal })));
const NotificationsModal = React.lazy(() => import('../components/NotificationsModal').then(module => ({ default: module.NotificationsModal })));
const QRScannerModal = React.lazy(() => import('../components/QRScannerModal').then(module => ({ default: module.QRScannerModal })));
const PrivacyPolicyModal = React.lazy(() => import('../components/PrivacyPolicyModal').then(module => ({ default: module.PrivacyPolicyModal })));
const DataPrivacyModal = React.lazy(() => import('../components/DataPrivacyModal').then(module => ({ default: module.DataPrivacyModal })));
const StoryCamera = React.lazy(() => import('../components/StoryCamera').then(module => ({ default: module.StoryCamera })));

// Keep lightweight/critical components eager
import { Confetti } from '../components/Confetti';
import { InAppToast, ToastData } from '../components/InAppToast';
import UserAvatar from '../components/UserAvatar';
import { SearchBar } from '../components/SearchBar';

import { Location, Filters, User, MapBounds } from '../types';
import { getNearbyRoles, getUserProfile, toggleFavorite, syncUserProfile, triggerHaptic, requestNotificationPermission, sendLocalNotification, searchLocations, getUserById, getPendingFriendRequests } from '../services/mockService';
import { INITIAL_CENTER } from '../constants';
import { getCurrentSession, signOut } from '../services/authService';

import { useDeepLinks } from '../hooks/useDeepLinks';
import { useLocationTracking } from '../hooks/useLocationTracking';
import { useAppwriteRealtime } from '../hooks/useAppwriteRealtime';

interface WebDashboardLayoutProps {
    preloadedUser?: User | null;
}

export function WebDashboardLayout({ preloadedUser }: WebDashboardLayoutProps) {
    // --- AUTH STATE ---
    const [currentUser, setCurrentUser] = useState<User | null>(preloadedUser || null);

    // --- APP STATE ---
    const [activeTab, setActiveTab] = useState<'map' | 'list' | 'rank'>('map');
    const [locations, setLocations] = useState<Location[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [userAccuracy, setUserAccuracy] = useState<number>(0);
    const [mapTarget, setMapTarget] = useState<{ lat: number, lng: number } | null>(null);
    const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number, lng: number } | null>(null);
    const [searchOrigin, setSearchOrigin] = useState<{ lat: number, lng: number } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [hasInitialLoad, setHasInitialLoad] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // --- MODALS STATE ---
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [isStoryCameraOpen, setIsStoryCameraOpen] = useState(false);
    const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
    const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
    const [isDataModalOpen, setIsDataModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
    const [storyLocation, setStoryLocation] = useState<Location | null>(null);
    const [reportTarget, setReportTarget] = useState<{ id: string, type: 'location' | 'review' | 'photo' | 'user', name?: string } | null>(null);
    const [scannedUser, setScannedUser] = useState<any>(null);

    // --- FRIENDS MODAL STATE ---
    const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
    const [friendsModalTab, setFriendsModalTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');
    const [friendsModalView, setFriendsModalView] = useState<'default' | 'qr'>('default');

    // --- UI STATE ---
    const [showFilters, setShowFilters] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);
    const [toasts, setToasts] = useState<ToastData[]>([]);
    const [notificationCount, setNotificationCount] = useState(0);
    const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
    const [filters, setFilters] = useState<Filters>({
        minVibe: false,
        lowCost: false,
        types: [],
        maxDistance: 3,
        onlyOpen: false
    });

    const isRefreshingRef = useRef(isRefreshing);
    const currentMapBounds = useRef<MapBounds | null>(null);

    // --- SHARED HANDLERS ---
    const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { ...toast, id }]);
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    useEffect(() => { isRefreshingRef.current = isRefreshing; }, [isRefreshing]);

    const fetchData = useCallback(async (lat: number, lng: number, bounds?: MapBounds) => {
        if (!isRefreshingRef.current) setIsLoading(true);
        setSearchOrigin({ lat, lng });

        try {
            const queryBounds = bounds || currentMapBounds.current;
            const data = await getNearbyRoles(lat, lng, queryBounds);
            setLocations(data);
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    const fetchNotificationCount = useCallback(async (userId: string) => {
        try {
            const pendingRequests = await getPendingFriendRequests(userId);
            setNotificationCount(pendingRequests.length);
        } catch (e) {
            console.error('[Notifications] Failed to fetch:', e);
        }
    }, []);

    const playNotificationSound = useCallback(() => {
        // Simple mock sound for web
    }, []);

    // --- CUSTOM HOOKS ---
    useDeepLinks({ addToast });

    const { handleForceLocationRefresh } = useLocationTracking({
        currentUser,
        hasInitialLoad,
        setHasInitialLoad,
        setUserLocation,
        setUserAccuracy,
        setMapTarget,
        setCurrentMapCenter,
        setSearchOrigin,
        fetchData,
        setIsLoading,
        triggerHaptic,
    });

    useAppwriteRealtime({
        currentUser,
        setCurrentUser,
        playNotificationSound,
        triggerHaptic,
        addToast,
        sendLocalNotification,
        setIsNotificationsModalOpen,
        fetchNotificationCount,
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        const initAuth = async () => {
            // Basic user sync if needed, mostly handled by App.tsx
            if (currentUser) {
                const syncedUser = await syncUserProfile(currentUser.id, { email: currentUser.email, name: currentUser.name });
                if (syncedUser) setCurrentUser(syncedUser);
            }
        };
        initAuth();
        requestNotificationPermission();
    }, []);

    const handleRegionChange = useCallback((center: { lat: number; lng: number }, bounds: MapBounds) => {
        setCurrentMapCenter(center);
        currentMapBounds.current = bounds;
    }, []);

    // --- FILTERED LOCATIONS ---
    const filteredLocations = useMemo(() => {
        let res = locations;
        if (filters.minVibe) res = res.filter(l => l.stats.avgVibe > 2.3);
        if (filters.lowCost) res = res.filter(l => l.stats.avgPrice < 1.7);
        if (filters.onlyOpen) res = res.filter(l => l.isOpen);
        if (filters.maxDistance) res = res.filter(l => (l.distance || 0) <= filters.maxDistance * 1000);
        if (filters.types.length > 0) res = res.filter(l => filters.types.includes(l.type));
        return res;
    }, [filters, locations]);

    // --- UI HANDLERS ---
    const handleTextSearch = async (query: string) => {
        if (!query.trim()) {
            if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng);
            return;
        }
        setIsLoading(true);
        try {
            const lat = currentMapCenter?.lat || userLocation?.lat || INITIAL_CENTER.lat;
            const lng = currentMapCenter?.lng || userLocation?.lng || INITIAL_CENTER.lng;
            const results = await searchLocations(query, lat, lng);
            if (results.length > 0) {
                setLocations(results);
                setMapTarget({ lat: results[0].latitude, lng: results[0].longitude });
                setFilters(prev => ({ ...prev, maxDistance: 30 }));
            } else {
                addToast({ title: "Não encontrado", message: "Nenhum local encontrado.", type: 'error' });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = useCallback(async () => {
        localStorage.removeItem('dirole_user_profile');
        setCurrentUser(null);
        window.location.reload(); // Force reload to go back to landing
        try { await signOut(); } catch (e) { console.warn('Appwrite logout failed', e); }
    }, []);

    const handleQRScan = async (decodedText: string) => {
        setIsQRScannerOpen(false);
        if (decodedText.startsWith('dirole:')) {
            const friendId = decodedText.split(':')[1];
            if (friendId === currentUser?.id) return;
            try {
                const friend = await getUserById(friendId);
                if (friend) {
                    setScannedUser(friend);
                    setTimeout(() => setIsFriendsModalOpen(true), 200);
                }
            } catch (error) { }
        }
    };

    if (!currentUser) return null; // Should be handled by App.tsx

    return (
        <div className="flex h-screen w-full bg-[#0f0518] text-white overflow-hidden font-sans p-4 gap-4 selection:bg-purple-500 selection:text-white">
            {showConfetti && <Confetti />}
            <div className="fixed top-4 right-4 z-[9999] pointer-events-none flex flex-col items-end gap-2">
                {toasts.map(toast => <InAppToast key={toast.id} toast={toast} onClose={removeToast} />)}
            </div>

            {/* SIDEBAR NAVIGATION - DESKTOP */}
            <aside className="w-64 bg-[#12081f] rounded-[2rem] flex flex-col shrink-0 z-50 shadow-2xl overflow-hidden border border-white/5">
                {/* Logo Area */}
                <div className="p-8 flex items-center justify-center gap-3 border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent">
                    <img src="/og-image.png" alt="Dirole" className="w-10 h-10 object-contain drop-shadow-[0_0_15px_rgba(168,85,247,0.5)]" />
                    <h1 className="text-2xl font-[1000] italic tracking-tighter text-white">DIROLE</h1>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 px-4 space-y-2 py-6 overflow-y-auto custom-scrollbar">
                    <button onClick={() => setActiveTab('map')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${activeTab === 'map' ? 'bg-dirole-primary text-white font-bold shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'map' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <i className="fas fa-map-marked-alt text-sm"></i>
                        </div>
                        <span className="text-sm font-bold tracking-wide">MAPA</span>
                    </button>
                    <button onClick={() => setActiveTab('list')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${activeTab === 'list' ? 'bg-dirole-primary text-white font-bold shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'list' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <i className="fas fa-list text-sm"></i>
                        </div>
                        <span className="text-sm font-bold tracking-wide">LISTA</span>
                    </button>
                    <button onClick={() => setActiveTab('rank')} className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all group ${activeTab === 'rank' ? 'bg-dirole-primary text-white font-bold shadow-lg shadow-purple-900/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${activeTab === 'rank' ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'}`}>
                            <i className="fas fa-trophy text-sm"></i>
                        </div>
                        <span className="text-sm font-bold tracking-wide">RANKING</span>
                    </button>
                </nav>

                {/* User Profile Mini */}
                <div className="p-4 border-t border-white/5 bg-black/20">
                    <button onClick={() => setIsProfileModalOpen(true)} className="w-full flex items-center gap-3 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                        <div className="relative">
                            <UserAvatar avatar={currentUser.avatar} size="sm" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#12081f]"></div>
                        </div>
                        <div className="flex-1 text-left overflow-hidden">
                            <p className="text-sm font-bold truncate text-white group-hover:text-dirole-primary transition-colors">{currentUser.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Nível {currentUser.level}</p>
                        </div>
                        <i className="fas fa-cog text-slate-500 group-hover:text-white transition-colors"></i>
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col relative min-w-0 bg-[#12081f] rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden">
                {/* HEADER / TOOLBAR */}
                <header className="h-24 flex items-center justify-between px-8 bg-black/20 z-40 shrink-0">
                    {/* Search Bar */}
                    <div className="w-96">
                        <SearchBar onSearch={handleTextSearch} />
                    </div>

                    {/* Right Actions */}
                    <div className="flex items-center gap-4">
                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`h-12 px-6 rounded-2xl border flex items-center gap-2 font-bold text-sm transition-all ${showFilters ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}
                        >
                            <i className="fas fa-sliders-h"></i>
                            Filtros
                        </button>

                        {/* Add Location Button */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="h-12 px-8 bg-gradient-to-r from-dirole-primary to-dirole-secondary rounded-2xl text-white font-bold text-sm shadow-lg shadow-purple-900/30 hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                        >
                            <i className="fas fa-plus"></i>
                            Adicionar Local
                        </button>

                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        {/* Notifications */}
                        <button onClick={() => setIsNotificationsModalOpen(true)} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 relative transition-colors">
                            <i className="fas fa-bell"></i>
                            {notificationCount > 0 && <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#12081f]"></span>}
                        </button>
                    </div>
                </header>

                {/* Filter Bar (Collapsible) */}
                {showFilters && (
                    <div className="w-full bg-[#1a0f2e] border-b border-white/5 p-6 animate-slide-down z-30 shadow-inner">
                        <Suspense fallback={<div>Loading filters...</div>}>
                            <FilterBar filters={filters} onChange={setFilters} onSearch={handleTextSearch} onClose={() => setShowFilters(false)} />
                        </Suspense>
                    </div>
                )}

                {/* CONTENT CANVAS */}
                <div className="flex-1 relative overflow-hidden bg-black/20">
                    {activeTab === 'map' && (
                        <>
                            <Suspense fallback={<div className="flex items-center justify-center h-full"><i className="fas fa-circle-notch animate-spin text-3xl text-dirole-primary"></i></div>}>
                                <MapView
                                    locations={filteredLocations}
                                    userLocation={userLocation}
                                    userAccuracy={userAccuracy}
                                    mapCenter={mapTarget}
                                    onOpenDetails={(loc) => { setSelectedLocation(loc); setIsDetailsModalOpen(true); }}
                                    onRegionChange={handleRegionChange}
                                    searchRadius={filters.maxDistance}
                                    searchOrigin={searchOrigin}
                                    theme={mapTheme}
                                />
                            </Suspense>

                            {/* Floating Map Controls (Bottom Right) */}
                            <div className="absolute bottom-8 right-8 flex flex-col gap-3">
                                <button onClick={() => setMapTheme(t => t === 'dark' ? 'light' : 'dark')} className="w-14 h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white hover:text-black transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95">
                                    <i className={`fas ${mapTheme === 'dark' ? 'fa-sun' : 'fa-moon'} text-lg`}></i>
                                </button>
                                <button onClick={handleForceLocationRefresh} className="w-14 h-14 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-white hover:bg-white hover:text-black transition-all flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95">
                                    <i className="fas fa-location-arrow text-lg"></i>
                                </button>
                            </div>

                            {/* Search Here Button (Floating Center Bottom) */}
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                                <button onClick={() => { if (currentMapCenter) fetchData(currentMapCenter.lat, currentMapCenter.lng, currentMapBounds.current || undefined); }} className="px-8 py-4 bg-white text-black font-black text-sm rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 uppercase tracking-wide">
                                    <i className={`fas fa-redo ${isLoading ? 'animate-spin' : ''}`}></i>
                                    Buscar nesta área
                                </button>
                            </div>
                        </>
                    )}

                    {activeTab === 'list' && (
                        <div className="h-full overflow-y-auto p-8 custom-scrollbar">
                            <Suspense fallback={<div>Loading...</div>}>
                                <div className="max-w-5xl mx-auto">
                                    <h2 className="text-3xl font-[1000] italic tracking-tight mb-8">LOCAIS PRÓXIMOS</h2>
                                    <ListView
                                        locations={filteredLocations}
                                        onCheckIn={(loc) => { setSelectedLocation(loc); setIsReviewModalOpen(true); }}
                                        favorites={currentUser.favorites || []}
                                        onToggleFavorite={id => toggleFavorite(id).then(user => user && setCurrentUser(user))}
                                        onOpenDetails={(loc) => { setSelectedLocation(loc); setIsDetailsModalOpen(true); }}
                                        isLoading={isLoading}
                                    />
                                </div>
                            </Suspense>
                        </div>
                    )}

                    {activeTab === 'rank' && (
                        <div className="h-full overflow-y-auto p-8 flex flex-col items-center custom-scrollbar">
                            <Suspense fallback={<div>Loading...</div>}>
                                <Leaderboard />
                            </Suspense>
                        </div>
                    )}
                </div>
            </main>

            {/* MODALS IN SUSPENSE */}
            <Suspense fallback={<div className="fixed inset-0 z-[999] pointer-events-none"></div>}>
                {/* Re-use all modals from MobileLayout */}
                {
                    selectedLocation && (
                        <>
                            {isReviewModalOpen && <ReviewModal location={selectedLocation} currentUser={currentUser} isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); const up = getUserProfile(); if (up) setCurrentUser(up); if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng); }} onLogout={handleLogout} userLocation={userLocation} />}
                            {isDetailsModalOpen && <LocationDetailsModal location={selectedLocation} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} onCheckIn={(loc) => { setSelectedLocation(loc); setIsReviewModalOpen(true); }} onClaim={(loc) => { setSelectedLocation(loc); setIsClaimModalOpen(true); }} onReport={(id, type, name) => { setReportTarget({ id, type, name }); setIsReportModalOpen(true); }} onInvite={(loc) => { setSelectedLocation(loc); setIsInviteModalOpen(true); setIsDetailsModalOpen(false); }} onPostStory={(loc) => { setStoryLocation(loc); setIsStoryCameraOpen(true); }} onShowToast={(title, message, type) => addToast({ title, message, type: type as any })} userLocation={userLocation} />}
                            {isClaimModalOpen && <ClaimBusinessModal location={selectedLocation} currentUser={currentUser} isOpen={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }} />}
                            {isInviteModalOpen && <InviteFriendsModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} currentUser={currentUser} location={selectedLocation} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }} />}
                        </>
                    )
                }
                {isReportModalOpen && reportTarget && <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} targetId={reportTarget.id} targetType={reportTarget.type} targetName={reportTarget.name} currentUser={currentUser} />}
                {isPrivacyModalOpen && <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />}
                {isDataModalOpen && <DataPrivacyModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} currentUser={currentUser} />}
                {isNotificationsModalOpen && <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} currentUser={currentUser} />}
                {isQRScannerOpen && <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleQRScan} />}
                {isAddModalOpen && <AddLocationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng); }} userLat={userLocation?.lat || INITIAL_CENTER.lat} userLng={userLocation?.lng || INITIAL_CENTER.lng} currentUser={currentUser} />}
                {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} currentUser={currentUser} onSave={(u) => { setCurrentUser(u); setIsProfileModalOpen(false); }} onClose={() => setIsProfileModalOpen(false)} onOpenPrivacy={() => setIsPrivacyModalOpen(true)} onOpenData={() => setIsDataModalOpen(true)} onOpenFriends={(tab) => { setFriendsModalTab(tab); setIsProfileModalOpen(false); setIsFriendsModalOpen(true); }} onLogout={handleLogout} onShowToast={(message, type) => addToast({ title: type === 'error' ? 'Erro' : 'Sucesso', message, type: type as any })} />}
                {isFriendsModalOpen && <FriendsModal isOpen={isFriendsModalOpen} onClose={() => { setIsFriendsModalOpen(false); setScannedUser(null); setFriendsModalView('default'); }} currentUser={currentUser} initialTab={friendsModalTab} initialView={friendsModalView} scannedUser={scannedUser} onLogout={handleLogout} onOpenScanner={() => { setIsFriendsModalOpen(false); setTimeout(() => setIsQRScannerOpen(true), 300); }} onShowToast={(title, message, type) => addToast({ title, message, type: type as any })} />}
                {isStoryCameraOpen && storyLocation && <StoryCamera isOpen={isStoryCameraOpen} locationId={storyLocation.id} locationName={storyLocation.name} onClose={() => setIsStoryCameraOpen(false)} onStoryPosted={() => { setIsStoryCameraOpen(false); setStoryLocation(null); addToast({ title: "Story Postado! 📸", message: "Seu story ficará visível por 6 horas.", type: 'success' }); }} />}
            </Suspense>
        </div>
    );
}
