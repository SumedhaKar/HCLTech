// Fixed mock learner id — no auth for MVP (ADR 0005). Every learner-scoped
// query in the Next.js CRUD surface reads/writes this single seeded row.
export const MOCK_LEARNER_ID = "00000000-0000-0000-0000-000000000001";
