import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { getFeedVerdictsFn, getLeaderboardFn } from "@/api/feed";
import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

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
  const [verdicts, setVerdicts] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getFeedVerdictsFn({ data: { limit: 50 } }),
      getLeaderboardFn(),
    ]).then(([v, lb]) => {
      setVerdicts(v.verdicts);
      setLeaderboard(lb);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

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

          {loading ? (
            <p className="text-caption text-dust mt-10">Loading...</p>
          ) : verdicts.length === 0 ? (
            <p className="text-caption text-dust mt-10">No verdicts yet. Be the first to stamp your judgment.</p>
          ) : (
            <ul className="hairline mt-10 divide-y divide-border/40">
              {verdicts.map((v, i) => (
                <li
                  key={v.id}
                  className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-5"
                >
                  <span className="mono text-xs text-dust">{timeAgo(v.createdAt)}</span>
                  <div>
                    <p className="mono text-sm text-paper">"{v.comment}"</p>
                    <p className="text-caption mt-1">
                      <Link to="/profile/$username" params={{ username: v.fromUser?.username }} className="hover:text-brass transition-colors">
                        {v.fromUser?.username}
                      </Link>
                      {" → "}
                      <Link to="/profile/$username" params={{ username: v.toUser?.username }} className="hover:text-brass transition-colors">
                        {v.toUser?.username}
                      </Link>
                    </p>
                  </div>
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
