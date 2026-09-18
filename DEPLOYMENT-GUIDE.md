# 🌐 Nexus Academy Management System — Cloud Deployment & Database Integration Guide

Welcome to the **Nexus Academy Management System** complete cloud deployment guide. This document provides clear, step-by-step instructions to connect your application to a live cloud database (Firebase Firestore or Supabase), deploy to production, and save data globally with zero lag.

---

## ⚡ 1. Quick Start: Built-in Live Cloud Backend (Zero Config)

Nexus Academy comes with a high-performance, real-time Node/Express server daemon:
1. Double-click `RUN-NEXUS-ACADEMY.bat` or run:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\SETUP-INSTALLER.ps1
   ```
2. Select **[1] START GAME** to launch the server on `http://localhost:3000`.
3. All changes (Students, Classes, Attendance, Test Marks, Fees, Receipts) are saved persistently to `data/nexus-db.json` and synchronized in real-time across all browser tabs via Server-Sent Events (SSE).

---

## 🔥 2. Google Firebase (Firestore) Integration Guide

If you prefer storing all academy data directly in Google Cloud Firebase:

### Step 2.1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project** and name it (e.g., `nexus-academy-prod`).
3. (Optional) Disable or enable Google Analytics, then click **Create project**.

### Step 2.2: Enable Cloud Firestore
1. In the left sidebar, click **Build** > **Firestore Database**.
2. Click **Create database**.
3. Choose your preferred database location (e.g. `nam5` / `us-central` or `asia-south1`).
4. Select **Start in test mode** for instant read/write access during setup.

### Step 2.3: Configure Security Rules
In Firebase Console > Firestore Database > **Rules**, paste:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /nexus_academy/{document=**} {
      allow read, write: if true; // Or restrict to authenticated academy staff
    }
  }
}
```
Click **Publish**.

### Step 2.4: Get Your Web Credentials
1. Click the **Project Settings** (gear icon) in the top-left.
2. Under **General** > **Your apps**, click the **Web icon (`</>`)**.
3. Register your app (e.g. `nexus-web`).
4. Copy the config object:
   - `apiKey`
   - `projectId`
   - `authDomain`
   - `storageBucket`
   - `appId`

### Step 2.5: Connect in Nexus Academy UI
1. Open Nexus Academy and navigate to the **Settings** tab.
2. Under **Real-time Cloud Database Sync**, select **Firebase Firestore**.
3. Paste your **Firebase Project ID** and **API Key**.
4. Click **Test Cloud Connection** and **Save Settings**.
5. Your academy data will now sync to Firestore in real time!

---

## ⚡ 3. Supabase (PostgreSQL) Integration Guide

If you prefer a relational PostgreSQL database with Supabase:

### Step 3.1: Create a Free Supabase Project
1. Visit [Supabase](https://supabase.com/) and click **Start your project**.
2. Click **New Project**, name it `nexus-academy`, choose a database password and region.

### Step 3.2: Create the Database Table
1. In Supabase dashboard, click **SQL Editor** > **New Query**.
2. Run the following SQL script:
```sql
CREATE TABLE IF NOT EXISTS public.nexus_state (
  id TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.nexus_state ENABLE ROW LEVEL SECURITY;

-- Allow public read/write with anon key (or restrict to authenticated users)
CREATE POLICY "Allow anon read and write"
ON public.nexus_state
FOR ALL
TO anon
USING (true)
WITH CHECK (true);
```
3. Click **Run**.

### Step 3.3: Copy API Credentials
1. In the Supabase project dashboard, go to **Project Settings** > **API**.
2. Copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **Project API Keys** > `anon` `public` key.

### Step 3.4: Connect in Nexus Academy UI
1. In Nexus Academy, click the **Settings** tab.
2. Select **Supabase** in the Cloud Database section.
3. Paste your **Supabase URL** and **Anon Key**.
4. Click **Test Cloud Connection** then **Save Settings**.

---

## 🚀 4. Free Worldwide Hosting Options

### Option A: Cloud Run / Google Cloud (AI Studio Default)
Nexus Academy is natively configured for Google Cloud Run with port 3000 reverse proxy. Deploy with 1-click in AI Studio Settings > Deploy to Cloud Run.

### Option B: Vercel / Netlify
1. Run `npm run build` to generate the production bundle in `dist/`.
2. Push the repository to GitHub.
3. Connect repository in Vercel or Netlify.
4. Set Build Command: `npm run build`, Output Directory: `dist`.

### Option C: VPS / Dedicated Server (Ubuntu/Debian)
```bash
git clone <your-repo>
cd nexus-academy
npm install
npm run build
npm start # runs node server.ts on port 3000
```
Use `pm2` or `systemd` to keep the server alive 24/7:
```bash
npm install -g pm2
pm2 start server.ts --name "nexus-academy"
```

---

## 🔒 5. Administrative Access & Security
- **Default Principal PIN**: `2026`
- You can customize this PIN anytime in the **Settings** tab.
- Sensitive actions (Deleting student records, updating dues, modifying classes, restoring database backups) are locked to protect student integrity.
