"use client";

import { useEffect } from "react";

/**
 * Marks each `.appear` element `is-in` once its entrance animation actually
 * finishes, and force-reveals everything if the browser never ran the
 * animation at all (no animation support, a paint that happened before
 * listeners attached, etc.) — content must never stay hidden waiting on an
 * animationend that isn't coming.
 */
export default function AppearFallback() {
  useEffect(() => {
    const targets = Array.from(document.querySelectorAll<HTMLElement>(".appear"));

    const markIn = (el: HTMLElement) => el.classList.add("is-in");
    const handlers = targets.map((el) => {
      const handler = () => markIn(el);
      el.addEventListener("animationend", handler, { once: true });
      return { el, handler };
    });

    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return;
        for (const el of targets) {
          const animations = el.getAnimations?.() ?? [];
          const isAnimating = animations.some(
            (a) => a.playState === "running" || a.playState === "finished",
          );
          if (!isAnimating) markIn(el);
        }
      });
    });

    return () => {
      cancelled = true;
      for (const { el, handler } of handlers) {
        el.removeEventListener("animationend", handler);
      }
    };
  }, []);

  return null;
}
