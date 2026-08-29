import { describe, expect, it } from "vitest";
import { isValidPathItemStatus, isValidUuid, mapPathItemRow } from "./learningPath";

describe("isValidUuid", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidUuid("11111111-1111-1111-1111-111111111111")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("11111111-1111-1111-1111")).toBe(false);
    expect(isValidUuid("")).toBe(false);
  });
});

describe("isValidPathItemStatus", () => {
  it("accepts the three known statuses", () => {
    expect(isValidPathItemStatus("not_started")).toBe(true);
    expect(isValidPathItemStatus("in_progress")).toBe(true);
    expect(isValidPathItemStatus("completed")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isValidPathItemStatus("done")).toBe(false);
    expect(isValidPathItemStatus(42)).toBe(false);
    expect(isValidPathItemStatus(null)).toBe(false);
  });
});

describe("mapPathItemRow", () => {
  it("maps snake_case columns to the camelCase PathItem shape", () => {
    expect(
      mapPathItemRow({
        id: "1",
        course_id: "2",
        sequence_order: 1,
        milestone_label: "Fundamentals",
        rationale: "Covers the prerequisite basics.",
        status: "in_progress",
      })
    ).toEqual({
      id: "1",
      courseId: "2",
      sequenceOrder: 1,
      milestoneLabel: "Fundamentals",
      rationale: "Covers the prerequisite basics.",
      status: "in_progress",
    });
  });
});
