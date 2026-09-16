import { apiClient, setAuthToken, removeAuthToken } from "./client";
import {
  User,
  Movie,
  WatchedEntry,
  TasteScoreBreakdown,
  Verdict,
  FeedItem,
  TasteMatch,
  WatchlistEntry,
} from "../types";

// Auth API
export const authApi = {
  async getMe(): Promise<User | null> {
    const res = await apiClient.get<{ user: User | null }>("/auth/me");
    return res.data.user;
  },

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<{ user: User; token: string }>("/auth/login", {
      email,
      password,
    });
    if (res.data.token) {
      await setAuthToken(res.data.token);
    }
    return res.data;
  },

  async signup(
    username: string,
    email: string,
    password: string,
    bio?: string
  ): Promise<{ user: User; token: string }> {
    const res = await apiClient.post<{ user: User; token: string }>("/auth/signup", {
      username,
      email,
      password,
      bio,
    });
    if (res.data.token) {
      await setAuthToken(res.data.token);
    }
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      await removeAuthToken();
    }
  },
};

// Movies API
export const moviesApi = {
  async search(query: string): Promise<Movie[]> {
    if (!query.trim()) return [];
    const res = await apiClient.get<{
      results?: Array<{
        imdbID?: string;
        Title?: string;
        Year?: string;
        Poster?: string;
        Type?: string;
      }>;
      movies?: Movie[];
    }>(`/movies/search`, {
      params: { q: query },
    });

    if (res.data.results && Array.isArray(res.data.results)) {
      return res.data.results.map((r) => ({
        id: r.imdbID || "",
        imdbId: r.imdbID || "",
        title: r.Title || "Unknown",
        year: r.Year || "",
        posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
      }));
    }

    return res.data.movies || [];
  },

  async getDetail(imdbId: string): Promise<Movie> {
    const res = await apiClient.get<{ movie: Movie; stats?: any }>(`/movies/film/${imdbId}`);
    return res.data.movie;
  },

  async getMyWatched(): Promise<WatchedEntry[]> {
    const res = await apiClient.get<{ entries: any[] }>("/movies/me/watched");
    return (res.data.entries || []).map((e) => ({
      id: e.id || e.imdbId,
      userId: "",
      movieId: e.imdbId,
      rating: (e.rating || 0) * 10,
      movie: {
        id: e.imdbId,
        imdbId: e.imdbId,
        title: e.title || "Film",
        posterUrl: e.posterUrl,
      },
    }));
  },

  async logMovie(params: {
    imdbId: string;
    rating: number; // 1-100 or 1-10
    review?: string;
  }): Promise<WatchedEntry> {
    // Backend expects rating 1-10 integer
    const numericRating = Math.max(1, Math.min(10, Math.round(params.rating > 10 ? params.rating / 10 : params.rating)));
    const res = await apiClient.post<{ entry: WatchedEntry; movie?: Movie }>("/movies/watched", {
      imdbId: params.imdbId,
      rating: numericRating,
      note: params.review,
    });
    return res.data.entry;
  },

  async deleteWatched(entryId: string): Promise<void> {
    await apiClient.delete(`/movies/watched/${entryId}`);
  },

  async getTrending(): Promise<Movie[]> {
    try {
      const res = await apiClient.get<{
        results?: Array<{
          imdbID?: string;
          Title?: string;
          Year?: string;
          Poster?: string;
        }>;
      }>("/movies/trending");

      if (res.data.results && res.data.results.length > 0) {
        return res.data.results.map((r) => ({
          id: r.imdbID || "",
          imdbId: r.imdbID || "",
          title: r.Title || "Latest Hit",
          year: r.Year || "",
          posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
        }));
      }
    } catch {}

    // Fallback: search curated blockbusters and acclaimed latest hits via search endpoint
    try {
      const hitTitles = [
        "Oppenheimer",
        "Dune Part Two",
        "Gladiator II",
        "Wicked",
        "Deadpool Wolverine",
        "Inside Out 2",
        "Civil War",
        "Furiosa",
        "The Substance",
        "Challengers",
      ];
      const hitsMap = new Map<string, Movie>();

      await Promise.all(
        hitTitles.map(async (q) => {
          try {
            const res = await apiClient.get<{
              results?: Array<{
                imdbID?: string;
                Title?: string;
                Year?: string;
                Poster?: string;
              }>;
            }>("/movies/search", { params: { q } });

            const item = res.data?.results?.[0];
            if (item && item.imdbID && !hitsMap.has(item.imdbID)) {
              hitsMap.set(item.imdbID, {
                id: item.imdbID,
                imdbId: item.imdbID,
                title: item.Title || "Hit Film",
                year: item.Year || "",
                posterUrl: item.Poster && item.Poster !== "N/A" ? item.Poster : null,
              });
            }
          } catch {}
        })
      );

      if (hitsMap.size > 0) {
        return Array.from(hitsMap.values());
      }
    } catch {}

    return [];
  },

  async getUpcoming(): Promise<Movie[]> {
    try {
      const res = await apiClient.get<{
        results?: Array<{
          imdbID?: string;
          Title?: string;
          Year?: string;
          Poster?: string;
        }>;
      }>("/movies/upcoming");

      if (res.data.results && res.data.results.length > 0) {
        return res.data.results.map((r) => ({
          id: r.imdbID || "",
          imdbId: r.imdbID || "",
          title: r.Title || "Upcoming Movie",
          year: r.Year || "",
          posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
        }));
      }
    } catch {}

    // Fallback: search upcoming and anticipated films via search endpoint
    try {
      const upcomingTitles = [
        "Avatar Fire and Ash",
        "Avengers Doomsday",
        "Superman",
        "The Batman Part II",
        "Tron Ares",
        "Spider-Man Beyond the Spider-Verse",
        "Toy Story 5",
        "Jurassic World Rebirth",
        "Fantastic Four",
        "Shrek 5",
      ];
      const upcomingMap = new Map<string, Movie>();

      await Promise.all(
        upcomingTitles.map(async (q) => {
          try {
            const res = await apiClient.get<{
              results?: Array<{
                imdbID?: string;
                Title?: string;
                Year?: string;
                Poster?: string;
              }>;
            }>("/movies/search", { params: { q } });

            const item = res.data?.results?.[0];
            if (item && item.imdbID && !upcomingMap.has(item.imdbID)) {
              upcomingMap.set(item.imdbID, {
                id: item.imdbID,
                imdbId: item.imdbID,
                title: item.Title || "Upcoming Movie",
                year: item.Year || "",
                posterUrl: item.Poster && item.Poster !== "N/A" ? item.Poster : null,
              });
            }
          } catch {}
        })
      );

      if (upcomingMap.size > 0) {
        return Array.from(upcomingMap.values());
      }
    } catch {}

    return [];
  },
};

