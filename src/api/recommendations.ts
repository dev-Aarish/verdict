import { apiFetch } from "./client";
import type { RecommendationWithDetails } from "@/lib/types";

export interface SendRecommendationInput {
  toUserId?: string;
  toUsername?: string;
  imdbId: string;
  title?: string;
  year?: string;
  posterUrl?: string | null;
  note?: string;
}

export function sendRecommendationFn({ data }: { data: SendRecommendationInput }) {
  return apiFetch<{ recommendation: RecommendationWithDetails }>("/recommendations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function getReceivedRecommendationsFn(params?: { status?: string }) {
  const query = params?.status ? `?status=${encodeURIComponent(params.status)}` : "";
  return apiFetch<{
    recommendations: RecommendationWithDetails[];
    unreadCount: number;
    pendingCount: number;
  }>(`/recommendations/received${query}`);
}

export function markRecommendationViewedFn({ id }: { id: string }) {
  return apiFetch<{ success: boolean; viewedAt: string }>(`/recommendations/${id}/view`, {
    method: "PATCH",
  });
}

export function getSentRecommendationsFn() {
  return apiFetch<{
    recommendations: RecommendationWithDetails[];
  }>("/recommendations/sent");
}

export function acceptRecommendationFn({ id }: { id: string }) {
  return apiFetch<{
    success: boolean;
    recommendation: any;
    watchlistEntry?: { id: string; userId: string; movieId: string };
  }>(`/recommendations/${id}/accept`, {
    method: "PATCH",
  });
}

export function dismissRecommendationFn({ id }: { id: string }) {
  return apiFetch<{ success: boolean; recommendation: any }>(`/recommendations/${id}/dismiss`, {
    method: "PATCH",
  });
}

export function deleteRecommendationFn({ id }: { id: string }) {
  return apiFetch<{ success: boolean }>(`/recommendations/${id}`, {
    method: "DELETE",
  });
}
