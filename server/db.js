/**
 * KINETIC OS — High-Performance Pure JavaScript Multi-User Vault Engine
 * Zero native C++ compilation dependencies (100% cloud & Docker compatible).
 * Atomic persistent disk storage for personal health & biometric telemetry.
 */

import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbFilePath = process.env.DATABASE_PATH || path.join(dataDir, 'kinetic-vault.json');

// In-Memory cache with atomic disk persistence
let vault = {
  users: [],
  fasts: [],
  walks: [],
  healthLogs: [],
};

// Load data from file if present
function loadVault() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const raw = fs.readFileSync(dbFilePath, 'utf-8');
      vault = JSON.parse(raw);
      if (!vault.users) vault.users = [];
      if (!vault.fasts) vault.fasts = [];
      if (!vault.walks) vault.walks = [];
      if (!vault.healthLogs) vault.healthLogs = [];
    } else {
      saveVault();
    }
  } catch (err) {
    console.warn('Vault load warning, starting fresh:', err);
    saveVault();
  }
}

// Save with atomic write (write to temp then rename to prevent corruption)
function saveVault() {
  try {
    const tempFile = `${dbFilePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(vault, null, 2), 'utf-8');
    fs.renameSync(tempFile, dbFilePath);
  } catch (err) {
    console.error('Failed to save vault to disk:', err);
  }
}

loadVault();
console.log(`📦 [DATABASE] Pure JavaScript Multi-User Vault Engine ready at ${dbFilePath}`);

export const dbService = {
  // ── Authentication & User Accounts ───────────────────────────────────────

  registerUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();

    // Check if user exists
    const existing = vault.users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );
    if (existing) {
      throw new Error('Username already exists. Please choose another username.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const displayName = username.trim();

    const newUser = {
      id: userId,
      username: cleanUsername,
      passwordHash,
      displayName,
      weightKg: 70.0,
      heightCm: 172.0,
      targetPaceMinPerKm: 510,
      settings: {
        targetFastHours: 16,
        defaultProtocolId: '16_8',
        dailyWaterGoalMl: 2500,
        dailyWalkGoalMeters: 5000,
        soundEnabled: true,
        voiceGuidanceEnabled: true,
        voiceLanguage: 'en-US',
      },
      createdAt: new Date().toISOString(),
    };

    vault.users.push(newUser);
    saveVault();

    return {
      id: newUser.id,
      username: newUser.username,
      displayName: newUser.displayName,
      weightKg: newUser.weightKg,
      heightCm: newUser.heightCm,
      targetPaceMinPerKm: newUser.targetPaceMinPerKm,
    };
  },

  authenticateUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const user = vault.users.find(
      (u) => u.username.toLowerCase() === cleanUsername
    );

    if (!user) {
      throw new Error('User not found. Please register first.');
    }

    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Incorrect password. Please try again.');
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      weightKg: user.weightKg || 70.0,
      heightCm: user.heightCm || 172.0,
      targetPaceMinPerKm: user.targetPaceMinPerKm || 510,
      ...(user.settings || {}),
    };
  },

  getUserById(userId) {
    const user = vault.users.find((u) => u.id === userId);
    if (!user) return null;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName || user.username,
      weightKg: user.weightKg || 70.0,
      heightCm: user.heightCm || 172.0,
      targetPaceMinPerKm: user.targetPaceMinPerKm || 510,
      ...(user.settings || {}),
    };
  },

  // ── User Settings ────────────────────────────────────────────────────────

  getUserSettings(userId) {
    const user = vault.users.find((u) => u.id === userId);
    if (!user) return null;

    return {
      userName: user.displayName || user.username,
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      targetPaceMinPerKm: user.targetPaceMinPerKm,
      ...(user.settings || {}),
    };
  },

  saveUserSettings(userId, settings) {
    let user = vault.users.find((u) => u.id === userId);
    const { userName, weightKg, heightCm, targetPaceMinPerKm, ...rest } = settings;

    if (user) {
      if (userName) user.displayName = userName;
      if (weightKg !== undefined) user.weightKg = weightKg;
      if (heightCm !== undefined) user.heightCm = heightCm;
      if (targetPaceMinPerKm !== undefined) user.targetPaceMinPerKm = targetPaceMinPerKm;
      user.settings = { ...(user.settings || {}), ...rest };
    } else {
      user = {
        id: userId,
        username: userName || userId,
        passwordHash: '',
        displayName: userName || userId,
        weightKg: weightKg || 70,
        heightCm: heightCm || 172,
        targetPaceMinPerKm: targetPaceMinPerKm || 510,
        settings: rest,
        createdAt: new Date().toISOString(),
      };
      vault.users.push(user);
    }
    saveVault();
  },

  // ── Fasting Sessions ─────────────────────────────────────────────────────

  getUserFasts(userId) {
    return vault.fasts
      .filter((f) => f.userId === userId)
      .sort((a, b) => b.startTime - a.startTime);
  },

  saveUserFast(userId, fast) {
    const existingIndex = vault.fasts.findIndex(
      (f) => f.id === fast.id && f.userId === userId
    );

    const record = {
      id: fast.id,
      userId,
      startTime: fast.startTime,
      endTime: fast.endTime || null,
      targetDurationHours: fast.targetDurationHours,
      protocolId: fast.protocolId,
      completed: Boolean(fast.completed),
      mood: fast.mood || null,
      notes: fast.notes || null,
      createdAt: fast.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      vault.fasts[existingIndex] = { ...vault.fasts[existingIndex], ...record };
    } else {
      vault.fasts.push(record);
    }
    saveVault();
  },

  // ── Walk Sessions ────────────────────────────────────────────────────────

  getUserWalks(userId) {
    return vault.walks
      .filter((w) => w.userId === userId)
      .sort((a, b) => b.startTime - a.startTime);
  },

  saveUserWalk(userId, walk) {
    const existingIndex = vault.walks.findIndex(
      (w) => w.id === walk.id && w.userId === userId
    );

    const record = {
      id: walk.id,
      userId,
      startTime: walk.startTime,
      endTime: walk.endTime || null,
      distanceMeters: walk.distanceMeters,
      durationSeconds: walk.durationSeconds,
      avgPaceSecondsPerKm: walk.avgPaceSecondsPerKm,
      maxSpeedKmh: walk.maxSpeedKmh || 0,
      caloriesBurned: walk.caloriesBurned,
      estimatedSteps: walk.estimatedSteps,
      path: walk.path || [],
      splits: walk.splits || [],
      createdAt: walk.createdAt || new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      vault.walks[existingIndex] = { ...vault.walks[existingIndex], ...record };
    } else {
      vault.walks.push(record);
    }
    saveVault();
  },

  // ── Daily Health Logs ────────────────────────────────────────────────────

  getUserHealthLogs(userId) {
    return vault.healthLogs
      .filter((l) => l.userId === userId)
      .sort((a, b) => (b.date > a.date ? 1 : -1));
  },

  saveUserHealthLog(userId, log) {
    const existingIndex = vault.healthLogs.findIndex(
      (l) => l.userId === userId && l.date === log.date
    );

    const record = {
      userId,
      date: log.date,
      sleepHours: log.sleepHours ?? 7.5,
      sleepQuality: log.sleepQuality ?? 85,
      readinessScore: log.readinessScore ?? 88,
      weightKg: log.weightKg,
      waterMl: log.waterMl ?? 0,
      proteinGrams: log.proteinGrams ?? 0,
      carbsGrams: log.carbsGrams ?? 0,
      fatGrams: log.fatGrams ?? 0,
      habits: log.habits || {},
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      vault.healthLogs[existingIndex] = record;
    } else {
      vault.healthLogs.push(record);
    }
    saveVault();
  },

  // Fallback methods
  getAllFasts() {
    return this.getUserFasts('default_user');
  },
  saveFast(fast) {
    return this.saveUserFast('default_user', fast);
  },
  getAllWalks() {
    return this.getUserWalks('default_user');
  },
  saveWalk(walk) {
    return this.saveUserWalk('default_user', walk);
  },
  getHealthLogs() {
    return this.getUserHealthLogs('default_user');
  },
  saveHealthLog(log) {
    return this.saveUserHealthLog('default_user', log);
  },
};
