import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const RECENT_SEARCHES_KEY = "verdict_recent_searches";
const MAX_RECENT_SEARCHES = 8;

let memorySearches: string[] | null = null;

export async function getRecentSearches(): Promise<string[]> {
  if (memorySearches) return memorySearches;
  try {
    let raw: string | null = null;
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
      }
    } else {
      raw = await SecureStore.getItemAsync(RECENT_SEARCHES_KEY);
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memorySearches = parsed;
        return parsed;
      }
    }
    return [];
  } catch {
    return [];
  }
}

export async function addRecentSearch(query: string): Promise<string[]> {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return memorySearches || [];

  try {
    const current = await getRecentSearches();
    const filtered = current.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
    const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
    memorySearches = updated;

    const serialized = JSON.stringify(updated);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, serialized);
      }
    } else {
      await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, serialized);
    }
    return updated;
  } catch {
    return memorySearches || [];
  }
}

export async function removeRecentSearch(query: string): Promise<string[]> {
  try {
    const current = await getRecentSearches();
    const updated = current.filter((item) => item.toLowerCase() !== query.toLowerCase());
    memorySearches = updated;

    const serialized = JSON.stringify(updated);
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(RECENT_SEARCHES_KEY, serialized);
      }
    } else {
      await SecureStore.setItemAsync(RECENT_SEARCHES_KEY, serialized);
    }
    return updated;
  } catch {
    return memorySearches || [];
  }
}

export async function clearRecentSearches(): Promise<void> {
  memorySearches = [];
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(RECENT_SEARCHES_KEY);
      }
    } else {
      await SecureStore.deleteItemAsync(RECENT_SEARCHES_KEY);
    }
  } catch {}
}
