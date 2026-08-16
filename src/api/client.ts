// Backend API base URL, resolved from environment:
// - Browser: VITE_API_URL is inlined at build time by Vite (see .env.example)
// - SSR: API_URL is read at runtime on the deploy host, falling back to VITE_API_URL
// - Local dev: both unset → http://localhost:4000 (the local `npm run dev:api` server)
const LOCAL_API_URL = "http://localhost:4000";

const SSR_FETCH_TIMEOUT_MS = 15_000;
const SSR_FETCH_RETRIES = 2;
const SSR_RETRY_BACKOFF_MS = [300, 800];

function getBackendUrl(): string {
  const viteApiUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (typeof window === "undefined") {
    return process.env.API_URL || viteApiUrl || LOCAL_API_URL;
  }
  return viteApiUrl || LOCAL_API_URL;
}

// Forward the incoming browser request's cookies to the backend during SSR.
// Without this, server-rendered pages (and any full page reload) always see an
// anonymous user even when a valid session cookie exists.
async function getServerRequestCookie(): Promise<string | null> {
  const { getStartContext } = await import("@tanstack/start-storage-context");
  const context = getStartContext({ throwIfNotFound: false });
  return context?.request.headers.get("cookie") ?? null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${getBackendUrl()}/api${path}`;
  const isServer = typeof window === "undefined";

  let headers: HeadersInit | undefined = options?.headers;
  let credentials: RequestCredentials | undefined;

  if (isServer) {
    const cookie = await getServerRequestCookie();
    if (cookie) {
      headers = { ...(options?.headers ?? {}), cookie };
    }
  } else {
    credentials = "include";
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

    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(body.error || `Request failed: ${res.status}`);
    }

    return body as T;
  }

  throw new Error("Request failed");
}
