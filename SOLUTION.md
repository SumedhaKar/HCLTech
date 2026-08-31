# PathFinder — Solution Documentation

**AMPlified Round 2 submission — Team "Meteors"**

- **Live app:** https://hcl-tech-delta.vercel.app
- **Live API:** https://hcltech-73xc.onrender.com (interactive docs at `/docs`)
- **Repository:** https://github.com/SumedhaKar/HCLTech

---

## 1. Problem

Course catalogs answer "what could I learn," not "what should I learn, in what order, to actually get where I'm going." A learner with a stated goal — "become a backend engineer," "become a criminal lawyer" — is left to manually figure out which of hundreds of courses are relevant, which ones depend on others, and which order makes sense. Generic recommendation lists compound this: they surface *related* content, not a *route*.

PathFinder takes a learner's goal, interests, experience level, and completed courses, and turns them into a sequenced, prerequisite-aware learning path with milestones — plus a plain-language explanation for every step, so the learner can question and understand the plan rather than just receive it.

## 2. Who it's for

General lifelong learners, in any domain, who know what they want to become but not the route to get there. The catalog spans 17 domains — not just software — because the problem ("I have a goal, not a syllabus") applies equally to a career switcher into backend engineering and one into law, biosciences, or civil engineering. The confirmed build/demo persona: a career switcher whose goal is "Become a backend engineer," beginner level, ~6 hrs/week, interested in backend development, databases, and APIs.

## 3. What it does

1. **Conversational intake** — a short chat (not a form) extracts goal, interests, experience level, completed courses, and weekly time budget from natural language.
2. **Recommendation engine** — filters the catalog by prerequisites, level, and interest relevance, then ranks the survivors by semantic similarity to the stated goal.
3. **Path generation** — turns the ranked candidates into a sequenced, milestone-labeled route (Foundations → Core Skills → Advanced Practice), each item carrying a specific rationale for why it's there.
4. **Explainer / Q&A** — a learner can ask "why this course" or "why not X instead" about any path item and get a real, specific answer, not a static tooltip.
5. **Dashboard** — the learner's live path with per-item status (not started / in progress / completed) so progress persists across visits, plus a skill-development panel that aggregates each course's skills into "gained" (from completed items) versus "ahead on your route" (from what's left) — turning a flat course list into a visible skills trajectory, not just a checklist. The panel also shows a real time-to-complete estimate (total stays fixed at the path's actual course-provider durations; a second remaining-hours figure shrinks live as items are completed) and a static, per-milestone suggested project. Completing an item also updates the learner's known-skills record, and a "Regenerate path" action re-runs generation against that — so the plan actually adapts to progress instead of staying frozen after the first generation.
6. **Catalog & profile** — full browse/search of all 112 seeded courses, and a direct view/edit screen for the learner's own profile, independent of the chat flow.

## 4. Architecture

```
┌─────────────────┐        ┌──────────────────┐        ┌─────────────────┐
│   Next.js (FE)   │──CRUD──▶│  Supabase Postgres │◀──CRUD──│   FastAPI (BE)   │
│   Vercel          │        │  (Supavisor pooler) │        │   Render          │
└─────────────────┘        └──────────────────┘        └─────────────────┘
        │                                                        │
        │  chat intake, path generation, explainer (client-side)  │
        └───────────────────────HTTP───────────────────────────┘
                                                                   │
                                                          ┌─────────────┐
                                                          │  Gemini API   │
                                                          │  (Google AI)  │
                                                          └─────────────┘
```

**Service boundary** (docs/adr/0004): Next.js owns plain CRUD — catalog browsing, learner-profile reads/edits, path/milestone status. FastAPI owns everything that calls an LLM or does non-trivial computation — chat intake, the recommendation engine, path generation, and the explainer. Both services query the same Postgres instance directly, each with its own driver; neither ORM auto-syncs the schema — it lives as versioned SQL under `supabase/migrations/`, so the two languages can't silently drift apart.

**Why this stack** (docs/adr/0001): Next.js/Vercel and FastAPI/Render as separate deployables, Supabase used purely as hosted Postgres (no Supabase Auth/Storage/Realtime/client SDK). FastAPI reaches Postgres through the Supavisor pooler in session mode, not a direct connection string, because Render is IPv4-only and Supabase's free-tier direct connection is IPv6-only.

**Why Gemini, not Anthropic** (docs/adr/0002): the Anthropic API has no standing free tier, only a one-time trial credit — a bad fit for a demo whose exact judging moment isn't controlled by the author. Gemini's free tier is card-free with no expiry.

## 5. AI/ML implementation

The recommendation engine is a deliberate hybrid, not a single embedding call (docs/adr/0003):

