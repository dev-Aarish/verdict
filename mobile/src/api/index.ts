import { apiClient, setAuthToken, removeAuthToken, prewarmBackend } from "./client";
export { prewarmBackend } from "./client";
import {
  User,
  Movie,
  WatchedEntry,
  TasteScoreBreakdown,
  Verdict,
  FeedItem,
  TasteMatch,
  WatchlistEntry,
  MovieDetailResponse,
  FilmCommunityEntry,
  FilmStats,
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
    } catch {
      // Ignored: network failure should not prevent local logout
    } finally {
      await removeAuthToken();
    }
  },
};

export interface SearchMoviesParams {
  query?: string;
  genreId?: number;
  keywordId?: number;
  page?: number;
}

export interface SearchMoviesResponse {
  results: Movie[];
  totalResults: number;
  totalPages: number;
  page: number;
}

// Movies API
export const moviesApi = {
  async search(
    paramsOrQuery: string | SearchMoviesParams,
    legacyGenreId?: number,
    legacyPage: number = 1,
  ): Promise<SearchMoviesResponse> {
    const params: SearchMoviesParams =
      typeof paramsOrQuery === "string"
        ? { query: paramsOrQuery, genreId: legacyGenreId, page: legacyPage }
        : paramsOrQuery;

    const query = (params.query || "").trim();
    const page = params.page || 1;
    const genreId = params.genreId;
    const keywordId = params.keywordId;

    if (!query && !genreId && !keywordId) {
      return { results: [], totalResults: 0, totalPages: 0, page: 1 };
    }

    const res = await apiClient.get<{
      results?: Array<{
        imdbID?: string;
        Title?: string;
        Year?: string;
        Poster?: string;
        Type?: string;
        plot?: string | null;
        genres?: string | null;
        imdbRating?: string | null;
        language?: string | null;
      }>;
      totalResults?: number;
      totalPages?: number;
      page?: number;
    }>(`/movies/search`, {
      params: {
        q: query,
        page,
        ...(genreId ? { genreId } : {}),
        ...(keywordId ? { keywordId } : {}),
      },
    });

    const mappedResults: Movie[] = (res.data.results || []).map((r) => ({
      id: r.imdbID || "",
      imdbId: r.imdbID || "",
      title: r.Title || "Unknown",
      year: r.Year || "",
      posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
      plot: r.plot || null,
      genres: r.genres || null,
      imdbRating: r.imdbRating || null,
      language: r.language || null,
    }));

    return {
      results: mappedResults,
      totalResults: res.data.totalResults ?? mappedResults.length,
      totalPages: res.data.totalPages ?? 1,
      page: res.data.page ?? page,
    };
  },

  async getDetail(imdbId: string): Promise<MovieDetailResponse> {
    const res = await apiClient.get<MovieDetailResponse>(`/movies/film/${imdbId}`);
    return res.data;
  },

  async getMyWatched(): Promise<WatchedEntry[]> {
    const res = await apiClient.get<{ entries: any[] }>("/movies/me/watched");
    return (res.data.entries || []).map((e) => ({
      id: e.id || e.imdbId,
      userId: "",
      movieId: e.imdbId,
      rating: e.rating > 10 ? Math.round(e.rating / 10) : (e.rating || 0),
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
    rating: number; // 1-10
    review?: string;
  }): Promise<WatchedEntry> {
    // Backend expects rating 1-10 integer
    const numericRating = Math.max(1, Math.min(10, Math.round(params.rating)));
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
    const res = await apiClient.get<{
      results?: Array<{
        imdbID?: string;
        Title?: string;
        Year?: string;
        Poster?: string;
        releaseDate?: string;
        plot?: string | null;
        genres?: string | null;
        imdbRating?: string | null;
        language?: string | null;
      }>;
    }>("/movies/trending");

    if (res.data.results && res.data.results.length > 0) {
      return res.data.results.map((r) => ({
        id: r.imdbID || "",
        imdbId: r.imdbID || "",
        title: r.Title || "Latest Hit",
        year: r.Year || "",
        posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
        released: r.releaseDate || null,
        plot: r.plot || null,
        genres: r.genres || null,
        imdbRating: r.imdbRating || null,
        language: r.language || null,
      }));
    }

    return [];
  },

  async getUpcoming(): Promise<Movie[]> {
    const res = await apiClient.get<{
      results?: Array<{
        imdbID?: string;
        Title?: string;
        Year?: string;
        Poster?: string;
        releaseDate?: string;
        plot?: string | null;
        genres?: string | null;
        imdbRating?: string | null;
        language?: string | null;
      }>;
    }>("/movies/upcoming");

    if (res.data.results && res.data.results.length > 0) {
      return res.data.results.map((r) => ({
        id: r.imdbID || "",
        imdbId: r.imdbID || "",
        title: r.Title || "Upcoming Movie",
        year: r.Year || "",
        posterUrl: r.Poster && r.Poster !== "N/A" ? r.Poster : null,
        released: r.releaseDate || null,
        plot: r.plot || null,
        genres: r.genres || null,
        imdbRating: r.imdbRating || null,
        language: r.language || null,
      }));
    }

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
      rating: e.rating > 10 ? Math.round(e.rating / 10) : e.rating,
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
  },

  async updateProfile(data: { bio?: string; avatarUrl?: string | null }): Promise<User> {
    const res = await apiClient.patch<{ user: User }>("/users/me", data);
    return res.data.user;
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
