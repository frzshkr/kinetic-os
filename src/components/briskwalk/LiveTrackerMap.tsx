import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { GeoPoint } from '../../types';
import { Crosshair } from 'lucide-react';

interface LiveTrackerMapProps {
  currentLocation: GeoPoint | null;
  path: GeoPoint[];
  isTracking: boolean;
  onCenterMap: () => void;
}

export const LiveTrackerMap: React.FC<LiveTrackerMapProps> = ({
  currentLocation,
  path,
  isTracking,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const accuracyCircleRef = useRef<L.Circle | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const initialLat = currentLocation?.latitude || 3.139;
    const initialLng = currentLocation?.longitude || 101.6869;

    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // High-contrast aesthetic light pastel tiles (CartoDB Voyager)
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
      }
    ).addTo(map);

    // Glowing track polyline (Vibrant Emerald / Mint)
    const polyline = L.polyline([], {
      color: '#10b981',
      weight: 6,
      opacity: 0.95,
      lineJoin: 'round',
      lineCap: 'round',
    }).addTo(map);

    // Custom pulsing beacon icon
    const pulsingIcon = L.divIcon({
      className: 'custom-gps-marker',
      html: `
        <div style="position: relative; width: 24px; height: 24px;">
          <div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(16, 185, 129, 0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="position: relative; width: 24px; height: 24px; border-radius: 9999px; background: #10b981; border: 3px solid #ffffff; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.45);"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([initialLat, initialLng], { icon: pulsingIcon }).addTo(map);
    const accuracyCircle = L.circle([initialLat, initialLng], {
      radius: currentLocation?.accuracy || 15,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 1.5,
    }).addTo(map);

    mapInstanceRef.current = map;
    polylineRef.current = polyline;
    markerRef.current = marker;
    accuracyCircleRef.current = accuracyCircle;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Polyline and Marker when location or path updates
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Update Path Polyline
    if (polylineRef.current && path.length > 0) {
      const latlngs = path.map((p) => [p.latitude, p.longitude] as [number, number]);
      polylineRef.current.setLatLngs(latlngs);
    }

    // Update Current Location Marker
    if (currentLocation && markerRef.current) {
      const latlng: [number, number] = [currentLocation.latitude, currentLocation.longitude];
      markerRef.current.setLatLng(latlng);

      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.setLatLng(latlng);
        accuracyCircleRef.current.setRadius(currentLocation.accuracy || 15);
      }

      // Smooth pan map if tracking
      if (isTracking) {
        mapInstanceRef.current.panTo(latlng, { animate: true, duration: 0.5 });
      }
    }
  }, [currentLocation, path, isTracking]);

  const handleCenter = () => {
    if (mapInstanceRef.current && currentLocation) {
      mapInstanceRef.current.setView(
        [currentLocation.latitude, currentLocation.longitude],
        17,
        { animate: true }
      );
    }
  };

  return (
    <div className="relative w-full h-[280px] sm:h-[340px] rounded-3xl overflow-hidden border border-slate-200/90 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Center Location Button */}
      <button
        onClick={handleCenter}
        className="absolute bottom-3 right-3 z-10 p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-emerald-600 hover:text-emerald-700 shadow-md transition-all active:scale-95"
        title="Center My Location"
      >
        <Crosshair className="w-4 h-4" />
      </button>

      {/* GPS Status Badge */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/95 border border-slate-200 shadow-md text-[11px] font-mono">
        <span
          className={`w-2 h-2 rounded-full ${
            currentLocation ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
          }`}
        />
        <span className="text-slate-700 font-bold">
          {currentLocation ? `GPS Lock (±${Math.round(currentLocation.accuracy)}m)` : 'Acquiring GPS Signal...'}
        </span>
      </div>
    </div>
  );
};
