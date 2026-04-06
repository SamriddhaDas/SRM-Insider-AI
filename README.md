# SRM Insider AI — Full Stack

> AI-powered submission query assistant for SRM Institute of Science and Technology (SRMIST) students.
> Built with **React 18 + Tailwind CSS + Express + NeDB + Anthropic Claude Sonnet**.

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

## 📝 Notes

- **Zero database setup** — NeDB auto-creates `backend/data_*.db` files on first run
- **No real SRM credentials needed** — register with any email and password
- **Persistent chat** — conversations and messages survive server restarts (local dev)
- **Feedback system** — every AI message has thumbs up/down stored in `data_feedback.db`
- **Single-port production** — Express serves React + API on the same port in production

---
