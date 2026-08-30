---
name: PathFinder
description: An AI-powered personalized learning path recommender
colors:
  ground: "#0a0a0a"
  ground-raised: "#141412"
  surface: "#161613"
  surface-raised: "#1d1d19"
  border: "#2c2c26"
  border-strong: "#3d3d35"
  text: "#f5f5f2"
  text-muted: "#a3a39c"
  text-faint: "#83837a"
  blaze: "#a94a18"
  blaze-deep: "#7e3712"
  blaze-glow: "#e08838"
  grade-beginner: "#e5e5df"
  grade-intermediate: "#8a8a80"
  grade-advanced: "#1a1a16"
typography:
  display:
    fontFamily: "Zilla Slab, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Archivo, Helvetica Neue, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "JetBrains Mono, SFMono-Regular, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.14em"
rounded:
  sm: "10px"
  lg: "20px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.blaze}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.blaze-deep}"
    textColor: "{colors.text}"
    rounded: "{rounded.full}"
  chip:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Design System: PathFinder

## Overview

**Creative North Star: "The Night Trail"**

PathFinder redesigned as a route marked after dark: a near-black field, a single warm blaze of light cutting through it, everything else rendered in the grayscale of a headlamp beam. The product's mechanism doesn't change — a stated goal still becomes a sequenced, graded route — but the world it's rendered in is now a precise, technical, high-contrast instrument rather than a warm daylight parkland. Difficulty grading, once three named trail-blaze hues, is now a tonal scale: lighter marks the easier ground, the fill deepens toward black as the route gets harder — literally "the further you go, the darker the trail," which reads as more true to a *night* trail than three colors ever did.

This direction was set from a concrete reference the team pointed to (a dark, monochrome, high-craft AI-product site) rather than rolled from a blind concept seed — the visual grammar (near-black ground, huge bold gradient-fade display type, fully-rounded pill actions, hairline-bordered cards, a generative line-based hero visual, corner tick-mark framing) is adopted deliberately close to that reference. Product truth, copy, the PathFinder name, and the waypoint/route/trail vocabulary are unchanged — this is a visual-world redesign, not a repositioning.

