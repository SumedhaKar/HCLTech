import Link from "next/link";
import type { CSSProperties } from "react";
import LineField from "./LineField";
import RouteWaypoint from "./RouteWaypoint";
import SiteHeader from "./components/SiteHeader";

type Grade = "beginner" | "intermediate" | "advanced";

const GRADE_LABEL: Record<Grade, string> = {
  beginner: "Light trail",
  intermediate: "Mid trail",
  advanced: "Dark trail",
};

const GRADE_CLASS: Record<Grade, string> = {
  beginner: "bg-grade-beginner",
  intermediate: "bg-grade-intermediate",
  advanced: "bg-grade-advanced",
};

const GRADE_TEXT_CLASS: Record<Grade, string> = {
  beginner: "text-ground",
  intermediate: "text-ground",
  advanced: "text-text",
};

const EXAMPLE_GOALS = [
  "Become a backend engineer",
  "Break into cybersecurity",
  "Learn data engineering",
];

type Waypoint = {
  order: number;
  course: string;
  domain: string;
  grade: Grade;
  milestone: string;
  note: string;
};

const EXAMPLE_ROUTE: Waypoint[] = [
  {
    order: 1,
    course: "Python for Everybody",
    domain: "Programming Fundamentals",
    grade: "beginner",
    milestone: "Foundations",
    note: "Every later waypoint assumes you can read and write basic Python.",
  },
  {
    order: 2,
    course: "Git and GitHub for Beginners",
    domain: "Programming Fundamentals",
    grade: "beginner",
    milestone: "Foundations",
    note: "The version-control habit every team, and every later course, quietly assumes.",
  },
  {
    order: 3,
    course: "Introduction to SQL",
    domain: "Programming Fundamentals",
    grade: "beginner",
    milestone: "Foundations",
    note: "A backend without a database story isn't a backend. This is the baseline.",
  },
  {
    order: 4,
    course: "Node.js, Express, MongoDB & More",
    domain: "Web Development",
    grade: "intermediate",
    milestone: "Build the API",
    note: "Routing, middleware, and a real document database — the actual job.",
  },
  {
    order: 5,
    course: "OWASP Top 10 for Web Developers",
    domain: "Cybersecurity",
    grade: "advanced",
    milestone: "Harden the API",
    note: "Aimed at people who already build web apps — which, by waypoint 5, you do.",
  },
];

