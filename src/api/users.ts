import { apiFetch } from "./client";

export function searchUsersFn({ data }: { data: { query: string } }) {
  const params = new URLSearchParams({ q: data.query });
  return apiFetch<any>(`/users/search?${params}`);
}
