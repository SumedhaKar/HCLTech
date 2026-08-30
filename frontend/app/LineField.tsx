const LINE_COUNT = 46;
const STEPS = 48;
const VB_WIDTH = 1440;
const VB_HEIGHT = 900;

function buildPath(i: number): { d: string; opacity: number; strokeWidth: number } {
  const t = i / (LINE_COUNT - 1);
  const distFromCenter = Math.abs(t - 0.5) * 2;
  const offset = (t - 0.5) * 2 * (VB_WIDTH * 0.42);
  const cx = VB_WIDTH / 2;
  const opacity = 0.14 + 0.3 * (1 - distFromCenter);
  const strokeWidth = distFromCenter < 0.15 ? 1.6 : 1;

  const points: string[] = [];
  for (let s = 0; s <= STEPS; s++) {
    const y = (s / STEPS) * VB_HEIGHT;
    const pinch = Math.abs(y - VB_HEIGHT / 2) / (VB_HEIGHT / 2);
    const wobble = Math.sin(y * 0.012 + i * 0.15) * 10 * pinch;
    const x = cx + offset * Math.pow(pinch, 1.6) + wobble;
    points.push(`${s === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return { d: points.join(" "), opacity, strokeWidth };
}

const LINES = Array.from({ length: LINE_COUNT }, (_, i) => buildPath(i));

/**
 * The homepage hero's generative line field — a server-rendered SVG
 * adaptation of the reference's thread/vortex visual. Static markup (no
 * client JS, no hydration timing) so it's guaranteed to be present the
 * instant the page paints; a slow, subtle breathing transform on the group
 * provides restrained motion, disabled under prefers-reduced-motion.
 */
export default function LineField() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={`0 0 ${VB_WIDTH} ${VB_HEIGHT}`}
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <g className="line-field-breathe">
        {LINES.map((line, i) => (
          <path
            key={i}
            d={line.d}
            stroke="rgba(245, 245, 242, 1)"
            strokeOpacity={line.opacity}
            strokeWidth={line.strokeWidth}
          />
        ))}
      </g>
    </svg>
  );
}
