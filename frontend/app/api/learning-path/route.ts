import { NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";
import { MOCK_LEARNER_ID } from "@/app/lib/constants";
import {
  mapPathItemRow,
  type LearningPathRow,
  type PathItemRow,
} from "@/app/lib/learningPath";

// GET /api/learning-path
// Returns the mock learner's current path: { id, goal, items }. "Current"
// is the most recently created `learning_paths` row for the learner — the
// schema has no explicit current-path pointer. 404 if none generated yet
// (i.e. POST /recommendations/generate hasn't run for this learner).
export async function GET() {
  try {
    const sql = getSql();

    const pathRows = await sql<LearningPathRow[]>`
      select id, goal
      from learning_paths
      where learner_id = ${MOCK_LEARNER_ID}
      order by created_at desc
      limit 1
    `;

    const path = pathRows[0];
    if (!path) {
      return NextResponse.json(
        { error: "No learning path found for this learner." },
        { status: 404 }
      );
    }

    const itemRows = await sql<PathItemRow[]>`
      select id, course_id, sequence_order, milestone_label, rationale, status
      from learning_path_items
      where learning_path_id = ${path.id}
      order by sequence_order asc
    `;

    return NextResponse.json({
      id: path.id,
      goal: path.goal,
      items: itemRows.map(mapPathItemRow),
    });
  } catch (error) {
    console.error("GET /api/learning-path failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning path." },
      { status: 500 }
    );
  }
}
