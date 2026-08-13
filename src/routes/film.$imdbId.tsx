import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Stamp } from "@/components/Stamp";
import { getFilmFn } from "@/api/movies";
import { addToWatchlistFn, removeWatchlistFn, getCurrentUserWatchlistFn } from "@/api/watchlist";
import { useUser } from "@/lib/user-context";
import type { FilmPage } from "@/lib/types";

export const Route = createFileRoute("/film/$imdbId")({
  head: ({ params }) => ({
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

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-caption text-dust text-center py-24">Loading...</p>
        </main>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-caption text-marquee-red text-center py-24">
            {error || "Film not found."}
          </p>
        </main>
      </div>
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
      <main className="mx-auto max-w-6xl px-6 py-12">
        <Link to="/search" className="text-caption text-dust hover:text-brass transition-colors">
          ← Back to search
        </Link>

        <div className="mt-8 flex flex-col gap-10 md:flex-row">
          <div className="shrink-0">
            <div className="aspect-2/3 w-56 overflow-hidden bg-velvet ring-1 ring-white/5 sm:w-64">
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

          <div className="flex-1">
            <p className="text-caption text-dust">The Jury</p>
            <h1 className="text-section text-paper">{movie.title}</h1>
            <p className="text-caption text-dust mt-1">
              {movie.year}
              {genres.length > 0 && <> · {genres.join(" · ")}</>}
              {movie.country && <>, {movie.country.split(",")[0]}</>}
            </p>

            {movie.director && (
              <p className="mt-4 text-sm text-paper/80">
                <span className="text-caption text-dust">Directed by</span>{" "}
                <span className="text-brass">{movie.director}</span>
              </p>
            )}

            {stats.status && (
              <div className="mt-6 flex items-center gap-6">
                <Stamp
                  size="lg"
                  rotation={-3}
                  variant={stats.status === "rotten" ? "red" : "brass"}
                  label={stats.status.toUpperCase()}
                >
                  {stats.freshPercent}
                  <span className="text-2xl align-top">%</span>
                </Stamp>
                <div className="flex flex-col gap-1">
                  <span className="text-caption text-dust">
                    {stats.total} rating{stats.total !== 1 ? "s" : ""} ·{" "}
                    <span className="text-brass">{stats.average?.toFixed(1)}</span>/10 avg
                  </span>
                  <span className="text-caption text-dust">
                    {stats.freshCount} fresh ({stats.freshPercent}% ≥ 7)
                  </span>
                </div>
              </div>
            )}

            {movie.plot && (
              <p className="mt-6 max-w-2xl text-sm leading-relaxed text-paper/80">{movie.plot}</p>
            )}

            {user && (
              <button
                onClick={toggleWatchlist}
                disabled={watchlistBusy}
                className={`mt-8 border px-5 py-2 text-caption tracking-widest uppercase font-mono transition-colors disabled:opacity-50 cursor-pointer ${
                  watchlistEntryId
                    ? "border-brass/60 bg-brass/10 text-brass"
                    : "border-brass/50 text-brass hover:bg-brass hover:text-ink"
                }`}
              >
                {watchlistEntryId
                  ? "On your watchlist — remove"
                  : "Worth your time? Add to watchlist"}
              </button>
            )}

            {cast.length > 0 && (
              <div className="mt-6">
                <p className="text-caption text-dust mb-2">Cast</p>
                <div className="flex flex-wrap gap-2">
                  {cast.map((actor) => (
                    <span
                      key={actor}
                      className="border border-dust/30 px-3 py-1 text-caption text-paper/80 text-xs"
                    >
                      {actor}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <section className="hairline mt-12 pt-8">
          <h2 className="text-card-title text-paper mb-6">Who logged it ({stats.total})</h2>

          {community.length === 0 ? (
            <p className="text-caption text-dust text-center py-12">
              Nobody on Verdict has logged this film yet. Be the first jury member.
            </p>
          ) : (
            <div className="space-y-3">
              {community.map((c, i) => (
                <div
                  key={c.user?.id || i}
                  className="flex items-center justify-between gap-4 border border-dust/20 p-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-dust/20">
                      <img
                        src={
                          c.user?.avatarUrl ||
                          `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.user?.username || "anon"}`
                        }
                        alt={c.user?.username || "anonymous"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      {c.user ? (
                        <Link
                          to="/profile/$username"
                          params={{ username: c.user.username }}
                          className="text-sm font-medium text-brass hover:underline"
                        >
                          {c.user.username}
                        </Link>
                      ) : (
                        <span className="text-sm text-dust">Deleted user</span>
                      )}
                      {c.note && (
                        <p className="text-caption text-dust text-xs mt-0.5 italic truncate">
                          "{c.note}"
                        </p>
                      )}
                    </div>
                  </div>
                  <Stamp
                    size="sm"
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
