import { apiFetch } from "./client";

export function followUserFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}`, {
    method: "POST",
  });
}

export function unfollowUserFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}`, {
    method: "DELETE",
  });
}

export function getFollowStatusFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}/status`);
}

export function getFollowCountsFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}/counts`);
}

export function getFollowersListFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}/followers`);
}

export function getFollowingListFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/follows/${data.username}/following`);
}
