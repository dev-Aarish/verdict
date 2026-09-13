import { apiFetch } from "./client";
import type {
  User,
  UserSafe,
  WatchedEntryWithMovie,
  WatchlistEntryWithMovie,
  VerdictWithUser,
} from "@/lib/types";
import type { TasteBreakdown } from "./taste-score";
import type { TasteMatch } from "./taste-match";

export interface UserProfileData {
  user: User;
  entries: WatchedEntryWithMovie[];
  watchlist: WatchlistEntryWithMovie[];
  tasteScore: { score: number; breakdown: TasteBreakdown } | null;
  verdicts: VerdictWithUser[];
  isFollowing: boolean;
  followCounts: { followers: number; following: number } | null;
  tasteMatch: TasteMatch | null;
}

export function getUserProfileFn({ data }: { data: { username: string } }) {
  return apiFetch<UserProfileData>(`/users/${data.username}/profile`);
}

export function searchUsersFn({ data }: { data: { query: string } }) {
  const params = new URLSearchParams({ q: data.query });
  return apiFetch<any>(`/users/search?${params}`);
}

export function updateProfileFn({ data }: { data: { bio?: string; avatarUrl?: string | null } }) {
  return apiFetch<{ user: UserSafe }>("/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

