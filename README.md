# SRM Insider AI — Full Stack

> AI-powered submission query assistant for SRM Institute of Science and Technology (SRMIST) students.
> Built with **React 18 + Tailwind CSS + Express + NeDB + Anthropic Claude Sonnet**.

---

## 📌 What is this?

SRM Insider AI is a full-stack web application that helps SRMIST students get instant answers about the SRM Insider submission portal — covering formats, deadlines, plagiarism rules, status tracking, resubmission procedures, and more — using a conversational AI interface powered by Claude.

---

## 🏗 Architecture

```
Browser
  │
  ├── /          → React frontend (served as static files by Express)
  └── /api/*     → Express REST API + SSE streaming
                        │
                        ├── NeDB (embedded file-based database)
                        └── Anthropic Claude Sonnet (AI responses)
```

In **development**, Vite runs on port 3000 and proxies `/api` requests to Express on port 3001.
In **production**, Express serves both the React app and the API from a single port.

---

## ⚡ Quick Start — Run Locally

### Prerequisites
- Node.js v18 or higher → https://nodejs.org
- Anthropic API key → https://console.anthropic.com

### Step 1 — Get your Anthropic API key
Go to **https://console.anthropic.com** → API Keys → Create Key.
Copy the key (starts with `sk-ant-...`).

### Step 2 — Create your `.env` file
Inside the `backend/` folder, create a file named `.env`:
```
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
JWT_SECRET=any-long-random-string-here
```

### Step 3 — Run the app

**Mac / Linux:**
```bash
chmod +x start.sh
./start.sh
```

**Windows:**
```
Double-click start.bat
```

Open **http://localhost:3000** in your browser.

### Manual start (if scripts don't work)

Open **two terminal windows**:

**Terminal 1 — Backend (port 3001):**
```bash
cd backend
npm install
export ANTHROPIC_API_KEY=sk-ant-your-key   # Mac/Linux
# set ANTHROPIC_API_KEY=sk-ant-your-key    # Windows
node server.js
```

**Terminal 2 — Frontend (port 3000):**
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:3000**.

---

## 🚀 Deploy to Production (Single Platform)

Both frontend and backend deploy together on one platform — Express serves the built React app as static files alongside the API.

### Deploy on Render (Free — Recommended)

1. Push your code to GitHub:
```bash
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/srm-insider.git
git push -u origin main
```

2. Go to **https://render.com** → New → Web Service → connect your repo

3. Set these fields:

| Field | Value |
|-------|-------|
| Root Directory | *(leave blank — deploy from repo root)* |
| Build Command | `npm run build` |
| Start Command | `node backend/server.js` |
| Instance Type | Free |

4. Add Environment Variables:

| Key | Value |
|-----|-------|
| `ANTHROPIC_API_KEY` | `sk-ant-your-key` |
| `JWT_SECRET` | any long random string |
| `NODE_ENV` | `production` |

5. Click **Deploy** — your app goes live at `https://srm-insider-ai.onrender.com`

> See **DEPLOYMENT.md** for full instructions including Railway and Fly.io alternatives.

---

## 🗂 Project Structure

