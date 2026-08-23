"use client";

import { useEffect, useMemo, useState } from "react";

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
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          Course catalog
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Browse and search the courses PathFinder can recommend from.
        </p>
      </header>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or description..."
          className="w-full flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <select
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-950 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
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
            className="whitespace-nowrap rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading courses...</p>
      ) : courses.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No courses match your filters.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {courses.map((course) => (
            <li
              key={course.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2">
                <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {course.title}
                </h2>
                <span className="whitespace-nowrap rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {course.level}
                </span>
              </div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {course.description}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 dark:text-zinc-500">
                <span>{course.domain}</span>
                <span>{course.durationHours}h</span>
              </div>
              {course.skillsTaught.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {course.skillsTaught.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-xs text-blue-700 dark:bg-blue-950 dark:text-blue-300"
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
                  className="mt-auto text-sm font-medium text-zinc-950 underline underline-offset-2 dark:text-zinc-50"
                >
                  View course
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
