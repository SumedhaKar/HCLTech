---
name: PathFinder
description: An AI-powered personalized learning path recommender
colors:
  ground: "#16211b"
  ground-raised: "#1e2c24"
  ground-line: "#2c3c32"
  signage: "#f2e9d6"
  signage-raised: "#ffffff"
  signage-line: "#d8c9a8"
  ink: "#201b12"
  ink-muted: "#5a5140"
  text: "#ede6d6"
  text-muted: "#a9b0a3"
  text-faint: "#8a9188"
  blaze: "#a94a18"
  blaze-deep: "#7e3712"
  blaze-pale: "#f0b98a"
  waypoint: "#4f8ba3"
  waypoint-deep: "#3e6e82"
  grade-beginner: "#3e5c2c"
  grade-intermediate: "#3e6e82"
  grade-advanced: "#2a241c"
typography:
  display:
    fontFamily: "Zilla Slab, Georgia, serif"
    fontSize: "clamp(2.25rem, 5vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "normal"
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
  sm: "2px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.blaze}"
    textColor: "{colors.signage}"
    rounded: "{rounded.sm}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.blaze-deep}"
    textColor: "{colors.signage}"
    rounded: "{rounded.sm}"
  chip:
    backgroundColor: "{colors.signage-raised}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "6px 12px"
---

# Design System: PathFinder

## Overview

**Creative North Star: "The Trailhead Signpost"**

PathFinder's visual world is a national-park trailhead at dusk: a routed wood sign at the edge of the woods, graded difficulty blazes marking the route ahead, a topographic contour map fading into the tree line. The product's core mechanism — turning a stated goal into a sequenced, prerequisite-aware route — is literally a marked trail, not a course-catalog grid. The category default this world refuses: gradient-hero EdTech SaaS with duotone feature cards and a stock photo of laughing laptop users.

The system is quiet and unadorned. It commits to a real material world (routed signage, painted blazes, engraved markers) through restrained, intentional gestures — a lifted signpost panel, a stamped-metal inset on numbered waypoint markers — rather than literal wood-grain texture or skeuomorphic decoration, which would read as costume rather than craft.

**Key Characteristics:**
- Deep forest-charcoal ground as the dominant field, warm parchment-cream as the carried "signage" surface
- A single confident rust-orange accent, used only for the primary action and active blaze markers
- Difficulty grading (beginner/intermediate/advanced) expressed as real trail-blaze colors, reused as a functional system, not decoration
- Zilla Slab display type with carved-sign character, paired with Archivo's wayfinding-grotesk body text
- Flat by default; depth appears only where the world's own materials would have it (a raised panel, a stamped disc)

## Colors

Earthy and muted, never neon or gradient-driven — colors read as pigment and painted metal, not backlit glass.

### Primary
- **Burnt Rust Blaze** (`#a94a18`): the single saturated accent. Primary buttons and the active trail-blaze marker only. Darkened from the literal hiking-blaze orange so text on top clears contrast at rest; hover deepens further (`#7e3712`) rather than brightening.

### Secondary
- **Dusk Slate Blue** (`#3e6e82`): the intermediate-difficulty blaze color and link/secondary-emphasis color (e.g. the "why this waypoint" label).

### Neutral
- **Deep Forest Charcoal** (`#16211b`): the dominant page ground.
- **Raised Forest Panel** (`#1e2c24`): sections that sit one step above the ground (footer band, closing CTA band).
- **Trailhead Parchment** (`#f2e9d6`): the "signage" surface — any card or panel meant to read as a physical sign face.
- **Signage White** (`#ffffff`): the raised surface within a parchment panel (inputs, chips, milestone tags).
- **Trail Ink** (`#201b12`): body text on parchment/white surfaces.
- **Warm Trail Cream** (`#ede6d6`): body text on the dark ground. Never pure white — always tinted warm.
- **Moss Trail Green** (`#3e5c2c`) / **Black Diamond Charcoal** (`#2a241c`): the beginner and advanced difficulty-blaze colors, completing the three-step grading system alongside Dusk Slate Blue.

### Named Rules
**The One Blaze Rule.** Rust-orange is the only saturated accent on any given screen. It appears exactly where the visitor can act (primary CTA) or where a route is actively marked (a blaze). It never decorates.

**The Graded-Not-Generic Rule.** Difficulty is always shown through the three named blaze colors (moss / slate-blue / charcoal), never through generic "success/warning/danger" status colors borrowed from dashboard UI conventions.

## Typography

**Display Font:** Zilla Slab (with Georgia, serif fallback)
**Body Font:** Archivo (with Helvetica Neue, Arial fallback)
**Label/Mono Font:** JetBrains Mono

**Character:** A carved-sign slab paired with a wayfinding grotesk — confident and official-feeling without tipping into corporate or bookish. Mono is reserved for anything that reads as a stamped label or coordinate, never used as a "technical" costume.

### Hierarchy
- **Display** (600, `clamp(2.25rem, 5vw, 3rem)`, 1.1 line-height): page-level headlines (hero H1, section H2s, card-name H3s all share this family at different sizes/weights).
- **Body** (400, 1rem, 1.75 line-height): paragraph copy, max measure ~65ch.
- **Label** (500, 0.6875rem, 0.14em tracking, uppercase): domain tags, milestone chips, grade labels, footer line — always mono, always tracked, never a substitute for a real heading.

