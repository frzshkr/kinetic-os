import React from 'react';
import { motion } from 'framer-motion';
import { RouteInfo } from '../../types';
import { formatNavDistance } from '../../utils/geo';
import { Navigation2, X } from 'lucide-react';

interface SpeedometerHUDProps {
  currentSpeedKmh: number;
  speedLimitKmh?: number;
  routeInfo: RouteInfo | null;
  remainingDistanceMeters: number;
  remainingDurationSeconds: number;
  onCancelNav: () => void;
  onRecenter: () => void;
}

export const SpeedometerHUD: React.FC<SpeedometerHUDProps> = ({
  currentSpeedKmh,
  speedLimitKmh = 60,
  remainingDistanceMeters,
  remainingDurationSeconds,
  onCancelNav,
  onRecenter,
}) => {
  const isSpeeding = currentSpeedKmh > speedLimitKmh;

  const etaDate = new Date(Date.now() + remainingDurationSeconds * 1000);
  const etaStr = etaDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const remainingMins = Math.round(remainingDurationSeconds / 60);

  return (
    <div className="w-full bg-white/95 backdrop-blur-xl border border-black/10 rounded-[28px] p-4 shadow-xl">
      <div className="flex items-center justify-between gap-3">
        {/* Speedometer Circle */}
        <div className="flex items-center gap-3">
          <div
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center border font-mono transition-all ${
              isSpeeding
                ? 'bg-rose-500 border-rose-600 text-white shadow-md animate-pulse'
                : 'bg-black border-black text-[#E8F84A]'
            }`}
          >
            <span className="text-xl font-black leading-none">
              {Math.round(currentSpeedKmh)}
            </span>
            <span className="text-[9px] uppercase mt-0.5 font-black tracking-wider">
              KM/H
            </span>
          </div>

          {/* Speed limit sign */}
          <div className="w-9 h-9 rounded-full bg-white text-slate-900 border-2 border-rose-600 flex items-center justify-center font-mono font-black text-xs shadow-xs">
            {speedLimitKmh}
          </div>
        </div>

        {/* ETA & Remaining Stats */}
        <div className="flex-1 text-center px-2">
          <div className="flex items-center justify-center gap-2">
            <span className="text-xl sm:text-2xl font-mono font-black text-slate-950 tracking-tight">
              {etaStr}
            </span>
            <span className="text-xs font-mono uppercase text-slate-400 font-black">
              ETA
            </span>
          </div>

          <div className="flex items-center justify-center gap-2.5 mt-1 text-xs font-mono font-bold">
            <span className="text-sky-600">
              {remainingMins} MIN
            </span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-800">
              {formatNavDistance(remainingDistanceMeters)}
            </span>
          </div>
        </div>

        {/* Actions (Recenter & Cancel) */}
        <div className="flex items-center gap-2 shrink-0">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onRecenter}
            className="p-2.5 rounded-2xl bg-black text-[#E8F84A] border border-black transition-all shadow-xs"
            title="Recenter"
          >
            <Navigation2 className="w-4 h-4 fill-current" />
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onCancelNav}
            className="p-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-all shadow-xs"
            title="Cancel Route"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </motion.button>
        </div>
      </div>
    </div>
  );
};
