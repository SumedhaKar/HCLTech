import styles from "./page.module.css";
import HeaderNav from "./HeaderNav";
import AppearFallback from "./AppearFallback";

const HERO_VIDEO_SRC = "/hero-video.mp4";

const STATS = [
  {
    label: "112 real courses across 17 domains",
    icon: (
      <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden>
        <defs>
          <linearGradient id="stat1a" x1="3" y1="2" x2="14" y2="22">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
            <stop offset="1" stopColor="#3a3a3a" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id="stat1b" x1="3" y1="2" x2="14" y2="22">
            <stop offset="0" stopColor="#3a3a3a" stopOpacity="0.38" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0.62" />
          </linearGradient>
        </defs>
        <rect x="3.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#stat1a)" />
        <rect x="13.4" y="2.6" width="7.2" height="18.8" rx="3.6" fill="url(#stat1b)" />
        <rect x="9.2" y="10.9" width="5.6" height="2.2" rx="1.1" fill="#4a4a4a" />
      </svg>
    ),
  },
  {
    label: "3 difficulty grades, auto-sequenced by prerequisite",
    icon: (
      <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden>
        <rect x="2.4" y="2.4" width="19.2" height="19.2" rx="6.2" fill="#ffffff" />
        <path
          d="M12 7.1v7.4M8.15 12.35L12 16.2l3.85-3.85"
          fill="none"
          stroke="#111"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    label: "100% personalized — never a generic list",
    icon: (
      <svg className={styles.statIconWide} viewBox="0 0 40 22" aria-hidden>
        <circle cx="10.2" cy="11" r="9.2" fill="#2b2b2b" />
        <ellipse cx="10.2" cy="12.1" rx="4.15" ry="3.7" fill="#f4f4f4" />
        <circle cx="8.6" cy="11.6" r="0.7" fill="#1a1a1a" />
        <circle cx="11.8" cy="11.6" r="0.7" fill="#1a1a1a" />

        <circle cx="20.2" cy="11" r="9.2" fill="#ffffff" />
        <circle cx="18.4" cy="10.2" r="1.7" fill="#111111" />
        <circle cx="22" cy="10.2" r="1.7" fill="#111111" />
        <ellipse cx="20.2" cy="12.9" rx="1.1" ry="0.8" fill="#111111" />
        <path
          d="M17.3 14.7c1 1.3 4.6 1.3 5.6 0"
          fill="none"
          stroke="#111"
          strokeWidth="1.2"
          strokeLinecap="round"
        />

        <circle cx="30.2" cy="11" r="9.2" fill="#f26b1d" />
        <text
          x="30.2"
          y="15.1"
          fontSize="12.5"
          fontWeight="700"
          fontFamily="Inter, system-ui, sans-serif"
          fill="#ffffff"
          textAnchor="middle"
        >
          e
        </text>
      </svg>
    ),
  },
];

export default function Home() {
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font -- exact
          self-hosted-font fallback specified for the landing hero only;
          rest of the app uses next/font (Zilla Slab/Archivo/JetBrains Mono). */}
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900&family=Instrument+Serif:ital@1&display=swap"
      />

      <div className={styles.grain} aria-hidden />
      <video
        className={styles.heroVideo}
        aria-hidden
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      >
        <source src={HERO_VIDEO_SRC} type="video/mp4" />
      </video>

      <div className={styles.page}>
        <HeaderNav />

        <main className={styles.hero} id="top">
          <div className={styles.heroCopy}>
            <span
              className={`${styles.badge} appear appear--pop`}
              style={{ ["--d" as string]: "0.22s" }}
            >
              <svg
                className={`${styles.badgeStar} badge-star`}
                width="18"
                height="20"
                viewBox="0 0 24 24"
                fill="white"
                aria-hidden
              >
                <path d="M12 2.6C12.55 2.6 12.88 3.15 13.08 4.7c.62 4.7 1.52 5.6 6.22 6.22 1.55.2 2.1.53 2.1 1.08s-.55.88-2.1 1.08c-4.7.62-5.6 1.52-6.22 6.22-.2 1.55-.53 2.1-1.08 2.1s-.88-.55-1.08-2.1c-.62-4.7-1.52-5.6-6.22-6.22C3.15 12.88 2.6 12.55 2.6 12s.55-.88 2.1-1.08c4.7-.62 5.6-1.52 6.22-6.22C11.12 3.15 11.45 2.6 12 2.6Z" />
              </svg>
              AI-Sequenced Learning Paths
            </span>

            <h1 className={styles.h1}>
              <span
                className={`${styles.headlineLine} appear appear--mask`}
                style={{ ["--d" as string]: "0.42s" }}
              >
                Chart a{" "}
                <em className={`${styles.em} em-emphasis`}>guided route</em>{" "}
                through
              </span>
              <span
                className={`${styles.headlineLine} appear appear--mask`}
                style={{ ["--d" as string]: "0.62s" }}
              >
                real courses, in minutes.
              </span>
            </h1>

            <p
              className={`${styles.lede} appear appear--soft`}
              style={{ ["--d" as string]: "0.82s", animationDuration: "1.25s" }}
            >
              PathFinder sequences real courses into one guided route,
              matched to your goal, experience, and time.
            </p>

            <div className={styles.heroActions}>
              <a
                href="/chat"
                className={`${styles.btn} ${styles.btnSolid} ${styles.heroBtn} appear appear--btn`}
                style={{ ["--d" as string]: "0.96s" }}
              >
                Find my path
              </a>
              <a
                href="/catalog"
                className={`${styles.btn} ${styles.btnGhost} ${styles.heroBtn} appear appear--side`}
                style={{ ["--d" as string]: "1.10s" }}
              >
                Browse the catalog
              </a>
            </div>
          </div>
        </main>

        <footer className={styles.stats}>
          {STATS.map((stat, i) => (
            <span
              key={stat.label}
              className={`${styles.stat} appear appear--stat`}
              style={{ ["--d" as string]: `${1.12 + i * 0.16}s` }}
            >
              {stat.icon}
              {stat.label}
            </span>
          ))}
        </footer>
      </div>

      <AppearFallback />
    </>
  );
}
