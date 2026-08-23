# API contract

Written before Slices 1–4 so FE and BE can build against it in parallel without blocking on each other. Schema referenced here is `supabase/migrations/0001_init.sql`. Mock learner id is fixed: `00000000-0000-0000-0000-000000000001` (ADR 0005 — no auth for MVP).

Changing a shape here is itself a decision — update this file in the same PR as the code change, don't let the two drift.

## Next.js CRUD (`frontend/app/api/*`) — Slice 1 & 4

### `GET /api/courses?domain=&level=&search=`
Returns `{ courses: Course[] }`. `Course` = `{ id, title, description, domain, level, durationHours, skillsTaught: string[], prerequisiteSkills: string[], sourceUrl }`.

### `GET /api/courses/:id`
Returns a single `Course`, or 404.

### `GET /api/learner-profile`
Returns `{ goal, interests: string[], experienceLevel, completedCourseIds: string[], timeBudgetHoursPerWeek }` for the mock learner.

### `PATCH /api/learner-profile`
Body: any subset of the fields above. Returns the updated profile.

### `GET /api/learning-path`
Returns the mock learner's current path: `{ id, goal, items: PathItem[] }`, where `PathItem` = `{ id, courseId, sequenceOrder, milestoneLabel, rationale, status }`. 404 if none generated yet.

### `PATCH /api/learning-path/items/:id`
Body: `{ status: "not_started" | "in_progress" | "completed" }`. Returns the updated item. This is what the dashboard's "mark complete" action calls.

## FastAPI AI/ML (`backend/app/routers/*`) — Slice 2 & 3

### `POST /chat/intake`
Body: `{ message: string, history: { role: "user" | "assistant", content: string }[] }`.
Returns: `{ reply: string, profilePatch: Partial<LearnerProfile>, profileComplete: boolean }`.
`profilePatch` is whatever new fields the latest message let the model extract — the frontend merges it into local state and, once `profileComplete` is true, calls `PATCH /api/learner-profile` to persist it.

### `POST /recommendations/generate`
Body: `{ learnerId: string }` (always the mock learner id for now).
Effect: reads the learner's profile from Postgres, runs the rule-based filter then the embedding-similarity ranking (ADR 0003), writes a new `learning_paths` row + its `learning_path_items`.
Returns: the full generated path, same shape as `GET /api/learning-path`.

### `POST /chat/explain`
Body: `{ pathItemId: string, question: string }`.
Returns: `{ answer: string }` — answers a learner's free-text follow-up about one specific recommendation ("why this course," "why not X instead").

## Error shape (both services)
`{ error: string }` with an appropriate 4xx/5xx status. No stack traces or internal details in the body.
