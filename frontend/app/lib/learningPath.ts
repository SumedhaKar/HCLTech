// Shape matches docs/contract/api-contract.md's learning-path endpoints.
export type PathItemStatus = "not_started" | "in_progress" | "completed";

export type PathItem = {
  id: string;
  courseId: string;
  sequenceOrder: number;
  milestoneLabel: string | null;
  rationale: string | null;
  status: PathItemStatus;
};

export type LearningPath = {
  id: string;
  goal: string;
  items: PathItem[];
};

// Raw shape of a row from the `learning_path_items` table
// (supabase/migrations/0001_init.sql).
export type PathItemRow = {
  id: string;
  course_id: string;
  sequence_order: number;
  milestone_label: string | null;
  rationale: string | null;
  status: string;
};

// Raw shape of a row from the `learning_paths` table.
export type LearningPathRow = {
  id: string;
  goal: string;
};

export function mapPathItemRow(row: PathItemRow): PathItem {
  return {
    id: row.id,
    courseId: row.course_id,
    sequenceOrder: row.sequence_order,
    milestoneLabel: row.milestone_label,
    rationale: row.rationale,
    status: row.status as PathItemStatus,
  };
}

// uuid primary key check — used to short-circuit obviously-invalid ids as 404
// instead of letting an invalid-input-syntax error hit Postgres.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_PATTERN.test(id);
}

const PATH_ITEM_STATUSES: PathItemStatus[] = [
  "not_started",
  "in_progress",
  "completed",
];

export function isValidPathItemStatus(value: unknown): value is PathItemStatus {
  return (
    typeof value === "string" &&
    PATH_ITEM_STATUSES.includes(value as PathItemStatus)
  );
}
