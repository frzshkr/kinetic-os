import React from 'react';
import { Flame, Footprints, HeartPulse, Sparkles, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActiveTab } from '../../types';
import { sound } from '../../utils/audio';

interface NavigationBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isFastingActive: boolean;
  isWalkActive: boolean;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabChange,
  isFastingActive,
  isWalkActive,
}) => {
  const tabs = [
    {
      id: 'fasting' as ActiveTab,
      label: 'Fast',
      badge: isFastingActive ? 'ON' : '16:8',
      icon: Flame,
    },
    {
      id: 'briskwalk' as ActiveTab,
      label: 'Move',
      badge: isWalkActive ? 'LIVE' : 'GPS',
      icon: Footprints,
    },
    {
      id: 'health' as ActiveTab,
      label: 'Bio',
      badge: 'HEALTH',
      icon: HeartPulse,
    },
    {
      id: 'analytics' as ActiveTab,
      label: 'Stats',
      badge: 'METRICS',
      icon: BarChart3,
    },
    {
      id: 'assistant' as ActiveTab,
      label: 'Coach',
      badge: 'AI COACH',
      icon: Sparkles,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 p-2.5 sm:p-4 pb-[max(0.6rem,env(safe-area-inset-bottom))] pointer-events-none">
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
        className="max-w-lg mx-auto backdrop-blur-2xl bg-black/92 text-white rounded-[24px] sm:rounded-[28px] p-1 sm:p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.25)] pointer-events-auto border border-white/10"
      >
        <div className="grid grid-cols-5 gap-1 relative">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  onTabChange(tab.id);
                }}
                className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 z-10 ${
                  isActive ? 'text-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                {/* Framer Motion Sliding Pill Indicator */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-[#E8F84A] rounded-2xl shadow-sm z-[-1]"
                  />
                )}

                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 transition-transform ${isActive ? 'scale-110' : ''}`} />
                
                <span className="text-[10px] sm:text-[11px] font-black tracking-tight font-['Outfit']">
                  {tab.label}
                </span>

                <span className={`text-[8px] sm:text-[9px] font-mono font-bold leading-none mt-0.5 truncate max-w-full ${isActive ? 'text-black/80' : 'text-slate-500'}`}>
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </nav>
  );
};