**Key Characteristics:**
- Near-black ground (`#0a0a0a`) throughout — homepage and app screens alike; there is no light "parchment" surface left anywhere in the system.
- Exactly one saturated accent, unchanged from the daylight system's fill value plus one brighter glow variant for shadows/bare-text — used only for the primary action, active states, and the stamped-confirmation motion. Everything else is grayscale.
- Difficulty grading expressed as a light-to-black tonal scale, never a second or third hue.
- Zilla Slab display type pushed to 700 weight with tight tracking for hero-scale statements; Archivo body copy; JetBrains Mono for labels — same three families as before, used harder.
- A generative line-based hero visual (adapted from the reference's thread/vortex idea as a 2D animated line field, not a full 3D/WebGL clone) is the one place the system spends real technical ambition.

## Colors

Monochrome by default. Color is rationed to a single accent so that when it appears, it means something.

### Primary
- **Blaze** (`#a94a18`): the one saturated accent in the entire system. Same value as the daylight system's fill color — it already cleared 4.5:1 with white/off-white text on top, which is the only way it's ever used (button and marker fills, never bare text on the ground). Hover darkens to Blaze Deep (`#7e3712`) and adds the blaze glow; nothing brightens the fill itself, since a brighter fill would fail that same contrast check.
- **Blaze Glow** (`#e08838`): a brighter variant reserved for the glow shadow and the rare case of blaze-as-bare-text (e.g. error copy) — the fill value fails 4.5:1 as bare text on near-black on its own, so glow/text uses branch off to this lighter value instead of bending the fill.

### Neutral
- **Ground** (`#0a0a0a`): the page background everywhere — hero, app screens, cards' surrounding field. No page in the product uses a light background anymore.
- **Ground Raised** (`#141412`): a barely-lighter band used only to mark a full-bleed section change (e.g. a closing CTA band) without introducing a border.
- **Surface** (`#161613`) / **Surface Raised** (`#1d1d19`): the two elevation steps for cards, panels, and inputs — a card sits on Surface, an input or nested chip inside that card sits on Surface Raised. Both are still dark; there is no surface in this system that inverts to light.
- **Border** (`#2c2c26`) / **Border Strong** (`#3d3d35`): the hairline rings that do almost all of the separation work in this system, replacing the old system's shadows. Border Strong is reserved for a card in a hovered/focused state.
- **Text** (`#f5f5f2`) / **Text Muted** (`#a3a39c`) / **Text Faint** (`#83837a`): three steps of off-white-to-gray, all tuned to clear 4.5:1 against both Ground and Surface.

### Named Rules
**The One Accent Rule** (replaces the old Two-Blaze/Waypoint split). Blaze is the only saturated color anywhere in the product. There is no second accent for links or secondary emphasis — secondary emphasis is carried by Text vs. Text Muted and by an underline, never by introducing a second hue.

**The Graded-Not-Colored Rule** (replaces the old Graded-Not-Generic Rule). Difficulty is shown as a light-to-black tonal scale (Grade Beginner → Grade Intermediate → Grade Advanced), never as separate hues and never as generic green/amber/red status colors.

## Typography

**Display Font:** Zilla Slab — now used at 700 weight for the single loudest statement on a page (a hero H1), 600 for everything else in the display role.
**Body Font:** Archivo.
**Label/Mono Font:** JetBrains Mono.

**Character:** the same carved-sign slab and wayfinding grotesk as before, but pushed harder — tighter tracking, heavier weight at the top of the scale, more size contrast between a hero statement and a section heading than the daylight system used.

### Hierarchy
- **Display** (600 normally, 700 for the one hero H1 per page, `clamp(2.25rem, 5vw, 3rem)` at 600 and up to `text-6xl`/`text-7xl` at 700 on the homepage hero specifically, 1.05 line-height): section H2s and card-name H3s at 600; the homepage hero H1 at 700.
- **Body** (400, 1rem, 1.75 line-height): paragraph copy and any content the visitor is meant to read closely (chat bubbles, explainer answers), not just scan.
- **Label** (500, 0.6875rem, 0.14em tracking, uppercase): domain tags, milestone chips, grade labels, footer line — always mono, always tracked.

### Named Rules
**The No-Eyebrow Rule** (unchanged). No small label ever sits directly above a heading as a kicker.
**Heading hierarchy** (unchanged from the previous pass): one H1 per page, no skipped levels.

## Layout

Full-bleed near-black throughout — the old alternating dark-ground/parchment section rhythm is gone, since there is no longer a light surface to alternate with. Rhythm instead comes from Ground vs. Ground Raised bands, and from card density. A thin, low-opacity corner tick-mark frame (four short L-shaped marks near the viewport corners, adapted from the reference) sits fixed at the page edges on the homepage as a quiet technical/instrument framing device. A diagonal-hatch hairline strip (a thin repeating 45° line pattern, adapted from the reference) marks the seam between the homepage's hero and the waypoint-list section, replacing the old hard color-block section break.

## Elevation & Depth

Flat and border-driven, not shadow-driven. A card is a Surface-colored rectangle with a Border ring; the only exception is the primary button and the stamped-marker motion, which get a soft blaze-tinted glow (not a black drop shadow — a glow reads correctly on a near-black ground, a dark shadow disappears into it).

### Shadow Vocabulary
- **Blaze glow** (`box-shadow: 0 0 0 1px rgba(224,136,56,0.4), 0 8px 24px -8px rgba(224,136,56,0.45)`): the primary action's hover/focus state, and the stamped-confirmation motion. The one place depth appears in the whole system.

### Named Rules
**The One-Glow Rule** (replaces the old Two-Shadow Rule). Only the blaze glow exists as elevation anywhere in the system; every other surface separates from its neighbor with a hairline border, not a shadow.

## Shapes

Inverted from the previous system: actions are now **fully rounded** (pill buttons, matching the reference), while cards and panels use a generous `20px` radius rather than the old sharp `2px`. Nothing in this system is sharp-cornered anymore — that was a deliberate daylight-signpost device that doesn't belong in a night-trail world.

## Components

### Buttons
- **Shape:** fully rounded (pill).
- **Primary:** Blaze background, Text (off-white) label, mono uppercase, tracked, `12px 24px` padding, blaze glow on hover.
- **Secondary/Ghost:** Surface background, Border ring, Text-muted label — used where the reference uses its white-on-dark "Request a demo" pairing (a second, lower-emphasis action next to the primary one).

### Chips / Pills
- **Style:** Surface Raised background, Text Muted label, fully rounded, hairline Border ring. Active/selected state fills with Blaze and switches label to Text.

### Cards / Panels
- **Corner Style:** `20px` radius.
- **Background:** Surface, with a Border hairline ring; Border Strong on hover/focus.
- **Elevation:** none by default — flat, separated by the border alone.

### Waypoint Marker (signature component)
Unchanged in structure — a circle holding the route-order number in mono — but now filled from the tonal grade scale (light gray → mid gray → near-black-with-a-light-ring) instead of three hues, with Text (dark ink on the two lighter grades, off-white on the near-black advanced grade) rather than a fixed light numeral. The homepage's example route runs this marker at full size (56px); the dashboard's working list stays compact (40px) — same split as before, reference-agnostic.

### The Stamped Confirmation (motion, unchanged)
The physical "stamp" confirming a checklist field or a completed path item is unchanged in timing and character, but its glow is now the system's one Blaze Glow rather than a generic shadow punch.

### The Line Field (hero visual, new)
A field of thin, near-white lines converging toward a center point behind the homepage hero copy — the system's adaptation of the reference's generative thread visual, built as server-rendered SVG paths (not canvas/WebGL) so the shape is present in the static markup with no client JS or hydration timing involved, with a slow CSS breathing transform for restrained life. Kept intentionally low-opacity so it reads as atmosphere rather than a competing focal point, and pauses under `prefers-reduced-motion`.

## The Landing Hero (homepage only)

The homepage (`/`) carries a second, deliberately distinct visual layer on top of Night Trail: a pure-black, single-viewport hero built from a concrete external reference (a liquid-metal, high-craft AI-SaaS landing page) the team pointed to directly, the same way the reference for Night Trail itself was chosen. This is scoped to `/` only — `/catalog`, `/chat`, `/dashboard`, and `/profile` are unaffected and stay on Night Trail's ground/surface/blaze system, since they're Operate surfaces (task screens), not a Persuade surface (the landing page).

**What's different here, and why it doesn't leak:**
- Pure black (`#000`) rather than Night Trail's `#0a0a0a`, Inter + Instrument Serif (italic accent word only) rather than Zilla Slab/Archivo, liquid-metal gradient nav pills and glass buttons rather than pill/blaze buttons — implemented as a CSS Module (`page.module.css`) plus two small client components (`HeaderNav.tsx`, `AppearFallback.tsx`), never in `globals.css`, so none of it can bleed into the app screens.
- Single viewport, no scroll, on desktop (`.page` locks to `100dvh` with `overflow: hidden` above 900px); scrolls normally on phone.
- A staggered entrance choreography (badge → masked headline lines → lede → CTAs → stats) plays once on load, gated by `prefers-reduced-motion` and backstopped by a fallback that force-reveals everything if the animation never actually runs.
- The three footer stats are real product facts (course count, domain count, grading mechanism, the personalization guarantee), not adoption/traction numbers — the reference's stats implied user counts PathFinder doesn't have, so they were replaced with things that are true by construction rather than invented social proof.

**Named Rule — The One-Surface Exception:** the landing hero is the only page in the system allowed to deviate from Night Trail's tokens and type system. Any other page reached by navigation (catalog, chat, dashboard, profile) must stay on Night Trail; don't extend the black/liquid-metal system past `/`.

## Do's and Don'ts

### Do:
- **Do** keep Blaze to the one saturated accent anywhere in the product (The One Accent Rule).
- **Do** express difficulty through the light-to-black tonal scale, everywhere in the product.
- **Do** let headings carry their own weight — no eyebrow/kicker labels above them.
- **Do** separate surfaces with a hairline border first; reach for the blaze glow only for the primary action and the stamp motion.
- **Do** keep every card and button fully dark — there is no light surface left in this system to fall back to.

### Don't:
- **Don't** introduce a second saturated accent color for links, secondary actions, or "intermediate" grading — that was the old Dusk Slate Blue and it's retired.
- **Don't** use a black drop shadow on a near-black ground — it disappears; use the blaze glow or a border instead.
- **Don't** bring back a light/cream "signage" surface anywhere, including for inputs or nested chips.
- **Don't** fabricate integration/partner logos the reference uses to imply endorsements PathFinder doesn't have — the logo strip is adapted as a plain real-course-domain-count line instead.
- **Don't** extend the landing hero's black/liquid-metal system past `/` (The One-Surface Exception) — and don't invent adoption/traction stats there; every stat must be a true product fact.
