import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Plus, Minus, RotateCcw } from 'lucide-react';
import { sound } from '../../utils/audio';

interface WaterTrackerProps {
  currentMl: number;
  goalMl: number;
  onUpdate: (amount: number) => void;
  onReset: () => void;
}

export const WaterTracker: React.FC<WaterTrackerProps> = ({
  currentMl,
  goalMl,
  onUpdate,
  onReset,
}) => {
  const percent = Math.min(100, Math.round((currentMl / goalMl) * 100));

  const handleAdd = (ml: number) => {
    sound.playClick();
    onUpdate(ml);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-black text-[#38bdf8] flex items-center justify-center shadow-xs">
            <Droplets className="w-4 h-4 fill-current" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-950 tracking-tight font-['Outfit'] uppercase">
              HYDRATION TELEMETRY
            </h4>
            <p className="text-[11px] text-slate-400 font-medium">Autophagy & cellular water clearance</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-base font-black font-mono text-slate-950">
            {currentMl} <span className="text-xs text-slate-400 font-normal">/ {goalMl} ml</span>
          </span>
          <span className="text-[10px] block font-mono text-sky-600 font-black">
            {percent}% TARGET
          </span>
        </div>
      </div>

      {/* Animated Liquid Progress Bar */}
      <div className="w-full h-3.5 rounded-full bg-[#f1f5f9] overflow-hidden border border-black/[0.04] mb-4 p-0.5">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 20 }}
          className="h-full rounded-full bg-gradient-to-r from-sky-400 via-sky-500 to-blue-600 shadow-sm"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => handleAdd(250)}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3] text-sky-500" />
          <span>+250ml (Cup)</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => handleAdd(500)}
          className="flex-1 py-2.5 px-3 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3] text-sky-500" />
          <span>+500ml (Bottle)</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => handleAdd(-250)}
          disabled={currentMl <= 0}
          className="p-2.5 rounded-2xl bg-white border border-black/[0.08] text-slate-500 hover:text-slate-900 disabled:opacity-30 transition-all shadow-xs"
          title="Minus 250ml"
        >
          <Minus className="w-3.5 h-3.5 stroke-[3]" />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={onReset}
          className="p-2.5 rounded-2xl bg-white border border-black/[0.08] text-slate-500 hover:text-slate-900 transition-all shadow-xs"
          title="Reset"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </motion.button>
      </div>
    </div>
  );
};
