import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lock, User, Eye, EyeOff, Sparkles, CheckCircle2, AlertCircle, Zap, Shield, Flame, Footprints, Activity } from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '../../services/authService';
import { AuthUser } from '../../types';
import { sound } from '../../utils/audio';

interface AuthViewProps {
  onSuccess: (user: AuthUser) => void;
  onGuestExplore: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onGuestExplore,
}) => {
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please provide a username.');
      return;
    }
    if (cleanUser.length < 3) {
      setErrorMessage('Username must be at least 3 characters.');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMessage('Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);
    sound.playClick();

    try {
      if (mode === 'register') {
        const res = await authService.register(cleanUser, password);
        if (res.success && res.user) {
          confetti({
            particleCount: 70,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#E8F84A', '#000000', '#10B981'],
          });
          sound.playCelebration();
          setSuccessMessage('Vault provisioned. Entering your cockpit...');
          setTimeout(() => {
            onSuccess(res.user!);
          }, 600);
        } else {
          setErrorMessage(res.error || 'Failed to create vault.');
        }
      } else {
        const res = await authService.login(cleanUser, password);
        if (res.success && res.user) {
          sound.playNotification();
          setSuccessMessage('Credentials authenticated. Calibrating...');
          setTimeout(() => {
            onSuccess(res.user!);
          }, 500);
        } else {
          setErrorMessage(res.error || 'Invalid username or password.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F5F2EB] text-slate-900 flex flex-col font-['Outfit'] selection:bg-[#E8F84A] selection:text-black relative overflow-x-hidden">
      
      {/* Ambient Luxury Lighting Orbs */}
      <div className="fixed top-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#E8F84A]/30 via-emerald-100/20 to-transparent blur-3xl pointer-events-none" />
      <div className="fixed bottom-[-10%] left-[-5%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-100/40 via-orange-50/20 to-transparent blur-3xl pointer-events-none" />

      {/* Top Editorial Bar */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-md">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-slate-950 uppercase">
                KINETIC
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black text-[#E8F84A] text-[9px] font-mono font-bold tracking-wider">
                VAULT OS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium tracking-tight">
              HUMAN METABOLIC BIOENERGETICS
            </p>
          </div>
        </div>

        {/* Quick Guest Preview Button */}
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onGuestExplore}
          className="text-xs font-bold text-slate-700 hover:text-slate-950 px-4 py-2 rounded-2xl bg-white/80 hover:bg-white border border-black/[0.08] shadow-xs backdrop-blur-md transition-all flex items-center gap-1.5"
        >
          <span>Guest Preview</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
        </motion.button>
      </header>

      {/* Main Split Grid Showcase */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-16">
        
        {/* Left Column: High-End Editorial Manifesto */}
        <div className="flex-1 w-full max-w-xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/90 border border-black/[0.07] text-[11px] font-mono font-bold text-slate-800 shadow-xs mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>PRIVATE METABOLIC SYSTEM</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.05]">
              HUMAN <br className="hidden sm:inline" />
              PERFORMANCE, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-950 via-slate-800 to-slate-500">
                CALIBRATED.
              </span>
            </h1>

            <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-lg font-medium">
              Intermittent autophagy fasting, Zone 2 aerobic pacing, and systemic bio-recovery telemetry. Your personal metrics, isolated in your private vault.
            </p>
          </motion.div>

          {/* Interactive Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2"
          >
            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-2.5">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <p className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Autophagy
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                16:8 to OMAD
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2.5">
                <Footprints className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Zone 2 Walk
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                Live GPS Pace
              </p>
            </div>

            <div className="p-4 rounded-3xl bg-white/70 backdrop-blur-md border border-black/[0.06] shadow-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2.5">
                <Activity className="w-4 h-4" />
              </div>
              <p className="text-[11px] font-mono text-slate-400 font-bold uppercase tracking-wider">
                Recovery
              </p>
              <p className="text-sm font-black text-slate-900 mt-0.5">
                Daily Readiness
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Luxury Frosted Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md"
        >
          <div className="relative rounded-3xl bg-white/90 backdrop-blur-2xl p-8 sm:p-9 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.08)] border border-black/[0.07] overflow-hidden">
            
            {/* Ambient inner rim glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-[#E8F84A]/30 rounded-full blur-3xl pointer-events-none" />

            {/* Header & Mode Switcher */}
            <div className="relative mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-slate-950 tracking-tight">
                  {mode === 'register' ? 'Create Private Vault' : 'Welcome Back'}
                </h2>
                <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-slate-500 bg-black/[0.04] px-2 py-0.5 rounded-full">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  <span>Isolated</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                {mode === 'register'
                  ? 'Enter username & password to initialize your personal telemetry.'
                  : 'Authenticate to synchronize your bio-data vault.'}
              </p>

              {/* Fluid Pill Tabs */}
              <div className="mt-5 p-1 bg-[#F5F2EB] rounded-2xl border border-black/[0.04] flex relative">
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                    sound.playClick();
                  }}
                  className={`flex-1 relative py-2.5 text-xs font-bold rounded-xl transition-all z-10 ${
                    mode === 'register' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {mode === 'register' && (
                    <motion.div
                      layoutId="activeAuthPill"
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      className="absolute inset-0 bg-white rounded-xl shadow-xs z-[-1]"
                    />
                  )}
                  Create Account
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                    sound.playClick();
                  }}
                  className={`flex-1 relative py-2.5 text-xs font-bold rounded-xl transition-all z-10 ${
                    mode === 'login' ? 'text-slate-950' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {mode === 'login' && (
                    <motion.div
                      layoutId="activeAuthPill"
                      transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                      className="absolute inset-0 bg-white rounded-xl shadow-xs z-[-1]"
                    />
                  )}
                  Sign In
                </button>
              </div>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Success Message */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -8 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium flex items-center gap-2.5"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{successMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form Fields: Strictly Username & Password */}
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. farris"
                    className="w-full pl-10 pr-4 py-3 bg-[#FAF8F5] border border-black/[0.08] rounded-2xl text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-black/[0.05] focus:border-black transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-11 py-3 bg-[#FAF8F5] border border-black/[0.08] rounded-2xl text-slate-900 text-sm font-semibold placeholder-slate-400 focus:outline-hidden focus:ring-4 focus:ring-black/[0.05] focus:border-black transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-800 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-2 py-3.5 px-5 rounded-2xl bg-[#09090b] text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 hover:bg-black transition-all shadow-md group disabled:opacity-70"
              >
                <span>{isLoading ? 'Calibrating...' : mode === 'register' ? 'Initialize Vault' : 'Access Vault'}</span>
                {!isLoading && (
                  <ArrowRight className="w-4 h-4 text-[#E8F84A] group-hover:translate-x-1 transition-transform" />
                )}
              </motion.button>
            </form>

            {/* Seamless 1-Click Pass for Friends */}
            <div className="mt-6 pt-5 border-t border-black/[0.06] flex items-center justify-between text-xs">
              <span className="text-slate-400 font-medium">Visiting for a quick test?</span>
              <button
                type="button"
                onClick={onGuestExplore}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/[0.03] hover:bg-black/[0.06] text-slate-800 font-bold text-[11px] transition-colors border border-black/[0.06]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>One-Click Guest Pass</span>
              </button>
            </div>

          </div>
        </motion.div>

      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 w-full py-4 text-center">
        <p className="text-[11px] text-slate-400 font-mono tracking-wider">
          KINETIC PRO // PRECISION METABOLIC BIOENERGETICS • 2026
        </p>
      </footer>

    </div>
  );
};
