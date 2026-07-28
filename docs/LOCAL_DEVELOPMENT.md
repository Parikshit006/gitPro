# GitPro — Local Development Setup Guide

A complete step-by-step guide for setting up the full GitPro stack locally. Follow every phase in order.

---

## Prerequisites

| Tool | Minimum Version | Install |
|------|----------------|---------|
| Node.js | v18+ (v20 recommended) | https://nodejs.org |
| npm | v9+ | Bundled with Node.js |
| Git | v2.30+ | https://git-scm.com |
| PostgreSQL | v14+ | https://www.postgresql.org/download/ |
| GitHub Account | Any | https://github.com/join |

> [!IMPORTANT]
> You **do not** need Docker, Redis, or any cloud services to run GitPro locally. A plain PostgreSQL installation is sufficient.

---

## Phase 1 — Clone the Repository

```bash
git clone https://github.com/your-org/gitpro.git
cd gitpro
```

---

## Phase 2 — PostgreSQL Database Setup

### 2.1 Start PostgreSQL
Make sure PostgreSQL is running on your machine:
- **Windows**: Start the "PostgreSQL" service via Services or pgAdmin
- **macOS**: `brew services start postgresql@16`
- **Linux**: `sudo systemctl start postgresql`

### 2.2 Create the GitPro Database
```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Inside psql shell:
CREATE DATABASE gitpro_dev;
CREATE USER gitpro WITH ENCRYPTED PASSWORD 'supersecret';
GRANT ALL PRIVILEGES ON DATABASE gitpro_dev TO gitpro;
\q
```

### 2.3 Verify Connection
```bash
psql -U gitpro -d gitpro_dev -h localhost
# Should connect without error. Press \q to exit.
```

---

## Phase 3 — GitHub OAuth App Setup

You need a GitHub OAuth App so users can log in with their GitHub accounts.

### 3.1 Create the OAuth App
1. Go to **GitHub → Settings → Developer settings → OAuth Apps**
2. Click **New OAuth App**
3. Fill in the form:

| Field | Local Development Value |
|-------|------------------------|
| Application name | GitPro Local |
| Homepage URL | `http://localhost:5173` |
| Authorization callback URL | `http://localhost:3000/api/v1/auth/github/callback` |

4. Click **Register application**
5. Copy the **Client ID** (shown immediately)
6. Click **Generate a new client secret** and copy it (shown once only!)

> [!CAUTION]
> The Client Secret is shown **once**. If you lose it, generate a new one. Never commit it to version control.

### 3.2 OAuth Flow Explanation
```
User clicks "Sign in with GitHub"
        ↓
Frontend → Backend GET /api/v1/auth/github
        ↓
Backend builds GitHub authorization URL with state parameter
        ↓
Browser redirects to GitHub
        ↓
User authorizes the GitPro application
        ↓
GitHub redirects → Backend GET /api/v1/auth/github/callback?code=...&state=...
        ↓
Backend: validates state, exchanges code for access token, fetches GitHub profile
        ↓
Backend: upserts user in PostgreSQL, generates JWT, sets HttpOnly cookie
        ↓
Backend redirects → Frontend http://localhost:5173/dashboard
        ↓
Frontend: cookie is automatically sent with all subsequent API requests
```

### 3.3 Common OAuth Mistakes
| Mistake | Fix |
|---------|-----|
| Callback URL doesn't match exactly | Must be `http://localhost:3000/api/v1/auth/github/callback` |
| Using `http` in production | Switch to `https` and update both backend and GitHub app |
| Client Secret expired or regenerated | Update `GITHUB_CLIENT_SECRET` in `.env` |
| Missing `state` parameter errors | Clear browser cookies and try again |

---

## Phase 4 — Backend Setup

### 4.1 Install Dependencies
```bash
cd backend
npm install
```

### 4.2 Configure Environment
```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and fill in:
```env
# Required
DATABASE_URL=postgresql://gitpro:supersecret@localhost:5432/gitpro_dev
JWT_SECRET=your-very-long-random-secret-at-least-32-chars
GITHUB_CLIENT_ID=your-client-id-from-step-3
GITHUB_CLIENT_SECRET=your-client-secret-from-step-3
GITHUB_CALLBACK_URL=http://localhost:3000/api/v1/auth/github/callback
FRONTEND_URL=http://localhost:5173

# Optional (defaults are fine for local dev)
PORT=3000
NODE_ENV=development
JWT_EXPIRES_IN=7d
COOKIE_NAME=gitpro_session
AI_PROVIDER=MOCK
```

> [!TIP]
> Generate a secure JWT secret: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

### 4.3 Generate Prisma Client
```bash
npx prisma generate
```
Expected output: `✔ Generated Prisma Client` 

### 4.4 Run Database Migrations
```bash
npx prisma migrate dev --name init
```
Expected output:
```
✔ Generated Prisma Client
Your database is now in sync with your schema.
```

This creates all tables: `users`, `repositories`, `repository_snapshots`, `commit_events`, `file_nodes`, `commit_nodes`, `graph_edges`, `metric_results`.

### 4.5 Verify Schema (Optional)
```bash
npx prisma studio
# Opens Prisma Studio at http://localhost:5555
# You can view all tables and verify they were created
```

### 4.6 Start the Backend
```bash
npm run dev
```

Expected output:
```
Server is running on port 3000
```

### 4.7 Verify Backend Health
```bash
curl http://localhost:3000/health
# Expected: {"success":true,"message":"GitPro Backend Healthy",...}
```

---

## Phase 5 — Frontend Setup

### 5.1 Install Dependencies
```bash
cd ../frontend
npm install
```

### 5.2 Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_GITHUB_CLIENT_ID=your-client-id-from-step-3
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/login
```

