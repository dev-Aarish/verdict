export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt?: string | null;
}

export interface Movie {
  id: string;
  imdbId: string;
  title: string;
  year?: number | string | null;
  posterUrl?: string | null;
  genres?: string[] | string | null;
  director?: string | null;
  country?: string | null;
  plot?: string | null;
  actors?: string | null;
  runtime?: number | string | null;
  rated?: string | null;
  released?: string | null;
  writer?: string | null;
  language?: string | null;
  awards?: string | null;
  boxOffice?: string | null;
  imdbRating?: string | null;
  imdbVotes?: string | null;
  production?: string | null;
  dvd?: string | null;
  website?: string | null;
}

export interface FilmCommunityEntry {
  user: User | null;
  rating: number;
  note: string | null;
  watchedAt?: string | null;
}

export interface FilmStats {
  total: number;
  average: number | null;
  freshCount: number;
  freshPercent: number | null;
  status: "fresh" | "rotten" | "mixed" | null;
}

export interface MovieDetailResponse {
  movie: Movie;
  community: FilmCommunityEntry[];
  stats: FilmStats;
}

export function parseGenres(genres: any): string[] {
  if (!genres) return [];
  if (Array.isArray(genres)) {
    return genres.map((g) => (typeof g === "string" ? g.trim() : String(g))).filter(Boolean);
  }
  if (typeof genres === "string") {
    const trimmed = genres.trim();
    if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.map((g) => (typeof g === "string" ? g.trim() : String(g))).filter(Boolean);
        }
      } catch {}
    }
    return trimmed
      .split(",")
      .map((g) => g.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatRuntime(runtime: number | string | null | undefined): string | null {
  if (runtime === null || runtime === undefined || runtime === "" || runtime === "N/A") {
    return null;
  }

  let totalMinutes: number | null = null;

  if (typeof runtime === "number") {
    totalMinutes = runtime;
  } else if (typeof runtime === "string") {
    const trimmed = runtime.trim();
    if (!trimmed || trimmed === "N/A") return null;

    const hoursMatch = trimmed.match(/^(\d+)\s*(?:h|hr|hours?)(?:\s*(\d+)\s*(?:m|min|mins|minutes?)?)?$/i);
    if (hoursMatch) {
      const h = parseInt(hoursMatch[1], 10);
      const m = hoursMatch[2] ? parseInt(hoursMatch[2], 10) : 0;
      totalMinutes = h * 60 + m;
    } else {
      const numMatch = trimmed.match(/\d+/);
      if (numMatch) {
        totalMinutes = parseInt(numMatch[0], 10);
      }
    }
  }

  if (totalMinutes === null || isNaN(totalMinutes) || totalMinutes <= 0) {
    return null;
  }

  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;

  if (hours === 0) {
    return `${mins}m`;
  }
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}


export interface WatchedEntry {
  id: string;
  userId: string;
  movieId: string;
  rating: number; // 1 - 100 or 1 - 10
  note?: string | null;
  review?: string | null;
  watchedAt?: string;
  createdAt?: string;
  movie?: Movie;
}

export interface TasteScoreBreakdown {
  diversity: number; // 0 - 100
  obscurity: number; // 0 - 100
  consistency: number; // 0 - 100
  total: number; // 0 - 100
  dominantGenres?: { genre: string; count: number; percentage: number }[];
  obscurityTier?: "Mainstream" | "Curator" | "Deep Cut" | "Cinephile";
  totalWatched?: number;
  averageRating?: number;
}

export interface Verdict {
  id: string;
  authorId: string;
  targetUserId: string;
  rating: number; // 1-5 or 1-100
  comment?: string | null;
  createdAt: string;
  author?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  targetUser?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
}

export interface FeedItem {
  id: string;
  type: "verdict" | "watched" | "follow";
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  movie?: Movie;
  rating?: number;
  comment?: string | null;
  targetUser?: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };
  tasteScore?: number;
}

export interface TasteMatch {
  score: number; // 0 - 100%
  sharedFavorites: Movie[];
  divergence: number;
  summary: string;
}

export interface WatchlistEntry {
  id: string;
  userId: string;
  movieId: string;
  notes?: string | null;
  addedAt: string;
  movie?: Movie;
}
