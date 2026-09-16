import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { submitVerdictFn } from "@/api/verdicts";
import { useUser } from "@/lib/user-context";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Sparkles, MessageSquare } from "lucide-react";

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!line.trim() || submitting) return;
    if (!user) {
      setError("Sign in to leave a verdict");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await submitVerdictFn({ data: { toUsername: username, score, comment: line.trim() } });
      setStamped(true);
      setTimeout(() => {
        navigate({ to: "/profile/$username", params: { username } });
      }, 1600);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit verdict");
      setSubmitting(false);
    }
  };

  const isRed = score <= 4;
  const descriptor =
    score <= 3
      ? "Atrocious Taste"
      : score <= 4
      ? "Unforgivable"
      : score <= 6
      ? "Passable"
      : score <= 8
      ? "Distinguished"
      : "Cinematic God";

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto flex min-h-[calc(100vh-80px)] max-w-2xl flex-col justify-center px-4 py-8 pb-24 sm:px-6 md:py-14">
        {!stamped ? (
          <div className="surface-card p-6 sm:p-10 rounded-2xl shadow-2xl">
            <Link
              to="/profile/$username"
              params={{ username }}
              className="inline-flex items-center gap-1 text-caption text-dust hover:text-brass transition-colors mb-6 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Withdraw to @{username}'s profile</span>
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-brass" />
              <p className="text-caption text-brass text-xs">Jury Chamber</p>
            </div>
            
            <h1 className="text-section text-paper font-bold">
              Render a verdict on <span className="text-brass">@{username}</span>'s taste.
            </h1>
            <p className="mt-2 text-sm text-dust font-serif italic">Be honest. One line. No hedging.</p>

            <div className="hairline mt-8 pt-8">
              {/* Score Preview & Descriptor */}
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-caption text-dust text-xs">Your Judgment</p>
                  <p className={`text-sm font-bold mt-1 ${isRed ? "text-marquee-red" : "text-brass"}`}>
                    {descriptor} ({score}/10)
                  </p>
                </div>
                
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

              {/* Slider */}
              <div className="mt-8 px-1">
                <Slider
                  value={[score]}
                  onValueChange={(val) => setScore(val[0])}
                  min={1}
                  max={10}
                  step={1}
                  className="[&_[data-orientation=horizontal]]:h-2.5"
                />
                <div className="mono mt-3 flex justify-between text-xs text-dust">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setScore(i + 1)}
                      className={`cursor-pointer transition-colors p-1 rounded font-bold ${
                        i + 1 === score ? "text-brass font-extrabold scale-110" : "text-dust/70 hover:text-paper"
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Input */}
              <div className="mt-8">
                <div className="flex items-center justify-between mb-2">
                  <label className="inline-flex items-center gap-1.5 text-caption text-paper text-xs font-bold">
                    <MessageSquare className="h-3.5 w-3.5 text-brass" />
                    <span>The One-Line Critique</span>
                  </label>
                  <span className="mono text-[0.68rem] text-dust">{line.length}/80</span>
                </div>
                
                <input
                  type="text"
                  maxLength={80}
                  value={line}
                  onChange={(e) => setLine(e.target.value)}
                  placeholder="e.g. You only watch A24 for the color palettes."
                  className="w-full border-b-2 border-border/80 bg-ink/50 px-3 py-3 rounded-t-lg text-sm sm:text-base text-paper placeholder:text-dust/40 focus:border-brass focus:outline-none transition-colors"
                />
              </div>

              {error && <p className="text-caption text-marquee-red mt-6 text-center text-xs">{error}</p>}

              <div className="mt-8 flex items-center justify-between gap-4">
                <Link
                  to="/profile/$username"
                  params={{ username }}
                  className="text-caption text-dust hover:text-paper transition-colors text-xs"
                >
                  Cancel
                </Link>
                
                <button
                  onClick={submit}
                  disabled={!line.trim() || submitting}
                  className="inline-flex items-center gap-2 border-2 border-brass bg-brass px-8 py-3 text-caption font-bold text-ink rounded transition-all hover:bg-transparent hover:text-brass disabled:cursor-not-allowed disabled:border-dust disabled:bg-transparent disabled:text-dust active:scale-95 shadow-[0_0_20px_rgba(197,165,114,0.3)] cursor-pointer"
                >
                  {submitting ? "Stamping..." : "Stamp it →"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="surface-card p-10 rounded-2xl flex flex-col items-center gap-6 text-center max-w-lg mx-auto shadow-2xl animate-fade-in">
            <p className="text-caption text-brass text-xs">Verdict Recorded in Permanent Ink</p>
            <Stamp size="lg" rotation={-4} variant={isRed ? "red" : "brass"} animate="slam">
              {score}
            </Stamp>
            <p className="text-lg md:text-xl font-serif italic text-paper max-w-sm">"{line}"</p>
            <p className="text-caption text-dust text-xs animate-pulse">Returning to @{username}'s screening room…</p>
          </div>
        )}
      </main>
    </div>
  );
}
