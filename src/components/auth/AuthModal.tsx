import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, ArrowRight, Sparkles, CheckCircle2, AlertCircle, X, Zap } from 'lucide-react';
import confetti from 'canvas-confetti';
import { authService } from '../../services/authService';
import { AuthUser } from '../../types';
import { sound } from '../../utils/audio';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: AuthUser) => void;
  isMandatory?: boolean;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  isMandatory = false,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanUser = username.trim();
    if (!cleanUser) {
      setErrorMessage('Please enter a username.');
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
            particleCount: 60,
            spread: 55,
            origin: { y: 0.6 },
            colors: ['#E8F84A', '#000000', '#10B981'],
          });
          sound.playCelebration();
          setSuccessMessage('Account created! Initializing personal vault...');
          setTimeout(() => {
            onSuccess(res.user!);
            if (onClose) onClose();
          }, 600);
        } else {
          setErrorMessage(res.error || 'Failed to create account.');
        }
      } else {
        const res = await authService.login(cleanUser, password);
        if (res.success && res.user) {
          sound.playNotification();
          setSuccessMessage('Welcome back! Loading your telemetry...');
          setTimeout(() => {
            onSuccess(res.user!);
            if (onClose) onClose();
          }, 500);
        } else {
          setErrorMessage(res.error || 'Invalid credentials.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    const demoUser = `user_${Math.floor(Math.random() * 900 + 100)}`;
    const demoPass = 'kinetic2025';
    setUsername(demoUser);
    setPassword(demoPass);
    setIsLoading(true);
    setErrorMessage(null);

    const res = await authService.register(demoUser, demoPass);
    setIsLoading(false);
    if (res.success && res.user) {
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#E8F84A', '#000000'],
      });
      sound.playCelebration();
      onSuccess(res.user);
      if (onClose) onClose();
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
        
        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md bg-white rounded-3xl p-7 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] border border-black/[0.08] overflow-hidden"
        >
          {/* Subtle Ambient Background Blob */}
          <div className="absolute -top-16 -right-16 w-44 h-44 bg-[#E8F84A]/30 rounded-full blur-3xl pointer-events-none" />
          
          {/* Header Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center font-black shadow-sm">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-base font-black tracking-tight text-slate-950 font-['Outfit'] uppercase">
                    STRIDE OS
                  </h2>
                  <span className="px-1.5 py-0.5 rounded-full bg-[#E8F84A] text-slate-950 text-[9px] font-mono font-black border border-black/10">
                    CLOUD
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">
                  {mode === 'register' ? 'Join private metabolic vault' : 'Sign in to access your data'}
                </p>
              </div>
            </div>

            {!isMandatory && onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex p-1 mb-5 bg-[#F5F2EB] rounded-2xl border border-black/[0.04]">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage(null);
                sound.playClick();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'register'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMessage(null);
                sound.playClick();
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                mode === 'login'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
          </div>

          {/* Messages */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-medium flex items-center gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </motion.div>
          )}

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </motion.div>
          )}

          {/* Clean Minimalist Form: strictly Username & Password */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-black/[0.08] rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E8F84A] focus:border-black transition-all"
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
                  className="w-full pl-10 pr-11 py-2.5 bg-[#FAF8F5] border border-black/[0.08] rounded-2xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#E8F84A] focus:border-black transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Action Button */}
            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className="w-full mt-2 py-3 px-4 rounded-2xl bg-slate-950 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-black transition-all shadow-md group disabled:opacity-70"
            >
              <span>{isLoading ? 'Processing...' : mode === 'register' ? 'Create Account & Enter' : 'Sign In to Vault'}</span>
              {!isLoading && <ArrowRight className="w-4 h-4 text-[#E8F84A] group-hover:translate-x-0.5 transition-transform" />}
            </motion.button>
          </form>

          {/* Quick Instant Demo Option */}
          <div className="mt-5 pt-4 border-t border-black/[0.06] flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Testing with friends?</span>
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#E8F84A]/30 hover:bg-[#E8F84A]/60 text-slate-950 font-bold text-[11px] transition-colors border border-black/10"
            >
              <Sparkles className="w-3.5 h-3.5 text-slate-950" />
              <span>Instant 1-Click Pass</span>
            </button>
          </div>

          {/* Multi-tenant security guarantee note */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-mono">
              🔒 Multi-User Isolated SQLite WAL • Zero telemetry shared
            </p>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
