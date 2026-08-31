import { describe, expect, it } from "vitest";
import { suggestProject } from "./projectSuggestions";

describe("suggestProject", () => {
  it("prefers a specific skill override over the domain fallback", () => {
    const suggestion = suggestProject(["nodejs", "express", "mongodb"], "Web Development");
    expect(suggestion).toMatch(/REST API/);
  });

  it("falls back to the domain suggestion when no skill override matches", () => {
    const suggestion = suggestProject(["legal-fundamentals", "civics-fundamentals"], "Law");
    expect(suggestion).toMatch(/case/);
  });

  it("falls back to a generic suggestion for an unmapped domain and no matching skill", () => {
    const suggestion = suggestProject(["some-unknown-skill"], "Some New Domain");
    expect(suggestion).toBe(
      "Apply what you've learned in this milestone to a small project of your own choosing."
    );
  });

  it("is case-insensitive when matching skill overrides", () => {
    const suggestion = suggestProject(["React"], "Web Development");
    expect(suggestion).toMatch(/single-page app/);
  });

  it("covers every domain with a real fallback (never falls through to generic)", () => {
    const domains = [
      "Programming Fundamentals",
      "Web Development",
      "Data Science & Machine Learning",
      "Cloud & DevOps",
      "Cybersecurity",
      "Mobile Development",
      "UX & Product Design",
      "Marketing",
      "Business & Management",
      "Finance & Accounting",
      "Design",
      "Basic Sciences",
      "Bio Sciences",
      "Law",
      "Mechanical Engineering",
      "Civil Engineering",
      "Electrical Engineering",
    ];
    for (const domain of domains) {
      const suggestion = suggestProject(["no-matching-skill-xyz"], domain);
      expect(suggestion).not.toBe(
        "Apply what you've learned in this milestone to a small project of your own choosing."
      );
    }
  });
});
