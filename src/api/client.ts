// Backend API base URL, resolved from environment:
// - Browser: VITE_API_URL is inlined at build time by Vite (see .env.example)
// - SSR: API_URL is read at runtime on the deploy host, falling back to VITE_API_URL
// - Local dev: both unset → http://localhost:4000 (the local `npm run dev:api` server)
const LOCAL_API_URL = "http://localhost:4000";

function getBackendUrl(): string {
  const viteApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof window === "undefined") {
    return process.env.API_URL || viteApiUrl || LOCAL_API_URL;
  }
  return viteApiUrl || LOCAL_API_URL;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}/api${path}`;
  let init: RequestInit = { ...options };

  if (typeof window === "undefined") {
    init = { ...init, signal: AbortSignal.timeout(10000) };
  } else {
    init = { ...init, credentials: "include" };
  }

  const res = await fetch(url, init);
  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return body as T;
}
