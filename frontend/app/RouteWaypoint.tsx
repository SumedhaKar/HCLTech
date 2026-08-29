import type { CSSProperties } from "react";

/**
 * The one authored motion moment on the page: a brief staggered rise-in on
 * initial paint. Pure CSS (see .rise-in in globals.css) — content is fully
 * visible by default and the animation is additive, never a visibility gate,
 * so it degrades safely with no JS, slow hydration, or reduced motion.
 */
export default function RouteWaypoint({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <li
      className="relative pl-14 rise-in"
      style={{ "--i": index } as CSSProperties}
    >
      {children}
    </li>
  );
}
