import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DailyHealthLog, UserSettings, FastingState, BriskwalkSession } from '../../types';
import { sound } from '../../utils/audio';
import {
  HeartPulse,
  Moon,
  Sun,
  Zap,
  Beef,
  Plus,
  Minus,
  CheckCircle2,
  Scale,
  Sparkles,
  ShieldCheck,
  Flame,
  Activity,
  Camera,
  Target,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FoodScannerModal } from './FoodScannerModal';

interface ReadinessViewProps {
  healthLog: DailyHealthLog;
  userSettings: UserSettings;
  fastingState: FastingState;
  recentWalks: BriskwalkSession[];
  onUpdateHealthLog: (updated: DailyHealthLog) => void;
  onOpenConsultation?: () => void;
}

export const ReadinessView: React.FC<ReadinessViewProps> = ({
  healthLog,
  userSettings,
  fastingState,
  recentWalks,
  onUpdateHealthLog,
  onOpenConsultation,
}) => {
  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(healthLog.weightKg.toString());
  const [isFoodScannerOpen, setIsFoodScannerOpen] = useState(false);

  // Calculate dynamic readiness score based on sleep, fasting, and walk exertion
  const calculateDynamicScore = (log: DailyHealthLog): number => {
    let score = 50;
    // Sleep contribution (up to 30 pts)
    const sleepFactor = Math.min(1.2, log.sleepHours / 8);
    score += Math.round(sleepFactor * 25 * (log.sleepQuality / 100));

    // Habit contribution (up to 20 pts)
    const activeHabitsCount = Object.values(log.habits).filter(Boolean).length;
    score += activeHabitsCount * 5;

    return Math.min(99, Math.max(30, score));
  };

  const currentReadiness = calculateDynamicScore(healthLog);

  let readinessState = 'OPTIMAL CAPACITY';
  let readinessColor = 'text-emerald-600 bg-emerald-100 border-emerald-300';
  let readinessAdvise = 'Central nervous system recovered. Primed for a high-cadence brisk walk or extended fasting.';
  if (currentReadiness < 60) {
    readinessState = 'RECOVERY PROTOCOL';
    readinessColor = 'text-rose-600 bg-rose-100 border-rose-300';
    readinessAdvise = 'Elevated sympathetic stress. Prioritize hydration, magnesium, and an early bedtime.';
  } else if (currentReadiness < 80) {
    readinessState = 'MODERATE CAPACITY';
    readinessColor = 'text-amber-700 bg-amber-100 border-amber-300';
    readinessAdvise = 'Balanced autonomic state. Steady Zone 2 brisk walk recommended.';
  }

  // Protein calculation
  const proteinPercent = Math.min(100, Math.round((healthLog.proteinGrams / healthLog.proteinTargetGrams) * 100));

  const handleToggleHabit = (key: keyof DailyHealthLog['habits']) => {
    sound.playClick();
    const newHabits = { ...healthLog.habits, [key]: !healthLog.habits[key] };
    const updated = { ...healthLog, habits: newHabits };
    onUpdateHealthLog(updated);

    if (!healthLog.habits[key]) {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.7 } });
    }
  };

  const handleAddProtein = (grams: number) => {
    sound.playClick();
    const newProtein = Math.max(0, healthLog.proteinGrams + grams);
    const updated = { ...healthLog, proteinGrams: newProtein };
    onUpdateHealthLog(updated);
  };

  const handleAdjustSleep = (deltaHours: number) => {
    sound.playClick();
    const newSleep = Math.max(3, Math.min(12, parseFloat((healthLog.sleepHours + deltaHours).toFixed(1))));
    const updated = { ...healthLog, sleepHours: newSleep };
    onUpdateHealthLog(updated);
  };

  const handleSaveWeight = () => {
    sound.playClick();
    const val = parseFloat(weightInput);
    if (!isNaN(val) && val > 30 && val < 250) {
      onUpdateHealthLog({ ...healthLog, weightKg: val });
    }
    setIsEditingWeight(false);
  };

  const handleLogScannedMeal = (meal: { protein: number; calories: number; carbs: number; fat: number; name: string }) => {
    sound.playMilestone();
    const updated: DailyHealthLog = {
      ...healthLog,
      proteinGrams: healthLog.proteinGrams + meal.protein,
      carbsGrams: healthLog.carbsGrams + meal.carbs,
      fatGrams: healthLog.fatGrams + meal.fat,
    };
    onUpdateHealthLog(updated);
  };

  return (
    <div className="w-full space-y-4">
      {/* Header Title with Consultation Button */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
            BIO-RECOVERY & NUTRITION
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] uppercase tracking-tight">
            DAILY READINESS
          </h2>
        </div>
        <div className="flex items-center gap-2">
          {onOpenConsultation && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={onOpenConsultation}
              className="px-3 py-1.5 rounded-full bg-black text-[#E8F84A] text-xs font-mono font-bold flex items-center gap-1.5 shadow-xs hover:bg-slate-900 transition-colors"
            >
              <Target className="w-3.5 h-3.5" />
              <span>Bio Consultation</span>
            </motion.button>
          )}
          <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-full bg-white border border-black/10 shadow-xs">
            {healthLog.date}
          </span>
        </div>
      </div>

      {/* 1. Readiness Score Bento Dial */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-6 border border-black/[0.06] shadow-sm relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Circular Readiness Gauge */}
          <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r="50"
                stroke="#f1f5f9"
                strokeWidth="10"
                fill="transparent"
              />
              <motion.circle
                cx="60"
                cy="60"
                r="50"
                stroke={currentReadiness >= 80 ? '#10b981' : currentReadiness >= 60 ? '#f59e0b' : '#f43f5e'}
                strokeWidth="10"
                strokeDasharray={2 * Math.PI * 50}
                initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                animate={{ strokeDashoffset: (2 * Math.PI * 50) * (1 - currentReadiness / 100) }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-mono font-black text-slate-950 tracking-tighter">
                {currentReadiness}
              </span>
              <span className="text-[9px] font-mono uppercase font-black text-slate-400 tracking-wider">
                SCORE / 100
              </span>
            </div>
          </div>

          {/* Readiness State & Actionable Bio Advice */}
          <div className="flex-1 text-center sm:text-left">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
              <span className={`text-[10px] font-mono font-black uppercase px-2.5 py-0.5 rounded-full border ${readinessColor}`}>
                {readinessState}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-400">
                Sleep • Fasting • Exertion Sync
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-950 font-['Outfit'] uppercase">
              {currentReadiness >= 80
                ? 'High Aerobic & Metabolic Exertion Prime'
                : 'Balanced Energy Recovery State'}
            </h3>

            <p className="text-xs text-slate-600 mt-1 leading-relaxed font-medium">
              {readinessAdvise}
            </p>
          </div>
        </div>
      </div>

      {/* 2. AI Food Vision Scanner Hero Card */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-gradient-to-br from-black via-zinc-900 to-zinc-950 text-white rounded-[32px] p-6 border border-white/10 shadow-lg relative overflow-hidden group"
      >
        <div className="absolute top-0 right-0 w-56 h-56 bg-[#E8F84A]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#E8F84A] text-black flex items-center justify-center font-black shrink-0 shadow-md">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black uppercase tracking-tight text-white font-['Outfit']">
                  AI FOOD VISION SCANNER
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#E8F84A] text-[9px] font-mono font-bold border border-[#E8F84A]/30">
                  CAMERA TELEMETRY
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5 max-w-md">
                Snap or upload any meal. AI extracts calories, protein, carbs, and fat with 1-tap logging.
              </p>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              sound.playClick();
              setIsFoodScannerOpen(true);
            }}
            className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-[#E8F84A] text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:bg-[#d9e843] transition-colors shrink-0"
          >
            <Camera className="w-4 h-4 fill-black" />
            <span>Scan Meal Now</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>

      {/* 3. Sleep & Circadian Fasting Buffer Bento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Sleep Tracker Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                <Moon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-black text-slate-400 block">
                  REST & SLEEP
                </span>
                <span className="text-sm font-black text-slate-950 font-['Outfit']">
                  SLEEP DURATION
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
              {healthLog.sleepQuality}% Quality
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-2">
            <div>
              <span className="text-3xl font-mono font-black text-slate-950">
                {healthLog.sleepHours}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500 ml-1">HOURS</span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleAdjustSleep(-0.5)}
                className="p-1.5 rounded-xl bg-[#F5F2EB] hover:bg-slate-200 text-slate-700 transition-colors"
                title="Subtract 30m"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleAdjustSleep(0.5)}
                className="p-1.5 rounded-xl bg-[#F5F2EB] hover:bg-slate-200 text-slate-700 transition-colors"
                title="Add 30m"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <span className="text-[11px] text-slate-400 mt-2 block font-medium">
            Target: 8.0h • Deep sleep triggers maximum growth hormone release.
          </span>
        </div>

        {/* Circadian Fasting-to-Sleep Buffer */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-black text-[#E8F84A] flex items-center justify-center">
                <Sun className="w-4 h-4 fill-current" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase font-black text-slate-400 block">
                  CIRCADIAN SYNC
                </span>
                <span className="text-sm font-black text-slate-950 font-['Outfit']">
                  PRE-BED BUFFER
                </span>
              </div>
            </div>

            <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              3.5H BUFFER
            </span>
          </div>

          <div className="mt-2">
            <span className="text-2xl font-mono font-black text-slate-950">
              OPTIMAL
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 block mt-0.5">
              Zero glucose spikes before melatonin onset
            </span>
          </div>

          <span className="text-[11px] text-slate-400 mt-2 block font-medium">
            Closing your eating window 3h before sleep keeps resting heart rate low during deep sleep.
          </span>
        </div>
      </div>

      {/* 4. Protein & Macronutrient Tracker Card */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-black text-rose-400 flex items-center justify-center shadow-xs">
              <Beef className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-950 tracking-tight font-['Outfit'] uppercase">
                PROTEIN FUEL LOG (LEAN MASS PRESERVER)
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                Target: {healthLog.proteinTargetGrams}g daily based on {userSettings.weightKg}kg bodyweight
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-base font-black font-mono text-slate-950">
              {healthLog.proteinGrams} <span className="text-xs text-slate-400 font-normal">/ {healthLog.proteinTargetGrams}g</span>
            </span>
            <span className="text-[10px] block font-mono text-rose-500 font-black">
              {proteinPercent}% TARGET
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 rounded-full bg-[#f1f5f9] overflow-hidden border border-black/[0.04] mb-4">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${proteinPercent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="h-full rounded-full bg-gradient-to-r from-rose-400 via-rose-500 to-orange-400"
          />
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleAddProtein(25)}
            className="flex-1 py-2 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-rose-500" />
            <span>+25g (Shake)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleAddProtein(35)}
            className="flex-1 py-2 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-rose-500" />
            <span>+35g (Meal)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => handleAddProtein(15)}
            className="flex-1 py-2 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3] text-rose-500" />
            <span>+15g (Eggs)</span>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleAddProtein(-25)}
            disabled={healthLog.proteinGrams <= 0}
            className="p-2 rounded-2xl bg-white border border-black/[0.08] text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-all shadow-xs"
            title="Minus 25g"
          >
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </motion.button>
        </div>
      </div>

      {/* 5. Daily Biohacking Habit Matrix */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h4 className="text-sm font-black text-slate-950 font-['Outfit'] uppercase">
              DAILY BIO-HABIT PROTOCOL
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-slate-400">
            {Object.values(healthLog.habits).filter(Boolean).length} / 4 COMPLETED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              id: 'morningSun' as const,
              label: '10m Morning Sunlight',
              desc: 'Resets circadian cortisol clock',
              icon: Sun,
            },
            {
              id: 'electrolytes' as const,
              label: 'Fasting Mineral Salts',
              desc: 'Sodium & potassium during fast',
              icon: Zap,
            },
            {
              id: 'stepsTarget' as const,
              label: '8,000+ Step Baseline',
              desc: 'Non-exercise physical activity',
              icon: Activity,
            },
            {
              id: 'preBedBuffer' as const,
              label: '3h Pre-Bed Fasting Buffer',
              desc: 'Optimizes deep sleep growth hormone',
              icon: Moon,
            },
          ].map((habit) => {
            const isChecked = Boolean(healthLog.habits[habit.id]);
            const Icon = habit.icon;

            return (
              <motion.button
                key={habit.id}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleToggleHabit(habit.id)}
                className={`p-3.5 rounded-2xl text-left border transition-all flex items-start justify-between gap-3 ${
                  isChecked
                    ? 'bg-black text-white border-black shadow-sm'
                    : 'bg-[#F9F7F2] border-black/[0.04] text-slate-800 hover:border-black/20'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-xl shrink-0 mt-0.5 ${isChecked ? 'bg-[#E8F84A] text-black' : 'bg-white text-slate-500'}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-xs font-black block font-['Outfit']">
                      {habit.label}
                    </span>
                    <span className={`text-[10px] block font-medium ${isChecked ? 'text-slate-300' : 'text-slate-500'}`}>
                      {habit.desc}
                    </span>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-lg flex items-center justify-center border mt-0.5 ${isChecked ? 'bg-[#E8F84A] border-transparent text-black' : 'border-slate-300 bg-white'}`}>
                  {isChecked && <CheckCircle2 className="w-3.5 h-3.5 fill-current" />}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 6. Morning Fasted Weight Tracker */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-400 block">
              MORNING FASTED WEIGHT
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-mono font-black text-slate-950">
                {healthLog.weightKg.toFixed(1)}
              </span>
              <span className="text-xs font-mono font-bold text-slate-500">KG</span>
            </div>
          </div>
        </div>

        {isEditingWeight ? (
          <div className="flex items-center gap-1.5">
            <input
              type="number"
              step="0.1"
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value)}
              className="w-20 py-1.5 px-2.5 rounded-xl border border-black text-xs font-mono font-black outline-none bg-white"
            />
            <button
              onClick={handleSaveWeight}
              className="py-1.5 px-3 rounded-xl bg-black text-[#E8F84A] text-xs font-black font-mono"
            >
              SAVE
            </button>
          </div>
        ) : (
          <button
            onClick={() => {
              setWeightInput(healthLog.weightKg.toString());
              setIsEditingWeight(true);
            }}
            className="py-2 px-3.5 rounded-xl bg-[#F9F7F2] hover:bg-slate-200 border border-black/[0.04] text-slate-800 text-xs font-mono font-black"
          >
            LOG TODAY
          </button>
        )}
      </div>

      {/* Food Vision Scanner Modal */}
      <FoodScannerModal
        isOpen={isFoodScannerOpen}
        onClose={() => setIsFoodScannerOpen(false)}
        onLogMeal={handleLogScannedMeal}
        geminiApiKey={userSettings.geminiApiKey}
      />
    </div>
  );
};
