// Shape matches docs/contract/api-contract.md's `Course` type exactly.
export type CourseLevel = "beginner" | "intermediate" | "advanced";

export type Course = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: CourseLevel;
  durationHours: number;
  skillsTaught: string[];
  prerequisiteSkills: string[];
  sourceUrl: string | null;
};

// Raw shape of a row from the `courses` table (supabase/migrations/0001_init.sql).
export type CourseRow = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: string;
  duration_hours: number;
  skills_taught: string[];
  prerequisite_skills: string[];
  source_url: string | null;
};

export function mapCourseRow(row: CourseRow): Course {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    domain: row.domain,
    level: row.level as CourseLevel,
    durationHours: row.duration_hours,
    skillsTaught: row.skills_taught,
    prerequisiteSkills: row.prerequisite_skills,
    sourceUrl: row.source_url,
  };
}

// uuid primary key check — used to short-circuit obviously-invalid ids as 404
// instead of letting an invalid-input-syntax error hit Postgres.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidCourseId(id: string): boolean {
  return UUID_PATTERN.test(id);
}
