import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { getUserWatchedFn, removeWatchedFn } from "@/api/movies";
import { getTasteScoreFn, type TasteBreakdown } from "@/api/taste-score";
import { getUserVerdictsFn } from "@/api/verdicts";
import { followUserFn, unfollowUserFn, getFollowStatusFn, getFollowCountsFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useCallback, useEffect } from "react";
import type { User, WatchedEntryWithMovie, VerdictWithUser } from "@/lib/types";
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

export const Route = createFileRoute("/profile/$username")({
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

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useUser();
  const router = useRouter();
  const isOwn = user?.username === username;
  const [entries, setEntries] = useState<WatchedEntryWithMovie[] | null>(null);
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
  const PAGE_SIZE = 20;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUserWatchedFn({ data: { username } }),
      getTasteScoreFn({ data: { username } }).catch(() => null),
      getUserVerdictsFn({ data: { username } }).catch(() => ({ verdicts: [] })),
      getFollowStatusFn({ data: { username } }).catch(() => ({ isFollowing: false })),
      getFollowCountsFn({ data: { username } }).catch(() => null),
    ])
      .then(([data, taste, v, followStatus, counts]) => {
        setProfileUser(data.user);
        setEntries(data.entries);
        setTasteScore(taste);
        setVerdicts(v.verdicts);
        setIsFollowing(followStatus.isFollowing);
        setFollowCounts(counts);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username]);

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

  const totalPages = entries ? Math.ceil(entries.length / PAGE_SIZE) : 0;
  const paginatedEntries = entries
    ? entries.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
    : [];

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filmCount = entries?.length || 0;
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
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-caption text-dust text-center py-24">User not found.</p>
        </main>
      </div>
    );
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
            {profileUser.bio && (
              <p className="mt-2 text-sm text-paper/70 max-w-md">{profileUser.bio}</p>
            )}
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

        {tasteScore && (
          <div className="hairline mt-10 pt-8 w-full max-w-md mx-auto">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-[2.5rem] font-bold text-brass leading-none">
                  {tasteScore.score}
                </span>
                <span className="text-caption text-dust mt-1">Taste Score</span>
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
                    <span className="text-caption text-dust text-xs">{item.label}</span>
                  </div>
                ))}
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
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-card-title text-paper">Watched Films</h2>
            {isOwn && filmCount > 0 && (
              <Link
                to="/search"
                className="text-caption text-brass/70 hover:text-brass transition-colors"
              >
                + Add more
              </Link>
            )}
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
                  <div key={entry.id} className="group relative flex flex-col">
                    <div className="relative aspect-2/3 overflow-hidden bg-velvet ring-1 ring-white/5">
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
                    </div>
                    <div className="mt-2 flex-1">
                      <h3 className="text-sm font-medium text-paper leading-tight">
                        {movie.title}
                      </h3>
                      <p className="text-caption text-dust text-xs">
                        {movie.year} · <span className="text-brass">{entry.rating}/10</span>
                      </p>
                      {movie.director && (
                        <p className="text-caption text-dust text-[0.6rem] mt-0.5">
                          {movie.director}
                        </p>
                      )}
                    </div>
                    {isOwn && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="mt-1 w-full py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer">
                            Remove
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-velvet border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-paper">Remove film?</AlertDialogTitle>
                            <AlertDialogDescription className="text-dust">
                              Remove "{movie.title}" from your watched list? This cannot be undone.
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
      </main>
    </div>
  );
}
