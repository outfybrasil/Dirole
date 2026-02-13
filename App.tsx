import React, { useEffect, useState, useCallback, useMemo, useRef, Suspense } from 'react';

// Lazy Load Heavy Components
const MapView = React.lazy(() => import('./components/MapView').then(module => ({ default: module.MapView })));
const ListView = React.lazy(() => import('./components/ListView').then(module => ({ default: module.ListView })));
const FilterBar = React.lazy(() => import('./components/FilterBar').then(module => ({ default: module.FilterBar })));
const Leaderboard = React.lazy(() => import('./components/Leaderboard').then(module => ({ default: module.Leaderboard })));

// Lazy Load Modals
const ReviewModal = React.lazy(() => import('./components/ReviewModal').then(module => ({ default: module.ReviewModal })));
const AddLocationModal = React.lazy(() => import('./components/AddLocationModal').then(module => ({ default: module.AddLocationModal })));
const ProfileModal = React.lazy(() => import('./components/ProfileModal').then(module => ({ default: module.ProfileModal })));
const LocationDetailsModal = React.lazy(() => import('./components/LocationDetailsModal').then(module => ({ default: module.LocationDetailsModal })));
const ClaimBusinessModal = React.lazy(() => import('./components/ClaimBusinessModal').then(module => ({ default: module.ClaimBusinessModal })));
const ReportModal = React.lazy(() => import('./components/ReportModal').then(module => ({ default: module.ReportModal })));
const InviteFriendsModal = React.lazy(() => import('./components/InviteFriendsModal').then(module => ({ default: module.InviteFriendsModal })));
const FriendsModal = React.lazy(() => import('./components/FriendsModal').then(module => ({ default: module.FriendsModal })));
const NotificationsModal = React.lazy(() => import('./components/NotificationsModal').then(module => ({ default: module.NotificationsModal })));
const QRScannerModal = React.lazy(() => import('./components/QRScannerModal').then(module => ({ default: module.QRScannerModal })));
const PrivacyPolicyModal = React.lazy(() => import('./components/PrivacyPolicyModal').then(module => ({ default: module.PrivacyPolicyModal })));
const DataPrivacyModal = React.lazy(() => import('./components/DataPrivacyModal').then(module => ({ default: module.DataPrivacyModal })));
const StoryCamera = React.lazy(() => import('./components/StoryCamera').then(module => ({ default: module.StoryCamera })));
const OnboardingModal = React.lazy(() => import('./components/OnboardingModal').then(module => ({ default: module.OnboardingModal })));

// Keep lightweight/critical components eager
import { ActivityTicker } from './components/ActivityTicker';
import { Confetti } from './components/Confetti';
import { CookieConsent } from './components/CookieConsent';
import { InAppToast, ToastData } from './components/InAppToast';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { AuthFlow } from './components/AuthFlow';
import UserAvatar from './components/UserAvatar';
import { SearchBar } from './components/SearchBar';

import { Location, Filters, User, MapBounds } from './types';
import { getNearbyRoles, getUserProfile, toggleFavorite, syncUserProfile, triggerHaptic, requestNotificationPermission, sendLocalNotification, searchLocations, getUserById, APPWRITE_DATABASE_ID, getPendingFriendRequests } from './services/mockService';
import { INITIAL_CENTER } from './constants';
import { getCurrentSession, signOut } from './services/authService';

import { useDeepLinks } from './hooks/useDeepLinks';
import { useLocationTracking } from './hooks/useLocationTracking';
import { useAppwriteRealtime } from './hooks/useAppwriteRealtime';

