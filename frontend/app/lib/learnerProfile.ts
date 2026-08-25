// Shape matches docs/contract/api-contract.md's learner-profile endpoints.
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";

export type LearnerProfile = {
  goal: string | null;
  interests: string[];
  experienceLevel: ExperienceLevel | null;
  completedCourseIds: string[];
  timeBudgetHoursPerWeek: number | null;
};

// Raw shape of a row from the `learner_profiles` table
// (supabase/migrations/0001_init.sql).
export type LearnerProfileRow = {
  goal: string | null;
  interests: string[];
  experience_level: string | null;
  completed_course_ids: string[];
  time_budget_hours_per_week: number | null;
};

// Response used when no `learner_profiles` row exists yet for the mock
// learner — the contract has no "profile doesn't exist" error state, so we
// return an empty-but-valid profile with a 200 instead of inventing a 404.
export const EMPTY_LEARNER_PROFILE: LearnerProfile = {
  goal: null,
  interests: [],
  experienceLevel: null,
  completedCourseIds: [],
  timeBudgetHoursPerWeek: null,
};

export function mapLearnerProfileRow(row: LearnerProfileRow): LearnerProfile {
  return {
    goal: row.goal,
    interests: row.interests,
    experienceLevel: row.experience_level as ExperienceLevel | null,
    completedCourseIds: row.completed_course_ids,
    timeBudgetHoursPerWeek: row.time_budget_hours_per_week,
  };
}

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "beginner",
  "intermediate",
  "advanced",
];

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === "string");
}

// Fields accepted by PATCH /api/learner-profile, keyed by their camelCase
// name in the request body. Every field is optional (partial update) but
// whatever is provided must be well-formed — this is a network boundary,
// so we validate rather than trust the type system alone.
export type LearnerProfilePatch = {
  goal?: string | null;
  interests?: string[];
  experienceLevel?: ExperienceLevel | null;
  completedCourseIds?: string[];
  timeBudgetHoursPerWeek?: number | null;
};

export function validateLearnerProfilePatch(
  body: unknown
): { ok: true; patch: LearnerProfilePatch } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Request body must be a JSON object." };
  }

  const input = body as Record<string, unknown>;
  const patch: LearnerProfilePatch = {};

  if ("goal" in input) {
    const { goal } = input;
    if (goal !== null && typeof goal !== "string") {
      return { ok: false, error: "goal must be a string or null." };
    }
    patch.goal = goal;
  }

  if ("interests" in input) {
    if (!isStringArray(input.interests)) {
      return { ok: false, error: "interests must be an array of strings." };
    }
    patch.interests = input.interests;
  }

  if ("experienceLevel" in input) {
    const { experienceLevel } = input;
    if (
      experienceLevel !== null &&
      !EXPERIENCE_LEVELS.includes(experienceLevel as ExperienceLevel)
    ) {
      return {
        ok: false,
        error: "experienceLevel must be one of: beginner, intermediate, advanced, or null.",
      };
    }
    patch.experienceLevel = experienceLevel as ExperienceLevel | null;
  }

  if ("completedCourseIds" in input) {
    const { completedCourseIds } = input;
    if (
      !isStringArray(completedCourseIds) ||
      !completedCourseIds.every((id) => UUID_PATTERN.test(id))
    ) {
      return {
        ok: false,
        error: "completedCourseIds must be an array of course UUIDs.",
      };
    }
    patch.completedCourseIds = completedCourseIds;
  }

  if ("timeBudgetHoursPerWeek" in input) {
    const { timeBudgetHoursPerWeek } = input;
    if (
      timeBudgetHoursPerWeek !== null &&
      (typeof timeBudgetHoursPerWeek !== "number" ||
        !Number.isInteger(timeBudgetHoursPerWeek) ||
        timeBudgetHoursPerWeek < 0)
    ) {
      return {
        ok: false,
        error: "timeBudgetHoursPerWeek must be a non-negative integer or null.",
      };
    }
    patch.timeBudgetHoursPerWeek = timeBudgetHoursPerWeek;
  }

  return { ok: true, patch };
}
