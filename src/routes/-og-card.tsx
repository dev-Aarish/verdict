// Shared OG card element — pure JSX + font loader. Imported by the
// /og/:username server route and by the standalone render smoke-test.
// (Files beginning with "-" are not treated as routes by TanStack.)

import { GenreRadar } from "@/components/GenreRadar";
import type { GenreDna } from "@/lib/genre-dna";

// Brand palette — "Screening Room at Dusk" (oklch converted to hex).
const INK = "#151411"; // background
const VELVET = "#201f1d"; // panels
const BRASS = "#d1a757"; // sole positive accent
const PAPER = "#eee7d9"; // foreground
const DUST = "#74716c"; // muted
const GLOW_TOP = "#2f2e2b"; // warm bloom behind the mark
const GLOW_BOTTOM = "#1c1a18"; // floor glow

export type OgEntry = { title: string; year: string; rating: number };
export type OgData = {
  username: string;
  score: number;
  filmCount: number;
  films: OgEntry[];
  quote: string | null;
  quoteFrom: string | null;
  dna: GenreDna | null;
};

async function fetchFont(weightCss: string, family: string): Promise<ArrayBuffer> {
  // Ask Google Fonts for a compilable CSS scoped to one family/weight. A legacy
  // UA is served plain TTF, which satori/@vercel/og decodes reliably (WOFF2 is
  // not supported by the vendored decoder).
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:wght@${weightCss}&display=swap`,
    {
      headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64)" },
      signal: AbortSignal.timeout(4000),
    },
  ).then((r) => r.text());

  // Prefer ttf, fall back to woff/woff2 (quoting/format strings vary).
  const match = css.match(/https:\/\/[^)'"\s]+\.(?:ttf|woff2|woff)/);
  if (!match) throw new Error(`font src not found for ${family}`);
  const buffer = await fetch(match[0], { signal: AbortSignal.timeout(4000) }).then((r) =>
    r.arrayBuffer(),
  );
  return buffer;
}

let fontsReady: Promise<{
  playfair900: ArrayBuffer;
  playfair700: ArrayBuffer;
  mono500: ArrayBuffer;
}> | null = null;

export function getFonts() {
  if (!fontsReady) {
    fontsReady = Promise.all([
      fetchFont("900", "Playfair+Display"),
      fetchFont("700", "Playfair+Display"),
      fetchFont("500", "JetBrains+Mono"),
    ]).then(([playfair900, playfair700, mono500]) => ({ playfair900, playfair700, mono500 }));
    // Reset the cache so a transient failure doesn't poison the worker for its lifetime.
    fontsReady = fontsReady.catch((err) => {
      fontsReady = null;
      throw err;
    });
  }
  return fontsReady;
}

export function clampUsername(username: string): string {
  return username.length > 26 ? `${username.slice(0, 23)}…` : username;
}

export function ClapboardMark({ size = 40 }: { size?: number }) {
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        transform: "rotate(-3deg)",
        gap: size * 0.07,
      }}
    >
      {/* Hinged stick, lifted mid-clap */}
      <div
        style={{
          height: "18%",
          backgroundColor: BRASS,
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          paddingLeft: "6%",
        }}
      >
        <div
          style={{
            width: "12%",
            height: size * 0.1,
            backgroundColor: BRASS,
            borderRadius: "50%",
          }}
        />
      </div>
      {/* Slate with diagonal stripes cut out */}
      <div
        style={{
          flex: 1,
          backgroundColor: BRASS,
          borderRadius: 3,
          backgroundImage: `repeating-linear-gradient(45deg, transparent 0 8px, ${INK} 8px 16px)`,
        }}
      />
    </div>
  );
}

function TicketDivider() {
  return (
    <div
      style={{
        flex: "none",
        width: 10,
        height: 3,
        backgroundColor: BRASS,
        opacity: 0.9,
        marginTop: 22,
        marginBottom: 22,
        borderRadius: 2,
      }}
    />
  );
}

function ReelNumber({ n }: { n: number }) {
  return (
    <div
      style={{
        fontFamily: "JetBrainsMono",
        fontWeight: 500,
        fontSize: 20,
        letterSpacing: "0.28em",
        color: DUST,
      }}
    >
      {`REEL #${String(n).padStart(3, "0")}`}
    </div>
  );
}

