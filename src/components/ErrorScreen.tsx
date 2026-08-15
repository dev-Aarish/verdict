import { Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";

/**
 * The house error screen — a marquee-red rejection stamp on the ink of the
 * screening room. 404 is a reel that isn't in the archive; 500 is the
 * projector jamming mid-show. Errors never apologize; they name what broke
 * and what to do next.
 */

type ErrorScreenVariant = "not-found" | "error";

interface ErrorScreenProps {
  variant: ErrorScreenVariant;
  /** Status code shown in the stamp (404, 500, …). */
  code: number;
  /** Attempted path, shown as a film-slate line. 404 only. */
  path?: string | null;
  /** Called by the "Try again" action (error variant only). */
  onRetry?: () => void;
}

const CONTENT: Record<
  ErrorScreenVariant,
  { eyebrow: string; headline: string; body: string }
> = {
  "not-found": {
    eyebrow: "Reel not found",
    headline: "This reel isn't in the archive.",
    body: "The link you followed isn't screening here. It may have moved, or it never made it into the catalogue.",
  },
  error: {
    eyebrow: "Projection fault",
    headline: "The projector jammed mid-show.",
    body: "Something went wrong on our end. Give it another try — if it keeps jamming, come back in a minute.",
  },
};

export function ErrorScreen({ variant, code, path, onRetry }: ErrorScreenProps) {
  const { eyebrow, headline, body } = CONTENT[variant];

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar />

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-24">
        <div className="relative flex max-w-xl flex-col items-center text-center">
          <p className="text-caption text-marquee-red">{eyebrow}</p>

          <div className="mt-8">
            <Stamp
              size="xl"
              variant="red"
              rotation={-4}
              animate="slam"
              className="text-[6.5rem] min-w-[9rem] min-h-[9rem] sm:text-[10rem] sm:min-w-[12.5rem] sm:min-h-[12.5rem]"
            >
              {/* tracking-normal: overrides stamp-frame's letter-spacing: 0.18em.
                  -translate-y-[0.07em]: Playfair Display font metrics have ~420 units
                  above cap-height vs ~260 below baseline, pushing digits down inside line box.
                  This vertical shift centers the cap-height of 404 dead in the box. */}
              <span className="inline-block tracking-normal -translate-y-[0.13em]">
                {code}
              </span>
            </Stamp>
          </div>

          <h1 className="text-section mt-10 text-paper">{headline}</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-dust">{body}</p>

          {path && (
            <p className="mono mt-8 border border-dust/25 px-4 py-2 text-xs tracking-[0.18em] text-dust">
              REEL: <span className="text-paper/85">{path}</span>
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            {variant === "error" && onRetry ? (
              <button
                onClick={onRetry}
                className="border-2 border-brass bg-brass px-6 py-3 text-caption text-ink transition-colors hover:bg-transparent hover:text-brass cursor-pointer"
              >
                Try again
              </button>
            ) : (
              <Link
                to="/"
                className="border-2 border-brass bg-brass px-6 py-3 text-caption text-ink transition-colors hover:bg-transparent hover:text-brass"
              >
                Go home
              </Link>
            )}
            {variant === "not-found" ? (
              <Link
                to="/search"
                className="border-2 border-border px-6 py-3 text-caption text-paper transition-colors hover:border-brass hover:text-brass"
              >
                Browse the catalogue →
              </Link>
            ) : (
              <Link
                to="/"
                className="border-2 border-border px-6 py-3 text-caption text-paper transition-colors hover:border-brass hover:text-brass"
              >
                Go home
              </Link>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
