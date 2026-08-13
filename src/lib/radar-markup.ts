// Genre DNA Radar — the six-axis taste fingerprint.
//
// Rendered as a projector iris: hexagonal grid rings, a radial glow (the
// bloom), mono axis labels. The SVG markup is pure geometry (no <text>) so it
// renders identically in the browser, inside html-to-image captures, and in
// satori via a data-URI <img> (labels are overlaid as HTML where text needs
// to exist).

import type { GenreDna } from "@/lib/genre-dna";

export const RADAR_BRASS = "#d1a757";
export const RADAR_PAPER = "#eee7d9";
export const RADAR_DUST = "#74716c";

const AXES: { key: keyof GenreDna; label: string }[] = [
  { key: "action", label: "Action" },
  { key: "drama", label: "Drama" },
  { key: "comedy", label: "Comedy" },
  { key: "horror", label: "Horror" },
  { key: "thriller", label: "Thriller" },
  { key: "mystery", label: "Mystery" },
];

function angleFor(i: number): number {
  // Start at 12 o'clock, sweep clockwise.
  return -Math.PI / 2 + (i * 2 * Math.PI) / AXES.length;
}

function fmt(n: number): string {
  return n.toFixed(2);
}

export interface RadarLabel {
  key: string;
  label: string;
  value: number;
  x: number;
  y: number;
}

export interface RadarMarkup {
  svg: string;
  labels: RadarLabel[];
  size: number;
}

/**
 * Build the radar geometry + SVG markup for a given dna and size. `size` is
 * the viewBox dimension; the outer ring is 0.3×size so labels (overlaid as
 * HTML) have room around the iris.
 */
export function radarMarkup(dna: GenreDna, size: number): RadarMarkup {
  const c = size / 2;
  const R = size * 0.3;
  const labelR = size * 0.4;

  const pt = (i: number, r: number) => {
    const a = angleFor(i);
    return { x: c + r * Math.cos(a), y: c + r * Math.sin(a) };
  };

  const ring = (frac: number) =>
    AXES.map((_, i) => {
      const p = pt(i, R * frac);
      return `${fmt(p.x)},${fmt(p.y)}`;
    }).join(" ");

  const dataPoints = AXES.map((axis, i) => {
    const v = Math.max(0, Math.min(100, dna[axis.key]));
    return pt(i, (v / 100) * R);
  });
  const dataPoly = dataPoints.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(" ");

  const rings = [0.25, 0.5, 0.75, 1]
    .map(
      (f) =>
        `<polygon points="${ring(f)}" fill="none" stroke="${RADAR_DUST}" stroke-opacity="0.28" stroke-width="1" />`,
    )
    .join("\n");

  const spokes = AXES.map((_, i) => {
    const p = pt(i, R);
    return `<line x1="${fmt(c)}" y1="${fmt(c)}" x2="${fmt(p.x)}" y2="${fmt(p.y)}" stroke="${RADAR_DUST}" stroke-opacity="0.2" stroke-width="1" />`;
  }).join("\n");

  const vertexDots = dataPoints
    .map((p) => `<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="3" fill="${RADAR_BRASS}" />`)
    .join("\n");

  const labels: RadarLabel[] = AXES.map((axis, i) => {
    const p = pt(i, labelR);
    return {
      key: axis.key,
      label: axis.label,
      value: Math.round(dna[axis.key]),
      x: p.x,
      y: p.y,
    };
  });

  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`,
    `<defs>`,
    `<radialGradient id="bloom" cx="50%" cy="50%" r="50%">`,
    `<stop offset="0%" stop-color="${RADAR_BRASS}" stop-opacity="0.16" />`,
    `<stop offset="100%" stop-color="${RADAR_BRASS}" stop-opacity="0" />`,
    `</radialGradient>`,
    `</defs>`,
    // Projector bloom behind the iris
    `<circle cx="${fmt(c)}" cy="${fmt(c)}" r="${fmt(R * 1.6)}" fill="url(#bloom)" />`,
    // Faint lens mount ring
    `<circle cx="${fmt(c)}" cy="${fmt(c)}" r="${fmt(R * 1.02)}" fill="none" stroke="${RADAR_DUST}" stroke-opacity="0.16" stroke-width="1" />`,
    rings,
    spokes,
    // Data polygon — the iris opening
    `<polygon points="${dataPoly}" fill="${RADAR_BRASS}" fill-opacity="0.13" stroke="${RADAR_BRASS}" stroke-width="2" stroke-linejoin="round" />`,
    vertexDots,
    // Center pivot
    `<circle cx="${fmt(c)}" cy="${fmt(c)}" r="2.5" fill="${RADAR_BRASS}" />`,
    `</svg>`,
  ].join("\n");

  return { svg, labels, size };
}

/** Data-URI for embedding the radar as an <img> (used in satori OG cards). */
export function radarDataUri(dna: GenreDna, size: number): string {
  const { svg } = radarMarkup(dna, size);
  const b64 =
    typeof Buffer !== "undefined" ? Buffer.from(svg, "utf8").toString("base64") : btoa(svg);
  return `data:image/svg+xml;base64,${b64}`;
}