export function OgCard({ username, score, filmCount, films, quote, quoteFrom, dna }: OgData) {
  const width = 1200;
  const height = 630;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        display: "flex",
        flexDirection: "row",
        backgroundColor: INK,
        overflow: "hidden",
      }}
    >
      {/* At-theatre glow */}
      <div
        style={{
          position: "absolute",
          left: -200,
          top: -260,
          width: 900,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 50%, ${GLOW_TOP} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 240,
          bottom: -280,
          width: 1000,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(ellipse at 50% 50%, ${GLOW_BOTTOM} 0%, transparent 62%)`,
        }}
      />

      {/* LEFT — the grading panel */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: 748,
          height,
          padding: `46px 0 38px 58px`,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: 14 }}>
          <ClapboardMark size={34} />
          <span
            style={{
              fontFamily: "JetBrainsMono",
              fontWeight: 500,
              fontSize: 18,
              letterSpacing: "0.4em",
              color: BRASS,
            }}
          >
            VERDICT
          </span>
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "JetBrainsMono",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.22em",
              color: DUST,
            }}
          >
            EST. 2026
          </span>
        </div>

        {/* The taste of @handle */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span
            style={{
              fontFamily: "JetBrainsMono",
              fontWeight: 500,
              fontSize: 16,
              letterSpacing: "0.42em",
              color: DUST,
              marginBottom: 14,
            }}
          >
            THE TASTE OF
          </span>
          <span
            style={{
              fontFamily: "Playfair",
              fontWeight: 900,
              fontSize: 96,
              lineHeight: 1,
              color: PAPER,
            }}
          >
            @{clampUsername(username)}
          </span>
          <TicketDivider />
          <span
            style={{
              fontFamily: "JetBrainsMono",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.34em",
              color: BRASS,
            }}
          >
            {`NOW SHOWING — ${filmCount} FILMS`}
          </span>
          <div style={{ marginTop: 18, display: "flex", flexDirection: "row", gap: 40 }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}
            >
              {(films.length ? films : []).map((f, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "baseline",
                    width: "100%",
                    borderBottom: "1px solid rgba(116,113,108,0.28)",
                    paddingBottom: 8,
                    gap: 12,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "JetBrainsMono",
                      fontWeight: 500,
                      fontSize: 17,
                      color: PAPER,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.title}
                  </span>
                  <span style={{ fontFamily: "JetBrainsMono", fontSize: 15, color: DUST }}>
                    {`· ${f.year}`}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontFamily: "JetBrainsMono",
                      fontWeight: 500,
                      fontSize: 17,
                      color: BRASS,
                    }}
                  >
                    {f.rating}
                  </span>
                </div>
              ))}
            </div>
            {dna && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  flexShrink: 0,
                }}
              >
                <GenreRadar dna={dna} size={180} labelFont="JetBrainsMono" />
                <span
                  style={{
                    fontFamily: "JetBrainsMono",
                    fontWeight: 500,
                    fontSize: 13,
                    letterSpacing: "0.34em",
                    color: BRASS,
                  }}
                >
                  GENRE DNA
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            borderTop: "1px solid rgba(116,113,108,0.28)",
            paddingTop: 18,
          }}
        >
          <ReelNumber n={score} />
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "JetBrainsMono",
              fontWeight: 500,
              fontSize: 14,
              letterSpacing: "0.18em",
              color: DUST,
            }}
          >
            verdict.app/@{username}
          </span>
        </div>
      </div>

      {/* Perforation seam */}
      <div
        style={{
          position: "absolute",
          left: 748,
          top: 0,
          width: 2,
          height,
          borderLeft: "2px dashed rgba(209,167,87,0.5)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 738,
          top: -14,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: INK,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 738,
          bottom: -14,
          width: 22,
          height: 22,
          borderRadius: "50%",
          backgroundColor: INK,
        }}
      />

      {/* RIGHT — the stamp stub */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: 452,
          height,
          padding: "46px 40px 40px",
          backgroundColor: VELVET,
          gap: 26,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {/* Rubber stamp */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 300,
              height: 300,
              border: `3px solid ${BRASS}`,
              borderRadius: 8,
              transform: "rotate(-4deg)",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 12,
                border: "1px dashed rgba(209,167,87,0.65)",
                borderRadius: 4,
              }}
            />
            <span
              style={{
                fontFamily: "JetBrainsMono",
                fontWeight: 500,
                fontSize: 15,
                letterSpacing: "0.36em",
                color: BRASS,
                marginBottom: 8,
              }}
            >
              TASTE SCORE
            </span>
            <span
              style={{
                fontFamily: "Playfair",
                fontWeight: 700,
                fontSize: 118,
                lineHeight: 1,
                color: BRASS,
              }}
            >
              {score}
            </span>
          </div>

          <div style={{ height: 34 }} />
          <ReelNumber n={score} />
        </div>

        {quote && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              marginTop: "auto",
              maxWidth: 320,
            }}
          >
            <span
              style={{
                fontFamily: "Playfair",
                fontWeight: 700,
                fontStyle: "italic",
                fontSize: 22,
                lineHeight: 1.4,
                color: PAPER,
                textAlign: "center",
              }}
            >
              {`“${quote.length > 120 ? `${quote.slice(0, 117)}…` : quote}”`}
            </span>
            {quoteFrom && (
              <span
                style={{
                  marginTop: 12,
                  fontFamily: "JetBrainsMono",
                  fontWeight: 500,
                  fontSize: 14,
                  letterSpacing: "0.18em",
                  color: DUST,
                }}
              >
                — FROM @{clampUsername(quoteFrom)}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
