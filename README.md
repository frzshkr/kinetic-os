# ⚡ KINETIC OS — High-Performance Multi-User Health Cockpit

Full-stack personal health and longevity platform with a **multi-user isolated SQLite database**, **instant username & password authentication**, and an **Editorial Light Mode** Gen Z aesthetic.

1. **Multi-User Private Vaults**: Friends can register with just **Username** & **Password**. Every user's fasts, walks, readiness scores, and metrics are strictly isolated.
2. **Intermittent Fasting (IF)**: Breathing metabolic ring, cellular autophagy stages, hydration tracking, and fasting protocols (16:8, 18:6, 20:4, OMAD, Custom).
3. **Brisk Walk Telemetry**: Live satellite GPS tracking, oversized Pace (min/km) & KM telemetry, Zone 2 aerobic pacing, cadence metrics, and GPX export.
4. **Bio-Recovery & Fuel**: Daily Readiness score (0–100%), Sleep duration & Circadian fasting buffer, Protein & macronutrient fuel tracker, and Daily Bio-Habit Matrix.
5. **Stats & Analytics**: Interactive Day, Month, and Year performance summaries with animated dynamic spring bar charts.
6. **KINETIC Coach (AI)**: Sports-science bioenergetics co-pilot (Gemini 2.5 Flash + offline local engine) with zero robotic filler.

---

## 💾 Multi-User Database Architecture (SQLite WAL Mode)

The backend runs a high-performance SQLite database (`better-sqlite3` in WAL mode) stored in `data/kinetic.sqlite`.
It automatically manages multi-tenant isolation:
- `users`: User accounts with bcrypt-hashed passwords and profile telemetry.
- `fasting_sessions`: Isolated per `user_id` (autophagy, target hours, notes, ratings).
- `walk_sessions`: Isolated per `user_id` (distance, duration, pace splits, calories, GPS paths).
- `daily_health_logs`: Isolated per `(user_id, date)` (sleep hours, readiness, protein, habits).

All communications use stateless JWT tokens (`Authorization: Bearer <token>`) with automatic offline `localStorage` fallback.

---

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Framer Motion (physics spring transitions) + Lucide Icons + Leaflet (Walk map)
- **Backend**: Node.js + Express 5 + SQLite (`better-sqlite3` WAL) + `bcryptjs` + `jsonwebtoken`
- **Audio Synthesizer**: Web Audio API (tactile micro-ticks & celebration chimes)
- **Voice Guidance**: Web Speech Synthesis API
- **Deployment**: Render.com (100% Free), Railway, Fly.io, or VPS

---

## 🚀 Quickstart (Local Test)

### 1. Build and Run Full-Stack Server
```bash
npm run build
npm start
```
Open your browser at `http://localhost:3001`.
- Health Check: `http://localhost:3001/api/health`
- Register an account with just a **Username** and **Password**!

---

## 🌐 100% Free Hosting Guide (Untuk Kawan-Kawan Boleh Guna)

Website ini adalah **full-stack** (Node.js backend + frontend + database SQLite berada dalam satu sistem). Paling senang dan 100% PERCUMA untuk di-host menggunakan **Render.com** atau **Railway**:

### Pilihan 1: Render.com (100% Percuma & Senang)
1. **Push Kod ke GitHub**:
   - Buka [GitHub.com](https://github.com), cipta satu repository baru (cth: `kinetic-os`).
   - Jalankan arahan ini di terminal:
     ```bash
     git remote add origin https://github.com/USERNAME_ANDA/kinetic-os.git
     git branch -M main
     git push -u origin main
     ```
2. **Daftar di Render.com (Percuma)**:
   - Pergi ke [dashboard.render.com](https://dashboard.render.com) dan login guna akaun GitHub.
3. **Cipta New Web Service**:
   - Tekan butang **New +** → Pilih **Web Service**.
   - Pilih repository GitHub `kinetic-os` yang baru di-push tadi.
   - Konfigurasi settings:
     - **Name**: `kinetic-os` (atau nama pilihan anda)
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`
4. **Deploy**:
   - Tekan **Create Web Service**.
   - Render akan automatik bina frontend dan hidupkan backend.
   - Dalam 2 minit, anda akan dapat link HTTPS percuma (contoh: `https://kinetic-os.onrender.com`).
   - **Kawan-kawan anda kini boleh buka link tersebut, tekan Register, masukkan username & password mereka, dan terus mula simpan data IF & brisk walk mereka sendiri!**

---

### Pilihan 2: Railway.app (Alternatif Pantas)
1. Pergi ke [Railway.app](https://railway.app) dan login dengan GitHub.
2. Tekan **New Project** → **Deploy from GitHub repo**.
3. Pilih repo `kinetic-os`.
4. Railway akan bina dan bagi anda public domain percuma secara automatik.
