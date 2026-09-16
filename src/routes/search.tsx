import { createFileRoute, useRouter, Link } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { searchMoviesFn, addToWatchedFn, getCurrentUserWatchedFn } from "@/api/movies";
import { addToWatchlistFn, removeWatchlistFn, getCurrentUserWatchlistFn } from "@/api/watchlist";
import { searchUsersFn } from "@/api/users";
import { WatchedEntryDialog } from "@/components/WatchedEntryDialog";
import { useUser } from "@/lib/user-context";
import { dicebearAvatar } from "@/lib/avatar";
import { Search as SearchIcon, Film, Users, X, Bookmark, Plus, Check } from "lucide-react";

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

  const clearSearch = () => {
    setQuery("");
    setResults([]);
    setUserResults([]);
    setError(null);
  };

  const goToPage = useCallback(
    (page: number) => {
      const q = lastQueryRef.current;
      if (q.length < 3) return;
      doSearch(q, page);
      window.scrollTo({ top: 120, behavior: "smooth" });
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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        <div className="flex items-center gap-2 mb-2">
          <SearchIcon className="h-4 w-4 text-brass" />
          <p className="text-caption text-brass">The Vault</p>
        </div>
        <h1 className="text-section text-paper">Search & Discover</h1>

        {/* Tab switcher: Segmented pill style */}
        <div className="mt-6 flex rounded-lg border border-border/60 bg-velvet/50 p-1 w-fit">
          <button
            onClick={() => {
              setTab("films");
              clearSearch();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-caption text-xs rounded transition-all cursor-pointer ${
              tab === "films"
                ? "bg-brass text-ink font-bold shadow-sm"
                : "text-dust hover:text-paper"
            }`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Films</span>
          </button>
          <button
            onClick={() => {
              setTab("people");
              clearSearch();
            }}
            className={`inline-flex items-center gap-2 px-4 py-2 text-caption text-xs rounded transition-all cursor-pointer ${
              tab === "people"
                ? "bg-brass text-ink font-bold shadow-sm"
                : "text-dust hover:text-paper"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            <span>People</span>
          </button>
        </div>

        {/* Search Input Box */}
        <div className="relative mt-6">
          <input
            type="text"
            placeholder={
              tab === "films"
                ? "Search by title (e.g. Blade Runner, Parasite)..."
                : "Search by username (e.g. alice, bob)..."
            }
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border-b-2 border-dust/30 bg-transparent py-3 pr-10 text-lg sm:text-xl md:text-2xl text-paper placeholder:text-dust/40 outline-none transition-colors focus:border-brass font-display"
            autoFocus
          />
          {query.length > 0 && (
            <button
              onClick={clearSearch}
              aria-label="Clear search"
              className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-dust hover:text-paper transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {!user && tab === "films" && (
          <div className="mt-8 rounded-lg border border-brass/20 bg-velvet/30 p-4 text-center">
            <p className="text-sm text-dust">
              Sign in to log films to your watched history and receive your Taste Score.
            </p>
            <Link
              to="/login"
              className="mt-3 inline-block border border-brass px-4 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-colors text-xs"
            >
              Sign in →
            </Link>
          </div>
        )}

        <div className="mt-8 min-h-[260px]">
          {loading && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <div key={n} className="surface-card rounded-lg overflow-hidden p-2">
                  <div className="animate-shimmer aspect-2/3 w-full rounded" />
                  <div className="animate-shimmer h-4 w-3/4 rounded mt-2.5 mb-1.5" />
                  <div className="animate-shimmer h-3 w-1/3 rounded" />
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="surface-card p-8 rounded-xl text-center">
              <p className="text-caption text-marquee-red">{error}</p>
            </div>
          )}

          {!loading && !error && tab === "films" && query.length >= 3 && results.length === 0 && (
            <div className="surface-card p-10 rounded-xl text-center">
              <Film className="mx-auto h-8 w-8 text-dust/60 mb-2" />
              <p className="text-card-title text-paper">No films found</p>
              <p className="text-sm text-dust mt-1">Try checking for typos or searching for a different title.</p>
            </div>
          )}

          {!loading &&
            !error &&
            tab === "people" &&
            query.length >= 1 &&
            userResults.length === 0 && (
              <div className="surface-card p-10 rounded-xl text-center">
                <Users className="mx-auto h-8 w-8 text-dust/60 mb-2" />
                <p className="text-card-title text-paper">No users found</p>
                <p className="text-sm text-dust mt-1">Try searching for a different handle.</p>
              </div>
            )}

          {!loading && tab === "films" && query.length < 3 && (
            <div className="surface-card p-10 rounded-xl text-center">
              <Film className="mx-auto h-8 w-8 text-brass/40 mb-2" />
              <p className="text-caption text-dust">Type at least 3 characters to search the film vault.</p>
            </div>
          )}

          {!loading && tab === "people" && query.length < 1 && (
            <div className="surface-card p-10 rounded-xl text-center">
              <Users className="mx-auto h-8 w-8 text-brass/40 mb-2" />
              <p className="text-caption text-dust">Type a username to discover other critics.</p>
            </div>
          )}

          {/* Films Result Grid */}
          {tab === "films" && results.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-caption text-dust text-xs">
                  {totalResults > 0 && `${totalResults} film${totalResults > 1 ? "s" : ""} found`}
                  {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
                {results.map((movie) => {
                  const isAdded = addedIds.has(movie.imdbID) || movie.imdbID in watchedMap;
                  const existingRating = watchedMap[movie.imdbID];
                  const isInWatchlist = movie.imdbID in watchlistMap;

                  return (
                    <div
                      key={movie.imdbID}
                      className="surface-card surface-card-hover group flex flex-col p-2 rounded-lg"
                      data-testid="search-result"
                    >
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbID }}
                        className="relative aspect-2/3 overflow-hidden rounded bg-ink ring-1 ring-white/5 block"
                      >
                        <img
                          src={posterSrc(movie.Poster)}
                          alt={movie.Title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/film-placeholder.svg";
                          }}
                        />
                        {isAdded && (
                          <div className="absolute top-1.5 right-1.5 bg-velvet/90 border border-brass/60 rounded px-1.5 py-0.5 shadow-md">
                            <span className="mono text-[0.65rem] font-bold text-brass">
                              {existingRating}/10
                            </span>
                          </div>
                        )}
                      </Link>

                      <div className="mt-2.5 flex-1 px-1">
                        <Link
                          to="/film/$imdbId"
                          params={{ imdbId: movie.imdbID }}
                          className="text-sm font-medium text-paper leading-snug line-clamp-2 hover:text-brass transition-colors"
                        >
                          {movie.Title}
                        </Link>
                        <p className="text-caption text-dust text-[0.68rem] mt-1">{movie.Year}</p>
                      </div>

                      {user && (
                        <div className="mt-2.5 flex gap-1.5 pt-1">
                          <button
                            onClick={() => toggleWatchlist(movie)}
                            title={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
                            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1 rounded py-1 text-[0.65rem] font-mono uppercase tracking-wider transition-all active:scale-95 cursor-pointer ${
                              isInWatchlist
                                ? "bg-brass/20 text-brass border border-brass/50 font-bold"
                                : "border border-dust/30 text-dust hover:border-brass/60 hover:text-brass"
                            }`}
                          >
                            <Bookmark className="h-3 w-3" />
                            <span>{isInWatchlist ? "Saved" : "Watch"}</span>
                          </button>
                          
                          <button
                            onClick={() => {
                              setSelectedMovie(movie);
                              setRating([7]);
                              setNote("");
                              setAddError(null);
                            }}
                            disabled={isAdded}
                            className={`flex-1 min-h-[38px] flex items-center justify-center gap-1 rounded py-1 text-[0.65rem] font-mono uppercase tracking-wider transition-all active:scale-95 ${
                              isAdded
                                ? "bg-brass/10 text-brass/50 border border-brass/20 cursor-default"
                                : "border border-brass bg-brass text-ink font-bold hover:bg-transparent hover:text-brass cursor-pointer"
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Logged</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3 w-3" />
                                <span>Log it</span>
                              </>
                            )}
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
                    className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    Previous
                  </button>
                  <span className="text-caption text-dust text-xs">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}

          {/* People Results */}
          {tab === "people" && userResults.length > 0 && (
            <div className="space-y-3">
              {userResults.map((u) => (
                <Link
                  key={u.id}
                  to="/profile/$username"
                  params={{ username: u.username }}
                  className="surface-card surface-card-hover flex items-center gap-4 p-4 rounded-xl group transition-all"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ring-brass/60">
                    <img
                      src={u.avatarUrl || dicebearAvatar(u.username)}
                      alt={u.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-paper group-hover:text-brass transition-colors">
                      @{u.username}
                    </p>
                    {u.bio ? (
                      <p className="text-sm text-dust truncate mt-0.5">{u.bio}</p>
                    ) : (
                      <p className="text-caption text-dust/60 text-xs mt-0.5">Film patron</p>
                    )}
                  </div>
                  <div className="rounded-full border border-brass/30 bg-brass/10 px-3 py-1 text-caption text-brass text-xs shrink-0">
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
