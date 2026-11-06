import React from 'react';
import { motion } from 'framer-motion';
import { RouteManeuver } from '../../types';
import { formatNavDistance } from '../../utils/geo';
import { voice } from '../../utils/speech';
import {
  ArrowUp,
  ArrowUpLeft,
  ArrowUpRight,
  CornerUpLeft,
  CornerUpRight,
  RotateCw,
  MapPin,
  Volume2,
  VolumeX,
} from 'lucide-react';

interface TurnByTurnBannerProps {
  currentManeuver: RouteManeuver | null;
  nextManeuver: RouteManeuver | null;
  distanceToTurnMeters: number;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

export const TurnByTurnBanner: React.FC<TurnByTurnBannerProps> = ({
  currentManeuver,
  nextManeuver,
  distanceToTurnMeters,
  voiceEnabled,
  onToggleVoice,
}) => {
  if (!currentManeuver) return null;

  const renderManeuverIcon = (type: string, modifier?: string) => {
    const className = 'w-7 h-7 text-white';
    if (type === 'arrive') return <MapPin className={className} />;
    if (type === 'roundabout') return <RotateCw className={className} />;

    if (modifier?.includes('left')) {
      if (modifier.includes('slight')) return <ArrowUpLeft className={className} />;
      return <CornerUpLeft className={className} />;
    }
    if (modifier?.includes('right')) {
      if (modifier.includes('slight')) return <ArrowUpRight className={className} />;
      return <CornerUpRight className={className} />;
    }
    return <ArrowUp className={className} />;
  };

  return (
    <motion.div
      initial={{ y: -15, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="w-full bg-white/95 backdrop-blur-2xl border border-black/10 rounded-[28px] p-4 shadow-xl relative overflow-hidden"
    >
      {/* Top Accent Line */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-sky-400 via-indigo-500 to-[#E8F84A]" />

      <div className="flex items-center justify-between gap-4">
        {/* Maneuver Icon Box */}
        <div className="w-14 h-14 rounded-2xl bg-black text-white flex items-center justify-center shrink-0 shadow-sm">
          {renderManeuverIcon(currentManeuver.type, currentManeuver.modifier)}
        </div>

        {/* Turn Distance & Instruction */}
        <div className="flex-1 overflow-hidden">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-mono font-black text-slate-950 tracking-tight">
              {formatNavDistance(distanceToTurnMeters)}
            </span>
            <span className="text-xs font-mono uppercase text-sky-600 tracking-wider font-black">
              THEN
            </span>
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 truncate mt-0.5 font-['Outfit']">
            {currentManeuver.instruction}
          </h3>

          {nextManeuver && (
            <p className="text-[11px] text-slate-400 truncate mt-1 flex items-center gap-1 font-medium">
              <span className="text-slate-600 font-bold">NEXT:</span>
              <span>{nextManeuver.instruction}</span>
            </p>
          )}
        </div>

        {/* Voice Audio Speaker Toggle */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => {
            onToggleVoice();
            if (!voiceEnabled) {
              voice.speakManeuver(currentManeuver.instruction, distanceToTurnMeters);
            }
          }}
          className={`p-3 rounded-2xl border shrink-0 transition-all ${
            voiceEnabled
              ? 'bg-black text-[#E8F84A] border-black shadow-xs'
              : 'bg-slate-100 border-black/[0.04] text-slate-400'
          }`}
          title={voiceEnabled ? 'Voice Guidance Active' : 'Voice Guidance Muted'}
        >
          {voiceEnabled ? (
            <Volume2 className="w-5 h-5" />
          ) : (
            <VolumeX className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.div>
  );
};
