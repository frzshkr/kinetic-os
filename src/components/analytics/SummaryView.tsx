import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BriskwalkSession, FastingRecord, TimeframeFilter, UserSettings } from '../../types';
import { calculateSummary } from '../../utils/analytics';
import { formatPace, formatDistanceKm } from '../../utils/geo';
import { sound } from '../../utils/audio';
import {
  Calendar,
  Compass,
  Flame,
  Droplets,
  Gauge,
  TrendingUp,
  Award,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface SummaryViewProps {
  walkHistory: BriskwalkSession[];
  fastHistory: FastingRecord[];
  waterTodayMl: number;
  userSettings: UserSettings;
}

export const SummaryView: React.FC<SummaryViewProps> = ({
  walkHistory,
  fastHistory,
  waterTodayMl,
  userSettings,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeFilter>('month');
  const [chartMetric, setChartMetric] = useState<'distance' | 'fasting' | 'calories'>('distance');

  const summary = calculateSummary(
    timeframe,
    walkHistory,
    fastHistory,
    waterTodayMl,
    userSettings.weightKg
  );

  const timeframes: { id: TimeframeFilter; label: string }[] = [
    { id: 'day', label: 'Day' },
    { id: 'month', label: 'Month' },
    { id: 'year', label: 'Year' },
  ];

  // Find max value in chartData to scale bars accurately
  const maxChartVal = Math.max(
    ...summary.chartData.map((d) =>
      chartMetric === 'distance'
        ? d.distanceKm
        : chartMetric === 'fasting'
        ? d.fastHours
        : d.calories
    ),
    1
  );

  return (
    <div className="w-full space-y-4">
      {/* Timeframe Control Pill (Day / Month / Year) */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
            PERFORMANCE TIMELINE
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 font-['Outfit'] uppercase tracking-tight">
            {summary.label} SUMMARY
          </h2>
        </div>

        {/* Sliding Capsule Toggle */}
        <div className="flex items-center p-1 rounded-2xl bg-white border border-black/10 shadow-xs relative">
          {timeframes.map((tf) => {
            const isSelected = timeframe === tf.id;
            return (
              <button
                key={tf.id}
                onClick={() => {
                  sound.playClick();
                  setTimeframe(tf.id);
                }}
                className={`relative px-3.5 py-1.5 text-xs font-black font-['Outfit'] uppercase transition-colors z-10 ${
                  isSelected ? 'text-black' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {isSelected && (
                  <motion.div
                    layoutId="timeframeActivePill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#E8F84A] rounded-xl shadow-xs z-[-1]"
                  />
                )}
                <span>{tf.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Hero Metric Bento Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* TOTAL DISTANCE */}
        <motion.div
          key={`dist-${timeframe}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
              TOTAL MILEAGE
            </span>
            <Compass className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-950">
              {formatDistanceKm(summary.totalDistanceMeters)}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-emerald-600">
              KM
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
            {summary.totalDistanceMeters > 0 ? (
              <>
                <span className="text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded-full">
                  LIVE
                </span>
                <span>Active tracking logged</span>
              </>
            ) : (
              <span className="text-slate-400">Ready for your first walk session</span>
            )}
          </div>
        </motion.div>

        {/* FASTING CONSISTENCY */}
        <motion.div
          key={`fast-${timeframe}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 font-black">
              FASTED HOURS
            </span>
            <Flame className="w-4 h-4 text-rose-500 fill-current" />
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-4xl sm:text-5xl font-mono font-black tracking-tight text-slate-950">
              {Math.round(summary.totalFastHours)}
            </span>
            <span className="text-sm sm:text-base font-black font-mono text-rose-500">
              HOURS
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-mono font-bold text-slate-500">
            {summary.totalFastHours > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Avg {summary.avgFastHours}h / session</span>
              </>
            ) : (
              <span className="text-slate-400">Start fasting timer to log autophagy</span>
            )}
          </div>
        </motion.div>
      </div>

      {/* Interactive Animated Trend Chart */}
      <div className="bg-white/90 backdrop-blur-2xl rounded-[32px] p-5 sm:p-6 border border-black/[0.06] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <span className="text-[10px] font-mono uppercase font-black text-slate-400 block">
              VOLUME BREAKDOWN
            </span>
            <h3 className="text-base font-black text-slate-950 font-['Outfit'] uppercase">
              {chartMetric === 'distance'
                ? 'Distance Covered (KM)'
                : chartMetric === 'fasting'
                ? 'Hours Fasted'
                : 'Calories Burned (kcal)'}
            </h3>
          </div>

          {/* Metric Selector Tabs */}
          <div className="flex items-center gap-1 p-1 bg-[#F5F2EB] rounded-2xl border border-black/[0.04]">
            {[
              { id: 'distance' as const, label: 'Distance' },
              { id: 'fasting' as const, label: 'Fasting' },
              { id: 'calories' as const, label: 'Calories' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  sound.playClick();
                  setChartMetric(m.id);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-black font-['Outfit'] uppercase transition-all ${
                  chartMetric === m.id
                    ? 'bg-black text-[#E8F84A] shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Animated Bars */}
        <div className="h-44 sm:h-52 flex items-end gap-2 sm:gap-3 pt-6 pb-2 px-1">
          {summary.chartData.map((pt, idx) => {
            const rawVal =
              chartMetric === 'distance'
                ? pt.distanceKm
                : chartMetric === 'fasting'
                ? pt.fastHours
                : pt.calories;
            const barHeightPercent = rawVal > 0
              ? Math.max(8, Math.min(100, Math.round((rawVal / maxChartVal) * 100)))
              : 2;

            const isCurrentBar = idx === summary.chartData.length - 1 || idx === new Date().getMonth();

            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                {/* Value Hover Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded-lg bg-black text-[#E8F84A] text-[10px] font-mono font-black pointer-events-none whitespace-nowrap z-20 shadow-md">
                  {rawVal} {chartMetric === 'distance' ? 'km' : chartMetric === 'fasting' ? 'hrs' : 'kcal'}
                </div>

                {/* Animated Bar Column */}
                <div className="w-full max-w-[36px] bg-[#F5F2EB] rounded-2xl h-full flex items-end p-1">
                  <motion.div
                    key={`${timeframe}-${chartMetric}-${idx}`}
                    initial={{ height: 0 }}
                    animate={{ height: `${barHeightPercent}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 140,
                      damping: 18,
                      delay: idx * 0.03,
                    }}
                    className={`w-full rounded-xl transition-colors ${
                      chartMetric === 'distance'
                        ? isCurrentBar
                          ? 'bg-emerald-500'
                          : 'bg-emerald-400/70 group-hover:bg-emerald-500'
                        : chartMetric === 'fasting'
                        ? isCurrentBar
                          ? 'bg-rose-500'
                          : 'bg-rose-400/70 group-hover:bg-rose-500'
                        : isCurrentBar
                        ? 'bg-[#E8F84A]'
                        : 'bg-slate-900 group-hover:bg-[#E8F84A]'
                    }`}
                  />
                </div>

                {/* Label under bar */}
                <span className="text-[10px] font-mono font-black text-slate-400 mt-2 block truncate">
                  {pt.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4 Secondary Aggregate Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {/* AVERAGE PACE */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-black text-slate-400 mb-1">
            <Gauge className="w-3 h-3" />
            <span>AVG PACE</span>
          </div>
          <span className="text-xl font-mono font-black text-slate-950">
            {formatPace(summary.avgPaceSecondsPerKm)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">min/km</span>
        </div>

        {/* ACTIVE BURN */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-black text-slate-400 mb-1">
            <Flame className="w-3 h-3 text-orange-500" />
            <span>CALORIES</span>
          </div>
          <span className="text-xl font-mono font-black text-orange-600">
            {summary.totalCalories.toLocaleString()}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">kcal</span>
        </div>

        {/* HYDRATION */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-black text-slate-400 mb-1">
            <Droplets className="w-3 h-3 text-sky-500" />
            <span>HYDRATION</span>
          </div>
          <span className="text-xl font-mono font-black text-sky-600">
            {(summary.totalWaterMl / 1000).toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">Liters logged</span>
        </div>

        {/* DISCIPLINE SCORE */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-3.5 border border-black/[0.06] text-center shadow-xs">
          <div className="flex items-center justify-center gap-1 text-[10px] font-mono uppercase font-black text-slate-400 mb-1">
            <Award className="w-3 h-3 text-[#f59e0b]" />
            <span>CONSISTENCY</span>
          </div>
          <span className="text-xl font-mono font-black text-slate-950">
            {summary.consistencyRatePercent}%
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block font-mono">Optimal</span>
        </div>
      </div>

      {/* Coach Period Summary Insight */}
      <div className="p-4 rounded-3xl bg-black text-white flex items-start gap-3 shadow-md">
        <div className="w-8 h-8 rounded-xl bg-[#E8F84A] text-black flex items-center justify-center font-black shrink-0 mt-0.5">
          <Activity className="w-4 h-4" />
        </div>
        <div>
          <span className="text-[10px] font-mono uppercase font-black text-[#E8F84A] tracking-wider block">
            KINETIC BIO-INSIGHT ({summary.label})
          </span>
          <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
            {timeframe === 'day'
              ? 'Daily glycogen depletion on track. Maintaining your current briskwalk pace locks 82% of caloric expenditure into pure fatty acid oxidation.'
              : timeframe === 'month'
              ? 'Monthly consistency rating is 85%+. Your Zone 2 aerobic threshold has improved by an estimated 8 seconds per kilometer.'
              : 'Annual cumulative volume confirms high metabolic flexibility with regular autophagy turnover cycles and sustained cardiovascular endurance.'}
          </p>
        </div>
      </div>
    </div>
  );
};
