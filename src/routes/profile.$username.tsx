import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { sampleProfile } from "@/lib/mock";

export const Route = createFileRoute("/profile/$username")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username} — Taste Score 87 · Verdict` },
      { name: "description", content: `${params.username}'s Taste Score, Verdicts, and Watched list on Verdict.` },
      { property: "og:title", content: `${params.username} · Verdict` },
      { property: "og:description", content: "See the Taste Score and stamp your own Verdict." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const p = sampleProfile;

  return (
    <div className="min-h-screen pb-32">
      <TopBar />

      <main className="mx-auto max-w-5xl px-6">
        {/* Header */}
        <section className="grid gap-10 py-16 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center border border-brass/60 bg-velvet mono text-2xl text-brass">
                {username.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h1 className="text-section text-paper">{username}</h1>
                <p className="text-caption mt-1">
                  {p.filmCount} films · joined {p.joined}
                </p>
              </div>
            </div>

            <div className="mt-10 grid max-w-md grid-cols-3 gap-4">
              {Object.entries(p.breakdown).map(([k, v]) => (
                <div key={k} className="border border-border/60 bg-velvet/40 px-4 py-3">
                  <p className="text-caption">{k}</p>
                  <p className="mono mt-2 text-2xl text-paper">{v}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <Stamp size="xl" rotation={-3} animate="settle" label="Taste Score">
              {p.tasteScore}
            </Stamp>
          </div>
        </section>

        {/* Verdicts */}
        <section className="hairline py-12">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="text-section text-paper">Verdicts</h2>
            <span className="text-caption">{p.verdicts.length} recorded</span>
          </div>
          <ul className="divide-y divide-border/40">
            {p.verdicts.map((v) => (
              <li key={v.id} className="flex items-center gap-6 py-6">
                <Stamp
                  size="sm"
                  rotation={((Number(v.id) * 37) % 7) - 3}
                  variant={v.score < 5 ? "red" : "brass"}
                >
                  {v.score}
                </Stamp>
                <div className="flex-1">
                  <p className="text-card-title text-paper">"{v.quote}"</p>
                  <p className="text-caption mt-1">
                    {v.from} · {v.when} ago
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Watched */}
        <section className="hairline py-12">
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="text-section text-paper">Watched</h2>
            <span className="text-caption">{p.filmCount} logged · showing 24</span>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {p.watched.map((f) => (
              <li
                key={f.id}
                className="group aspect-[2/3] border border-border/60 bg-velvet/60 p-3 transition-colors hover:border-brass/60"
              >
                <div className="flex h-full flex-col justify-between">
                  <p className="text-caption">{f.year}</p>
                  <div>
                    <p className="text-card-title leading-tight text-paper">{f.title}</p>
                    <p className="mono mt-2 text-sm text-brass">{f.rating}/10</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-ink/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <p className="text-caption hidden sm:block">
            Judgment is a courtesy.
          </p>
          <div className="flex flex-1 items-center justify-end gap-3">
            <Link
              to="/share/$username"
              params={{ username }}
              className="border border-border px-4 py-2 text-caption text-paper hover:border-brass hover:text-brass transition-colors"
            >
              Share card
            </Link>
            <Link
              to="/verdict/$username"
              params={{ username }}
              className="border-2 border-brass bg-brass px-5 py-2 text-caption text-ink hover:bg-transparent hover:text-brass transition-colors"
            >
              Leave a Verdict
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