```
srm-insider/
├── package.json             ← Root scripts: build (React) + start (Express)
├── Dockerfile               ← For Fly.io container deployment
├── .dockerignore
├── .gitignore
├── start.sh                 ← One-command local launcher (Mac/Linux)
├── start.bat                ← One-command local launcher (Windows)
├── README.md                ← This file
├── DEPLOYMENT.md            ← Full cloud deployment guide
│
├── backend/
│   ├── server.js            ← Express REST API + SSE streaming + static file serving
│   ├── db.js                ← NeDB embedded database + FAQ seeding
│   ├── auth.js              ← JWT middleware + bcrypt password helpers
│   ├── prompt.js            ← SRM Insider AI system prompt (knowledge base)
│   ├── .env                 ← YOUR SECRETS (create this — never commit)
│   ├── .env.example         ← Template showing required env variables
│   └── package.json
│
└── frontend/
    ├── index.html
    ├── vite.config.js       ← Vite dev server + /api proxy to port 3001
    ├── tailwind.config.js   ← Custom SRM brand colors, fonts, animations
    ├── postcss.config.js    ← PostCSS pipeline for Tailwind CSS
    ├── package.json
    └── src/
        ├── App.jsx                    ← Root router + protected route shell
        ├── main.jsx                   ← React entry point
        ├── pages/
        │   ├── AuthPage.jsx           ← Login / Register (two-panel layout)
        │   ├── Dashboard.jsx          ← Home: stats, quick actions, submission types
        │   ├── ChatPage.jsx           ← AI chat with real-time streaming + feedback
        │   └── FaqPage.jsx            ← Searchable, filterable FAQ accordion
        ├── components/
        │   ├── Sidebar.jsx            ← Dark nav sidebar + grouped conversation history
        │   └── Message.jsx            ← Chat bubble with full Markdown rendering
        ├── hooks/
        │   └── useAuth.jsx            ← Auth context, JWT persistence, user state
        ├── utils/
        │   └── api.js                 ← Axios client + SSE streaming helper
        └── styles/
            └── global.css             ← Tailwind directives + component layers
```

---

## 🌐 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/health` | No | Server status + API key check |
| `POST` | `/api/auth/register` | No | Register new student account |
| `POST` | `/api/auth/login` | No | Login — returns JWT token |
| `GET` | `/api/auth/me` | JWT | Get current logged-in user profile |
| `GET` | `/api/conversations` | JWT | List all conversations (sorted by recent) |
| `POST` | `/api/conversations` | JWT | Create a new conversation |
| `DELETE` | `/api/conversations/:id` | JWT | Delete conversation + its messages |
| `GET` | `/api/conversations/:id/messages` | JWT | Get all messages in a conversation |
| `POST` | `/api/chat` | JWT | Send message — streams AI response via SSE |
| `GET` | `/api/faqs` | No | List FAQs (optional `?category=` filter) |
| `GET` | `/api/faqs/categories` | No | List all FAQ category names |
| `POST` | `/api/feedback` | JWT | Submit thumbs up/down rating on a message |
| `GET` | `/api/stats` | JWT | Get conversation + message counts for user |

---

## 🎨 Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Login / Register | `/auth` | Two-panel auth page with SRM branding |
| Dashboard | `/chat` | Stats cards, 6 quick action buttons, 6 submission type cards |
| Chat | `/chat/:id` | Real-time AI chat — streaming, Markdown, thumbs feedback |
| FAQ Library | `/faqs` | Search + category filter + expandable accordion |

---

## 🤖 AI Knowledge Base

The AI assistant is powered by a detailed system prompt (`backend/prompt.js`) covering:

| Topic | Details |
|-------|---------|
| Portal access | Registration, login, OTP verification |
| Submission steps | Dashboard navigation, file upload, team member addition |
| File requirements | PDF only, max 10 MB, naming convention |
| Formatting rules | IEEE format, TNR 12pt, page count minimums per type |
| Plagiarism policy | Turnitin/Unicheck, < 20% threshold, pre-check feature |
| Submission types | FYP, Mini Project, Internship, Seminar, Research Paper, Lab Record |
| Status meanings | Draft → Submitted → Under Review → Approved / Revision Requested |
| Resubmission | 3 attempts max, 5-day revision window |
| Dept-specific rules | CSE (GitHub link), ECE (vector PDFs), Biomedical (ethics letter) |
| Common errors | File too large, invalid format, plagiarism failed, portal issues |

---