### 5.3 Start the Frontend
```bash
npm run dev
```

Expected output:
```
  VITE v6.x.x  ready in xxx ms
  ➜  Local:   http://localhost:5173/
```

---

## Phase 6 — Run Both Servers (Production Setup)

Open two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Running at http://localhost:3000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Running at http://localhost:5173
```

---

## Phase 7 — End-to-End Verification Flow

1. Open **http://localhost:5173** — you should see the GitPro landing page
2. Click **Continue with GitHub** or navigate to **http://localhost:5173/login**
3. Click the login button — you should be redirected to GitHub
4. Authorize the app on GitHub — you should be redirected to **http://localhost:5173/dashboard**
5. On the Dashboard page, click **Add Repository**
6. Enter a GitHub URL: `https://github.com/facebook/react`
7. Click **Connect** — the repository should appear in status `REGISTERED`
8. Navigate to **Repositories** — find your repo, click **Sync**
9. Wait for status to change from `SYNCING` to `READY`
10. Navigate to **AI** — ask a question about your repository
11. Navigate to **Reports** — generate an executive report
12. Navigate to **Settings** — verify your profile is shown correctly

---

## Phase 8 — Common Errors & Solutions

| Error | Likely Cause | Solution |
|-------|-------------|----------|
| `[FATAL] Missing required environment variable: JWT_SECRET` | Missing `.env` | Copy `.env.example` to `.env` and fill in values |
| `[FATAL] Missing required environment variable: DATABASE_URL` | Missing `.env` | Same as above |
| `Can't reach database server at localhost:5432` | PostgreSQL not running | Start PostgreSQL service |
| `CORS: Origin not allowed` | Frontend URL mismatch | Ensure `FRONTEND_URL=http://localhost:5173` in backend `.env` |
| `Authentication required. No session cookie` | Cookie not sent | Ensure `withCredentials: true` in Axios (already set in `api.ts`) |
| `Authentication failed: invalid or expired state` | Stale OAuth state | Clear browser cookies, try login again |
| `Repository already registered` | Duplicate registration | Use a different repo URL or check Repositories page |
| `Repository not found on GitHub` | Incorrect URL or private repo | Verify the URL exists and is public (or configure GitHub token) |
| Blank dashboard after login | Database empty | Add a repository and sync it first |
| Port 3000 already in use | Another process | Change `PORT=3001` in backend `.env` and update frontend `VITE_API_URL` |
| TypeScript errors on `npm run dev` | Outdated Prisma client | Run `npx prisma generate` again |

---

## Phase 9 — Build for Production

### Backend
```bash
cd backend
npm run build        # Compiles TypeScript → dist/
npm start            # Starts dist/server.js
```

### Frontend
```bash
cd frontend
npm run build        # Vite production bundle → dist/
# Serve dist/ with nginx, Vercel, Netlify, or any static host
```

---

## Phase 10 — API Key Configuration for AI Features

By default, GitPro uses the `MOCK` AI provider which returns deterministic simulated responses without any API key. To enable real AI:

### OpenAI
1. Get API key: https://platform.openai.com/api-keys
2. In backend `.env`:
```env
AI_PROVIDER=OPENAI
AI_MODEL_NAME=gpt-4o
AI_API_KEY=sk-proj-your-openai-api-key
```

### Anthropic Claude
1. Get API key: https://console.anthropic.com/settings/keys
2. In backend `.env`:
```env
AI_PROVIDER=ANTHROPIC
AI_MODEL_NAME=claude-3-5-sonnet-20241022
AI_API_KEY=sk-ant-your-anthropic-api-key
```

---

## Architecture Summary

```
Browser (http://localhost:5173)
        │ HTTP + withCredentials cookie
        ▼
Frontend (Vite + React + TanStack Query)
        │ Axios → http://localhost:3000/api/v1
        ▼
Backend (Express + TypeScript)
  ├── Auth Module (GitHub OAuth + JWT)
  ├── Repository Module (Registration + Sync)
  ├── Dashboard Module (Metrics + Analytics)
  ├── AI Module (OpenAI / Anthropic / Mock)
  ├── Search Module (Unified Search)
  ├── Report Module (PDF/HTML/JSON exports)
  └── Notification Module (Email/Slack/Webhook)
        │ Prisma ORM
        ▼
PostgreSQL (localhost:5432/gitpro_dev)
```

---

## Quick Start (TL;DR)

```bash
# 1. Clone
git clone https://github.com/your-org/gitpro && cd gitpro

# 2. Database
createdb gitpro_dev

# 3. Backend
cd backend && cp .env.example .env
# Edit .env: DATABASE_URL, JWT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, GITHUB_CALLBACK_URL
npm install && npx prisma generate && npx prisma migrate dev && npm run dev

# 4. Frontend (new terminal)
cd frontend && cp .env.example .env
# Edit .env: VITE_API_URL, VITE_GITHUB_CLIENT_ID
npm install && npm run dev

# 5. Open http://localhost:5173
```
