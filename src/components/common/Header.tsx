import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Settings, Zap, Flame, Footprints, User, LogOut, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastingState, UserSettings, ActiveTab, AuthUser } from '../../types';
import { sound } from '../../utils/audio';

interface HeaderProps {
  fastingState: FastingState;
  userSettings: UserSettings;
  activeTab: ActiveTab;
  isWalkActive: boolean;
  currentUser: AuthUser | null;
  onOpenSettings: () => void;
  onToggleSound: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  fastingState,
  userSettings,
  isWalkActive,
  currentUser,
  onOpenSettings,
  onToggleSound,
  onOpenAuth,
  onLogout,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fastingElapsedHrs =
    fastingState.isActive && fastingState.currentFast
      ? (Date.now() - fastingState.currentFast.startTime) / (1000 * 3600)
      : 0;

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-[#f5f2eb]/85 border-b border-black/[0.05] transition-all">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand identity - Editorial Gen Z */}
        <motion.div 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <div className="w-9 h-9 rounded-2xl bg-black text-white flex items-center justify-center font-black shadow-sm">
            <Zap className="w-4 h-4 fill-current text-[#E8F84A]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black tracking-tight text-slate-950 font-['Outfit'] uppercase">
                KINETIC
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#E8F84A] text-slate-950 text-[9px] font-mono font-black border border-black/10">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium tracking-tight">
              {currentUser ? `@${currentUser.username}` : userSettings.userName} • SQLite Telemetry
            </p>
          </div>
        </motion.div>

        {/* Dynamic Island Pill (Center) */}
        <motion.div 
          layout
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 border border-black/[0.08] shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
        >
          <AnimatePresence mode="wait">
            {isWalkActive ? (
              <motion.div
                key="walk"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-600"
              >
                <Footprints className="w-3.5 h-3.5 animate-bounce" />
                <span>TRACKING LIVE</span>
              </motion.div>
            ) : fastingState.isActive ? (
              <motion.div
                key="fast"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold text-rose-500"
              >
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse" />
                <span>FASTING {fastingElapsedHrs.toFixed(1)}H</span>
              </motion.div>
            ) : (
              <motion.span
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs font-mono font-semibold text-slate-700 tracking-wider"
              >
                {currentTime || '00:00:00'}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        {/* User & Settings Controls */}
        <div className="flex items-center gap-2">
          
          {/* User Account Button & Dropdown */}
          <div className="relative" ref={menuRef}>
            {currentUser ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sound.playClick();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-900 shadow-xs transition-all"
              >
                <div className="w-5 h-5 rounded-full bg-[#E8F84A] text-slate-950 flex items-center justify-center text-[10px] font-black border border-black/10">
                  {currentUser.username.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-bold font-mono text-slate-800">
                  {currentUser.username}
                </span>
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  sound.playClick();
                  onOpenAuth();
                }}
                className="px-3 py-1.5 rounded-2xl bg-slate-950 text-[#E8F84A] text-xs font-bold flex items-center gap-1.5 shadow-xs"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </motion.button>
            )}

            {/* User Dropdown Menu */}
            <AnimatePresence>
              {isUserMenuOpen && currentUser && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-3 shadow-xl border border-black/[0.08] z-50"
                >
                  <div className="pb-2.5 mb-2 border-b border-black/[0.06]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#E8F84A] text-slate-950 flex items-center justify-center text-xs font-black">
                        {currentUser.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {currentUser.displayName || currentUser.username}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono truncate">
                          @{currentUser.username}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                      <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>Isolated SQLite Active</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenAuth();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span>Switch Account</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      sound.playNotification();
                      onLogout();
                    }}
                    className="w-full text-left mt-1 px-2.5 py-1.5 rounded-xl text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              sound.playClick();
              onToggleSound();
            }}
            className={`p-2.5 rounded-2xl transition-all border shadow-xs ${
              userSettings.soundEnabled
                ? 'bg-white border-black/[0.08] text-slate-800 hover:bg-slate-50'
                : 'bg-black/[0.03] border-transparent text-slate-400'
            }`}
            title={userSettings.soundEnabled ? 'Mute' : 'Unmute'}
          >
            {userSettings.soundEnabled ? (
              <Volume2 className="w-4 h-4 text-slate-900" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-black/[0.08] text-slate-800 transition-all shadow-xs"
            title="Preferences"
          >
            <Settings className="w-4 h-4" />
          </motion.button>
        </div>

      </div>
    </header>
  );
};
