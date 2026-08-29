import Link from "next/link";
import RouteWaypoint from "./RouteWaypoint";

type Grade = "beginner" | "intermediate" | "advanced";

const GRADE_LABEL: Record<Grade, string> = {
  beginner: "Green blaze",
  intermediate: "Blue blaze",
  advanced: "Black blaze",
};

const GRADE_CLASS: Record<Grade, string> = {
  beginner: "bg-grade-beginner",
  intermediate: "bg-grade-intermediate",
  advanced: "bg-grade-advanced",
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
    grade: "intermediate",
    milestone: "Harden the API",
    note: "Aimed at people who already build web apps — which, by waypoint 5, you do.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-ground text-text">
      <header className="flex items-center justify-between px-6 py-5 sm:px-10">
        <span className="font-serif text-lg tracking-tight text-text [text-shadow:0_1px_0_rgba(0,0,0,0.5)]">
          PathFinder
        </span>
        <Link
          href="/catalog"
          className="text-sm text-text-muted underline decoration-ground-line underline-offset-4 transition-colors hover:text-text hover:decoration-blaze"
        >
          Browse the catalog
        </Link>
      </header>

      {/* First viewport: the thesis, not a header */}
      <section className="relative overflow-hidden px-6 pb-20 pt-6 sm:px-10 sm:pt-10">
        <ContourField />

        <div className="relative mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <h1 className="max-w-xl font-serif text-4xl font-semibold leading-[1.1] text-text [text-shadow:0_1px_0_rgba(0,0,0,0.4)] sm:text-5xl">
              Say where you want to go.
              <br />
              We&apos;ll mark the trail.
            </h1>
            <p className="mt-5 max-w-md text-base leading-7 text-text-muted">
              PathFinder turns a goal into a graded, sequenced route —
              real courses, in the right order, with prerequisites marked
              and every waypoint explained. Not another course list.
            </p>
          </div>

          <GoalPanel />
        </div>
      </section>

      {/* The mechanism, demonstrated with real catalog content */}
      <section className="bg-signage px-6 py-20 text-ink sm:px-10">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-serif text-2xl font-semibold text-ink sm:text-3xl">
            Five real waypoints toward &ldquo;Become a backend
            engineer.&rdquo;
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted">
            An example route, built from the live catalog — the sequence
            and grading are illustrative of how a generated path reads.
            Your own route depends on your stated goal, experience, and
            time.
          </p>

          <ol className="mt-10 flex flex-col">
            {EXAMPLE_ROUTE.map((wp, i) => (
              <RouteWaypoint key={wp.order} index={i}>
                {i < EXAMPLE_ROUTE.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute left-[19px] top-10 h-[calc(100%-1rem)] w-px border-l-2 border-dashed border-signage-line"
                  />
                )}
                <span
                  className={`absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full font-mono text-sm font-medium text-signage shadow-[inset_0_2px_3px_rgba(0,0,0,0.35),inset_0_-1px_1px_rgba(255,255,255,0.15)] ${GRADE_CLASS[wp.grade]}`}
                >
                  {wp.order}
                </span>

                <div className="pb-10">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-serif text-lg font-semibold text-ink">
                      {wp.course}
                    </h3>
                    <span className="font-mono text-[11px] uppercase tracking-wide text-ink-muted">
                      {wp.domain}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <span className="rounded-sm bg-signage-raised px-2 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-muted ring-1 ring-signage-line">
                      Milestone: {wp.milestone}
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-ink-muted">
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
      <section className="border-t border-ground-line bg-ground-raised px-6 py-16 text-center sm:px-10">
        <h2 className="font-serif text-2xl font-semibold text-text sm:text-3xl">
          Your trail starts with one sentence.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-text-muted">
          No account needed to see how it works — describe a goal and get a
          route back.
        </p>
        <Link
          href="/catalog"
          className="mt-7 inline-flex items-center justify-center rounded-sm bg-blaze px-6 py-3 font-mono text-sm uppercase tracking-wide text-signage transition-colors hover:bg-blaze-deep"
        >
          Explore the catalog
        </Link>
      </section>

      <footer className="border-t border-ground-line px-6 py-8 sm:px-10">
        <p className="font-mono text-[11px] uppercase tracking-wide text-text-faint">
          PathFinder — a personalized learning path recommender
        </p>
      </footer>
    </div>
  );
}

function GoalPanel() {
  return (
    <div className="relative rounded-sm bg-signage p-6 text-ink shadow-[0_18px_40px_-16px_rgba(0,0,0,0.55)] sm:p-8">
      <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-muted">
        Where are you headed?
      </p>
      <div
        aria-hidden
        className="mt-3 rounded-sm bg-signage-raised px-3 py-3 text-sm text-ink-muted ring-1 ring-signage-line"
      >
        e.g. &ldquo;I want to become a backend engineer&rdquo;
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {EXAMPLE_GOALS.map((goal) => (
          <span
            key={goal}
            className="rounded-full bg-signage-raised px-3 py-1.5 text-xs text-ink-muted ring-1 ring-signage-line"
          >
            {goal}
          </span>
        ))}
      </div>

      <Link
        href="/catalog"
        className="mt-6 flex w-full items-center justify-center rounded-sm bg-blaze px-5 py-3 font-mono text-sm uppercase tracking-wide text-signage transition-colors hover:bg-blaze-deep"
      >
        Find my path
      </Link>

      <p className="mt-4 text-xs leading-5 text-ink-muted">
        49 courses across programming, web development, cybersecurity, data,
        and mobile — sequenced by prerequisite, not popularity.
      </p>
    </div>
  );
}

function ExplainCallout({ note }: { note: string }) {
  return (
    <div className="mt-4 rounded-sm border border-dashed border-ink-muted/40 bg-signage-raised p-4">
      <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-waypoint-deep">
        Why this waypoint
      </p>
      <p className="mt-2 text-sm leading-6 text-ink">{note}</p>
    </div>
  );
}

function ContourField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
      preserveAspectRatio="xMaxYMin slice"
      viewBox="0 0 800 500"
      fill="none"
    >
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <path
          key={i}
          d={`M ${-50 + i * 8} ${520 - i * 55} C ${200 + i * 10} ${450 - i * 60}, ${350 - i * 5} ${300 - i * 40}, ${520 + i * 12} ${260 - i * 45} S ${780 - i * 8} ${180 - i * 30}, ${900} ${120 - i * 25}`}
          stroke="var(--color-blaze-pale)"
          strokeWidth="1.5"
        />
      ))}
    </svg>
  );
}
