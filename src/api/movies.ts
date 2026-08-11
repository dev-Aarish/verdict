import { apiFetch } from "./client";

export function searchMoviesFn({ data }: { data: { query: string; page?: number } }) {
  const params = new URLSearchParams({ s: data.query });
  if (data.page) params.set("page", String(data.page));
  return apiFetch<any>(`/movies/search?${params}`);
}

export function addToWatchedFn({ data }: { data: { imdbId: string; title: string; year: string; posterUrl: string | null; rating: number; note?: string } }) {
  return apiFetch<any>("/movies/watched", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getCurrentUserWatchedFn() {
  return apiFetch<any>("/movies/watched/me");
}

export function removeWatchedFn({ data }: { data: { entryId: string } }) {
  return apiFetch<any>("/movies/watched/remove", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getUserWatchedFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/movies/watched/user?${params}`);
}
