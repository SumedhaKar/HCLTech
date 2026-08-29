// Base URL of the FastAPI AI/ML service (chat intake, recommendations,
// explainer) — see docs/adr/0004-service-boundary-and-schema-ownership.md.
// Next.js CRUD stays same-origin; only these three endpoints cross to FastAPI.
export const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://127.0.0.1:8000";
