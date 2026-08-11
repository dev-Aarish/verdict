// TODO: Switch to env var once build pipeline supports import.meta.env / vite define
const BACKEND_URL = "https://verdict-api-cgu6.onrender.com";

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let url: string;
  let init: RequestInit = { ...options };

  if (typeof window === "undefined") {
    url = `${process.env.API_URL || BACKEND_URL}${path}`;
    init = { ...init, signal: AbortSignal.timeout(10000) };
  } else {
    url = `${BACKEND_URL}/api${path}`;
    init = { ...init, credentials: "include" };
  }

  const res = await fetch(url, init);
  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return body as T;
}
