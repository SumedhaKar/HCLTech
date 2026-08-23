import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";
import { isValidCourseId, mapCourseRow, type CourseRow } from "@/app/lib/courses";

// GET /api/courses/:id
// Returns a single Course, or { error } with 404 if not found.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!isValidCourseId(id)) {
    return NextResponse.json({ error: "Course not found." }, { status: 404 });
  }

  try {
    const sql = getSql();

    const rows = await sql<CourseRow[]>`
      select id, title, description, domain, level, duration_hours,
             skills_taught, prerequisite_skills, source_url
      from courses
      where id = ${id}
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    return NextResponse.json(mapCourseRow(row));
  } catch (error) {
    console.error(`GET /api/courses/${id} failed:`, error);
    return NextResponse.json(
      { error: "Failed to fetch course." },
      { status: 500 }
    );
  }
}
