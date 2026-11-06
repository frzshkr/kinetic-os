import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BriskwalkSession, ActivityType } from '../../types';
import { sound } from '../../utils/audio';
import { Play, Pause, Square } from 'lucide-react';
import confetti from 'canvas-confetti';
import { StravaShareCardModal } from './StravaShareCardModal';

interface WorkoutControlsProps {
  isTracking: boolean;
  isPaused: boolean;
  activeSession: BriskwalkSession | null;
  athleteName?: string;
  activityType?: ActivityType;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

export const WorkoutControls: React.FC<WorkoutControlsProps> = ({
  isTracking,
  isPaused,
  activeSession,
  athleteName = 'Athlete',
  activityType = 'brisk_walk',
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
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#E8F84A', '#FFFFFF', '#10B981'],
    });

    if (activeSession) {
      setLastFinishedSession({ ...activeSession, endTime: Date.now() });
      setShowSummaryModal(true);
    }
    onStop();
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
            <span>
              {activityType === 'running'
                ? 'START RUNNING GPS'
                : activityType === 'fast_walk'
                ? 'START FAST WALK GPS'
                : activityType === 'jogging'
                ? 'START JOGGING GPS'
                : activityType === 'casual_walk'
                ? 'START CASUAL WALK GPS'
                : 'START BRISK WALK GPS'}
            </span>
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

      {/* Strava / Nike Styled Share Card Modal */}
      <StravaShareCardModal
        isOpen={showSummaryModal}
        onClose={() => setShowSummaryModal(false)}
        session={lastFinishedSession}
        athleteName={athleteName}
      />
    </div>
  );
};
