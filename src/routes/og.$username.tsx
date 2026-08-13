import type {} from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "@vercel/og";
import { getUserWatchedFn } from "@/api/movies";
import { getTasteScoreFn } from "@/api/taste-score";
import { getUserVerdictsFn } from "@/api/verdicts";
import type { WatchedEntryWithMovie, VerdictWithUser } from "@/lib/types";
import { computeGenreDna } from "@/lib/genre-dna";
import { OgCard, getFonts, type OgData } from "./-og-card";

function extractUsername(url: string): string {
  try {
    const path = new URL(url).pathname; // /og/alice
    return path.replace(/^\/og\//, "").replace(/\/$/, "");
  } catch {
    return "";
  }
}

async function serveOg(safeUsername: string) {
  let fonts: Awaited<ReturnType<typeof getFonts>> | null = null;
  try {
    fonts = await getFonts();
  } catch {
    fonts = null;
  }

  let data: OgData | null = null;

  try {
    const [watched, score, verdicts] = await Promise.all([
      getUserWatchedFn({ data: { username: safeUsername } }).catch(() => ({
        entries: [],
        user: null,
      })),
      getTasteScoreFn({ data: { username: safeUsername } }).catch(() => null),
      getUserVerdictsFn({ data: { username: safeUsername } }).catch(() => ({ verdicts: [] })),
    ]);

    if (!watched?.user) {
      return new Response("Not found", { status: 404 });
    }

    const entries = watched.entries as WatchedEntryWithMovie[];
    const firstVerdict = (verdicts.verdicts as VerdictWithUser[])?.[0];
    data = {
      username: safeUsername,
      score: Math.round(score?.score ?? 0),
      filmCount: entries.length,
      films: entries.slice(0, 5).map((e) => ({
        title: e.movie?.title || "Unknown",
        year: e.movie?.year ?? "",
        rating: e.rating,
      })),
      quote: firstVerdict?.comment || null,
      quoteFrom: firstVerdict?.fromUser?.username || null,
      dna: entries.length > 0 ? computeGenreDna(entries) : null,
    };
  } catch {
    return new Response("Server error", { status: 500 });
  }

  try {
    return new ImageResponse(<OgCard {...data} />, {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "Playfair", data: fonts.playfair900, weight: 900 as const, style: "normal" },
            { name: "Playfair", data: fonts.playfair700, weight: 700 as const, style: "normal" },
            { name: "JetBrainsMono", data: fonts.mono500, weight: 500 as const, style: "normal" },
          ]
        : undefined,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[og] ImageResponse failed", err);
    return new Response("Image generation failed", { status: 500 });
  }
}

type HandlerInfo = { request?: Request; params?: Record<string, string> };

export const Route = createFileRoute("/og/$username")({
  server: {
    handlers: {
      GET: (info: HandlerInfo | Request) => {
        // The runtime may hand us a wrapped ({ request, params }) object or a
        // bare Request — resolve the username defensively from either.
        const params = "params" in (info as HandlerInfo) ? (info as HandlerInfo).params : undefined;
        const req = info instanceof Request ? info : (info as HandlerInfo)?.request;
        const username = params?.username || (req ? extractUsername(req.url || "") : "");
        return serveOg(username);
      },
    },
  },
});
