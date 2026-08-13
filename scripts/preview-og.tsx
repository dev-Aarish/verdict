// Local OG-card preview. Renders a real user's share card to a PNG without
// needing the vite dev server (which resolves @vercel/og's edge build and only
// runs correctly inside the deployed Vercel/Node function).
//
// Usage:
//   bun scripts/preview-og.tsx <username> [--out path.png]   (fetches live data)
//   bun scripts/preview-og.tsx demo [--out path.png]         (sample data)
import React from "react";
import { ImageResponse } from "@vercel/og";
import { writeFileSync } from "node:fs";
import { OgCard, getFonts, clampUsername } from "../src/routes/-og-card";

const [usernameArg, outArg] = process.argv.slice(2);
const outPath = outArg === "--out" ? process.argv[process.argv.length - 1] : `preview-${usernameArg ?? "demo"}.png`;

const BACKEND = process.env.API_URL || "http://localhost:4000";

async function demoData() {
  return {
    username: clampUsername("alice"),
    score: 87,
    filmCount: 42,
    films: [
      { title: "Paris, Texas", year: "1984", rating: 9 },
      { title: "The Conversation", year: "1974", rating: 8 },
      { title: "Yi Yi", year: "2000", rating: 8 },
      { title: "Suspiria", year: "1977", rating: 7 },
      { title: "In the Mood for Love", year: "2000", rating: 10 },
    ],
    quote: "They film every frame like it's the last one.",
    quoteFrom: "bob",
  };
}

async function liveData(username: string) {
  async function j<T>(p: string): Promise<T> {
    return fetch(`${BACKEND}/api${p}`).then((r) => (r.ok ? r.json() : null));
  }
  const [watched, score, v] = await Promise.all([
    j<{ user: unknown; entries: { movie?: { title?: string; year?: string }; rating: number }[] }>(
      `/movies/user/${username}`,
    ),
    j<{ score?: number } | null>(`/users/${username}/taste-score`),
    j<{ verdicts?: { comment?: string; fromUser?: { username?: string } }[] }>(
      `/verdicts/user/${username}`,
    ),
  ]);
  if (!watched?.user) throw new Error(`user "${username}" not found via ${BACKEND}`);
  const first = v?.verdicts?.[0];
  return {
    username: clampUsername(username),
    score: Math.round(score?.score ?? 0),
    filmCount: watched.entries.length,
    films: watched.entries.slice(0, 5).map((e) => ({
      title: e.movie?.title || "Unknown",
      year: e.movie?.year ?? "",
      rating: e.rating,
    })),
    quote: first?.comment || null,
    quoteFrom: first?.fromUser?.username || null,
  };
}

async function main() {
  let fonts = null;
  try {
    fonts = await getFonts();
  } catch (e) {
    console.error("fonts failed (continuing without custom fonts):", e);
  }

  const username = usernameArg && usernameArg !== "demo" ? usernameArg : undefined;
  const data = username ? await liveData(username) : await demoData();

  const res = new ImageResponse(<OgCard {...data} />, {
    width: 1200,
    height: 630,
    fonts: fonts
      ? [
          { name: "Playfair", data: fonts.playfair900, weight: 900 as const, style: "normal" },
          { name: "Playfair", data: fonts.playfair700, weight: 700 as const, style: "normal" },
          { name: "JetBrainsMono", data: fonts.mono500, weight: 500 as const, style: "normal" },
        ]
      : undefined,
  });

  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buf);
  console.log(`Wrote ${outPath} (${buf.byteLength} bytes)`);
  console.log(`Open it: open "${outPath}"`);
}

main().catch((e) => {
  console.error("Failed:", e);
  process.exit(1);
});