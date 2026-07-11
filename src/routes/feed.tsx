import { createFileRoute } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { globalFeed, leaderboard } from "@/lib/mock";

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
  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto grid max-w-5xl gap-16 px-6 py-16 md:grid-cols-[1.4fr_1fr]">
        <section>
          <p className="text-caption mb-3">The Reel</p>
          <h1 className="text-section text-paper">Recent Verdicts</h1>

          <ul className="hairline mt-10 divide-y divide-border/40">
            {[...globalFeed, ...globalFeed].map((v, i) => (
              <li
                key={`${v.id}-${i}`}
                className="grid grid-cols-[3rem_1fr_auto] items-center gap-4 py-5"
              >
                <span className="mono text-xs text-dust">{v.when}</span>
                <div>
                  <p className="mono text-sm text-paper">"{v.quote}"</p>
                  <p className="text-caption mt-1">{v.from}</p>
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
        </section>

        <aside>
          <p className="text-caption mb-3">Standing</p>
          <h2 className="text-section text-paper">Leaderboard</h2>

          <ul className="hairline mt-10 divide-y divide-border/40">
            {leaderboard.map((row) => (
              <li
                key={row.rank}
                className="grid grid-cols-[2rem_1fr_auto] items-center gap-4 py-4"
              >
                <span className="mono text-sm text-dust">
                  {String(row.rank).padStart(2, "0")}
                </span>
                <span className="text-card-title text-paper">{row.user}</span>
                <span className="mono text-brass">{row.score}</span>
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
