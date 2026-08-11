import { apiFetch } from "./client";

export function followUserFn({ data }: { data: { username: string } }) {
  return apiFetch<any>("/follows/follow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function unfollowUserFn({ data }: { data: { username: string } }) {
  return apiFetch<any>("/follows/unfollow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getFollowStatusFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/follows/status?${params}`);
}

export function getFollowCountsFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/follows/counts?${params}`);
}

export function getFollowersListFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/follows/followers?${params}`);
}

export function getFollowingListFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/follows/following?${params}`);
}
