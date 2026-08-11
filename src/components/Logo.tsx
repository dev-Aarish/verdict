import { cn } from "@/lib/utils";

/**
 * Verdict mark — a clapperboard, free-standing.
 *
 * The house motif is the rubber stamp: grain-roughened, inked in brass, set
 * off-axis. The logo is the clapperboard itself — the slate (its diagonal
 * stripes cut out, like the writing area) and the hinged stick lifted,
 * mid-clap. It's the object that literally stamps a scene: clap, and a
 * verdict is in the can. The wordmark stays a letter — the mark is never
 * a "V".
 */

/*
 * Diagonal stripes cut into the slate, at 45°, five across the board. The
 * clapboard fills the 64-unit canvas edge to edge (12..52 × 16..56).
 */
const STRIPE_CENTERS: ReadonlyArray<readonly [number, number]> = [
  [12, 26],
  [22, 33.5],
  [32, 41],
  [42, 48.5],
  [52, 56],
];

/*
 * Static filter id on purpose: the mark appears on the share card, which gets
 * serialized and rasterized by html-to-image. React's useId() emits ids with
 * guillemet/colon characters that are fragile inside SVG url(#…) references
 * once the DOM is re-parsed. Every instance defines the same filter, so
 * multiple marks on one page all resolve to the first identical definition.
 */
const GRAIN_FILTER_ID = "vd-logo-grain";

interface LogoMarkProps {
  className?: string;
}

export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className={cn("block", className)}
    >
      <defs>
        <filter id={GRAIN_FILTER_ID} x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            seed="7"
            result="n"
          />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
        <mask id="vd-clap-stripes" maskUnits="userSpaceOnUse">
          <rect x="12" y="26" width="40" height="30" fill="white" />
          {STRIPE_CENTERS.map(([cx, cy]) => (
            <rect
              key={`${cx}-${cy}`}
              x={cx - 3.5}
              y={cy - 30}
              width="7"
              height="60"
              fill="black"
              transform={`rotate(45 ${cx} ${cy})`}
            />
          ))}
        </mask>
      </defs>
      {/* The clapboard itself — grain-roughened like an inked stamp. */}
      <g
        transform="rotate(-3 32 32)"
        fill="currentColor"
        stroke="none"
        filter={`url(#${GRAIN_FILTER_ID})`}
      >
        {/* Hinged stick, lifted mid-clap */}
        <rect x="12" y="16" width="40" height="7" rx="1.5" />
        <circle cx="13" cy="19.5" r="2.5" />
        {/* Slate with stripes cut out */}
        <rect x="12" y="26" width="40" height="30" rx="2" mask="url(#vd-clap-stripes)" />
      </g>
    </svg>
  );
}

interface LogoProps {
  variant?: "paper" | "brass";
  size?: "sm" | "md" | "lg";
  markOnly?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { mark: "h-5 w-5", word: "text-sm" },
  md: { mark: "h-6 w-6", word: "text-lg" },
  lg: { mark: "h-9 w-9", word: "text-2xl" },
} as const;

export function Logo({ variant = "paper", size = "md", markOnly = false, className }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2.5",
        variant === "brass" ? "text-brass" : "text-paper",
        className,
      )}
    >
      <LogoMark className={sizeMap[size].mark} />
      {!markOnly && (
        <span className={cn("wordmark leading-none", sizeMap[size].word)}>Verdict</span>
      )}
    </span>
  );
}
