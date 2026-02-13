import React from 'react';
import { LoginScreen } from './LoginScreen';
import { LandingPage } from './LandingPage';
import { VerificationPendingScreen } from './VerificationPendingScreen';
import { InAppToast, ToastData } from './InAppToast';

interface AuthFlowProps {
    showSplash: boolean;
    isAuthChecking: boolean;
    currentUser: any;
    showLogin: boolean;
    setShowLogin: (val: boolean) => void;
    isEmailUnverified: boolean;
    verificationEmail: string;
    setCurrentUser: (user: any) => void;
    toasts: ToastData[];
    removeToast: (id: string) => void;
}

export const AuthFlow: React.FC<AuthFlowProps> = ({
    showSplash,
    isAuthChecking,
    currentUser,
    showLogin,
    setShowLogin,
    isEmailUnverified,
    verificationEmail,
    setCurrentUser,
    toasts,
    removeToast
}) => {
    if (showSplash || isAuthChecking) {
        return (
            <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f0518] flex flex-col items-center justify-center relative overflow-hidden z-[9999]">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
                <div className="z-10 text-center animate-fade-in flex flex-col items-center">
                    <div className="w-48 h-48 mb-6 relative">
                        <div className="absolute inset-0 bg-dirole-primary/40 blur-[80px] animate-pulse"></div>
                        <img
                            src="/og-image.png"
                            alt="Dirole Logo"
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_0_30px_rgba(139,92,246,0.4)]"
                        />
                    </div>
                    <h1 className="text-7xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-dirole-primary via-dirole-secondary to-orange-400 mb-3 animate-pulse-slow drop-shadow-[0_0_20px_rgba(139,92,246,0.6)] px-4 no-clip">
                        DIROLE
                    </h1>
                    <p className="text-slate-400 font-black tracking-[0.4em] text-[10px] uppercase opacity-90">O Termômetro do Rolê</p>
                    <div className="mt-10 flex justify-center">
                        <div className="w-10 h-10 border-4 border-dirole-primary/30 border-t-dirole-primary rounded-full animate-spin"></div>
                    </div>
                </div>
                <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center">
                    {toasts.map(toast => (
                        <InAppToast key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </div>
            </div>
        );
    }

    if (!currentUser) {
        return (
            <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f0518] overflow-hidden">
                {showLogin ? (
                    <LoginScreen onLoginSuccess={setCurrentUser} />
                ) : (
                    <LandingPage onEnter={() => setShowLogin(true)} />
                )}
                <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center">
                    {toasts.map(toast => (
                        <InAppToast key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </div>
            </div>
        );
    }

    if (isEmailUnverified) {
        return (
            <div className="fixed inset-0 h-[100dvh] w-full bg-[#0f0518] overflow-hidden">
                <VerificationPendingScreen
                    email={verificationEmail}
                    onVerified={() => window.location.reload()}
                />
                <div className="fixed top-[max(1rem,env(safe-area-inset-top))] left-4 right-4 z-[9999] pointer-events-none flex flex-col items-center">
                    {toasts.map(toast => (
                        <InAppToast key={toast.id} toast={toast} onClose={removeToast} />
                    ))}
                </div>
            </div>
        );
    }

    return null;
};
