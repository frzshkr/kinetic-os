import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastingProtocolId } from '../../types';
import { FASTING_PROTOCOLS } from '../../utils/metabolic';
import { sound } from '../../utils/audio';
import { Play, Square, Clock, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FastingControlsProps {
  isActive: boolean;
  selectedProtocol: FastingProtocolId;
  targetHours: number;
  onSelectProtocol: (id: FastingProtocolId) => void;
  onStartFast: () => void;
  onEndFast: (mood: 'great' | 'good' | 'neutral' | 'struggling') => void;
  onAdjustStartTime: (newStartTime: number) => void;
  currentStartTime?: number;
}

export const FastingControls: React.FC<FastingControlsProps> = ({
  isActive,
  selectedProtocol,
  targetHours,
  onSelectProtocol,
  onStartFast,
  onEndFast,
  onAdjustStartTime,
}) => {
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [showAdjustModal, setShowAdjustModal] = useState<boolean>(false);
  const [adjustHoursAgo, setAdjustHoursAgo] = useState<number>(0);
  const [selectedMood, setSelectedMood] = useState<'great' | 'good' | 'neutral' | 'struggling'>('great');

  const handleStart = () => {
    sound.playStart();
    onStartFast();
  };

  const handleConfirmEnd = () => {
    sound.playMilestone();
    confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 } });
    onEndFast(selectedMood);
    setShowEndModal(false);
  };

  const handleApplyAdjust = () => {
    if (adjustHoursAgo > 0) {
      const adjustedTimestamp = Date.now() - adjustHoursAgo * 3600 * 1000;
      onAdjustStartTime(adjustedTimestamp);
    }
    setShowAdjustModal(false);
  };

  return (
    <div className="w-full space-y-4">
      {/* Protocol Selector Chips */}
      {!isActive && (
        <div className="bg-white/80 backdrop-blur-xl rounded-[28px] p-5 border border-black/[0.06] shadow-sm">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-400 font-['Outfit']">
              SELECT PROTOCOL
            </span>
            <span className="text-xs font-mono font-black text-slate-900 bg-[#E8F84A] px-2.5 py-0.5 rounded-full border border-black/10">
              TARGET: {targetHours}H
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {FASTING_PROTOCOLS.map((proto) => {
              const isSelected = selectedProtocol === proto.id;
              return (
                <motion.button
                  key={proto.id}
                  whileTap={{ scale: 0.96 }}
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    sound.playClick();
                    onSelectProtocol(proto.id);
                  }}
                  className={`p-3.5 rounded-2xl text-left transition-all border ${
                    isSelected
                      ? 'bg-black text-white border-black shadow-md'
                      : 'bg-[#F9F7F2] border-black/[0.04] text-slate-700 hover:border-black/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs sm:text-sm font-['Outfit']">
                      {proto.name.split(' ')[0]}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-[#E8F84A] stroke-[3]" />}
                  </div>
                  <span className={`text-[10px] mt-0.5 block truncate font-medium ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {proto.name.split(' ').slice(1).join(' ')}
                  </span>
                  <span className={`text-[10px] font-mono mt-1.5 block font-bold ${isSelected ? 'text-[#E8F84A]' : 'text-slate-400'}`}>
                    {proto.fastHours}h fast / {proto.eatHours}h feed
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* Primary Action Button */}
      <div className="flex items-center gap-3">
        {!isActive ? (
          <motion.button
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleStart}
            className="flex-1 py-4 px-6 rounded-2xl bg-black text-[#E8F84A] hover:bg-slate-900 font-black text-base shadow-lg shadow-black/15 transition-all flex items-center justify-center gap-2 font-['Outfit'] uppercase tracking-wider"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START FAST ({targetHours}H)</span>
          </motion.button>
        ) : (
          <>
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.playClick();
                setShowEndModal(true);
              }}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-rose-500 text-white font-black text-sm sm:text-base transition-all flex items-center justify-center gap-2 shadow-md shadow-rose-500/20 font-['Outfit'] uppercase tracking-wider"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>END FAST</span>
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => {
                sound.playClick();
                setShowAdjustModal(true);
              }}
              className="py-3.5 px-4 rounded-2xl bg-white border border-black/[0.08] text-slate-800 font-bold text-sm transition-all flex items-center gap-2 shadow-xs"
              title="Adjust Start Time"
            >
              <Clock className="w-4 h-4 text-slate-500" />
              <span className="hidden sm:inline font-mono">ADJUST TIME</span>
            </motion.button>
          </>
        )}
      </div>

      {/* End Fast Modal */}
      <AnimatePresence>
        {showEndModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-black/10 rounded-[32px] p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-950 text-center mb-1 font-['Outfit'] uppercase tracking-tight">
                SESSION COMPLETED! 🎉
              </h3>
              <p className="text-xs text-slate-500 text-center mb-5 font-medium">
                How did your energy and hunger levels feel during this fast?
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[
                  { id: 'great', label: 'Energized', emoji: '⚡' },
                  { id: 'good', label: 'Good', emoji: '😊' },
                  { id: 'neutral', label: 'Normal', emoji: '😐' },
                  { id: 'struggling', label: 'Hungry', emoji: '🥵' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.id as any)}
                    className={`p-3 rounded-2xl border text-center transition-all ${
                      selectedMood === m.id
                        ? 'bg-black text-white border-black ring-2 ring-black/20'
                        : 'bg-[#F9F7F2] border-black/[0.04] text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl block mb-1">{m.emoji}</span>
                    <span className="text-[10px] font-black">{m.label}</span>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowEndModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold font-mono"
                >
                  DISCARD
                </button>
                <button
                  onClick={handleConfirmEnd}
                  className="flex-1 py-3 rounded-xl bg-black text-[#E8F84A] font-black text-xs shadow-md font-['Outfit'] uppercase"
                >
                  SAVE & CLOSE
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Adjust Start Time Modal */}
      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-sm bg-white border border-black/10 rounded-[32px] p-6 shadow-2xl"
            >
              <h3 className="text-xl font-black text-slate-950 text-center mb-1 font-['Outfit'] uppercase tracking-tight">
                ADJUST START TIME
              </h3>
              <p className="text-xs text-slate-500 text-center mb-5 font-medium">
                Forgot to start after dinner? Select how many hours ago your fast began:
              </p>

              <div className="grid grid-cols-4 gap-2 mb-6">
                {[1, 2, 3, 4, 6, 8, 10, 12].map((hours) => (
                  <button
                    key={hours}
                    onClick={() => setAdjustHoursAgo(hours)}
                    className={`py-2.5 px-2 rounded-xl text-xs font-mono font-black border transition-all ${
                      adjustHoursAgo === hours
                        ? 'bg-black text-[#E8F84A] border-black ring-2 ring-black/20'
                        : 'bg-[#F9F7F2] border-black/[0.04] text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    -{hours}h
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowAdjustModal(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-600 hover:text-slate-900 text-xs font-bold font-mono"
                >
                  CANCEL
                </button>
                <button
                  onClick={handleApplyAdjust}
                  className="flex-1 py-3 rounded-xl bg-black text-[#E8F84A] font-black text-xs font-['Outfit'] uppercase"
                >
                  UPDATE TIME
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
