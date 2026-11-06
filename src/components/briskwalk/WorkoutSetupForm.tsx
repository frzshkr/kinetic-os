import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ActivityType, GeoPoint, UserSettings, WorkoutGoal } from '../../types';
import { ACTIVITIES } from './ActivityTypeSelector';
import { sound } from '../../utils/audio';
import {
  Play,
  Target,
  Flame,
  Gauge,
  Compass,
  Footprints,
  Volume2,
  VolumeX,
  Radio,
  Check,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

interface WorkoutSetupFormProps {
  selectedActivity: ActivityType;
  onSelectActivity: (type: ActivityType) => void;
  userSettings: UserSettings;
  currentLocation: GeoPoint | null;
  onStartWorkout: (goal: WorkoutGoal) => void;
  lastSessionSummary?: {
    distanceKm: string;
    paceStr: string;
    durationStr: string;
  } | null;
}

const DISTANCE_PRESETS = [1.0, 3.0, 5.0, 10.0];
const TIME_PRESETS = [15, 20, 30, 45, 60];

export const WorkoutSetupForm: React.FC<WorkoutSetupFormProps> = ({
  selectedActivity,
  onSelectActivity,
  userSettings,
  currentLocation,
  onStartWorkout,
  lastSessionSummary,
}) => {
  const [goalType, setGoalType] = useState<'open' | 'distance' | 'time'>('open');
  const [targetDistanceKm, setTargetDistanceKm] = useState<number>(3.0);
  const [targetDurationMinutes, setTargetDurationMinutes] = useState<number>(30);
  const [isVoiceAnnounceEnabled, setIsVoiceAnnounceEnabled] = useState<boolean>(
    userSettings.voiceGuidanceEnabled ?? true
  );

  const currentActivityData =
    ACTIVITIES.find((a) => a.id === selectedActivity) || ACTIVITIES[0];
  const ActivityIcon = currentActivityData.icon;

  // Approximate calorie estimation based on MET & weight
  const getMET = (act: ActivityType): number => {
    switch (act) {
      case 'running':
        return 9.8;
      case 'jogging':
        return 7.0;
      case 'fast_walk':
        return 5.0;
      case 'brisk_walk':
        return 4.3;
      case 'casual_walk':
        return 3.0;
      default:
        return 4.0;
    }
  };

  const estimatedMinutes =
    goalType === 'time'
      ? targetDurationMinutes
      : goalType === 'distance'
      ? targetDistanceKm * 7.5
      : 30; // standard 30-min reference for open stride

  const estimatedBurn = Math.round(
    (getMET(selectedActivity) * 3.5 * userSettings.weightKg * estimatedMinutes) / 200
  );

  const handleLaunch = () => {
    sound.playStart();
    const goal: WorkoutGoal = {
      type: goalType,
      targetDistanceKm: goalType === 'distance' ? targetDistanceKm : undefined,
      targetDurationMinutes: goalType === 'time' ? targetDurationMinutes : undefined,
    };
    onStartWorkout(goal);
  };

  return (
    <div className="w-full space-y-4 font-['Outfit']">
      {/* 1. Mode Selection Card */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-black/[0.07] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-xs">
              <ActivityIcon className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-mono uppercase font-black tracking-wider text-slate-400">
                STEP 1 • WORKOUT MODE
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight">
                {currentActivityData.label}
              </h3>
            </div>
          </div>

          <span
            className="text-[10px] font-mono font-black px-2.5 py-1 rounded-full border"
            style={{
              backgroundColor: `${currentActivityData.accentColor}18`,
              borderColor: `${currentActivityData.accentColor}40`,
              color: currentActivityData.accentColor === '#E8F84A' ? '#0f172a' : currentActivityData.accentColor,
            }}
          >
            {currentActivityData.zone}
          </span>
        </div>

        {/* Mode Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ACTIVITIES.map((act) => {
            const isSelected = selectedActivity === act.id;
            const Icon = act.icon;

            return (
              <motion.button
                key={act.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  sound.playClick();
                  onSelectActivity(act.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-black text-white border-black shadow-md ring-2 ring-[#E8F84A]/70'
                    : 'bg-[#F9F7F2] hover:bg-white text-slate-800 border-black/[0.04] shadow-2xs'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-[#E8F84A] text-black font-black' : 'bg-white text-slate-600'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-[#E8F84A] animate-pulse" />
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight">
                    {act.label}
                  </h4>
                  <p
                    className={`text-[10px] font-mono mt-0.5 ${
                      isSelected ? 'text-slate-300' : 'text-slate-500'
                    }`}
                  >
                    {act.targetPace}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Goal / Target Setting Card */}
      <div className="bg-white/85 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-black/[0.07] shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-emerald-600" />
            <span className="text-[11px] font-mono uppercase font-black tracking-wider text-slate-400">
              STEP 2 • TARGET GOAL
            </span>
          </div>

          <span className="text-[11px] font-mono font-bold text-slate-500">
            {goalType === 'open'
              ? 'Free Stride'
              : goalType === 'distance'
              ? `${targetDistanceKm} KM Target`
              : `${targetDurationMinutes} Min Target`}
          </span>
        </div>

        {/* Goal Type Segmented Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#F0EDE4] border border-black/[0.05] mb-4">
          <button
            onClick={() => {
              sound.playClick();
              setGoalType('open');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all font-['Outfit'] uppercase ${
              goalType === 'open'
                ? 'bg-black text-[#E8F84A] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Open Stride
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGoalType('distance');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all font-['Outfit'] uppercase ${
              goalType === 'distance'
                ? 'bg-black text-[#E8F84A] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Distance
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setGoalType('time');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all font-['Outfit'] uppercase ${
              goalType === 'time'
                ? 'bg-black text-[#E8F84A] shadow-xs'
                : 'text-slate-600 hover:text-black'
            }`}
          >
            Duration
          </button>
        </div>

        {/* Goal Values Picker */}
        <AnimatePresence mode="wait">
          {goalType === 'open' && (
            <motion.div
              key="open-goal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.03] text-center"
            >
              <p className="text-xs text-slate-700 font-medium">
                No limit. Track continuously with real-time GPS telemetry and finish whenever you are ready.
              </p>
            </motion.div>
          )}

          {goalType === 'distance' && (
            <motion.div
              key="distance-goal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-4 gap-2">
                {DISTANCE_PRESETS.map((km) => (
                  <button
                    key={km}
                    onClick={() => {
                      sound.playClick();
                      setTargetDistanceKm(km);
                    }}
                    className={`py-2.5 rounded-xl border text-xs font-mono font-black transition-all ${
                      targetDistanceKm === km
                        ? 'bg-black text-[#E8F84A] border-black shadow-xs'
                        : 'bg-[#F9F7F2] text-slate-800 border-black/[0.04] hover:bg-white'
                    }`}
                  >
                    {km} KM
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 px-1">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Custom (KM):</span>
                <input
                  type="range"
                  min="0.5"
                  max="21.0"
                  step="0.5"
                  value={targetDistanceKm}
                  onChange={(e) => setTargetDistanceKm(parseFloat(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-slate-900 shrink-0 w-12 text-right">
                  {targetDistanceKm.toFixed(1)} km
                </span>
              </div>
            </motion.div>
          )}

          {goalType === 'time' && (
            <motion.div
              key="time-goal"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-5 gap-1.5">
                {TIME_PRESETS.map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      sound.playClick();
                      setTargetDurationMinutes(mins);
                    }}
                    className={`py-2.5 rounded-xl border text-xs font-mono font-black transition-all ${
                      targetDurationMinutes === mins
                        ? 'bg-black text-[#E8F84A] border-black shadow-xs'
                        : 'bg-[#F9F7F2] text-slate-800 border-black/[0.04] hover:bg-white'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3 px-1">
                <span className="text-[11px] font-mono text-slate-400 shrink-0">Custom (Mins):</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={targetDurationMinutes}
                  onChange={(e) => setTargetDurationMinutes(parseInt(e.target.value))}
                  className="w-full accent-black cursor-pointer"
                />
                <span className="text-xs font-mono font-black text-slate-900 shrink-0 w-12 text-right">
                  {targetDurationMinutes} min
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Real-time Telemetry & Calibration Preview */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] shadow-2xs text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            TARGET PACE
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-slate-950">
            {currentActivityData.targetPace}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] shadow-2xs text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            CADENCE
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-emerald-600">
            {currentActivityData.cadenceRange.split(' ')[0]} <span className="text-[10px] font-normal text-slate-400">SPM</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] shadow-2xs text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            EST. BURN
          </span>
          <span className="text-sm sm:text-base font-black font-mono text-orange-600">
            ~{estimatedBurn} <span className="text-[10px] font-normal text-slate-400">kcal</span>
          </span>
        </div>
      </div>

      {/* 4. GPS Lock & Voice Guidance Status */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 border border-black/[0.06] text-xs font-mono">
        <div className="flex items-center gap-2">
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              currentLocation ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-800 font-bold">
            {currentLocation
              ? `GPS Locked (±${Math.round(currentLocation.accuracy)}m)`
              : 'Acquiring GPS Signal...'}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setIsVoiceAnnounceEnabled(!isVoiceAnnounceEnabled);
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-[11px] font-bold transition-all ${
            isVoiceAnnounceEnabled
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-100 border-black/[0.06] text-slate-500'
          }`}
        >
          {isVoiceAnnounceEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Voice Pacer ON</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5" />
              <span>Voice Muted</span>
            </>
          )}
        </button>
      </div>

      {/* 5. Big Launch Action Button */}
      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.96 }}
        onClick={handleLaunch}
        className="w-full py-4 px-6 rounded-2xl bg-black hover:bg-slate-900 text-[#E8F84A] font-black text-base sm:text-lg shadow-xl shadow-black/15 transition-all flex items-center justify-center gap-3 font-['Outfit'] uppercase tracking-wider"
      >
        <Play className="w-5 h-5 fill-current" />
        <span>START {currentActivityData.label} GPS</span>
      </motion.button>

      {/* Optional Last Session Context Badge */}
      {lastSessionSummary && (
        <div className="p-3.5 rounded-2xl bg-[#FAF8F4] border border-black/[0.04] flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Footprints className="w-3.5 h-3.5 text-slate-400" />
            <span>Previous: <strong className="text-slate-800 font-mono">{lastSessionSummary.distanceKm} KM</strong> in {lastSessionSummary.durationStr}</span>
          </div>
          <span className="font-mono font-bold text-slate-700">@{lastSessionSummary.paceStr}/km</span>
        </div>
      )}
    </div>
  );
};
