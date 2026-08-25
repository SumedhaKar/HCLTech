import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";
import {
  isValidPathItemStatus,
  isValidUuid,
  mapPathItemRow,
  type PathItemRow,
} from "@/app/lib/learningPath";

// PATCH /api/learning-path/items/:id
// Body: { status: "not_started" | "in_progress" | "completed" }.
// Updates one learning_path_items row and returns it in the PathItem shape.
// This is what the dashboard's "mark complete" action calls.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidUuid(id)) {
    return NextResponse.json(
      { error: "Learning path item not found." },
      { status: 404 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { error: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  const { status } = body as Record<string, unknown>;
  if (!isValidPathItemStatus(status)) {
    return NextResponse.json(
      {
        error: "status must be one of: not_started, in_progress, completed.",
      },
      { status: 400 }
    );
  }

  try {
    const sql = getSql();

    const rows = await sql<PathItemRow[]>`
      update learning_path_items
      set status = ${status}
      where id = ${id}
      returning id, course_id, sequence_order, milestone_label, rationale, status
    `;

    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { error: "Learning path item not found." },
        { status: 404 }
      );
    }

    return NextResponse.json(mapPathItemRow(row));
  } catch (error) {
    console.error(`PATCH /api/learning-path/items/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to update learning path item." },
      { status: 500 }
    );
  }
}
