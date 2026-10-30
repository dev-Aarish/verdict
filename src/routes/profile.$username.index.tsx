import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { TasteMatchCard } from "@/components/TasteMatchCard";
import { GenreRadar } from "@/components/GenreRadar";
import { ScoreBreakdownModal } from "@/components/ScoreBreakdownModal";
import { computeGenreDna } from "@/lib/genre-dna";
import { formatRuntime } from "@/lib/utils";
import {
  removeWatchedFn,
  addToWatchedFn,
  updateWatchedEntryFn,
  reorderWatchedFn,
} from "@/api/movies";
import { removeWatchlistFn } from "@/api/watchlist";
import {
  getReceivedRecommendationsFn,
  acceptRecommendationFn,
  dismissRecommendationFn,
  markRecommendationViewedFn,
} from "@/api/recommendations";
import {
  setRecommendationUnreadCount,
  decrementRecommendationCount,
} from "@/lib/recommendations-store";
import { RecommendDialog } from "@/components/RecommendDialog";
import { toast } from "sonner";
import { updateProfileFn, getUserProfileFn, type UserProfileData } from "@/api/users";
import { ApiError } from "@/api/client";
import { type TasteBreakdown } from "@/api/taste-score";
import { type TasteMatch } from "@/api/taste-match";
import { followUserFn, unfollowUserFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type {
  User,
  WatchedEntryWithMovie,
  VerdictWithUser,
  WatchlistEntryWithMovie,
  RecommendationWithDetails,
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
import { ArrowDown, ArrowUp, Pencil, Info, Sparkles, Check, X as XIcon } from "lucide-react";

type SortMode = "custom" | "rating-desc" | "rating-asc" | "title-asc" | "recent";

type ProfileSearch = {
  page?: number;
  sort?: SortMode;
};

export const Route = createFileRoute("/profile/$username/")({
  validateSearch: (search: Record<string, unknown>): ProfileSearch => {
    const page = Number(search?.page);
    const validSorts: SortMode[] = ["custom", "rating-desc", "rating-asc", "title-asc", "recent"];
    const sort = validSorts.includes(search?.sort as SortMode) ? (search.sort as SortMode) : undefined;
    return {
      ...(page && page > 1 ? { page } : {}),
      ...(sort && sort !== "custom" ? { sort } : {}),
    };
  },
  staleTime: 30_000,
  gcTime: 1000 * 60 * 5,
  preloadStaleTime: 30_000,
  loaderDeps: () => ({}),
  loader: async ({ params }) => {
    try {
      const data = await getUserProfileFn({ data: { username: params.username } });
      return { profileData: data, error: null, errorStatus: null };
    } catch (e: unknown) {
      const status = e instanceof ApiError ? e.status : 0;
      const message = e instanceof Error ? e.message : "Failed to load profile";
      return { profileData: null, error: message, errorStatus: status };
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
  const loaderData = Route.useLoaderData() as { profileData: UserProfileData | null; error: string | null; errorStatus: number | null } | undefined;
  const initialData = loaderData?.profileData;
  const loaderIs404 = loaderData?.errorStatus === 404;
  const currentPage = search.page || 1;
  const sortMode: SortMode = search.sort ?? "custom";
  const { user, setUser } = useUser();
  const router = useRouter();
  const isOwn = user?.username === username;
  const [entries, setEntries] = useState<WatchedEntryWithMovie[] | null>(initialData?.entries ?? null);
  const [watchlist, setWatchlist] = useState<WatchlistEntryWithMovie[] | null>(initialData?.watchlist ?? null);
  const [profileUser, setProfileUser] = useState<User | null>(initialData?.user ?? null);
  const [tasteScore, setTasteScore] = useState<{ score: number; breakdown: TasteBreakdown } | null>(
    initialData?.tasteScore ?? null,
  );
  // Allow loading state for non-404 errors so client-side retry can attempt to recover
  const [loading, setLoading] = useState(!initialData && !loaderIs404);
  const [fetchError, setFetchError] = useState<string | null>(loaderIs404 ? null : (loaderData?.error ?? null));
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
  const [editingAbout, setEditingAbout] = useState(false);
  const [aboutDraft, setAboutDraft] = useState("");
  const [aboutSaving, setAboutSaving] = useState(false);
  const [aboutError, setAboutError] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarSaving, setAvatarSaving] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [recommendations, setRecommendations] = useState<RecommendationWithDetails[] | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [acceptedRecIds, setAcceptedRecIds] = useState<Set<string>>(new Set());
  const [dismissedRecIds, setDismissedRecIds] = useState<Set<string>>(new Set());
  const PAGE_SIZE = 20;

  // Keep local state in sync when loaderData updates (e.g. navigation or router.invalidate)
  const [syncedData, setSyncedData] = useState(initialData);
  if (initialData && initialData !== syncedData) {
    setSyncedData(initialData);
    setProfileUser(initialData.user);
    setEntries(initialData.entries);
    setWatchlist(initialData.watchlist);
    setTasteScore(initialData.tasteScore);
    setVerdicts(initialData.verdicts);
    setIsFollowing(initialData.isFollowing);
    setFollowCounts(initialData.followCounts);
    setTasteMatch(initialData.tasteMatch);
    setLoading(false);
  }

  useEffect(() => {
    // Only fetch client-side if initialData was not provided by loader.
    // For 404 errors (user genuinely not found), don't retry.
    // For other errors (network, 500, timeout), attempt client-side recovery.
    if (initialData || loaderIs404) return;

    setLoading(true);
    setFetchError(null);
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
        setFetchError(null);
      })
      .catch((e) => {
        const is404 = e instanceof ApiError && e.status === 404;
        setFetchError(is404 ? null : (e instanceof Error ? e.message : "Failed to load profile"));
        // For 404, profileUser stays null → shows not-found screen
      })
      .finally(() => setLoading(false));
  }, [username, initialData, loaderIs404]);

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
    // Optimistically remove from local state immediately
    const prevList = watchlist;
    setWatchlist((prev) => prev?.filter((e) => e.id !== entryId && e.movieId !== entryId) || []);

    try {
      await removeWatchlistFn({ data: { entryId } });
      toast.success("Removed from watchlist");
      router.invalidate();
    } catch (e: any) {
      // If the backend returns 404 (not found), it is already gone from the database.
      // Retain the optimistic removal rather than reverting.
      if (e?.status === 404 || e?.message?.includes("not found")) {
        router.invalidate();
        return;
      }
      console.error("Failed to remove from watchlist", e);
      toast.error(e?.message || "Failed to remove from watchlist");
      setWatchlist(prevList);
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

  useEffect(() => {
    if (!isOwn) return;
    setRecommendationsLoading(true);
    getReceivedRecommendationsFn({ status: "pending" })
      .then((res) => {
        // Only ever display pending recommendations
        const pendingOnly = (res.recommendations || []).filter((r) => r.status === "pending");
        setRecommendations(pendingOnly);
        if (typeof res.unreadCount === "number") {
          setRecommendationUnreadCount(res.unreadCount);
        }
      })
      .catch((err) => console.error("Failed to load recommendations", err))
      .finally(() => setRecommendationsLoading(false));
  }, [isOwn]);

  const handleMarkCheckedOut = async (rec: RecommendationWithDetails) => {
    if (rec.viewedAt) return;
    try {
      setRecommendations((prev) =>
        prev?.map((r) =>
          r.id === rec.id ? { ...r, viewedAt: new Date().toISOString() } : r,
        ) || null,
      );
      decrementRecommendationCount();
      await markRecommendationViewedFn({ id: rec.id });
      toast.success(`Checked out recommendation for "${rec.movie?.title}"`);
    } catch (err: any) {
      console.error("Failed to mark recommendation as viewed:", err);
    }
  };

  const handleAcceptRecommendation = async (rec: RecommendationWithDetails) => {
    try {
      // 1. Enter confirmation feedback phase
      setAcceptedRecIds((prev) => new Set(prev).add(rec.id));

      if (!rec.viewedAt) {
        decrementRecommendationCount();
      }

      // 2. Add to local watchlist queue immediately
      if (rec.movie) {
        setWatchlist((prev) => {
          if (!prev) {
            return [
              {
                id: rec.id,
                userId: user!.id,
                movieId: rec.movieId,
                addedAt: new Date(),
                movie: rec.movie,
              },
            ];
          }
          if (
            prev.some(
              (w) => w.movieId === rec.movieId || w.movie?.imdbId === rec.movie?.imdbId,
            )
          ) {
            return prev;
          }
          return [
            {
              id: rec.id,
              userId: user!.id,
              movieId: rec.movieId,
              addedAt: new Date(),
              movie: rec.movie,
            },
            ...prev,
          ];
        });
      }

      toast.success(`Added "${rec.movie?.title}" to your queue!`);

      // 3. Fire backend update and sync the real database watchlist entry id
      acceptRecommendationFn({ id: rec.id })
        .then((res) => {
          if (res?.watchlistEntry?.id) {
            setWatchlist((prev) =>
              prev?.map((item) =>
                item.movieId === rec.movieId || item.id === rec.id
                  ? { ...item, id: res.watchlistEntry!.id }
                  : item,
              ) || null,
            );
          }
        })
        .catch((err) => {
          console.error("Failed to accept recommendation on server:", err);
        });

      // 4. Give the user an intentional 700ms confirmation pause to register the action,
      // before initiating the slow, cinematic exit dissolve
      setTimeout(() => {
        setRecommendations((prev) => prev?.filter((r) => r.id !== rec.id) || null);
        setAcceptedRecIds((prev) => {
          const next = new Set(prev);
          next.delete(rec.id);
          return next;
        });
      }, 700);
    } catch (err: any) {
      toast.error(err?.message || "Failed to accept recommendation");
      setAcceptedRecIds((prev) => {
        const next = new Set(prev);
        next.delete(rec.id);
        return next;
      });
    }
  };

  const handleDismissRecommendation = async (recId: string) => {
    try {
      const rec = recommendations?.find((r) => r.id === recId);
      if (rec && !rec.viewedAt) {
        decrementRecommendationCount();
      }

      setDismissedRecIds((prev) => new Set(prev).add(recId));
      dismissRecommendationFn({ id: recId }).catch(() => {});

      // 400ms feedback before sliding away
      setTimeout(() => {
        setRecommendations((prev) => prev?.filter((r) => r.id !== recId) || null);
        setDismissedRecIds((prev) => {
          const next = new Set(prev);
          next.delete(recId);
          return next;
        });
      }, 400);

      toast.info("Recommendation passed");
    } catch (err: any) {
      toast.error(err?.message || "Failed to dismiss recommendation");
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

  const isPaginatingRef = useRef(false);

  const goToPage = useCallback((page: number) => {
    isPaginatingRef.current = true;
    navigate({
      search: (prev: ProfileSearch) => ({ ...prev, page }),
      resetScroll: false,
    });
    document.getElementById("watched-films-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [navigate]);

  useEffect(() => {
    if (isPaginatingRef.current) {
      isPaginatingRef.current = false;
      requestAnimationFrame(() => {
        document.getElementById("watched-films-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [currentPage]);

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
    // Transient error (network, 500, timeout) — show retry-able error screen
    if (fetchError) {
      return (
        <ErrorScreen
          variant="error"
          code={500}
          onRetry={() => {
            setLoading(true);
            setFetchError(null);
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
                setFetchError(null);
              })
              .catch((e) => {
                setFetchError(e instanceof Error ? e.message : "Failed to load profile");
              })
              .finally(() => setLoading(false));
          }}
        />
      );
    }
    // Genuine 404 — user doesn't exist
    return <ErrorScreen variant="not-found" code={404} path={`/profile/${username}`} />;
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-5 py-8 md:px-6 md:py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="h-20 w-20 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass md:h-24 md:w-24">
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
                className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border border-brass bg-velvet text-brass transition-colors hover:bg-brass hover:text-ink"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            )}
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
            <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-dust md:gap-4">
              <span>
                {filmCount} film{filmCount !== 1 ? "s" : ""}
              </span>
              {followCounts && (
                <>
                  <span className="hidden opacity-30 md:inline">·</span>
                  <Link
                    to="/profile/$username/followers"
                    params={{ username }}
                    className="hover:text-brass transition-colors"
                  >
                    {followCounts.followers} follower{followCounts.followers !== 1 ? "s" : ""}
                  </Link>
                  <span className="hidden opacity-30 md:inline">·</span>
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
                  <span className="hidden opacity-30 md:inline">·</span>
                  <span>
                    Avg <span className="text-brass">{avgRating}</span>/10
                  </span>
                </>
              )}
              {memberSince && (
                <>
                  <span className="hidden opacity-30 md:inline">·</span>
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
            <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:gap-14">
              {tasteScore && (
                <div className="flex flex-col items-center justify-center gap-3 md:flex-row md:gap-8">
                  <div className="flex flex-col items-center">
                    <span className="text-[2rem] font-bold text-brass leading-none md:text-[2.5rem]">
                      {tasteScore.score}
                    </span>
                    <span className="text-caption text-dust mt-1 whitespace-nowrap">Taste Score</span>
                  </div>
                  <div className="flex gap-5 md:gap-6">
                    {(
                      [
                        { label: "Diversity", value: tasteScore.breakdown.diversity },
                        { label: "Obscurity", value: tasteScore.breakdown.obscurity },
                        { label: "Consistency", value: tasteScore.breakdown.consistency },
                      ] as const
                    ).map((item) => (
                      <div key={item.label} className="flex flex-col items-center">
                        <span className="text-base font-semibold text-brass md:text-lg">{item.value}</span>
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
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowBreakdown(true)}
                className="group inline-flex items-center gap-1.5 text-xs text-dust hover:text-brass transition-colors focus:outline-none focus:ring-1 focus:ring-brass/50 rounded-sm px-2 py-1"
                aria-label="View score breakdown and parameter formulas"
              >
                <span>How are these calculated?</span>
                <Info className="h-3.5 w-3.5 text-dust group-hover:text-brass transition-colors" />
              </button>
            </div>
          </div>
        )}

        <ScoreBreakdownModal
          open={showBreakdown}
          onOpenChange={setShowBreakdown}
          tasteScore={tasteScore}
          dna={dna}
          username={username}
        />

        {!isOwn && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/verdict/$username"
              params={{ username }}
              className="border-2 border-brass px-6 py-3 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
            >
              Leave a Verdict →
            </Link>
            {user && (
              <button
                onClick={() => setShowRecommendModal(true)}
                className="border border-dust/30 px-6 py-3 text-caption text-dust hover:text-paper hover:border-dust/60 transition-colors flex items-center gap-2 cursor-pointer bg-velvet/30"
              >
                <Sparkles className="h-3.5 w-3.5 text-brass" />
                Recommend a Film
              </button>
            )}
          </div>
        )}

        {verdicts && verdicts.length > 0 && (
          <section className="hairline mt-10 pt-8 max-w-xl mx-auto">
            <h2 className="text-card-title text-paper mb-6 text-center">
              Verdicts ({verdicts.length})
            </h2>
            <div className="space-y-4 max-md:space-y-0">
              {verdicts.map((v) => {
                if (!v.fromUser) return null;
                return (
                  <div
                    key={v.id}
                    className="border border-dust/20 p-4 max-md:border-x-0 max-md:border-t-0 max-md:border-b max-md:border-dust/10 max-md:px-0 max-md:py-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-dust/20">
                          <img
                            src={avatarUrlFor(v.fromUser.username, v.fromUser.avatarUrl)}
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

        <section id="watched-films-section" className="hairline mt-10 pt-8 scroll-mt-20 md:scroll-mt-24">
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
                      const newSort = e.target.value as SortMode;
                      navigate({
                        search: (_prev: ProfileSearch) => ({
                          ...(newSort !== "custom" ? { sort: newSort } : {}),
                        }),
                        resetScroll: false,
                      });
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
              {paginatedEntries.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="active-scale group relative flex flex-col" data-testid="watched-film">
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
                        className="text-sm font-medium text-paper leading-tight hover:text-brass hover:underline transition-colors max-md:text-[13px]"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-xs">
                        {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
                        {" · "}
                        <span className="text-brass">{entry.rating}/10</span>
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
                              className="py-1 px-1.5 border border-dust/40 text-dust opacity-0 group-hover:opacity-100 transition-opacity hover:text-brass hover:border-brass/60 cursor-pointer max-md:opacity-100"
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => handleMove(entry.id, "down")}
                              aria-label={`Move ${movie.title} down`}
                              className="py-1 px-1.5 border border-dust/40 text-dust opacity-0 group-hover:opacity-100 transition-opacity hover:text-brass hover:border-brass/60 cursor-pointer max-md:opacity-100"
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
                          className="flex-1 py-1 border border-brass/50 text-brass text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brass hover:text-ink cursor-pointer max-md:py-2 max-md:opacity-100"
                        >
                          Rate
                        </button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="flex-1 py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer max-md:py-2 max-md:opacity-100">
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

        {isOwn && (
          <section className="hairline mt-10 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <h2 className="text-card-title text-paper">Recommended for You</h2>
                {recommendations &&
                  recommendations.filter((r) => !r.viewedAt).length > 0 && (
                    <span className="px-2 py-0.5 text-[0.65rem] font-mono uppercase bg-brass text-ink font-semibold rounded-full">
                      {recommendations.filter((r) => !r.viewedAt).length} new
                    </span>
                  )}
              </div>
            </div>

            {recommendationsLoading && (!recommendations || recommendations.length === 0) ? (
              <p className="text-caption text-dust text-center py-10">Checking recommendations...</p>
            ) : !recommendations || recommendations.length === 0 ? (
              <div className="text-center py-10">
                <p className="text-caption text-dust">
                  No active recommendations — films recommended by friends will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <AnimatePresence>
                {recommendations.map((rec) => {
                  const m = rec.movie;
                  if (!m) return null;
                  const isUnread = !rec.viewedAt;
                  const isAccepted = acceptedRecIds.has(rec.id);
                  const isDismissed = dismissedRecIds.has(rec.id);

                  return (
                    <motion.div
                      key={rec.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96, y: 12 }}
                      animate={
                        isAccepted
                          ? { opacity: 0.95, scale: 0.99, y: 0 }
                          : isDismissed
                            ? { opacity: 0.45, scale: 0.98, x: 8 }
                            : { opacity: 1, scale: 1, y: 0, x: 0 }
                      }
                      exit={
                        isAccepted
                          ? {
                              opacity: 0,
                              scale: 0.92,
                              y: 36,
                              filter: "blur(14px)",
                              transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                            }
                          : {
                              opacity: 0,
                              scale: 0.95,
                              x: 36,
                              filter: "blur(10px)",
                              transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
                            }
                      }
                      transition={{
                        layout: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
                        duration: 0.4,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      className={`flex flex-col justify-between border p-4 rounded overflow-hidden transition-all duration-500 ${
                        isAccepted
                          ? "border-brass/60 bg-velvet/80 shadow-[0_0_24px_rgba(212,168,83,0.18)] ring-1 ring-brass/30"
                          : isDismissed
                            ? "border-dust/10 bg-velvet/20 opacity-50"
                            : isUnread
                              ? "border-brass/35 bg-velvet/50"
                              : "border-dust/20 bg-velvet/40 hover:border-dust/40"
                      }`}
                    >
                      <div className="flex gap-4">
                        <Link
                          to="/film/$imdbId"
                          params={{ imdbId: m.imdbId }}
                          onClick={() => handleMarkCheckedOut(rec)}
                          className="w-16 sm:w-20 aspect-2/3 shrink-0 overflow-hidden rounded bg-black/40 ring-1 ring-white/10 block hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={posterSrc(m.posterUrl)}
                            alt={m.title}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/film-placeholder.svg";
                            }}
                          />
                        </Link>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              to="/film/$imdbId"
                              params={{ imdbId: m.imdbId }}
                              onClick={() => handleMarkCheckedOut(rec)}
                              className="text-sm font-medium text-paper hover:text-brass hover:underline truncate block"
                            >
                              {m.title}
                            </Link>
                            {isUnread && (
                              <span className="shrink-0 px-1.5 py-0.2 text-[0.6rem] font-mono uppercase bg-brass/20 text-brass border border-brass/40 rounded">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-caption text-dust text-xs">
                            {[m.year, formatRuntime(m.runtime)].filter(Boolean).join(" · ")}
                          </p>

                          {rec.fromUser && (
                            <div className="mt-2 flex items-center gap-2">
                              <img
                                src={avatarUrlFor(rec.fromUser.username, rec.fromUser.avatarUrl)}
                                alt={rec.fromUser.username}
                                className="h-5 w-5 rounded-full object-cover shrink-0"
                              />
                              <span className="text-caption text-dust text-xs">
                                from{" "}
                                <Link
                                  to="/profile/$username"
                                  params={{ username: rec.fromUser.username }}
                                  className="text-brass hover:underline font-medium"
                                >
                                  @{rec.fromUser.username}
                                </Link>
                              </span>
                            </div>
                          )}

                          {rec.note && (
                            <p className="mt-2 text-xs text-paper/80 italic bg-ink/40 p-2 rounded border border-dust/10">
                              "{rec.note}"
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-dust/10 flex items-center justify-between gap-2">
                        <div>
                          {isUnread ? (
                            <button
                              type="button"
                              onClick={() => handleMarkCheckedOut(rec)}
                              className="px-2.5 py-1 text-[0.65rem] font-mono uppercase tracking-wider text-brass/90 border border-brass/40 rounded hover:bg-brass hover:text-ink transition-colors cursor-pointer flex items-center gap-1"
                              title="Mark this recommendation as checked out"
                            >
                              <Check className="h-3 w-3" /> Checked out
                            </button>
                          ) : (
                            <span className="text-[0.65rem] font-mono uppercase tracking-wider text-dust/70 flex items-center gap-1">
                              <Check className="h-3 w-3 text-brass/70" /> Checked out
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={isAccepted || isDismissed}
                            onClick={() => handleDismissRecommendation(rec.id)}
                            className={`px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider transition-colors cursor-pointer disabled:cursor-not-allowed ${
                              isDismissed ? "text-dust/40 italic" : "text-dust hover:text-paper"
                            }`}
                          >
                            {isDismissed ? "Passed" : "Pass"}
                          </button>
                          <button
                            type="button"
                            disabled={isAccepted || isDismissed}
                            onClick={() => handleAcceptRecommendation(rec)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-[0.65rem] font-mono uppercase tracking-wider rounded font-semibold transition-all duration-300 cursor-pointer disabled:cursor-not-allowed ${
                              isAccepted
                                ? "bg-brass text-ink shadow-[0_0_12px_rgba(212,168,83,0.35)] scale-[1.02]"
                                : "bg-brass text-ink hover:bg-brass/90 active:scale-95"
                            }`}
                          >
                            <Check className={`h-3.5 w-3.5 transition-transform duration-300 ${isAccepted ? "scale-110" : ""}`} />
                            {isAccepted ? "Added to Queue" : "Add to Queue"}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
            )}
          </section>
        )}

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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
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
                        className="text-sm font-medium text-paper leading-tight hover:text-brass hover:underline transition-colors max-md:text-[13px]"
                      >
                        {movie.title}
                      </Link>
                      <p className="text-caption text-dust text-xs">
                        {[movie.year, formatRuntime(movie.runtime)].filter(Boolean).join(" · ")}
                      </p>
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
                          className="flex-1 py-1 border border-brass/50 text-brass text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brass hover:text-ink cursor-pointer max-md:py-2 max-md:opacity-100"
                        >
                          Log it
                        </button>
                        <button
                          onClick={() => handleWatchlistRemove(entry.id)}
                          className="flex-1 py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer max-md:py-2 max-md:opacity-100"
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

      {profileUser && (
        <RecommendDialog
          open={showRecommendModal}
          onOpenChange={setShowRecommendModal}
          targetUser={profileUser}
        />
      )}
    </div>
  );
}
