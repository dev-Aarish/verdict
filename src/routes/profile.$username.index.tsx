import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { TasteMatchCard } from "@/components/TasteMatchCard";
import { GenreRadar } from "@/components/GenreRadar";
import { computeGenreDna } from "@/lib/genre-dna";
import { formatRuntime } from "@/lib/utils";
import {
  removeWatchedFn,
  addToWatchedFn,
  updateWatchedEntryFn,
  reorderWatchedFn,
} from "@/api/movies";
import { removeWatchlistFn } from "@/api/watchlist";
import { updateProfileFn, getUserProfileFn, type UserProfileData } from "@/api/users";
import { type TasteBreakdown } from "@/api/taste-score";
import { type TasteMatch } from "@/api/taste-match";
import { followUserFn, unfollowUserFn } from "@/api/follows";
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
import { AvatarPickerDialog } from "@/components/AvatarPickerDialog";
import { avatarUrlFor } from "@/lib/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowDown, ArrowUp, Pencil } from "lucide-react";

type ProfileSearch = {
  page?: number;
};

export const Route = createFileRoute("/profile/$username/")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const page = Number(search?.page);
    return page && page > 1 ? { page } : {};
  },
  loaderDeps: () => ({}),
  loader: async ({ params }) => {
    try {
      const data = await getUserProfileFn({ data: { username: params.username } });
      return { profileData: data, error: null };
    } catch (e: unknown) {
      return { profileData: null, error: e instanceof Error ? e.message : "Failed to load profile" };
    }
  },
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData() as { profileData: UserProfileData | null; error: string | null } | undefined;
  const initialData = loaderData?.profileData;
  const currentPage = search.page || 1;
  const { user, setUser } = useUser();
  const router = useRouter();
  const isOwn = user?.username === username;
  const [entries, setEntries] = useState<WatchedEntryWithMovie[] | null>(initialData?.entries ?? null);
  const [watchlist, setWatchlist] = useState<WatchlistEntryWithMovie[] | null>(initialData?.watchlist ?? null);
  const [profileUser, setProfileUser] = useState<User | null>(initialData?.user ?? null);
  const [tasteScore, setTasteScore] = useState<{ score: number; breakdown: TasteBreakdown } | null>(
    initialData?.tasteScore ?? null,
  );
  const [loading, setLoading] = useState(!initialData && !loaderData?.error);
  const [verdicts, setVerdicts] = useState<VerdictWithUser[] | null>(initialData?.verdicts ?? null);
  const [isFollowing, setIsFollowing] = useState(initialData?.isFollowing ?? false);
  const [followCounts, setFollowCounts] = useState<{ followers: number; following: number } | null>(
    initialData?.followCounts ?? null,
  );
  const [tasteMatch, setTasteMatch] = useState<TasteMatch | null>(initialData?.tasteMatch ?? null);
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
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  useEffect(() => {
    if (initialData) {
      setProfileUser(initialData.user);
      setEntries(initialData.entries);
      setWatchlist(initialData.watchlist);
      setTasteScore(initialData.tasteScore);
      setVerdicts(initialData.verdicts);
      setIsFollowing(initialData.isFollowing);
      setFollowCounts(initialData.followCounts);
      setTasteMatch(initialData.tasteMatch);
      setLoading(false);
      return;
    }

    setLoading(true);
    getUserProfileFn({ data: { username } })
      .then((data) => {
        setProfileUser(data.user);
        setEntries(data.entries);
        setWatchlist(data.watchlist);
        setTasteScore(data.tasteScore);
        setVerdicts(data.verdicts);
        setIsFollowing(data.isFollowing);
        setFollowCounts(data.followCounts);
        setTasteMatch(data.tasteMatch);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, initialData]);

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

  const handleSaveAvatar = async (avatarUrl: string | null) => {
    setAvatarSaving(true);
    setAvatarError(null);
    try {
      const result = await updateProfileFn({ data: { avatarUrl } });
      const newAvatar = result.user?.avatarUrl ?? null;
      setProfileUser((prev) => (prev ? { ...prev, avatarUrl: newAvatar } : prev));
      setUser(user ? { ...user, avatarUrl: newAvatar } : user);
      setAvatarOpen(false);
    } catch (e: unknown) {
      setAvatarError(e instanceof Error ? e.message : "Failed to save avatar");
    } finally {
      setAvatarSaving(false);
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
    navigate({ search: (prev: ProfileSearch) => ({ ...prev, page }) });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

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
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12">
        {/* Profile Header */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass ring-offset-4 ring-offset-ink md:h-28 md:w-28 shadow-xl">
              <img
                src={avatarUrlFor(profileUser.username, profileUser.avatarUrl)}
                alt={profileUser.username}
                className="h-full w-full object-cover"
              />
            </div>
            {isOwn && (
              <button
                onClick={() => setAvatarOpen(true)}
                aria-label="Change avatar"
                className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-brass bg-velvet text-brass transition-all hover:bg-brass hover:text-ink active:scale-95 shadow-lg"
              >
                <Pencil className="h-4 w-4" />
              </button>
            )}
          </div>

          <div>
            <h1 className="text-section text-paper font-bold tracking-tight">@{profileUser.username}</h1>
            
            {/* Bio / About */}
            <div className="mt-2 mx-auto flex max-w-md flex-col items-center gap-2">
              {editingAbout ? (
                <div className="w-full surface-card p-4 rounded-xl">
                  <textarea
                    value={aboutDraft}
                    onChange={(e) => setAboutDraft(e.target.value)}
                    maxLength={MAX_ABOUT_LENGTH}
                    rows={3}
                    placeholder="Tell people about your taste in film..."
                    autoFocus
                    className="w-full resize-none border border-dust/30 bg-ink/60 rounded-lg p-3 text-sm text-paper placeholder:text-dust/50 outline-none focus:border-brass"
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
                        className="cursor-pointer border border-dust/30 px-3 py-1.5 text-caption text-dust text-xs rounded transition-colors hover:text-paper"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveAbout}
                        disabled={aboutSaving}
                        className="cursor-pointer border border-brass bg-brass text-ink px-3.5 py-1.5 text-caption text-xs font-bold rounded transition-all hover:bg-brass/90 disabled:opacity-40"
                      >
                        {aboutSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : profileUser.bio ? (
                <div className="flex items-start justify-center gap-2 max-w-lg">
                  <p className="text-sm md:text-base text-paper/85 italic font-serif leading-relaxed">"{profileUser.bio}"</p>
                  {isOwn && (
                    <button
                      onClick={() => {
                        setAboutDraft(profileUser.bio || "");
                        setAboutError(null);
                        setEditingAbout(true);
                      }}
                      className="mt-0.5 shrink-0 cursor-pointer text-caption text-brass/70 text-xs transition-colors hover:text-brass"
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
                  className="cursor-pointer rounded-full border border-brass/30 bg-brass/10 px-3 py-1 text-caption text-brass text-xs transition-colors hover:bg-brass hover:text-ink"
                >
                  + Add bio
                </button>
              ) : null}
            </div>

            {/* Stat Pill Cluster */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="rounded-full border border-border/80 bg-velvet/60 px-3 py-1 mono text-dust">
                <span className="font-bold text-paper">{filmCount}</span> film{filmCount !== 1 ? "s" : ""}
              </span>
              {followCounts && (
                <>
                  <Link
                    to="/profile/$username/followers"
                    params={{ username }}
                    className="rounded-full border border-border/80 bg-velvet/60 px-3 py-1 mono text-dust hover:border-brass/50 hover:text-brass transition-colors"
                  >
                    <span className="font-bold text-paper">{followCounts.followers}</span> followers
                  </Link>
                  <Link
                    to="/profile/$username/following"
                    params={{ username }}
                    className="rounded-full border border-border/80 bg-velvet/60 px-3 py-1 mono text-dust hover:border-brass/50 hover:text-brass transition-colors"
                  >
                    <span className="font-bold text-paper">{followCounts.following}</span> following
                  </Link>
                </>
              )}
              {avgRating && (
                <span className="rounded-full border border-border/80 bg-velvet/60 px-3 py-1 mono text-dust">
                  Avg <span className="font-bold text-brass">{avgRating}</span>/10
                </span>
              )}
              {memberSince && (
                <span className="rounded-full border border-border/80 bg-velvet/60 px-3 py-1 mono text-dust/80">
                  Since {memberSince}
                </span>
              )}
            </div>

            {/* Profile Action Buttons */}
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              {!isOwn && user && (
                <button
                  onClick={handleFollowToggle}
                  className={`min-h-[40px] px-5 py-2 text-caption rounded transition-all cursor-pointer font-bold ${
                    isFollowing
                      ? "border border-dust/40 text-dust hover:border-marquee-red hover:text-marquee-red"
                      : "border border-brass bg-brass text-ink hover:bg-transparent hover:text-brass active:scale-95"
                  }`}
                >
                  {isFollowing ? "Following" : "+ Follow"}
                </button>
              )}

              {!isOwn && (
                <Link
                  to="/verdict/$username"
                  params={{ username }}
                  className="min-h-[40px] inline-flex items-center gap-2 border border-brass bg-brass/10 px-5 py-2 text-caption text-brass hover:bg-brass hover:text-ink rounded transition-all active:scale-95 font-bold"
                >
                  Stamp a Verdict →
                </Link>
              )}

              <Link
                to="/share/$username"
                params={{ username }}
                className="min-h-[40px] inline-flex items-center gap-2 border border-dust/40 px-4 py-2 text-caption text-dust hover:border-brass hover:text-brass rounded transition-all active:scale-95"
              >
                Share card ↗
              </Link>
            </div>
          </div>
        </div>

        {!isOwn && user && tasteMatch && <TasteMatchCard username={username} match={tasteMatch} />}

        {/* Bento Score & Genre DNA Section */}
        {dna && (
          <div className="surface-card mt-10 p-6 sm:p-8 rounded-2xl max-w-3xl mx-auto shadow-2xl">
            <div className="flex flex-col items-center justify-between gap-8 md:flex-row md:gap-10">
              {tasteScore && (
                <div className="flex flex-col items-center md:items-start gap-4">
                  <div>
                    <span className="text-caption text-brass text-xs">Taste Profile</span>
                    <h3 className="text-card-title text-paper mt-0.5">Overall Index</h3>
                  </div>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl md:text-6xl font-bold font-display text-brass leading-none">
                      {tasteScore.score}
                    </span>
                    <span className="mono text-xs text-dust">/ 100 PTS</span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 pt-2">
                    {(
                      [
                        { label: "Diversity", value: tasteScore.breakdown.diversity },
                        { label: "Obscurity", value: tasteScore.breakdown.obscurity },
                        { label: "Consistency", value: tasteScore.breakdown.consistency },
                      ] as const
                    ).map((item) => (
                      <div key={item.label} className="rounded-lg border border-dust/20 bg-ink/40 p-2.5 text-center">
                        <span className="mono text-base font-bold text-paper block">{item.value}</span>
                        <span className="text-[0.65rem] uppercase tracking-wider text-dust block mt-0.5">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center">
                <span className="text-caption mb-2 text-dust text-xs">Genre DNA Radar</span>
                <GenreRadar dna={dna} size={190} />
              </div>
            </div>
          </div>
        )}

        {/* Stamped Verdicts Section */}
        {verdicts && verdicts.length > 0 && (
          <section className="hairline mt-12 pt-8 max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <p className="text-caption text-brass text-xs">Jury Room</p>
              <h2 className="text-section text-paper">
                Stamped Verdicts ({verdicts.length})
              </h2>
            </div>

            <div className="space-y-3">
              {verdicts.map((v) => {
                if (!v.fromUser) return null;
                const isNegative = v.score <= 4;
                return (
                  <div
                    key={v.id}
                    className="surface-card surface-card-hover p-4 sm:p-5 rounded-xl flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <Link
                        to="/profile/$username"
                        params={{ username: v.fromUser.username }}
                        className="h-10 w-10 shrink-0 overflow-hidden rounded-full ring-1 ring-brass/60"
                      >
                        <img
                          src={avatarUrlFor(v.fromUser.username, v.fromUser.avatarUrl)}
                          alt={v.fromUser.username}
                          className="h-full w-full object-cover"
                        />
                      </Link>
                      <div className="min-w-0">
                        <Link
                          to="/profile/$username"
                          params={{ username: v.fromUser.username }}
                          className="text-sm font-bold text-brass hover:underline"
                        >
                          @{v.fromUser.username}
                        </Link>
                        {v.comment && (
                          <p className="text-sm text-paper/90 mt-0.5 italic font-serif">"{v.comment}"</p>
                        )}
                      </div>
                    </div>

                    <Stamp size="sm" rotation={2} variant={isNegative ? "red" : "brass"}>
                      {v.score}
                    </Stamp>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Watched Films Gallery */}
        <section className="hairline mt-12 pt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div>
              <p className="text-caption text-brass text-xs">Filmography</p>
              <h2 className="text-section text-paper">Watched Films ({filmCount})</h2>
            </div>

            <div className="flex items-center gap-3">
              {filmCount > 0 && (
                <div className="flex items-center gap-2 rounded-lg border border-border/80 bg-velvet/60 px-2.5 py-1">
                  <span className="text-caption text-dust text-[0.62rem]">
                    Sort
                  </span>
                  <select
                    data-testid="sort-select"
                    value={sortMode}
                    onChange={(e) => {
                      setSortMode(e.target.value as SortMode);
                      if (currentPage > 1) {
                        navigate({ search: (prev: ProfileSearch) => ({ ...prev, page: undefined }) });
                      }
                    }}
                    className="bg-transparent text-caption text-brass text-xs cursor-pointer outline-none font-mono"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value} className="bg-velvet text-paper">
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {isOwn && filmCount > 0 && (
                <Link
                  to="/search"
                  className="rounded-lg border border-brass/50 bg-brass/10 px-3 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-colors text-xs font-bold"
                >
                  + Add film
                </Link>
              )}
            </div>
          </div>

          {!entries || entries.length === 0 ? (
            <div className="surface-card p-12 rounded-2xl text-center">
              <p className="text-card-title text-paper mb-2">No films logged yet</p>
              <p className="text-sm text-dust mb-6">
                {isOwn
                  ? "Build your film history to calculate your Taste Score."
                  : `${username} hasn't logged any films yet.`}
              </p>
              {isOwn && (
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 border-2 border-brass bg-brass px-6 py-3 text-caption text-ink font-bold hover:bg-transparent hover:text-brass transition-colors rounded"
                >
                  Search & Log Films →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {paginatedEntries.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="surface-card surface-card-hover group relative flex flex-col p-2 rounded-lg" data-testid="watched-film">
                    <Link
                      to="/film/$imdbId"
                      params={{ imdbId: movie.imdbId }}
                      className="relative aspect-2/3 overflow-hidden rounded bg-ink ring-1 ring-white/5 block"
                    >
                      <img
                        src={posterSrc(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/film-placeholder.svg";
                        }}
                      />
                      <div className="absolute top-1.5 right-1.5 bg-velvet/90 border border-brass/60 rounded px-1.5 py-0.5 shadow-md">
                        <span className="mono text-[0.68rem] font-bold text-brass">
                          {entry.rating}/10
                        </span>
                      </div>
                    </Link>

                    <div className="mt-2.5 flex-1 px-1">
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbId }}
                        data-testid="film-title"
                        className="text-sm font-medium text-paper leading-snug line-clamp-2 hover:text-brass transition-colors"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-[0.68rem] mt-1">
                        {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
                      </p>
                      {movie.director && (
                        <p className="text-caption text-dust/80 text-[0.62rem] truncate mt-0.5">
                          {movie.director}
                        </p>
                      )}
                      {entry.note && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-[0.72rem] text-paper/80 font-serif italic mt-1.5 leading-tight line-clamp-2 cursor-help border-l border-brass/40 pl-1.5">
                                "{entry.note}"
                              </p>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs border border-white/15 bg-velvet px-3 py-2 text-paper shadow-xl rounded-lg">
                              <p className="text-xs leading-snug italic whitespace-pre-line">
                                {entry.note}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>

                    {isOwn && (
                      <div className="mt-2.5 flex gap-1 pt-1 border-t border-border/40">
                        {sortMode === "custom" && (
                          <div className="flex gap-0.5">
                            <button
                              onClick={() => handleMove(entry.id, "up")}
                              aria-label={`Move ${movie.title} up`}
                              className="p-1 rounded border border-dust/30 text-dust hover:text-brass hover:border-brass/60 transition-colors cursor-pointer"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMove(entry.id, "down")}
                              aria-label={`Move ${movie.title} down`}
                              className="p-1 rounded border border-dust/30 text-dust hover:text-brass hover:border-brass/60 transition-colors cursor-pointer"
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            setEditEntry(entry);
                            setEditRating([entry.rating]);
                            setEditNote(entry.note || "");
                            setEditError(null);
                          }}
                          className="flex-1 min-h-[30px] rounded border border-brass/50 text-brass text-[0.65rem] font-mono uppercase tracking-wider hover:bg-brass hover:text-ink transition-colors cursor-pointer"
                        >
                          Rate
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="min-h-[30px] px-2 rounded border border-marquee-red/40 text-marquee-red text-[0.65rem] font-mono uppercase tracking-wider hover:bg-marquee-red/10 transition-colors cursor-pointer">
                              Remove
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-velvet border-white/10 rounded-xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-paper font-display">
                                Remove film?
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-dust">
                                Remove "{movie.title}" from your watched list? This will update your Taste Score.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/10 text-paper bg-transparent hover:bg-white/5 rounded">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleRemove(entry.id)}
                                className="bg-marquee-red text-white hover:bg-marquee-red/80 rounded"
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
                className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 rounded"
              >
                Previous
              </button>
              <span className="text-caption text-dust text-xs font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="border border-dust/30 px-4 py-2 text-caption text-dust text-xs hover:text-paper transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 rounded"
              >
                Next
              </button>
            </div>
          )}
        </section>

        {/* Watchlist / "Worth Your Time" Section */}
        <section className="hairline mt-12 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-caption text-brass text-xs">The Queue</p>
              <h2 className="text-section text-paper">Worth Your Time</h2>
            </div>
            {isOwn && (watchlist?.length ?? 0) > 0 && (
              <Link
                to="/search"
                className="rounded-lg border border-brass/50 bg-brass/10 px-3 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-colors text-xs font-bold"
              >
                + Add film
              </Link>
            )}
          </div>

          {!watchlist || watchlist.length === 0 ? (
            <div className="surface-card p-10 rounded-2xl text-center">
              <p className="text-card-title text-paper mb-2">Queue is empty</p>
              <p className="text-sm text-dust mb-6">
                Films saved to watch for later appear in this screening list.
              </p>
              {isOwn && (
                <Link
                  to="/search"
                  className="inline-flex items-center gap-2 border border-brass bg-brass/10 px-6 py-2.5 text-caption text-brass hover:bg-brass hover:text-ink rounded transition-all active:scale-95 font-bold"
                >
                  Browse films to save →
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
              {watchlist.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="surface-card surface-card-hover group relative flex flex-col p-2 rounded-lg">
                    <Link
                      to="/film/$imdbId"
                      params={{ imdbId: movie.imdbId }}
                      className="relative aspect-2/3 overflow-hidden rounded bg-ink ring-1 ring-white/5 block"
                    >
                      <img
                        src={posterSrc(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = "/film-placeholder.svg";
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-caption text-brass font-bold text-xs bg-velvet/80 px-2.5 py-1 rounded border border-brass/40">
                          Queue
                        </span>
                      </div>
                    </Link>

                    <div className="mt-2.5 flex-1 px-1">
                      <Link
                        to="/film/$imdbId"
                        params={{ imdbId: movie.imdbId }}
                        className="text-sm font-medium text-paper leading-snug line-clamp-2 hover:text-brass transition-colors"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-[0.68rem] mt-1">
                        {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
                      </p>
                    </div>

                    {isOwn && (
                      <div className="mt-2.5 flex gap-1.5 pt-1 border-t border-border/40">
                        <button
                          onClick={() => {
                            setLogMovie(entry);
                            setLogRating([7]);
                            setLogNote("");
                            setLogError(null);
                          }}
                          className="flex-1 min-h-[32px] rounded border border-brass bg-brass text-ink text-[0.65rem] font-mono uppercase tracking-wider font-bold hover:bg-transparent hover:text-brass transition-colors cursor-pointer"
                        >
                          Log it
                        </button>
                        <button
                          onClick={() => handleWatchlistRemove(entry.id)}
                          className="min-h-[32px] px-2.5 rounded border border-marquee-red/40 text-marquee-red text-[0.65rem] font-mono uppercase tracking-wider hover:bg-marquee-red/10 transition-colors cursor-pointer"
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

      <AvatarPickerDialog
        open={avatarOpen}
        onOpenChange={setAvatarOpen}
        username={profileUser.username}
        currentAvatarUrl={profileUser.avatarUrl}
        onSave={handleSaveAvatar}
        saving={avatarSaving}
        error={avatarError}
      />
    </div>
  );
}
