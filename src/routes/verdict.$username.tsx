import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { submitVerdictFn } from "@/api/verdicts";
import { useUser } from "@/lib/user-context";

export const Route = createFileRoute("/verdict/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `Render a verdict on ${params.username} · Verdict` },
      {
        name: "description",
        content: `Stamp your judgment on ${params.username}'s taste. One line. Be honest.`,
      },
    ],
  }),
  component: LeaveVerdict,
});

function LeaveVerdict() {
  const { username } = Route.useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [score, setScore] = useState(7);
  const [line, setLine] = useState("");
  const [stamped, setStamped] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!line.trim()) return;
    if (!user) {
      setError("Sign in to leave a verdict");
      return;
    }
    try {
      await submitVerdictFn({ data: { toUsername: username, score, comment: line.trim() } });
      setStamped(true);
      setTimeout(() => {
        navigate({ to: "/profile/$username", params: { username } });
      }, 1400);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit verdict");
    }
  };

  const isRed = score <= 4;

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-2xl flex-col justify-center px-5 py-10 pb-24 md:px-6 md:py-16">
        {!stamped ? (
          <>
            <p className="text-caption mb-4">In the matter of</p>
            <h1 className="text-section text-paper">
              Rendering a verdict on <span className="text-brass">{username}</span>'s taste.
            </h1>
            <p className="mt-3 text-dust">Be honest. One line. That's it.</p>

            <div className="hairline mt-12 pt-12">
              <div className="flex items-center justify-between">
                <p className="text-caption">The Score</p>
                <Stamp
                  size="md"
                  rotation={-3}
                  variant={isRed ? "red" : "brass"}
                  key={score}
                  animate="settle"
                >
                  {score}
                </Stamp>
              </div>

              <div className="mt-8">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={score}
                  onChange={(e) => setScore(Number(e.target.value))}
                  className="w-full accent-brass"
                  aria-label="Score"
                />
                <div className="mono mt-2 flex justify-between text-xs text-dust">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className={i + 1 === score ? "text-brass" : ""}>
                      {i + 1}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-12">
                <label className="text-caption mb-3 block">The Verdict</label>
                <input
                  type="text"
                  maxLength={80}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder="One line. No hedging."
                  className="w-full border-b border-border/60 bg-transparent pb-3 text-card-title text-paper placeholder:text-dust/60 focus:border-brass focus:outline-none"
                />
                <p className="text-caption mt-2 text-right">{line.length}/80</p>
              </div>

              {error && <p className="text-caption text-marquee-red mt-8 text-center">{error}</p>}

              <div className="mt-6 flex items-center justify-between">
                <Link
                  to="/profile/$username"
                  params={{ username }}
                  className="text-caption text-dust hover:text-paper transition-colors"
                >
                  ← Withdraw
                </Link>
                <button
                  onClick={submit}
                  disabled={!line.trim()}
                  className="border-2 border-brass bg-brass px-8 py-3 text-caption text-ink transition-colors hover:bg-transparent hover:text-brass disabled:cursor-not-allowed disabled:border-dust disabled:bg-transparent disabled:text-dust"
                >
                  Stamp it
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-8 text-center">
            <p className="text-caption">Verdict recorded</p>
            <Stamp size="lg" rotation={-4} variant={isRed ? "red" : "brass"} animate="slam">
              {score}
            </Stamp>
            <p className="text-card-title max-w-md text-paper">"{line}"</p>
            <p className="text-caption text-dust">Returning to {username}'s profile…</p>
          </div>
        )}
      </main>
    </div>
  );
}
