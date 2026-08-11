import { apiFetch } from "./client";

export function getFeedVerdictsFn({ data }: { data?: { limit?: number; filter?: "all" | "following" } }) {
  const params = new URLSearchParams();
  if (data?.limit) params.set("limit", String(data.limit));
  if (data?.filter) params.set("filter", data.filter);
  const qs = params.toString();
  return apiFetch<any>(`/feed/verdicts${qs ? `?${qs}` : ""}`);
}

export function getLeaderboardFn() {
  return apiFetch<any>("/feed/leaderboard");
}
