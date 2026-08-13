import { apiFetch } from "./client";
import type { Movie, WatchlistEntry, WatchlistEntryWithMovie, UserSafe } from "@/lib/types";

export function addToWatchlistFn({
  data,
}: {
  data: {
    imdbId: string;
    title: string;
    year: string;
    posterUrl: string | null;
  };
}) {
  return apiFetch<{ entry: WatchlistEntry; movie: Movie }>("/watchlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function removeWatchlistFn({ data }: { data: { entryId: string } }) {
  return apiFetch<{ success: boolean }>(`/watchlist/${data.entryId}`, {
    method: "DELETE",
  });
}

export function getCurrentUserWatchlistFn() {
  return apiFetch<{ entries: WatchlistEntryWithMovie[] }>("/watchlist/me");
}

export function getUserWatchlistFn({ data }: { data: { username: string } }) {
  return apiFetch<{ user: UserSafe; entries: WatchlistEntryWithMovie[] }>(
    `/watchlist/user/${data.username}`,
  );
}
