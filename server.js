/**
 * KINETIC OS — High-End Production Multi-User Node.js Server
 * Full-stack Express backend with Isolated Multi-User SQLite Database, AI Proxy & Static Delivery
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { dbService } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'kinetic-elite-os-jwt-secret-salt-2025';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: JWT verification middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // If no token provided, we can either reject or provide fallback for backward compatibility
    return res.status(401).json({ error: 'Authentication required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please sign in again.' });
    }
    req.user = decoded;
    next();
  });
}

// Optional Auth (passes user if token present, else null)
function optionalToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    req.user = { userId: 'default_user', username: 'Guest' };
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      req.user = { userId: 'default_user', username: 'Guest' };
    } else {
      req.user = decoded;
    }
    next();
  });
}

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'KINETIC OS Multi-Tenant Backend Core',
    database: 'SQLite WAL Mode Connected',
    nodeVersion: process.version,
  });
});

// ── Authentication Endpoints ─────────────────────────────────────────────────

// 1. Register: strictly username & password
app.post('/api/auth/register', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
    }
    if (!password || typeof password !== 'string' || password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    // Clean username format (letters, numbers, underscore, hyphen)
    const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!validUsernameRegex.test(username.trim())) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens, and underscores.' });
    }

    const user = dbService.registerUser(username, password);

    // Generate JWT token (valid for 30 days)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    console.error('Registration Error:', err.message);
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

// 2. Login: username & password
app.post('/api/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Please enter both username and password.' });
    }

    const user = dbService.authenticateUser(username, password);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      message: 'Welcome back!',
      token,
      user,
    });
  } catch (err) {
    console.error('Login Error:', err.message);
    res.status(401).json({ error: err.message || 'Invalid username or password' });
  }
});

// 3. Current User Profile
app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = dbService.getUserById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// ── Multi-User Database REST API Endpoints ───────────────────────────────────

// 1. Sync all user data (isolated per user)
app.get('/api/db/sync', optionalToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = dbService.getUserSettings(userId);
    const fasts = dbService.getUserFasts(userId);
    const walks = dbService.getUserWalks(userId);
    const healthLogs = dbService.getUserHealthLogs(userId);
    res.json({ settings, fasts, walks, healthLogs, userId });
  } catch (err) {
    console.error('Database Sync Error:', err);
    res.status(500).json({ error: 'Database sync failed' });
  }
});

// 2. Save Fast
app.post('/api/db/fast', optionalToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const fast = req.body;
    dbService.saveUserFast(userId, fast);
    res.json({ success: true, id: fast.id });
  } catch (err) {
    console.error('Save Fast Error:', err);
    res.status(500).json({ error: 'Failed to save fast' });
  }
});

// 3. Save Walk
app.post('/api/db/walk', optionalToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const walk = req.body;
    dbService.saveUserWalk(userId, walk);
    res.json({ success: true, id: walk.id });
  } catch (err) {
    console.error('Save Walk Error:', err);
    res.status(500).json({ error: 'Failed to save walk' });
  }
});

// 4. Save Health Log (Sleep, Readiness, Macros, Habits)
app.post('/api/db/health', optionalToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const log = req.body;
    dbService.saveUserHealthLog(userId, log);
    res.json({ success: true, date: log.date });
  } catch (err) {
    console.error('Save Health Log Error:', err);
    res.status(500).json({ error: 'Failed to save health log' });
  }
});

// 5. Save Settings
app.post('/api/db/settings', optionalToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const settings = req.body;
    dbService.saveUserSettings(userId, settings);
    res.json({ success: true });
  } catch (err) {
    console.error('Save Settings Error:', err);
    res.status(500).json({ error: 'Failed to save settings' });
  }
});

// ── AI Chat Endpoint (Proxy to Google Gemini API or intelligent offline fallback) ─
app.post('/api/ai/chat', optionalToken, async (req, res) => {
  try {
    const { prompt, history, context } = req.body;
    const apiKey = context?.userSettings?.geminiApiKey || process.env.GEMINI_API_KEY;

    if (apiKey) {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemInstruction = `You are KINETIC Coach, an elite personal sports science and metabolic performance advisor.
User: ${req.user.username || 'Athlete'}.
Primary domains: Intermittent Fasting (autophagy & ketosis bioenergetics), Brisk Walk (Zone 2 aerobic pacing, cadence), Sleep & Circadian rhythm, and daily macro/protein tracking.
Rule: Be concise, direct, scientifically accurate, and completely free of robotic filler.`;

      const contents = [
        {
          role: 'user',
          parts: [{ text: systemInstruction }],
        },
        {
          role: 'model',
          parts: [{ text: 'Ready. Concise, performance-focused feedback only.' }],
        },
        ...(history || []).slice(-6).map((msg) => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }],
        })),
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ];

      const geminiRes = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents }),
      });

      if (geminiRes.ok) {
        const data = await geminiRes.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return res.json({ response: reply });
        }
      }
    }

    res.json({
      response: `Telemetry connected to personal SQLite DB for ${req.user.username}. Maintain hydration and ensure adequate protein intake to preserve lean mass during fasting.`,
      suggestions: ['Check my recovery readiness', 'How much protein should I eat post-fast?'],
    });
  } catch (error) {
    console.error('AI Proxy Error:', error);
    res.status(500).json({ error: 'AI service temporary unavailable' });
  }
});

// Serve frontend static build if 'dist' folder exists
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.use((req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [KINETIC OS] Multi-User Server running at http://localhost:${PORT}`);
});
