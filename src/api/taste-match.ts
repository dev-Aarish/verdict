import { apiFetch } from "./client";

export interface TasteMatch {
  sharedFilms: number;
  agreement: number;
  correlation: number | null;
}

export function getTasteMatchFn({ data }: { data: { username: string } }) {
  return apiFetch<{ match: TasteMatch | null }>(`/users/${data.username}/taste-match`);
}
