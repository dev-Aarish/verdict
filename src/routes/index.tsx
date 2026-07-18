import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { globalFeed } from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Verdict — Everyone's a critic. Now they can prove it." },
      {
        name: "description",
        content:
          "Verdict renders a taste score on your movie history — and lets your friends stamp their judgment onto it.",
      },
      { property: "og:title", content: "Verdict — Rate your friends' taste in film" },
      {
        property: "og:description",
        content:
          "Get a Taste Score. Collect Verdicts. Share the stamp. A screening-room take on movie-rating apps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const rollList = [...globalFeed, ...globalFeed];

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-6xl px-6">
        {/* Hero */}
        <section className="grid gap-12 py-20 md:grid-cols-[1.15fr_1fr] md:items-center md:py-32">
          <div>
            <p className="text-caption mb-6">Est. 2026 · Screening Room</p>
            <h1 className="text-hero text-paper">
              Everyone's a critic.
              <br />
              <span className="text-brass">Now they can prove it.</span>
            </h1>
            <p className="mt-6 max-w-md text-paper/80">
              Verdict reads your movie history and renders a score. Then your friends stamp their
              judgment onto your taste — one line, no hedging.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <Link
                to="/signup"
                className="border-2 border-brass bg-brass px-6 py-3 text-caption text-ink hover:bg-transparent hover:text-brass transition-colors"
              >
                Get your Verdict →
              </Link>
              <Link
                to="/profile/$username"
                params={{ username: "testuser" }}
                className="text-caption text-dust hover:text-paper transition-colors"
              >
                See an example profile
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="relative">
              <Stamp size="xl" rotation={-4} animate="settle" label="Taste Score">
                87
              </Stamp>
              <div className="absolute -bottom-8 -left-10 rotate-[6deg]">
                <Stamp size="sm" rotation={6} variant="red">
                  4
                </Stamp>
              </div>
              <div className="absolute -right-6 -top-6 rotate-[8deg]">
                <Stamp size="sm" rotation={8}>
                  9
                </Stamp>
              </div>
            </div>
          </div>
        </section>

        {/* Credits roll */}
        <section className="hairline py-14">
          <p className="text-caption mb-8 text-center">Recent Verdicts</p>
          <div className="relative mx-auto h-64 max-w-2xl overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
            <ul className="animate-credits absolute inset-x-0 top-0 space-y-6 text-center">
              {rollList.map((v, i) => (
                <li key={`${v.id}-${i}`} className="mono text-sm text-paper/85">
                  <span className="text-caption mr-3 text-dust">{v.when}</span>
                  <span className="text-brass">{v.score}</span>
                  <span className="mx-3 text-dust">·</span>
                  <span className="text-paper">"{v.quote}"</span>
                  <div className="text-caption mt-1 text-dust">{v.from}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works — three acts */}
        <section className="hairline grid gap-10 py-20 md:grid-cols-3">
          {[
            {
              n: "I.",
              t: "Log the films",
              b: "Import a list or add as you go. Your history is the record.",
            },
            {
              n: "II.",
              t: "Receive the score",
              b: "A Taste Score is calculated from diversity, obscurity, and consistency.",
            },
            {
              n: "III.",
              t: "Collect Verdicts",
              b: "Share the link. Friends leave a one-line judgment, stamped.",
            },
          ].map((step) => (
            <div key={step.n}>
              <p className="text-brass mono text-lg">{step.n}</p>
              <h3 className="text-card-title mt-3 text-paper">{step.t}</h3>
              <p className="mt-2 text-sm text-dust">{step.b}</p>
            </div>
          ))}
        </section>

        {/* Closing */}
        <section className="hairline flex flex-col items-center gap-8 py-24 text-center">
          <p className="text-caption">Now Showing</p>
          <h2 className="text-section max-w-2xl text-paper">
            A quiet, formal room where your taste is read out loud.
          </h2>
          <Link
            to="/signup"
            className="border-2 border-brass bg-brass px-6 py-3 text-caption text-ink hover:bg-transparent hover:text-brass transition-colors"
          >
            Get your Verdict →
          </Link>
        </section>
      </main>

      <footer className="hairline mx-auto max-w-6xl px-6 py-10">
        <div className="flex items-center justify-between text-caption text-dust">
          <span className="wordmark text-paper">Verdict</span>
          <span>© MMXXVI · A screening room</span>
        </div>
      </footer>
    </div>
  );
}
