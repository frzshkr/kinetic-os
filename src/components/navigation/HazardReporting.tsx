import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HazardReport } from '../../types';
import { sound } from '../../utils/audio';
import { AlertCircle, Shield, Camera, Car, AlertTriangle, Check } from 'lucide-react';

interface HazardReportingProps {
  currentLat: number;
  currentLng: number;
  onReportHazard: (report: HazardReport) => void;
}

export const HazardReporting: React.FC<HazardReportingProps> = ({
  currentLat,
  currentLng,
  onReportHazard,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [justReported, setJustReported] = useState<boolean>(false);

  const HAZARD_OPTIONS = [
    { type: 'police' as const, label: 'Police / Checkpoint', icon: Shield, color: 'text-blue-700 bg-blue-50 border-blue-200' },
    { type: 'camera' as const, label: 'Speed Camera / Radar', icon: Camera, color: 'text-amber-700 bg-amber-50 border-amber-200' },
    { type: 'traffic' as const, label: 'Heavy Traffic Jam', icon: Car, color: 'text-rose-700 bg-rose-50 border-rose-200' },
    { type: 'hazard' as const, label: 'Road Hazard / Debris', icon: AlertTriangle, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  ];

  const handleSelect = (option: typeof HAZARD_OPTIONS[0]) => {
    sound.playNavAlert();
    const newReport: HazardReport = {
      id: `hazard_${Date.now()}`,
      type: option.type,
      label: option.label,
      lat: currentLat,
      lng: currentLng,
      timestamp: Date.now(),
      confirmations: 1,
    };
    onReportHazard(newReport);
    setJustReported(true);
    setTimeout(() => {
      setJustReported(false);
      setIsOpen(false);
    }, 1200);
  };

  return (
    <div className="relative">
      <motion.button
        whileTap={{ scale: 0.94 }}
        onClick={() => {
          sound.playClick();
          setIsOpen(!isOpen);
        }}
        className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black text-[#E8F84A] font-black text-xs shadow-md transition-all font-['Outfit'] uppercase"
      >
        <AlertCircle className="w-4 h-4" />
        <span>REPORT RADAR</span>
      </motion.button>

      {/* Popover dialog */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            className="absolute bottom-full right-0 mb-3 w-64 bg-white border border-black/10 rounded-[28px] p-3.5 shadow-2xl z-40"
          >
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-black/[0.04]">
              <span className="text-xs font-black text-slate-900 uppercase tracking-wider font-['Outfit']">
                WAZE RADAR REPORT
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-800 font-mono"
              >
                CLOSE
              </button>
            </div>

            {justReported ? (
              <div className="py-4 text-center">
                <Check className="w-6 h-6 text-emerald-500 mx-auto mb-1 animate-bounce" />
                <p className="text-xs font-black text-slate-950 font-['Outfit']">ALERT BROADCASTED</p>
                <p className="text-[10px] text-slate-400 font-medium">Synced with local route radar.</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {HAZARD_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <motion.button
                      key={opt.type}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleSelect(opt)}
                      className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 transition-all text-left font-bold ${opt.color} hover:brightness-95`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="text-xs text-slate-900 font-bold">{opt.label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
