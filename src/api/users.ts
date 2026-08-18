import { apiFetch } from "./client";
import type { UserSafe } from "@/lib/types";

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
