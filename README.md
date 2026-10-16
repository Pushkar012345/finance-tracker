# 💰 Finance Tracker

An AI-powered personal finance tracker to manage transactions, budgets, savings goals, and recurring payments — with smart categorization and monthly reports powered by Google Gemini.

**[Live Demo](#) · [Report Bug](#) · [Request Feature](#)**

---

## ✨ Features

- **Transactions** — Track income and expenses with custom categories and icons
- **AI Categorization** — Describe an expense in plain text and let Gemini AI suggest the right category
- **Budgets** — Set monthly budgets per category with automatic alerts when you're close to your limit
- **Goals** — Create savings goals and track progress over time
- **Recurring Payments** — Automate recurring bills/subscriptions with scheduled background jobs
- **Notifications** — In-app + email alerts for budget overruns and upcoming recurring payments
- **Monthly Reports** — Auto-generated PDF summaries of your spending, emailed on a schedule
- **Receipt Uploads** — Attach receipt images via Cloudinary
- **Secure Auth** — JWT access/refresh token flow with rotation, login lockout protection, and automatic expired-token cleanup
- **Dashboard Visualizations** — Category-wise spending charts and balance overview with Recharts

## 🛠️ Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS
- TanStack React Query
- React Router
- Recharts
- Axios

**Backend**
- Node.js + Express 5 + TypeScript
- PostgreSQL + Prisma ORM
- JWT authentication (access + refresh tokens)
- Zod validation
- node-cron (recurring payments, budget alerts, monthly reports, token cleanup)
- Google Gemini API (AI transaction categorization)
- Cloudinary (receipt image uploads)
- Nodemailer (email notifications)
- Vitest + Supertest (integration tests against a real Postgres instance)

**DevOps**
- Docker multi-stage builds (non-root users, built-in healthchecks) and Docker Compose
- nginx serving the compiled frontend
- GitHub Actions CI: type-check, lint, tests against real Postgres, plus a Docker job that boots the full stack and smoke-tests `/health` and `/health/ready`
- Liveness (`/health`) and readiness (`/health/ready`, checks the database) endpoints
- Deployable to Render / Railway (backend) and Vercel (frontend)

## 📂 Project Structure

```
finance-tracker/
├── backend/           # Express API, Prisma schema & migrations
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── jobs/          # cron jobs: recurring payments, budget alerts, reports, cleanup
│   │   ├── middleware/
│   │   └── validators/
│   └── prisma/
├── frontend/          # React + Vite SPA
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── context/
│       └── lib/
├── docker-compose.yml
└── render.yaml / railway.json / vercel.json
```

## 🚀 Getting Started

### Option 1: Docker (recommended)

```bash
git clone https://github.com/<your-username>/finance-tracker.git
cd finance-tracker

cp backend/.env.example backend/.env
# fill in JWT_ACCESS_SECRET / JWT_REFRESH_SECRET at minimum
# (generate with: openssl rand -hex 32)
# AI / email / upload keys are optional — the app boots fine without them

docker compose up --build
```

- Frontend → http://localhost:5173
- Backend → http://localhost:4000
- Postgres → localhost:5432

The backend container runs `prisma migrate deploy` on boot, so the schema is always up to date automatically.

### Option 2: Manual setup

```bash
# Backend
cd backend
cp .env.example .env       # point DATABASE_URL at your own Postgres
npm install
npx prisma migrate dev
npm run dev

# Frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Environment Variables (backend)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_ACCESS_SECRET` | ✅ | Secret for signing access tokens |
| `JWT_REFRESH_SECRET` | ✅ | Secret for signing refresh tokens |
| `FRONTEND_ORIGIN` | – | Allowed CORS origin (default `http://localhost:5173`) |
| `GEMINI_API_KEY` | – | Enables AI-based transaction categorization |
| `CLOUDINARY_*` | – | Enables receipt image uploads |
| `SMTP_*` | – | Enables email notifications for budget alerts / reports |

Every optional integration degrades gracefully — the app boots and the rest of the features work even if a key is missing.

## 🧪 Running Tests

Tests run against a real, disposable Postgres database (not mocked) — they sign up real users, hit real routes, and assert on real DB state.

```bash
cd backend
cp .env.test.example .env.test   # point DATABASE_URL at a throwaway DB
npm run test          # run once
npm run test:watch    # watch mode
```

If using the Docker Postgres above, spin up a throwaway test DB in the same container:

```bash
docker compose exec postgres createdb -U finance finance_tracker_test
```

CI runs this same suite automatically on every push/PR via GitHub Actions.

## 📸 Screenshots

<!-- Add dashboard, budgets, goals, and AI assistant screenshots here -->

## 🗺️ Roadmap

- [ ] Redis-backed caching / rate limiting (Redis is already provisioned in Docker Compose but unused)
- [ ] Multi-currency support
- [ ] CSV import/export for transactions
- [ ] Shared/household budgets

## 📄 License

This project is licensed under the MIT License.