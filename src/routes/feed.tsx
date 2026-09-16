import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { getFeedVerdictsFn, getLeaderboardFn } from "@/api/feed";
import { followUserFn, unfollowUserFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { VerdictWithUser, LeaderboardRow } from "@/lib/types";
import { Trophy, Film, Users, Sparkles, ArrowRight } from "lucide-react";
import { avatarUrlFor } from "@/lib/avatar";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "The Reel — Recent Verdicts · Verdict" },
      { name: "description", content: "Recent Verdicts and the Taste Score leaderboard." },
    ],
  }),
  component: FeedPage,
});

function FeedPage() {
  const { user } = useUser();
  const [filter, setFilter] = useState<"following" | "all">(user ? "following" : "all");
  const [verdicts, setVerdicts] = useState<VerdictWithUser[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingState, setFollowingState] = useState<Record<string, boolean>>({});

  const fetchVerdicts = useCallback(() => {
    setLoading(true);
    getFeedVerdictsFn({ data: { limit: 50, filter } })
      .then((v) => {
        setVerdicts(v.verdicts);
        const init: Record<string, boolean> = {};
        v.verdicts.forEach((verdict: VerdictWithUser) => {
          if (verdict.fromUser) init[verdict.fromUser.username] = false;
          if (verdict.toUser) init[verdict.toUser.username] = false;
        });
        setFollowingState((prev) => ({ ...init, ...prev }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => {
    fetchVerdicts();
  }, [fetchVerdicts]);

  useEffect(() => {
    getLeaderboardFn()
      .then(setLeaderboard)
      .catch(() => {});
  }, []);

  const handleFollowToggle = async (username: string) => {
    const isCurrentlyFollowing = followingState[username];
    try {
      if (isCurrentlyFollowing) {
        await unfollowUserFn({ data: { username } });
      } else {
        await followUserFn({ data: { username } });
      }
      setFollowingState((prev) => ({ ...prev, [username]: !isCurrentlyFollowing }));
    } catch (e) {
      console.error("Follow toggle failed", e);
    }
  };

  const timeAgo = (d: Date | number | null | undefined) => {
    if (!d) return "";
    try {
      return formatDistanceToNow(new Date(d), { addSuffix: true });
    } catch {
      return "";
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-8 sm:px-6 md:grid-cols-[1.4fr_1fr] md:gap-14 md:py-14">
        {/* Main Feed */}
        <section>
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-center gap-2">
              <Film className="h-4 w-4 text-brass" />
              <p className="text-caption text-brass">The Reel</p>
            </div>
            <h1 className="text-section text-paper">Recent Verdicts</h1>
          </div>

          {user && (
            <div className="mt-6 flex rounded-lg border border-border/60 bg-velvet/50 p-1 w-fit">
              <button
                onClick={() => setFilter("following")}
                className={`px-4 py-1.5 text-caption text-xs rounded transition-all cursor-pointer ${
                  filter === "following"
                    ? "bg-brass text-ink font-bold shadow-sm"
                    : "text-dust hover:text-paper"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-1.5 text-caption text-xs rounded transition-all cursor-pointer ${
                  filter === "all"
                    ? "bg-brass text-ink font-bold shadow-sm"
                    : "text-dust hover:text-paper"
                }`}
              >
                Global
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-8 space-y-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="surface-card p-5 rounded-lg">
                  <div className="animate-shimmer h-4 w-28 rounded mb-3" />
                  <div className="animate-shimmer h-6 w-3/4 rounded mb-3" />
                  <div className="animate-shimmer h-3 w-40 rounded" />
                </div>
              ))}
            </div>
          ) : filter === "following" && verdicts.length === 0 ? (
            <div className="surface-card mt-8 p-8 text-center rounded-xl">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brass/10 text-brass">
                <Users className="h-6 w-6" />
              </div>
              <p className="text-card-title text-paper">No verdicts from following yet</p>
              <p className="text-sm text-dust mt-2 mb-6 max-w-sm mx-auto">
                Follow fellow film enthusiasts to see their latest verdicts stamped here in real-time.
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 border border-brass bg-brass/10 px-5 py-2.5 text-caption text-brass hover:bg-brass hover:text-ink transition-all active:scale-95"
              >
                <span>Find people to follow</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : verdicts.length === 0 ? (
            <div className="surface-card mt-8 p-8 text-center rounded-xl">
              <Sparkles className="mx-auto h-8 w-8 text-brass mb-3" />
              <p className="text-card-title text-paper">No verdicts recorded yet</p>
              <p className="text-sm text-dust mt-2">
                Be the first patron to stamp your judgment on someone's taste!
              </p>
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {verdicts.map((v, i) => {
                const isNegative = v.score < 5;
                return (
                  <li
                    key={v.id}
                    className="surface-card surface-card-hover relative p-4 sm:p-5 rounded-lg flex flex-col gap-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {v.fromUser && (
                          <Link
                            to="/profile/$username"
                            params={{ username: v.fromUser.username }}
                            className="h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-brass/60"
                          >
                            <img
                              src={avatarUrlFor(v.fromUser.username, v.fromUser.avatarUrl)}
                              alt={v.fromUser.username}
                              className="h-full w-full object-cover"
                            />
                          </Link>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs text-paper/90">
                            {v.fromUser && (
                              <Link
                                to="/profile/$username"
                                params={{ username: v.fromUser.username }}
                                className="font-bold text-brass hover:underline"
                              >
                                @{v.fromUser.username}
                              </Link>
                            )}
                            <span className="text-dust/70 mx-1.5">judged</span>
                            {v.toUser && (
                              <Link
                                to="/profile/$username"
                                params={{ username: v.toUser.username }}
                                className="font-bold text-paper hover:text-brass hover:underline"
                              >
                                @{v.toUser.username}
                              </Link>
                            )}
                          </p>
                          <span className="mono text-[0.68rem] text-dust">{timeAgo(v.createdAt)}</span>
                        </div>
                      </div>

                      <Stamp
                        size="sm"
                        rotation={((i * 13) % 7) - 3}
                        variant={isNegative ? "red" : "brass"}
                      >
                        {v.score}
                      </Stamp>
                    </div>

                    <p className="text-sm md:text-base font-serif italic text-paper/95 pl-1 border-l-2 border-brass/40 py-0.5">
                      "{v.comment}"
                    </p>

                    {user && v.fromUser && v.fromUser.username !== user.username && (
                      <div className="flex justify-end pt-1">
                        <button
                          onClick={() => v.fromUser && handleFollowToggle(v.fromUser.username)}
                          className={`px-3 py-1 text-caption text-[0.65rem] rounded transition-all cursor-pointer border ${
                            followingState[v.fromUser.username]
                              ? "border-dust/40 text-dust hover:border-marquee-red hover:text-marquee-red"
                              : "border-brass/60 text-brass hover:bg-brass hover:text-ink active:scale-95"
                          }`}
                        >
                          {followingState[v.fromUser.username] ? "Following" : "+ Follow"}
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Leaderboard Sidebar */}
        <aside>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-4 w-4 text-brass" />
            <p className="text-caption text-brass">Standing</p>
          </div>
          <h2 className="text-section text-paper">Leaderboard</h2>

          {loading ? (
            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="animate-shimmer h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : leaderboard.length === 0 ? (
            <p className="text-caption text-dust mt-6">No scores computed yet.</p>
          ) : (
            <div className="surface-card mt-6 divide-y divide-border/30 rounded-xl overflow-hidden">
              {leaderboard
                .filter((row) => row.user)
                .map((row) => {
                  const isGold = row.rank === 1;
                  const isSilver = row.rank === 2;
                  const isBronze = row.rank === 3;
                  return (
                    <div
                      key={row.rank}
                      className={`flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.02] ${
                        isGold ? "bg-brass/5" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`mono text-xs font-bold w-6 text-center ${
                            isGold
                              ? "text-brass font-extrabold"
                              : isSilver
                              ? "text-paper"
                              : isBronze
                              ? "text-dust"
                              : "text-dust/60"
                          }`}
                        >
                          {String(row.rank).padStart(2, "0")}
                        </span>
                        
                        <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-border">
                          <img
                            src={avatarUrlFor(row.user!.username, row.user!.avatarUrl)}
                            alt={row.user!.username}
                            className="h-full w-full object-cover"
                          />
                        </div>

                        <Link
                          to="/profile/$username"
                          params={{ username: row.user!.username }}
                          className="text-sm font-medium text-paper truncate hover:text-brass transition-colors"
                        >
                          {row.user!.username}
                        </Link>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="mono text-sm font-bold text-brass">{row.score}</span>
                        <span className="text-[0.65rem] text-dust">pts</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
