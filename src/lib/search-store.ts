export type SearchTab = "films" | "people";

export interface MovieSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  filmCount: number;
}

export interface PersistedSearchState {
  tab: SearchTab;
  query: string;
  results: MovieSearchResult[];
  userResults: UserSearchResult[];
  currentPage: number;
  totalPages: number;
  totalResults: number;
}

const STORAGE_KEY = "verdict_search_state_v1";

let memorySearchState: PersistedSearchState | null = null;

export function getPersistedSearch(): PersistedSearchState | null {
  if (memorySearchState) {
    return memorySearchState;
  }
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedSearchState;
    if (parsed && typeof parsed.query === "string") {
      memorySearchState = parsed;
      return parsed;
    }
  } catch {
    // sessionStorage quota or parse error
  }
  return null;
}

export function setPersistedSearch(state: PersistedSearchState | null): void {
  memorySearchState = state;
  if (typeof window === "undefined") return;
  try {
    if (!state || (!state.query && state.results.length === 0 && state.userResults.length === 0)) {
      sessionStorage.removeItem(STORAGE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }
  } catch {
    // ignore quota/storage errors
  }
}

export function clearPersistedSearch(): void {
  setPersistedSearch(null);
}

export function updateSearchUrl(query: string, tab: SearchTab, page: number): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams();
  const trimmed = query.trim();
  if (trimmed) params.set("q", trimmed);
  if (tab !== "films") params.set("tab", tab);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  const nextUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  if (window.location.pathname + window.location.search !== nextUrl) {
    window.history.replaceState(null, "", nextUrl);
  }
}
