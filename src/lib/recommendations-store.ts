import { useState, useEffect } from "react";
import { getReceivedRecommendationsFn, markRecommendationViewedFn } from "@/api/recommendations";
import type { User } from "@/lib/types";

let cachedUnreadCount: number = (() => {
  if (typeof window !== "undefined") {
    const saved = sessionStorage.getItem("verdict_unread_recs");
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  }
  return 0;
})();

let isFetching = false;
const listeners = new Set<(count: number) => void>();

function notify(count: number) {
  cachedUnreadCount = Math.max(0, count);
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("verdict_unread_recs", String(cachedUnreadCount));
    } catch {}
  }
  listeners.forEach((listener) => listener(cachedUnreadCount));
}

export function setRecommendationUnreadCount(count: number) {
  notify(count);
}

export function decrementRecommendationCount() {
  notify(cachedUnreadCount - 1);
}

export async function markRecommendationAsCheckedOut(id: string) {
  decrementRecommendationCount();
  try {
    await markRecommendationViewedFn({ id });
  } catch (err) {
    console.error("Failed to mark recommendation as viewed:", err);
  }
}

export async function refreshRecommendationCount(userId?: string | null) {
  if (!userId || isFetching) return;
  isFetching = true;
  try {
    const res = await getReceivedRecommendationsFn({ status: "pending" });
    const count = typeof res.unreadCount === "number" ? res.unreadCount : res.pendingCount || 0;
    notify(count);
  } catch (err) {
    // Keep existing count on transient network failure
  } finally {
    isFetching = false;
  }
}

export function useRecommendationCount(user: User | null | undefined) {
  const [unreadCount, setUnreadCount] = useState<number>(() => (user ? cachedUnreadCount : 0));

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      cachedUnreadCount = 0;
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("verdict_unread_recs");
        } catch {}
      }
      return;
    }

    // Set current cached count immediately to prevent any flicker
    setUnreadCount(cachedUnreadCount);

    const handler = (count: number) => {
      setUnreadCount(count);
    };

    listeners.add(handler);

    // Initial or periodic background refresh
    refreshRecommendationCount(user.id);

    return () => {
      listeners.delete(handler);
    };
  }, [user?.id]);

  return {
    unreadCount,
    decrement: decrementRecommendationCount,
    markCheckedOut: markRecommendationAsCheckedOut,
    refresh: () => refreshRecommendationCount(user?.id),
  };
}
