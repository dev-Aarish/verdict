import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { TasteMatchCard } from "@/components/TasteMatchCard";
import { GenreRadar } from "@/components/GenreRadar";
import { computeGenreDna } from "@/lib/genre-dna";
import {
  getUserWatchedFn,
  removeWatchedFn,
  addToWatchedFn,
  updateWatchedEntryFn,
  reorderWatchedFn,
} from "@/api/movies";
import { getUserWatchlistFn, removeWatchlistFn } from "@/api/watchlist";
import { updateProfileFn } from "@/api/users";
import { getTasteScoreFn, type TasteBreakdown } from "@/api/taste-score";
import { getTasteMatchFn, type TasteMatch } from "@/api/taste-match";
import { getUserVerdictsFn } from "@/api/verdicts";
import { followUserFn, unfollowUserFn, getFollowStatusFn, getFollowCountsFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  User,
  WatchedEntryWithMovie,
  VerdictWithUser,
  WatchlistEntryWithMovie,
} from "@/lib/types";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { WatchedEntryDialog } from "@/components/WatchedEntryDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp } from "lucide-react";

export const Route = createFileRoute("/profile/$username/")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username}'s profile · Verdict` },
      {
        name: "description",
        content: `Browse ${params.username}'s watched films, Taste Score, and film history.`,
      },
    ],
  }),
  component: ProfilePage,
});

type SortMode = "custom" | "rating-desc" | "rating-asc" | "title-asc" | "recent";

const MAX_ABOUT_LENGTH = 200;

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "custom", label: "Custom order" },
  { value: "rating-desc", label: "Rating: High → Low" },
  { value: "rating-asc", label: "Rating: Low → High" },
  { value: "title-asc", label: "Title A–Z" },
  { value: "recent", label: "Recently watched" },
];

