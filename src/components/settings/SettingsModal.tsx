import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserSettings } from '../../types';
import { storage } from '../../utils/storage';
import { sound } from '../../utils/audio';
import {
  X,
  User,
  Activity,
  Volume2,
  Download,
  Upload,
  Check,
  Server,
  Sparkles,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onClose: () => void;
  onSave: (updated: UserSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onClose,
  onSave,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<UserSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [importStatus, setImportStatus] = useState<string>('');

  const handleSave = () => {
    sound.playClick();
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 700);
  };

  const handleExport = () => {
    sound.playClick();
    const dataStr = storage.exportAllData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kinetic-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = storage.importAllData(content);
      if (success) {
        setImportStatus('Data successfully imported. Reloading...');
        sound.playMilestone();
        setTimeout(() => window.location.reload(), 1000);
      } else {
        setImportStatus('Invalid backup file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-lg bg-white border border-black/10 rounded-[32px] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-black text-[#E8F84A] flex items-center justify-center shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-950 font-['Outfit'] uppercase">
                PREFERENCES & TELEMETRY
              </h3>
              <p className="text-xs text-slate-400 font-medium">Biometric configuration & AI integration</p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Section 1: Biometrics */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-black mb-3 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              BIOMETRIC & CADENCE PROFILES
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-bold">User Name</label>
                <input
                  type="text"
                  value={formData.userName}
                  onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] text-slate-900 text-xs outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-bold">
                  Brisk Walk Target Pace (min/km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.targetPaceMinPerKm}
                  onChange={(e) =>
                    setFormData({ ...formData, targetPaceMinPerKm: parseFloat(e.target.value) || 7.5 })
                  }
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] text-slate-900 text-xs outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-bold">
                  Body Weight (KG) - Caloric Baseline
                </label>
                <input
                  type="number"
                  value={formData.weightKg}
                  onChange={(e) =>
                    setFormData({ ...formData, weightKg: parseFloat(e.target.value) || 70 })
                  }
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] text-slate-900 text-xs outline-none focus:border-black font-semibold"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1 font-bold">Height (CM)</label>
                <input
                  type="number"
                  value={formData.heightCm}
                  onChange={(e) =>
                    setFormData({ ...formData, heightCm: parseFloat(e.target.value) || 170 })
                  }
                  className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] text-slate-900 text-xs outline-none focus:border-black font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: AI Configuration */}
          <div className="pt-2 border-t border-black/[0.06]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-black mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              INTELLIGENCE ENGINE
            </h4>
            <p className="text-[11px] text-slate-500 mb-3 font-medium">
              By default, KINETIC uses its built-in sports science engine (zero API key required). To connect directly to Google Gemini 2.5 Flash, enter your API Key below:
            </p>

            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy... (Gemini API Key)"
                value={formData.geminiApiKey}
                onChange={(e) => setFormData({ ...formData, geminiApiKey: e.target.value })}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.06] text-slate-900 text-xs font-mono outline-none focus:border-black"
              />
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-purple-600 font-bold hover:underline mt-1.5 block"
            >
              + Get free Gemini API Key from Google AI Studio →
            </a>
          </div>

          {/* Section 3: Audio & Alerts */}
          <div className="pt-2 border-t border-black/[0.06]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-900 font-black mb-3 flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-sky-600" />
              AUDIO & VOICE HUD
            </h4>

            <div className="space-y-2.5">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.04] cursor-pointer">
                <div>
                  <span className="text-xs font-black text-slate-900 block font-['Outfit']">
                    Tactile Audio Synthesizer
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Futuristic micro-ticks and milestone chimes
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.soundEnabled}
                  onChange={(e) => setFormData({ ...formData, soundEnabled: e.target.checked })}
                  className="w-4 h-4 accent-black rounded"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-[#F5F2EB] border border-black/[0.04] cursor-pointer">
                <div>
                  <span className="text-xs font-black text-slate-900 block font-['Outfit']">
                    Turn-by-Turn Voice Navigation
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    Spoken turn guidance during navigation
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.voiceGuidanceEnabled}
                  onChange={(e) =>
                    setFormData({ ...formData, voiceGuidanceEnabled: e.target.checked })
                  }
                  className="w-4 h-4 accent-black rounded"
                />
              </label>
            </div>
          </div>

          {/* Section 4: Data Backup */}
          <div className="pt-2 border-t border-black/[0.06]">
            <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 font-black mb-3 flex items-center gap-2">
              <Server className="w-4 h-4" />
              LOCAL DATA BACKUP
            </h4>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="flex-1 py-2.5 px-3 rounded-2xl bg-[#F5F2EB] hover:bg-slate-200 text-slate-800 text-xs font-black font-['Outfit'] uppercase flex items-center justify-center gap-2 transition-all shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>EXPORT JSON</span>
              </button>

              <label className="flex-1 py-2.5 px-3 rounded-2xl bg-[#F5F2EB] hover:bg-slate-200 text-slate-800 text-xs font-black font-['Outfit'] uppercase flex items-center justify-center gap-2 cursor-pointer transition-all shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>IMPORT JSON</span>
                <input type="file" accept=".json" onChange={handleImport} className="hidden" />
              </label>
            </div>
            {importStatus && (
              <p className="text-[11px] text-emerald-600 mt-2 font-mono text-center font-bold">
                {importStatus}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-black/[0.06] flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono font-medium">
            KINETIC OS • Editorial Edition
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 text-xs font-bold font-mono"
            >
              CANCEL
            </button>

            <motion.button
              whileTap={{ scale: 0.94 }}
              onClick={handleSave}
              className="py-2.5 px-5 rounded-2xl bg-black text-[#E8F84A] font-black text-xs flex items-center gap-1.5 shadow-md font-['Outfit'] uppercase"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>SAVED!</span>
                </>
              ) : (
                <span>SAVE SETTINGS</span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