// Users & Full Profile API
export const usersApi = {
  async getFullProfile(username: string): Promise<{
    user: User;
    entries: WatchedEntry[];
    watchlist: WatchlistEntry[];
    tasteScore: TasteScoreBreakdown | null;
    verdicts: Verdict[];
    isFollowing: boolean;
    followCounts: { followers: number; following: number };
    tasteMatch: TasteMatch | null;
  }> {
    const res = await apiClient.get<any>(`/users/${username}/profile`);
    const data = res.data;

    let scoreBreakdown: TasteScoreBreakdown | null = null;
    if (data.tasteScore) {
      const bd = data.tasteScore.breakdown || {};
      scoreBreakdown = {
        total: data.tasteScore.score ?? 0,
        diversity: bd.diversity ?? 0,
        obscurity: bd.obscurity ?? 0,
        consistency: bd.consistency ?? 0,
        dominantGenres: bd.dominantGenres || [],
        obscurityTier: bd.obscurityTier,
        totalWatched: bd.totalWatched,
        averageRating: bd.averageRating,
      };
    }

    const formattedVerdicts: Verdict[] = (data.verdicts || []).map((v: any) => ({
      id: v.id,
      authorId: v.fromUserId,
      targetUserId: v.toUserId,
      rating: v.score,
      comment: v.comment,
      createdAt: v.createdAt,
      author: v.fromUser,
    }));

    const formattedWatched: WatchedEntry[] = (data.entries || []).map((e: any) => ({
      id: e.id,
      userId: e.userId,
      movieId: e.movieId,
      rating: e.rating * 10,
      note: e.note,
      watchedAt: e.watchedAt,
      movie: e.movie,
    }));

    return {
      user: data.user,
      entries: formattedWatched,
      watchlist: data.watchlist || [],
      tasteScore: scoreBreakdown,
      verdicts: formattedVerdicts,
      isFollowing: !!data.isFollowing,
      followCounts: data.followCounts || { followers: 0, following: 0 },
      tasteMatch: data.tasteMatch || null,
    };
  },

  async getProfile(username: string): Promise<User> {
    const full = await usersApi.getFullProfile(username);
    return full.user;
  },

  async getUserWatched(username: string): Promise<WatchedEntry[]> {
    const full = await usersApi.getFullProfile(username);
    return full.entries;
  },

  async getUserVerdicts(username: string): Promise<Verdict[]> {
    const full = await usersApi.getFullProfile(username);
    return full.verdicts;
  },

  async getTasteScore(username: string): Promise<TasteScoreBreakdown | null> {
    const full = await usersApi.getFullProfile(username);
    return full.tasteScore;
  },

  async getTasteMatch(username: string): Promise<TasteMatch | null> {
    const full = await usersApi.getFullProfile(username);
    return full.tasteMatch;
  },

  async getLeaderboard(): Promise<
    { user: User; tasteScore: TasteScoreBreakdown; rank: number }[]
  > {
    try {
      const res = await apiClient.get<any[]>("/feed/leaderboard");
      return (res.data || []).map((item, index) => ({
        user: item.user,
        tasteScore: {
          total: item.score ?? 0,
          diversity: item.breakdown?.diversity ?? 0,
          obscurity: item.breakdown?.obscurity ?? 0,
          consistency: item.breakdown?.consistency ?? 0,
        },
        rank: index + 1,
      }));
    } catch {
      return [];
    }
  },
};

