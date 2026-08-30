"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import styles from "./page.module.css";

const NAV_ITEMS = [
  { href: "/chat", label: "Chat", appear: "appear--scale", delay: "0.16s" },
  { href: "/dashboard", label: "Dashboard", appear: "appear--soft", delay: "0.28s" },
  { href: "/catalog", label: "Catalog", appear: "appear--scale", delay: "0.40s" },
  { href: "/profile", label: "Profile", appear: "appear--soft", delay: "0.52s" },
] as const;

export default function HeaderNav() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.classList.add("menu-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onResize = () => {
      if (window.matchMedia("(min-width: 901px)").matches) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      document.body.classList.remove("menu-open");
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
      <header className={styles.header}>
        <Link
          href="/"
          aria-label="PathFinder"
          className={`${styles.logo} appear appear--scale`}
          style={{ ["--d" as string]: "0.08s" }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden
          >
            <g transform="rotate(-30 12 12)">
              <circle cx="7.3" cy="3.2" r="1.45" />
              <rect x="5.5" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <rect x="14.9" y="4.7" width="3.6" height="14.6" rx="1.8" />
              <circle cx="16.7" cy="20.8" r="1.45" />
            </g>
          </svg>
          PathFinder
        </Link>

        <nav className={styles.nav} id="site-nav" aria-label="Primary">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navLink} appear ${item.appear}`}
              style={{ ["--d" as string]: item.delay }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.headerRight}>
          <Link
            href="/chat"
            className={`${styles.btn} ${styles.btnSolid} appear appear--scale`}
            style={{ ["--d" as string]: "0.34s" }}
          >
            Find my path
          </Link>
          <button
            type="button"
            className={`${styles.burger} ${open ? styles.burgerOpen : ""} appear appear--scale`}
            style={{ ["--d" as string]: "0.34s" }}
            aria-controls="site-nav"
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((v) => !v)}
          >
            <span className={styles.burgerBars} aria-hidden>
              <span className={styles.burgerBar} />
              <span className={styles.burgerBar} />
              <span className={styles.burgerBar} />
            </span>
          </button>
        </div>
      </header>

      <div
        className={`${styles.menuBackdrop} ${open ? styles.menuOpen : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden
      />
      <nav
        className={`${styles.mobileNav} ${open ? styles.menuOpen : ""}`}
        aria-label="Mobile"
        aria-hidden={!open}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={styles.mobileNavLink}
            onClick={() => setOpen(false)}
            tabIndex={open ? 0 : -1}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