function ProfilePage() {
  const { username } = Route.useParams();
  const { user, setUser } = useUser();
  const router = useRouter();
  const isOwn = user?.username === username;
  const [entries, setEntries] = useState<WatchedEntryWithMovie[] | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistEntryWithMovie[] | null>(null);
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [tasteScore, setTasteScore] = useState<{ score: number; breakdown: TasteBreakdown } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [verdicts, setVerdicts] = useState<VerdictWithUser[] | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(
    null,
  );
  const [tasteMatch, setTasteMatch] = useState<TasteMatch | null>(null);
  const [logMovie, setLogMovie] = useState<WatchlistEntryWithMovie | null>(null);
  const [logRating, setLogRating] = useState([7]);
  const [logNote, setLogNote] = useState("");
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState<string | null>(null);
  const [editEntry, setEditEntry] = useState<WatchedEntryWithMovie | null>(null);
  const [editRating, setEditRating] = useState([7]);
  const [editNote, setEditNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("custom");
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserWatchedFn({ data: { username } }),
      getUserWatchlistFn({ data: { username } }).catch(() => ({ entries: [] })),
      getTasteScoreFn({ data: { username } }).catch(() => null),
      getUserVerdictsFn({ data: { username } }).catch(() => ({ verdicts: [] })),
      getFollowStatusFn({ data: { username } }).catch(() => ({ isFollowing: false })),
      getFollowCountsFn({ data: { username } }).catch(() => null),
      getTasteMatchFn({ data: { username } }).catch(() => ({ match: null })),
    ])
      .then(([data, watch, taste, v, followStatus, counts, match]) => {
        setProfileUser(data.user);
        setEntries(data.entries);
        setWatchlist(watch.entries);
        setTasteScore(taste);
        setVerdicts(v.verdicts);
        setIsFollowing(followStatus.isFollowing);
        setFollowCounts(counts);
        setTasteMatch(match.match);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

  const handleSaveAbout = async () => {
    setAboutSaving(true);
    setAboutError(null);
    try {
      const result = await updateProfileFn({ data: { bio: aboutDraft } });
      const newBio = result.user?.bio ?? null;
      setProfileUser((prev) => (prev ? { ...prev, bio: newBio } : prev));
      setUser(user ? { ...user, bio: newBio } : user);
      setEditingAbout(false);
    } catch (e: unknown) {
      setAboutError(e instanceof Error ? e.message : "Failed to save About");
    } finally {
      setAboutSaving(false);
    }
  };

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await unfollowUserFn({ data: { username } });
        setIsFollowing(false);
        setFollowCounts((prev) =>
          prev ? { ...prev, followers: Math.max(0, prev.followers - 1) } : prev,
        );
      } else {
        await followUserFn({ data: { username } });
        setIsFollowing(true);
        setFollowCounts((prev) => (prev ? { ...prev, followers: prev.followers + 1 } : prev));
      }
    } catch (e) {
      console.error("Follow failed", e);
    }
  };

  const handleRemove = async (entryId: string) => {
    try {
      await removeWatchedFn({ data: { entryId } });
      setEntries((prev) => prev?.filter((e) => e.id !== entryId) || []);
      router.invalidate();
    } catch (e) {
      console.error("Failed to remove", e);
    }
  };

  const handleUpdateEntry = async () => {
    if (!editEntry) return;
    setEditing(true);
    setEditError(null);
    try {
      await updateWatchedEntryFn({
        data: {
          entryId: editEntry.id,
          rating: editRating[0],
          note: editNote.trim() === "" ? null : editNote.trim(),
        },
      });
      setEntries(
        (prev) =>
          prev?.map((e) =>
            e.id === editEntry.id
              ? {
                  ...e,
                  rating: editRating[0],
                  note: editNote.trim() === "" ? null : editNote.trim(),
                }
              : e,
          ) || [],
      );
      setEditEntry(null);
      setEditRating([7]);
      setEditNote("");
      router.invalidate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save changes";
      setEditError(msg);
    } finally {
      setEditing(false);
    }
  };

  const handleWatchlistRemove = async (entryId: string) => {
    try {
      await removeWatchlistFn({ data: { entryId } });
      setWatchlist((prev) => prev?.filter((e) => e.id !== entryId) || []);
      router.invalidate();
    } catch (e) {
      console.error("Failed to remove from watchlist", e);
    }
  };

  const handleLogFromWatchlist = async () => {
    if (!logMovie?.movie) return;
    const movie = logMovie.movie;
    setLogging(true);
    setLogError(null);
    try {
      await addToWatchedFn({
        data: {
          imdbId: movie.imdbId,
          title: movie.title,
          year: movie.year || "",
          posterUrl: movie.posterUrl,
          rating: logRating[0],
          note: logNote.trim() || undefined,
        },
      });
      // Once logged, it leaves the queue
      await removeWatchlistFn({ data: { entryId: logMovie.id } });
      setWatchlist((prev) => prev?.filter((e) => e.id !== logMovie.id) || []);
      setLogMovie(null);
      setLogRating([7]);
      setLogNote("");
      router.invalidate();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to log movie";
      if (msg.includes("already in watched")) {
        // Already watched — just clear it from the queue
        await removeWatchlistFn({ data: { entryId: logMovie.id } });
        setWatchlist((prev) => prev?.filter((e) => e.id !== logMovie.id) || []);
        setLogMovie(null);
        setLogRating([7]);
        setLogNote("");
        router.invalidate();
        return;
      }
      setLogError(msg);
    } finally {
      setLogging(false);
    }
  };

  const watchedTime = (e: WatchedEntryWithMovie) => {
    const t = e.watchedAt;
    if (!t) return 0;
    return new Date(typeof t === "number" ? t * 1000 : t).getTime() || 0;
  };

  const sortedEntries = useMemo(() => {
    if (!entries) return null;
    const arr = [...entries];
    switch (sortMode) {
      case "rating-desc":
        arr.sort((a, b) => b.rating - a.rating);
        break;
      case "rating-asc":
        arr.sort((a, b) => a.rating - b.rating);
        break;
      case "title-asc":
        arr.sort((a, b) => (a.movie?.title || "").localeCompare(b.movie?.title || ""));
        break;
      case "recent":
        arr.sort((a, b) => watchedTime(b) - watchedTime(a));
        break;
      default:
        break; // "custom": keep the server's position order
    }
    return arr;
  }, [entries, sortMode]);

  const totalPages = sortedEntries ? Math.ceil(sortedEntries.length / PAGE_SIZE) : 0;
  const paginatedEntries = sortedEntries
    ? sortedEntries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];

  const handleMove = async (entryId: string, direction: "up" | "down") => {
    if (!entries) return;
    const idx = entries.findIndex((e) => e.id === entryId);
    const target = direction === "up" ? idx - 1 : idx + 1;
    if (idx === -1 || target < 0 || target >= entries.length) return;
    const next = [...entries];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setEntries(next);
    try {
      await reorderWatchedFn({ data: { entryIds: next.map((e) => e.id) } });
      router.invalidate();
    } catch (e) {
      console.error("Failed to reorder", e);
    }
  };

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filmCount = entries?.length || 0;
  const dna = entries && entries.length > 0 ? computeGenreDna(entries) : null;
  const avgRating =
    entries && entries.length > 0
      ? (entries.reduce((sum, e) => sum + e.rating, 0) / entries.length).toFixed(1)
      : null;

  const memberSince = (() => {
    if (!profileUser?.createdAt) return null;
    const d = new Date(
      typeof profileUser.createdAt === "number"
        ? profileUser.createdAt * 1000
        : profileUser.createdAt,
    );
    return isNaN(d.getTime())
      ? null
      : d.toLocaleDateString("en-US", { year: "numeric", month: "short" });
  })();

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

  if (!profileUser) {
    return <ErrorScreen variant="not-found" code={404} path={`/profile/${username}`} />;
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
                alt={profileUser.username}
              />
            </div>
          </div>
          <div>
            <h1 className="text-section text-paper">{profileUser.username}</h1>
            <div className="mt-2 mx-auto flex max-w-md flex-col items-center gap-2">
              {editingAbout ? (
                <div className="w-full">
                  <textarea
                    value={aboutDraft}
                    onChange={(e) => setAboutDraft(e.target.value)}
                    maxLength={MAX_ABOUT_LENGTH}
                    rows={3}
                    placeholder="Tell people about your taste in film..."
                    autoFocus
                    className="w-full resize-none border border-dust/30 bg-transparent px-3 py-2 text-sm text-paper placeholder:text-dust/50 outline-none focus:border-brass/60"
                  />
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-caption text-dust text-xs">
                      {aboutDraft.length}/{MAX_ABOUT_LENGTH}
                    </span>
                    <div className="flex items-center gap-2">
                      {aboutError && (
                        <span className="text-caption text-marquee-red text-xs">{aboutError}</span>
                      )}
                      <button
                        onClick={() => setEditingAbout(false)}
                        className="cursor-pointer border border-dust/30 px-3 py-1 text-caption text-dust text-xs transition-colors hover:text-paper"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAbout}
                        disabled={aboutSaving}
                        className="cursor-pointer border border-brass px-3 py-1 text-caption text-brass text-xs transition-colors hover:bg-brass hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {aboutSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : profileUser.bio ? (
                <div className="flex items-start justify-center gap-2">
                  <p className="text-sm text-paper/70">{profileUser.bio}</p>
                  {isOwn && (
                    <button
                      onClick={() => {
                        setAboutDraft(profileUser.bio || "");
                        setAboutError(null);
                        setEditingAbout(true);
                      }}
                      className="mt-0.5 shrink-0 cursor-pointer text-caption text-brass/60 text-xs transition-colors hover:text-brass"
                    >
                      Edit
                    </button>
                  )}
                </div>
              ) : isOwn ? (
                <button
                  onClick={() => {
                    setAboutDraft("");
                    setAboutError(null);
                    setEditingAbout(true);
                  }}
                  className="cursor-pointer text-caption text-brass/60 text-xs transition-colors hover:text-brass"
                >
                  + Add about
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex items-center justify-center gap-4 text-caption text-dust">
              <span>
                {filmCount} film{filmCount !== 1 ? "s" : ""}
              </span>
              {followCounts && (
                <>
                  <span className="opacity-30">·</span>
                  <Link
                    to="/profile/$username/followers"
                    params={{ username }}
                    className="hover:text-brass transition-colors"
                  >
                    {followCounts.followers} follower{followCounts.followers !== 1 ? "s" : ""}
                  </Link>
                  <span className="opacity-30">·</span>
                  <Link
                    to="/profile/$username/following"
                    params={{ username }}
                    className="hover:text-brass transition-colors"
                  >
                    {followCounts.following} following
                  </Link>
                </>
              )}
              {avgRating && (
                <>
                  <span className="opacity-30">·</span>
                  <span>
                    Avg <span className="text-brass">{avgRating}</span>/10
                  </span>
                </>
              )}
              {memberSince && (
                <>
                  <span className="opacity-30">·</span>
                  <span>Since {memberSince}</span>
                </>
              )}
            </div>
            {!isOwn && user && (
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={handleFollowToggle}
                  className={`border px-5 py-2 text-caption transition-colors cursor-pointer ${
                    isFollowing
                      ? "border-dust/40 text-dust hover:border-marquee-red hover:text-marquee-red"
                      : "border-brass text-brass hover:bg-brass hover:text-ink"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <Link
                  to="/share/$username"
                  params={{ username }}
                  className="border border-dust/30 px-5 py-2 text-caption text-dust hover:border-brass hover:text-brass transition-colors"
                >
                  Share card →
                </Link>
              </div>
            )}
            {isOwn && (
              <div className="mt-4">
                <Link
                  to="/share/$username"
                  params={{ username }}
                  className="border border-dust/30 px-5 py-2 text-caption text-dust hover:border-brass hover:text-brass transition-colors"
                >
                  Share card →
                </Link>
              </div>
            )}
          </div>
        </div>

        {!isOwn && user && tasteMatch && <TasteMatchCard username={username} match={tasteMatch} />}

        {dna && (
          <div className="hairline mt-10 pt-8 w-full max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center gap-10 md:flex-row md:gap-14">
              {tasteScore && (
                <div className="flex items-center justify-center gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[2.5rem] font-bold text-brass leading-none">
                      {tasteScore.score}
                    </span>
                    <span className="text-caption text-dust mt-1 whitespace-nowrap">Taste Score</span>
                  </div>
                  <div className="flex gap-6">
                    {(
                      [
                        { label: "Diversity", value: tasteScore.breakdown.diversity },
                        { label: "Obscurity", value: tasteScore.breakdown.obscurity },
                        { label: "Consistency", value: tasteScore.breakdown.consistency },
                      ] as const
                    ).map((item) => (
                      <div key={item.label} className="flex flex-col items-center">
                        <span className="text-lg font-semibold text-brass">{item.value}</span>
                        <span className="text-caption text-dust text-xs whitespace-nowrap">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center">
                <span className="text-caption mb-3 text-dust whitespace-nowrap">Genre DNA</span>
                <GenreRadar dna={dna} size={190} />
              </div>
            </div>
          </div>
        )}

        {!isOwn && (
          <div className="mt-8 flex justify-center">
            <Link
              to="/verdict/$username"
              params={{ username }}
              className="border-2 border-brass px-6 py-3 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
            >
              Leave a Verdict →
            </Link>
          </div>
        )}

        {verdicts && verdicts.length > 0 && (
          <section className="hairline mt-10 pt-8 max-w-xl mx-auto">
            <h2 className="text-card-title text-paper mb-6 text-center">
              Verdicts ({verdicts.length})
            </h2>
            <div className="space-y-4">
              {verdicts.map((v) => {
                if (!v.fromUser) return null;
                return (
                  <div key={v.id} className="border border-dust/20 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-dust/20">
                          <img
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${v.fromUser.username}`}
                            alt={v.fromUser.username}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <Link
                            to="/profile/$username"
                            params={{ username: v.fromUser.username }}
                            className="text-sm font-medium text-brass hover:underline"
                          >
                            {v.fromUser.username}
                          </Link>
                          {v.comment && (
                            <p className="text-sm text-paper/80 mt-0.5 italic">"{v.comment}"</p>
                          )}
                        </div>
                      </div>
                      <Stamp size="sm" rotation={2} variant={v.score <= 4 ? "red" : "brass"}>
                        {v.score}
                      </Stamp>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="hairline mt-10 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <h2 className="text-card-title text-paper">Watched Films</h2>
            <div className="flex items-center gap-4">
              {filmCount > 0 && (
                <label className="flex items-center gap-2">
                  <span className="text-caption text-dust text-[0.6rem] tracking-widest uppercase font-mono">
                    Sort
                  </span>
                  <select
                    data-testid="sort-select"
                    value={sortMode}
                    onChange={(e) => {
                      setSortMode(e.target.value as SortMode);
                      setCurrentPage(1);
                    }}
                    className="bg-transparent border border-dust/30 px-2 py-1.5 text-caption text-brass text-xs cursor-pointer outline-none hover:border-brass/60"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-velvet text-paper">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {isOwn && filmCount > 0 && (
                <Link
                  to="/search"
                  className="text-caption text-brass/70 hover:text-brass transition-colors"
                >
                  + Add more
                </Link>
              )}
            </div>
          </div>

          {!entries || entries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-caption text-dust mb-6">No films logged yet.</p>
              {isOwn ? (
                <Link
                  to="/search"
                  className="border border-brass px-6 py-3 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
                >
                  Search for films →
                </Link>
              ) : (
                <p className="text-caption text-dust">{username} hasn't logged any films yet.</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {paginatedEntries.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="group relative flex flex-col" data-testid="watched-film">
                    <Link
                      to="/film/$imdbId"
                      params={{ imdbId: movie.imdbId }}
                      className="relative aspect-2/3 overflow-hidden bg-velvet ring-1 ring-white/5 block"
                    >
                      <img
                        src={posterSrc(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/film-placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Stamp size="sm" rotation={-2}>
                          {entry.rating}
                        </Stamp>
                      </div>
                    </Link>
                    <div className="mt-2 flex-1">
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbId }}
                        data-testid="film-title"
                        className="text-sm font-medium text-paper leading-tight hover:text-brass hover:underline transition-colors"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-xs">
                        {movie.year} · <span className="text-brass">{entry.rating}/10</span>
                      </p>
                      {movie.director && (
                        <p className="text-caption text-dust text-[0.6rem] mt-0.5">
                          {movie.director}
                        </p>
                      )}
                      {entry.note && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-caption text-paper/70 text-[0.6rem] italic mt-1 leading-snug line-clamp-2 cursor-help">
                                "{entry.note}"
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs border border-white/15 bg-velvet px-3 py-2 text-paper shadow-xl">
                              <p className="text-xs leading-snug italic whitespace-pre-line">
                                {entry.note}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    {isOwn && (
                      <div className="mt-1 flex gap-1">
                        {sortMode === "custom" && (
                          <>
                            <button
                              onClick={() => handleMove(entry.id, "up")}
                              aria-label={`Move ${movie.title} up`}
                              className="py-1 px-1.5 border border-dust/40 text-dust opacity-0 group-hover:opacity-100 transition-opacity hover:text-brass hover:border-brass/60 cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMove(entry.id, "down")}
                              aria-label={`Move ${movie.title} down`}
                              className="py-1 px-1.5 border border-dust/40 text-dust opacity-0 group-hover:opacity-100 transition-opacity hover:text-brass hover:border-brass/60 cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            setEditEntry(entry);
                            setEditRating([entry.rating]);
                            setEditNote(entry.note || "");
                            setEditError(null);
                          }}
                          className="flex-1 py-1 border border-brass/50 text-brass text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brass hover:text-ink cursor-pointer"
                        >
                          Rate
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="flex-1 py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer">
                              Remove
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-velvet border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-paper">
                                Remove film?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-dust">
                                Remove "{movie.title}" from your watched list? This cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 text-paper bg-transparent hover:bg-white/5">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemove(entry.id)}
                                className="bg-marquee-red text-white hover:bg-marquee-red/80"
                              >
                                Remove
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

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
                Page {currentPage} of {totalPages}
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
        </section>

        <section className="hairline mt-10 pt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-card-title text-paper">Worth Your Time</h2>
            {isOwn && (watchlist?.length ?? 0) > 0 && (
              <Link
                to="/search"
                className="text-caption text-brass/70 hover:text-brass transition-colors"
              >
                + Add more
              </Link>
            )}
          </div>

          {!watchlist || watchlist.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-caption text-dust mb-6">
                Nothing on the queue — films saved to watch for later.
              </p>
              {isOwn && (
                <Link
                  to="/search"
                  className="border border-brass px-6 py-3 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
                >
                  Browse films to save →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {watchlist.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="group relative flex flex-col">
                    <Link
                      to="/film/$imdbId"
                      params={{ imdbId: movie.imdbId }}
                      className="relative aspect-2/3 overflow-hidden bg-velvet ring-1 ring-white/5 block"
                    >
                      <img
                        src={posterSrc(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/film-placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-caption text-paper tracking-widest uppercase font-mono text-xs">
                          Queue
                        </span>
                      </div>
                    </Link>
                    <div className="mt-2 flex-1">
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbId }}
                        className="text-sm font-medium text-paper leading-tight hover:text-brass hover:underline transition-colors"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-xs">{movie.year}</p>
                    </div>
                    {isOwn && (
                      <div className="mt-1 flex gap-1">
                        <button
                          onClick={() => {
                            setLogMovie(entry);
                            setLogRating([7]);
                            setLogNote("");
                            setLogError(null);
                          }}
                          className="flex-1 py-1 border border-brass/50 text-brass text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brass hover:text-ink cursor-pointer"
                        >
                          Log it
                        </button>
                        <button
                          onClick={() => handleWatchlistRemove(entry.id)}
                          className="flex-1 py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <WatchedEntryDialog
        open={!!logMovie}
        onOpenChange={(open) => !open && setLogMovie(null)}
        title={logMovie?.movie?.title || ""}
        subtitle={`${logMovie?.movie?.year || ""} · Log it to your watched list`}
        posterUrl={logMovie?.movie?.posterUrl ?? null}
        posterAlt={logMovie?.movie?.title || ""}
        rating={logRating[0]}
        onRatingChange={(r) => setLogRating([r])}
        note={logNote}
        onNoteChange={setLogNote}
        error={logError}
        submitting={logging}
        submitLabel="Log it"
        submitBusyLabel="Logging..."
        onSubmit={handleLogFromWatchlist}
      />

      <WatchedEntryDialog
        open={!!editEntry}
        onOpenChange={(open) => !open && setEditEntry(null)}
        title={editEntry?.movie?.title || ""}
        subtitle={`${editEntry?.movie?.year || ""} · Update your rating and note`}
        posterUrl={editEntry?.movie?.posterUrl ?? null}
        posterAlt={editEntry?.movie?.title || ""}
        rating={editRating[0]}
        onRatingChange={(r) => setEditRating([r])}
        note={editNote}
        onNoteChange={setEditNote}
        error={editError}
        submitting={editing}
        submitLabel="Update"
        submitBusyLabel="Saving..."
        onSubmit={handleUpdateEntry}
      />
    </div>
  );
}
