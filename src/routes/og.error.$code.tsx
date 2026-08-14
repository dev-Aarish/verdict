import type {} from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "@vercel/og";
import { ClapboardMark, getFonts } from "./-og-card";

// Brand palette — "Screening Room at Dusk". Same values as -og-card.tsx,
// plus the marquee-red (oklch(0.48 0.14 27) → #9d352f) reserved for negative
// signal: the rejection stamp.
const INK = "#151411";
const VELVET = "#201f1d";
const BRASS = "#d1a757";
const PAPER = "#eee7d9";
const DUST = "#74716c";
const RED = "#9d352f";
const GLOW_TOP = "#2f2e2b";
const GLOW_BOTTOM = "#1c1a18";

function trimPath(path: string): string {
  if (!path || path === "/") return "verdict.app";
  return path.length > 44 ? `${path.slice(0, 41)}…` : path;
}

function ErrorCard({ code, path }: { code: number; path: string }) {
  const isNotFound = code === 404;
  const caption = isNotFound ? "REEL NOT FOUND" : "PROJECTION FAULT";
  const line = isNotFound
    ? "This reel isn't in the archive."
    : "The projector jammed mid-show.";
  const width = 1200;
  const height = 630;

  return (
    <div
      style={{
        width,
        height,
        position: "relative",
        display: "flex",
        flexDirection: "column",
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

      {/* Header */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          padding: "46px 58px 0",
        }}
      >
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

      {/* Center — the rejection stamp */}
      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 34,
          padding: "0 58px",
        }}
      >
        <span
          style={{
            fontFamily: "JetBrainsMono",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "0.5em",
            color: RED,
          }}
        >
          {caption}
        </span>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            width: 320,
            height: 320,
            border: `3px solid ${RED}`,
            borderRadius: 8,
            transform: "rotate(-4deg)",
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 13,
              border: `1px dashed ${RED}`,
              borderRadius: 4,
              opacity: 0.7,
            }}
          />
          <span
            style={{
              fontFamily: "Playfair",
              fontWeight: 900,
              fontSize: 132,
              lineHeight: 1,
              color: RED,
            }}
          >
            {code}
          </span>
        </div>

        <span
          style={{
            fontFamily: "JetBrainsMono",
            fontWeight: 500,
            fontSize: 18,
            letterSpacing: "0.26em",
            color: DUST,
          }}
        >
          {trimPath(path)}
        </span>

        <span
          style={{
            fontFamily: "Playfair",
            fontWeight: 700,
            fontStyle: "italic",
            fontSize: 30,
            lineHeight: 1.3,
            color: PAPER,
            textAlign: "center",
            maxWidth: 720,
          }}
        >
          {line}
        </span>
      </div>

      {/* Footer */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderTop: `1px solid rgba(116,113,108,0.28)`,
          padding: "20px 58px",
        }}
      >
        <span
          style={{
            fontFamily: "JetBrainsMono",
            fontWeight: 500,
            fontSize: 14,
            letterSpacing: "0.22em",
            color: DUST,
          }}
        >
          A SCREENING ROOM
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
          {`REEL #${code}`}
        </span>
      </div>
    </div>
  );
}

type HandlerInfo = { request?: Request; params?: Record<string, string> };

function extractParam(info: HandlerInfo | Request, key: string): string | null {
  if (info instanceof Request) {
    return new URL(info.url).searchParams.get(key);
  }
  if (info?.params?.[key]) return info.params[key];
  if (info?.request) {
    return new URL(info.request.url).searchParams.get(key);
  }
  return null;
}

async function serveErrorCard(codeRaw: string | null, path: string | null) {
  const code = /^\d{3}$/.test(codeRaw || "") ? Number(codeRaw) : 500;

  let fonts: Awaited<ReturnType<typeof getFonts>> | null = null;
  try {
    fonts = await getFonts();
  } catch {
    fonts = null;
  }

  try {
    return new ImageResponse(<ErrorCard code={code} path={path || ""} />, {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "Playfair", data: fonts.playfair900, weight: 900 as const, style: "normal" },
            { name: "Playfair", data: fonts.playfair700, weight: 700 as const, style: "normal" },
            { name: "JetBrainsMono", data: fonts.mono500, weight: 500 as const, style: "normal" },
          ]
        : undefined,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[og/error] ImageResponse failed", err);
    return new Response("Image generation failed", { status: 500 });
  }
}

export const Route = createFileRoute("/og/error/$code")({
  server: {
    handlers: {
      GET: (info: HandlerInfo | Request) => {
        // The runtime may hand us a wrapped ({ request, params }) object or a
        // bare Request — resolve defensively from either.
        const code = extractParam(info, "code");
        const path = extractParam(info, "path");
        return serveErrorCard(code, path);
      },
    },
  },
});
