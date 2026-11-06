import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BriskwalkSession, UserSettings } from '../../types';
import { formatPace, formatDuration, formatDistanceKm } from '../../utils/geo';
import {
  Flame,
  Gauge,
  Compass,
  Activity,
  Zap,
  Heart,
  ChevronDown,
  ChevronUp,
  Layers,
} from 'lucide-react';

interface BriskwalkHUDProps {
  session: BriskwalkSession | null;
  userSettings: UserSettings;
}

export const BriskwalkHUD: React.FC<BriskwalkHUDProps> = ({ session, userSettings }) => {
  const [showSplits, setShowSplits] = useState(false);

  const distanceKm = session ? formatDistanceKm(session.distanceMeters) : '0.00';
  const paceStr = session ? formatPace(session.currentPaceSecondsPerKm) : "--'--\"";
  const avgPaceStr = session ? formatPace(session.avgPaceSecondsPerKm) : "--'--\"";
  const durationStr = session ? formatDuration(session.durationSeconds) : '00:00';
  const speedKmh = session ? session.currentSpeedKmh.toFixed(1) : '0.0';
  const calories = session ? session.caloriesBurned : 0;
  const steps = session ? session.estimatedSteps : 0;

  // Real-time Cadence calculation (steps per minute)
  const cadenceSpm = session && session.durationSeconds > 10
    ? Math.round(steps / (session.durationSeconds / 60))
    : 0;

  const targetPaceSecs = userSettings.targetPaceMinPerKm * 60;
  let paceStatusColor = 'bg-[#E8F84A] text-slate-950 border-black/10';
  let paceStatusText = 'OPTIMAL ZONE 2';
  if (session && session.currentPaceSecondsPerKm > 0) {
    if (session.currentPaceSecondsPerKm < targetPaceSecs - 45) {
      paceStatusColor = 'bg-sky-400 text-slate-950 border-sky-500/20';
      paceStatusText = 'POWER CADENCE';
    } else if (session.currentPaceSecondsPerKm > targetPaceSecs + 60) {
      paceStatusColor = 'bg-amber-300 text-slate-950 border-amber-400/20';
      paceStatusText = 'INCREASE CADENCE';
    }
  }

  return (
    <div className="w-full space-y-3 font-['Outfit']">
      {/* Primary Kinetic Telemetry Bento - NRC/Strava style */}
      <div className="grid grid-cols-2 gap-3">
        {/* DISTANCE (KM) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/90 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.08] shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
              DISTANCE
            </span>
            <Compass className="w-4 h-4 text-slate-400 group-hover:rotate-45 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-950">
              {distanceKm}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-600">
              KM
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-[11px] text-slate-500 font-mono font-medium">
              {steps.toLocaleString()} steps
            </span>
            {cadenceSpm > 0 && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {cadenceSpm} SPM
              </span>
            )}
          </div>
        </motion.div>

        {/* CURRENT PACE (MIN/KM) */}
        <motion.div
          whileHover={{ y: -2 }}
          className="bg-white/90 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.08] shadow-sm relative overflow-hidden group"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
              CURRENT PACE
            </span>
            <Gauge className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-950">
              {paceStr}
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-slate-400">
              /km
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono font-medium truncate">
              Avg: <span className="text-slate-900 font-bold">{avgPaceStr}</span>
            </span>
            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs ${paceStatusColor}`}>
              {session?.distanceMeters && session.distanceMeters > 30 ? paceStatusText : 'AWAITING GPS'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics Bar (Duration, Speed, Calories, Cadence) */}
      <div className="grid grid-cols-4 gap-2">
        {/* DURATION */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[9px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            TIME
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-slate-950 tracking-wider">
            {durationStr}
          </span>
        </div>

        {/* SPEED KM/H */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[9px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            SPEED
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-sky-600">
            {speedKmh} <span className="text-[9px] text-slate-400 font-normal">km/h</span>
          </span>
        </div>

        {/* CALORIES */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[9px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            BURN
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-orange-600 flex items-center justify-center gap-0.5">
            <Flame className="w-3 h-3 fill-current" />
            <span>{calories}</span>
          </span>
        </div>

        {/* CADENCE */}
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-3 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[9px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            CADENCE
          </span>
          <span className="text-sm sm:text-base font-mono font-black text-emerald-600 flex items-center justify-center gap-0.5">
            <Activity className="w-3 h-3" />
            <span>{cadenceSpm || '--'}</span>
          </span>
        </div>
      </div>

      {/* Strava Splits Drawer Toggle */}
      {session && session.splits && session.splits.length > 0 && (
        <div className="bg-white/90 backdrop-blur-xl rounded-2xl border border-black/[0.06] overflow-hidden shadow-xs">
          <button
            onClick={() => setShowSplits(!showSplits)}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>STRAVA KILOMETER SPLITS ({session.splits.length})</span>
            </div>
            {showSplits ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          <AnimatePresence>
            {showSplits && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-4 pb-3 space-y-1.5 border-t border-slate-100 pt-2"
              >
                {session.splits.map((split, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500 font-medium">KM {split.kilometer}</span>
                    <span className="font-bold text-slate-900">{formatPace(split.paceSecondsPerKm)} /km</span>
                    <span className="text-[10px] text-emerald-600 font-bold px-2 py-0.5 rounded-full bg-emerald-50">
                      Zone 2
                    </span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Dynamic Animated Satellite / Zone 2 Waveform Bar when Active */}
      {session && !session.isPaused && (
        <div className="flex items-center justify-between py-2 px-4 rounded-2xl bg-black text-white text-xs font-mono font-black uppercase shadow-xs">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500 animate-pulse fill-rose-500" />
            <span className="text-[#E8F84A]">ZONE 2 AEROBIC BASE</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-zinc-400 font-normal">GPS 3D FIX</span>
            <div className="flex items-center gap-0.5 ml-1">
              {[40, 70, 30, 90, 60, 100, 50].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ['4px', `${h / 5}px`, '4px'] }}
                  transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                  className="w-1 bg-[#E8F84A] rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
