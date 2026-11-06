# ⚡ KINETIC OS — High-Performance Personal Health Cockpit

Full-stack personal health and longevity platform with a **persistent SQLite database** and **Editorial Light Mode** UI.

1. **Intermittent Fasting (IF)**: Breathing metabolic ring, cellular autophagy stages, hydration tracking, and fasting protocols (16:8, 18:6, 20:4, OMAD, Custom).
2. **Brisk Walk Telemetry**: Live satellite GPS tracking, oversized Pace (min/km) & KM telemetry, Zone 2 aerobic pacing, cadence metrics, and GPX export.
3. **Bio-Recovery & Fuel (Replaces Waze)**: Whoop/Oura-style Daily Readiness score (0–100%), Sleep duration & Circadian fasting buffer, Protein & macronutrient fuel tracker, and Daily Bio-Habit Matrix.
4. **Stats & Analytics**: Interactive Day, Month, and Year performance summaries with animated dynamic spring bar charts.
5. **KINETIC Coach (AI)**: Sports-science bioenergetics co-pilot (Gemini 2.5 Flash + offline local engine) with zero robotic filler.

---

## 💾 Database Architecture (SQLite WAL Mode)

The backend runs a persistent SQLite database (`better-sqlite3` in WAL mode) stored in `data/kinetic.sqlite`.
It automatically creates and manages:
- `users`: User profiles, weight, height, and target pace.
- `fasting_sessions`: Start, end, target hours, completed status, and mood ratings.
- `walk_sessions`: Distance, duration, pace splits, calories, and GPS path points.
- `daily_health_logs`: Sleep hours, sleep quality, readiness score, protein intake, water, and daily habits.

Auto-syncs between client and database over REST API (`/api/db/*`) with automatic offline `localStorage` fallback.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion (physics-based spring transitions) + Lucide Icons + Leaflet (Walk map)
- **Backend & Database**: Node.js + Express 5 + SQLite (`better-sqlite3` WAL)
- **Audio Synthesizer**: Web Audio API (tactile micro-ticks & milestone chimes)
- **Voice Guidance**: Web Speech Synthesis API
- **Deployment**: Docker, Railway, Render, Fly.io, VPS, and Vercel

---

## 🚀 Quickstart

### 1. Fast Development Mode
```bash
npm install
npm run dev
```
Open browser at `http://localhost:5173`.

### 2. Full-Stack Production Mode with SQLite Database
```bash
npm run build
npm start
```
Open browser at `http://localhost:3001` (Health & DB status: `http://localhost:3001/api/health`).

---

## 🌐 Hosting Guide with Persistent Database

### Option 1: Railway (Recommended for Full-Stack Node.js + SQLite)
1. Push this repository to GitHub.
2. In [Railway.app](https://railway.app), click **New Project** → **Deploy from GitHub repo**.
3. Railway automatically detects `Dockerfile` or `package.json` and spins up Node.js.
4. Add a **Volume** mounted at `/app/data` to keep your SQLite database persistent across redeploys!

### Option 2: Render
1. Connect repository on [Render.com](https://render.com).
2. Select **Web Service** with runtime `Node`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add a Persistent Disk mounted at `/app/data`.

### Option 3: VPS / Docker
```bash
docker build -t kinetic-os .
docker run -d -p 3000:3000 -v $(pwd)/data:/app/data --name kinetic kinetic-os
```
