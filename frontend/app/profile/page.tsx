"use client";

import { useEffect, useMemo, useState } from "react";
import SiteHeader from "../components/SiteHeader";
import type { ExperienceLevel, LearnerProfile } from "../lib/learnerProfile";

type Course = { id: string; title: string; domain: string };

const EXPERIENCE_OPTIONS: { value: ExperienceLevel; label: string; className: string }[] = [
  { value: "beginner", label: "Beginner", className: "bg-grade-beginner" },
  { value: "intermediate", label: "Intermediate", className: "bg-grade-intermediate" },
  { value: "advanced", label: "Advanced", className: "bg-grade-advanced" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [goal, setGoal] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [interestInput, setInterestInput] = useState("");
  const [timeBudget, setTimeBudget] = useState("");
  const [completedCourseIds, setCompletedCourseIds] = useState<string[]>([]);
  const [courseSearch, setCourseSearch] = useState("");

  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/learner-profile").then((res) => {
        if (!res.ok) throw new Error("Couldn't load your profile.");
        return res.json() as Promise<LearnerProfile>;
      }),
      fetch("/api/courses")
        .then((res) => res.json())
        .then((data: { courses: Course[] }) => data.courses ?? []),
    ])
      .then(([profileData, courseList]) => {
        setProfile(profileData);
        setCourses(courseList);
        setGoal(profileData.goal ?? "");
        setExperienceLevel(profileData.experienceLevel);
        setInterests(profileData.interests);
        setTimeBudget(
          profileData.timeBudgetHoursPerWeek !== null
            ? String(profileData.timeBudgetHoursPerWeek)
            : ""
        );
        setCompletedCourseIds(profileData.completedCourseIds);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => setLoading(false));
  }, []);

  const courseById = useMemo(
    () => Object.fromEntries(courses.map((c) => [c.id, c])),
    [courses]
  );

  const searchResults = useMemo(() => {
    const q = courseSearch.trim().toLowerCase();
    if (!q) return [];
    return courses
      .filter((c) => !completedCourseIds.includes(c.id))
      .filter((c) => c.title.toLowerCase().includes(q))
      .slice(0, 6);
  }, [courseSearch, courses, completedCourseIds]);

  function addInterest() {
    const value = interestInput.trim();
    if (!value || interests.includes(value)) {
      setInterestInput("");
      return;
    }
    setInterests((prev) => [...prev, value]);
    setInterestInput("");
  }

  function removeInterest(value: string) {
    setInterests((prev) => prev.filter((i) => i !== value));
  }

  function addCourse(id: string) {
    setCompletedCourseIds((prev) => [...prev, id]);
    setCourseSearch("");
  }

  function removeCourse(id: string) {
    setCompletedCourseIds((prev) => prev.filter((c) => c !== id));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      const res = await fetch("/api/learner-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goal.trim() || null,
          interests,
          experienceLevel,
          completedCourseIds,
          timeBudgetHoursPerWeek: timeBudget.trim() === "" ? null : Number(timeBudget),
        }),
      });
      if (!res.ok) throw new Error("Couldn't save your profile.");
      const updated: LearnerProfile = await res.json();
      setProfile(updated);
      setJustSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col bg-signage text-ink">
      <SiteHeader active="/profile" />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-10 sm:px-10">
        {loading && (
          <p className="font-mono text-xs uppercase tracking-[0.1em] text-ink-muted">
            Loading your profile…
          </p>
        )}

        {error && (
          <p className="rounded-sm bg-blaze-pale/30 px-3 py-2.5 text-sm text-blaze-deep ring-1 ring-blaze-pale">
            {error}
          </p>
        )}

        {!loading && profile && (
          <>
            <div>
              <h1 className="font-serif text-3xl font-semibold leading-tight text-ink">
                Your trail profile
              </h1>
              <p className="mt-1.5 text-sm leading-6 text-ink-muted">
                What PathFinder knows about you. Edit anything directly, or
                keep talking it through in chat instead.
              </p>
            </div>

            <div className="rounded-sm bg-signage-raised p-6 shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] ring-1 ring-signage-line">
              <div className="flex flex-col gap-6">
                {/* Goal */}
                <div>
                  <label
                    htmlFor="goal"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
                  >
                    Goal
                  </label>
                  <input
                    id="goal"
                    type="text"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="What are you trying to become?"
                    className="mt-2 w-full rounded-sm bg-signage px-3 py-2.5 text-sm text-ink placeholder:text-ink-muted ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
                  />
                </div>

                {/* Experience level */}
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                    Experience level
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {EXPERIENCE_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() =>
                          setExperienceLevel((prev) =>
                            prev === opt.value ? null : opt.value
                          )
                        }
                        className={
                          experienceLevel === opt.value
                            ? `rounded-full ${opt.className} px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide text-signage`
                            : "rounded-full px-4 py-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted ring-1 ring-signage-line transition-colors hover:bg-signage"
                        }
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label
                    htmlFor="interest-input"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
                  >
                    Interests
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {interests.map((interest) => (
                      <span
                        key={interest}
                        className="inline-flex items-center gap-1.5 rounded-full bg-signage-raised px-3 py-1 text-[13px] text-ink-muted ring-1 ring-signage-line"
                      >
                        {interest}
                        <button
                          type="button"
                          onClick={() => removeInterest(interest)}
                          aria-label={`Remove ${interest}`}
                          className="text-ink-muted hover:text-blaze-deep"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      id="interest-input"
                      type="text"
                      value={interestInput}
                      onChange={(e) => setInterestInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addInterest();
                        }
                      }}
                      placeholder="Add an interest…"
                      className="flex-1 rounded-sm bg-signage px-3 py-2 text-sm text-ink placeholder:text-ink-muted ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
                    />
                    <button
                      type="button"
                      onClick={addInterest}
                      disabled={!interestInput.trim()}
                      className="rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-wide text-ink-muted ring-1 ring-signage-line transition-colors hover:bg-signage disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Time budget */}
                <div>
                  <label
                    htmlFor="time-budget"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
                  >
                    Time budget
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      id="time-budget"
                      type="number"
                      min={0}
                      value={timeBudget}
                      onChange={(e) => setTimeBudget(e.target.value)}
                      placeholder="0"
                      className="w-24 rounded-sm bg-signage px-3 py-2 text-sm text-ink placeholder:text-ink-muted ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
                    />
                    <span className="text-sm text-ink-muted">hours / week</span>
                  </div>
                </div>

                {/* Completed courses */}
                <div>
                  <label
                    htmlFor="course-search"
                    className="font-mono text-[11px] uppercase tracking-wide text-ink-muted"
                  >
                    Completed courses
                  </label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {completedCourseIds.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-signage-raised px-3 py-1 text-[13px] text-ink-muted ring-1 ring-signage-line"
                      >
                        {courseById[id]?.title ?? id}
                        <button
                          type="button"
                          onClick={() => removeCourse(id)}
                          aria-label={`Remove ${courseById[id]?.title ?? id}`}
                          className="text-ink-muted hover:text-blaze-deep"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="relative mt-2">
                    <input
                      id="course-search"
                      type="text"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Search courses you've already finished…"
                      className="w-full rounded-sm bg-signage px-3 py-2 text-sm text-ink placeholder:text-ink-muted ring-1 ring-signage-line focus:outline-none focus:ring-2 focus:ring-waypoint-deep"
                    />
                    {searchResults.length > 0 && (
                      <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-sm bg-signage-raised ring-1 ring-signage-line">
                        {searchResults.map((c) => (
                          <li key={c.id}>
                            <button
                              type="button"
                              onClick={() => addCourse(c.id)}
                              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-ink hover:bg-signage"
                            >
                              <span>{c.title}</span>
                              <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                                {c.domain}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-7 flex items-center gap-4">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="rounded-sm bg-blaze px-5 py-2.5 font-mono text-sm uppercase tracking-wide text-signage transition-colors hover:bg-blaze-deep disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save profile"}
                </button>
                {justSaved && !saving && (
                  <span className="text-sm text-ink-muted">Saved.</span>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
