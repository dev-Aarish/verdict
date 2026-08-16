import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { searchMoviesFn, addToWatchedFn, getCurrentUserWatchedFn } from "@/api/movies";
import { addToWatchlistFn, removeWatchlistFn, getCurrentUserWatchlistFn } from "@/api/watchlist";
import { searchUsersFn } from "@/api/users";
import { WatchedEntryDialog } from "@/components/WatchedEntryDialog";
import { useUser } from "@/lib/user-context";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search · Verdict" },
      { name: "description", content: "Search for films and people on Verdict." },
    ],
  }),
  component: SearchPage,
});

type Tab = "films" | "people";

interface SearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

interface UserResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  filmCount: number;
}

function SearchPage() {
  const { user } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("films");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [userResults, setUserResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [rating, setRating] = useState([7]);
  const [note, setNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [watchedMap, setWatchedMap] = useState<Record<string, number>>({});
  const [watchlistMap, setWatchlistMap] = useState<Record<string, string>>({});
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);
  const lastQueryRef = useRef("");

  useEffect(() => {
    if (!user) {
      setWatchedMap({});
      setWatchlistMap({});
      return;
    }
    getCurrentUserWatchedFn().then((data) => {
      const map: Record<string, number> = {};
      for (const entry of data.entries) {
        map[entry.imdbId] = entry.rating;
      }
      setWatchedMap(map);
    });
    getCurrentUserWatchlistFn().then((data) => {
      const map: Record<string, string> = {};
      for (const entry of data.entries) {
        if (entry.movie?.imdbId) map[entry.movie.imdbId] = entry.id;
      }
      setWatchlistMap(map);
    });
  }, [user]);

  const doSearch = useCallback(
    async (q: string, page: number) => {
      const id = ++requestIdRef.current;
      setLoading(true);
      setError(null);

      try {
        if (tab === "people") {
          const res = await searchUsersFn({ data: { query: q } });
          if (id !== requestIdRef.current) return;
          setUserResults(res.users);
          setResults([]);
        } else {
          const res = await searchMoviesFn({ data: { query: q, page } });
          if (id !== requestIdRef.current) return;
          if (res.error) {
            setResults([]);
            setTotalPages(0);
            setTotalResults(0);
            if (res.error === "Too many results.") {
              setError("Too many results. Try a more specific title.");
            }
          } else {
            setResults(res.results);
            setCurrentPage(res.page);
            setTotalPages(res.totalPages);
            setTotalResults(res.totalResults);
          }
        }
      } catch (e: unknown) {
        if (id !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : "Search failed");
        setResults([]);
        setUserResults([]);
      } finally {
        if (id === requestIdRef.current) setLoading(false);
      }
    },
    [tab],
  );

  const handleSearch = useCallback(
    (q: string) => {
      setQuery(q);
      setError(null);

      if (timerRef.current) clearTimeout(timerRef.current);

      const minChars = tab === "people" ? 1 : 3;

      if (q.length < minChars) {
        setResults([]);
        setUserResults([]);
        setTotalPages(0);
        setTotalResults(0);
        return;
      }

      lastQueryRef.current = q;
      timerRef.current = setTimeout(() => {
        doSearch(q, 1);
      }, 300);
    },
    [doSearch, tab],
  );

  const goToPage = useCallback(
    (page: number) => {
      const q = lastQueryRef.current;
      if (q.length < 3) return;
      doSearch(q, page);
    },
    [doSearch],
  );

  const handleAdd = async () => {
    if (!selectedMovie || !user) return;
    setAdding(true);
    setAddError(null);
    try {
      await addToWatchedFn({
        data: {
          imdbId: selectedMovie.imdbID,
          title: selectedMovie.Title,
          year: selectedMovie.Year,
          posterUrl: selectedMovie.Poster !== "N/A" ? selectedMovie.Poster : null,
          rating: rating[0],
          note: note.trim() || undefined,
        },
      });
      setAddedIds((prev) => new Set(prev).add(selectedMovie.imdbID));
      setWatchedMap((prev) => ({ ...prev, [selectedMovie.imdbID]: rating[0] }));
      setSelectedMovie(null);
      setRating([7]);
      setNote("");
      router.invalidate();
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : "Failed to add movie");
    } finally {
      setAdding(false);
    }
  };

  const toggleWatchlist = async (movie: SearchResult) => {
    if (!user) return;
    const imdbId = movie.imdbID;
    if (imdbId in watchlistMap) {
      await removeWatchlistFn({ data: { entryId: watchlistMap[imdbId] } });
      setWatchlistMap((prev) => {
        const next = { ...prev };
        delete next[imdbId];
        return next;
      });
    } else {
      await addToWatchlistFn({
        data: {
          imdbId: movie.imdbID,
          title: movie.Title,
          year: movie.Year,
          posterUrl: movie.Poster !== "N/A" ? movie.Poster : null,
        },
      });
      setWatchlistMap((prev) => ({ ...prev, [imdbId]: "pending" }));
    }
  };

  const posterSrc = (poster: string) =>
    poster && poster !== "N/A" ? poster : "/film-placeholder.svg";

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-12">
        <p className="text-caption mb-3">The Vault</p>
        <h1 className="text-section text-paper">Search</h1>

        <div className="mt-8 flex gap-6 border-b border-dust/20 pb-0">
          <button
            onClick={() => {
              setTab("films");
              setQuery("");
              setResults([]);
              setUserResults([]);
              setError(null);
            }}
            className={`pb-3 text-sm tracking-widest uppercase font-mono transition-colors cursor-pointer ${
              tab === "films"
                ? "text-brass border-b-2 border-brass"
                : "text-dust hover:text-paper border-b-2 border-transparent"
            }`}
          >
            Films
          </button>
          <button
            onClick={() => {
              setTab("people");
              setQuery("");
              setResults([]);
              setUserResults([]);
              setError(null);
            }}
            className={`pb-3 text-sm tracking-widest uppercase font-mono transition-colors cursor-pointer ${
              tab === "people"
                ? "text-brass border-b-2 border-brass"
                : "text-dust hover:text-paper border-b-2 border-transparent"
            }`}
          >
            People
          </button>
        </div>

        <div className="hairline mt-6 pb-6">
          <input
            type="text"
            placeholder={tab === "films" ? "Search by title..." : "Search by username..."}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border-0 border-b border-dust/30 bg-transparent py-3 text-lg text-paper placeholder-dust/50 outline-none transition-colors focus:border-brass font-display md:py-4 md:text-2xl"
            autoFocus
          />
        </div>

        {!user && tab === "films" && (
          <div className="mt-12 text-center">
            <p className="text-dust mb-4">Sign in to log films to your watched list.</p>
            <Link
              to="/login"
              className="border border-brass px-4 py-2 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
            >
              Sign in
            </Link>
          </div>
        )}

        <div className="mt-8 min-h-[200px]">
          {loading && <p className="text-caption text-dust text-center py-12">Searching...</p>}

          {error && <p className="text-caption text-marquee-red text-center py-12">{error}</p>}

          {!loading && !error && tab === "films" && query.length >= 3 && results.length === 0 && (
            <p className="text-caption text-dust text-center py-12">No films found.</p>
          )}

          {!loading &&
            !error &&
            tab === "people" &&
            query.length >= 1 &&
            userResults.length === 0 && (
              <p className="text-caption text-dust text-center py-12">No users found.</p>
            )}

          {!loading && tab === "films" && query.length < 3 && (
            <p className="text-caption text-dust text-center py-12">
              Type at least three characters to search.
            </p>
          )}

          {!loading && tab === "people" && query.length < 1 && (
            <p className="text-caption text-dust text-center py-12">Type a username to search.</p>
          )}

          {tab === "films" && results.length > 0 && (
            <>
              <p className="text-caption text-dust mb-4 text-xs">
                {totalResults > 0 && `${totalResults} film${totalResults > 1 ? "s" : ""} found`}
                {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
              </p>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                {results.map((movie) => {
                  const isAdded = addedIds.has(movie.imdbID) || movie.imdbID in watchedMap;
                  const existingRating = watchedMap[movie.imdbID];
                  return (
                    <div key={movie.imdbID} className="group flex flex-col" data-testid="search-result">
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbID }}
                        className="aspect-2/3 overflow-hidden bg-velvet ring-1 ring-white/5 block"
                      >
                        <img
                          src={posterSrc(movie.Poster)}
                          alt={movie.Title}
                          className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/film-placeholder.svg";
                          }}
                        />
                      </Link>
                      <div className="mt-2 flex-1">
                        <Link
                          to="/film/$imdbId"
                          params={{ imdbId: movie.imdbID }}
                          className="text-sm font-medium text-paper leading-tight hover:text-brass hover:underline transition-colors"
                        >
                          {movie.Title}
                        </Link>
                        <p className="text-caption text-dust text-xs">{movie.Year}</p>
                      </div>
                      {user && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => toggleWatchlist(movie)}
                            title={
                              movie.imdbID in watchlistMap
                                ? "Remove from watchlist"
                                : "Add to watchlist"
                            }
                            className={`flex-1 py-1.5 text-[0.6rem] tracking-widest uppercase font-mono transition-colors max-md:py-2.5 ${
                              movie.imdbID in watchlistMap
                                ? "bg-brass/15 text-brass border border-brass/40"
                                : "border border-dust/40 text-dust hover:border-brass/60 hover:text-brass cursor-pointer"
                            }`}
                          >
                            {movie.imdbID in watchlistMap ? "Saved" : "Watch"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMovie(movie);
                              setRating([7]);
                              setNote("");
                              setAddError(null);
                            }}
                            disabled={isAdded}
                            className={`flex-1 py-1.5 text-[0.6rem] tracking-widest uppercase font-mono transition-colors max-md:py-2.5 ${
                              isAdded
                                ? "bg-brass/20 text-brass/60 cursor-default"
                                : "border border-brass/50 text-brass hover:bg-brass hover:text-ink cursor-pointer"
                            }`}
                          >
                            {isAdded ? `${existingRating}/10` : "Log it"}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="mt-10 flex items-center justify-center gap-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-caption text-dust text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {tab === "people" && userResults.length > 0 && (
            <div className="space-y-3 max-md:space-y-0">
              {userResults.map((u) => (
                <Link
                  key={u.id}
                  to="/profile/$username"
                  params={{ username: u.username }}
                  className="flex items-center gap-4 border border-dust/20 p-4 hover:border-brass/50 transition-colors group max-md:border-x-0 max-md:border-t-0 max-md:border-b max-md:border-dust/10 max-md:px-0 max-md:py-3"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-velvet ring-1 ring-white/10">
                    <img
                      src={
                        u.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`
                      }
                      alt={u.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-paper group-hover:text-brass transition-colors">
                      {u.username}
                    </p>
                    {u.bio && (
                      <p className="text-caption text-dust text-xs truncate mt-0.5">{u.bio}</p>
                    )}
                  </div>
                  <div className="text-caption text-dust text-xs shrink-0">
                    {u.filmCount} film{u.filmCount !== 1 ? "s" : ""}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <WatchedEntryDialog
        open={!!selectedMovie}
        onOpenChange={(open) => !open && setSelectedMovie(null)}
        title={selectedMovie?.Title || ""}
        subtitle={`${selectedMovie?.Year || ""} · Rate your experience`}
        posterUrl={
          selectedMovie?.Poster
            ? selectedMovie.Poster !== "N/A"
              ? selectedMovie.Poster
              : null
            : null
        }
        posterAlt={selectedMovie?.Title || ""}
        rating={rating[0]}
        onRatingChange={(r) => setRating([r])}
        note={note}
        onNoteChange={setNote}
        error={addError}
        submitting={adding}
        submitLabel="Log it"
        submitBusyLabel="Adding..."
        onSubmit={handleAdd}
      />
    </div>
  );
}
