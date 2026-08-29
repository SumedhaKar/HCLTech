import { describe, expect, it } from "vitest";
import { isValidCourseId, mapCourseRow } from "./courses";

describe("isValidCourseId", () => {
  it("accepts a well-formed uuid", () => {
    expect(isValidCourseId("11111111-1111-1111-1111-111111111111")).toBe(true);
  });

  it("rejects malformed input", () => {
    expect(isValidCourseId("not-a-uuid")).toBe(false);
  });
});

describe("mapCourseRow", () => {
  it("maps snake_case columns to the camelCase Course shape", () => {
    expect(
      mapCourseRow({
        id: "1",
        title: "Intro to APIs",
        description: "Learn REST fundamentals.",
        domain: "Web Development",
        level: "beginner",
        duration_hours: 4,
        skills_taught: ["rest", "http"],
        prerequisite_skills: [],
        source_url: "https://example.com/course",
      })
    ).toEqual({
      id: "1",
      title: "Intro to APIs",
      description: "Learn REST fundamentals.",
      domain: "Web Development",
      level: "beginner",
      durationHours: 4,
      skillsTaught: ["rest", "http"],
      prerequisiteSkills: [],
      sourceUrl: "https://example.com/course",
    });
  });
});
