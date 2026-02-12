import { useEffect, useCallback } from 'react';
import { INITIAL_CENTER } from '../constants';
import { MapBounds } from '../types';

interface UseLocationTrackingProps {
    currentUser: any;
    hasInitialLoad: boolean;
    setHasInitialLoad: (val: boolean) => void;
    setUserLocation: (loc: { lat: number; lng: number } | null) => void;
    setUserAccuracy: (acc: number) => void;
    setMapTarget: (loc: { lat: number; lng: number } | null) => void;
    setCurrentMapCenter: (loc: { lat: number; lng: number } | null) => void;
    setSearchOrigin: (loc: { lat: number; lng: number } | null) => void;
    fetchData: (lat: number, lng: number, bounds?: MapBounds) => Promise<void>;
    setIsLoading: (val: boolean) => void;
    triggerHaptic: () => void;
}

export const useLocationTracking = ({
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
}: UseLocationTrackingProps) => {

    useEffect(() => {
        if (!currentUser) return;

        let watchId: number;

        const geoOptions = {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 20000
        };

        const handleSuccess = (position: GeolocationPosition) => {
            const newLoc = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            setUserAccuracy(position.coords.accuracy);
            setUserLocation(newLoc);

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
            if (!hasInitialLoad) {
                setMapTarget(INITIAL_CENTER);
                setCurrentMapCenter(INITIAL_CENTER);
                fetchData(INITIAL_CENTER.lat, INITIAL_CENTER.lng);
                setHasInitialLoad(true);
            }
        };

        if (navigator.geolocation) {
            watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions);
        } else {
            handleError({ code: 0, message: "Geolocation not supported" } as any);
        }

        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [currentUser, hasInitialLoad, setHasInitialLoad, setUserLocation, setUserAccuracy, setMapTarget, setCurrentMapCenter, setSearchOrigin, fetchData]);

    const handleForceLocationRefresh = useCallback(async () => {
        triggerHaptic();
        setIsLoading(true);

        const updateWithCoordinates = (coords: { latitude: number, longitude: number, accuracy: number }) => {
            const newLoc = {
                lat: coords.latitude,
                lng: coords.longitude
            };
            setUserLocation(newLoc);
            setUserAccuracy(coords.accuracy);
            setMapTarget(newLoc);
            setCurrentMapCenter(newLoc);
            setSearchOrigin(newLoc);
            fetchData(newLoc.lat, newLoc.lng);
            setIsLoading(false);
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => updateWithCoordinates(pos.coords),
                (err) => {
                    console.error(err);
                    setIsLoading(false);
                },
                { enableHighAccuracy: true, timeout: 10000 }
            );
        } else {
            setIsLoading(false);
        }
    }, [triggerHaptic, setIsLoading, setUserLocation, setUserAccuracy, setMapTarget, setCurrentMapCenter, setSearchOrigin, fetchData]);

    return { handleForceLocationRefresh };
};