1. **Rule-based filtering first** (`backend/app/services/recommender.py::filter_candidates`) — excludes completed courses, courses whose prerequisites aren't yet met, courses more than one level above the learner, and courses that don't match a stated interest against the course's domain or skill tags (with a curated alias table closing the gap between generic words learners type — "API," "backend" — and the catalog's technology-specific tags). This layer is cheap, deterministic, and fully functional on its own — the AI layer is never a single point of failure for the core feature.
2. **Embedding-similarity ranking second** (`rank_candidates`) — the filtered survivors are ranked by cosine similarity between a Gemini embedding of the learner's goal+interests and a Gemini embedding of each course's title/description/skills, so the final ordering reflects semantic fit, not just keyword overlap. This call is not a single point of failure in practice, not just in principle: `build_learning_path` catches a Gemini embedding failure (rate limit, transient API error) and falls back to the rule-based candidates in their filtered order rather than returning a 502 — a learner still gets a complete, valid path, just without the semantic re-ranking on top.
3. **Domain-grounded chat intake** — the intake prompt (`backend/app/services/gemini_intake.py`) is given the catalog's real 17-domain taxonomy and instructed to append the closest-matching domain to a learner's niche, specific interest (e.g. "forensic science" → also tags `"Law"`), so a specific goal still surfaces the catalog's relevant foundational courses even when no course tag literally contains the learner's exact words. This was a deliberate architectural choice over two rejected alternatives: hand-coding an ever-growing interest→domain alias map (doesn't scale to arbitrary phrasing), and blind substring-matching the learner's raw goal sentence against domain names (demonstrably unsafe — short domain words like "law" are literal substrings of unrelated words such as "flawless").
4. **Explainer/Q&A** (`gemini_explain.py`) — answers free-text follow-up questions about a specific path item using the surrounding path as context, so "why this, why now" always gets a real answer.

Hosted embeddings (Gemini's API) were chosen over a locally-bundled model deliberately: a local embedding model adds real CPU/RAM load, which is risky on Render's free tier during a judge's live test; a network call to Gemini keeps the backend light at the cost of one more external hop.

## 6. Design

The product has a documented design system (`DESIGN.md`) — "The Night Trail": a near-black, monochrome UI with exactly one saturated accent color, used only for the primary action and the confirmation motion (the "One Accent Rule"). Difficulty grading is expressed as a light-to-black tonal scale rather than red/amber/green status colors (the "Graded-Not-Colored Rule"). The homepage carries one deliberate, scoped exception in type and shape only (Inter/Instrument Serif, liquid-metal buttons) to give the landing page more expressive range than the task screens, while sharing the same color tokens as the rest of the product so it still reads as one system.

## 7. What's deliberately out of scope

**No login/authentication** (docs/adr/0005) — the app runs against a single seeded mock learner. This was an explicit, considered trade-off: none of the six judging criteria reward authentication, and the build budget was a solo developer with roughly 10-15 hours. If auth is added later, the schema and every route are structured so it's additive (wrapping the existing mock-learner flow), not a rework.

## 8. Engineering notes

- **Testing**: 40 backend unit tests (`backend/tests/`) cover the recommendation engine's filtering rules — prerequisite gating, level restriction, interest matching, alias resolution, and the "short/correct path over a padded/irrelevant one" behavior — with Gemini calls monkeypatched out for deterministic, offline runs. 28 frontend tests cover component/route logic alongside the profile and learning-path pages, plus the dashboard's project-suggestion template matching.
- **Schema ownership**: versioned raw SQL migrations (`supabase/migrations/`) are the single source of truth; neither service's ORM/query layer auto-migrates it.
- **Deployment**: both services are live — Vercel (frontend, auto-deploys from `main`) and Render (backend, pinned to Python 3.12 via a dashboard env var after a build break on Render's newer default). `CORS_ORIGINS` on the backend is explicitly scoped to the deployed frontend origin plus localhost.
- **Known operating risk**: Supabase's free tier auto-pauses after 7 days of inactivity with manual-only resume, and Render's free tier cold-starts on the first request after idling — both disclosed in `CLAUDE.md` rather than hidden, since they can surface live during judging.

## 9. Repository map

```
frontend/          Next.js app (App Router) — catalog, chat, dashboard, profile, CRUD API routes
backend/            FastAPI app — chat intake, recommendation engine, path generator, explainer
supabase/           Versioned SQL migrations + seed data (112 courses, 17 domains)
docs/adr/           Architecture decision records (0001-0006)
docs/contract/      API contract shared between FE and BE during parallel build
DESIGN.md           The Night Trail design system
PRODUCT.md          Product context, personas, judging-criteria mapping, principles
```
