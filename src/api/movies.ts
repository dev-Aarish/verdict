import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { movies, watchedEntries, users, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

let _cachedKey: string | null = null;
function getApiKey() {
  if (_cachedKey) return _cachedKey;

  const key = process.env.OMDB_API_KEY;
  if (key && key.length > 0) {
    _cachedKey = key;
    return key;
  }

  throw new Error("OMDb API key not configured — add OMDB_API_KEY=your_key to .env");
}

interface OmdbSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

interface OmdbDetailResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Genre: string;
  Director: string;
  Country: string;
  Plot: string;
}

export const searchMoviesFn = createServerFn({ method: "GET" })
  .validator((data: { query: string; page?: number }) => data)
  .handler(async ({ data }) => {
    const key = getApiKey();
    const page = data.page && data.page > 0 ? data.page : 1;
    const urlStr = `https://www.omdbapi.com/?apikey=${key}&s=${encodeURIComponent(data.query)}&type=movie&page=${page}`;

    const res = await fetch(urlStr);
    const json = await res.json();

    if (json.Response === "False") {
      return {
        results: [] as OmdbSearchResult[],
        totalResults: 0,
        totalPages: 0,
        page: 1,
        error: json.Error,
      };
    }

    const totalResults = parseInt(json.totalResults, 10) || 0;
    const totalPages = Math.min(Math.ceil(totalResults / 10), 100);

    return {
      results: json.Search as OmdbSearchResult[],
      totalResults,
      totalPages,
      page,
      error: null,
    };
  });

export const addToWatchedFn = createServerFn({ method: "POST" })
  .validator((data: { imdbId: string; title: string; year: string; posterUrl: string | null; rating: number; note?: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) throw new Error("Not authenticated");

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) throw new Error("Invalid session");
    const userId = session.userId;

    let movie = await db.select().from(movies).where(eq(movies.imdbId, data.imdbId)).then(r => r[0]);

    if (!movie) {
      const key = getApiKey();
      const url = new URL("https://www.omdbapi.com/");
      url.searchParams.set("apikey", key);
      url.searchParams.set("i", data.imdbId);
      url.searchParams.set("type", "movie");

      const res = await fetch(url.toString());
      const detail = await res.json() as OmdbDetailResult & { Response?: string; Error?: string };

      if (detail.Response === "False") {
        throw new Error(detail.Error || "Failed to fetch movie details");
      }

      const movieId = uuidv4();
      const inserted = await db.insert(movies).values({
        id: movieId,
        imdbId: data.imdbId,
        title: detail.Title || data.title,
        year: detail.Year || data.year,
        posterUrl: detail.Poster && detail.Poster !== "N/A" ? detail.Poster : data.posterUrl,
        genres: detail.Genre && detail.Genre !== "N/A" ? detail.Genre : null,
        director: detail.Director && detail.Director !== "N/A" ? detail.Director : null,
        country: detail.Country && detail.Country !== "N/A" ? detail.Country : null,
      }).returning();
      movie = inserted[0];
    }

    const existing = await db.select().from(watchedEntries).where(
      and(eq(watchedEntries.userId, userId), eq(watchedEntries.movieId, movie.id))
    ).then(r => r[0]);

    if (existing) throw new Error("Movie already in watched list");

    const entry = await db.insert(watchedEntries).values({
      id: uuidv4(),
      userId,
      movieId: movie.id,
      rating: data.rating,
      note: data.note || null,
    }).returning().then(r => r[0]);

    return { entry, movie };
  });

export const getCurrentUserWatchedFn = createServerFn({ method: "GET" })
  .handler(async () => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) return { entries: [] };

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) return { entries: [] };

    const entries = await db.select().from(watchedEntries)
      .where(eq(watchedEntries.userId, session.userId))
      .then(r => r);

    const movieIds = entries.map(e => e.movieId);
    if (movieIds.length === 0) return { entries: [] };

    const movieList = await db.select().from(movies)
      .where(inArray(movies.id, movieIds))
      .then(r => r);

    const movieMap = new Map(movieList.map(m => [m.id, m]));

    const result = entries.map(entry => {
      const movie = movieMap.get(entry.movieId);
      return {
        imdbId: movie?.imdbId || null,
        rating: entry.rating,
      };
    }).filter(e => e.imdbId !== null);

    return { entries: result };
  });

export const removeWatchedFn = createServerFn({ method: "POST" })
  .validator((data: { entryId: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) throw new Error("Not authenticated");

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) throw new Error("Invalid session");

    const entry = await db.select().from(watchedEntries).where(eq(watchedEntries.id, data.entryId)).then(r => r[0]);
    if (!entry || entry.userId !== session.userId) throw new Error("Not authorized");

    await db.delete(watchedEntries).where(eq(watchedEntries.id, data.entryId));
    return { success: true };
  });

export const getUserWatchedFn = createServerFn({ method: "GET" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const user = await db.select().from(users).where(eq(users.username, data.username)).then(r => r[0]);
    if (!user) throw new Error("User not found");

    const entries = await db.select().from(watchedEntries)
      .where(eq(watchedEntries.userId, user.id))
      .orderBy(watchedEntries.watchedAt)
      .then(r => r);

    const movieIds = entries.map(e => e.movieId);
    if (movieIds.length === 0) return { user, entries: [] };

    const movieList = await db.select().from(movies)
      .where(inArray(movies.id, movieIds))
      .then(r => r);

    const movieMap = new Map(movieList.map(m => [m.id, m]));

    const result = entries.map(entry => ({
      ...entry,
      movie: movieMap.get(entry.movieId) || null,
    }));

    return { user, entries: result };
  });
