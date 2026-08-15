# Finance Tracker

AI-powered personal finance tracker. React + TypeScript frontend, Node/Express + Prisma backend, PostgreSQL, Gemini for AI features.

## Running locally with Docker

```bash
cp backend/.env.example backend/.env
# fill in JWT_ACCESS_SECRET / JWT_REFRESH_SECRET at minimum
# (openssl rand -hex 32) — AI/email/upload keys are optional

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- Postgres: localhost:5432 (user/pass/db: `finance`/`finance`/`finance_tracker`)
- Redis: localhost:6379 (provisioned, not yet used by the app)

The backend container runs `prisma migrate deploy` on every boot, so the
schema stays current automatically — no manual migration step needed.

## Running locally without Docker

```bash
# backend
cd backend
cp .env.example .env   # point DATABASE_URL at your own Postgres
npm install
npx prisma migrate dev
npm run dev

# frontend (separate terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Project structure

```
backend/    Express + TypeScript API, Prisma ORM, Postgres
frontend/   React + TypeScript + Vite, Tailwind, React Query
```

## Running backend tests

Tests run against a real disposable Postgres database (not mocked) — they
sign up real users, hit real routes, and check real DB state. The suite
truncates all tables between tests, so **never** point it at your dev or
prod database.

```bash
cd backend
cp .env.test.example .env.test   # DATABASE_URL should point at a throwaway DB
npm run test          # run once
npm run test:watch    # watch mode
```

If you're using the `docker compose` Postgres from above, the quickest way
to get a throwaway test DB is to create a second database inside that same
container:

```bash
docker compose exec postgres createdb -U finance finance_tracker_test
```

CI runs this same suite automatically against a fresh Postgres service
container on every push/PR — see `.github/workflows/ci.yml`.