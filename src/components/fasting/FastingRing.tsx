import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FastingRecord, FastingStage } from '../../types';
import { getCurrentStage } from '../../utils/metabolic';
import { Flame, Clock, CheckCircle2 } from 'lucide-react';

interface FastingRingProps {
  currentFast: FastingRecord | null;
  targetHours: number;
}

export const FastingRing: React.FC<FastingRingProps> = ({ currentFast, targetHours }) => {
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  useEffect(() => {
    if (!currentFast) {
      setElapsedSeconds(0);
      return;
    }

    const updateTimer = () => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - currentFast.startTime) / 1000));
      setElapsedSeconds(diffSecs);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentFast]);

  const targetTotalSeconds = targetHours * 3600;
  const progressFraction = currentFast ? Math.min(1.5, elapsedSeconds / targetTotalSeconds) : 0;
  const progressPercent = Math.min(100, Math.round(progressFraction * 100));

  const elapsedHours = elapsedSeconds / 3600;
  const currentStage: FastingStage = getCurrentStage(elapsedHours);

  const remainingSeconds = targetTotalSeconds - elapsedSeconds;
  const isGoalReached = remainingSeconds <= 0 && currentFast !== null;

  const hrs = Math.floor(elapsedSeconds / 3600);
  const mins = Math.floor((elapsedSeconds % 3600) / 60);
  const secs = elapsedSeconds % 60;

  const size = 320;
  const strokeWidth = 16;
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(1, progressFraction) * circumference);

  return (
    <div className="relative flex flex-col items-center justify-center py-6">
      {/* Breathing Metabolic Aura Glow */}
      <motion.div
        animate={{
          scale: currentFast ? [1, 1.1, 1] : 1,
          opacity: currentFast ? [0.25, 0.45, 0.25] : 0.15,
        }}
        transition={{
          repeat: Infinity,
          duration: 3.5,
          ease: 'easeInOut',
        }}
        className="absolute w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{
          background: isGoalReached
            ? 'radial-gradient(circle, #34d399 0%, transparent 70%)'
            : 'radial-gradient(circle, #fb7185 0%, #e8f84a 70%, transparent 100%)',
        }}
      />

      {/* SVG Ring Dial */}
      <div className="relative w-[300px] h-[300px] sm:w-[330px] sm:h-[330px] flex items-center justify-center">
        <svg
          className="w-full h-full transform -rotate-90 drop-shadow-md"
          viewBox={`0 0 ${size} ${size}`}
        >
          <defs>
            <linearGradient id="kineticGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f43f5e" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#e8f84a" />
            </linearGradient>
          </defs>

          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e2e8f0"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray="6 6"
          />

          {/* Active Animated Progress Stroke */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isGoalReached ? '#10b981' : 'url(#kineticGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: currentFast ? strokeDashoffset : circumference }}
            transition={{ duration: 1, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Telemetry Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 select-none">
          {currentFast ? (
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
            >
              {/* Metabolic Phase Badge */}
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mb-2 border shadow-xs bg-black text-[#E8F84A] border-black"
              >
                <Flame className="w-3 h-3 fill-current text-[#E8F84A]" />
                <span>{currentStage.name}</span>
              </motion.div>

              {/* Bold Oversized Timer */}
              <div className="font-mono font-black tracking-tighter text-4xl sm:text-5xl text-slate-950 flex items-center justify-center">
                <span>{hrs.toString().padStart(2, '0')}</span>
                <span className="text-slate-300 animate-pulse">:</span>
                <span>{mins.toString().padStart(2, '0')}</span>
                <span className="text-slate-300 animate-pulse">:</span>
                <span className="text-rose-500">{secs.toString().padStart(2, '0')}</span>
              </div>

              {/* Progress & Target */}
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-xs font-mono font-black text-slate-800">
                  {progressPercent}% COMPLETE
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs font-mono font-bold text-slate-500">
                  TARGET {targetHours}H
                </span>
              </div>

              {/* Remaining / Overtime */}
              <div className="mt-2 text-xs font-medium flex justify-center">
                {isGoalReached ? (
                  <span className="flex items-center gap-1 text-emerald-800 font-extrabold bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    TARGET MET (+{formatDurationSimple(Math.abs(remainingSeconds))})
                  </span>
                ) : (
                  <span className="text-slate-600 flex items-center gap-1 font-bold bg-white/80 px-3 py-1 rounded-full border border-black/[0.08] shadow-xs">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDurationSimple(remainingSeconds)} REMAINING
                  </span>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="flex flex-col items-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center mb-3 shadow-md">
                <Flame className="w-7 h-7 fill-current" />
              </div>
              <p className="text-base font-black text-slate-950 font-['Outfit'] uppercase tracking-tight">
                READY TO FAST
              </p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Target: <span className="text-slate-950 font-bold">{targetHours} Hours</span>
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDurationSimple(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
