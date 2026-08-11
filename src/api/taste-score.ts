import { apiFetch } from "./client";

export interface TasteBreakdown {
  diversity: number;
  obscurity: number;
  consistency: number;
}

export function getTasteScoreFn({ data }: { data: { username: string } }) {
  const params = new URLSearchParams({ username: data.username });
  return apiFetch<any>(`/taste-score?${params}`);
}
