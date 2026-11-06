import React from 'react';
import { motion } from 'framer-motion';
import { METABOLIC_STAGES, getStageProgress } from '../../utils/metabolic';
import { Apple, Activity, Flame, Zap, Sparkles, ShieldCheck } from 'lucide-react';

interface FastingStagesProps {
  elapsedHours: number;
}

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Apple,
  Activity,
  Flame,
  Zap,
  Sparkles,
  ShieldCheck,
};

export const FastingStages: React.FC<FastingStagesProps> = ({ elapsedHours }) => {
  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-black/[0.06] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight flex items-center gap-2 font-['Outfit'] uppercase">
            <Sparkles className="w-4 h-4 text-rose-500" />
            BIOLOGICAL TIMELINE
          </h3>
          <p className="text-xs text-slate-400 font-medium">
            Cellular shifts mapped to fasting hours
          </p>
        </div>
        <span className="text-xs font-mono font-black px-3 py-1 rounded-full bg-black text-[#E8F84A]">
          {elapsedHours.toFixed(1)}H FASTED
        </span>
      </div>

      <div className="space-y-2.5">
        {METABOLIC_STAGES.map((stage) => {
          const isPassed = elapsedHours >= stage.endHour;
          const isCurrent = elapsedHours >= stage.startHour && elapsedHours < stage.endHour;
          const stageProg = getStageProgress(elapsedHours, stage);
          const IconComponent = ICON_MAP[stage.icon] || Flame;

          return (
            <motion.div
              key={stage.name}
              initial={false}
              animate={{
                scale: isCurrent ? 1.01 : 1,
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className={`relative overflow-hidden rounded-2xl p-3.5 transition-all border ${
                isCurrent
                  ? 'bg-black text-white border-black shadow-md'
                  : isPassed
                  ? 'bg-[#F9F7F2] border-black/[0.04] text-slate-800 opacity-90'
                  : 'bg-white/40 border-black/[0.02] text-slate-400 opacity-50'
              }`}
            >
              {/* Progress background bar for current active stage */}
              {isCurrent && (
                <div
                  className="absolute bottom-0 left-0 top-0 opacity-20 bg-[#E8F84A] transition-all duration-500"
                  style={{ width: `${stageProg}%` }}
                />
              )}

              <div className="relative flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border shadow-xs ${
                      isCurrent
                        ? 'bg-[#E8F84A] text-black border-transparent'
                        : 'bg-white border-black/[0.08] text-slate-700'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-black font-['Outfit']">
                        {stage.name}
                      </h4>
                      {isCurrent && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase rounded-full bg-[#E8F84A] text-black animate-pulse">
                          ACTIVE ({Math.round(stageProg)}%)
                        </span>
                      )}
                      {isPassed && (
                        <span className="px-2 py-0.5 text-[9px] font-mono font-black rounded-full bg-emerald-100 text-emerald-800">
                          DONE
                        </span>
                      )}
                    </div>

                    <p className={`text-xs mt-1 leading-relaxed font-normal ${isCurrent ? 'text-slate-300' : 'text-slate-600'}`}>
                      {stage.description}
                    </p>

                    <div className="mt-1.5 text-[11px] flex items-center gap-1.5 font-medium">
                      <span className={`font-mono font-black ${isCurrent ? 'text-[#E8F84A]' : 'text-slate-400'}`}>BIO:</span>
                      <span className={isCurrent ? 'text-slate-200' : 'text-slate-500'}>{stage.scientificBenefit}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-mono font-black ${isCurrent ? 'text-[#E8F84A]' : 'text-slate-400'}`}>
                    {stage.startHour}h - {stage.endHour}h
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
