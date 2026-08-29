"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";

type Course = {
  id: string;
  title: string;
  description: string;
  domain: string;
  level: "beginner" | "intermediate" | "advanced";
  durationHours: number;
  skillsTaught: string[];
  prerequisiteSkills: string[];
  sourceUrl: string | null;
};

const LEVELS: Course["level"][] = ["beginner", "intermediate", "advanced"];

const GRADE_DOT: Record<Course["level"], string> = {
  beginner: "bg-grade-beginner",
  intermediate: "bg-grade-intermediate",
  advanced: "bg-grade-advanced",
};

export default function CatalogPage() {
  const [allCourses, setAllCourses] = useState<Course[] | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState("");
  const [domain, setDomain] = useState("");
  const [level, setLevel] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetched once, unfiltered, purely to build the domain dropdown's options.
  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data: { courses: Course[] }) => setAllCourses(data.courses ?? []))
      .catch(() => setAllCourses([]));
  }, []);

  const domains = useMemo(() => {
    if (!allCourses) return [];
    return Array.from(new Set(allCourses.map((c) => c.domain))).sort();
  }, [allCourses]);

  // Debounced fetch of the filtered result set.
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (domain) params.set("domain", domain);
      if (level) params.set("level", level);
      if (search.trim()) params.set("search", search.trim());

      fetch(`/api/courses?${params.toString()}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            throw new Error(body.error ?? "Failed to load courses.");
          }
          return res.json() as Promise<{ courses: Course[] }>;
        })
        .then((data) => setCourses(data.courses ?? []))
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === "AbortError") return;
          setError(err instanceof Error ? err.message : "Failed to load courses.");
        })
        .finally(() => setLoading(false));
    }, 250);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [search, domain, level]);

  const hasActiveFilters = search.trim() !== "" || domain !== "" || level !== "";

  return (
    <div className="flex flex-1 flex-col bg-signage text-ink">
      <SiteHeader active="/catalog" />

      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        <div className="flex flex-col gap-1">
          <h1 className="font-serif text-3xl font-semibold leading-tight text-ink">
            Course catalog
          </h1>
          <p className="text-sm leading-6 text-ink-muted">
            49 real courses, the same set PathFinder draws routes from. Browse
            directly, or{" "}
            <Link
              href="/chat"
              className="text-waypoint-deep underline decoration-signage-line underline-offset-2 hover:decoration-waypoint-deep"
            >
              describe a goal
            </Link>{" "}
            and get a sequenced path instead.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full flex-1 rounded-sm bg-signage-raised px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
          />
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="rounded-sm bg-signage-raised px-3 py-2.5 text-sm text-ink ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
          >
            <option value="">All domains</option>
            {domains.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-sm bg-signage-raised px-3 py-2.5 text-sm text-ink ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
          >
            <option value="">All levels</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>
                {l.charAt(0).toUpperCase() + l.slice(1)}
              </option>
            ))}
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setDomain("");
                setLevel("");
              }}
              className="whitespace-nowrap rounded-sm px-3 py-2.5 text-sm text-ink-muted ring-1 ring-signage-line transition-colors hover:bg-signage-raised hover:text-ink"
            >
              Clear filters
            </button>
          )}
        </div>

        {error && (
          <p className="rounded-sm bg-blaze-pale/30 px-3 py-2.5 text-sm text-blaze-deep ring-1 ring-blaze-pale">
            {error}
          </p>
        )}

        {loading ? (
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
            Loading courses…
          </p>
        ) : courses.length === 0 ? (
          <p className="text-sm text-ink-muted">No courses match your filters.</p>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {courses.map((course) => (
              <li
                key={course.id}
                className="flex flex-col gap-3 rounded-sm bg-signage-raised p-4 ring-1 ring-signage-line"
              >
                <div className="flex items-start justify-between gap-2">
                  <h2 className="font-serif text-base font-semibold leading-snug text-ink">
                    {course.title}
                  </h2>
                  <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${GRADE_DOT[course.level]}`}
                      aria-hidden
                    />
                    {course.level}
                  </span>
                </div>
                <p className="text-sm leading-6 text-ink-muted">
                  {course.description}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                  <span>{course.domain}</span>
                  <span>{course.durationHours}h</span>
                </div>
                {course.skillsTaught.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {course.skillsTaught.map((skill) => (
                      <span
                        key={skill}
                        className="rounded-full bg-signage px-2 py-0.5 text-xs text-waypoint-deep ring-1 ring-signage-line"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {course.sourceUrl && (
                  <a
                    href={course.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto text-sm font-medium text-ink underline decoration-signage-line underline-offset-2 hover:decoration-ink"
                  >
                    View course
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
