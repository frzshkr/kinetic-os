/**
 * KINETIC OS — Multi-User SQLite Production Database Engine
 * High-performance, isolated multi-tenant storage for personal health & biometric telemetry.
 */

import Database from 'better-sqlite3';
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

const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'kinetic.sqlite');
const db = new Database(dbPath);

// Enable WAL mode for high performance and concurrent reads
db.pragma('journal_mode = WAL');

// 1. Initialize & Migrate Tables
function initializeDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      name TEXT,
      display_name TEXT,
      weight_kg REAL DEFAULT 70.0,
      height_cm REAL DEFAULT 172.0,
      target_pace REAL DEFAULT 510,
      settings_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migrate users table if password_hash or username column is missing
  const userColumns = db.prepare("PRAGMA table_info(users)").all().map((col) => col.name);
  if (!userColumns.includes('password_hash')) {
    try {
      db.prepare("ALTER TABLE users ADD COLUMN password_hash TEXT").run();
    } catch (e) {
      console.warn('Migration: users.password_hash already exists or cannot alter', e);
    }
  }
  if (!userColumns.includes('username')) {
    try {
      db.prepare("ALTER TABLE users ADD COLUMN username TEXT").run();
    } catch (e) {
      console.warn('Migration: users.username already exists', e);
    }
  }
  if (!userColumns.includes('display_name')) {
    try {
      db.prepare("ALTER TABLE users ADD COLUMN display_name TEXT").run();
    } catch (e) {
      console.warn('Migration: users.display_name already exists', e);
    }
  }

  // Fasting sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS fasting_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      target_hours REAL NOT NULL,
      protocol TEXT NOT NULL,
      completed INTEGER DEFAULT 0,
      mood TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const fastColumns = db.prepare("PRAGMA table_info(fasting_sessions)").all().map((col) => col.name);
  if (!fastColumns.includes('user_id')) {
    try {
      db.prepare("ALTER TABLE fasting_sessions ADD COLUMN user_id TEXT DEFAULT 'default_user'").run();
    } catch (e) {
      console.warn('Migration: fasting_sessions.user_id', e);
    }
  }

  // Walk sessions
  db.exec(`
    CREATE TABLE IF NOT EXISTS walk_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL DEFAULT 'default_user',
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      distance_meters REAL NOT NULL,
      duration_seconds INTEGER NOT NULL,
      avg_pace REAL NOT NULL,
      max_speed REAL,
      calories_burned INTEGER NOT NULL,
      estimated_steps INTEGER NOT NULL,
      path_json TEXT,
      splits_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const walkColumns = db.prepare("PRAGMA table_info(walk_sessions)").all().map((col) => col.name);
  if (!walkColumns.includes('user_id')) {
    try {
      db.prepare("ALTER TABLE walk_sessions ADD COLUMN user_id TEXT DEFAULT 'default_user'").run();
    } catch (e) {
      console.warn('Migration: walk_sessions.user_id', e);
    }
  }

  // Daily health logs migration to multi-tenant (user_id, date) primary key
  const healthCols = db.prepare("PRAGMA table_info(daily_health_logs)").all();
  const hasUserId = healthCols.some((c) => c.name === 'user_id');
  const pkCount = healthCols.filter((c) => c.pk > 0).length;

  if (!hasUserId || pkCount < 2) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS daily_health_logs_new (
        user_id TEXT NOT NULL DEFAULT 'default_user',
        date TEXT NOT NULL,
        sleep_hours REAL DEFAULT 7.5,
        sleep_quality INTEGER DEFAULT 85,
        readiness_score INTEGER DEFAULT 88,
        weight_kg REAL,
        water_ml INTEGER DEFAULT 0,
        protein_grams INTEGER DEFAULT 0,
        carbs_grams INTEGER DEFAULT 0,
        fat_grams INTEGER DEFAULT 0,
        habits_json TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, date)
      );
    `);

    if (healthCols.length > 0) {
      try {
        db.exec(`
          INSERT OR IGNORE INTO daily_health_logs_new (user_id, date, sleep_hours, sleep_quality, readiness_score, weight_kg, water_ml, protein_grams, carbs_grams, fat_grams, habits_json, updated_at)
          SELECT 'default_user', date, sleep_hours, sleep_quality, readiness_score, weight_kg, water_ml, protein_grams, carbs_grams, fat_grams, habits_json, updated_at
          FROM daily_health_logs;
          DROP TABLE daily_health_logs;
          ALTER TABLE daily_health_logs_new RENAME TO daily_health_logs;
        `);
      } catch (err) {
        console.warn('Migration daily_health_logs error:', err);
      }
    } else {
      db.exec(`ALTER TABLE daily_health_logs_new RENAME TO daily_health_logs;`);
    }
  }

  // Create indexes for instant multi-user lookups
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_fasts_user ON fasting_sessions(user_id, start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_walks_user ON walk_sessions(user_id, start_time DESC);
    CREATE INDEX IF NOT EXISTS idx_health_user ON daily_health_logs(user_id, date DESC);
  `);

  console.log(`📦 [DATABASE] Multi-User SQLite Engine initialized at ${dbPath}`);
}

initializeDatabase();

export const dbService = {
  // ── Authentication & User Accounts ───────────────────────────────────────
  
  registerUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    
    // Check if username taken
    const existing = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    if (existing) {
      throw new Error('Username already exists. Please choose another username.');
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const displayName = username.trim();

    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, name, display_name, weight_kg, height_cm, target_pace, settings_json)
      VALUES (?, ?, ?, ?, ?, 70.0, 172.0, 510, ?)
    `);

    const defaultSettings = JSON.stringify({
      targetFastHours: 16,
      defaultProtocolId: '16_8',
      dailyWaterGoalMl: 2500,
      dailyWalkGoalMeters: 5000,
      soundEnabled: true,
      voiceGuidanceEnabled: true,
      voiceLanguage: 'en-US',
    });

    stmt.run(userId, cleanUsername, passwordHash, displayName, displayName, defaultSettings);

    return {
      id: userId,
      username: cleanUsername,
      displayName,
      weightKg: 70.0,
      heightCm: 172.0,
      targetPaceMinPerKm: 510,
    };
  },

  authenticateUser(username, password) {
    const cleanUsername = username.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(cleanUsername);
    
    if (!user) {
      throw new Error('User not found. Please register first.');
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Incorrect password. Please try again.');
    }

    let extraSettings = {};
    if (user.settings_json) {
      try {
        extraSettings = JSON.parse(user.settings_json);
      } catch {
        extraSettings = {};
      }
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      weightKg: user.weight_kg || 70.0,
      heightCm: user.height_cm || 172.0,
      targetPaceMinPerKm: user.target_pace || 510,
      ...extraSettings,
    };
  },

  getUserById(userId) {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) return null;

    let extraSettings = {};
    if (user.settings_json) {
      try {
        extraSettings = JSON.parse(user.settings_json);
      } catch {
        extraSettings = {};
      }
    }

    return {
      id: user.id,
      username: user.username,
      displayName: user.display_name || user.username,
      weightKg: user.weight_kg || 70.0,
      heightCm: user.height_cm || 172.0,
      targetPaceMinPerKm: user.target_pace || 510,
      ...extraSettings,
    };
  },

  // ── User Settings ────────────────────────────────────────────────────────

  getUserSettings(userId) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!row) return null;

    let extraSettings = {};
    if (row.settings_json) {
      try {
        extraSettings = JSON.parse(row.settings_json);
      } catch {
        extraSettings = {};
      }
    }

    return {
      userName: row.display_name || row.username,
      weightKg: row.weight_kg,
      heightCm: row.height_cm,
      targetPaceMinPerKm: row.target_pace,
      ...extraSettings,
    };
  },

  saveUserSettings(userId, settings) {
    const { userName, weightKg, heightCm, targetPaceMinPerKm, ...rest } = settings;
    const settingsJson = JSON.stringify(rest);

    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(userId);
    if (existing) {
      db.prepare(`
        UPDATE users 
        SET display_name = COALESCE(?, display_name),
            weight_kg = COALESCE(?, weight_kg),
            height_cm = COALESCE(?, height_cm),
            target_pace = COALESCE(?, target_pace),
            settings_json = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(userName, weightKg, heightCm, targetPaceMinPerKm, settingsJson, userId);
    } else {
      db.prepare(`
        INSERT INTO users (id, username, password_hash, display_name, weight_kg, height_cm, target_pace, settings_json)
        VALUES (?, ?, 'default_hash', ?, ?, ?, ?, ?)
      `).run(userId, userName || userId, userName || userId, weightKg || 70, heightCm || 172, targetPaceMinPerKm || 510, settingsJson);
    }
  },

  // ── Fasting Sessions ─────────────────────────────────────────────────────

  getUserFasts(userId) {
    return db.prepare('SELECT * FROM fasting_sessions WHERE user_id = ? ORDER BY start_time DESC').all(userId).map(row => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      targetDurationHours: row.target_hours,
      protocolId: row.protocol,
      completed: Boolean(row.completed),
      mood: row.mood,
      notes: row.notes,
    }));
  },

  saveUserFast(userId, fast) {
    const stmt = db.prepare(`
      INSERT INTO fasting_sessions (id, user_id, start_time, end_time, target_hours, protocol, completed, mood, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        end_time = excluded.end_time,
        completed = excluded.completed,
        mood = excluded.mood,
        notes = excluded.notes
    `);
    stmt.run(
      fast.id,
      userId,
      fast.startTime,
      fast.endTime || null,
      fast.targetDurationHours,
      fast.protocolId,
      fast.completed ? 1 : 0,
      fast.mood || null,
      fast.notes || null
    );
  },

  // ── Walk Sessions ────────────────────────────────────────────────────────

  getUserWalks(userId) {
    return db.prepare('SELECT * FROM walk_sessions WHERE user_id = ? ORDER BY start_time DESC').all(userId).map(row => ({
      id: row.id,
      startTime: row.start_time,
      endTime: row.end_time,
      distanceMeters: row.distance_meters,
      durationSeconds: row.duration_seconds,
      avgPaceSecondsPerKm: row.avg_pace,
      maxSpeedKmh: row.max_speed || 0,
      caloriesBurned: row.calories_burned,
      estimatedSteps: row.estimated_steps,
      path: row.path_json ? JSON.parse(row.path_json) : [],
      splits: row.splits_json ? JSON.parse(row.splits_json) : [],
    }));
  },

  saveUserWalk(userId, walk) {
    const stmt = db.prepare(`
      INSERT INTO walk_sessions (
        id, user_id, start_time, end_time, distance_meters, duration_seconds, avg_pace,
        max_speed, calories_burned, estimated_steps, path_json, splits_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        end_time = excluded.end_time,
        distance_meters = excluded.distance_meters,
        duration_seconds = excluded.duration_seconds,
        avg_pace = excluded.avg_pace,
        calories_burned = excluded.calories_burned,
        estimated_steps = excluded.estimated_steps,
        path_json = excluded.path_json,
        splits_json = excluded.splits_json
    `);

    stmt.run(
      walk.id,
      userId,
      walk.startTime,
      walk.endTime || null,
      walk.distanceMeters,
      walk.durationSeconds,
      walk.avgPaceSecondsPerKm,
      walk.maxSpeedKmh || null,
      walk.caloriesBurned,
      walk.estimatedSteps,
      JSON.stringify(walk.path || []),
      JSON.stringify(walk.splits || [])
    );
  },

  // ── Daily Health Logs ────────────────────────────────────────────────────

  getUserHealthLogs(userId) {
    return db.prepare('SELECT * FROM daily_health_logs WHERE user_id = ? ORDER BY date DESC').all(userId).map(row => ({
      date: row.date,
      sleepHours: row.sleep_hours,
      sleepQuality: row.sleep_quality,
      readinessScore: row.readiness_score,
      weightKg: row.weight_kg,
      waterMl: row.water_ml,
      proteinGrams: row.protein_grams,
      carbsGrams: row.carbs_grams,
      fatGrams: row.fat_grams,
      habits: row.habits_json ? JSON.parse(row.habits_json) : {},
    }));
  },

  saveUserHealthLog(userId, log) {
    const stmt = db.prepare(`
      INSERT INTO daily_health_logs (
        user_id, date, sleep_hours, sleep_quality, readiness_score, weight_kg, water_ml,
        protein_grams, carbs_grams, fat_grams, habits_json, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, date) DO UPDATE SET
        sleep_hours = excluded.sleep_hours,
        sleep_quality = excluded.sleep_quality,
        readiness_score = excluded.readiness_score,
        weight_kg = excluded.weight_kg,
        water_ml = excluded.water_ml,
        protein_grams = excluded.protein_grams,
        carbs_grams = excluded.carbs_grams,
        fat_grams = excluded.fat_grams,
        habits_json = excluded.habits_json,
        updated_at = CURRENT_TIMESTAMP
    `);

    stmt.run(
      userId,
      log.date,
      log.sleepHours,
      log.sleepQuality,
      log.readinessScore,
      log.weightKg,
      log.waterMl,
      log.proteinGrams,
      log.carbsGrams,
      log.fatGrams,
      JSON.stringify(log.habits || {})
    );
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
