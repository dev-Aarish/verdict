import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useCallback, useRef, useEffect } from "react";
import { TopBar } from "@/components/TopBar";
import { searchMoviesFn, addToWatchedFn, getCurrentUserWatchedFn } from "@/api/movies";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/user-context";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Search Movies · Verdict" },
      { name: "description", content: "Search for movies to add to your watched list." },
    ],
  }),
  component: SearchPage,
});

interface SearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

function SearchPage() {
  const { user } = useUser();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<SearchResult | null>(null);
  const [rating, setRating] = useState([7]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [watchedMap, setWatchedMap] = useState<Record<string, number>>({});
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
      return;
    }
    getCurrentUserWatchedFn().then((data) => {
      const map: Record<string, number> = {};
      for (const entry of data.entries) {
        map[entry.imdbId] = entry.rating;
      }
      setWatchedMap(map);
    });
  }, [user]);

  const doSearch = useCallback(async (q: string, page: number) => {
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    try {
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
    } catch (e: any) {
      if (id !== requestIdRef.current) return;
      setError(e.message || "Search failed");
      setResults([]);
    } finally {
      if (id === requestIdRef.current) setLoading(false);
    }
  }, []);

  const handleSearch = useCallback(
    async (q: string) => {
      setQuery(q);
      setError(null);

      if (timerRef.current) clearTimeout(timerRef.current);

      if (q.length < 3) {
        setResults([]);
        setTotalPages(0);
        setTotalResults(0);
        return;
      }

      lastQueryRef.current = q;
      timerRef.current = setTimeout(() => {
        doSearch(q, 1);
      }, 300);
    },
    [doSearch],
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
        },
      });
      setAddedIds((prev) => new Set(prev).add(selectedMovie.imdbID));
      setWatchedMap((prev) => ({ ...prev, [selectedMovie.imdbID]: rating[0] }));
      setSelectedMovie(null);
      setRating([7]);
      router.invalidate();
    } catch (e: any) {
      setAddError(e.message || "Failed to add movie");
    } finally {
      setAdding(false);
    }
  };

  const posterSrc = (poster: string) =>
    poster && poster !== "N/A" ? poster : "/film-placeholder.svg";

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-caption mb-3">The Vault</p>
        <h1 className="text-section text-paper">Search Films</h1>

        <div className="hairline mt-8 pb-6">
          <input
            type="text"
            placeholder="Search by title..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full border-0 border-b border-dust/30 bg-transparent py-4 text-2xl text-paper placeholder-dust/50 outline-none transition-colors focus:border-brass font-display"
            autoFocus
          />
        </div>

        {!user && (
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

          {!loading && !error && query.length >= 3 && results.length === 0 && (
            <p className="text-caption text-dust text-center py-12">No films found.</p>
          )}

          {!loading && query.length < 3 && (
            <p className="text-caption text-dust text-center py-12">
              Type at least three characters to search.
            </p>
          )}

          {results.length > 0 && (
            <>
              <p className="text-caption text-dust mb-4 text-xs">
                {totalResults > 0 && `${totalResults} film${totalResults > 1 ? "s" : ""} found`}
                {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
              </p>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {results.map((movie) => {
                  const isAdded = addedIds.has(movie.imdbID) || movie.imdbID in watchedMap;
                  const existingRating = watchedMap[movie.imdbID];
                  return (
                    <div key={movie.imdbID} className="group flex flex-col">
                      <div className="aspect-2/3 overflow-hidden bg-velvet ring-1 ring-white/5">
                        <img
                          src={posterSrc(movie.Poster)}
                          alt={movie.Title}
                          className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
                          loading="lazy"
                          onError={(e) => {
                            e.currentTarget.src = "/film-placeholder.svg";
                          }}
                        />
                      </div>
                      <div className="mt-2 flex-1">
                        <h3 className="text-sm font-medium text-paper leading-tight">
                          {movie.Title}
                        </h3>
                        <p className="text-caption text-dust text-xs">{movie.Year}</p>
                      </div>
                      {user && (
                        <button
                          onClick={() => {
                            setSelectedMovie(movie);
                            setRating([7]);
                            setAddError(null);
                          }}
                          disabled={isAdded}
                          className={`mt-2 w-full py-1.5 text-xs tracking-widest uppercase font-mono transition-colors ${
                            isAdded
                              ? "bg-brass/20 text-brass/60 cursor-default"
                              : "border border-brass/50 text-brass hover:bg-brass hover:text-ink cursor-pointer"
                          }`}
                        >
                          {isAdded ? `Logged · ${existingRating}/10` : "Log it"}
                        </button>
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
        </div>
      </main>

      <Dialog open={!!selectedMovie} onOpenChange={(open) => !open && setSelectedMovie(null)}>
        <DialogContent className="border border-dust/30 bg-velvet max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-card-title text-paper">{selectedMovie?.Title}</DialogTitle>
            <DialogDescription className="text-caption text-dust">
              {selectedMovie?.Year} · Rate your experience
            </DialogDescription>
          </DialogHeader>

          {selectedMovie && (
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="h-48 w-32 overflow-hidden bg-ink ring-1 ring-white/10">
                <img
                  src={posterSrc(selectedMovie.Poster)}
                  alt={selectedMovie.Title}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/film-placeholder.svg";
                  }}
                />
              </div>

              <div className="w-full max-w-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-caption text-dust text-xs">Your rating</span>
                  <span className="text-score text-brass text-4xl">{rating[0]}</span>
                </div>
                <Slider
                  value={rating}
                  onValueChange={(v) => setRating(v)}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[data-orientation=horizontal]]:h-2"
                />
                <div className="flex justify-between text-caption text-dust text-[0.6rem] mt-1">
                  <span>Miss</span>
                  <span>Masterpiece</span>
                </div>
              </div>

              {addError && <p className="text-caption text-marquee-red text-xs">{addError}</p>}

              <div className="flex gap-3 w-full">
                <DialogClose asChild>
                  <button className="flex-1 border border-dust/40 py-2 text-caption text-dust text-xs hover:text-paper transition-colors cursor-pointer">
                    Cancel
                  </button>
                </DialogClose>
                <button
                  onClick={handleAdd}
                  disabled={adding}
                  className="flex-1 bg-brass py-2 text-caption text-ink text-xs hover:bg-brass/90 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {adding ? "Adding..." : "Log it"}
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
