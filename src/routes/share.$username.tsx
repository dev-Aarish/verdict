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
import { absoluteUrl } from "@/lib/site-url";

export const Route = createFileRoute("/share/$username")({
  head: ({ params }) => {
    const ogImage = absoluteUrl(`/og/${params.username}`);
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
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
        { property: "og:url", content: absoluteUrl(`/share/${params.username}`) },
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

      <main className="mx-auto max-w-3xl px-5 py-8 md:px-6 md:py-12 pb-24">
        <div className="mb-8 flex flex-col items-center sm:items-start">
          <Link
            to="/profile/$username"
            params={{ username }}
            className="group inline-flex items-center gap-2 text-caption text-dust hover:text-paper transition-colors py-1 cursor-pointer"
          >
            <span className="transition-transform group-hover:-translate-x-1">←</span>
            <span>Return to Profile</span>
          </Link>
          <div className="mt-4 text-center sm:text-left">
            <p className="text-caption text-brass uppercase tracking-widest text-xs">Official Print</p>
            <h1 className="text-section text-paper mt-1">Verdict Ticket</h1>
            <p className="mt-2 max-w-md text-sm text-dust">
              Tear along the perforation. Keep the stub as testimony.
            </p>
          </div>
        </div>

        {/* The card — 9:16 story format, two-panel ticket stub */}
        <div className="mx-auto w-full max-w-sm">
          <div
            ref={cardRef}
            className="ticket-stub relative aspect-[9/16] overflow-hidden border-2 border-brass/40 bg-ink text-left shadow-2xl transition-all"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at 50% -10%, oklch(0.30 0.005 85) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, oklch(0.22 0.005 85) 0%, transparent 60%)",
            }}
          >
            {/* Perforation seam — split into two panels (top ~72% / stub ~28%) */}
            <div className="absolute inset-x-0 top-[72%] z-20 pointer-events-none">
              {/* left/right circular notches */}
              <div className="absolute -left-3.5 -top-3.5 h-7 w-7 rounded-full bg-background border-r border-brass/40" />
              <div className="absolute -right-3.5 -top-3.5 h-7 w-7 rounded-full bg-background border-l border-brass/40" />
              {/* dashed perforation line */}
              <div className="mx-6 h-0 border-t border-dashed border-brass/50" />
            </div>

            {/* TOP panel — the verdict */}
            <div className="flex h-[72%] flex-col justify-between p-6 sm:p-7">
              <div className="flex items-start justify-between">
                <div>
                  <Logo variant="brass" size="sm" />
                  <p className="text-caption mt-1 text-[10px] tracking-widest text-dust">Screening Room</p>
                </div>
                <div className="text-right">
                  <p className="text-caption text-[10px] text-brass">Reel ID</p>
                  <p className="mono text-xs text-paper font-semibold">#{String(tasteScore).padStart(3, "0")}</p>
                </div>
              </div>

              <div className="flex flex-col items-center text-center my-auto">
                <p className="text-caption text-xs text-dust tracking-wider">The taste of</p>
                <p className="text-card-title text-paper mt-1 font-serif text-2xl tracking-tight">@{username}</p>
                <div className="mt-4 flex items-center justify-center gap-4">
                  <Stamp size="lg" rotation={-4} label="Taste Score" animate="settle">
                    {tasteScore}
                  </Stamp>
                  {dna && <GenreRadar dna={dna} size={110} />}
                </div>
                {firstVerdict && (
                  <div className="mt-5 px-2">
                    <p className="font-serif italic text-xs leading-relaxed text-paper/90 max-w-[240px]">
                      "{firstVerdict.comment}"
                    </p>
                    <p className="text-caption mt-1 text-[10px] text-brass/80">— {firstVerdict.fromUser?.username}</p>
                  </div>
                )}
              </div>

              <div className="hairline flex items-center justify-between pt-3 text-[11px] text-dust mono">
                <span>Aud. A</span>
                <span className="text-paper/80 font-medium">{filmCount} logged</span>
                <span>20:00</span>
              </div>
            </div>

            {/* BOTTOM stub — now showing list */}
            <div
              className="relative h-[28%] p-5 sm:p-6 flex flex-col justify-between"
              style={{
                background: "linear-gradient(180deg, transparent 0%, oklch(0.20 0.005 85) 100%)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-caption text-[10px] text-brass uppercase tracking-wider">Now Showing</p>
                <p className="mono text-[10px] text-dust">verdict.app</p>
              </div>
              <ul className="mt-2 space-y-1">
                {topFilms.slice(0, 4).map((f) => (
                  <li
                    key={f.id}
                    className="flex items-baseline justify-between gap-2 border-b border-white/5 pb-0.5 mono text-[10px] text-paper/85"
                  >
                    <span className="truncate">
                      {f.title}
                      <span className="text-dust text-[9px]"> ({f.year})</span>
                    </span>
                    <span className="text-brass font-semibold">{f.rating}★</span>
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
              className="min-h-[44px] flex items-center justify-center gap-2 border-2 border-brass bg-brass px-4 py-3 text-caption text-ink font-semibold hover:bg-transparent hover:text-brass active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              <span>{downloading ? "Saving…" : "Save Stub"}</span>
            </button>
            <button
              type="button"
              onClick={handleCopyLink}
              className="min-h-[44px] flex items-center justify-center gap-2 border border-dust/40 bg-velvet/60 px-4 py-3 text-caption text-paper hover:border-brass hover:text-brass active:scale-[0.98] transition-all cursor-pointer shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
              </svg>
              <span>{copied ? "Copied!" : "Copy Link"}</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
