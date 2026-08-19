import type {} from "@tanstack/react-start";
import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "@vercel/og";
import { ClapboardMark, getFonts } from "./-og-card";

// Brand palette — "Screening Room at Dusk". Same values as -og-card.tsx.
const INK = "#151411";
const VELVET = "#201f1d";
const BRASS = "#d1a757";
const PAPER = "#eee7d9";
const DUST = "#74716c";
const GLOW_TOP = "#2f2e2b";
const GLOW_BOTTOM = "#1c1a18";

export function BrandCard() {
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
        padding: "52px 64px",
      }}
    >
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

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
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

      <div
        style={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 150,
            height: 150,
            marginBottom: 20,
            transform: "rotate(-4deg)",
          }}
        >
          <ClapboardMark size={150} />
        </div>
        <span
          style={{
            fontFamily: "Playfair",
            fontWeight: 900,
            fontSize: 96,
            lineHeight: 1.1,
            color: PAPER,
          }}
        >
          Verdict
        </span>
        <span
          style={{
            fontFamily: "JetBrainsMono",
            fontWeight: 500,
            fontSize: 18,
            letterSpacing: "0.3em",
            color: BRASS,
            marginTop: 18,
          }}
        >
          EVERYONE&apos;S A CRITIC
        </span>
      </div>

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          borderTop: "1px solid rgba(116,113,108,0.28)",
          paddingTop: 18,
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
          NOW SHOWING
        </span>
      </div>
    </div>
  );
}

async function serveBrandCard() {
  let fonts: Awaited<ReturnType<typeof getFonts>> | null = null;
  try {
    fonts = await getFonts();
  } catch {
    fonts = null;
  }

  try {
    return new ImageResponse(<BrandCard />, {
      width: 1200,
      height: 630,
      fonts: fonts
        ? [
            { name: "Playfair", data: fonts.playfair900, weight: 900 as const, style: "normal" },
            { name: "JetBrainsMono", data: fonts.mono500, weight: 500 as const, style: "normal" },
          ]
        : undefined,
      headers: {
        "content-type": "image/png",
        "cache-control": "public, max-age=3600, s-maxage=86400",
      },
    });
  } catch (err) {
    console.error("[og/site] ImageResponse failed", err);
    return new Response("Image generation failed", { status: 500 });
  }
}

type HandlerInfo = { request?: Request };

export const Route = createFileRoute("/og/site")({
  server: {
    handlers: {
      GET: (info: HandlerInfo | Request) => serveBrandCard(),
    },
  },
});
