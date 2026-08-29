import { describe, expect, it } from "vitest";
import {
  EMPTY_LEARNER_PROFILE,
  mapLearnerProfileRow,
  validateLearnerProfilePatch,
} from "./learnerProfile";

describe("mapLearnerProfileRow", () => {
  it("maps snake_case columns to the camelCase LearnerProfile shape", () => {
    expect(
      mapLearnerProfileRow({
        goal: "Become a backend engineer",
        interests: ["apis", "databases"],
        experience_level: "beginner",
        completed_course_ids: ["11111111-1111-1111-1111-111111111111"],
        time_budget_hours_per_week: 6,
      })
    ).toEqual({
      goal: "Become a backend engineer",
      interests: ["apis", "databases"],
      experienceLevel: "beginner",
      completedCourseIds: ["11111111-1111-1111-1111-111111111111"],
      timeBudgetHoursPerWeek: 6,
    });
  });

  it("passes through nulls for a never-started profile", () => {
    expect(
      mapLearnerProfileRow({
        goal: null,
        interests: [],
        experience_level: null,
        completed_course_ids: [],
        time_budget_hours_per_week: null,
      })
    ).toEqual(EMPTY_LEARNER_PROFILE);
  });
});

describe("validateLearnerProfilePatch", () => {
  it("accepts an empty patch", () => {
    const result = validateLearnerProfilePatch({});
    expect(result).toEqual({ ok: true, patch: {} });
  });

  it("rejects a non-object body", () => {
    expect(validateLearnerProfilePatch(null)).toEqual({
      ok: false,
      error: "Request body must be a JSON object.",
    });
    expect(validateLearnerProfilePatch("nope")).toEqual({
      ok: false,
      error: "Request body must be a JSON object.",
    });
    expect(validateLearnerProfilePatch(["a"])).toEqual({
      ok: false,
      error: "Request body must be a JSON object.",
    });
  });

  it("accepts a valid goal, including null to clear it", () => {
    expect(validateLearnerProfilePatch({ goal: "Learn Python" })).toEqual({
      ok: true,
      patch: { goal: "Learn Python" },
    });
    expect(validateLearnerProfilePatch({ goal: null })).toEqual({
      ok: true,
      patch: { goal: null },
    });
  });

  it("rejects a non-string, non-null goal", () => {
    expect(validateLearnerProfilePatch({ goal: 42 })).toEqual({
      ok: false,
      error: "goal must be a string or null.",
    });
  });

  it("rejects interests that aren't an array of strings", () => {
    expect(validateLearnerProfilePatch({ interests: "python" })).toEqual({
      ok: false,
      error: "interests must be an array of strings.",
    });
    expect(validateLearnerProfilePatch({ interests: [1, 2] })).toEqual({
      ok: false,
      error: "interests must be an array of strings.",
    });
  });

  it("accepts a valid experienceLevel and rejects an invalid one", () => {
    expect(
      validateLearnerProfilePatch({ experienceLevel: "intermediate" })
    ).toEqual({ ok: true, patch: { experienceLevel: "intermediate" } });
    expect(validateLearnerProfilePatch({ experienceLevel: null })).toEqual({
      ok: true,
      patch: { experienceLevel: null },
    });
    expect(validateLearnerProfilePatch({ experienceLevel: "expert" })).toEqual({
      ok: false,
      error:
        "experienceLevel must be one of: beginner, intermediate, advanced, or null.",
    });
  });

  it("rejects completedCourseIds that aren't valid course UUIDs", () => {
    expect(
      validateLearnerProfilePatch({ completedCourseIds: ["not-a-uuid"] })
    ).toEqual({
      ok: false,
      error: "completedCourseIds must be an array of course UUIDs.",
    });
    expect(
      validateLearnerProfilePatch({
        completedCourseIds: ["11111111-1111-1111-1111-111111111111"],
      })
    ).toEqual({
      ok: true,
      patch: { completedCourseIds: ["11111111-1111-1111-1111-111111111111"] },
    });
  });

  it("rejects a negative or non-integer timeBudgetHoursPerWeek", () => {
    expect(
      validateLearnerProfilePatch({ timeBudgetHoursPerWeek: -1 })
    ).toEqual({
      ok: false,
      error: "timeBudgetHoursPerWeek must be a non-negative integer or null.",
    });
    expect(
      validateLearnerProfilePatch({ timeBudgetHoursPerWeek: 5.5 })
    ).toEqual({
      ok: false,
      error: "timeBudgetHoursPerWeek must be a non-negative integer or null.",
    });
    expect(validateLearnerProfilePatch({ timeBudgetHoursPerWeek: 0 })).toEqual({
      ok: true,
      patch: { timeBudgetHoursPerWeek: 0 },
    });
    expect(
      validateLearnerProfilePatch({ timeBudgetHoursPerWeek: null })
    ).toEqual({ ok: true, patch: { timeBudgetHoursPerWeek: null } });
  });

  it("validates a full multi-field patch together", () => {
    const result = validateLearnerProfilePatch({
      goal: "Become a data engineer",
      interests: ["sql", "spark"],
      experienceLevel: "advanced",
      completedCourseIds: [],
      timeBudgetHoursPerWeek: 8,
    });
    expect(result).toEqual({
      ok: true,
      patch: {
        goal: "Become a data engineer",
        interests: ["sql", "spark"],
        experienceLevel: "advanced",
        completedCourseIds: [],
        timeBudgetHoursPerWeek: 8,
      },
    });
  });
});
