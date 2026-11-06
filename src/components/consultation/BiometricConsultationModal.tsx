import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2, Scale, Target, Sparkles, Zap, Flame, Footprints, ShieldCheck, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserSettings, DailyHealthLog } from '../../types';
import { sound } from '../../utils/audio';

export type AthleteGoal = 'fat_loss' | 'lean_muscle' | 'endurance' | 'maintenance';

interface BiometricConsultationModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onApplyPlan: (plan: {
    weightKg: number;
    heightCm: number;
    goal: AthleteGoal;
    idealWeightMinKg: number;
    idealWeightMaxKg: number;
    targetProteinGrams: number;
    targetWaterMl: number;
    targetCaloriesKcal: number;
    targetPaceMinPerKm: number;
    recommendedProtocol: string;
  }) => void;
  initialWeightKg?: number;
  initialHeightCm?: number;
}

export const BiometricConsultationModal: React.FC<BiometricConsultationModalProps> = ({
  isOpen,
  onClose,
  onApplyPlan,
  initialWeightKg = 67,
  initialHeightCm = 166,
}) => {
  const [weightKg, setWeightKg] = useState<number>(initialWeightKg);
  const [heightCm, setHeightCm] = useState<number>(initialHeightCm);
  const [goal, setGoal] = useState<AthleteGoal>('fat_loss');
  const [step, setStep] = useState<'input' | 'report'>('input');

  if (!isOpen) return null;

  // ── Sports-Science Calculations ──────────────────────────────────────────
  // 1. BMI calculation
  const heightMeters = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightMeters * heightMeters)).toFixed(1));

  let bmiCategory = 'Healthy Weight';
  let bmiColor = 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (bmi < 18.5) {
    bmiCategory = 'Underweight';
    bmiColor = 'text-amber-600 bg-amber-50 border-amber-200';
  } else if (bmi >= 23 && bmi < 27.5) {
    bmiCategory = 'Healthy Normal (Upper Normal)';
    bmiColor = 'text-sky-600 bg-sky-50 border-sky-200';
  } else if (bmi >= 27.5) {
    bmiCategory = 'Elevated Body Mass';
    bmiColor = 'text-rose-600 bg-rose-50 border-rose-200';
  }

  // 2. Ideal Body Weight using Hamwi & Robinson formulas
  // Robinson Formula for Men: 52kg + 1.9kg for each inch over 5 feet (60 inches)
  const heightInches = heightCm / 2.54;
  const inchesOver60 = Math.max(0, heightInches - 60);
  const idealMidpointKg = parseFloat((52 + 1.9 * inchesOver60).toFixed(1));
  const idealWeightMinKg = parseFloat((idealMidpointKg - 2.5).toFixed(1));
  const idealWeightMaxKg = parseFloat((idealMidpointKg + 2.5).toFixed(1));

  // Delta to ideal
  const weightDeltaKg = parseFloat((weightKg - idealMidpointKg).toFixed(1));

  // 3. Basal Metabolic Rate (Mifflin-St Jeor formula)
  // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age(25) + 5
  const bmr = Math.round(10 * weightKg + 6.25 * heightCm - 5 * 24 + 5);
  // TDEE with moderate brisk walking / Zone 2 activity (factor 1.45)
  const tdee = Math.round(bmr * 1.42);

  // 4. Goal-specific Prescription
  let targetCaloriesKcal = tdee - 400; // Fat loss default
  let targetProteinGrams = Math.round(weightKg * 2.0); // 2.0g per kg for fasting preservation
  let targetWaterMl = Math.round(weightKg * 40); // 40ml per kg
  let targetPaceMinPerKm = 7.5; // 7:30 min/km brisk walk
  let recommendedProtocol = '16-8';
  let goalAdvice = 'Caloric deficit of -400 kcal combined with 16:8 fasting for optimal autophagy & visceral fat burning.';

  if (goal === 'lean_muscle') {
    targetCaloriesKcal = tdee + 250;
    targetProteinGrams = Math.round(weightKg * 2.2);
    targetPaceMinPerKm = 7.8;
    recommendedProtocol = '16-8';
    goalAdvice = 'Caloric surplus of +250 kcal with 2.2g/kg protein to trigger muscle hypertrophy while fasting.';
  } else if (goal === 'endurance') {
    targetCaloriesKcal = tdee;
    targetProteinGrams = Math.round(weightKg * 1.8);
    targetPaceMinPerKm = 7.0; // 7:00 min/km brisk cadence
    recommendedProtocol = '18-6';
    goalAdvice = 'High aerobic Zone 2 pacing to train mitochondrial efficiency and cardiovascular endurance.';
  } else if (goal === 'maintenance') {
    targetCaloriesKcal = tdee;
    targetProteinGrams = Math.round(weightKg * 1.8);
    targetPaceMinPerKm = 7.5;
    recommendedProtocol = '16-8';
    goalAdvice = 'Energy equilibrium to support daily cellular renewal without fluctuations in body weight.';
  }

  const handleApply = () => {
    sound.playCelebration();
    confetti({
      particleCount: 70,
      spread: 60,
      colors: ['#E8F84A', '#000000', '#10B981'],
    });

    onApplyPlan({
      weightKg,
      heightCm,
      goal,
      idealWeightMinKg,
      idealWeightMaxKg,
      targetProteinGrams,
      targetWaterMl,
      targetCaloriesKcal,
      targetPaceMinPerKm,
      recommendedProtocol,
    });

    if (onClose) onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-8 shadow-2xl border border-black/[0.08] my-auto max-h-[92vh] overflow-y-auto"
        >
          {/* Ambient Corner Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8F84A]/35 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-black/[0.06]">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-xs">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-950 font-['Outfit'] uppercase">
                    BIOMETRIC CALIBRATION
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-black text-[#E8F84A] text-[9px] font-mono font-bold">
                    SPORTS SCIENCE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  Personalized body composition analysis & target prescription
                </p>
              </div>
            </div>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* STEP 1: Inputs & Goal Selection */}
          {step === 'input' ? (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                {/* Weight Input */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06]">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    CURRENT WEIGHT (KG)
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setWeightKg((w) => Math.max(35, w - 1));
                        sound.playClick();
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-black/10 text-slate-900 font-black text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black font-mono text-slate-950">
                      {weightKg} <span className="text-xs font-bold text-slate-400">KG</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setWeightKg((w) => Math.min(220, w + 1));
                        sound.playClick();
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-black/10 text-slate-900 font-black text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Height Input */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.06]">
                  <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-2">
                    CURRENT HEIGHT (CM)
                  </label>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setHeightCm((h) => Math.max(120, h - 1));
                        sound.playClick();
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-black/10 text-slate-900 font-black text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                    >
                      -
                    </button>
                    <span className="text-3xl font-black font-mono text-slate-950">
                      {heightCm} <span className="text-xs font-bold text-slate-400">CM</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setHeightCm((h) => Math.min(230, h + 1));
                        sound.playClick();
                      }}
                      className="w-8 h-8 rounded-xl bg-white border border-black/10 text-slate-900 font-black text-base flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all shadow-2xs"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Goal Selection Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                  WHAT IS YOUR PRIMARY OBJECTIVE?
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'fat_loss', title: 'Cut Fat & Weight Loss', desc: 'Burn visceral fat & reveal muscle' },
                    { id: 'lean_muscle', title: 'Lean Muscle & Recomp', desc: 'Build & preserve lean muscle mass' },
                    { id: 'endurance', title: 'Zone 2 Cardio & Stamina', desc: 'Heart health & mitochondrial base' },
                    { id: 'maintenance', title: 'Longevity & Maintenance', desc: 'Cellular autophagy & balance' },
                  ].map((g) => {
                    const isSelected = goal === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => {
                          setGoal(g.id as AthleteGoal);
                          sound.playClick();
                        }}
                        className={`p-3.5 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-slate-950 text-white border-black shadow-md'
                            : 'bg-white hover:bg-slate-50 text-slate-800 border-black/[0.08]'
                        }`}
                      >
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-950'}`}>
                          {g.title}
                        </p>
                        <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                          {g.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Step Button */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  sound.playStart();
                  setStep('report');
                }}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#E8F84A] text-slate-950 font-black text-sm flex items-center justify-center gap-2 hover:bg-[#d9e93b] transition-all shadow-md border border-black/10"
              >
                <span>Generate Sports-Science Consultation</span>
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>
          ) : (
            /* STEP 2: The Full Consultation Report Card */
            <div className="space-y-4">
              
              {/* BMI & Ideal Weight Hero Card */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-black/[0.08]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-400">
                    BODY COMPOSITION ANALYSIS
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${bmiColor}`}>
                    BMI {bmi} • {bmiCategory}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      CURRENT STATS
                    </span>
                    <span className="text-xl font-mono font-black text-slate-950">
                      {weightKg}kg <span className="text-xs text-slate-400 font-normal">/ {heightCm}cm</span>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">
                      IDEAL ATHLETIC WEIGHT
                    </span>
                    <span className="text-xl font-mono font-black text-emerald-600">
                      {idealWeightMinKg} – {idealWeightMaxKg}kg
                    </span>
                  </div>
                </div>

                {/* Target Delta Banner */}
                <div className="mt-3 p-2.5 rounded-xl bg-white border border-black/[0.05] flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Recommended Trajectory:</span>
                  <span className="font-mono font-bold text-slate-900">
                    {weightDeltaKg > 0 ? (
                      <span className="text-rose-600">-{weightDeltaKg} kg fat cut</span>
                    ) : weightDeltaKg < 0 ? (
                      <span className="text-sky-600">+{Math.abs(weightDeltaKg)} kg lean mass</span>
                    ) : (
                      <span className="text-emerald-600">Optimal Athletic Range!</span>
                    )}
                  </span>
                </div>
              </div>

              {/* Caloric & Macronutrient Prescription */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-center">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block mb-0.5">
                    DAILY CALORIES
                  </span>
                  <span className="text-lg font-mono font-black text-slate-950">
                    {targetCaloriesKcal}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">kcal/day</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-center">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block mb-0.5">
                    PROTEIN TARGET
                  </span>
                  <span className="text-lg font-mono font-black text-emerald-600">
                    {targetProteinGrams}g
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">lean muscle</span>
                </div>

                <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-black/[0.06] text-center">
                  <span className="text-[9px] font-mono uppercase font-bold text-slate-400 block mb-0.5">
                    WATER TARGET
                  </span>
                  <span className="text-lg font-mono font-black text-sky-600">
                    {targetWaterMl}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 block">ml / day</span>
                </div>
              </div>

              {/* Protocol Prescription */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase font-bold text-[#E8F84A]">
                    PRESCRIBED PROTOCOLS
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-400">
                    STRIDE OS CALIBRATED
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400 shrink-0" />
                    <div>
                      <p className="font-bold">{recommendedProtocol} Fasting</p>
                      <p className="text-[10px] text-slate-400">Peak Autophagy Window</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-[#E8F84A] shrink-0" />
                    <div>
                      <p className="font-bold">{targetPaceMinPerKm} min/km</p>
                      <p className="text-[10px] text-slate-400">Zone 2 Aerobic Pace</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-slate-300 pt-1 leading-relaxed border-t border-white/10">
                  💡 {goalAdvice}
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="py-3 px-4 rounded-2xl border border-black/10 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors"
                >
                  Back
                </button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  className="flex-1 py-3 px-4 rounded-2xl bg-black text-[#E8F84A] font-black text-xs flex items-center justify-center gap-2 hover:bg-slate-900 transition-all shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply Plan & Targets to My Dashboard</span>
                </motion.button>
              </div>

            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
