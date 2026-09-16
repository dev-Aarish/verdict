import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";
import { TopBar } from "@/components/TopBar";
import { Stamp } from "@/components/Stamp";
import { getFilmFn } from "@/api/movies";
import { addToWatchlistFn, removeWatchlistFn, getCurrentUserWatchlistFn } from "@/api/watchlist";
import { useUser } from "@/lib/user-context";
import { avatarUrlFor } from "@/lib/avatar";
import { formatRuntime } from "@/lib/utils";
import type { FilmPage } from "@/lib/types";
import { ArrowLeft, Bookmark, Check, Clapperboard, Users, Film, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/film/$imdbId")({
  head: () => ({
    meta: [
      { title: `Film · Verdict` },
      {
        name: "description",
        content: `Community ratings and the jury verdict on this film, from everyone on Verdict who logged it.`,
      },
    ],
  }),
  component: FilmPage,
});

function FilmPage() {
  const { imdbId } = Route.useParams();
  const { user } = useUser();
  const router = useRouter();
  const [data, setData] = useState<FilmPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [watchlistEntryId, setWatchlistEntryId] = useState<string | null>(null);
  const [watchlistBusy, setWatchlistBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getFilmFn({ data: { imdbId } })
      .then(setData)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Failed to load film"))
      .finally(() => setLoading(false));
  }, [imdbId]);

  useEffect(() => {
    if (!user) return;
    getCurrentUserWatchlistFn()
      .then((res) => {
        const match = res.entries.find((e) => e.movie?.imdbId === imdbId);
        setWatchlistEntryId(match ? match.id : null);
      })
      .catch(() => {});
  }, [user, imdbId]);

  const toggleWatchlist = async () => {
    if (!user || !data || watchlistBusy) return;
    setWatchlistBusy(true);
    try {
      if (watchlistEntryId) {
        await removeWatchlistFn({ data: { entryId: watchlistEntryId } });
        setWatchlistEntryId(null);
      } else {
        const res = await addToWatchlistFn({
          data: {
            imdbId: data.movie.imdbId,
            title: data.movie.title,
            year: data.movie.year || "",
            posterUrl: data.movie.posterUrl,
          },
        });
        setWatchlistEntryId(res.entry.id);
      }
      router.invalidate();
    } catch (e) {
      console.error("Watchlist toggle failed", e);
    } finally {
      setWatchlistBusy(false);
    }
  };

  const posterSrc = (url: string | null) => (url && url !== "N/A" ? url : "/film-placeholder.svg");

  const goBack = () => {
    if (router.history.canGoBack()) {
      router.history.back();
    } else {
      router.navigate({ to: "/search" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="surface-card p-12 rounded-2xl text-center max-w-xl mx-auto">
            <div className="animate-shimmer h-8 w-48 rounded mx-auto mb-4" />
            <div className="animate-shimmer h-4 w-32 rounded mx-auto" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !data) {
    const isNotFound = /not found/i.test(error || "");
    return isNotFound ? (
      <ErrorScreen variant="not-found" code={404} path={`/film/${imdbId}`} />
    ) : (
      <ErrorScreen variant="error" code={500} />
    );
  }

  const { movie, community, stats } = data;
  const genres = (movie.genres || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const cast = (movie.actors || "")
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 md:py-10">
        <button
          onClick={goBack}
          className="inline-flex items-center gap-1.5 cursor-pointer bg-transparent border-none text-caption text-dust hover:text-brass transition-colors py-1 mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        {/* Hero Section */}
        <div className="flex flex-col gap-8 md:flex-row md:gap-10">
          <div className="shrink-0 flex justify-center md:block">
            <div className="aspect-2/3 w-48 sm:w-56 md:w-64 overflow-hidden rounded-xl bg-ink ring-2 ring-brass/30 shadow-2xl">
              <img
                src={posterSrc(movie.posterUrl)}
                alt={movie.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = "/film-placeholder.svg";
                }}
              />
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Clapperboard className="h-4 w-4 text-brass" />
                <p className="text-caption text-brass text-xs">The Jury Screening</p>
              </div>

              <h1 className="text-section text-paper font-bold">{movie.title}</h1>
              
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-dust text-xs">
                <span>{movie.year}</span>
                {formatRuntime(movie.runtime) && (
                  <>
                    <span>·</span>
                    <span>{formatRuntime(movie.runtime)}</span>
                  </>
                )}
                {movie.country && (
                  <>
                    <span>·</span>
                    <span>{movie.country.split(",")[0]}</span>
                  </>
                )}
              </div>

              {genres.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {genres.map((g) => (
                    <span
                      key={g}
                      className="rounded-full border border-brass/30 bg-brass/10 px-2.5 py-0.5 text-caption text-brass text-[0.65rem]"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {movie.director && (
                <p className="mt-4 text-sm text-paper/85">
                  <span className="text-caption text-dust text-xs">Directed by</span>{" "}
                  <span className="font-bold text-brass">{movie.director}</span>
                </p>
              )}

              {/* Status Meter */}
              {stats.status && (
                <div className="surface-card mt-6 p-4 rounded-xl inline-flex items-center gap-5 shadow-lg">
                  <Stamp
                    size="md"
                    rotation={-3}
                    variant={stats.status === "rotten" ? "red" : "brass"}
                    label={stats.status.toUpperCase()}
                  >
                    {stats.freshPercent}
                    <span className="text-lg align-top">%</span>
                  </Stamp>
                  <div className="flex flex-col gap-1 text-xs">
                    <span className="text-paper/90 font-medium">
                      {stats.total} total rating{stats.total !== 1 ? "s" : ""} ·{" "}
                      <span className="text-brass font-bold">{stats.average?.toFixed(1)}</span>/10 avg
                    </span>
                    <span className="text-dust mono text-[0.68rem]">
                      {stats.freshCount} fresh ({stats.freshPercent}% ≥ 7)
                    </span>
                  </div>
                </div>
              )}

              {movie.plot && (
                <p className="mt-5 max-w-2xl text-sm md:text-base leading-relaxed text-paper/80 font-serif">
                  {movie.plot}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-border/40">
              {user && (
                <button
                  onClick={toggleWatchlist}
                  disabled={watchlistBusy}
                  className={`min-h-[44px] inline-flex items-center gap-2 border px-5 py-2.5 text-caption text-xs font-bold rounded transition-all active:scale-95 cursor-pointer ${
                    watchlistEntryId
                      ? "border-brass bg-brass text-ink"
                      : "border-brass/60 bg-brass/10 text-brass hover:bg-brass hover:text-ink"
                  }`}
                >
                  {watchlistEntryId ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>On your watchlist</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="h-4 w-4" />
                      <span>Save to Watchlist</span>
                    </>
                  )}
                </button>
              )}

              {cast.length > 0 && (
                <div className="mt-6">
                  <p className="text-caption text-dust text-xs mb-2">Featured Cast</p>
                  <div className="flex flex-wrap gap-2">
                    {cast.map((actor) => (
                      <span
                        key={actor}
                        className="rounded border border-dust/25 bg-velvet/50 px-3 py-1 text-caption text-paper/85 text-xs"
                      >
                        {actor}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* The Print Section */}
        {(() => {
          const facts = [
            { label: "Rated", value: movie.rated },
            { label: "Released", value: movie.released },
            { label: "Language", value: movie.language },
            { label: "Box Office", value: movie.boxOffice },
            { label: "Production", value: movie.production },
            { label: "Writer", value: movie.writer },
            { label: "Awards", value: movie.awards },
            { label: "DVD", value: movie.dvd },
          ].filter((f) => f.value);

          if (facts.length === 0 && !movie.website) return null;

          return (
            <section className="hairline mt-12 pt-8">
              <div className="flex items-center gap-2 mb-4">
                <Film className="h-4 w-4 text-brass" />
                <h2 className="text-card-title text-paper">The Print (Technical Data)</h2>
              </div>
              
              <div className="surface-card p-5 rounded-xl">
                <dl className="grid grid-cols-1 gap-x-10 gap-y-3 sm:grid-cols-2">
                  {facts.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-baseline justify-between gap-4 border-b border-dust/10 pb-2 text-xs"
                    >
                      <dt className="text-caption text-dust uppercase tracking-wider shrink-0">{f.label}</dt>
                      <dd className="text-paper/90 font-mono text-right">{f.value}</dd>
                    </div>
                  ))}
                  {movie.website && (
                    <div className="flex items-baseline justify-between gap-4 border-b border-dust/10 pb-2 text-xs">
                      <dt className="text-caption text-dust uppercase tracking-wider shrink-0">Official Link</dt>
                      <dd className="text-right">
                        <a
                          href={movie.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brass hover:underline break-all"
                        >
                          <span>{movie.website.replace(/^https?:\/\//, "")}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </section>
          );
        })()}

        {/* Community Jury Ratings */}
        <section className="hairline mt-12 pt-8">
          <div className="flex items-center gap-2 mb-6">
            <Users className="h-4 w-4 text-brass" />
            <h2 className="text-card-title text-paper">
              Who logged it ({stats.total})
            </h2>
          </div>

          {community.length === 0 ? (
            <div className="surface-card p-10 rounded-xl text-center">
              <p className="text-sm text-dust">
                Nobody on Verdict has logged this film yet. Be the first jury member to rate it.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {community.map((c, i) => (
                <div
                  key={c.user?.id || i}
                  className="surface-card surface-card-hover p-4 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full ring-1 ring-brass/60">
                      <img
                        src={avatarUrlFor(c.user?.username || "anon", c.user?.avatarUrl)}
                        alt={c.user?.username || "anonymous"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      {c.user ? (
                        <Link
                          to="/profile/$username"
                          params={{ username: c.user.username }}
                          className="text-sm font-bold text-brass hover:underline truncate block"
                        >
                          @{c.user.username}
                        </Link>
                      ) : (
                        <span className="text-sm text-dust">Anonymous</span>
                      )}
                      {c.note && (
                        <p className="text-xs text-paper/80 mt-0.5 italic font-serif truncate">
                          "{c.note}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Stamp
                    size="xs"
                    rotation={c.rating % 2 === 0 ? 2 : -2}
                    variant={c.rating <= 4 ? "red" : "brass"}
                  >
                    {c.rating}
                  </Stamp>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
