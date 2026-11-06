import { UserSettings, FastingState, BriskwalkSession } from '../types';

const STORAGE_KEYS = {
  SETTINGS: 'apex_settings_v1',
  FASTING: 'apex_fasting_v1',
  BRISKWALK_HISTORY: 'apex_briskwalk_history_v1',
  NAV_RECENT: 'apex_nav_recent_v1',
};

export const DEFAULT_SETTINGS: UserSettings = {
  userName: 'Farris',
  weightKg: 72,
  heightCm: 175,
  targetPaceMinPerKm: 7.5, // 7 min 30 sec / km brisk walk
  preferredFastingProtocol: '16-8',
  geminiApiKey: '',
  soundEnabled: true,
  voiceGuidanceEnabled: true,
  voiceLanguage: 'ms-MY',
  darkTheme: 'obsidian',
  unit: 'metric',
};

export const DEFAULT_FASTING_STATE: FastingState = {
  isActive: false,
  currentFast: null,
  selectedProtocol: '16-8',
  customHours: 16,
  waterIntakeTodayMl: 0,
  waterGoalMl: 2500,
  history: [],
};

export const storage = {
  getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: UserSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getFastingState(): FastingState {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FASTING);
      if (!data) return DEFAULT_FASTING_STATE;
      return { ...DEFAULT_FASTING_STATE, ...JSON.parse(data) };
    } catch {
      return DEFAULT_FASTING_STATE;
    }
  },

  saveFastingState(state: FastingState): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FASTING, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save fasting state', e);
    }
  },

  getWalkHistory(): BriskwalkSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BRISKWALK_HISTORY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveWalkHistory(history: BriskwalkSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BRISKWALK_HISTORY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save walk history', e);
    }
  },

  addWalkSession(session: BriskwalkSession): void {
    const list = this.getWalkHistory();
    list.unshift(session);
    // Keep last 50 sessions
    this.saveWalkHistory(list.slice(0, 50));
  },

  // Export all user data as JSON
  exportAllData(): string {
    const backup = {
      settings: this.getSettings(),
      fasting: this.getFastingState(),
      briskwalkHistory: this.getWalkHistory(),
      exportedAt: new Date().toISOString(),
      version: '1.0',
    };
    return JSON.stringify(backup, null, 2);
  },

  // Import user data from JSON
  importAllData(jsonStr: string): boolean {
    try {
      const backup = JSON.parse(jsonStr);
      if (backup.settings) this.saveSettings(backup.settings);
      if (backup.fasting) this.saveFastingState(backup.fasting);
      if (backup.briskwalkHistory) this.saveWalkHistory(backup.briskwalkHistory);
      return true;
    } catch {
      return false;
    }
  },
};
