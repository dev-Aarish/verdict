import { apiFetch } from "./client";

export interface TasteBreakdown {
  diversity: number;
  obscurity: number;
  consistency: number;
}

export function getTasteScoreFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/users/${data.username}/taste-score`);
}
