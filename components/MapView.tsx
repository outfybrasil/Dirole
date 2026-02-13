
import React, { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { Location, MapBounds } from '../types';
import { INITIAL_CENTER, LOCATION_ICONS, getHeatmapIntensity } from '../constants';
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
const createCustomIcon = (location: Location, hasStories: boolean = false) => {
  const { avgCrowd, avgVibe, lastUpdated } = location.stats;
  const intensity = getHeatmapIntensity(avgCrowd, avgVibe, lastUpdated);

  const iconClass = LOCATION_ICONS[location.type] || 'fa-map-pin';

  // Unverified Visuals
  const borderClass = location.verified ? 'border-2 border-white' : 'border-2 border-dashed border-slate-400 opacity-90';
  const bgClass = location.verified ? 'bg-slate-900' : 'bg-slate-800';

  // Story Ring (purple pulsating ring)
  const storyRing = hasStories
    ? `<div class="absolute -inset-4 rounded-full border-4 border-purple-500 opacity-80 animate-pulse z-0"></div>
       <div class="absolute -inset-3 rounded-full bg-purple-500/30 blur-md z-0"></div>`
    : '';

  // Heatmap Glow & Pulse
  const pulseHtml = intensity.pulse
    ? `
      <div class="absolute -inset-3 rounded-full opacity-70 blur-lg animate-pulse z-0" style="background: ${intensity.glow};"></div>
      <div class="absolute -inset-1 rounded-full bg-white/20 animate-ping z-0 opacity-40"></div>
    `
    : `<div class="absolute -inset-2 rounded-full opacity-40 blur-md z-0" style="background: ${intensity.glow};"></div>`;

  // Dynamic size for hot spots
  const sizeClass = intensity.pulse ? 'w-10 h-10' : 'w-8 h-8';
  const iconSizeClass = intensity.pulse ? 'text-base' : 'text-sm';

  return L.divIcon({
    className: 'custom-pin',
    html: `
        <div class="relative ${sizeClass}">
            ${storyRing}
            ${pulseHtml}
            <div class="${sizeClass} rounded-full ${bgClass} ${borderClass} flex items-center justify-center shadow-lg transform z-10 relative" style="border-color: ${intensity.border};">
                <i class="fas ${iconClass} text-white ${iconSizeClass}"></i>
                ${!location.verified ? '<div class="absolute -top-1 -right-1 w-3 h-3 bg-slate-500 rounded-full border border-slate-900 flex items-center justify-center"><span class="text-[8px] font-bold text-white">?</span></div>' : ''}
            </div>
        </div>
    `,
    iconSize: intensity.pulse ? [40, 40] : [32, 32],
    iconAnchor: intensity.pulse ? [20, 40] : [16, 32],
    popupAnchor: [0, intensity.pulse ? -40 : -32]
  });
};

interface MapViewProps {
  locations: Location[];
  userLocation: { lat: number; lng: number } | null;
  userAccuracy?: number;
  mapCenter?: { lat: number; lng: number } | null;
  onOpenDetails: (loc: Location) => void;
  onRegionChange?: (center: { lat: number; lng: number }, bounds: MapBounds) => void;
  searchRadius?: number; // in km
  searchOrigin?: { lat: number; lng: number } | null;
  theme?: 'dark' | 'light';
  storyCounts?: Record<string, number>; // locationId -> story count
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
const MapEventHandler = ({ onRegionChange }: { onRegionChange?: (c: { lat: number, lng: number }, b: MapBounds) => void }) => {
  useMapEvents({
    moveend: (e) => {
      if (onRegionChange) {
        const center = e.target.getCenter();
        const bounds = e.target.getBounds();
        onRegionChange(
          { lat: center.lat, lng: center.lng },
          {
            north: bounds.getNorth(),
            south: bounds.getSouth(),
            east: bounds.getEast(),
            west: bounds.getWest()
          }
        );
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
  searchOrigin,
  theme = 'dark',
  storyCounts = {}
}) => {

  // Memoize markers to prevent re-render of thousands of DOM nodes
  const markers = useMemo(() => locations.map(loc => {
    const hasStories = (storyCounts[loc.id] || 0) > 0;
    return (
      <Marker
        key={loc.id}
        position={[loc.latitude, loc.longitude]}
        // @ts-ignore
        icon={createCustomIcon(loc, hasStories)}
        eventHandlers={{
          click: () => {
            triggerHaptic(10);
            onOpenDetails(loc);
          }
        }}
      />
    );
  }), [locations, onOpenDetails, storyCounts]);

  // Visual Circle for Radius
  const radiusInMeters = searchRadius * 1000;
  const circleCenter = searchOrigin || (mapCenter || userLocation || INITIAL_CENTER);

  // Determines where the map camera should be
  const effectiveCenter = mapCenter || userLocation || INITIAL_CENTER;

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        // @ts-ignore
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
          // @ts-ignore
          attribution='&copy; OSM'
          url={theme === 'dark'
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          maxZoom={19}
        />

        {/* Search Radius Circle - Shows where we searched */}
        {searchOrigin && (
          <Circle
            // @ts-ignore
            center={[circleCenter.lat, circleCenter.lng]}
            // @ts-ignore
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
            // @ts-ignore
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
