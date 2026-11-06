import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BriskwalkSession } from '../../types';
import { sound } from '../../utils/audio';
import { formatPace, formatDuration, formatDistanceKm, generateGPX } from '../../utils/geo';
import { Play, Pause, Square, Download, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WorkoutControlsProps {
  isTracking: boolean;
  isPaused: boolean;
  activeSession: BriskwalkSession | null;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  isTracking,
  isPaused,
  activeSession,
  onStart,
  onPause,
  onResume,
  onStop,
}) => {
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [lastFinishedSession, setLastFinishedSession] = useState<BriskwalkSession | null>(null);

  const handleStart = () => {
    sound.playStart();
    onStart();
  };

  const handlePause = () => {
    sound.playClick();
    onPause();
  };

  const handleResume = () => {
    sound.playClick();
    onResume();
  };

  const handleStop = () => {
    sound.playMilestone();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

    if (activeSession) {
      setLastFinishedSession({ ...activeSession, endTime: Date.now() });
      setShowSummaryModal(true);
    }
    onStop();
  };

  const handleDownloadGPX = () => {
    if (!lastFinishedSession || lastFinishedSession.path.length === 0) return;
    const gpxData = generateGPX(
      lastFinishedSession.path,
      `BriskWalk_${new Date(lastFinishedSession.startTime).toISOString().slice(0, 10)}`
    );
    const blob = new Blob([gpxData], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briskwalk-${Date.now()}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full">
      {/* Control Buttons */}
      <div className="flex items-center gap-3">
        {!isTracking ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleStart}
            className="flex-1 py-4 px-6 rounded-2xl bg-black text-[#E8F84A] font-black text-base shadow-lg shadow-black/15 transition-all flex items-center justify-center gap-2 font-['Outfit'] uppercase tracking-wider"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START BRISK WALK GPS</span>
          </motion.button>
        ) : (
          <>
            {isPaused ? (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleResume}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-black text-[#E8F84A] font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md font-['Outfit'] uppercase"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>RESUME</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handlePause}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-amber-400 text-slate-950 font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-sm font-['Outfit'] uppercase"
              >
                <Pause className="w-4 h-4 fill-current" />
                <span>PAUSE</span>
              </motion.button>
            )}

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleStop}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-rose-500 text-white font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-sm font-['Outfit'] uppercase"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>FINISH</span>
            </motion.button>
          </>
        )}
      </div>

      {/* Finished Workout Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && lastFinishedSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-white border border-black/10 rounded-[32px] p-6 shadow-2xl"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-black text-[#E8F84A] mx-auto mb-3 shadow-xs">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-xl font-black text-slate-950 text-center mb-1 font-['Outfit'] uppercase tracking-tight">
                WORKOUT RECORDED! 🏆
              </h3>
              <p className="text-xs text-slate-500 text-center mb-5 font-medium">
                High-efficiency aerobic stimulus delivered.
              </p>

              {/* Metrics Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">
                    TOTAL DISTANCE
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-950">
                    {formatDistanceKm(lastFinishedSession.distanceMeters)}{' '}
                    <span className="text-xs text-emerald-600 font-bold">KM</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">
                    AVERAGE PACE
                  </span>
                  <span className="text-2xl font-mono font-black text-slate-950">
                    {formatPace(lastFinishedSession.avgPaceSecondsPerKm)}
                    <span className="text-xs text-slate-400 font-normal"> /km</span>
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">
                    ELAPSED TIME
                  </span>
                  <span className="text-xl font-mono font-black text-slate-950">
                    {formatDuration(lastFinishedSession.durationSeconds)}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
                  <span className="text-[10px] font-mono uppercase font-black text-slate-400 block mb-1">
                    ESTIMATED BURN
                  </span>
                  <span className="text-xl font-mono font-black text-orange-600">
                    {lastFinishedSession.caloriesBurned} kcal
                  </span>
                </div>
              </div>

              {/* Splits table if available */}
              {lastFinishedSession.splits.length > 0 && (
                <div className="mb-5 max-h-36 overflow-y-auto pr-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black block mb-2">
                    KILOMETER SPLITS:
                  </span>
                  <div className="space-y-1.5">
                    {lastFinishedSession.splits.map((s) => (
                      <div
                        key={s.kilometer}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-[#F9F7F2] text-xs font-mono font-bold"
                      >
                        <span className="text-slate-800">KM {s.kilometer}</span>
                        <span className="text-emerald-600">{formatPace(s.paceSecondsPerKm)} /km</span>
                        <span className="text-slate-400">{formatDuration(s.durationSeconds)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadGPX}
                  className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-mono flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>EXPORT GPX</span>
                </button>

                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-black text-[#E8F84A] text-xs font-black shadow-md font-['Outfit'] uppercase"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
