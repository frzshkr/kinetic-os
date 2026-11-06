import { FastingRecord, BriskwalkSession, UserSettings, DailyHealthLog } from '../types';
import { authService } from './authService';

function getAuthHeaders(): HeadersInit {
  const token = authService.getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const dbService = {
  async fetchAllData(): Promise<{
    settings: UserSettings | null;
    fasts: FastingRecord[];
    walks: BriskwalkSession[];
    healthLogs: DailyHealthLog[];
    userId?: string;
  } | null> {
    try {
      const res = await fetch('/api/db/sync', {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  },

  async syncFast(fast: FastingRecord): Promise<void> {
    try {
      await fetch('/api/db/fast', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(fast),
      });
    } catch (e) {
      console.warn('Offline: fast saved to local storage', e);
    }
  },

  async syncWalk(walk: BriskwalkSession): Promise<void> {
    try {
      await fetch('/api/db/walk', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(walk),
      });
    } catch (e) {
      console.warn('Offline: walk saved to local storage', e);
    }
  },

  async syncHealthLog(log: DailyHealthLog): Promise<void> {
    try {
      await fetch('/api/db/health', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(log),
      });
    } catch (e) {
      console.warn('Offline: health log saved to local storage', e);
    }
  },

  async syncSettings(settings: UserSettings): Promise<void> {
    try {
      await fetch('/api/db/settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(settings),
      });
    } catch (e) {
      console.warn('Offline: settings saved to local storage', e);
    }
  },
};
