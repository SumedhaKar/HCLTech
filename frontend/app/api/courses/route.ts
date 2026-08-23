import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/app/lib/db";
import { mapCourseRow, type CourseRow } from "@/app/lib/courses";

// GET /api/courses?domain=&level=&search=
// Returns { courses: Course[] }. `search` matches title/description,
// case-insensitive. See docs/contract/api-contract.md.
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const domain = searchParams.get("domain")?.trim() || null;
  const level = searchParams.get("level")?.trim() || null;
  const search = searchParams.get("search")?.trim() || null;
  const searchPattern = search ? `%${search}%` : null;

  try {
    const sql = getSql();

    const rows = await sql<CourseRow[]>`
      select id, title, description, domain, level, duration_hours,
             skills_taught, prerequisite_skills, source_url
      from courses
      where (${domain}::text is null or domain = ${domain})
        and (${level}::text is null or level = ${level})
        and (
          ${searchPattern}::text is null
          or title ilike ${searchPattern}
          or description ilike ${searchPattern}
        )
      order by title asc
    `;

    return NextResponse.json({ courses: rows.map(mapCourseRow) });
  } catch (error) {
    console.error("GET /api/courses failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch courses." },
      { status: 500 }
    );
  }
}
