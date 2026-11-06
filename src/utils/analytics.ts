import { BriskwalkSession, FastingRecord, TimeframeFilter, MetricSummary, SummaryChartPoint } from '../types';

export function calculateSummary(
  timeframe: TimeframeFilter,
  walkHistory: BriskwalkSession[],
  fastHistory: FastingRecord[],
  waterTodayMl: number,
  _userWeightKg: number
): MetricSummary {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

  let cutoffTime = startOfDay;
  let periodLabel = 'TODAY';
  if (timeframe === 'month') {
    cutoffTime = startOfMonth;
    periodLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
  } else if (timeframe === 'year') {
    cutoffTime = startOfYear;
    periodLabel = `${now.getFullYear()} ANNUAL`;
  }

  // 1. Filter ONLY real records within the selected timeframe
  const filteredWalks = (walkHistory || []).filter((w) => w.startTime >= cutoffTime);
  const filteredFasts = (fastHistory || []).filter((f) => f.startTime >= cutoffTime);

  // 2. Aggregate REAL walk metrics (strictly zero if empty)
  const totalDistanceMeters = filteredWalks.reduce((acc, w) => acc + (w.distanceMeters || 0), 0);
  const totalWalkDurationSeconds = filteredWalks.reduce((acc, w) => acc + (w.durationSeconds || 0), 0);
  const totalCalories = filteredWalks.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);
  const totalSteps = filteredWalks.reduce((acc, w) => acc + (w.estimatedSteps || 0), 0);

  const avgPaceSecondsPerKm =
    totalDistanceMeters > 50 && totalWalkDurationSeconds > 0
      ? (totalWalkDurationSeconds / totalDistanceMeters) * 1000
      : 0;

  // 3. Aggregate REAL fasting metrics (strictly zero if empty)
  let totalFastHours = 0;
  filteredFasts.forEach((f) => {
    const end = f.endTime || Date.now();
    const duration = Math.max(0, (end - f.startTime) / (1000 * 3600));
    totalFastHours += duration;
  });

  const completedFastsCount = filteredFasts.filter((f) => f.completed).length;
  const avgFastHours = filteredFasts.length > 0 ? totalFastHours / filteredFasts.length : 0;

  // 4. Hydration aggregation (real recorded water)
  const totalWaterMl = waterTodayMl || 0;

  // 5. Real consistency rate
  let expectedDays = 1;
  if (timeframe === 'month') expectedDays = Math.max(1, now.getDate());
  if (timeframe === 'year') expectedDays = Math.max(1, Math.floor((now.getTime() - startOfYear) / (1000 * 3600 * 24)));

  const activeDays = new Set([
    ...filteredWalks.map((w) => new Date(w.startTime).toDateString()),
    ...filteredFasts.map((f) => new Date(f.startTime).toDateString()),
  ]).size;

  const consistencyRatePercent = Math.min(100, Math.round((activeDays / expectedDays) * 100));

  // 6. Build 100% Real Chart Points
  const chartData: SummaryChartPoint[] = [];

  if (timeframe === 'day') {
    // 24-hour slots grouped into 4-hour intervals
    const intervals = [
      { label: '04:00', startH: 4, endH: 8 },
      { label: '08:00', startH: 8, endH: 12 },
      { label: '12:00', startH: 12, endH: 16 },
      { label: '16:00', startH: 16, endH: 20 },
      { label: '20:00', startH: 20, endH: 24 },
      { label: '00:00', startH: 0, endH: 4 },
    ];

    intervals.forEach((int) => {
      const walksInSlot = filteredWalks.filter((w) => {
        const h = new Date(w.startTime).getHours();
        return h >= int.startH && h < int.endH;
      });
      const distKm = walksInSlot.reduce((acc, w) => acc + (w.distanceMeters || 0) / 1000, 0);
      const cals = walksInSlot.reduce((acc, w) => acc + (w.caloriesBurned || 0), 0);

      // Fasting hours in this slot
      const fastsInSlot = filteredFasts.filter((f) => {
        const h = new Date(f.startTime).getHours();
        return h >= int.startH && h < int.endH;
      });
      let slotFastHours = 0;
      fastsInSlot.forEach((f) => {
        const end = f.endTime || Date.now();
        slotFastHours += Math.max(0, (end - f.startTime) / (1000 * 3600));
      });

      chartData.push({
        label: int.label,
        distanceKm: parseFloat(distKm.toFixed(2)),
        fastHours: parseFloat(slotFastHours.toFixed(1)),
        calories: cals,
      });
    });
  } else if (timeframe === 'month') {
    // 4 weeks breakdown of real records
    for (let w = 1; w <= 4; w++) {
      const weekWalks = filteredWalks.filter((walk) => {
        const d = new Date(walk.startTime).getDate();
        return d > (w - 1) * 7 && d <= w * 7;
      });
      const weekFasts = filteredFasts.filter((fast) => {
        const d = new Date(fast.startTime).getDate();
        return d > (w - 1) * 7 && d <= w * 7;
      });

      const dist = weekWalks.reduce((acc, x) => acc + (x.distanceMeters || 0) / 1000, 0);
      const cals = weekWalks.reduce((acc, x) => acc + (x.caloriesBurned || 0), 0);
      let weekFastHours = 0;
      weekFasts.forEach((f) => {
        const end = f.endTime || Date.now();
        weekFastHours += Math.max(0, (end - f.startTime) / (1000 * 3600));
      });

      chartData.push({
        label: `W${w}`,
        sublabel: `Week ${w}`,
        distanceKm: parseFloat(dist.toFixed(2)),
        fastHours: parseFloat(weekFastHours.toFixed(1)),
        calories: cals,
      });
    }
  } else {
    // 12 Months breakdown of real records
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    months.forEach((m, idx) => {
      const monthWalks = filteredWalks.filter((w) => new Date(w.startTime).getMonth() === idx);
      const monthFasts = filteredFasts.filter((f) => new Date(f.startTime).getMonth() === idx);

      const dist = monthWalks.reduce((acc, x) => acc + (x.distanceMeters || 0) / 1000, 0);
      const cals = monthWalks.reduce((acc, x) => acc + (x.caloriesBurned || 0), 0);
      let monthFastHours = 0;
      monthFasts.forEach((f) => {
        const end = f.endTime || Date.now();
        monthFastHours += Math.max(0, (end - f.startTime) / (1000 * 3600));
      });

      chartData.push({
        label: m,
        distanceKm: parseFloat(dist.toFixed(2)),
        fastHours: parseFloat(monthFastHours.toFixed(1)),
        calories: cals,
      });
    });
  }

  return {
    timeframe,
    label: periodLabel,
    totalDistanceMeters,
    totalWalkDurationSeconds,
    avgPaceSecondsPerKm,
    totalCalories,
    totalSteps,
    totalFastHours: parseFloat(totalFastHours.toFixed(1)),
    avgFastHours: parseFloat(avgFastHours.toFixed(1)),
    completedFastsCount,
    totalWaterMl,
    consistencyRatePercent,
    chartData,
  };
}
