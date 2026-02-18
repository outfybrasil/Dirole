import React, { useState, useEffect } from 'react';
import { MobileLayout } from './layouts/MobileLayout';
import { WebLayout } from './layouts/WebLayout';
import { WebDashboardLayout } from './layouts/WebDashboardLayout';
import { User } from './types';
import { getCurrentSession } from './services/authService';
import { getUserProfile, syncUserProfile } from './services/mockService';

function App() {
  const [isWeb, setIsWeb] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // PLATFORM DETECTION
  useEffect(() => {
    const checkPlatform = () => {
      const isWebDomain = window.location.hostname.includes('dirole-web.appwrite.network');
      const isDesktopWidth = window.innerWidth >= 1024;
      // Force Web Layout if on specific domain or if it looks like desktop
      setIsWeb(isWebDomain || isDesktopWidth);
      // setIsWeb(true); // Uncomment for testing on dev
    };
    checkPlatform();
    window.addEventListener('resize', checkPlatform);
    return () => window.removeEventListener('resize', checkPlatform);
  }, []);

  // GLOBAL AUTH CHECK
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Try Local Storage
        const localProfile = getUserProfile();
        if (localProfile) setUser(localProfile);

        // 2. Verify Session
        const session = await getCurrentSession();
        if (session) {
          const synced = await syncUserProfile(session.userId, {
            email: session.email,
            name: session.name
          });
          if (synced) setUser(synced);
        } else {
          // Invalid session
          setUser(null);
          localStorage.removeItem('dirole_user_profile');
        }
      } catch (e) {
        console.warn('Auth check failed silently:', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#0f0518] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // LOGIC:
  // - If Mobile: Always show MobileLayout (it handles its own Login if !user)
  // - If Web:
  //    - If Logged In: Show WebDashboardLayout (The "Dashboard" for Desktop)
  //    - If Logged Out: Show WebLayout (The Landing Page)

  if (isWeb) {
    if (user) {
      // Authenticated Web User -> DESKTOP DASHBOARD
      return <WebDashboardLayout preloadedUser={user} />;
    } else {
      // Visitor -> Landing Page
      return <WebLayout onLoginSuccess={(u) => setUser(u)} />;
    }
  }

  // Native / Mobile View
  // We pass 'user' if we have it, otherwise MobileLayout handles the AuthFlow
  return <MobileLayout preloadedUser={user} />;
}

export default App;