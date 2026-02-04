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
import { CookieConsent } from './components/CookieConsent';
import { InAppToast, ToastData } from './components/InAppToast';
import { NotificationsModal } from './components/NotificationsModal';
import { QRScannerModal } from './components/QRScannerModal';

import { Location, Filters, User } from './types';
import { getNearbyRoles, getUserProfile, toggleFavorite, syncUserProfile, triggerHaptic, requestNotificationPermission, sendLocalNotification, searchLocations, getUserById, client, APPWRITE_DATABASE_ID, getPendingFriendRequests, getStoryCountsByLocations } from './services/mockService';
import { INITIAL_CENTER } from './constants';
import { getCurrentSession, signOut, verifyEmail } from './services/authService';
import { PrivacyPolicyModal } from './components/PrivacyPolicyModal';
import { DataPrivacyModal } from './components/DataPrivacyModal';
import { Geolocation } from '@capacitor/geolocation';
import UserAvatar from './components/UserAvatar';
import { OnboardingModal } from './components/OnboardingModal';
import { LandingPage } from './components/LandingPage';
import { VerificationPendingScreen } from './components/VerificationPendingScreen';
import { StoryCamera } from './components/StoryCamera';
import { PWAInstallBanner } from './components/PWAInstallBanner';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  // ... (existing code) ...
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isEmailUnverified, setIsEmailUnverified] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');

  // User State  // --- 0. DEV SANITY: CLEAR SERVICE WORKERS ---
  useEffect(() => {
    if (window.location.hostname === 'localhost') {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('[Dev Sanity] Unregistered SW on boot');
        }
      });
    }

    // Listen for custom events from components
    const handleOpenAdd = () => {
      triggerHaptic();
      setIsAddModalOpen(true);
    };
    window.addEventListener('open-add-location', handleOpenAdd);

    // CHECK FOR EMAIL VERIFICATION CALLBACK
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    const secret = urlParams.get('secret');

    if (userId && secret) {
      verifyEmail(userId, secret)
        .then(() => {
          // Remove params from URL
          window.history.replaceState({}, '', window.location.pathname);
          // Show success toast (deferred until component mount logic handles it, or just generic alert for now)
          alert("E-mail verificado com sucesso! 🎉 Você pode usar o app agora.");
          // Force reload to update session state if logged in
          window.location.reload();
        })
        .catch((err) => {
          console.error("[Auth] Verification failed", err);
          alert("Falha ao verificar e-mail. O link pode ter expirado.");
        });
    }

    return () => window.removeEventListener('open-add-location', handleOpenAdd);
  }, []);

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
  const [isStoryCameraOpen, setIsStoryCameraOpen] = useState(false);
  const [storyLocation, setStoryLocation] = useState<Location | null>(null);
  const [storyCounts, setStoryCounts] = useState<Record<string, number>>({});


  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [friendsModalTab, setFriendsModalTab] = useState<'my_friends' | 'requests' | 'search'>('my_friends');
  const [friendsModalView, setFriendsModalView] = useState<'default' | 'qr'>('default');

  const [reportTarget, setReportTarget] = useState<{ id: string, type: 'location' | 'review' | 'photo' | 'user', name?: string } | null>(null);

  // UI State
  const [showFilters, setShowFilters] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // PULL TO REFRESH STATE
  const [pullY, setPullY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallBanner(true);
      console.log('beforeinstallprompt event was fired');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    triggerHaptic();
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const dismissInstallBanner = () => {
    triggerHaptic();
    setShowInstallBanner(false);
  };

  // DEEP LINKING: Handle ?loc=ID to open location details automatically on load
  useEffect(() => {
    if (locations.length > 0 && hasInitialLoad && !selectedLocation) {
      const urlParams = new URLSearchParams(window.location.search);
      const locId = urlParams.get('loc');
      if (locId) {
        const found = locations.find(l => l.id === locId);
        if (found) {
          setSelectedLocation(found);
          setIsDetailsModalOpen(true);
          setMapTarget({ lat: found.latitude, lng: found.longitude });
          // Clean the URL so refresh doesn't keep opening it
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [locations, hasInitialLoad, selectedLocation]);

  const REFRESH_THRESHOLD = 80;

  // Initial Filters - Default 1km
  const [filters, setFilters] = useState<Filters>({
    minVibe: false,
    lowCost: false,
    types: [],
    maxDistance: 3,
    onlyOpen: false // Initialize new filter
  });

  // Map Theme State
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark');
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast({ title: "Conectado!", message: "Você está online novamente.", type: "system", actionLabel: "OK", action: () => { } });
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleMapTheme = () => {
    setMapTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

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
      console.log("[App] Splash Timeout Reached - Unmounting Splash");
      setShowSplash(false);
      requestNotificationPermission();

      // Check if onboarding was already seen
      const onboardingSeen = localStorage.getItem('dirole_onboarding_seen');
      if (!onboardingSeen) {
        setShowOnboarding(true);
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Check Appwrite Session & Load Local Profile
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check Local Storage first for fast UI
        const localProfile = getUserProfile();
        if (localProfile) {
          setCurrentUser(localProfile);
        }

        // 2. Verify with Appwrite Session
        const session = await getCurrentSession();

        if (session) {

          // CHECK EMAIL VERIFICATION
          if (session.emailVerification === false) {
            console.log("[Auth] Email not verified. Blocking access.");
            setIsEmailUnverified(true);
            setVerificationEmail(session.email);
            // We still assume user is "logged in" for session purposes, but UI is blocked
            // return; // Optional: stop profile sync if unverified
          }

          // Sync profile
          const syncedUser = await syncUserProfile(session.userId, {
            email: session.email,
            name: session.name,
            // Add other meta if needed
          });

          if (syncedUser) {
            setCurrentUser(syncedUser);
          }
        } else {
          console.log("[Auth] No active session.");
          if (localProfile) {
            // Optional: clear local profile if no session exists
            // setCurrentUser(null);
            // localStorage.removeItem('dirole_user_profile');
          }
        }
      } catch (err) {
        console.error("[Auth] Session check failed:", err);
      }
    };

    initAuth();
  }, []);

  // --- NOTIFICATION HANDLERS ---
  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const previousCountRef = useRef(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const isSubscribingRef = useRef(false);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Pleasant notification tone (C major chord - 523.25 Hz)
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      console.warn('[Sound] Failed to play notification:', e);
    }
  }, []);


  const fetchNotificationCount = useCallback(async (userId: string) => {
    try {
      const pendingRequests = await getPendingFriendRequests(userId);
      const newCount = pendingRequests.length;

      // If count increased, trigger feedback
      if (newCount > previousCountRef.current && previousCountRef.current > 0) {
        playNotificationSound();
        triggerHaptic();
        sendLocalNotification(
          '🔔 Novo Convite!',
          'Você recebeu um novo pedido de amizade'
        );
      }

      previousCountRef.current = newCount;
      setNotificationCount(newCount);
    } catch (e) {
      console.error('[Notifications] Failed to fetch friend requests:', e);
    }
  }, [playNotificationSound]);

  // Real-time friend request notifications via Appwrite WebSocket
  useEffect(() => {
    if (!currentUser || currentUser.id.startsWith('guest_')) {
      console.log('[Realtime] Skipping subscription (no user or guest)');
      return;
    }

    // Prevent multiple simultaneous subscriptions
    if (isSubscribingRef.current) {
      console.log('[Realtime] Subscription already in progress, skipping...');
      return;
    }

    console.log('[Realtime] Setting up friendship notifications for user:', currentUser.id);

    // Cleanup previous subscription
    if (unsubscribeRef.current) {
      console.log('[Realtime] Cleaning up previous subscription');
      try {
        unsubscribeRef.current();
      } catch (err) {
        console.warn('[Realtime] Error during cleanup:', err);
      }
      unsubscribeRef.current = null;
    }

    // Mark as subscribing
    isSubscribingRef.current = true;

    // Add small delay to ensure previous connection is fully closed
    const subscriptionTimeout = setTimeout(() => {

      // Subscribe to friendships collection
      try {
        const unsubscribeFriendships = client.subscribe(
          `databases.${APPWRITE_DATABASE_ID}.collections.friendships.documents`,
          (response: any) => {
            console.log('[Realtime] Friendship event:', response.events, response.payload);

            const payload = response.payload;
            const events = response.events || [];

            // Only react to CREATE events where current user is receiver and status is pending
            const isCreate = events.some((e: string) => e.includes('.create'));
            const isUpdate = events.some((e: string) => e.includes('.update'));
            const isForMe = payload.receiver_id === currentUser.id;
            const iSentIt = payload.requester_id === currentUser.id;
            const isPending = payload.status === 'pending';
            const isAccepted = payload.status === 'accepted';

            // 1. New request FOR ME
            if (isCreate && isForMe && isPending) {
              console.log('[Realtime] 🔔 NEW FRIEND REQUEST received!');
              playNotificationSound();
              triggerHaptic();
              addToast({
                title: 'Novo Convite! 📩',
                message: 'Alguém quer ser seu amigo no Dirole.',
                type: 'info'
              });
              sendLocalNotification('🔔 Novo Convite!', 'Você recebeu um novo pedido de amizade!');
              fetchNotificationCount(currentUser.id);
            }

            // 2. Request I sent was ACCEPTED
            if (isUpdate && iSentIt && isAccepted) {
              console.log('[Realtime] 🎉 FRIEND REQUEST ACCEPTED!');
              playNotificationSound();
              triggerHaptic();
              addToast({
                title: 'Convite Aceito! 🤝',
                message: 'Vocês agora são amigos! Bora dominar o mapa.',
                type: 'success'
              });
              sendLocalNotification('🤝 Amizade Confirmada!', 'Seu convite de amizade foi aceito!');

              // Update local user state to reflect new friends list
              const updated = getUserProfile();
              if (updated) setCurrentUser(updated);
            }
          }
        );

        // --- INVITES LISTENER (New) ---
        const unsubscribeInvites = client.subscribe(
          `databases.${APPWRITE_DATABASE_ID}.collections.invites.documents`,
          (response: any) => {
            console.warn('[Realtime DEBUG] RAW EVENT RECV:', response); // WARN level to see in noisy console
            const payload = response.payload;
            const events = response.events || [];

            const isCreate = events.some((e: string) => e.includes('.create'));
            const isUpdate = events.some((e: string) => e.includes('.update'));

            console.log('[Realtime DEBUG] Checks:', {
              isCreate,
              isUpdate,
              toUser: payload.to_user_id,
              fromUser: payload.from_user_id,
              myId: currentUser.id,
              status: payload.status
            });

            // 1. New Invite Receive (Someone invited ME to a location)
            if (isCreate && payload.to_user_id === currentUser.id) {
              console.log('[Realtime] 🎫 NEW LOCATION INVITE received!');
              playNotificationSound();
              triggerHaptic();
              addToast({
                title: 'Chamado pro Rolê! 🍻',
                message: `Convite para ${payload.location_name || 'um local'}.`,
                type: 'info',
                actionLabel: 'Ver',
                action: () => setIsNotificationsModalOpen(true)
              });
              sendLocalNotification('🍻 Chamado pro Rolê!', 'Você foi convidado para sair!');
              // Refresh notification count if you have separate counters for invites
            }

            // 2. My Invite was Accepted (I invited someone, and they accepted)
            if (isUpdate && payload.from_user_id === currentUser.id && payload.status === 'accepted') {
              console.log('[Realtime] 🚀 LOCATION INVITE ACCEPTED!');
              playNotificationSound();
              triggerHaptic();
              addToast({
                title: 'Confirmado! 🚀',
                message: 'Seu convite para o rolê foi aceito.',
                type: 'success'
              });
              sendLocalNotification('🚀 Confirmado!', 'Seu convite para o rolê foi aceito.');
            }
          }
        );

        unsubscribeRef.current = () => {
          try {
            unsubscribeFriendships();
            unsubscribeInvites();
          } catch (err) {
            console.warn('[Realtime] Error during unsubscribe:', err);
          }
        };

        isSubscribingRef.current = false;
        console.log('[Realtime] ✅ Subscription active for friendships AND invites');

      } catch (err) {
        console.error('[Realtime] Subscription failed:', err);
        isSubscribingRef.current = false;
      }
    }, 100); // Small delay to ensure clean reconnection

    // Initial count fetch
    if (currentUser?.id) {
      fetchNotificationCount(currentUser.id);
    }

    return () => {
      console.log('[Realtime] Cleaning up subscription on unmount');
      clearTimeout(subscriptionTimeout);
      isSubscribingRef.current = false;
      if (unsubscribeRef.current) {
        try {
          unsubscribeRef.current();
        } catch (err) {
          console.warn('[Realtime] Error during cleanup on unmount:', err);
        }
        unsubscribeRef.current = null;
      }
    };
    // CRITICAL FIX: Only restart subscription if USER ID changes, not if user XP/details change
  }, [currentUser?.id, fetchNotificationCount, playNotificationSound]);


  // --- REALTIME NOTIFICATIONS (MIGRATED TO WEBSOCKET ABOVE) ---
  /*
  useEffect(() => {
    if (!currentUser) return;
    // Appwrite Realtime could be implemented here
  }, [currentUser]);
  */

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
          minCrowd: undefined,
          maxCrowd: undefined,
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
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    // Dev check for Service Workers
    if (window.location.hostname === 'localhost') {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        for (let registration of registrations) {
          registration.unregister();
          console.log('[Dev Sanity] Unregistered Service Worker for localhost');
        }
      });
    }

    // Tenta usar Capacitor Geolocation
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000
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
    if (filters.minCrowd) {
      res = res.filter(l => l.stats.avgCrowd >= filters.minCrowd);
    }
    if (filters.maxCrowd) {
      res = res.filter(l => l.stats.avgCrowd <= filters.maxCrowd);
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
      console.warn('Erro ao deslogar do Appwrite, mas estado local limpo', e);
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

  const handleOpenReport = useCallback((id: string, type: 'location' | 'review' | 'photo' | 'user', name?: string) => {
    setReportTarget({ id, type, name });
    setIsReportModalOpen(true);
  }, []);

  const handleOpenNotifications = useCallback(() => {
    triggerHaptic();
    setIsNotificationsModalOpen(true);
    setNotificationCount(0); // Clear badge on open
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

  const [scannedUser, setScannedUser] = useState<any>(null);

  const handleQRScan = async (decodedText: string) => {
    console.log("QR detected:", decodedText);
    setIsQRScannerOpen(false);
    triggerHaptic();

    // Check for Friend ID
    if (decodedText.startsWith('dirole:')) {
      const friendId = decodedText.split(':')[1];
      console.log("Friend ID extracted:", friendId);

      if (friendId === currentUser?.id) {
        alert("Você escaneou seu próprio código!");
        return;
      }

      // Fetch user info
      // NOTE: We do NOT set global isLoading here to avoid "refreshing map" visual
      try {
        console.log("Fetching user...");
        const friend = await getUserById(friendId);
        console.log("Friend data fetched:", friend);

        if (friend) {
          setScannedUser(friend);
          // Brief delay to allow state changes to settle before opening modal
          setTimeout(() => {
            console.log("Opening FriendsModal now");
            setIsFriendsModalOpen(true);
          }, 200);
        } else {
          console.warn("User not found for ID:", friendId);
          alert("Usuário não encontrado.");
        }
      } catch (error) {
        console.error("Error fetching friend:", error);
        alert("Erro ao buscar usuário.");
      }
      return;
    }

    // Logic for handling other QR codes
    if (decodedText.startsWith('http')) {
      const confirm = window.confirm(`Abrir link detectado?\n${decodedText}`);
      if (confirm) window.open(decodedText, '_blank');
    } else {
      alert(`QR Code lido:\n${decodedText}`);
    }
  };

  const switchTab = (tab: 'map' | 'list' | 'rank') => {
    triggerHaptic();
    setActiveTab(tab);
  }

  // --- 1. SPLASH SCREEN ---
  if (showSplash) {
    return (
      <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f0518] flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="z-10 text-center animate-fade-in flex flex-col items-center">
          <div className="w-32 h-32 mb-6 relative">
            <div className="absolute inset-0 bg-dirole-primary/30 blur-3xl animate-pulse"></div>
            <img
              src="/og-image.png"
              alt="Dirole Logo"
              className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_20px_rgba(139,92,246,0.3)]"
            />
          </div>
          <h1 className="text-6xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 mb-2 animate-pulse-slow drop-shadow-[0_0_15px_rgba(139,92,246,0.5)] px-4 no-clip">
            DIROLE
          </h1>
          <p className="text-slate-400 font-bold tracking-widest text-xs uppercase opacity-80">O Termômetro do Rolê</p>
          <div className="mt-10 flex justify-center">
            <div className="w-6 h-6 border-2 border-dirole-primary/30 border-t-dirole-primary rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  // --- 2. LANDING PAGE & LOGIN FLOW (If not authenticated) ---
  if (!currentUser) {
    if (showLogin) {
      return <LoginScreen onLoginSuccess={setCurrentUser} />;
    }
    return <LandingPage onEnter={() => setShowLogin(true)} />;
  }

  // --- 2.5 VERIFICATION BARRIER ---
  // If user is logged in (currentUser exists) BUT email is unverified, show pending screen
  if (isEmailUnverified) {
    return (
      <VerificationPendingScreen
        email={verificationEmail}
        onVerified={() => window.location.reload()}
      />
    );
  }

  // --- 3. MAIN APP (Only rendered after login) ---
  return (
    <div className="fixed inset-0 h-[100dvh] w-full flex flex-col bg-[#0f0518] text-white font-sans overflow-hidden">

      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-[#1a0b2e] to-slate-900 z-[-1]"></div>

      {showConfetti && <Confetti />}
      <CookieConsent />

      {/* ACTIVE TOASTS */}
      {toasts.map(toast => (
        <InAppToast key={toast.id} toast={toast} onClose={removeToast} />
      ))}

      {/* HEADER */}
      <header className="bg-[#0f0518]/80 backdrop-blur-xl z-[60] px-6 py-4 pt-[max(1rem,env(safe-area-inset-top))] border-b border-white/5 flex justify-center sticky top-0 shrink-0">
        <div className="w-full max-w-7xl flex justify-between items-center transition-all">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 flex items-center justify-center overflow-hidden">
              <img src="/og-image.png" className="w-14 h-14 object-contain" alt="Logo" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-3xl font-black italic tracking-tighter text-white leading-none no-clip px-2">
                DIROLE
              </h1>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.2em] leading-none mt-1">Social Thermometer</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { triggerHaptic(); setIsNotificationsModalOpen(true); setNotificationCount(0); }}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all relative active:scale-90"
            >
              <i className="fas fa-bell"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-dirole-primary text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-[#0f0518] shadow-lg animate-bounce">
                  {notificationCount > 9 ? '9+' : notificationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { triggerHaptic(); setIsProfileModalOpen(true); }}
              className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-1.5 pr-4 rounded-full border border-white/10 active:scale-95 transition-all shadow-inner group"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-dirole-primary to-dirole-secondary p-[2px] shadow-lg group-hover:rotate-12 transition-transform">
                <UserAvatar
                  avatar={currentUser.avatar}
                  size="sm"
                  className="border-none bg-transparent"
                />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-[10px] font-black text-white leading-none">
                  {currentUser.nickname || currentUser.name.split(' ')[0]}
                </span>
                <span className="text-[8px] font-black text-dirole-secondary leading-none mt-0.5">LVL {currentUser.level}</span>
              </div>
            </button>
            <button
              onClick={() => {
                triggerHaptic();
                // CHANGE: Open Friends Modal with QR view directly instead of Scanner
                setFriendsModalView('qr');
                setFriendsModalTab('my_friends');
                setIsFriendsModalOpen(true);
              }}
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center border border-white/10 hover:bg-white/10 active:scale-95 transition-all shadow-lg backdrop-blur-md"
            >
              <i className="fas fa-qrcode text-white text-sm"></i>
            </button>
          </div>
        </div>
      </header>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
      />



      {/* MAIN CONTENT AREA WITH PULL TO REFRESH */}
      < div
        ref={scrollContainerRef}
        className="flex-1 relative w-full h-full min-h-0 overflow-y-auto overflow-x-hidden scroll-smooth"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >

        {/* PULL INDICATOR */}
        < div
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-[60]"
          style={{
            top: -60, // Start hidden above
            transform: `translateY(${pullY}px)`,
            transition: isRefreshing ? 'transform 0.2s ease-out' : 'transform 0s'
          }
          }
        >
          <div className="bg-slate-800 rounded-full p-2 shadow-lg border border-white/10 flex items-center justify-center w-10 h-10">
            <i className={`fas fa-sync-alt text-dirole-primary ${isRefreshing || pullY > REFRESH_THRESHOLD ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullY * 2}deg)` }}></i>
          </div>
        </div >

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

        {
          activeTab === 'map' && (
            <>
              <ActivityTicker />

              {showFilters && (
                <div className="absolute top-0 left-0 right-0 z-[40] animate-fade-in shadow-xl max-w-2xl mx-auto">
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
                theme={mapTheme}
              />

              {/* Map Controls Container */}
              <div className="absolute top-28 right-4 z-[400]">
                <button
                  onClick={toggleMapTheme}
                  className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all transform active:scale-95 border border-white/20 ${mapTheme === 'dark' ? 'bg-black/80 text-white backdrop-blur-md' : 'bg-white/90 text-slate-900 backdrop-blur-md'}`}
                >
                  <i className={`fas ${mapTheme === 'dark' ? 'fa-sun' : 'fa-moon'} text-xs`}></i>
                </button>
              </div>


            </>
          )
        }

        {
          activeTab === 'list' && (
            <div className="w-full min-h-full max-w-7xl mx-auto">
              {showFilters && (
                <div className="animate-fade-in sticky top-0 z-40 max-w-2xl mx-auto">
                  <FilterBar
                    filters={filters}
                    onChange={setFilters}
                    onSearch={handleTextSearch}
                    onClose={() => setShowFilters(false)}
                  />
                </div>
              )}
              <ListView
                locations={locations}
                onCheckIn={handleCheckIn}
                favorites={currentUser?.favorites || []}
                onToggleFavorite={handleToggleFavorite}
                onOpenDetails={handleOpenDetails}
                isLoading={locations.length === 0 && isLoading}
              />
            </div>
          )
        }



        {
          activeTab === 'rank' && (
            <div className="w-full min-h-full max-w-3xl mx-auto">
              <Leaderboard />
            </div>
          )
        }
      </div >

      {/* SEARCH HERE BUTTON */}
      {activeTab === 'map' && shouldShowSearchHere && !isRefreshing && (
        <div className="fixed bottom-24 left-6 z-[50] pointer-events-none animate-slide-up">
          <button
            onClick={handleSearchHere}
            disabled={isLoading}
            className={`w-14 h-14 rounded-full bg-[#0f0518]/90 backdrop-blur-xl border border-white/10 text-white flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.5)] active:scale-95 transition-all pointer-events-auto group ${isLoading ? 'opacity-50' : 'hover:bg-slate-900'}`}
          >
            <i className={`fas fa-redo text-base group-hover:rotate-180 transition-transform duration-500 ${isLoading ? 'animate-spin' : ''}`}></i>
          </button>
        </div>
      )
      }

      {/* FABs - FLOATING ACTION BUTTONS */}
      <div className="fixed bottom-24 right-4 z-[50] pointer-events-none flex flex-col gap-4 items-end">
        {activeTab === 'map' && (
          <>
            <button
              onClick={() => { triggerHaptic(); setIsAddModalOpen(true); }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-xl shadow-purple-900/40 active:scale-90 transition-all hover:scale-105 border border-white/20 flex items-center justify-center pointer-events-auto"
              title="Adicionar Novo Local"
            >
              <i className="fas fa-plus text-xl"></i>
            </button>

            <button
              onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }}
              className={`w-12 h-12 rounded-2xl shadow-lg flex items-center justify-center transition-all border border-white/10 pointer-events-auto ${showFilters
                ? 'bg-white text-dirole-primary shadow-white/20'
                : 'bg-[#0f0518]/90 backdrop-blur-xl text-white hover:bg-slate-900'
                }`}
            >
              <i className={`fas ${showFilters ? 'fa-times' : 'fa-sliders-h'}`}></i>
            </button>

            <button
              onClick={handleForceLocationRefresh}
              className="w-12 h-12 rounded-2xl bg-[#0f0518]/90 backdrop-blur-xl text-white shadow-lg flex items-center justify-center active:bg-slate-900 border border-white/10 pointer-events-auto"
              title="Sua Localização"
            >
              <i className="fas fa-location-arrow text-sm"></i>
            </button>
          </>
        )}

        {activeTab === 'list' && (
          <button
            onClick={() => { triggerHaptic(); setShowFilters(!showFilters); }}
            className={`w-14 h-14 rounded-2xl shadow-xl active:scale-90 transition-all hover:scale-105 pointer-events-auto flex items-center justify-center ${showFilters
              ? 'bg-slate-800 text-white border border-white/10'
              : 'bg-gradient-to-r from-dirole-primary to-dirole-secondary text-white shadow-purple-900/40 border border-white/20'
              }`}
          >
            <i className={`fas ${showFilters ? 'fa-times' : 'fa-sliders-h'} text-xl`}></i>
          </button>
        )}
      </div>

      {/* BOTTOM NAVIGATION */}
      <nav className="bottom-nav fixed bottom-0 left-0 right-0 bg-[#0f0518]/80 backdrop-blur-xl border-t border-white/5 z-50 px-6 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="max-w-md mx-auto grid grid-cols-3 gap-1">
          <button
            onClick={() => switchTab('map')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all py-1 ${activeTab === 'map' ? 'text-dirole-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'map' ? 'bg-dirole-primary/10 scale-110' : ''}`}>
              <i className="nav-icon fas fa-map-marked-alt text-lg"></i>
            </div>
            <span className="nav-label text-[10px] font-black uppercase tracking-wider">MAPA</span>
          </button>

          <button
            onClick={() => switchTab('list')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all py-1 ${activeTab === 'list' ? 'text-dirole-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'list' ? 'bg-dirole-primary/10 scale-110' : ''}`}>
              <i className="nav-icon fas fa-th-list text-lg"></i>
            </div>
            <span className="nav-label text-[10px] font-black uppercase tracking-wider">LISTA</span>
          </button>

          <button
            onClick={() => switchTab('rank')}
            className={`flex flex-col items-center justify-center space-y-1 transition-all py-1 ${activeTab === 'rank' ? 'text-dirole-primary' : 'text-slate-500 hover:text-slate-300'}`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === 'rank' ? 'bg-dirole-primary/10 scale-110' : ''}`}>
              <i className="nav-icon fas fa-trophy text-lg"></i>
            </div>
            <span className="nav-label text-[10px] font-black uppercase tracking-wider">RANK</span>
          </button>
        </div>
      </nav>

      {selectedLocation && (
        <>
          <ReviewModal
            location={selectedLocation}
            currentUser={currentUser}
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            onSuccess={handleReviewSuccess}
            onLogout={handleLogout}
            userLocation={userLocation}
          />
          <LocationDetailsModal
            location={selectedLocation}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            onCheckIn={handleCheckIn}
            onClaim={handleOpenClaim}
            onReport={handleOpenReport}
            onInvite={handleOpenInvite}
            onPostStory={(loc) => {
              triggerHaptic();
              setStoryLocation(loc);
              setIsStoryCameraOpen(true);
            }}
            onShowToast={(title, message, type) => addToast({
              title,
              message,
              type: type as any
            })}
            userLocation={userLocation}
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
          onClose={() => {
            setIsFriendsModalOpen(false);
            setScannedUser(null);
            setFriendsModalView('default'); // Reset view on close
          }}
          currentUser={currentUser}
          initialTab={friendsModalTab}
          initialView={friendsModalView}
          scannedUser={scannedUser}
          onLogout={handleLogout}
          onOpenScanner={() => {
            setIsFriendsModalOpen(false);
            setTimeout(() => setIsQRScannerOpen(true), 300);
          }}
          onShowToast={(title, message, type) => addToast({
            title,
            message,
            type: type as any
          })}
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
        onOpenData={() => setIsDataModalOpen(true)}
        onOpenFriends={handleOpenFriends}
        onLogout={handleLogout}
        onShowToast={(message, type) => addToast({
          title: type === 'error' ? 'Erro' : 'Sucesso',
          message,
          type
        })}
      />

      {/* Render Privacy Modals AFTER ProfileModal so they appear on top (higher Z-index or DOM order) */}
      {isPrivacyModalOpen && (
        <PrivacyPolicyModal
          isOpen={isPrivacyModalOpen}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      )}

      {isDataModalOpen && (
        <DataPrivacyModal
          isOpen={isDataModalOpen}
          onClose={() => setIsDataModalOpen(false)}
          currentUser={currentUser}
        />
      )}

      <NotificationsModal
        isOpen={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
        currentUser={currentUser}
      />

      {/* Story Camera */}
      {isStoryCameraOpen && storyLocation && (
        <StoryCamera
          isOpen={isStoryCameraOpen}
          locationId={storyLocation.id}
          locationName={storyLocation.name}
          onClose={() => setIsStoryCameraOpen(false)}
          onStoryPosted={() => {
            setIsStoryCameraOpen(false);
            setStoryLocation(null);
            addToast({
              title: "Story Postado! 📸",
              message: "Seu story ficará visível por 6 horas.",
              type: 'success'
            });
          }}
        />
      )}

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {showInstallBanner && (
        <PWAInstallBanner
          onInstall={handleInstallClick}
          onDismiss={dismissInstallBanner}
        />
      )}
    </div>
  );
}

export default App;