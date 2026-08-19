// Resolve this app's absolute public origin for og:image / og:url meta tags.
// Link-preview scrapers (WhatsApp, iMessage, Slack, Twitter) require absolute
// image URLs — a relative path renders as a broken-image placeholder. Prefer
// the explicit env override, then the known production domain, then a no-host
// sentinel (SSR-only fallback so a missing value never emits "../og/...").
const PRODUCTION_ORIGIN = "https://verdict-critique.vercel.app";

function envOrigin(): string {
  if (typeof window === "undefined") {
    return process.env.APP_URL || import.meta.env.VITE_SITE_URL || "";
  }
  return import.meta.env.VITE_SITE_URL || process.env.APP_URL || "";
}

export function siteOrigin(): string {
  const origin = envOrigin();
  return origin.replace(/\/$/, "") || PRODUCTION_ORIGIN;
}

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${siteOrigin()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ogImage(url: string): string {
  return absoluteUrl(url);
}
