# 0004. Service boundary and schema ownership

Status: Accepted
Date: 2026-08-22

## Context
With both Next.js and FastAPI querying the same Supabase Postgres instance directly, two things needed a firm answer: which service is responsible for which functionality, and who owns the schema definition (to avoid two ORMs drifting against each other).

## Decision
- **Next.js**: all plain CRUD — catalog browsing/search, learner-profile reads/edits, progress and milestone tracking.
- **FastAPI**: everything that calls an LLM or does non-trivial computation — chat intake (Gemini extraction), the recommendation engine (ADR 0003), the path/milestone generator, and the explainer/Q&A endpoint.
- **Schema**: versioned raw SQL migrations under `supabase/migrations/`, applied directly to Supabase. Neither Next.js's DB client nor FastAPI's SQLAlchemy models are the source of truth — both read an already-defined schema, neither auto-migrates it.

## Consequences
- A new column or table always starts as a migration file, not an ORM model change on either side — slower for one-off scripts, but prevents the two services from silently disagreeing about the schema.
- FastAPI writes the learner profile it extracts directly (it's the one producing it) rather than routing that write through a Next.js CRUD endpoint — Next.js's profile ownership is reads/edits after the fact, not the initial write.
