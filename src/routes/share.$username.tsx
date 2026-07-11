import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { sampleProfile } from "@/lib/mock";

export const Route = createFileRoute("/share/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username}'s Verdict card` },
      { name: "description", content: `Share ${params.username}'s Taste Score.` },
    ],
  }),
  component: SharePage,
});

function SharePage() {
  const { username } = Route.useParams();
  const p = sampleProfile;
  const topFilms = p.watched.slice(0, 5);
  const quote = p.verdicts[0];

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-3xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-caption">Shareable</p>
            <h1 className="text-section text-paper">Verdict card</h1>
          </div>
          <Link
            to="/profile/$username"
            params={{ username }}
            className="text-caption text-dust hover:text-paper transition-colors"
          >
            ← Back to profile
          </Link>
        </div>

        {/* The card — 9:16 story format */}
        <div className="mx-auto w-full max-w-sm">
          <div
            className="relative aspect-[9/16] overflow-hidden border-2 border-brass/40 bg-ink p-8"
            style={{
              backgroundImage:
                "radial-gradient(ellipse at top, oklch(0.28 0.03 275) 0%, transparent 60%)",
            }}
          >
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="wordmark text-brass text-sm">Verdict</p>
                <p className="text-caption mt-1">Est. 2026</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <p className="text-caption mb-4">The taste of</p>
                <p className="text-card-title text-paper">@{username}</p>
                <div className="mt-6">
                  <Stamp size="lg" rotation={-4} label="Taste Score">
                    {p.tasteScore}
                  </Stamp>
                </div>
                <p className="mono mt-6 max-w-[220px] text-sm text-paper/90">
                  "{quote.quote}"
                </p>
                <p className="text-caption mt-2">— {quote.from}</p>
              </div>

              <div>
                <p className="text-caption mb-3">Now Showing</p>
                <ul className="space-y-1.5">
                  {topFilms.map((f) => (
                    <li
                      key={f.id}
                      className="flex justify-between border-b border-border/40 pb-1.5 mono text-xs text-paper/85"
                    >
                      <span>{f.title}</span>
                      <span className="text-brass">{f.rating}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 w-full border-2 border-brass bg-brass px-6 py-3 text-caption text-ink hover:bg-transparent hover:text-brass transition-colors"
          >
            Download card
          </button>
        </div>
      </main>
    </div>
  );
}