function App() {
  // --- AUTH & SPLASH STATE ---
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

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
  const [showOnboarding, setShowOnboarding] = useState(false);
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('light');
  const [filters, setFilters] = useState<Filters>({
    minVibe: false,
    lowCost: false,
    types: [],
    maxDistance: 3,
    onlyOpen: false
  });

  // --- PULL TO REFRESH STATE ---
  const [pullY, setPullY] = useState(0);
  const startY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const currentMapBounds = useRef<MapBounds | null>(null);
  const REFRESH_THRESHOLD = 80;

  // --- PWA INSTALL STATE ---
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  // --- SHARED HANDLERS ---
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const isRefreshingRef = useRef(isRefreshing);
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
      setPullY(0);
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
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn('Sound failed', e);
    }
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
      try {
        const localProfile = getUserProfile();
        if (localProfile) setCurrentUser(localProfile);

        const session = await getCurrentSession();
        if (session) {
          setIsEmailUnverified(!session.emailVerification);
          if (session.emailVerification === false) setVerificationEmail(session.email);

          const syncedUser = await syncUserProfile(session.userId, {
            email: session.email,
            name: session.name,
          });
          if (syncedUser) setCurrentUser(syncedUser);
        } else {
          setCurrentUser(null);
          localStorage.removeItem('dirole_user_profile');
        }
      } catch (err) {
        // Silently fail auth check if needed
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuth();

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      requestNotificationPermission();
      if (!localStorage.getItem('dirole_onboarding_seen')) setShowOnboarding(true);
    }, 2500);

    const handleOpenAdd = () => { triggerHaptic(); setIsAddModalOpen(true); };
    window.addEventListener('open-add-location', handleOpenAdd);

    const handleInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);

    return () => {
      clearTimeout(splashTimer);
      window.removeEventListener('open-add-location', handleOpenAdd);
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  // --- SEARCH HERE BTN VISIBILITY ---
  const shouldShowSearchHere = useMemo(() => {
    if (!currentMapCenter || !searchOrigin) return false;
    const latDiff = Math.abs(currentMapCenter.lat - searchOrigin.lat);
    const lngDiff = Math.abs(currentMapCenter.lng - searchOrigin.lng);
    // Slightly more sensitive trigger for search here: 0.015 instead of 0.02
    return latDiff > 0.015 || lngDiff > 0.015;
  }, [currentMapCenter, searchOrigin]);

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
    if (filters.minCrowd) res = res.filter(l => l.stats.avgCrowd >= (filters.minCrowd || 0));
    if (filters.maxCrowd) res = res.filter(l => l.stats.avgCrowd <= (filters.maxCrowd || 5));
    if (filters.types.length > 0) res = res.filter(l => filters.types.includes(l.type));
    if (filters.maxDistance) res = res.filter(l => (l.distance || 0) <= filters.maxDistance * 1000);
    return res;
  }, [filters, locations]);

  // --- UI HANDLERS ---
  const handleTextSearch = async (query: string) => {
    if (!query.trim()) {
      if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng);
      return;
    }
    setIsLoading(true);
    triggerHaptic();
    try {
      const lat = currentMapCenter?.lat || userLocation?.lat || INITIAL_CENTER.lat;
      const lng = currentMapCenter?.lng || userLocation?.lng || INITIAL_CENTER.lng;
      const results = await searchLocations(query, lat, lng);
      if (results.length > 0) {
        setLocations(results);
        setMapTarget({ lat: results[0].latitude, lng: results[0].longitude });
        setFilters(prev => ({ ...prev, maxDistance: 30, types: [], minVibe: false, lowCost: false, onlyOpen: false }));
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
    triggerHaptic();
    localStorage.removeItem('dirole_user_profile');
    setCurrentUser(null);
    setLocations([]);
    setHasInitialLoad(false);
    setIsProfileModalOpen(false);
    setIsFriendsModalOpen(false);
    setIsReviewModalOpen(false);
    setIsDetailsModalOpen(false);
    try { await signOut(); } catch (e) { console.warn('Appwrite logout failed', e); }
  }, []);

  const handleQRScan = async (decodedText: string) => {
    setIsQRScannerOpen(false);
    triggerHaptic();
    if (decodedText.startsWith('dirole:')) {
      const friendId = decodedText.split(':')[1];
      if (friendId === currentUser?.id) {
        addToast({ title: "Código Próprio", message: "Você escaneou seu próprio código!", type: 'info' });
        return;
      }
      try {
        const friend = await getUserById(friendId);
        if (friend) {
          setScannedUser(friend);
          setTimeout(() => setIsFriendsModalOpen(true), 200);
        } else {
          addToast({ title: "Ops!", message: "Usuário não encontrado.", type: 'error' });
        }
      } catch (error) {
        addToast({ title: "Erro", message: "Falha ao buscar usuário.", type: 'error' });
      }
    } else if (decodedText.startsWith('http')) {
      addToast({ title: "Link Detectado", message: "Abrir link externo?", type: 'info', actionLabel: "ABRIR", action: () => window.open(decodedText, '_blank') });
    } else {
      addToast({ title: "QR Code Lido", message: decodedText, type: 'info' });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (activeTab !== 'list' && activeTab !== 'map') return;
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTab !== 'list' && activeTab !== 'map') return;
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 0) return;
    if (startY.current === 0) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;
    if (diff > 0 && !isRefreshing) setPullY(Math.min(diff * 0.4, 150));
  };

  const handleTouchEnd = () => {
    if (pullY > REFRESH_THRESHOLD) {
      setIsRefreshing(true);
      setPullY(REFRESH_THRESHOLD);
      triggerHaptic(20);
      handleForceLocationRefresh();
    } else {
      setPullY(0);
    }
    startY.current = 0;
  };

  // --- RENDER ---
  if (showSplash || isAuthChecking || !currentUser || isEmailUnverified) {
    return (
      <AuthFlow
        showSplash={showSplash}
        isAuthChecking={isAuthChecking}
        currentUser={currentUser}
        showLogin={showLogin}
        setShowLogin={setShowLogin}
        isEmailUnverified={isEmailUnverified}
        verificationEmail={verificationEmail}
        setCurrentUser={setCurrentUser}
        toasts={toasts}
        removeToast={removeToast}
      />
    );
  }

  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col bg-[#0f0518] text-white font-sans overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1a0b2e] to-slate-900 z-[-1]"></div>
      {showConfetti && <Confetti />}
      <CookieConsent />
      <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center">
        {toasts.map(toast => <InAppToast key={toast.id} toast={toast} onClose={removeToast} />)}
      </div>

      <header className="bg-[#0f0518]/80 backdrop-blur-xl z-[60] px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-white/5 flex justify-center sticky top-0 shrink-0">
        <div className="w-full max-w-7xl flex justify-between items-center">
          <div className="flex items-center gap-4 group">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden drop-shadow-[0_0_12px_rgba(139,92,246,0.25)] group-hover:scale-105 transition-transform">
              <img src="/og-image.png" className="w-14 h-14 object-contain" alt="Logo" />
            </div>
            <div className="flex flex-col -space-y-1">
              <h1 className="text-4xl font-[1000] italic tracking-tighter text-white leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">DIROLE</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1 h-1 rounded-full bg-dirole-primary animate-pulse"></span>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.4em] leading-none">Social Thermometer</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-white/5 backdrop-blur-md rounded-full border border-white/10 p-1 pr-4 gap-3 hover:bg-white/10 transition-all shadow-xl group cursor-pointer" onClick={() => { triggerHaptic(); setIsProfileModalOpen(true); }}>
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-dirole-primary to-dirole-secondary p-[2px] shadow-lg group-hover:rotate-12 transition-transform">
                  <UserAvatar avatar={currentUser.avatar} size="sm" className="border-none bg-transparent" />
                </div>
                {notificationCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-dirole-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0f0518] shadow-lg animate-bounce z-10">{notificationCount > 9 ? '9+' : notificationCount}</span>}
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black text-white leading-none tracking-tight">{currentUser.nickname || currentUser.name.split(' ')[0]}</span>
                <span className="text-[9px] font-black text-dirole-secondary/80 leading-none mt-1 uppercase tracking-tighter">Nível {currentUser.level}</span>
              </div>
            </div>

            <button onClick={() => { triggerHaptic(); setFriendsModalView('qr'); setFriendsModalTab('my_friends'); setIsFriendsModalOpen(true); }} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-95 transition-all shadow-lg backdrop-blur-md group">
              <i className="fas fa-qrcode text-white/70 group-hover:text-white text-sm transition-colors"></i>
            </button>
          </div>
        </div>
      </header>

      <div ref={scrollContainerRef} className="flex-1 relative w-full h-full min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
        <div className="absolute left-0 right-0 flex justify-center pointer-events-none z-[60]" style={{ top: -60, transform: `translateY(${pullY}px)`, transition: isRefreshing ? 'transform 0.2s ease-out' : 'transform 0s' }}>
          <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-white/10 flex items-center justify-center w-10 h-10"><i className={`fas fa-sync-alt text-dirole-primary ${isRefreshing || pullY > REFRESH_THRESHOLD ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }}></i></div>
        </div>

        {isLoading && !isRefreshing && (
          <div className={`absolute inset-0 z-[500] flex flex-col items-center justify-center ${locations.length === 0 ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/20'}`}>
            <i className="fas fa-satellite-dish text-4xl text-dirole-primary animate-pulse mb-4"></i>
            <p className="text-white font-bold animate-pulse">{locations.length === 0 ? 'Buscando rolês...' : 'Atualizando...'}</p>
          </div>
        )}

        {(activeTab === 'map' || activeTab === 'list') && (
          <div className={`flex-1 flex flex-col md:flex-row h-full overflow-hidden relative ${activeTab === 'list' ? 'hidden md:flex' : 'flex'}`}>
            {/* MOBILE DRAWER BACKDROP */}
            {activeTab === 'map' && showFilters && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[250] md:hidden animate-fade-in"
                onClick={() => setShowFilters(false)}
              ></div>
            )}

            {/* SEARCH OVERLAY (MOBILE ONLY) */}
            <div className="absolute top-4 left-0 right-0 z-[400] pointer-events-none px-4 md:hidden">
              <SearchBar onSearch={handleTextSearch} className="pointer-events-auto" />
            </div>

            {/* MOBILE BOTTOM DRAWER (Only on Map Tab) */}
            {activeTab === 'map' && (
              <div className={`
                z-[300] transition-all duration-500 ease-in-out
                md:hidden
                ${showFilters
                  ? 'translate-y-0 opacity-100'
                  : 'translate-y-full opacity-0'
                }
                fixed bottom-0 left-0 right-0
                bg-[#0f0518]/95 backdrop-blur-2xl rounded-t-[2.5rem]
                shadow-[0_-20px_60px_rgba(0,0,0,0.8)]
                border-t border-white/10
              `}>
                {/* Drawer Grabber */}
                <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mt-4 mb-2 md:hidden"></div>

                <div className="flex-1 overflow-y-auto sidebar-scroll">
                  <Suspense fallback={<div className="p-4 text-center text-slate-500">Loading Filters...</div>}>
                    <FilterBar filters={filters} onChange={setFilters} onSearch={handleTextSearch} onClose={() => setShowFilters(false)} />
                  </Suspense>
                </div>
              </div>
            )}

            {/* DESKTOP SIDEBAR */}
            <div className={`hidden md:flex flex-col border-r border-white/5 bg-[#0f0518]/90 backdrop-blur-3xl transition-all duration-500 ease-in-out relative ${isSidebarCollapsed ? 'w-0 opacity-0 -translate-x-full' : 'w-[450px] opacity-100 translate-x-0'}`}>
              <div className="absolute top-1/2 -right-4 translate-y-[-50%] z-[300]">
                <button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="w-8 h-12 bg-dirole-primary/90 text-white rounded-r-xl flex items-center justify-center shadow-2xl hover:bg-dirole-primary transition-colors active:scale-95"
                >
                  <i className={`fas fa-chevron-${isSidebarCollapsed ? 'right' : 'left'} text-[10px]`}></i>
                </button>
              </div>

              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <div className="p-6 shrink-0">
                  <SearchBar onSearch={handleTextSearch} />
                </div>

                <div className="flex-1 overflow-y-auto sidebar-scroll">
                  <FilterBar
                    filters={filters}
                    onChange={setFilters}
                    onSearch={handleTextSearch}
                    onClose={() => setShowFilters(false)}
                  />
                  <div className="h-px bg-white/5 mx-6 my-4"></div>
                  <Suspense fallback={<div className="p-4 text-center"><i className="fas fa-spinner animate-spin"></i></div>}>
                    <ListView
                      locations={filteredLocations}
                      onCheckIn={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsReviewModalOpen(true); }}
                      favorites={currentUser?.favorites || []}
                      onToggleFavorite={id => toggleFavorite(id).then(user => user && setCurrentUser(user))}
                      onOpenDetails={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsDetailsModalOpen(true); }}
                      isLoading={locations.length === 0 && isLoading}
                      isSidebar={true}
                    />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* EXPANDED MAP TOGGLE (Visible when sidebar collapsed) */}
            {isSidebarCollapsed && (
              <button
                onClick={() => setIsSidebarCollapsed(false)}
                className="hidden md:flex absolute top-4 left-4 z-[400] w-12 h-12 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl items-center justify-center text-white hover:bg-white/20 transition-all shadow-2xl group animate-fade-in"
              >
                <i className="fas fa-bars text-sm group-hover:rotate-90 transition-transform"></i>
              </button>
            )}

            {/* MAIN CONTENT AREA (MAP BY DEFAULT OR LIST ON MOBILE) */}
            <div className={`flex-1 relative h-full min-h-0 ${activeTab === 'list' ? 'md:block hidden' : 'block'}`}>
              <Suspense fallback={<div className="flex items-center justify-center h-full"><i className="fas fa-circle-notch animate-spin text-dirole-primary text-2xl"></i></div>}>
                <MapView
                  locations={filteredLocations}
                  userLocation={userLocation}
                  userAccuracy={userAccuracy}
                  mapCenter={mapTarget}
                  onOpenDetails={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsDetailsModalOpen(true); }}
                  onRegionChange={handleRegionChange}
                  searchRadius={filters.maxDistance}
                  searchOrigin={searchOrigin}
                  theme={mapTheme}
                />
              </Suspense>
              <button onClick={() => setMapTheme(mapTheme === 'dark' ? 'light' : 'dark')} className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all transform active:scale-95 border border-white/20 ${mapTheme === 'dark' ? 'bg-black/80 text-white backdrop-blur-md' : 'bg-white/90 text-slate-900 backdrop-blur-md'}`}>
                <i className={`fas ${mapTheme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
              </button>
            </div>
          </div>
        )}

        {/* MOBILE ONLY LIST TAB */}
        {activeTab === 'list' && (
          <div className="flex-1 flex flex-col md:hidden">
            <div className="px-4 py-4">
              <SearchBar onSearch={handleTextSearch} />
            </div>
            <div className="flex-1 overflow-y-auto pb-safe">
              <Suspense fallback={<div className="p-4 text-center"><i className="fas fa-spinner animate-spin"></i></div>}>
                <ListView
                  locations={filteredLocations}
                  onCheckIn={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsReviewModalOpen(true); }}
                  favorites={currentUser.favorites || []}
                  onToggleFavorite={id => toggleFavorite(id).then(user => user && setCurrentUser(user))}
                  onOpenDetails={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsDetailsModalOpen(true); }}
                  isLoading={locations.length === 0 && isLoading}
                />
              </Suspense>
            </div>
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="w-full min-h-full max-w-3xl mx-auto">
            <Suspense fallback={<div className="p-10 text-center text-white"><i className="fas fa-trophy animate-bounce text-yellow-500 text-3xl mb-4"></i><p>Carregando ranking...</p></div>}>
              <Leaderboard />
            </Suspense>
          </div>
        )}
      </div>

      {activeTab === 'map' && shouldShowSearchHere && !isRefreshing && (
        <div className="fixed bottom-24 left-6 z-[50] pointer-events-none animate-slide-up">
          <button onClick={() => { triggerHaptic(); if (currentMapCenter) fetchData(currentMapCenter.lat, currentMapCenter.lng, currentMapBounds.current || undefined); }} disabled={isLoading} className={`w-14 h-14 rounded-full bg-[#0f0518]/90 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all pointer-events-auto group ${isLoading ? 'opacity-50' : 'hover:bg-slate-900'}`}>
            <i className={`fas fa-redo text-base group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      )}

      <div className="fixed bottom-24 right-4 z-[50] pointer-events-none flex flex-col gap-4 items-end">
        {activeTab === 'map' && (
          <>
            <button onClick={() => { triggerHaptic(); setIsAddModalOpen(true); }} className="w-12 h-12 rounded-2xl bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-xl shadow-purple-900/40 active:scale-90 transition-all border border-white/20 flex items-center justify-center pointer-events-auto"><i className="fas fa-plus text-xl"></i></button>
            <button onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }} className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all border border-white/10 pointer-events-auto ${showFilters ? 'bg-white text-dirole-primary shadow-white/20' : 'bg-[#0f0518]/90 backdrop-blur-xl text-white hover:bg-slate-900'}`}><i className={`fas ${showFilters ? 'fa-times' : 'fa-sliders-h'}`}></i></button>
            <button onClick={handleForceLocationRefresh} className="w-12 h-12 rounded-2xl bg-[#0f0518]/90 backdrop-blur-xl text-white shadow-lg flex items-center justify-center border border-white/10 pointer-events-auto"><i className="fas fa-location-arrow text-sm"></i></button>
          </>
        )}
        {activeTab === 'list' && <button onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }} className={`w-14 h-14 rounded-2xl shadow-xl active:scale-90 transition-all pointer-events-auto flex items-center justify-center ${showFilters ? 'bg-slate-800 text-white' : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white'}`}><i className={`fas ${showFilters ? 'fa-times' : 'fa-sliders-h'} text-xl`}></i></button>}
      </div>

      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-[#0f0518]/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          {['map', 'list', 'rank'].map((tab: any) => (
            <button key={tab} onClick={() => { triggerHaptic(); setActiveTab(tab); }} className={`flex flex-col items-center justify-center space-y-1 transition-all py-1 ${activeTab === tab ? 'text-dirole-primary' : 'text-slate-500 hover:text-slate-300'}`}>
              <div className={`p-1.5 rounded-xl transition-all ${activeTab === tab ? 'bg-dirole-primary/10 scale-110' : ''}`}><i className={`nav-icon fas ${tab === 'map' ? 'fa-map-marked-alt' : tab === 'list' ? 'fa-th-list' : 'fa-trophy'} text-lg`}></i></div>
              <span className="nav-label text-[10px] font-black uppercase tracking-wider">{tab === 'map' ? 'MAPA' : tab === 'list' ? 'LISTA' : 'RANK'}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* MODALS */}
      {/* MODALS WRAPPED IN SUSPENSE */}
      <Suspense fallback={<div className="fixed inset-0 z-[999] pointer-events-none"></div>}>
        {
          selectedLocation && (
            <>
              {isReviewModalOpen && <ReviewModal location={selectedLocation} currentUser={currentUser} isOpen={isReviewModalOpen} onClose={() => setIsReviewModalOpen(false)} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 4000); const up = getUserProfile(); if (up) setCurrentUser(up); if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng); }} onLogout={handleLogout} userLocation={userLocation} />}
              {isDetailsModalOpen && <LocationDetailsModal location={selectedLocation} isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} onCheckIn={(loc) => { triggerHaptic(); setSelectedLocation(loc); setIsReviewModalOpen(true); }} onClaim={(loc) => { setSelectedLocation(loc); setIsClaimModalOpen(true); }} onReport={(id, type, name) => { setReportTarget({ id, type, name }); setIsReportModalOpen(true); }} onInvite={(loc) => { setSelectedLocation(loc); setIsInviteModalOpen(true); setIsDetailsModalOpen(false); }} onPostStory={(loc) => { triggerHaptic(); setStoryLocation(loc); setIsStoryCameraOpen(true); }} onShowToast={(title, message, type) => addToast({ title, message, type: type as any })} userLocation={userLocation} />}
              {isClaimModalOpen && <ClaimBusinessModal location={selectedLocation} currentUser={currentUser} isOpen={isClaimModalOpen} onClose={() => setIsClaimModalOpen(false)} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); const center = currentMapCenter || userLocation || INITIAL_CENTER; fetchData(center.lat, center.lng); }} />}
              {isInviteModalOpen && <InviteFriendsModal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} currentUser={currentUser} location={selectedLocation} onSuccess={() => { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 3000); }} />}
            </>
          )
        }

        {isReportModalOpen && reportTarget && <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} targetId={reportTarget.id} targetType={reportTarget.type} targetName={reportTarget.name} currentUser={currentUser} />}
        {isPrivacyModalOpen && <PrivacyPolicyModal isOpen={isPrivacyModalOpen} onClose={() => setIsPrivacyModalOpen(false)} />}
        {isDataModalOpen && <DataPrivacyModal isOpen={isDataModalOpen} onClose={() => setIsDataModalOpen(false)} currentUser={currentUser} />}
        {isNotificationsModalOpen && <NotificationsModal isOpen={isNotificationsModalOpen} onClose={() => setIsNotificationsModalOpen(false)} currentUser={currentUser} />}
        {isQRScannerOpen && <QRScannerModal isOpen={isQRScannerOpen} onClose={() => setIsQRScannerOpen(false)} onScan={handleQRScan} />}
        {showOnboarding && <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} />}

        {isAddModalOpen && <AddLocationModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSuccess={() => { if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng); }} userLat={userLocation?.lat || INITIAL_CENTER.lat} userLng={userLocation?.lng || INITIAL_CENTER.lng} currentUser={currentUser} />}

        {isProfileModalOpen && <ProfileModal isOpen={isProfileModalOpen} currentUser={currentUser} onSave={(u) => { setCurrentUser(u); setIsProfileModalOpen(false); }} onClose={() => setIsProfileModalOpen(false)} onOpenPrivacy={() => setIsPrivacyModalOpen(true)} onOpenData={() => setIsDataModalOpen(true)} onOpenFriends={(tab) => { triggerHaptic(); setFriendsModalTab(tab); setIsProfileModalOpen(false); setIsFriendsModalOpen(true); }} onLogout={handleLogout} onShowToast={(message, type) => addToast({ title: type === 'error' ? 'Erro' : 'Sucesso', message, type: type as any })} />}

        {isFriendsModalOpen && <FriendsModal isOpen={isFriendsModalOpen} onClose={() => { setIsFriendsModalOpen(false); setScannedUser(null); setFriendsModalView('default'); }} currentUser={currentUser} initialTab={friendsModalTab} initialView={friendsModalView} scannedUser={scannedUser} onLogout={handleLogout} onOpenScanner={() => { setIsFriendsModalOpen(false); setTimeout(() => setIsQRScannerOpen(true), 300); }} onShowToast={(title, message, type) => addToast({ title, message, type: type as any })} />}

        {isStoryCameraOpen && storyLocation && <StoryCamera isOpen={isStoryCameraOpen} locationId={storyLocation.id} locationName={storyLocation.name} onClose={() => setIsStoryCameraOpen(false)} onStoryPosted={() => { setIsStoryCameraOpen(false); setStoryLocation(null); addToast({ title: "Story Postado! 📸", message: "Seu story ficará visível por 6 horas.", type: 'success' }); }} />}
      </Suspense>
    </div >
  );
}

export default App;