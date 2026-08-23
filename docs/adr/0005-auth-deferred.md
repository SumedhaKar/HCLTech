# 0005. Auth deferred for MVP

Status: Accepted
Date: 2026-08-22

## Context
Supabase makes real auth close to free to add. None of the six judging criteria reward authentication, and the build budget is a solo developer with roughly 10-15 hours before the target internal deadline. The author delegated this call rather than stating a preference.

## Decision
No login for the MVP. The app runs against a single seeded mock learner (a fixed row in the database). Real auth is stretch scope only, considered if buffer days remain before the 31 Aug submission deadline — and even then only if it doesn't threaten the five required deliverables.

## Consequences
- Every feature (chat, recommendations, dashboard) is built and demoed against one fixed learner identity — simpler UI, no session/token handling anywhere.
- If auth is added later, it's additive (wrapping the existing mock-learner flow) rather than a rework, since nothing upstream assumes a specific learner ID format tied to a real auth provider.
