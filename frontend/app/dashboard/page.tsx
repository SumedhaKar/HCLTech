"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import { BACKEND_URL } from "../lib/backend";
import type { LearningPath, PathItem, PathItemStatus } from "../lib/learningPath";

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

const GRADE_CLASS: Record<Course["level"], string> = {
  beginner: "bg-grade-beginner text-ground",
  intermediate: "bg-grade-intermediate text-ground",
  advanced: "bg-grade-advanced text-text ring-1 ring-border-strong",
};

const STATUS_LABEL: Record<PathItemStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

const STATUS_ORDER: PathItemStatus[] = ["not_started", "in_progress", "completed"];

type LearnerTimeProfile = {
  experienceLevel: "beginner" | "intermediate" | "advanced" | null;
  timeBudgetHoursPerWeek: number | null;
};

export default function DashboardPage() {
  const [path, setPath] = useState<LearningPath | null>(null);
  const [courses, setCourses] = useState<Record<string, Course>>({});
  const [profile, setProfile] = useState<LearnerTimeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/learning-path").then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!res.ok) throw new Error("Couldn't load your path.");
        return (await res.json()) as LearningPath;
      }),
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data: { courses: Course[] }) => data.courses ?? []),
      fetch("/api/learner-profile").then((res) => res.json()) as Promise<LearnerTimeProfile>,
    ])
      .then(([pathData, courseList, profileData]) => {
        setPath(pathData);
        setCourses(Object.fromEntries(courseList.map((c) => [c.id, c])));
        setProfile(profileData);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  function updateItem(updated: PathItem) {
    setPath((prev) =>
      prev
        ? { ...prev, items: prev.items.map((i) => (i.id === updated.id ? updated : i)) }
        : prev
    );
  }

  const completedCount = path?.items.filter((i) => i.status === "completed").length ?? 0;

  // Skills the learner has actually built (from completed items) vs. skills
  // still ahead on the route (from everything else) — a course can teach a
  // skill a different completed course already covered, so "ahead" excludes
  // anything already gained rather than just grouping by item status.
  const skillProgress = path
    ? (() => {
        const gained = new Set<string>();
        const ahead = new Set<string>();
        for (const item of path.items) {
          const course = courses[item.courseId];
          if (!course) continue;
          const bucket = item.status === "completed" ? gained : ahead;
          for (const skill of course.skillsTaught) bucket.add(skill);
        }
        for (const skill of gained) ahead.delete(skill);
        return { gained: [...gained], ahead: [...ahead] };
      })()
    : null;

  // Real, unadjusted course durations — total stays fixed at the full path's
  // duration; remaining is the same sum restricted to items not yet marked
  // completed, so it shrinks live as items are completed (no separate
  // recompute needed — this runs on every render off current item status).
  const timeEstimate = path
    ? (() => {
        let totalHours = 0;
        let remainingHours = 0;
        for (const item of path.items) {
          const course = courses[item.courseId];
          if (!course) continue;
          totalHours += course.durationHours;
          if (item.status !== "completed") remainingHours += course.durationHours;
        }
        const perWeek = profile?.timeBudgetHoursPerWeek ?? null;
        return {
          totalHours,
          remainingHours,
          totalWeeks: perWeek ? Math.ceil(totalHours / perWeek) : null,
          remainingWeeks: perWeek ? Math.ceil(remainingHours / perWeek) : null,
        };
      })()
    : null;

  return (
    <div className="flex flex-1 flex-col bg-ground text-text">
      <SiteHeader active="/dashboard" />

      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        {loading && (
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-text-faint">
            Loading your path…
          </p>
        )}

        {error && (
          <p className="rounded-xl bg-blaze/10 px-3 py-2.5 text-sm text-blaze-glow ring-1 ring-blaze/30">
            {error}
          </p>
        )}

        {!loading && notFound && (
          <div className="rounded-[20px] bg-surface p-8 text-center ring-1 ring-border">
            <h1 className="font-serif text-3xl font-semibold text-text">
              No route marked yet
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-text-muted">
              Describe your goal in the chat and PathFinder will lay out a
              sequenced route here.
            </p>
            <Link
              href="/chat"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-blaze px-5 py-3 font-mono text-sm uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_10px_28px_-8px_rgba(224,136,56,0.5)]"
            >
              Start the conversation
            </Link>
          </div>
        )}

        {!loading && path && (
          <>
            <div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-text">
                Route toward &ldquo;{path.goal}&rdquo;
              </h1>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                {completedCount} of {path.items.length} waypoints complete
              </p>
            </div>

            {skillProgress && (skillProgress.gained.length > 0 || skillProgress.ahead.length > 0) && (
              <div className="rounded-[20px] bg-surface p-6 ring-1 ring-border">
                <h2 className="font-serif text-xl font-semibold text-text">Skill development</h2>

                {timeEstimate && (
                  <div className="mt-4 flex flex-col gap-1.5 border-b border-border pb-4">
                    <p className="text-sm text-text">
                      {timeEstimate.totalHours} hrs total
                      {timeEstimate.totalWeeks !== null && (
                        <span className="text-text-muted">
                          {" "}
                          (~{timeEstimate.totalWeeks} {timeEstimate.totalWeeks === 1 ? "week" : "weeks"} at{" "}
                          {profile?.timeBudgetHoursPerWeek} hrs/week)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-text">
                      {timeEstimate.remainingHours} hrs remaining
                      {timeEstimate.remainingWeeks !== null && (
                        <span className="text-text-muted">
                          {" "}
                          (~{timeEstimate.remainingWeeks} {timeEstimate.remainingWeeks === 1 ? "week" : "weeks"} at{" "}
                          {profile?.timeBudgetHoursPerWeek} hrs/week)
                        </span>
                      )}
                    </p>
                    {(profile?.experienceLevel === "intermediate" || profile?.experienceLevel === "advanced") && (
                      <p className="text-sm text-text-muted">
                        You&rsquo;re already ahead with {profile.experienceLevel}-level experience — you&rsquo;ll
                        likely move through this faster than the estimate above.
                      </p>
                    )}
                    <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-faint">
                      Consistency is the key, not intensity!
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-4">
                  {skillProgress.gained.length > 0 && (
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                        Gained ({skillProgress.gained.length})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skillProgress.gained.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-blaze px-2.5 py-1 text-xs text-text"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {skillProgress.ahead.length > 0 && (
                    <div>
                      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                        Ahead on your route ({skillProgress.ahead.length})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {skillProgress.ahead.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-surface-raised px-2.5 py-1 text-xs text-text-muted ring-1 ring-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <ol className="mt-4 flex flex-col">
              {path.items
                .slice()
                .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
                .map((item, i, arr) => (
                  <PathItemRow
                    key={item.id}
                    item={item}
                    course={courses[item.courseId]}
                    isLast={i === arr.length - 1}
                    onUpdate={updateItem}
                  />
                ))}
            </ol>
          </>
        )}
      </div>
    </div>
  );
}

function PathItemRow({
  item,
  course,
  isLast,
  onUpdate,
}: {
  item: PathItem;
  course: Course | undefined;
  isLast: boolean;
  onUpdate: (item: PathItem) => void;
}) {
  const [updating, setUpdating] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);
  const [thread, setThread] = useState<{ question: string; answer: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [asking, setAsking] = useState(false);

  async function setStatus(status: PathItemStatus) {
    if (status === item.status || updating) return;
    setUpdating(true);
    try {
      const res = await fetch(`/api/learning-path/items/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        onUpdate(await res.json());
        if (status === "completed") {
          setStamped(true);
          setTimeout(() => setStamped(false), 500);
        }
      }
    } finally {
      setUpdating(false);
    }
  }

  async function ask(q: string) {
    if (!q.trim() || asking) return;
    setAsking(true);
    try {
      const res = await fetch(`${BACKEND_URL}/chat/explain`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pathItemId: item.id, question: q }),
      });
      const data = await res.json();
      setThread((prev) => [
        ...prev,
        { question: q, answer: data.answer ?? data.error ?? "No answer available." },
      ]);
      setQuestion("");
    } finally {
      setAsking(false);
    }
  }

  return (
    <li className="relative pl-14">
      {!isLast && (
        <span
          aria-hidden
          className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px border-l-2 border-dashed border-border"
        />
      )}
      <span
        className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-medium ${
          course ? GRADE_CLASS[course.level] : "bg-grade-advanced text-text ring-1 ring-border-strong"
        } ${stamped ? "stamp" : ""}`}
      >
        {item.sequenceOrder}
      </span>

      <div className="pb-10">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="font-serif text-lg font-semibold text-text">
            {course?.title ?? "Course"}
          </h2>
          {course && (
            <span className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
              {course.domain}
            </span>
          )}
        </div>

        {item.milestoneLabel && (
          <span className="mt-2 inline-block rounded-full bg-surface-raised px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-text-muted ring-1 ring-border">
            Milestone: {item.milestoneLabel}
          </span>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={item.status === s}
              onClick={() => setStatus(s)}
              disabled={updating}
              className={
                item.status === s
                  ? "rounded-full bg-blaze px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-text"
                  : "rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-text-muted ring-1 ring-border transition-colors hover:bg-surface-raised"
              }
            >
              {STATUS_LABEL[s]}
            </button>
          ))}
        </div>

        {course?.sourceUrl && (
          <a
            href={course.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block text-sm font-medium text-text underline decoration-border underline-offset-2 hover:decoration-text"
          >
            View course
          </a>
        )}

        <div className="mt-3">
          <button
            type="button"
            onClick={() => {
              setExplainOpen((v) => !v);
              if (!explainOpen && thread.length === 0) {
                ask("Why is this recommended at this point in my path?");
              }
            }}
            className="text-sm text-text-muted underline decoration-border underline-offset-2 hover:text-text hover:decoration-text"
          >
            {explainOpen ? "Hide explanation" : "Why this waypoint?"}
          </button>

          {explainOpen && (
            <div className="mt-3 rounded-xl bg-surface p-4 ring-1 ring-border">
              {thread.map((t, i) => (
                <div key={i} className={i > 0 ? "mt-3" : undefined}>
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
                    {t.question}
                  </p>
                  <p className="mt-1.5 text-base leading-7 text-text">{t.answer}</p>
                </div>
              ))}
              {asking && (
                <p className="mt-2 font-mono text-xs uppercase tracking-wide text-text-faint">
                  Thinking…
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  ask(question);
                }}
                className="mt-3 flex gap-2"
              >
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a follow-up…"
                  className="flex-1 rounded-full bg-surface-raised px-3 py-2 text-sm text-text placeholder:text-text-faint ring-1 ring-border focus:outline-none focus:ring-2 focus:ring-blaze"
                />
                <button
                  type="submit"
                  disabled={asking || !question.trim()}
                  className="rounded-full px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-text-muted ring-1 ring-border transition-colors hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Ask
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
