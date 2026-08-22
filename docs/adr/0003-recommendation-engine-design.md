# 0003. Recommendation engine: hybrid rule-based + hosted embeddings

Status: Accepted
Date: 2026-08-22

## Context
Judging weights "AI/ML Implementation" at 20%. A pure tag-matching recommender is safe and fast to build but reads as thin against that criterion; a full embedding-similarity system is more convincing but is real extra work on a solo, ~10-15 hour budget. The author chose ambition over the safer default recommended during planning.

## Decision
Hybrid: rule-based prerequisite/tag filtering as the baseline (built first, always shippable on its own), with embedding-similarity ranking layered on top. Embeddings are computed via the Gemini embeddings API, not a locally-bundled model (e.g. `sentence-transformers`).

## Why hosted, not local, embeddings
A local embedding model pulls in a large dependency and real CPU load, which is risky on Render's free tier (slow cold starts, low RAM, possible crash under a judge's live test). Calling Gemini's embedding endpoint keeps the backend light and avoids that failure mode, at the cost of one more external network call per recommendation request.

## Consequences
- Because the rule-based layer is built and shippable before embeddings are added, the project always has a working fallback if embeddings run out of time or misbehave.
- Recommendation quality now depends on Gemini API availability at request time — same dependency the chat-intake feature already has, not a new failure class.
