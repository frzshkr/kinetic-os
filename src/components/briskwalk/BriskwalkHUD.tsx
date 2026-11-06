import React from 'react';
import { motion } from 'framer-motion';
import { BriskwalkSession, UserSettings } from '../../types';
import { formatPace, formatDuration, formatDistanceKm } from '../../utils/geo';
import { Flame, Gauge, Compass, Activity } from 'lucide-react';

interface BriskwalkHUDProps {
  session: BriskwalkSession | null;
  userSettings: UserSettings;
}

export const BriskwalkHUD: React.FC<BriskwalkHUDProps> = ({ session, userSettings }) => {
  const distanceKm = session ? formatDistanceKm(session.distanceMeters) : '0.00';
  const paceStr = session ? formatPace(session.currentPaceSecondsPerKm) : "--'--\"";
  const avgPaceStr = session ? formatPace(session.avgPaceSecondsPerKm) : "--'--\"";
  const durationStr = session ? formatDuration(session.durationSeconds) : '00:00';
  const speedKmh = session ? session.currentSpeedKmh.toFixed(1) : '0.0';
  const calories = session ? session.caloriesBurned : 0;
  const steps = session ? session.estimatedSteps : 0;

  const targetPaceSecs = userSettings.targetPaceMinPerKm * 60;
  let paceStatusColor = 'bg-[#E8F84A] text-slate-950 border-black/10';
  let paceStatusText = 'OPTIMAL ZONE';
  if (session && session.currentPaceSecondsPerKm > 0) {
    if (session.currentPaceSecondsPerKm < targetPaceSecs - 45) {
      paceStatusColor = 'bg-sky-400 text-slate-950 border-sky-500/20';
      paceStatusText = 'POWER WALK';
    } else if (session.currentPaceSecondsPerKm > targetPaceSecs + 60) {
      paceStatusColor = 'bg-amber-300 text-slate-950 border-amber-400/20';
      paceStatusText = 'INCREASE CADENCE';
    }
  }

  return (
    <div className="w-full space-y-3">
      {/* Primary Kinetic Telemetry Bento */}
      <div className="grid grid-cols-2 gap-3">
        {/* DISTANCE (KM) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm relative overflow-hidden group"
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
          <span className="text-[11px] text-slate-400 mt-2 block font-mono font-medium">
            {steps.toLocaleString()} est. steps
          </span>
        </motion.div>

        {/* PACE (MIN/KM) */}
        <motion.div 
          whileHover={{ y: -2 }}
          className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm relative overflow-hidden group"
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
            <span className="text-[11px] text-slate-400 font-mono font-medium truncate">
              Avg: <span className="text-slate-900 font-bold">{avgPaceStr}</span>
            </span>
            <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded-full border shadow-2xs ${paceStatusColor}`}>
              {session?.distanceMeters && session.distanceMeters > 30 ? paceStatusText : 'AWAITING GPS'}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-3 gap-2.5">
        {/* DURATION */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            DURATION
          </span>
          <span className="text-base sm:text-xl font-mono font-black text-slate-950 tracking-wider">
            {durationStr}
          </span>
        </div>

        {/* SPEED KM/H */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            SPEED
          </span>
          <span className="text-base sm:text-xl font-mono font-black text-sky-600">
            {speedKmh} <span className="text-[10px] text-slate-400 font-normal">km/h</span>
          </span>
        </div>

        {/* CALORIES */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-0.5">
            BURN
          </span>
          <span className="text-base sm:text-xl font-mono font-black text-orange-600 flex items-center justify-center gap-1">
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{calories}</span>
          </span>
        </div>
      </div>

      {/* Dynamic Animated Pulse Waveform Bar when Active */}
      {session && !session.isPaused && (
        <div className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-2xl bg-black text-[#E8F84A] text-xs font-mono font-black uppercase shadow-xs">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          <span>SATELLITE TELEMETRY STREAMING</span>
          <div className="flex items-center gap-0.5 ml-2">
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
      )}
    </div>
  );
};
