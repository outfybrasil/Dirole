import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { MapView } from './components/MapView';
import { ListView } from './components/ListView';
import { FilterBar } from './components/FilterBar';
import { Leaderboard } from './components/Leaderboard';
import { ReviewModal } from './components/ReviewModal';
import { AddLocationModal } from './components/AddLocationModal';
import { ProfileModal } from './components/ProfileModal';
import { LoginScreen } from './components/LoginScreen';
import { ActivityTicker } from './components/ActivityTicker';
import { LocationDetailsModal } from './components/LocationDetailsModal';
import { ClaimBusinessModal } from './components/ClaimBusinessModal';
import { ReportModal } from './components/ReportModal';
import { InviteFriendsModal } from './components/InviteFriendsModal';
import { FriendsModal } from './components/FriendsModal';
import { Confetti } from './components/Confetti';
import { getNearbyRoles, getUserProfile, toggleFavorite, syncUserProfile, triggerHaptic, requestNotificationPermission, sendLocalNotification, searchLocations } from './services/mockService';
import { Location, Filters, User } from './types';
import { INITIAL_CENTER } from './constants';
import { supabase, signOut } from './services/supabaseClient';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { Geolocation } from '@capacitor/geolocation';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  
  // User State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App State (Only rendered if currentUser exists)
  const [activeTab, setActiveTab] = useState<'map' | 'list' | 'rank'>('map');
  const [locations, setLocations] = useState<Location[]>([]);
  
  // LOCATION STATES
  // 1. Onde o usuário REALMENTE está (GPS / Ponto Azul)
  const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [userAccuracy, setUserAccuracy] = useState<number>(0); // Raio de precisão em metros
  
  // 2. Onde a câmera do mapa deve focar (Centro do Mapa)
  const [mapTarget, setMapTarget] = useState<{ lat: number, lng: number } | null>(null);

  // 3. Onde o usuário está olhando manualmente (ao arrastar o mapa)
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number, lng: number } | null>(null);
  
  // 4. Origem da busca (para a API)
  const [searchOrigin, setSearchOrigin] = useState<{ lat: number, lng: number } | null>(null); 

  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  
  // Modals
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsModalTab, setFriendsModalTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');

  const [reportTarget, setReportTarget] = useState<{id: string, type: 'location'|'review'|'photo'|'user', name?: string} | null>(null);
  
  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  // PULL TO REFRESH STATE
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const REFRESH_THRESHOLD = 80;

  // Initial Filters - Default 1km
  const [filters, setFilters] = useState<Filters>({
    minVibe: false,
    lowCost: false,
    types: [],
    maxDistance: 1,
    onlyOpen: false // Initialize new filter
  });

  // Calculate if we should show the "Search Here" button
  const shouldShowSearchHere = useMemo(() => {
    if (!currentMapCenter || !searchOrigin) return false;
    // Calculate distance between current center and last search origin
    // Approx calc for UI toggle
    const latDiff = Math.abs(currentMapCenter.lat - searchOrigin.lat);
    const lngDiff = Math.abs(currentMapCenter.lng - searchOrigin.lng);
    // Rough estimate: > 0.02 degrees is approx > 2km
    return latDiff > 0.02 || lngDiff > 0.02;
  }, [currentMapCenter, searchOrigin]);

  // Splash Screen Timer
  useEffect(() => {
    const timer = setTimeout(() => {
        setShowSplash(false);
        requestNotificationPermission();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Check Supabase Session & Load Local Profile
  useEffect(() => {
    // 1. Check Local Storage
    const localProfile = getUserProfile();
    if (localProfile) {
      setCurrentUser(localProfile);
    }

    // 2. Auth Listener (Supabase)
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
            const { user } = session;
            
            // Sync with Supabase 'profiles' table using metadata from signup
            const syncedUser = await syncUserProfile(user.id, {
                full_name: user.user_metadata.full_name,
                nickname: user.user_metadata.nickname,
                email: user.email,
                age: user.user_metadata.age,
                gender: user.user_metadata.gender,
                avatar_url: user.user_metadata.avatar_url
            });
            
            if (syncedUser) {
                setCurrentUser(syncedUser);
                requestNotificationPermission(); // Ask again on login
            }
        } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
            localStorage.removeItem('dirole_user_profile');
            setLocations([]);
        }
    });

    return () => {
        authListener.subscription.unsubscribe();
    };
  }, []);

  // --- REALTIME NOTIFICATIONS (INVITES & FRIENDS) ---
  useEffect(() => {
      if (!currentUser) return;

      const channel = supabase.channel('realtime:social')
          // Listener 1: Invites
          .on(
              'postgres_changes', 
              { event: 'INSERT', schema: 'public', table: 'invites', filter: `to_user_id=eq.${currentUser.id}` }, 
              (payload) => {
                  const invite = payload.new;
                  triggerHaptic([100, 50, 100]);
                  sendLocalNotification(
                      "📩 Novo Convite de Rolê!", 
                      invite.message || `Você foi convidado para ir ao ${invite.location_name}`
                  );
              }
          )
          // Listener 2: Friend Requests (INSERT into friendships where receiver is current user)
          .on(
              'postgres_changes',
              { event: 'INSERT', schema: 'public', table: 'friendships', filter: `receiver_id=eq.${currentUser.id}` },
              (payload) => {
                   triggerHaptic([50, 50]);
                   sendLocalNotification(
                       "👥 Nova Solicitação de Amizade",
                       "Alguém quer se conectar com você no Dirole!"
                   );
              }
          )
          // Listener 3: Friend Request Accepted (UPDATE where status='accepted')
          .on(
              'postgres_changes',
              { event: 'UPDATE', schema: 'public', table: 'friendships', filter: `requester_id=eq.${currentUser.id}` },
              (payload) => {
                   if (payload.new.status === 'accepted') {
                       triggerHaptic(50);
                       sendLocalNotification(
                           "🤝 Pedido Aceito!",
                           "Você tem um novo amigo para curtir os rolês."
                       );
                   }
              }
          )
          .subscribe();

      return () => {
          supabase.removeChannel(channel);
      };
  }, [currentUser]);

  const fetchData = async (lat: number, lng: number) => {
    if (!isRefreshing) setIsLoading(true);
    
    setSearchOrigin({ lat, lng });
    
    const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setIsRefreshing(false);
        setPullY(0);
    }, 10000);

    try {
      const data = await getNearbyRoles(lat, lng);
      setLocations(data);
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
      setIsRefreshing(false);
      setPullY(0);
    }
  };

  const handleTextSearch = async (query: string) => {
      if (!query.trim()) {
          // Reset to nearby if cleared
          if (searchOrigin) fetchData(searchOrigin.lat, searchOrigin.lng);
          return;
      }
      
      setIsLoading(true);
      triggerHaptic();
      try {
          // Use current map center or user location for search bias
          const lat = currentMapCenter?.lat || userLocation?.lat || INITIAL_CENTER.lat;
          const lng = currentMapCenter?.lng || userLocation?.lng || INITIAL_CENTER.lng;
          
          const results = await searchLocations(query, lat, lng);
          
          if (results.length > 0) {
              setLocations(results);
              // Center map on the first result
              const firstResult = results[0];
              setMapTarget({ lat: firstResult.latitude, lng: firstResult.longitude });
              setCurrentMapCenter({ lat: firstResult.latitude, lng: firstResult.longitude });
              
              // CRITICAL FIX: Reset restrictive filters so the result actually shows up!
              setFilters(prev => ({ 
                  ...prev, 
                  maxDistance: 30,
                  types: [],     // Clear type filters (e.g. if user was filtering only 'Balada')
                  minVibe: false, // Clear vibe filters
                  lowCost: false,  // Clear cost filters
                  onlyOpen: false
              }));
          } else {
              alert("Nenhum local encontrado com esse nome.");
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  // --- GPS TRACKING ENGINE ---
  useEffect(() => {
    if (!currentUser) return;

    let watchId: number;
    
    const geoOptions = {
        enableHighAccuracy: true, // IMPORTANT: Force GPS over IP/Wifi
        maximumAge: 0, // No cache, force fresh reading
        timeout: 20000 // Increase timeout for better lock
    };

    const handleSuccess = (position: GeolocationPosition) => {
        const newLoc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        setUserAccuracy(position.coords.accuracy);
        
        // 1. Update Blue Dot
        setUserLocation(newLoc);

        // 2. Only center map and fetch data automatically ONCE on load
        if (!hasInitialLoad) {
            setMapTarget(newLoc);
            setCurrentMapCenter(newLoc);
            setSearchOrigin(newLoc);
            fetchData(newLoc.lat, newLoc.lng);
            setHasInitialLoad(true);
        }
    };

    const handleError = (error: GeolocationPositionError) => {
        console.warn("Geo error:", error);
        // Fallback if GPS fails completely on first load
        if (!hasInitialLoad) {
            setMapTarget(INITIAL_CENTER);
            setCurrentMapCenter(INITIAL_CENTER);
            fetchData(INITIAL_CENTER.lat, INITIAL_CENTER.lng);
            setHasInitialLoad(true);
        }
    };

    if (navigator.geolocation) {
        // Start watching position changes
        watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
    } else {
        handleError({ code: 0, message: "Geolocation not supported" } as any);
    }

    return () => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [currentUser, hasInitialLoad]); 

  // --- FORCE LOCATION REFRESH (CAPACITOR + WEB FALLBACK) ---
  const handleForceLocationRefresh = useCallback(async () => {
      triggerHaptic();
      
      // If triggered by pull-to-refresh, we manage loading state differently
      if (!isRefreshing) setIsLoading(true);

      const updateWithCoordinates = (coords: { latitude: number, longitude: number, accuracy: number }) => {
          const newLoc = {
              lat: coords.latitude,
              lng: coords.longitude
          };
          setUserLocation(newLoc);
          setUserAccuracy(coords.accuracy);
          
          if (!isRefreshing) {
            setMapTarget(newLoc);
            setCurrentMapCenter(newLoc);
          }
          setSearchOrigin(newLoc);
          fetchData(newLoc.lat, newLoc.lng);
      };

      const handleWebFallback = () => {
          if (!navigator.geolocation) {
              alert("Geolocalização não suportada.");
              setIsLoading(false);
              setIsRefreshing(false);
              setPullY(0);
              return;
          }

          navigator.geolocation.getCurrentPosition(
              (pos) => updateWithCoordinates(pos.coords),
              (err) => {
                  console.warn("Web Geo Error:", err);
                  
                  let msg = "Erro desconhecido de localização.";
                  if (err.code === 1) msg = "Permissão de localização negada. Verifique as configurações.";
                  else if (err.code === 2) msg = "Sinal de GPS indisponível ou fraco.";
                  else if (err.code === 3) msg = "O GPS demorou muito para responder.";
                  
                  alert(`Não foi possível atualizar: ${msg}`);
                  
                  setIsLoading(false);
                  setIsRefreshing(false);
                  setPullY(0);
              },
              { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 }
          );
      };

      // Tenta usar Capacitor Geolocation
      try {
          const coordinates = await Geolocation.getCurrentPosition({
              enableHighAccuracy: true,
              timeout: 20000
          });
          console.log('Localização atual (Capacitor):', coordinates);
          updateWithCoordinates(coordinates.coords);
      } catch (e) {
          console.warn('Capacitor Geolocation falhou, tentando Web API...', e);
          handleWebFallback();
      }
  }, [isRefreshing]);

  // --- PULL TO REFRESH LOGIC ---
  const handleTouchStart = (e: React.TouchEvent) => {
    // Only allow pull to refresh on map or list tabs
    if (activeTab !== 'list' && activeTab !== 'map') return;
    
    // Check if list is scrolled to top
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 0) return;
    
    startY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (activeTab !== 'list' && activeTab !== 'map') return;
    if (scrollContainerRef.current && scrollContainerRef.current.scrollTop > 0) return;
    if (startY.current === 0) return;

    const currentY = e.touches[0].clientY;
    const diff = currentY - startY.current;

    if (diff > 0 && !isRefreshing) {
        // Add resistance
        setPullY(Math.min(diff * 0.4, 150));
    }
  };

  const handleTouchEnd = () => {
    if (activeTab !== 'list' && activeTab !== 'map') return;
    
    if (pullY > REFRESH_THRESHOLD) {
        setIsRefreshing(true);
        setPullY(REFRESH_THRESHOLD); // Snap to threshold
        triggerHaptic(20);
        handleForceLocationRefresh();
    } else {
        setPullY(0);
    }
    startY.current = 0;
  };

  const handleRegionChange = useCallback((center: { lat: number; lng: number }) => {
     setCurrentMapCenter(center);
  }, []);

  const handleSearchHere = useCallback(() => {
      triggerHaptic();
      if (currentMapCenter) {
          fetchData(currentMapCenter.lat, currentMapCenter.lng);
      }
  }, [currentMapCenter, isLoading]);

  const filteredLocations = useMemo(() => {
    let res = locations;
    if (filters.minVibe) {
      res = res.filter(l => l.stats.avgVibe > 2.3);
    }
    if (filters.lowCost) {
      res = res.filter(l => l.stats.avgPrice < 1.7);
    }
    if (filters.onlyOpen) {
      res = res.filter(l => l.isOpen);
    }
    if (filters.types.length > 0) {
      res = res.filter(l => filters.types.includes(l.type));
    }
    // Only apply max distance if NOT a specific text search (which can be far away)
    // We assume if locations list is small and precise (from text search), we ignore distance
    if (filters.maxDistance) {
        res = res.filter(l => (l.distance || 0) <= filters.maxDistance * 1000);
    }
    return res;
  }, [filters, locations]);

  // SAFE LOGOUT HANDLER - No reload
  const handleLogout = useCallback(async () => {
    triggerHaptic();
    localStorage.removeItem('dirole_user_profile');
    setCurrentUser(null);
    setLocations([]);
    setHasInitialLoad(false);
    // Close all modals
    setIsProfileModalOpen(false);
    setIsFriendsModalOpen(false);
    setIsReviewModalOpen(false);
    setIsDetailsModalOpen(false);
    
    try {
        await signOut();
    } catch (e) {
        console.warn('Erro ao deslogar do Supabase, mas estado local limpo', e);
    }
  }, []);

  const handleCheckIn = useCallback((loc: Location) => {
    triggerHaptic();
    setSelectedLocation(loc);
    setIsReviewModalOpen(true);
  }, []);

  const handleOpenDetails = useCallback((loc: Location) => {
    triggerHaptic();
    setSelectedLocation(loc);
    setIsDetailsModalOpen(true);
  }, []);
  
  const handleOpenClaim = useCallback((loc: Location) => {
      setSelectedLocation(loc);
      setIsClaimModalOpen(true);
  }, []);

  const handleOpenReport = useCallback((id: string, type: 'location'|'review'|'photo'|'user', name?: string) => {
      setReportTarget({ id, type, name });
      setIsReportModalOpen(true);
  }, []);
  
  const handleOpenInvite = useCallback((loc: Location) => {
      setSelectedLocation(loc);
      setIsInviteModalOpen(true);
      setIsDetailsModalOpen(false);
  }, []);

  const handleOpenFriends = useCallback((tab: 'my_friends' | 'requests' | 'search') => {
      triggerHaptic();
      setFriendsModalTab(tab);
      setIsProfileModalOpen(false); 
      setIsFriendsModalOpen(true);
  }, []);

  const handleReviewSuccess = (points: number) => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 4000);

    const updated = getUserProfile();
    if (updated) setCurrentUser(updated);
    
    if (searchOrigin) {
        fetchData(searchOrigin.lat, searchOrigin.lng);
    }
  };

  const handleAddLocationSuccess = () => {
    if (searchOrigin) {
        fetchData(searchOrigin.lat, searchOrigin.lng);
    }
  };

  const handleProfileSave = (user: User) => {
    setCurrentUser(user);
    setIsProfileModalOpen(false);
  };

  const handleToggleFavorite = useCallback(async (id: string) => {
    const updatedUser = await toggleFavorite(id);
    if (updatedUser) setCurrentUser(updatedUser);
  }, []);

  const switchTab = (tab: 'map' | 'list' | 'rank') => {
      triggerHaptic();
      setActiveTab(tab);
  }

  // --- 1. SPLASH SCREEN ---
  if (showSplash) {
      return (
          <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f0518] flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
              <div className="z-10 text-center animate-fade-in">
                  <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 mb-4 animate-pulse-slow drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] pr-2">
                      DIROLE
                  </h1>
                  <p className="text-slate-400 font-medium tracking-widest text-sm uppercase">O Termômetro do Rolê</p>
                  <div className="mt-8 flex justify-center">
                      <div className="w-8 h-8 border-4 border-dirole-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
              </div>
          </div>
      );
  }

  // --- 2. LOGIN SCREEN (If not authenticated) ---
  if (!currentUser) {
      return <LoginScreen onLoginSuccess={setCurrentUser} />;
  }

  // --- 3. MAIN APP (Only rendered after login) ---
  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col bg-[#0f0518] text-white font-sans overflow-hidden">
      
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1a0b2e] to-slate-900 z-[-1]"></div>
      
      {showConfetti && <Confetti />}

      {/* HEADER */}
      <div className="bg-white/5 backdrop-blur-md z-20 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex justify-between items-center border-b border-white/5 relative shadow-lg shrink-0">
        <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 drop-shadow-sm pr-2 py-1 leading-normal">
          DIROLE
        </h1>
        
        <button 
          onClick={() => { triggerHaptic(); setIsProfileModalOpen(true); }}
          className="flex items-center space-x-2 bg-black/20 pl-3 pr-1 py-1 rounded-full border border-white/5 active:scale-95 transition-transform"
        >
          <div className="flex flex-col items-end mr-1">
            <span className="text-xs font-bold text-slate-400 leading-none max-w-[80px] truncate">
                {currentUser.nickname || currentUser.name.split(' ')[0]}
            </span>
            <span className="text-[10px] font-bold text-yellow-400 leading-none">LVL {currentUser.level}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-dirole-primary to-dirole-secondary flex items-center justify-center shadow-lg text-lg overflow-hidden border-2 border-white/10">
             {currentUser.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt="Avatar" className="w-full h-full object-cover" />
             ) : (
                currentUser.avatar
             )}
          </div>
        </button>
      </div>

      {/* MAIN CONTENT AREA WITH PULL TO REFRESH */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 relative w-full h-full min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        
        {/* PULL INDICATOR */}
        <div 
            className="absolute left-0 right-0 flex justify-center pointer-events-none z-[60]"
            style={{ 
                top: -60, // Start hidden above
                transform: `translateY(${pullY}px)`,
                transition: isRefreshing ? 'transform 0.2s ease-out' : 'transform 0s' 
            }}
        >
            <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-white/10 flex items-center justify-center w-10 h-10">
                <i className={`fas fa-sync-alt text-dirole-primary ${isRefreshing || pullY > REFRESH_THRESHOLD ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }}></i>
            </div>
        </div>

        {isLoading && !isRefreshing && (
            <div className={`absolute inset-0 z-[500] flex flex-col items-center justify-center ${locations.length === 0 ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/20'}`}>
                {locations.length === 0 ? (
                    <>
                        <i className="fas fa-satellite-dish text-4xl text-dirole-primary animate-pulse mb-4"></i>
                        <p className="text-white font-bold animate-pulse">Buscando rolês...</p>
                        <p className="text-xs text-slate-400 mt-2">Consultando satélites</p>
                    </>
                ) : (
                    <div className="bg-black/80 p-4 rounded-2xl flex items-center gap-3 backdrop-blur-md border border-white/10 shadow-xl">
                        <div className="w-5 h-5 border-2 border-dirole-primary border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-sm font-bold text-white">Atualizando...</span>
                    </div>
                )}
            </div>
        )}

        {activeTab === 'map' && (
          <div className="w-full h-full relative">
            <ActivityTicker />
            
            {showFilters && (
               <div className="absolute top-0 left-0 right-0 z-[40] animate-fade-in shadow-xl">
                  <FilterBar 
                     filters={filters} 
                     onChange={setFilters} 
                     onSearch={handleTextSearch} 
                     onClose={() => setShowFilters(false)}
                  />
               </div>
            )}
            <MapView 
              locations={filteredLocations} 
              userLocation={userLocation} 
              userAccuracy={userAccuracy}
              mapCenter={mapTarget}
              onOpenDetails={handleOpenDetails}
              onRegionChange={handleRegionChange}
              searchRadius={filters.maxDistance}
              searchOrigin={searchOrigin}
            />
          </div>
        )}
        
        {activeTab === 'list' && (
          <div className="w-full min-h-full max-w-7xl mx-auto">
            {showFilters && (
                <div className="animate-fade-in sticky top-0 z-40">
                    <FilterBar 
                        filters={filters} 
                        onChange={setFilters} 
                        onSearch={handleTextSearch}
                        onClose={() => setShowFilters(false)}
                    />
                </div>
            )}
            <ListView 
              locations={filteredLocations} 
              onCheckIn={handleCheckIn}
              onOpenDetails={handleOpenDetails}
              favorites={currentUser.favorites || []}
              onToggleFavorite={handleToggleFavorite}
            />
          </div>
        )}

        {activeTab === 'rank' && (
          <div className="w-full min-h-full max-w-3xl mx-auto">
             <Leaderboard />
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTONS */}
      <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] right-4 z-[50] flex flex-col gap-4 items-end pointer-events-none">
        <div className="pointer-events-auto flex flex-col gap-4 items-end">
        {activeTab === 'map' && (
          <button
            onClick={() => { triggerHaptic(); setIsAddModalOpen(true); }}
            className="group flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-lg shadow-purple-500/40 active:scale-90 transition-all hover:scale-105 border border-white/20"
            title="Adicionar Novo Local"
          >
            <i className="fas fa-plus text-xl group-hover:rotate-90 transition-transform duration-300"></i>
          </button>
        )}

        {activeTab === 'list' && (
          <button
            onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }}
            className={`group flex items-center justify-center w-14 h-14 rounded-full text-white shadow-lg active:scale-90 transition-all hover:scale-105 ${
                showFilters 
                ? 'bg-gradient-to-r from-slate-700 to-slate-600 shadow-slate-900/40 border border-white/10' 
                : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary shadow-purple-500/40'
            }`}
          >
            <i className={`fas ${showFilters ? 'fa-times' : 'fa-search'} text-xl transition-transform duration-300`}></i>
          </button>
        )}

        {activeTab === 'map' && (
          <>
            <button 
              onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }}
              className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center transition-all border border-white/10 ${
                showFilters 
                  ? 'bg-white text-dirole-primary shadow-white/20 scale-105' 
                  : 'bg-slate-800/80 backdrop-blur text-white hover:bg-slate-700'
              }`}
            >
              <i className={`fas ${showFilters ? 'fa-times' : 'fa-search'}`}></i>
            </button>

            <button 
              onClick={handleForceLocationRefresh}
              className="w-12 h-12 rounded-full bg-slate-800/80 backdrop-blur text-white shadow-lg flex items-center justify-center active:bg-slate-700 border border-white/10"
              title="Forçar atualização de GPS"
            >
              <i className="fas fa-crosshairs"></i>
            </button>
          </>
        )}
        </div>
      </div>

      {/* SEARCH HERE BUTTON */}
       {activeTab === 'map' && shouldShowSearchHere && !isRefreshing && (
          <div className="absolute bottom-[calc(6rem+env(safe-area-inset-bottom))] left-4 z-[50] pointer-events-auto animate-slide-up">
             <button
                onClick={handleSearchHere}
                disabled={isLoading}
                className={`w-12 h-12 rounded-full bg-slate-800/90 backdrop-blur border border-white/10 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all ${isLoading ? 'opacity-50' : 'hover:bg-slate-700'}`}
             >
                <i className={`fas fa-redo text-base ${isLoading ? 'animate-spin' : ''}`}></i>
             </button>
          </div>
       )}

      <div className="bg-black/40 backdrop-blur-xl border-t border-white/5 grid grid-cols-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-3 z-[50] shrink-0 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button 
          onClick={() => switchTab('map')}
          className="group flex flex-col items-center justify-center space-y-1 relative"
        >
          {activeTab === 'map' && <div className="absolute top-0 w-12 h-1 bg-dirole-primary rounded-b-full shadow-[0_0_15px_#8b5cf6]"></div>}
          <div className={`p-2 rounded-xl transition-colors ${activeTab === 'map' ? 'text-dirole-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
             <i className="fas fa-map-marked-alt text-xl"></i>
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'map' ? 'text-white' : 'text-slate-500'}`}>Mapa</span>
        </button>
        
        <button 
          onClick={() => switchTab('list')}
          className="group flex flex-col items-center justify-center space-y-1 relative"
        >
          {activeTab === 'list' && <div className="absolute top-0 w-12 h-1 bg-dirole-primary rounded-b-full shadow-[0_0_15px_#8b5cf6]"></div>}
           <div className={`p-2 rounded-xl transition-colors ${activeTab === 'list' ? 'text-dirole-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
            <i className="fas fa-stream text-xl"></i>
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'list' ? 'text-white' : 'text-slate-500'}`}>Lista</span>
        </button>

        <button 
          onClick={() => switchTab('rank')}
          className="group flex flex-col items-center justify-center space-y-1 relative"
        >
          {activeTab === 'rank' && <div className="absolute top-0 w-12 h-1 bg-dirole-primary rounded-b-full shadow-[0_0_15px_#8b5cf6]"></div>}
           <div className={`p-2 rounded-xl transition-colors ${activeTab === 'rank' ? 'text-dirole-primary' : 'text-slate-500 group-hover:text-slate-300'}`}>
            <i className="fas fa-crown text-xl"></i>
          </div>
          <span className={`text-[10px] font-bold ${activeTab === 'rank' ? 'text-white' : 'text-slate-500'}`}>Top</span>
        </button>
      </div>

      {selectedLocation && (
        <>
          <ReviewModal 
            location={selectedLocation}
            currentUser={currentUser}
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSuccess={handleReviewSuccess}
            onLogout={handleLogout}
          />
          <LocationDetailsModal 
            location={selectedLocation}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onCheckIn={handleCheckIn}
            onClaim={handleOpenClaim}
            onReport={handleOpenReport}
            onInvite={handleOpenInvite}
          />
          <ClaimBusinessModal 
            location={selectedLocation}
            currentUser={currentUser}
            isOpen={isClaimModalOpen}
            onClose={() => setIsClaimModalOpen(false)}
            onSuccess={() => {
                setShowConfetti(true);
                setTimeout(() => setShowConfetti(false), 3000);
                const center = currentMapCenter || userLocation || INITIAL_CENTER;
                fetchData(center.lat, center.lng);
            }}
          />
          <InviteFriendsModal 
             isOpen={isInviteModalOpen}
             onClose={() => setIsInviteModalOpen(false)}
             currentUser={currentUser}
             location={selectedLocation}
             onSuccess={() => {
                 setShowConfetti(true);
                 setTimeout(() => setShowConfetti(false), 3000);
             }}
          />
        </>
      )}

      {isReportModalOpen && reportTarget && (
          <ReportModal 
             isOpen={isReportModalOpen}
             onClose={() => setIsReportModalOpen(false)}
             targetId={reportTarget.id}
             targetType={reportTarget.type}
             targetName={reportTarget.name}
             currentUser={currentUser}
          />
      )}

      {isPrivacyModalOpen && (
          <PrivacyPolicyModal 
             isOpen={isPrivacyModalOpen}
             onClose={() => setIsPrivacyModalOpen(false)}
          />
      )}

      {isFriendsModalOpen && (
          <FriendsModal 
             isOpen={isFriendsModalOpen}
             onClose={() => setIsFriendsModalOpen(false)}
             currentUser={currentUser}
             initialTab={friendsModalTab}
             onLogout={handleLogout}
          />
      )}

      <AddLocationModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleAddLocationSuccess}
        userLat={userLocation?.lat || INITIAL_CENTER.lat}
        userLng={userLocation?.lng || INITIAL_CENTER.lng}
        currentUser={currentUser}
      />

      <ProfileModal 
        isOpen={isProfileModalOpen}
        currentUser={currentUser}
        onSave={handleProfileSave}
        onClose={() => setIsProfileModalOpen(false)}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        onOpenFriends={handleOpenFriends}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;