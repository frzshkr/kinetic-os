import React from 'react';
import { FastingRecord } from '../../types';
import { Trophy, Calendar, CheckCircle2, History } from 'lucide-react';

interface FastingHistoryProps {
  history: FastingRecord[];
}

export const FastingHistory: React.FC<FastingHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-8 text-center border border-black/[0.06] shadow-sm">
        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase">No Fasting Logs Yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
          Start your first fast today. Your session history, streaks, and metabolic stats will log here.
        </p>
      </div>
    );
  }

  const completedFasts = history.filter((h) => h.completed);
  const totalHours = history.reduce((acc, h) => {
    if (!h.endTime) return acc;
    return acc + (h.endTime - h.startTime) / (1000 * 3600);
  }, 0);
  const avgHours = history.length > 0 ? (totalHours / history.length).toFixed(1) : '0';

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-black/[0.06] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight font-['Outfit'] uppercase">
            FASTING HISTORY & METRICS
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">
          {history.length} SESSIONS
        </span>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            TOTAL TIME
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-slate-950">
            {totalHours.toFixed(0)} <span className="text-xs text-amber-500 font-bold">H</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            AVERAGE
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-slate-950">
            {avgHours} <span className="text-xs text-rose-500 font-bold">H</span>
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            COMPLETED
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-600">
            {completedFasts.length}
          </span>
        </div>
      </div>

      {/* Sessions list */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {history.slice(0, 10).map((record) => {
          const durationHours = record.endTime
            ? ((record.endTime - record.startTime) / (1000 * 3600)).toFixed(1)
            : '0';
          const startDate = new Date(record.startTime).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          });

          return (
            <div
              key={record.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.03] text-xs hover:border-black/[0.1] transition-all"
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2
                  className={`w-4 h-4 ${record.completed ? 'text-emerald-500' : 'text-slate-300'}`}
                />
                <div>
                  <div className="font-black text-slate-800 font-['Outfit']">
                    {record.protocolId.toUpperCase()} FAST ({durationHours}H)
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{startDate}</span>
                    {record.mood && (
                      <span className="ml-1 px-2 py-0.2 rounded-full bg-black text-white text-[9px] uppercase font-mono font-bold">
                        {record.mood}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-black text-slate-900 text-xs">
                  {durationHours}h
                </span>
                <span className="text-[10px] text-slate-400 block font-medium">
                  Goal: {record.targetDurationHours}h
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
