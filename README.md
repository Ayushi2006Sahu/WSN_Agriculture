# WSN Village Farm Dashboard — React + Vite

Converted from Babel Standalone (browser-transpiled JSX) to a proper **React + Vite** project.
Same UI, same functionality — no more `babel.min.js` or `type="text/babel"`.

---

## 📁 Project Structure

```
wsn-react-app/
├── index.html                  ← Clean HTML, no Babel CDN scripts
├── vite.config.js
├── package.json
├── vercel.json                 ← Vercel deployment config
└── src/
    ├── main.jsx                ← App entry point
    ├── App.jsx                 ← Root component (routing + state)
    ├── components/
    │   ├── Header.jsx          ← Top bar with live clock
    │   ├── NavTabs.jsx         ← Tab navigation
    │   ├── ChartCanvas.jsx     ← Chart.js wrapper
    │   ├── BatteryVisual.jsx   ← Battery icon component
    │   ├── BatteryCard.jsx     ← Full battery analysis card
    │   ├── ProbabilityBars.jsx ← Irrigation confidence bars
    │   └── TipCard.jsx         ← Farmer tip cards
    ├── pages/
    │   ├── PredictPage.jsx     ← AI irrigation prediction
    │   ├── BatteryPage.jsx     ← Node battery manager
    │   ├── DashboardPage.jsx   ← Analytics dashboard
    │   └── GuidePage.jsx       ← Farmer guide + voice
    ├── logic/                  ← All ML/battery JS logic (unchanged)
    │   ├── mlPredictor.js
    │   ├── batteryPredictor.js
    │   ├── sampleData.js
    │   ├── tipsEngine.js
    │   └── accuracyEngine.js
    ├── hooks/
    │   └── voiceAssistant.js   ← Bilingual voice (EN + HI)
    └── styles/
        ├── base.css
        ├── layout.css
        ├── components.css
        ├── battery.css
        └── animations.css
```

---

## 🚀 How to Run Locally

### Step 1 — Install Node.js
Download from https://nodejs.org (version 18 or higher recommended)

### Step 2 — Install dependencies
Open terminal in this folder and run:
```bash
npm install
```

### Step 3 — Start development server
```bash
npm run dev
```

Open your browser at: **http://localhost:5173**

> The page hot-reloads automatically when you edit any file.

---

## 🏗️ Build for Production

```bash
npm run build
```

This creates a `dist/` folder with optimized static files ready to deploy.

To preview the production build locally:
```bash
npm run preview
```

---

## ☁️ Deploy to Vercel

### Option A — Via GitHub (recommended)
1. Push this folder to a GitHub repository
2. Go to https://vercel.com → **Add New Project**
3. Import your GitHub repo
4. Vercel auto-detects Vite — click **Deploy**

### Option B — Via Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option C — Deploy the dist/ folder directly
```bash
npm run build
# Upload the dist/ folder to any static host (Netlify, GitHub Pages, etc.)
```

---

## ⚡ What Changed from the Original

| Before (Babel Standalone)           | After (React + Vite)              |
|-------------------------------------|-----------------------------------|
| `babel.min.js` loaded from CDN      | ❌ Removed completely             |
| `type="text/babel"` on every script | ❌ Removed — standard JSX now     |
| All scripts loaded via `<script>`   | ✅ ES module imports              |
| No build step needed                | ✅ `npm run build` for production |
| Slow — browser transpiles at load   | ✅ Fast — pre-built bundle        |
| Can't deploy to Vercel easily       | ✅ One-click Vercel deploy        |

---

## 🌾 Features

- **AI Irrigation Prediction** — Random Forest model (98.33% accuracy)
- **Single vs Multi-Task** — Compare 3-process vs 7-process modes
- **Live Stress Index** — Real-time soil/temp/humidity breakdown
- **Battery Manager** — 6 sensor nodes with ON/OFF, sessions, handover
- **Analytics Dashboard** — Charts, classification report, history table
- **Farmer Guide** — Voice assistant reads tips in English + Hindi
- **Bilingual Voice** — All results spoken in EN + HI via Web Speech API
