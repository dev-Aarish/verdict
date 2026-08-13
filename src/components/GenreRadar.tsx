import type { CSSProperties } from "react";
import {
  radarMarkup,
  radarDataUri,
  RADAR_DUST,
  RADAR_BRASS,
  type RadarLabel,
} from "@/lib/radar-markup";
import type { GenreDna } from "@/lib/genre-dna";
import { cn } from "@/lib/utils";

interface GenreRadarProps {
  dna: GenreDna;
  size?: number;
  className?: string;
  /** Show axis labels + values overlaid around the iris. Default true. */
  showLabels?: boolean;
  /**
   * Font stack for axis labels. Defaults to the project mono stack; pass
   * "JetBrains Mono" when rendering inside satori (OG cards) since CSS vars
   * are not available there.
   */
  labelFont?: string;
}

function labelStyle(l: RadarLabel, size: number, labelFont: string): CSSProperties {
  const fontSize = Math.max(8, Math.round(size * 0.055));
  // Clamp so two-line labels never clip at the box edges (top/bottom axes
  // sit nearest to the boundary).
  const clampPct = (pct: number) => Math.min(86, Math.max(14, pct));
  return {
    position: "absolute",
    left: `${clampPct((l.x / size) * 100).toFixed(1)}%`,
    top: `${clampPct((l.y / size) * 100).toFixed(1)}%`,
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    fontFamily: labelFont,
    fontSize,
    lineHeight: 1.3,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: RADAR_DUST,
    whiteSpace: "nowrap",
  };
}

export function GenreRadar({
  dna,
  size = 210,
  className,
  showLabels = true,
  labelFont = "JetBrains Mono, ui-monospace, SFMono-Regular, monospace",
}: GenreRadarProps) {
  const { labels } = radarMarkup(dna, size);

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size, display: "flex" }}
    >
      <img
        src={radarDataUri(dna, size)}
        width={size}
        height={size}
        alt={`Genre DNA — Action ${dna.action}%, Drama ${dna.drama}%, Comedy ${dna.comedy}%, Horror ${dna.horror}%, Thriller ${dna.thriller}%, Mystery ${dna.mystery}%`}
        className="block h-full w-full"
      />
      {showLabels &&
        labels.map((l) => (
          <span key={l.key} style={labelStyle(l, size, labelFont)}>
            {l.label}
            <span style={{ display: "block", color: RADAR_BRASS, marginTop: 2 }}>{l.value}</span>
          </span>
        ))}
    </div>
  );
}
