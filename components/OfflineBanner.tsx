
import React, { useState, useEffect } from 'react';

export const OfflineBanner: React.FC = () => {
    const [isOffline, setIsOffline] = useState(!navigator.onLine);
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            // Show "Back Online" briefly? Or just hide.
            // Let's hide immediately for cleaner UX, or maybe show a green toast.
            // For now, just hide.
        };

        const handleOffline = () => {
            setIsOffline(true);
            setShowBanner(true);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Also verify on mount
    useEffect(() => {
        setIsOffline(!navigator.onLine);
    }, []);

    if (!isOffline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 bg-red-600 z-[9999] px-4 py-2 flex items-center justify-center shadow-xl animate-slide-down">
            <div className="flex items-center gap-2">
                <i className="fas fa-wifi-slash text-white text-xs animate-pulse"></i>
                <span className="text-white text-[10px] font-black uppercase tracking-widest">Sem Conexão</span>
            </div>
        </div>
    );
};
