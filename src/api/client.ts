export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let url: string;
  let init: RequestInit = { ...options };

  if (typeof window === "undefined") {
    url = `${process.env.API_URL}${path}`;
    init = { ...init, signal: AbortSignal.timeout(10000) };
  } else {
    url = `/api${path}`;
    init = { ...init, credentials: "include" };
  }

  const res = await fetch(url, init);
  const body = await res.json();

  if (!res.ok) {
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  return body as T;
}