// Verdicts API
export const verdictsApi = {
  async leaveVerdict(params: {
    toUsername: string;
    targetUserId?: string;
    rating: number; // 1-5 or 1-10
    comment?: string;
  }): Promise<Verdict> {
    // Backend takes 1-10 score
    const score = Math.max(1, Math.min(10, Math.round(params.rating <= 5 ? params.rating * 2 : params.rating)));
    const res = await apiClient.post<{ verdict: Verdict }>("/verdicts", {
      toUsername: params.toUsername,
      score,
      comment: params.comment,
    });
    return res.data.verdict;
  },
};

// Follows API
export const followsApi = {
  async getFollowStatus(username: string): Promise<{ isFollowing: boolean }> {
    const full = await usersApi.getFullProfile(username);
    return { isFollowing: full.isFollowing };
  },

  async follow(username: string): Promise<void> {
    await apiClient.post(`/follows/${username}`);
  },

  async unfollow(username: string): Promise<void> {
    await apiClient.delete(`/follows/${username}`);
  },
};

// Feed API
export const feedApi = {
  async getFeed(): Promise<FeedItem[]> {
    try {
      const res = await apiClient.get<{ verdicts: any[] }>("/feed/verdicts");
      return (res.data.verdicts || []).map((v) => ({
        id: v.id,
        type: "verdict",
        createdAt: v.createdAt,
        user: v.fromUser || { id: "unknown", username: "anonymous" },
        rating: v.score,
        comment: v.comment,
        targetUser: v.toUser,
      }));
    } catch {
      return [];
    }
  },
};

// Watchlist API
export const watchlistApi = {
  async getWatchlist(): Promise<WatchlistEntry[]> {
    const res = await apiClient.get<{ entries: WatchlistEntry[] }>("/watchlist/me");
    return res.data.entries || [];
  },

  async addToWatchlist(imdbId: string): Promise<WatchlistEntry> {
    const res = await apiClient.post<{ entry: WatchlistEntry }>("/watchlist", {
      imdbId,
    });
    return res.data.entry;
  },

  async removeFromWatchlist(entryId: string): Promise<void> {
    await apiClient.delete(`/watchlist/${entryId}`);
  },
};
