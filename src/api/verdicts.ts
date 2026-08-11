import { apiFetch } from "./client";

export function submitVerdictFn({ data }: { data: { toUsername: string; score: number; comment: string } }) {
  return apiFetch<any>("/verdicts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getUserVerdictsFn({ data }: { data: { username: string } }) {
  return apiFetch<any>(`/verdicts/user/${data.username}`);
}
