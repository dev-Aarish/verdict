import { createFileRoute, Link } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { Logo } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { GenreRadar } from "@/components/GenreRadar";
import { computeGenreDna } from "@/lib/genre-dna";
import { getUserWatchedFn } from "@/api/movies";
import { getTasteScoreFn } from "@/api/taste-score";
import { getUserVerdictsFn } from "@/api/verdicts";
import { useState, useEffect, useRef, useCallback } from "react";
import type { User, WatchedEntryWithMovie, VerdictWithUser } from "@/lib/types";
import { toPng } from "html-to-image";
import { toast } from "sonner";

export const Route = createFileRoute("/share/$username")({
  head: ({ params }) => {
    const siteUrl =
      typeof window === "undefined"
        ? process.env.APP_URL || import.meta.env.VITE_SITE_URL || ""
        : "";
    const ogImage = `${siteUrl}/og/${params.username}`;
    return {
      meta: [
        { title: `${params.username}'s Verdict card` },
        {
          name: "description",
          content: `Share ${params.username}'s Taste Score.`,
        },
        { property: "og:title", content: `${params.username}'s Verdict Card` },
        {
          property: "og:description",
          content: `${params.username} has a Taste Score. See their film verdict card.`,
        },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
        { property: "og:url", content: `${siteUrl}/share/${params.username}` },
      ],
    };
  },
  component: SharePage,
});

function SharePage() {
  const { username } = Route.useParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [data, setData] = useState<{
    watched: { entries: WatchedEntryWithMovie[]; user: User | null };
    score: {
      score: number;
      breakdown: { diversity: number; obscurity: number; consistency: number };
    } | null;
    verdicts: VerdictWithUser[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserWatchedFn({ data: { username } }).catch(() => ({
        entries: [],
        user: null,
      })),
      getTasteScoreFn({ data: { username } }).catch(() => null),
      getUserVerdictsFn({ data: { username } }).catch(() => ({
        verdicts: [],
      })),
    ]).then(([watched, score, v]) => {
      setData({ watched, score, verdicts: v.verdicts });
      setLoading(false);
    });
  }, [username]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust: true,
      });
      const link = document.createElement("a");
      link.download = `verdict-${username}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Card downloaded");
    } catch (err) {
      console.error("Download failed", err);
      toast.error("Failed to download card");
    } finally {
      setDownloading(false);
    }
  }, [username]);

  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/share/${username}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy link");
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-3xl px-6 py-12 text-center">
          <p className="text-caption text-dust py-24">Loading...</p>
        </main>
      </div>
    );
  }

  if (!data?.watched?.user) {
    return <ErrorScreen variant="not-found" code={404} path={`/share/${username}`} />;
  }

  const topFilms = data.watched.entries.slice(0, 5).map((e: WatchedEntryWithMovie, i: number) => ({
    id: String(i),
    title: e.movie?.title || "Unknown",
    year: e.movie?.year ? Number(e.movie.year) : 0,
    rating: e.rating,
  }));
  const tasteScore = data.score?.score || 0;
  const filmCount = data.watched.entries.length;
  const dna = filmCount > 0 ? computeGenreDna(data.watched.entries) : null;
  const firstVerdict = data.verdicts[0];

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8">
          <Link
            to="/profile/$username"
            params={{ username }}
            className="text-caption text-dust hover:text-paper transition-colors"
          >
            ← Back to profile
          </Link>
          <div className="mt-3">
            <p className="text-caption">Shareable</p>
            <h1 className="text-section text-paper">Verdict card</h1>
            <p className="mt-2 max-w-md text-sm text-dust">
              Tear along the perforation. Keep the stub.
            </p>
          </div>
        </div>

        {/* The card — 9:16 story format, two-panel ticket stub */}
        <div className="mx-auto w-full max-w-sm">
          <div
            ref={cardRef}
            className="ticket-stub relative aspect-[9/16] overflow-hidden border-2 border-brass/40 bg-ink text-left"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% -10%, oklch(0.30 0.005 85) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, oklch(0.22 0.005 85) 0%, transparent 60%)",
            }}
          >
            {/* Perforation seam — split into two panels (top ~72% / stub ~28%) */}
            <div className="absolute inset-x-0 top-[72%] z-20 pointer-events-none">
              {/* left/right notches */}
              <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full bg-background" />
              <div className="absolute -right-3 -top-3 h-6 w-6 rounded-full bg-background" />
              {/* dashed perforation */}
              <div className="mx-6 h-0 border-t border-dashed border-brass/50" />
            </div>

            {/* TOP panel — the verdict */}
            <div className="flex h-[72%] flex-col justify-between p-7">
              <div className="flex items-start justify-between">
                <div>
                  <Logo variant="brass" size="sm" />
                  <p className="text-caption mt-1">Est. 2026</p>
                </div>
                <div className="text-right">
                  <p className="text-caption">Reel</p>
                  <p className="mono text-sm text-paper">#{String(tasteScore).padStart(3, "0")}</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center">
                <p className="text-caption mb-3">The taste of</p>
                <p className="text-card-title text-paper">@{username}</p>
                <div className="mt-5 flex items-center justify-center gap-4">
                  <Stamp size="lg" rotation={-4} label="Taste Score" animate="settle">
                    {tasteScore}
                  </Stamp>
                  {dna && <GenreRadar dna={dna} size={118} />}
                </div>
                {firstVerdict && (
                  <>
                    <p className="mono mt-6 max-w-[240px] text-sm italic text-paper/90">
                      "{firstVerdict.comment}"
                    </p>
                    <p className="text-caption mt-2">— {firstVerdict.fromUser?.username}</p>
                  </>
                )}
              </div>

              <div className="hairline flex items-center justify-between pt-3">
                <span className="text-caption">Aud. A</span>
                <span className="text-caption">{filmCount} films</span>
                <span className="text-caption">20:00</span>
              </div>
            </div>

            {/* BOTTOM stub — now showing list */}
            <div
              className="relative h-[28%] p-6"
              style={{
                background: "linear-gradient(180deg, transparent 0%, oklch(0.22 0.005 85) 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-caption">Now Showing</p>
                <p className="text-caption">verdict.app/@{username}</p>
              </div>
              <ul className="mt-3 space-y-1">
                {topFilms.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-baseline justify-between gap-2 border-b border-border/40 pb-1 mono text-[11px] text-paper/85"
                  >
                    <span className="truncate">
                      {f.title}
                      <span className="text-dust"> · {f.year}</span>
                    </span>
                    <span className="text-brass">{f.rating}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="border-2 border-brass bg-brass px-6 py-3 text-caption text-ink hover:bg-transparent hover:text-brass transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {downloading ? "Saving…" : "Download"}
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="border-2 border-border px-6 py-3 text-caption text-paper hover:border-brass hover:text-brass transition-colors cursor-pointer"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
