import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  User,
  Eye,
  EyeOff,
  Zap,
  Shield,
  Activity,
  Flame,
  Footprints,
  Camera,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '../../services/authService';
import { AuthUser } from '../../types';
import { sound } from '../../utils/audio';

interface AuthViewProps {
  onSuccess: (user: AuthUser, isNewRegistration?: boolean) => void;
  onGuestExplore: () => void;
}

type AuthScreen = 'gateway' | 'register' | 'login';

export const AuthView: React.FC<AuthViewProps> = ({
  onSuccess,
  onGuestExplore,
}) => {
  const [screen, setScreen] = useState<AuthScreen>('gateway');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleNavigate = (target: AuthScreen) => {
    sound.playClick();
    resetMessages();
    setScreen(target);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please enter an athlete username.');
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
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    setIsLoading(true);
    sound.playClick();

    try {
      const res = await authService.register(cleanUser, password);
      if (res.success && res.user) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#E8F84A', '#FFFFFF', '#10B981'],
        });
        sound.playCelebration();
        setSuccessMessage('Vault created! Launching your Biometric Consultation...');
        setTimeout(() => {
          onSuccess(res.user!, true); // isNewRegistration = true
        }, 600);
      } else {
        setErrorMessage(res.error || 'Failed to create vault account.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network connection failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please enter your username.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    sound.playClick();

    try {
      const res = await authService.login(cleanUser, password);
      if (res.success && res.user) {
        sound.playNotification();
        setSuccessMessage('Vault decrypted. Welcome back!');
        setTimeout(() => {
          onSuccess(res.user!, false);
        }, 500);
      } else {
        setErrorMessage(res.error || 'Invalid username or password.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Authentication service unreachable.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#09090B] text-white flex flex-col font-['Outfit'] selection:bg-[#E8F84A] selection:text-black relative overflow-x-hidden">
      {/* Dynamic Background Atmosphere */}
      <div className="fixed top-[-15%] right-[-10%] w-[650px] h-[650px] rounded-full bg-[#E8F84A]/10 blur-[130px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[140px] pointer-events-none" />

      {/* Grid Pattern Overlay */}
      <div
        className="fixed inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)`,
          backgroundSize: '36px 36px',
        }}
      />

      {/* Top Header Navigation */}
      <header className="relative z-20 w-full max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <div
          onClick={() => handleNavigate('gateway')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#E8F84A] text-black flex items-center justify-center font-black shadow-[0_0_20px_rgba(232,248,74,0.3)] transition-transform group-hover:scale-105">
            <Zap className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white uppercase">
                STRIDE
              </span>
              <span className="px-2 py-0.5 rounded-full bg-white/10 text-[#E8F84A] text-[9px] font-mono font-bold tracking-wider border border-[#E8F84A]/20">
                ATHLETE OS
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-mono tracking-tight">
              FAST • WALK • RECOVER
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {screen !== 'gateway' ? (
            <button
              onClick={() => handleNavigate('gateway')}
              className="text-xs font-mono font-bold text-zinc-400 hover:text-white px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-white/20 transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-white/10 text-[11px] font-mono text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-[#E8F84A] animate-pulse" />
              <span>VAULT ENGINES ONLINE</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Content View Switcher */}
      <main className="relative z-10 flex-1 max-w-5xl w-full mx-auto px-6 py-6 sm:py-12 flex flex-col items-center justify-center">
        <AnimatePresence mode="wait">
          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 1: GATEWAY (HIGH ENERGY ATHLETIC HUB)                     */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {screen === 'gateway' && (
            <motion.div
              key="gateway"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center text-center space-y-8"
            >
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900 border border-white/10 shadow-inner">
                <span className="px-2 py-0.5 rounded-full bg-[#E8F84A] text-black font-mono font-black text-[10px]">
                  NEW
                </span>
                <span className="text-xs font-medium text-zinc-300">
                  Strava-Grade HUD • AI Food Scanner • Bio-Consultation
                </span>
              </div>

              {/* Athletic Hero Typography */}
              <div className="space-y-3 max-w-2xl">
                <h1 className="text-5xl sm:text-7xl font-black tracking-tight leading-[0.95] uppercase">
                  FAST. WALK. <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#E8F84A] via-lime-300 to-emerald-400">
                    TRACK.
                  </span>
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 max-w-lg mx-auto font-normal leading-relaxed pt-2">
                  Zero fluff. Real metabolic telemetry. Intermittent fasting, Zone 2 brisk walk cadence, and AI camera macro tracking.
                </p>
              </div>

              {/* Distinct Action Buttons for User vs Guest */}
              <div className="w-full max-w-md space-y-3 pt-2">
                {/* 1. Create Account (Primary) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigate('register')}
                  className="w-full py-4 px-6 rounded-2xl bg-[#E8F84A] text-black font-black text-base uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(232,248,74,0.25)] hover:bg-[#d9e843] transition-colors"
                >
                  <Sparkles className="w-5 h-5 fill-black" />
                  <span>Create Athlete Account</span>
                  <ArrowRight className="w-5 h-5 ml-1" />
                </motion.button>

                {/* 2. Sign In (Dedicated) */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleNavigate('login')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-white/10 transition-colors"
                >
                  <Lock className="w-4 h-4 text-zinc-400" />
                  <span>Sign In to Existing Vault</span>
                </motion.button>
              </div>

              {/* Distinct Guest Mode Card */}
              <div className="w-full max-w-md rounded-2xl bg-zinc-950/80 border border-zinc-800/80 p-4 text-left flex items-center justify-between gap-4 mt-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-200">
                      Guest Pass
                    </span>
                    <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      Preview Only
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 leading-tight">
                    Try the live GPS tracker & timer. Data is not saved to cloud.
                  </p>
                </div>
                <button
                  onClick={onGuestExplore}
                  className="shrink-0 px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                >
                  <span>Quick Demo</span>
                  <ArrowRight className="w-3 h-3 text-zinc-400" />
                </button>
              </div>

              {/* Telemetry Feature Bento Highlights */}
              <div className="w-full max-w-3xl grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 text-left">
                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <Flame className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Autophagy Engine
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    16:8 / 18:6 intermittent fasting with cellular ketosis tracking.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-[#E8F84A]/10 text-[#E8F84A] flex items-center justify-center">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Strava-Grade Brisk Walk
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Real-time Zone 2 cadence, split pacing, and shareable athlete cards.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 space-y-1.5">
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center">
                    <Camera className="w-4 h-4" />
                  </div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Food Vision
                  </h3>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    Snap any meal photo. AI extracts calories and macros in seconds.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 2: DEDICATED REGISTRATION FORM                            */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {screen === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6"
            >
              {/* Header */}
              <div className="space-y-1 text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E8F84A]/10 text-[#E8F84A] text-[10px] font-mono font-bold uppercase mb-2">
                  <Sparkles className="w-3 h-3" />
                  <span>STEP 1 OF 2 • ACCOUNT SETUP</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                  CREATE ATHLETE VAULT
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Your private biometric consultation starts immediately upon account creation.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleRegister} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    Athlete Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. farris_stride"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-[#E8F84A] transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 4 characters"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-[#E8F84A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type password"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-[#E8F84A] transition-colors"
                    />
                  </div>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-[#E8F84A] hover:bg-[#d9e843] text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Provisioning Vault...</span>
                  ) : (
                    <>
                      <span>Create Account & Calibrate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Switcher */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Already have a vault?</span>
                <button
                  onClick={() => handleNavigate('login')}
                  className="text-[#E8F84A] font-bold hover:underline"
                >
                  Sign In Instead →
                </button>
              </div>
            </motion.div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* SCREEN 3: DEDICATED SIGN IN FORM                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {screen === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-md bg-zinc-900/90 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.8)] space-y-6"
            >
              {/* Header */}
              <div className="space-y-1 text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-white text-[10px] font-mono font-bold uppercase mb-2">
                  <Lock className="w-3 h-3 text-[#E8F84A]" />
                  <span>VAULT AUTHENTICATION</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white uppercase">
                  SIGN IN TO VAULT
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Enter your credentials to decrypt your walks, fasts, and biometric records.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      autoComplete="username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your registered username"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-[#E8F84A] transition-colors"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5 text-left">
                  <label className="text-[11px] font-mono font-bold text-zinc-300 uppercase tracking-wider block">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white placeholder-zinc-600 text-sm font-medium focus:outline-none focus:border-[#E8F84A] transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-500 hover:text-zinc-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Alerts */}
                {errorMessage && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}
                {successMessage && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 text-left">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {/* Submit */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                  type="submit"
                  className="w-full py-3.5 px-6 rounded-xl bg-white hover:bg-zinc-200 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <span>Authenticating...</span>
                  ) : (
                    <>
                      <span>Enter Vault Cockpit</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </form>

              {/* Bottom Switcher */}
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                <span>Need a new vault?</span>
                <button
                  onClick={() => handleNavigate('register')}
                  className="text-[#E8F84A] font-bold hover:underline"
                >
                  Create Account Now →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between text-zinc-600 text-xs gap-3">
        <div className="flex items-center gap-2 font-mono">
          <Shield className="w-3.5 h-3.5 text-[#E8F84A]" />
          <span>ZERO 3RD-PARTY TRACKING • PERSISTENT ENCRYPTED COCKPIT</span>
        </div>
        <div className="font-mono text-[11px]">
          STRIDE TELEMETRY v2.5
        </div>
      </footer>
    </div>
  );
};
