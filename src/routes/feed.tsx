import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { getFeedVerdictsFn, getLeaderboardFn } from "@/api/feed";
import { followUserFn, unfollowUserFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import type { VerdictWithUser, LeaderboardRow } from "@/lib/types";

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

      <main className="mx-auto grid max-w-5xl gap-16 px-6 py-16 md:grid-cols-[1.4fr_1fr]">
        <section>
          <p className="text-caption mb-3">The Reel</p>
          <h1 className="text-section text-paper">Recent Verdicts</h1>

          {user && (
            <div className="mt-6 flex gap-1">
              <button
                onClick={() => setFilter("following")}
                className={`px-4 py-2 text-caption transition-colors cursor-pointer border ${
                  filter === "following"
                    ? "border-brass text-brass bg-brass/10"
                    : "border-dust/30 text-dust hover:text-paper"
                }`}
              >
                Following
              </button>
              <button
                onClick={() => setFilter("all")}
                className={`px-4 py-2 text-caption transition-colors cursor-pointer border ${
                  filter === "all"
                    ? "border-brass text-brass bg-brass/10"
                    : "border-dust/30 text-dust hover:text-paper"
                }`}
              >
                All
              </button>
            </div>
          )}

          {loading ? (
            <p className="text-caption text-dust mt-10">Loading...</p>
          ) : filter === "following" && verdicts.length === 0 ? (
            <div className="mt-10 text-center">
              <p className="text-caption text-dust mb-4">No verdicts from people you follow yet.</p>
              <Link
                to="/search"
                className="border border-brass px-5 py-2 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
              >
                Find people to follow →
              </Link>
            </div>
          ) : verdicts.length === 0 ? (
            <p className="text-caption text-dust mt-10">
              No verdicts yet. Be the first to stamp your judgment.
            </p>
          ) : (
            <ul className="hairline mt-6 divide-y divide-border/40">
              {verdicts.map((v, i) => (
                <li
                  key={v.id}
                  className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 py-5"
                >
                  <span className="mono text-xs text-dust">{timeAgo(v.createdAt)}</span>
                  <div>
                    <p className="mono text-sm text-paper">"{v.comment}"</p>
                    <p className="text-caption mt-1">
                      {v.fromUser && (
                        <Link
                          to="/profile/$username"
                          params={{ username: v.fromUser.username }}
                          className="hover:text-brass transition-colors"
                        >
                          {v.fromUser.username}
                        </Link>
                      )}
                      {" → "}
                      {v.toUser && (
                        <Link
                          to="/profile/$username"
                          params={{ username: v.toUser.username }}
                          className="hover:text-brass transition-colors"
                        >
                          {v.toUser.username}
                        </Link>
                      )}
                    </p>
                  </div>
                  {user && v.fromUser && v.fromUser.username !== user.username && (
                    <button
                      onClick={() => v.fromUser && handleFollowToggle(v.fromUser.username)}
                      className={`px-3 py-1 text-caption text-xs transition-colors cursor-pointer border ${
                        followingState[v.fromUser.username]
                          ? "border-dust/40 text-dust hover:border-marquee-red hover:text-marquee-red"
                          : "border-brass/50 text-brass hover:bg-brass hover:text-ink"
                      }`}
                    >
                      {followingState[v.fromUser.username] ? "Following" : "Follow"}
                    </button>
                  )}
                  <Stamp
                    size="sm"
                    rotation={((i * 13) % 7) - 3}
                    variant={v.score < 5 ? "red" : "brass"}
                  >
                    {v.score}
                  </Stamp>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside>
          <p className="text-caption mb-3">Standing</p>
          <h2 className="text-section text-paper">Leaderboard</h2>

          {loading ? (
            <p className="text-caption text-dust mt-10">Loading...</p>
          ) : leaderboard.length === 0 ? (
            <p className="text-caption text-dust mt-10">No scores computed yet.</p>
          ) : (
            <ul className="hairline mt-10 divide-y divide-border/40">
              {leaderboard.map((row) => (
                <li
                  key={row.rank}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-4"
                >
                  <span className="mono text-sm text-dust">
                    {String(row.rank).padStart(2, "0")}
                  </span>
                  <Link
                    to="/profile/$username"
                    params={{ username: row.user }}
                    className="text-card-title text-paper hover:text-brass transition-colors"
                  >
                    {row.user}
                  </Link>
                  <span className="mono text-brass">{row.score}</span>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </main>
    </div>
  );
}
