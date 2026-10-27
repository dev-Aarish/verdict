// Backend API base URL, resolved from environment:
// - Browser: VITE_API_URL is inlined at build time by Vite (see .env.example)
// - SSR: API_URL is read at runtime on the deploy host, falling back to VITE_API_URL
// - Local dev: both unset → http://localhost:4000 (the local `npm run dev:api` server)
const LOCAL_API_URL = "http://localhost:4000";

const SSR_FETCH_TIMEOUT_MS = 2_500; // Cap SSR at 2.5s so SSR never blocks initial page load
const SSR_FETCH_RETRIES = 1;
const SSR_RETRY_BACKOFF_MS = [300];
const TOKEN_KEY = "verdict_auth_token";
const USER_KEY = "verdict_cached_user";

export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      document.cookie = `verdict_session=${encodeURIComponent(token)}; path=/; max-age=2592000; SameSite=Lax; Secure`;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      document.cookie = "verdict_session=; path=/; max-age=0; SameSite=Lax; Secure";
    }
  } catch {}
}

export function getCachedUser<T = any>(): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedUser(user: any | null): void {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  } catch {}
}

function getBackendUrl(): string {
  const viteApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof window === "undefined") {
    return process.env.API_URL || viteApiUrl || LOCAL_API_URL;
  }
  return viteApiUrl || "";
}

// Forward the incoming browser request's cookies to the backend during SSR.
// Without this, server-rendered pages (and any full page reload) always see an
// anonymous user even when a valid session cookie exists.
async function getServerRequestCookie(): Promise<string | null> {
  if (typeof window !== "undefined") return null;

  try {
    const pkg = "@tanstack/react-start/server";
    const { getRequestHeader } = await import(/* @vite-ignore */ pkg);
    const cookie = getRequestHeader("cookie");
    if (cookie) return cookie;
  } catch {
    // Fallback if react-start/server is unavailable
  }

  try {
    const pkg = "@tanstack/start-storage-context";
    const { getStartContext } = await import(/* @vite-ignore */ pkg);
    const context = getStartContext({ throwIfNotFound: false });
    return context?.request?.headers?.get("cookie") ?? null;
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Error subclass that carries the HTTP status code from the backend. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}/api${path}`;
  const isServer = typeof window === "undefined";

  let headers: Record<string, string> = { ...((options?.headers as Record<string, string>) ?? {}) };
  let credentials: RequestCredentials | undefined;

  if (isServer) {
    const cookie = await getServerRequestCookie();
    if (cookie) {
      headers["cookie"] = cookie;
      // Extract verdict_session if present to set Authorization header
      const sessionMatch = cookie.match(/verdict_session=([^;]+)/);
      if (sessionMatch && sessionMatch[1] && !headers["Authorization"] && !headers["authorization"]) {
        headers["Authorization"] = `Bearer ${decodeURIComponent(sessionMatch[1].trim())}`;
      }
    }

    // Fast-path for anonymous SSR /auth/me: if no session cookie or token is present,
    // don't waste 500ms-2.5s waiting for backend to return { user: null }.
    if (path === "/auth/me" && !cookie && !headers["Authorization"] && !headers["authorization"]) {
      return { user: null } as T;
    }
  } else {
    credentials = "include";
    const token = getStoredToken();
    if (token && !headers["Authorization"] && !headers["authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const attempts = isServer ? SSR_FETCH_RETRIES + 1 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    if (attempt > 0) {
      await sleep(SSR_RETRY_BACKOFF_MS[attempt - 1]);
    }

    const init: RequestInit = { ...options, headers, credentials };
    if (isServer) {
      init.signal = AbortSignal.timeout(SSR_FETCH_TIMEOUT_MS);
    }

    let res: Response;
    try {
      res = await fetch(url, init);
    } catch (error) {
      if (attempt === attempts - 1) throw error;
      continue;
    }

    const body = (await res.json().catch(() => ({}))) as any;

    if (!res.ok) {
      if (res.status === 401 && !isServer) {
        setStoredToken(null);
        setCachedUser(null);
      }
      throw new ApiError(body.error || `Request failed: ${res.status}`, res.status);
    }

    if (!isServer && body) {
      if (body.token || body.sessionId) {
        setStoredToken(body.token || body.sessionId);
      }
      if (body.user !== undefined) {
        setCachedUser(body.user);
      }
    }

    return body as T;
  }

  throw new Error("Request failed");
}