export default function Home() {
  return (
    <div className="corner-frame flex flex-col flex-1 bg-ground text-text">
      <SiteHeader />

      {/* First viewport: the thesis, not a header */}
      <section className="relative overflow-hidden px-6 pb-24 pt-14 sm:px-10 sm:pt-20">
        <LineField />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center gap-8 text-center">
          <h1 className="max-w-2xl font-serif text-5xl font-bold leading-[1.05] tracking-tight text-text sm:text-7xl">
            Say where you want to go.
            <br />
            <span className="bg-gradient-to-b from-text-muted to-text-faint bg-clip-text text-transparent">
              We&apos;ll mark the trail.
            </span>
          </h1>
          <p className="max-w-lg text-base leading-7 text-text-muted">
            PathFinder turns a goal into a graded, sequenced route —
            real courses, in the right order, with prerequisites marked
            and every waypoint explained. Not another course list.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/chat"
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-blaze px-6 py-3 font-mono text-sm uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_10px_28px_-8px_rgba(224,136,56,0.5)]"
            >
              Find my path »
            </Link>
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center rounded-full bg-surface px-6 py-3 font-mono text-sm uppercase tracking-wide text-text-muted ring-1 ring-border transition-colors hover:text-text hover:ring-border-strong"
            >
              Browse the catalog
            </Link>
          </div>

          <GoalPanel />
        </div>
      </section>

      <div className="hatch-divider" aria-hidden />

      {/* The mechanism, demonstrated with real catalog content */}
      <section className="bg-ground px-6 py-20 sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-text sm:text-3xl">
            Five real waypoints toward &ldquo;Become a backend
            engineer.&rdquo;
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-text-muted">
            An example route, built from the live catalog — the sequence
            and grading are illustrative of how a generated path reads.
            Your own route depends on your stated goal, experience, and
            time.
          </p>

          <ol className="mt-12 flex flex-col">
            {EXAMPLE_ROUTE.map((wp, i) => (
              <RouteWaypoint key={wp.order} index={i}>
                {i < EXAMPLE_ROUTE.length - 1 && (
                  <span
                    aria-hidden
                    style={{ "--i": i } as CSSProperties}
                    className="trail-line absolute left-[27px] top-14 h-[calc(100%-1.5rem)] w-px border-l-2 border-dashed border-border"
                  />
                )}
                <span
                  className={`absolute left-0 top-0 flex h-14 w-14 items-center justify-center rounded-full font-mono text-lg font-semibold ${GRADE_CLASS[wp.grade]} ${GRADE_TEXT_CLASS[wp.grade]} ${wp.grade === "advanced" ? "ring-1 ring-border-strong" : ""}`}
                >
                  {wp.order}
                </span>

                <div className="pb-14">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-serif text-xl font-bold text-text">
                      {wp.course}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
                      {wp.domain}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-surface-raised px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-text-muted ring-1 ring-border">
                      Milestone: {wp.milestone}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-text-faint">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${GRADE_CLASS[wp.grade]}`}
                        aria-hidden
                      />
                      {GRADE_LABEL[wp.grade]}
                    </span>
                  </div>

                  {wp.order === 4 && <ExplainCallout note={wp.note} />}
                </div>
              </RouteWaypoint>
            ))}
          </ol>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-border bg-ground-raised px-6 py-16 text-center sm:px-10">
        <h2 className="font-serif text-2xl font-semibold text-text sm:text-3xl">
          Your trail starts with one sentence.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          No account needed to see how it works — describe a goal and get a
          route back.
        </p>
        <Link
          href="/chat"
          className="mt-7 inline-flex items-center justify-center rounded-full bg-blaze px-6 py-3 font-mono text-sm uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_10px_28px_-8px_rgba(224,136,56,0.5)]"
        >
          Start the conversation
        </Link>
      </section>

      <footer className="border-t border-border px-6 py-8 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
          PathFinder — a personalized learning path recommender · 49 courses across programming, web development, cybersecurity, data, and mobile
        </p>
      </footer>
    </div>
  );
}

function GoalPanel() {
  return (
    <div className="relative w-full max-w-md rounded-[20px] bg-surface p-6 text-left text-text ring-1 ring-border sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
        Where are you headed?
      </p>
      <div
        aria-hidden
        className="mt-3 rounded-xl bg-surface-raised px-3 py-3 text-sm text-text-muted ring-1 ring-border"
      >
        e.g. &ldquo;I want to become a backend engineer&rdquo;
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_GOALS.map((goal) => (
          <span
            key={goal}
            className="rounded-full bg-surface-raised px-3 py-1.5 text-xs text-text-muted ring-1 ring-border"
          >
            {goal}
          </span>
        ))}
      </div>

      <Link
        href="/chat"
        className="mt-6 flex w-full items-center justify-center rounded-full bg-blaze px-5 py-3 font-mono text-sm uppercase tracking-wide text-text transition-[background-color,box-shadow] hover:bg-blaze-deep hover:shadow-[0_0_0_1px_rgba(224,136,56,0.4),0_10px_28px_-8px_rgba(224,136,56,0.5)]"
      >
        Find my path
      </Link>

      <p className="mt-4 text-xs leading-5 text-text-faint">
        49 courses across programming, web development, cybersecurity, data,
        and mobile — sequenced by prerequisite, not popularity.
      </p>
    </div>
  );
}

function ExplainCallout({ note }: { note: string }) {
  return (
    <div className="mt-4 rounded-xl bg-surface p-4 ring-1 ring-border">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-text-muted">
        Why this waypoint
      </p>
      <p className="mt-2 text-sm leading-6 text-text">{note}</p>
    </div>
  );
}
