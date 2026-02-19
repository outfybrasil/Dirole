import React, { useState, useEffect } from 'react';
import { MobileLayout } from './layouts/MobileLayout';
import { User } from './types';
import { getCurrentSession } from './services/authService';
import { getUserProfile, syncUserProfile } from './services/mockService';
import { OfflineBanner } from './components/OfflineBanner';

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  // Native / Mobile View
  // We pass 'user' if we have it, otherwise MobileLayout handles the AuthFlow
  return (
    <>
      <OfflineBanner />
      <MobileLayout preloadedUser={user} />
    </>
  );
}

export default App;