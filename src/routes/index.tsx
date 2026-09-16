import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { globalFeed } from "@/lib/mock";
import { absoluteUrl } from "@/lib/site-url";
import { Film, Sparkles, MessageSquareQuote, ArrowRight } from "lucide-react";

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
      { property: "og:image", content: absoluteUrl("/og/site") },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl("/og/site") },
    ],
  }),
  component: Landing,
});

function Landing() {
  const rollList = [...globalFeed, ...globalFeed];

  return (
    <div className="min-h-screen">
      <TopBar />

      <main className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Hero Section */}
        <section className="grid gap-10 pb-16 pt-8 sm:pt-12 md:grid-cols-[1.15fr_1fr] md:items-center md:gap-12 md:pb-28 md:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-brass/30 bg-velvet/50 px-3 py-1 mb-5">
              <span className="h-1.5 w-1.5 rounded-full bg-brass animate-pulse" />
              <span className="text-caption text-brass text-[0.65rem] md:text-xs">Est. 2026 · Screening Room</span>
            </div>
            
            <h1 className="text-hero text-paper">
              Everyone's a critic.
              <br />
              <span className="text-brass">Now they can prove it.</span>
            </h1>
            
            <p className="mt-5 max-w-md text-sm md:text-base leading-relaxed text-paper/80">
              Verdict reads your movie history and renders an unsparing Taste Score. Then your friends stamp their
              judgment onto your taste — one line, no hedging.
            </p>
            
            <div className="mt-8 flex flex-wrap items-center gap-3 sm:gap-4 md:mt-10">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 border-2 border-brass bg-brass px-5 py-3 text-caption font-bold text-ink hover:bg-transparent hover:text-brass transition-all duration-200 active:scale-95 shadow-[0_0_20px_rgba(197,165,114,0.25)]"
              >
                <span>Get your Verdict</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/profile/$username"
                params={{ username: "testuser" }}
                className="border border-dust/30 bg-velvet/30 px-4 py-3 text-caption text-dust hover:text-paper hover:border-dust/60 transition-all active:scale-95"
              >
                Explore demo profile
              </Link>
            </div>
          </div>

          <div className="flex justify-center md:justify-end py-6 md:py-0">
            <div className="relative">
              <Stamp size="xl" rotation={-4} animate="settle" label="Taste Score">
                87
              </Stamp>
              <div className="absolute -bottom-6 -left-6 sm:-bottom-8 sm:-left-8 rotate-[6deg]">
                <Stamp size="sm" rotation={6} variant="red">
                  4
                </Stamp>
              </div>
              <div className="absolute -right-4 -top-5 sm:-right-6 sm:-top-6 rotate-[8deg]">
                <Stamp size="sm" rotation={8}>
                  9
                </Stamp>
              </div>
            </div>
          </div>
        </section>

        {/* Credits roll / Ticker marquee */}
        <section className="hairline py-10 md:py-16">
          <div className="flex items-center justify-center gap-2 mb-6 md:mb-8">
            <MessageSquareQuote className="h-4 w-4 text-brass" />
            <p className="text-caption text-brass text-center">Recent Verdicts Reel</p>
          </div>
          
          <div className="relative mx-auto h-64 max-w-2xl overflow-hidden rounded-lg border border-dust/15 bg-velvet/20 [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
            <ul className="animate-credits absolute inset-x-0 top-0 space-y-6 p-4 text-center">
              {rollList.map((v, i) => (
                <li key={`${v.id}-${i}`} className="mono text-sm text-paper/85 transition-colors hover:text-brass">
                  <span className="text-caption mr-3 text-dust">{v.when}</span>
                  <span className="font-bold text-brass">[{v.score}/10]</span>
                  <span className="mx-3 text-dust">·</span>
                  <span className="text-paper italic">"{v.quote}"</span>
                  <div className="text-caption mt-1 text-dust/80">— {v.from}</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* How it works — three acts */}
        <section className="hairline py-14 md:py-20">
          <div className="text-center mb-10 md:mb-14">
            <p className="text-caption mb-2 text-brass">The Protocol</p>
            <h2 className="text-section text-paper">Three Acts of Film Judgment</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 md:gap-8">
            {[
              {
                n: "I.",
                icon: Film,
                t: "Log the films",
                b: "Import your watch history or add title-by-title with personal ratings and notes.",
              },
              {
                n: "II.",
                icon: Sparkles,
                t: "Receive the score",
                b: "Your Taste Score engine weighs Genre Diversity, Obscurity, and Rating Consistency.",
              },
              {
                n: "III.",
                icon: MessageSquareQuote,
                t: "Collect Verdicts",
                b: "Share your ticket. Friends leave stamped one-line critiques on your cinematic taste.",
              },
            ].map((step) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.n}
                  className="surface-card surface-card-hover relative p-6 md:p-8 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-brass mono text-xl font-bold">{step.n}</span>
                      <Icon className="h-5 w-5 text-dust/60" />
                    </div>
                    <h3 className="text-card-title mt-4 text-paper">{step.t}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-dust">{step.b}</p>
                  </div>
                  <div className="mt-6 h-0.5 w-10 bg-brass/30" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Closing Callout */}
        <section className="hairline relative my-8 overflow-hidden rounded-xl border border-brass/30 bg-velvet/40 p-8 text-center sm:p-12 md:my-16 md:p-16">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brass/5 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-brass/5 blur-3xl" />
          
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
            <p className="text-caption text-brass">Admit One</p>
            <h2 className="text-section text-paper">
              A quiet, formal room where your taste is read out loud.
            </h2>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 border-2 border-brass bg-brass px-6 py-3.5 text-caption font-bold text-ink hover:bg-transparent hover:text-brass transition-all duration-200 active:scale-95 shadow-[0_0_24px_rgba(197,165,114,0.3)]"
            >
              <span>Get your Verdict →</span>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
