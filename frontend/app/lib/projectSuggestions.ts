// Static, deterministic project suggestions shown once per milestone on the
// dashboard — no Gemini call. Checked in two passes: a small set of specific
// skill-tag overrides first (checked in order, first match wins), then a
// domain-level fallback covering all 17 catalog domains so every milestone
// group always gets a real suggestion, never a blank.

const SKILL_OVERRIDES: { skills: string[]; project: string }[] = [
  {
    skills: ["nodejs", "express", "mongodb"],
    project:
      "Build a small REST API with a handful of CRUD endpoints, backed by a real database.",
  },
  {
    skills: ["react"],
    project: "Build a small single-page app front-end for a project idea of your choice.",
  },
  {
    skills: ["html-css"],
    project: "Build and style a small multi-page static website from scratch.",
  },
  {
    skills: ["sql-basics"],
    project:
      "Write and optimize a handful of real queries against a sample dataset — joins, aggregates, an index or two.",
  },
  {
    skills: ["pandas", "data-analysis"],
    project: "Pick a public dataset and produce a short analysis with at least three real findings.",
  },
  {
    skills: ["docker", "kubernetes", "containers"],
    project: "Containerize a small app and deploy it to a local or free-tier cluster.",
  },
  {
    skills: ["terraform", "iac"],
    project: "Write infrastructure-as-code for a small stack and stand it up from scratch.",
  },
  {
    skills: ["prompt-engineering", "langchain", "llm-app-building"],
    project:
      "Build a small LLM-backed tool — a chatbot, a summarizer, or a Q&A assistant over your own documents.",
  },
  {
    skills: ["figma", "ui-design", "prototyping"],
    project: "Design and prototype a small app screen end-to-end, from wireframe to a clickable mockup.",
  },
  {
    skills: ["excel"],
    project: "Build a small financial or operational model in a spreadsheet from real or sample data.",
  },
  {
    skills: ["penetration-testing", "network-security"],
    project: "Set up a small lab environment and practice a controlled penetration test on it.",
  },
  {
    skills: ["android", "kotlin", "swift", "ios", "flutter", "react-native"],
    project: "Build a small mobile app — even a single-screen utility — end to end.",
  },
];

const DOMAIN_FALLBACKS: Record<string, string> = {
  "Programming Fundamentals":
    "Write a small program that applies what you've learned — a calculator, a text-based game, or a data structure built from scratch.",
  "Web Development": "Build and deploy a small personal site or web app using what you've learned.",
  "Data Science & Machine Learning":
    "Pick a public dataset and walk it through the pipeline you've learned — clean it, analyze it, summarize what you found.",
  "Cloud & DevOps":
    "Take a small app through a real deploy pipeline — containerize it, automate the build, ship it to a cloud environment.",
  Cybersecurity: "Set up a small lab environment and practice what you've learned in a controlled setting.",
  "Mobile Development": "Build a small mobile app — even a single-screen utility — using what you've learned.",
  "UX & Product Design":
    "Take a real or fictional product idea through a full design pass — research, wireframes, a clickable prototype.",
  Marketing: "Plan and execute a small campaign for a real or fictional product using the tactics you've learned.",
  "Business & Management": "Write a lightweight business plan or project proposal applying what you've learned.",
  "Finance & Accounting": "Build a personal or small-business budget model, or analyze a real company's financials.",
  Design: "Design a small visual identity — a logo, a poster, or a mini brand kit — using what you've learned.",
  "Basic Sciences": "Work through a hands-on problem set or a small experiment applying what you've learned.",
  "Bio Sciences": "Research and write up a short case study applying what you've learned to a real question.",
  Law: "Analyze a real, simplified case or draft a sample document applying what you've learned.",
  "Mechanical Engineering": "Sketch or CAD a small mechanical component or system applying what you've learned.",
  "Civil Engineering": "Plan out a small structural or project-management scenario applying what you've learned.",
  "Electrical Engineering": "Design and simulate a small circuit or electronics project applying what you've learned.",
};

const GENERIC_FALLBACK =
  "Apply what you've learned in this milestone to a small project of your own choosing.";

export function suggestProject(skills: string[], domain: string): string {
  const skillSet = new Set(skills.map((s) => s.toLowerCase()));
  for (const override of SKILL_OVERRIDES) {
    if (override.skills.some((s) => skillSet.has(s))) return override.project;
  }
  return DOMAIN_FALLBACKS[domain] ?? GENERIC_FALLBACK;
}