## 🛠 Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend framework | React | 18 |
| Styling | Tailwind CSS | v3 |
| Routing | React Router | v6 |
| Build tool | Vite | 5 |
| Markdown renderer | react-markdown + remark-gfm | 9 / 4 |
| HTTP client | Axios | 1.6 |
| AI response streaming | Fetch API + Server-Sent Events | — |
| Backend runtime | Node.js | 18+ |
| Web framework | Express | 4 |
| Database | NeDB (embedded, file-based) | 1.8 |
| Password hashing | bcryptjs | 2.4 |
| Authentication | jsonwebtoken (JWT) | 9 |
| Environment config | dotenv | 16 |
| AI model | Anthropic Claude Sonnet | claude-sonnet-4-20250514 |

---

## 🔄 Code Changes Summary

| File | Status | What changed |
|------|--------|-------------|
| `backend/server.js` | Modified | Added static file serving, SPA fallback, CORS env var, dotenv, unified startup log |
| `backend/auth.js` | Modified | Added dotenv import |
| `backend/.env.example` | New | Template for required environment variables |
| `frontend/vite.config.js` | Modified | Added `strictPort: true`, explicit `outDir` |
| `frontend/tailwind.config.js` | New | Custom SRM colors, fonts, animations |
| `frontend/postcss.config.js` | New | PostCSS pipeline for Tailwind |
| `frontend/src/styles/global.css` | Replaced | Full Tailwind migration with `@layer components` |
| `frontend/src/utils/api.js` | Unchanged | `/api` base path works for both dev and production |
| `frontend/src/App.jsx` | Modified | Tailwind classes |
| `frontend/src/pages/AuthPage.jsx` | Modified | Tailwind — two-panel layout |
| `frontend/src/pages/Dashboard.jsx` | Modified | Tailwind — stat cards, action grid |
| `frontend/src/pages/ChatPage.jsx` | Modified | Tailwind — chat layout, suggestion chips |
| `frontend/src/pages/FaqPage.jsx` | Modified | Tailwind — accordion, category pills |
| `frontend/src/components/Sidebar.jsx` | Modified | Tailwind — dark sidebar, grouped history |
| `frontend/src/components/Message.jsx` | Modified | Tailwind — bubbles, prose styles, feedback buttons |
| `package.json` (root) | New | `build` + `start` scripts for single-platform deploy |
| `Dockerfile` | New | Container build for Fly.io |
| `.dockerignore` | New | Excludes node_modules, dist, db files |
| `.gitignore` | Updated | Added dist/, data_*.db, .env |
| `DEPLOYMENT.md` | New | Full cloud deployment guide (Render, Railway, Fly.io) |

> **Backend business logic — zero changes.** All API routes, database schema, authentication, streaming, and the SRM knowledge base (`prompt.js`, `db.js`) are identical to the original design.

---

## ❓ Troubleshooting

| Problem | Fix |
|---------|-----|
| `ANTHROPIC_API_KEY not set` | Create `backend/.env` with your key |
| `Port 3001 already in use` | `fuser -k 3001/tcp` (Mac/Linux) or restart PC (Windows) |
| `Port 3000 already in use` | `fuser -k 3000/tcp` or change port in `vite.config.js` |
| `Cannot find module` | Run `npm install` inside `backend/` and `frontend/` |
| Frontend shows blank page | Ensure backend is running on port 3001 first |
| Chat returns 500 error | Check `ANTHROPIC_API_KEY` is valid at console.anthropic.com |
| Styles look broken | Run `npm install` in `frontend/` — Tailwind must be installed |
| Windows: `.bat` won't run | Right-click → Run as Administrator |
| Render deploy fails | Check build logs — usually a missing env variable |
| Data lost after redeploy | Expected on Render free tier — disk resets on each deploy |

---

## 📝 Notes

- **Zero database setup** — NeDB auto-creates `backend/data_*.db` files on first run
- **No real SRM credentials needed** — register with any email and password
- **Persistent chat** — conversations and messages survive server restarts (local dev)
- **Feedback system** — every AI message has thumbs up/down stored in `data_feedback.db`
- **Single-port production** — Express serves React + API on the same port in production

---

Built for SRM Institute of Science and Technology — Kattankulathur, Chennai, Tamil Nadu, India.
