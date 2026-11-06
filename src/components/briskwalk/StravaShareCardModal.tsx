import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2,
  CheckCircle2,
  Trophy,
  Flame,
  Footprints,
  Activity,
  Zap,
  X,
  Compass,
  ArrowRight,
  Sparkles,
  Copy,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { BriskwalkSession } from '../../types';
import { formatPace, formatDuration, formatDistanceKm } from '../../utils/geo';
import { sound } from '../../utils/audio';

interface StravaShareCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: BriskwalkSession | null;
  athleteName?: string;
}

export const StravaShareCardModal: React.FC<StravaShareCardModalProps> = ({
  isOpen,
  onClose,
  session,
  athleteName = 'User',
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !session) return null;

  const distanceKm = formatDistanceKm(session.distanceMeters);
  const durationStr = formatDuration(session.durationSeconds);
  const avgPaceStr = formatPace(session.avgPaceSecondsPerKm);
  const calories = session.caloriesBurned;
  const steps = session.estimatedSteps;
  const cadenceSpm = session.durationSeconds > 0
    ? Math.round((steps / (session.durationSeconds / 60)))
    : 118;

  const activityLabel = session.activityType === 'running'
    ? 'RUNNING'
    : session.activityType === 'fast_walk'
    ? 'FAST WALK'
    : session.activityType === 'jogging'
    ? 'JOGGING'
    : session.activityType === 'casual_walk'
    ? 'CASUAL WALK'
    : 'BRISK WALK';

  const handleShare = async () => {
    sound.playClick();
    const shareText = `🏃‍♂️ ${activityLabel} COMPLETE // ${athleteName.toUpperCase()}
📍 Distance: ${distanceKm} KM
⏱ Duration: ${durationStr}
⚡ Avg Pace: ${avgPaceStr} /km
🔥 Burn: ${calories} kcal (${steps.toLocaleString()} steps)
⚡ Cadence: ${cadenceSpm} SPM
🔒 Logged in STRIDE Vault`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `STRIDE ${activityLabel} - ${distanceKm} km`,
          text: shareText,
        });
        return;
      } catch (err) {
        // Fallback to copy
      }
    }

    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Clipboard write failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md font-['Outfit']">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-md bg-[#09090B] text-white rounded-[32px] border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden relative"
      >
        {/* Glow Accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8F84A]/15 blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="p-5 pb-3 flex items-center justify-between border-b border-white/5 relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E8F84A] text-black flex items-center justify-center font-black">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black tracking-wider uppercase text-white">
                  STRIDE RUN CLUB
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/10 text-[#E8F84A]">
                  STRAVA TELEMETRY
                </span>
              </div>
              <p className="text-[10px] text-zinc-400 font-mono">
                {new Date(session.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Strava / Nike Styled Graphic Card */}
        <div className="p-6 space-y-5 relative z-10">
          {/* Main Hero Distance Display */}
          <div className="text-center py-2 space-y-1">
            <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest block">
              TOTAL DISTANCE
            </span>
            <div className="flex items-baseline justify-center gap-2">
              <span className="text-6xl sm:text-7xl font-mono font-black tracking-tight text-[#E8F84A]">
                {distanceKm}
              </span>
              <span className="text-xl font-mono font-black text-white">
                KM
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold mt-1">
              <Trophy className="w-3.5 h-3.5" />
              <span>Zone 2 Aerobic Base Hit • High Quality</span>
            </div>
          </div>

          {/* Nike Metric Bento Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* TIME */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5">
                ACTIVE TIME
              </span>
              <span className="text-2xl font-mono font-black text-white">
                {durationStr}
              </span>
            </div>

            {/* AVG PACE */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5">
                AVG PACE
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-mono font-black text-white">
                  {avgPaceStr}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">/km</span>
              </div>
            </div>

            {/* CALORIES */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5">
                CALORIES BURNED
              </span>
              <span className="text-2xl font-mono font-black text-orange-400 flex items-center justify-center gap-1">
                <Flame className="w-4 h-4 fill-current" />
                <span>{calories}</span>
              </span>
            </div>

            {/* CADENCE SPM */}
            <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-white/5 text-center">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block mb-0.5">
                CADENCE
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-2xl font-mono font-black text-sky-400">
                  {cadenceSpm}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">SPM</span>
              </div>
            </div>
          </div>

          {/* Splits Breakdown if available */}
          {session.splits && session.splits.length > 0 && (
            <div className="space-y-2 p-3.5 rounded-2xl bg-zinc-900/40 border border-white/5">
              <span className="text-[10px] font-mono uppercase font-bold text-zinc-400 block">
                KILOMETER SPLITS
              </span>
              <div className="space-y-1.5">
                {session.splits.map((split, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <span className="text-zinc-400">KM {split.kilometer}</span>
                    <span className="font-bold text-white">{formatPace(split.paceSecondsPerKm)} /km</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Zone 2</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleShare}
              className="w-full py-3.5 px-6 rounded-2xl bg-[#E8F84A] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(232,248,74,0.3)] hover:bg-[#d9e843] transition-colors"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-black" />
                  <span>Summary Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Strava-Style Workout Card</span>
                </>
              )}
            </motion.button>

            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs uppercase tracking-wider transition-colors"
            >
              Close & Return to Cockpit
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
