import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteInfo, HazardReport } from '../../types';
import { Crosshair, Car, Footprints } from 'lucide-react';

interface WazeMapProps {
  currentLat: number;
  currentLng: number;
  heading?: number;
  routeInfo: RouteInfo | null;
  destinationCoords: [number, number] | null;
  hazards: HazardReport[];
  mode: 'driving' | 'walking';
  onToggleMode: (newMode: 'driving' | 'walking') => void;
  onRecenter: () => void;
}

export const WazeMap: React.FC<WazeMapProps> = ({
  currentLat,
  currentLng,
  heading = 0,
  routeInfo,
  destinationCoords,
  hazards,
  mode,
  onToggleMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowPolylineRef = useRef<L.Polyline | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const destMarkerRef = useRef<L.Marker | null>(null);
  const hazardLayerGroupRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [currentLat, currentLng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      { subdomains: 'abcd', maxZoom: 19 }
    ).addTo(map);

    const glowPolyline = L.polyline([], {
      color: '#38bdf8',
      weight: 10,
      opacity: 0.35,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const mainPolyline = L.polyline([], {
      color: '#0284c7',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(map);

    const vehicleIcon = L.divIcon({
      className: 'custom-vehicle-marker',
      html: `
        <div id="waze-vehicle-chevron" style="transform: rotate(${heading}deg); transition: transform 0.3s ease-out; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;">
          <div style="width: 34px; height: 34px; border-radius: 9999px; background: #000000; border: 3px solid #E8F84A; box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35); display: flex; align-items: center; justify-content: center;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#E8F84A" stroke="#E8F84A" stroke-width="2">
              <polygon points="12 2 19 21 12 17 5 21 12 2" />
            </svg>
          </div>
        </div>
      `,
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });

    const vehicleMarker = L.marker([currentLat, currentLng], { icon: vehicleIcon }).addTo(map);
    const hazardGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    routePolylineRef.current = mainPolyline;
    routeGlowPolylineRef.current = glowPolyline;
    vehicleMarkerRef.current = vehicleMarker;
    hazardLayerGroupRef.current = hazardGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (routeInfo && routeInfo.coordinates.length > 0) {
      if (routePolylineRef.current) routePolylineRef.current.setLatLngs(routeInfo.coordinates);
      if (routeGlowPolylineRef.current) routeGlowPolylineRef.current.setLatLngs(routeInfo.coordinates);

      mapInstanceRef.current.fitBounds(routeInfo.coordinates, {
        padding: [60, 60],
        maxZoom: 17,
      });
    } else {
      if (routePolylineRef.current) routePolylineRef.current.setLatLngs([]);
      if (routeGlowPolylineRef.current) routeGlowPolylineRef.current.setLatLngs([]);
    }

    if (destinationCoords) {
      if (destMarkerRef.current) {
        destMarkerRef.current.setLatLng(destinationCoords);
      } else {
        const flagIcon = L.divIcon({
          className: 'dest-flag-icon',
          html: `
            <div style="background: #ef4444; color: white; width: 32px; height: 32px; border-radius: 9999px; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 14px rgba(239, 68, 68, 0.4); font-size: 15px;">
              🏁
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });
        destMarkerRef.current = L.marker(destinationCoords, { icon: flagIcon }).addTo(
          mapInstanceRef.current
        );
      }
    } else if (destMarkerRef.current) {
      destMarkerRef.current.remove();
      destMarkerRef.current = null;
    }
  }, [routeInfo, destinationCoords]);

  useEffect(() => {
    if (!mapInstanceRef.current || !vehicleMarkerRef.current) return;
    vehicleMarkerRef.current.setLatLng([currentLat, currentLng]);

    const chevron = document.getElementById('waze-vehicle-chevron');
    if (chevron) {
      chevron.style.transform = `rotate(${heading}deg)`;
    }
  }, [currentLat, currentLng, heading]);

  useEffect(() => {
    if (!hazardLayerGroupRef.current) return;
    hazardLayerGroupRef.current.clearLayers();

    hazards.forEach((h) => {
      let emoji = '⚠️';
      let bgColor = '#f59e0b';
      if (h.type === 'police') { emoji = '👮'; bgColor = '#3b82f6'; }
      if (h.type === 'camera') { emoji = '📷'; bgColor = '#f97316'; }
      if (h.type === 'traffic') { emoji = '🚗'; bgColor = '#ef4444'; }

      const hIcon = L.divIcon({
        className: 'hazard-map-icon',
        html: `
          <div style="background: ${bgColor}; width: 28px; height: 28px; border-radius: 9999px; border: 2.5px solid #ffffff; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-size: 13px;">
            ${emoji}
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([h.lat, h.lng], { icon: hIcon });
      marker.bindPopup(`<b>${h.label}</b><br><span style="font-size: 11px;">Reported just now</span>`);
      hazardLayerGroupRef.current?.addLayer(marker);
    });
  }, [hazards]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([currentLat, currentLng], 17, { animate: true });
    }
  };

  return (
    <div className="relative w-full h-[400px] sm:h-[480px] rounded-[32px] overflow-hidden border border-black/10 shadow-sm">
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Mode Switcher */}
      <div className="absolute top-3 left-3 z-10 flex items-center p-1 rounded-2xl bg-white/95 border border-black/10 shadow-md">
        <button
          onClick={() => onToggleMode('driving')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-['Outfit'] uppercase transition-all ${
            mode === 'driving'
              ? 'bg-black text-[#E8F84A] shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Car className="w-3.5 h-3.5" />
          <span>Drive</span>
        </button>

        <button
          onClick={() => onToggleMode('walking')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black font-['Outfit'] uppercase transition-all ${
            mode === 'walking'
              ? 'bg-black text-[#E8F84A] shadow-xs'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Footprints className="w-3.5 h-3.5" />
          <span>Walk</span>
        </button>
      </div>

      {/* Recenter Button */}
      <button
        onClick={handleRecenter}
        className="absolute bottom-3 right-3 z-10 p-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/10 text-slate-800 shadow-md transition-all active:scale-95"
        title="Recenter Map"
      >
        <Crosshair className="w-5 h-5" />
      </button>
    </div>
  );
};
