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
          OWN-WORLD: Deep forest-charcoal ground, warm parchment-cream signage
          cards, rust-blaze orange accent, waypoint-blue secondary; Zilla Slab
          display (carved-sign character), Archivo body (wayfinding grotesk),
          JetBrains Mono for waypoint/coordinate labels.
          STORY: A learner names a goal, sees it become a graded, sequenced
          route with real courses and milestones, and can ask why each stop
          was chosen.
          FIRST VIEWPORT: Full-bleed topographic-contour dark ground; wordmark
          in the header, headline and dek on the dark ground at left, a cream
          signpost panel at right holding the goal input, example chips, and
          rust CTA that reads as a trail blaze.
          FORM: Trailhead Signage, grounded direction #3, seed key e907ef5a.
          FINISH: unreviewed and undocumented is unfinished; this build ends
          with the finish review, the verdict, and DESIGN.md.
        */}
        {children}
      </body>
    </html>
  );
}
