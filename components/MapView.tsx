
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Location } from '../types';
import { INITIAL_CENTER, LOCATION_ICONS } from '../constants';
import { triggerHaptic } from '../services/mockService';

// Fix for default Leaflet marker icons in React
const DefaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Memoized icon creation to prevent lag
const createCustomIcon = (location: Location) => {
  const crowdValue = location.stats.avgCrowd;
  let colorClass = 'text-green-500';
  if (crowdValue > 1.6 && crowdValue <= 2.3) colorClass = 'text-yellow-500';
  if (crowdValue > 2.3) colorClass = 'text-red-500';
  
  if (location.stats.avgCrowd === 0) colorClass = 'text-slate-400';

  const iconClass = LOCATION_ICONS[location.type] || 'fa-map-pin';
  
  // Unverified Visuals
  const borderClass = location.verified ? 'border-2 border-white' : 'border-2 border-dashed border-slate-400 opacity-90';
  const bgClass = location.verified ? 'bg-slate-900' : 'bg-slate-800';

  // Pulse Effect logic (Subtle Glow)
  // Only for verified locations that are "Hot" (High Vibe + Moderate/High Crowd)
  const isHot = location.verified && location.stats.avgVibe > 2.3 && location.stats.avgCrowd > 1.6;
  
  // Using animate-pulse with a blur for a "Glow" effect instead of the aggressive ping
  const pulseHtml = isHot 
    ? `<div class="absolute -inset-2 rounded-full bg-dirole-secondary/40 blur-sm animate-pulse z-0"></div>` 
    : '';

  return L.divIcon({
    className: 'custom-pin',
    html: `
        <div class="relative w-8 h-8">
            ${pulseHtml}
            <div class="w-8 h-8 rounded-full ${bgClass} ${borderClass} flex items-center justify-center shadow-lg transform z-10 relative">
                <i class="fas ${iconClass} ${colorClass} text-sm"></i>
                ${!location.verified ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-slate-500 rounded-full border border-slate-900 flex items-center justify-center"><span class="text-[8px] font-bold text-white">?</span></div>' : ''}
            </div>
        </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

interface MapViewProps {
  locations: Location[];
  userLocation: { lat: number; lng: number } | null;
  userAccuracy?: number;
  mapCenter?: { lat: number; lng: number } | null;
  onOpenDetails: (loc: Location) => void;
  onRegionChange?: (center: { lat: number; lng: number }) => void;
  searchRadius?: number; // in km
  searchOrigin?: { lat: number; lng: number } | null;
}

// Component to recenter map only when target changes
const RecenterMap = ({ center }: { center: { lat: number; lng: number } }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], 14, { animate: true, duration: 1.0 });
  }, [center, map]);
  return null;
};

// Simplified Revalidator (Runs less often)
const MapRevalidator = () => {
  const map = useMap();
  useEffect(() => {
    // Only invalidate once on mount/change to fix grey tiles
    const timer = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

// Handler for Map Events
const MapEventHandler = ({ onRegionChange }: { onRegionChange?: (c: {lat: number, lng: number}) => void }) => {
    useMapEvents({
        moveend: (e) => {
            if (onRegionChange) {
                const center = e.target.getCenter();
                onRegionChange({ lat: center.lat, lng: center.lng });
            }
        }
    });
    return null;
}

export const MapView = React.memo<MapViewProps>(({ 
  locations, 
  userLocation,
  userAccuracy,
  mapCenter,
  onOpenDetails, 
  onRegionChange,
  searchRadius = 1,
  searchOrigin
}) => {
  
  // Memoize markers to prevent re-render of thousands of DOM nodes
  const markers = useMemo(() => locations.map(loc => (
    <Marker 
      key={loc.id} 
      position={[loc.latitude, loc.longitude]}
      icon={createCustomIcon(loc)}
      eventHandlers={{
          click: () => {
              triggerHaptic(10); 
              onOpenDetails(loc);
          }
      }}
    />
  )), [locations, onOpenDetails]);

  // Visual Circle for Radius
  const radiusInMeters = searchRadius * 1000;
  const circleCenter = searchOrigin || (mapCenter || userLocation || INITIAL_CENTER);
  
  // Determines where the map camera should be
  const effectiveCenter = mapCenter || userLocation || INITIAL_CENTER;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        center={[effectiveCenter.lat, effectiveCenter.lng]} 
        zoom={14} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        preferCanvas={true} // Performance Boost
      >
        <MapRevalidator />
        <MapEventHandler onRegionChange={onRegionChange} />
        
        <TileLayer
          attribution='&copy; OSM'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          maxZoom={19}
        />
        
        {/* Search Radius Circle - Shows where we searched */}
        {searchOrigin && (
            <Circle 
                center={[circleCenter.lat, circleCenter.lng]}
                radius={radiusInMeters}
                pathOptions={{
                    color: '#8b5cf6',
                    fillColor: '#8b5cf6',
                    fillOpacity: 0.05,
                    weight: 1,
                    dashArray: '4, 8',
                    interactive: false
                }}
            />
        )}
        
        {/* Recenter Map Helper - Now listens to mapCenter separately */}
        {mapCenter && <RecenterMap center={mapCenter} />}

        {/* User Location Marker - Independent of Map Center */}
        {userLocation && (
          <Marker 
            position={[userLocation.lat, userLocation.lng]}
            icon={L.divIcon({
            className: 'user-pin',
            html: `<div class="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow-lg pulse-ring"></div>`,
            iconSize: [16, 16],
            })}
          />
        )}

        {markers}
      </MapContainer>

      {!userLocation && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/90 text-white text-xs px-4 py-2 rounded-full z-[1000] backdrop-blur shadow-lg">
          Buscando GPS...
        </div>
      )}
    </div>
  );
});
