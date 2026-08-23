# 0001. Stack selection: Next.js + FastAPI + Supabase Postgres

Status: Accepted
Date: 2026-08-22

## Context
Initial plan was React+Vite / FastAPI / SQLite. Revised mid-planning to Next.js / FastAPI / Supabase Postgres, on the author's explicit request rather than a discovered constraint. Original SQLite choice was fine for a solo demo but Postgres was wanted for the submission.

## Decision
- Frontend: Next.js (App Router), deployed to Vercel.
- Backend: FastAPI, deployed to Render (Supabase does not host Python).
- Database: Supabase, used purely as hosted Postgres — no Supabase Auth, Storage, Realtime, or client SDK. FastAPI and Next.js both query the same Postgres instance directly, each with its own driver.

## Consequences
- Two services now read/write the same schema in two languages — schema must live outside either ORM's auto-sync (see ADR 0004) or the two will drift.
- Supabase free tier is IPv6-only for direct connections; Render is IPv4-only, so FastAPI must connect through Supavisor (the pooler), not a plain connection string.
- Supabase free-tier projects auto-pause after 7 days idle, manual resume only — operational risk noted in CLAUDE.md, not solved here.
