import { apiFetch } from "./client";
import type { FilmPage, WatchedEntry } from "@/lib/types";

export function searchMoviesFn({ data }: { data: { query: string; page?: number } }) {
  const params = new URLSearchParams({ q: data.query });
  if (data.page) params.set("page", String(data.page));
  return apiFetch<any>(`/movies/search?${params}`);
}

export function addToWatchedFn({
  data,
}: {
  data: {
    imdbId: string;
    title: string;
    year: string;
    posterUrl: string | null;
    rating: number;
    note?: string;
  };
}) {
  return apiFetch<any>("/movies/watched", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getCurrentUserWatchedFn() {
  return apiFetch<any>("/movies/me/watched");
}

export function removeWatchedFn({ data }: { data: { entryId: string } }) {
  return apiFetch<any>(`/movies/watched/${data.entryId}`, {
    method: "DELETE",
  });
}

export function updateWatchedEntryFn({
  data,
}: {
  data: { entryId: string; rating?: number; note?: string | null };
}) {
  const { entryId, ...body } = data;
  return apiFetch<{ entry: WatchedEntry }>(`/movies/watched/${entryId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export function getUserWatchedFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/movies/user/${data.username}`);
}

export function getFilmFn({ data }: { data: { imdbId: string } }) {
  return apiFetch<FilmPage>(`/movies/film/${data.imdbId}`);
}
