import type { Metadata } from "next";
import { Zilla_Slab, Archivo, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const zillaSlab = Zilla_Slab({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const archivo = Archivo({
  variable: "--font-body",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["500"],
});

export const metadata: Metadata = {
  title: "PathFinder",
  description: "Say where you want to go. We'll mark the trail.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${zillaSlab.variable} ${archivo.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {/*
          THESIS: A generated path is a marked trail, not a course list — the
          category default (feature-card SaaS grid) is refused.
          OWN-WORLD: Night Trail — near-black ground everywhere (no light
          "signage" surface left), one blaze-orange accent (fill-only, plus a
          brighter glow variant for shadows/bare-text), difficulty graded as
          a light-to-black tonal scale rather than three hues; Zilla Slab
          display pushed to 700 for the one hero statement per page, Archivo
          body, JetBrains Mono for labels. Direction set from a concrete
          reference site rather than a rolled concept seed.
          STORY: A learner names a goal, sees it become a graded, sequenced
          route with real courses and milestones, and can ask why each stop
          was chosen.
          FIRST VIEWPORT: Full-bleed near-black hero with a corner tick-mark
          frame and a generative line field behind the headline; wordmark and
          pill nav in the header, a dark elevated goal-input card at right.
          FORM: The Night Trail (redesign from reference), replacing Trailhead
          Signage.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md.
        */}
        {children}
      </body>
    </html>
  );
}
