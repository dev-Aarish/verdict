import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { movies, watchedEntries, users } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { config } from "../config.js";

export const moviesRouter = Router();

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

// GET /search?q=&page=
moviesRouter.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const page = parseInt(req.query.page as string, 10) || 1;

  if (!q.trim()) {
    res.json({ results: [], totalResults: 0, totalPages: 0, page: 1, error: null });
    return;
  }

  const key = config.omdbApiKey;
  if (!key) {
    res.status(500).json({ error: "OMDb API key not configured" });
    return;
  }

  const urlStr = `https://www.omdbapi.com/?apikey=${key}&s=${encodeURIComponent(q)}&type=movie&page=${page}`;

  const fetchRes = await fetch(urlStr);
  const json = await fetchRes.json();

  if (json.Response === "False") {
    res.json({
      results: [],
      totalResults: 0,
      totalPages: 0,
      page: 1,
      error: json.Error,
    });
    return;
  }

  const totalResults = parseInt(json.totalResults, 10) || 0;
  const totalPages = Math.min(Math.ceil(totalResults / 10), 100);

  res.json({
    results: json.Search as OmdbSearchResult[],
    totalResults,
    totalPages,
    page,
    error: null,
  });
});

// POST /watched (requireAuth)
moviesRouter.post("/watched", requireAuth, async (req: AuthRequest, res: Response) => {
  const { imdbId, title, year, posterUrl, rating, note } = req.body;
  const userId = req.user!.id;

  // Find or create movie
  let movie = await db
    .select()
    .from(movies)
    .where(eq(movies.imdbId, imdbId))
    .then((r) => r[0]);

  if (!movie) {
    const key = config.omdbApiKey;
    const url = new URL("https://www.omdbapi.com/");
    url.searchParams.set("apikey", key);
    url.searchParams.set("i", imdbId);
    url.searchParams.set("type", "movie");

    const fetchRes = await fetch(url.toString());
    const detail = (await fetchRes.json()) as OmdbDetailResult & { Response?: string; Error?: string };

    if (detail.Response === "False") {
      res.status(400).json({ error: detail.Error || "Failed to fetch movie details" });
      return;
    }

    const movieId = uuidv4();
    const inserted = await db
      .insert(movies)
      .values({
        id: movieId,
        imdbId,
        title: detail.Title || title,
        year: detail.Year || year,
        posterUrl: detail.Poster && detail.Poster !== "N/A" ? detail.Poster : posterUrl,
        genres: detail.Genre && detail.Genre !== "N/A" ? detail.Genre : null,
        director: detail.Director && detail.Director !== "N/A" ? detail.Director : null,
        country: detail.Country && detail.Country !== "N/A" ? detail.Country : null,
      })
      .returning();
    movie = inserted[0];
  }

  // Check not already watched
  const existing = await db
    .select()
    .from(watchedEntries)
    .where(and(eq(watchedEntries.userId, userId), eq(watchedEntries.movieId, movie.id)))
    .then((r) => r[0]);

  if (existing) {
    res.status(409).json({ error: "Movie already in watched list" });
    return;
  }

  // Insert watchedEntry
  const entry = await db
    .insert(watchedEntries)
    .values({
      id: uuidv4(),
      userId,
      movieId: movie.id,
      rating,
      note: note || null,
    })
    .returning()
    .then((r) => r[0]);

  res.json({ entry, movie });
});

// GET /me/watched (requireAuth)
moviesRouter.get("/me/watched", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const entries = await db
    .select()
    .from(watchedEntries)
    .where(eq(watchedEntries.userId, userId))
    .then((r) => r);

  const movieIds = entries.map((e) => e.movieId);
  if (movieIds.length === 0) {
    res.json({ entries: [] });
    return;
  }

  const movieList = await db
    .select()
    .from(movies)
    .where(inArray(movies.id, movieIds))
    .then((r) => r);

  const movieMap = new Map(movieList.map((m) => [m.id, m]));

  const result = entries
    .map((entry) => {
      const movie = movieMap.get(entry.movieId);
      return {
        imdbId: movie?.imdbId || null,
        rating: entry.rating,
      };
    })
    .filter((e) => e.imdbId !== null);

  res.json({ entries: result });
});

// DELETE /watched/:entryId (requireAuth)
moviesRouter.delete("/watched/:entryId", requireAuth, async (req: AuthRequest, res: Response) => {
  const entryId = req.params.entryId as string;
  const userId = req.user!.id;

  const entry = await db
    .select()
    .from(watchedEntries)
    .where(eq(watchedEntries.id, entryId))
    .then((r) => r[0]);

  if (!entry || entry.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(watchedEntries).where(eq(watchedEntries.id, entryId));
  res.json({ success: true });
});

// GET /user/:username (public)
moviesRouter.get("/user/:username", async (req: Request, res: Response) => {
  const username = req.params.username as string;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .then((r) => r[0]);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const entries = await db
    .select()
    .from(watchedEntries)
    .where(eq(watchedEntries.userId, user.id))
    .orderBy(watchedEntries.watchedAt)
    .then((r) => r);

  const movieIds = entries.map((e) => e.movieId);
  if (movieIds.length === 0) {
    res.json({ user, entries: [] });
    return;
  }

  const movieList = await db
    .select()
    .from(movies)
    .where(inArray(movies.id, movieIds))
    .then((r) => r);

  const movieMap = new Map(movieList.map((m) => [m.id, m]));

  const result = entries.map((entry) => ({
    ...entry,
    movie: movieMap.get(entry.movieId) || null,
  }));

  res.json({ user, entries: result });
});
