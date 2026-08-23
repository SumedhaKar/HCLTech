# PathFinder — AI-powered personalized learning path recommender

AMPlified Round 2 submission (HackerEarth, team "Meteors", deadline 31 Aug 2026 11:59pm IST). See `docs/reference/` for the original problem statement screenshots and `docs/adr/` for why the stack looks the way it does.

## Stack

- **Frontend** (`frontend/`): Next.js (App Router), deployed to Vercel.
- **Backend** (`backend/`): FastAPI, deployed to Render.
- **Database**: Supabase Postgres — plain hosted Postgres only, no Supabase Auth/Storage/Realtime/client SDK. Schema lives as versioned SQL in `supabase/migrations/`; neither side owns it via ORM auto-sync.
- **LLM**: Google Gemini API (free tier) — not Anthropic's API, which has no standing free tier. Used for chat-intake extraction, recommendation explanations, and embeddings.

Full reasoning for each of these: `docs/adr/`.

## Service boundary

Next.js owns CRUD: catalog browsing, learner-profile reads/edits, progress/milestone tracking.
FastAPI owns the AI/ML surface: chat intake (Gemini structured extraction), the recommendation engine (rule-based filtering → Gemini-embedding similarity), the path generator, and the explainer/Q&A endpoint.

FastAPI connects to Supabase through the Supavisor pooler in session mode (`5432`), not a direct connection string — Render is IPv4-only and Supabase's free-tier direct connection is IPv6-only.

## Hard rules

- **No AI/Claude/Anthropic attribution anywhere** — not in commit messages, PR descriptions, code comments, or docs. No co-author trailers, no "Generated with Claude Code" signatures. Every commit reads as the author's own work. This is a deliberate, explicit rule, not a default being skipped.
- **OCT (the orchestrating session) merges a PR automatically once the INT agent confirms it** — standing authorization, not a per-PR ask. This was explicitly granted to move faster on a solo, time-boxed build; revoke it here if that changes.

## Workflow

Multi-agent build: an FE agent and a BE agent work each slice in parallel on their own branches (`feat/fe-<slice>`, `feat/be-<slice>`), each opening a PR when done. An INT agent then runs automated tests and verifies the FE↔BE integration end-to-end (env vars, CORS, API base URLs) on `test/int-<slice>`. On pass, OCT merges. On fail, the specific failure routes back to whichever agent owns it.

Auth is deliberately deferred (see ADR 0005) — the app runs against a single seeded mock learner, no login.

## Operational gotcha

Supabase's free tier auto-pauses a project after 7 days of inactivity, and resuming is **manual only** — no auto-wake on incoming traffic. If the project sits untouched for a few days, resume it manually before a demo or judging session, or wire up a trivial scheduled ping.
