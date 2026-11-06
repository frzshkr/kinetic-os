import React from 'react';
import { BriskwalkSession } from '../../types';
import { formatPace, formatDuration, formatDistanceKm, generateGPX } from '../../utils/geo';
import { Footprints, Calendar, Download, Flame, Clock } from 'lucide-react';

interface WorkoutHistoryProps {
  history: BriskwalkSession[];
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-8 text-center border border-black/[0.06] shadow-sm">
        <Footprints className="w-8 h-8 text-slate-300 mx-auto mb-2" />
        <h4 className="text-sm font-black text-slate-800 font-['Outfit'] uppercase">No Walking Sessions Yet</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto font-medium">
          Hit 'Start Brisk Walk GPS' above to record your first paced outdoor session.
        </p>
      </div>
    );
  }

  const totalDistanceMeters = history.reduce((acc, h) => acc + h.distanceMeters, 0);
  const totalCalories = history.reduce((acc, h) => acc + h.caloriesBurned, 0);

  const handleDownload = (session: BriskwalkSession) => {
    const gpx = generateGPX(session.path, `BriskWalk_${session.id}`);
    const blob = new Blob([gpx], { type: 'application/gpx+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `briskwalk-${session.id}.gpx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full bg-white/80 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 border border-black/[0.06] shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Footprints className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight font-['Outfit'] uppercase">
            SESSION LOGS & METRICS
          </h3>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400">
          {(totalDistanceMeters / 1000).toFixed(1)} KM TOTAL
        </span>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            TOTAL DISTANCE
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-emerald-700">
            {(totalDistanceMeters / 1000).toFixed(2)} KM
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.04] text-center">
          <span className="text-[10px] uppercase font-mono font-black text-slate-400 block mb-1">
            TOTAL BURN
          </span>
          <span className="text-base sm:text-lg font-black font-mono text-orange-600">
            {totalCalories.toLocaleString()} kcal
          </span>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {history.slice(0, 10).map((session) => {
          const dateStr = new Date(session.startTime).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          });

          return (
            <div
              key={session.id}
              className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F9F7F2] border border-black/[0.03] text-xs hover:border-black/[0.1] transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-950 text-sm">
                    {formatDistanceKm(session.distanceMeters)} KM
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px] font-black">
                    {formatPace(session.avgPaceSecondsPerKm)} /km
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {dateStr}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDuration(session.durationSeconds)}
                  </span>
                  <span className="flex items-center gap-1 text-orange-600 font-bold">
                    <Flame className="w-3 h-3" />
                    {session.caloriesBurned} kcal
                  </span>
                </div>
              </div>

              {session.path.length > 0 && (
                <button
                  onClick={() => handleDownload(session)}
                  className="p-2 rounded-xl bg-white border border-black/[0.08] text-slate-600 hover:text-slate-900 transition-all shadow-2xs"
                  title="Export GPX"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
