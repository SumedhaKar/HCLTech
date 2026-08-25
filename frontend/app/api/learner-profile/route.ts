import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";
import { MOCK_LEARNER_ID } from "@/app/lib/constants";
import {
  EMPTY_LEARNER_PROFILE,
  mapLearnerProfileRow,
  validateLearnerProfilePatch,
  type LearnerProfileRow,
} from "@/app/lib/learnerProfile";

// GET /api/learner-profile
// Returns the mock learner's profile. If no row exists yet (profile never
// started), returns an empty-but-valid profile with 200 — the contract has
// no "profile doesn't exist" error state.
export async function GET() {
  try {
    const sql = getSql();

    const rows = await sql<LearnerProfileRow[]>`
      select goal, interests, experience_level, completed_course_ids,
             time_budget_hours_per_week
      from learner_profiles
      where learner_id = ${MOCK_LEARNER_ID}
      limit 1
    `;

    const row = rows[0];
    return NextResponse.json(row ? mapLearnerProfileRow(row) : EMPTY_LEARNER_PROFILE);
  } catch (error) {
    console.error("GET /api/learner-profile failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch learner profile." },
      { status: 500 }
    );
  }
}

// PATCH /api/learner-profile
// Body: any subset of the profile fields (camelCase). Upserts the mock
// learner's row, updating only the fields provided, and returns the full
// updated profile.
export async function PATCH(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const validation = validateLearnerProfilePatch(body);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const { patch } = validation;

  // Build the set of columns to write. `updated_at` is always refreshed;
  // everything else is only included if the caller provided it, so an
  // omitted field is left untouched on an existing row (and falls back to
  // the column default on first insert).
  const values: Record<string, unknown> = {
    learner_id: MOCK_LEARNER_ID,
    updated_at: new Date(),
  };
  if ("goal" in patch) values.goal = patch.goal;
  if ("interests" in patch) values.interests = patch.interests;
  if ("experienceLevel" in patch) values.experience_level = patch.experienceLevel;
  if ("completedCourseIds" in patch) values.completed_course_ids = patch.completedCourseIds;
  if ("timeBudgetHoursPerWeek" in patch) values.time_budget_hours_per_week = patch.timeBudgetHoursPerWeek;

  const insertColumns = Object.keys(values);
  const updateColumns = insertColumns.filter((key) => key !== "learner_id");

  try {
    const sql = getSql();

    const rows = await sql<LearnerProfileRow[]>`
      insert into learner_profiles ${sql(values, ...insertColumns)}
      on conflict (learner_id) do update set ${sql(values, ...updateColumns)}
      returning goal, interests, experience_level, completed_course_ids,
                time_budget_hours_per_week
    `;

    return NextResponse.json(mapLearnerProfileRow(rows[0]));
  } catch (error) {
    console.error("PATCH /api/learner-profile failed:", error);
    return NextResponse.json(
      { error: "Failed to update learner profile." },
      { status: 500 }
    );
  }
}