### Named Rules
**The No-Eyebrow Rule.** No small label ever sits directly above a heading as a kicker. Context that would have lived in an eyebrow belongs in the heading itself or the body copy beneath it.

## Layout

Single-column content stacked in full-bleed sections, each section a flat field of one ground color (dark charcoal or parchment), alternating to mark rhythm. Within a section, content centers in a max-width column (`max-w-3xl`–`max-w-5xl`). The hero is the one asymmetric exception: a two-column split (headline left, action panel right) that collapses to a single stacked column below `lg`. Route/waypoint content reads as a vertical timeline with a dashed connector line, numbered markers fixed to the left edge.

## Elevation & Depth

Flat by default. Depth appears only in two deliberate places: the hero's action panel (Trailhead Parchment) sits on a soft, offset, blurred shadow to read as a physically raised sign; and each numbered waypoint marker carries a small inset shadow suggesting a stamped-metal disc. Nothing else in the system casts a shadow.

### Shadow Vocabulary
- **Signpost lift** (`box-shadow: 0 18px 40px -16px rgba(0,0,0,0.55)`): the hero action panel only.
- **Stamped disc** (`box-shadow: inset 0 2px 3px rgba(0,0,0,0.35), inset 0 -1px 1px rgba(255,255,255,0.15)`): numbered waypoint markers only.

### Named Rules
**The Two-Shadow Rule.** Only the signpost lift and the stamped disc exist as shadows anywhere in the system. A third shadow vocabulary is a sign the flat/material balance has drifted.

## Shapes

Small, consistent radii throughout (`rounded-sm`, 2px) on cards, buttons, and tags — just enough to soften without going soft-app-generic. Fully circular (`rounded-full`) only for two things: numbered waypoint markers and pill-shaped example-goal chips. No large-radius "bubbly" cards anywhere.

## Components

### Buttons
- **Shape:** 2px radius (`rounded-sm`), never fully rounded.
- **Primary:** Burnt Rust Blaze background, Trailhead Parchment text, mono uppercase label, tracked letter-spacing, `12px 24px` padding.
- **Hover:** deepens to `#7e3712` — darker, never brighter.
- **Secondary/Ghost:** not yet in use; when needed, follow the parchment-panel treatment (parchment/white background, ink text, hairline ring) rather than an outlined-blaze variant.

### Chips
- **Style:** Signage White background, ink-muted text, 1px hairline ring in Signage Hairline (`#d8c9a8`), fully rounded (pill).
- **State:** currently display-only (example-goal suggestions); no selected/unselected variant exists yet.

### Cards / Containers
- **Corner Style:** 2px radius.
- **Background:** Trailhead Parchment (the hero action panel) or the section's own ground color (waypoint list items sit directly on the parchment section, uncontained).
- **Shadow Strategy:** see Elevation & Depth — only the hero panel is lifted.
- **Internal Padding:** generous (`24px`–`32px`) on the one lifted panel; list items use left-padding only, no card chrome.

### Waypoint Marker (signature component)
A 40px circle in the active difficulty-blaze color, holding the route-order number in mono, Trailhead Parchment text, with the stamped-disc inset shadow. Connected to the next marker by a 1px dashed vertical line in the section's hairline color. This is the system's signature device — any future "sequence" or "progress" UI should reuse this marker language rather than inventing a new one (e.g. a progress bar or step indicator). Reused directly (28px, same treatment) as the "trail permit" checklist marker on the chat-intake screen, filling from an empty hairline-ring outline to a solid grade-beginner disc with an authored checkmark SVG once a field is known.

### Chat Bubbles
Assistant messages: Trailhead Parchment background, Trail Ink text, hairline ring, left-aligned. User messages: Dusk Slate Blue background, Warm Trail Cream text, right-aligned, no ring (the color alone carries the distinction). Both share the 2px radius; no tails or carets.

### Status Pills
A row of small fully-rounded pills (not the button radius) for a multi-state choice (waypoint status: not started / in progress / completed). The active pill fills with Burnt Rust Blaze and Trailhead Parchment text; inactive pills are text-only with a hairline ring. Deliberately reuses The One Blaze Rule rather than inventing status-specific colors — blaze means "the state you're in," not "success."

## Do's and Don'ts

### Do:
- **Do** keep rust-orange to one saturated use per screen (The One Blaze Rule).
- **Do** express difficulty/level through the three named blaze colors, everywhere in the product, not just this page.
- **Do** let headings carry their own weight — no eyebrow/kicker labels above them.
- **Do** darken (not brighten) interactive colors on hover, to keep every state at or above 4.5:1 text contrast.
- **Do** reuse the waypoint-marker language for any future sequence, timeline, or progress UI.

### Don't:
- **Don't** introduce a second saturated accent color; secondary emphasis uses Dusk Slate Blue only.
- **Don't** add literal wood-grain, paper-fiber, or metal-brush texture images — the material world is evoked through shadow and color, never through texture assets.
- **Don't** use generic status colors (green=success, red=error, in the Bootstrap/Material sense) — the palette's green/blue/charcoal trio means difficulty grade, not status.
- **Don't** add a card-grid feature-list section (icon + heading + text, repeated) — the system's structure is sequence-first, not a grid of equal-weight cards.
