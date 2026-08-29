# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

General lifelong learners, in any domain, who have a goal but not a clear route to it — they know what they want to become or learn, but not which courses to take in what order. They arrive with varying interests, experience levels, prior completed courses, and available time per week.

Confirmed demo/build persona (used for current seed data and should anchor UI copy, screenshots, and the demo video): a career switcher whose goal is "Become a backend engineer," beginner experience level, ~6 hours/week available, interested in backend development, databases, and APIs.

Auth is deferred (see Capabilities below), so in practice every session today is this one learner.

## Product Purpose

Bridges the gap between "which course" and "which sequence." Takes a learner's stated goal, interests, experience level, and completed courses, and produces a structured, prerequisite-aware learning roadmap — not just a list of relevant courses, but an ordered path with milestones — and explains why each step was recommended. Success is a learner walking away with a concrete, personalized plan they understand and trust enough to act on.

## Positioning

Not a flat, one-size-fits-all course recommendation list — the team explicitly rejected that as the "safe but thin" default (see docs/adr/0003). The mechanism a simpler competitor wouldn't have: rule-based prerequisite/tag filtering as a guaranteed-working baseline, with Gemini-embedding similarity ranking layered on top, and every recommendation paired with a natural-language explanation a learner can question and probe further (chat-based explainer/Q&A), not just a static "why" tooltip.

## Operating Context

Built solo for HCLTech's AMPlified Round 2 hackathon (team "Meteors"), deadline 31 Aug 2026 11:59pm IST. Judged against six weighted criteria: Problem Understanding & Solution Design (20%), Functionality & Feature Completeness (25%), AI/ML Implementation (20%), Innovation & Creativity (15%), User Experience & Interface (10%), Performance & Code Quality (10%) — see docs/reference/ for the original screenshots. Five deliverables are required: source ZIP, GitHub repo, solution documentation, a 3–5 minute demo video, and a deployed application URL.

The app runs against a single seeded mock learner — no login, no session UI (see Capabilities). Two live surfaces exist today: a course catalog browse page (frontend/app/catalog), and a set of API-only endpoints (learner-profile, learning-path, chat intake, recommendations, explainer) with no dedicated UI built yet — the homepage is still the unmodified create-next-app scaffold.

## Capabilities and Constraints

- Conversational intake (Gemini structured extraction) turns a natural-language goal statement into a learner-profile patch: goal, interests, experience level, completed courses, time budget per week.
- Hybrid recommendation engine: rule-based prerequisite/tag filtering first (always shippable on its own), Gemini-embedding similarity ranking layered on top. Generates a sequenced learning path with milestones and a per-item rationale.
- Explainer/Q&A endpoint answers a learner's free-text questions about why a specific path item was recommended, using the surrounding path as context.
- Catalog: 49 real seeded courses (real titles, descriptions, and external source URLs — not fabricated), spanning multiple tech domains: Programming Fundamentals, Web Development, Cybersecurity, Data, Mobile, and others.
- No auth for the MVP — a single fixed mock learner ID, no account/session UI anywhere. Additive if auth is ever added later, not a rework (see docs/adr/0005).
- Service boundary: Next.js owns CRUD (learner profile, learning path, catalog browsing); FastAPI owns the AI/ML surface (chat intake, recommendations, path generation, explainer) — see docs/adr/0004.
- Free-tier operating risk that can surface live during a demo or judging session: Supabase's free tier auto-pauses after 7 days of inactivity and only resumes manually (no auto-wake on traffic); Render's free tier has cold starts; Gemini's free tier has rate limits.

## Brand Commitments

Product name is **PathFinder** — confirmed as the real brand name, not a placeholder. Design should use it as the actual product name (wordmark/logo treatment, page titles, etc.). No visual identity exists yet beyond the name itself.

## Evidence on Hand

- 49 real seeded courses in the live database (title, description, domain, level, skills taught, prerequisite skills, and a real external `sourceUrl` per course) — genuine catalog content, not placeholder data.
- One seeded mock learner in the live Supabase database, currently holding real Gemini-generated demo data matching the confirmed persona above (goal "Become a backend engineer," beginner, 6 hrs/week, interests backend/databases/apis) and two generated learning paths from live testing.
- No testimonials, press, case studies, user research, or additional learner data exist. Future work must not fabricate any of these.

## Product Principles

1. **Sequence over search** — the core value is turning a goal into an ordered, prerequisite-aware roadmap, not another course-search box.
2. **Explain every recommendation** — a learner can always ask "why this, why now" and get a real, specific answer, not a generic blurb.
3. **Ship the honest fallback first** — rule-based filtering must stand on its own before embedding-similarity ranking layers on top; the AI layer is never a single point of failure for the core feature.
4. **One learner, no friction** — with auth deferred, the experience should feel complete and personal for the single seeded learner, not like a stripped-down placeholder waiting for a login screen.
5. **Design for a judge watching once, cold** — the live experience needs to hold up in a single short pass through free-tier pauses and cold starts, not just under ideal local conditions.
