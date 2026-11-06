import React from 'react';
import { motion } from 'framer-motion';
import { ActivityType } from '../../types';
import { sound } from '../../utils/audio';
import { Flame, Footprints, Activity, Compass, Wind } from 'lucide-react';

interface ActivityTypeSelectorProps {
  selectedActivity: ActivityType;
  onSelectActivity: (type: ActivityType) => void;
  disabled?: boolean;
}

export const ACTIVITIES: {
  id: ActivityType;
  label: string;
  tagline: string;
  targetPace: string;
  cadenceRange: string;
  zone: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
}[] = [
  {
    id: 'brisk_walk',
    label: 'Brisk Walk',
    tagline: 'Zone 2 Fat Oxidation',
    targetPace: "7'30\" - 8'30\"",
    cadenceRange: '115 - 130 SPM',
    zone: 'ZONE 2 LIPID BURN',
    icon: Footprints,
    accentColor: '#10B981',
  },
  {
    id: 'running',
    label: 'Running',
    tagline: 'Cardio & Peak Endurance',
    targetPace: "4'30\" - 6'15\"",
    cadenceRange: '155 - 175 SPM',
    zone: 'CARDIO AEROBIC PEAK',
    icon: Wind,
    accentColor: '#E8F84A',
  },
  {
    id: 'fast_walk',
    label: 'Fast Walk',
    tagline: 'High Cadence Power Walk',
    targetPace: "6'30\" - 7'30\"",
    cadenceRange: '125 - 140 SPM',
    zone: 'POWER METABOLIC',
    icon: Activity,
    accentColor: '#38BDF8',
  },
  {
    id: 'jogging',
    label: 'Jogging',
    tagline: 'Steady Aerobic Stride',
    targetPace: "6'00\" - 7'00\"",
    cadenceRange: '140 - 160 SPM',
    zone: 'STEADY AEROBIC',
    icon: Flame,
    accentColor: '#F59E0B',
  },
  {
    id: 'casual_walk',
    label: 'Casual Walk',
    tagline: 'Parasympathetic Recovery',
    targetPace: "9'30\" - 12'00\"",
    cadenceRange: '90 - 110 SPM',
    zone: 'ACTIVE RECOVERY',
    icon: Compass,
    accentColor: '#94A3B8',
  },
];

export const ActivityTypeSelector: React.FC<ActivityTypeSelectorProps> = ({
  selectedActivity,
  onSelectActivity,
  disabled = false,
}) => {
  return (
    <div className="w-full space-y-2 font-['Outfit']">
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px] font-mono uppercase font-black tracking-wider text-slate-400">
          SELECT WORKOUT MODE
        </span>
        <span className="text-[10px] font-mono text-slate-500">
          Auto-calibrates pace & burn
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {ACTIVITIES.map((act) => {
          const isSelected = selectedActivity === act.id;
          const Icon = act.icon;

          return (
            <motion.button
              key={act.id}
              whileTap={!disabled ? { scale: 0.95 } : {}}
              disabled={disabled}
              onClick={() => {
                sound.playClick();
                onSelectActivity(act.id);
              }}
              className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? 'bg-black text-white border-black shadow-md ring-2 ring-[#E8F84A]/60'
                  : 'bg-white/80 hover:bg-white text-slate-800 border-black/[0.07] shadow-xs'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-[#E8F84A] text-black font-black' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                {isSelected && (
                  <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-white/20 text-[#E8F84A]">
                    ACTIVE
                  </span>
                )}
              </div>

              <div>
                <span className="text-xs font-black block tracking-tight uppercase">
                  {act.label}
                </span>
                <span
                  className={`text-[9px] block truncate font-medium mt-0.5 ${
                    isSelected ? 'text-zinc-400' : 'text-slate-400'
                  }`}
                >
                  {act.cadenceRange}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};
