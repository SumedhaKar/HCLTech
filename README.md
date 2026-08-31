# PathFinder

AI-powered personalized learning path recommender — turns a learner's stated goal into a sequenced, prerequisite-aware course roadmap with milestones and per-step explanations, instead of a flat course-search list.

Built solo for HCLTech's AMPlified Round 2 hackathon (team "Meteors"). See `PRODUCT.md` for product context, `SOLUTION.md` for the full solution writeup, and `docs/adr/` for architecture decisions.

- **Live app:** https://hcl-tech-delta.vercel.app
- **Live API:** https://hcltech-73xc.onrender.com/docs

## Stack

- **Frontend** (`frontend/`) — Next.js (App Router), deployed to Vercel. Owns CRUD: catalog browsing, learner-profile reads/edits, learning-path/status.
- **Backend** (`backend/`) — FastAPI, deployed to Render. Owns the AI/ML surface: chat intake, recommendation engine, path generation, explainer.
- **Database** — Supabase, used purely as hosted Postgres (no Supabase Auth/Storage/Realtime/client SDK). Schema is versioned SQL under `supabase/migrations/` — neither service's ORM/query layer auto-migrates it.
- **LLM** — Google Gemini API (structured extraction, embeddings, explanations).

Full reasoning for each choice: `docs/adr/`.

## Prerequisites

- Node.js 20+
- Python 3.12 (pinned — see `backend/runtime.txt`)
- A Supabase project (or any reachable Postgres instance) and a Gemini API key ([aistudio.google.com](https://aistudio.google.com))

## 1. Database setup

Apply the schema and seed data, in order, against your Postgres instance:

```bash
psql "<your-connection-string>" -f supabase/migrations/0001_init.sql
psql "<your-connection-string>" -f supabase/seed/0001_courses.sql
psql "<your-connection-string>" -f supabase/seed/0002_courses_expansion.sql
psql "<your-connection-string>" -f supabase/seed/0003_ai_engineering_courses.sql
psql "<your-connection-string>" -f supabase/seed/0004_data_analyst_courses.sql
```

`0001_init.sql` creates the schema and seeds one mock learner (`00000000-0000-0000-0000-000000000001`) — auth is deliberately out of scope for this build (see `docs/adr/0005-auth-deferred.md`), so every request in local dev and production acts on this one learner. The four seed files load 112 real courses across 17 domains.

## 2. Backend setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows; use `source .venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
cp .env.example .env
```

Fill in `backend/.env`:

```
DATABASE_URL=postgresql+asyncpg://<user>:<password>@<host>:5432/postgres
GEMINI_API_KEY=<your key>
CORS_ORIGINS=http://localhost:3000
```

If connecting to Supabase, use the **Supavisor pooler connection string** (session mode, port 5432), not the direct connection — this matters if you're deploying to an IPv4-only host, since Supabase's free-tier direct connection is IPv6-only.

Run it:

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000
```

Verify at `http://localhost:8000/docs`. Run the test suite with `pytest` (runs offline — Gemini calls are monkeypatched).

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
```

Fill in `frontend/.env.local`:

```
DATABASE_URL=postgresql://<user>:<password>@<host>:5432/postgres
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:8000
```

Run it:

```bash
npm run dev
```

Open `http://localhost:3000` — start at the chat screen (`/chat`) to build a learner profile, then `/dashboard` for the generated path, `/catalog` to browse all courses, `/profile` to view/edit the profile directly.

Run tests with `npm test`, lint with `npm run lint`, production build with `npm run build`.

## Notes

- Both services must point at the **same** Postgres instance — Next.js writes/reads the learner profile and path status directly; FastAPI writes the profile from chat intake and generates the path.
- Supabase's free tier auto-pauses after 7 days of inactivity (manual resume only), and Render's free tier cold-starts on first request after idling — expect a delay on the very first request if the deployed services have been idle.
