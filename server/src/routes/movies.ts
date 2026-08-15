import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { movies, watchedEntries, users } from "../db/schema.js";
import { eq, and, inArray, asc, sql } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { config } from "../config.js";
import { toSafeUser } from "../lib/safe-user.js";
import {
  searchTmdb,
  fetchEnrichedDetail,
  findOrCreateMovie,
  type MovieDetailFields,
} from "../lib/movie-store.js";
import { invalidateTasteScore } from "./taste-score.js";

export const moviesRouter = Router();

function mergeMovieFields(movie: typeof movies.$inferSelect, fresh: MovieDetailFields) {
  return {
    ...movie,
    title: movie.title || fresh.title || "Unknown",
    year: movie.year || fresh.year,
    posterUrl: movie.posterUrl || fresh.posterUrl,
    genres: movie.genres || fresh.genres,
    director: movie.director || fresh.director,
    country: movie.country || fresh.country,
    plot: movie.plot || fresh.plot,
    actors: movie.actors || fresh.actors,
    runtime: movie.runtime || fresh.runtime,
    rated: movie.rated || fresh.rated,
    released: movie.released || fresh.released,
    writer: movie.writer || fresh.writer,
    language: movie.language || fresh.language,
    awards: movie.awards || fresh.awards,
    boxOffice: movie.boxOffice || fresh.boxOffice,
    production: movie.production || fresh.production,
    dvd: movie.dvd || fresh.dvd,
    website: movie.website || fresh.website,
  };
}

function needsEnrichment(movie: typeof movies.$inferSelect): boolean {
  // Fields we expect on (nearly) every film. The occasionally-absent extras
  // (box office, DVD, production, website) are still merged in whenever an
  // enrichment happens, but don't trigger refetches on their own — otherwise
  // films that genuinely lack them would hit OMDb on every view.
  return (
    !movie.plot ||
    !movie.actors ||
    !movie.director ||
    !movie.posterUrl ||
    !movie.runtime ||
    !movie.rated ||
    !movie.released ||
    !movie.writer ||
    !movie.language ||
    !movie.awards
  );
}

// GET /film/:imdbId (public)
moviesRouter.get("/film/:imdbId", async (req: Request, res: Response) => {
  const imdbId = req.params.imdbId as string;

  let movie = await db
    .select()
    .from(movies)
    .where(eq(movies.imdbId, imdbId))
    .then((r) => r[0] || null);

  if (!movie) {
    const detail = await fetchEnrichedDetail(imdbId);
    if (!detail) {
      res.status(404).json({ error: "Film not found" });
      return;
    }
    movie = { id: imdbId, ...detail, title: detail.title || "Unknown" };
  } else if (needsEnrichment(movie)) {
    const detail = await fetchEnrichedDetail(imdbId);
    if (detail) {
      movie = mergeMovieFields(movie, detail);
      await db
        .update(movies)
        .set({
          title: movie.title,
          year: movie.year,
          posterUrl: movie.posterUrl,
          genres: movie.genres,
          director: movie.director,
          country: movie.country,
          plot: movie.plot,
          actors: movie.actors,
          runtime: movie.runtime,
          rated: movie.rated,
          released: movie.released,
          writer: movie.writer,
          language: movie.language,
          awards: movie.awards,
          boxOffice: movie.boxOffice,
          production: movie.production,
          dvd: movie.dvd,
          website: movie.website,
        })
        .where(eq(movies.id, movie.id));
    }
  }

  const entries = await db
    .select()
    .from(watchedEntries)
    .where(eq(watchedEntries.movieId, movie.id));

  let community: {
    user: ReturnType<typeof toSafeUser> | null;
    rating: number;
    note: string | null;
    watchedAt: Date | null;
  }[] = [];

  if (entries.length > 0) {
    const userIds = [...new Set(entries.map((e) => e.userId))];
    const userList = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(userList.map((u) => [u.id, u]));

    community = entries.map((e) => ({
      user: userMap.get(e.userId) ? toSafeUser(userMap.get(e.userId)!) : null,
      rating: e.rating,
      note: e.note,
      watchedAt: e.watchedAt,
    }));
  }

  const ratings = community.map((c) => c.rating);
  const average =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length : null;
  const freshCount = ratings.filter((r) => r >= 7).length;
  const total = ratings.length;
  const freshPercent = total > 0 ? Math.round((freshCount / total) * 100) : null;
  const status =
    freshPercent === null
      ? null
      : freshPercent >= 60
        ? "fresh"
        : freshPercent <= 25
          ? "rotten"
          : "mixed";

  res.json({
    movie,
    community,
    stats: { total, average, freshCount, freshPercent, status },
  });
});

// GET /search?q=&page=
moviesRouter.get("/search", async (req: Request, res: Response) => {
  const q = (req.query.q as string) || "";
  const page = parseInt(req.query.page as string, 10) || 1;

  if (!q.trim()) {
    res.json({ results: [], totalResults: 0, totalPages: 0, page: 1, error: null });
    return;
  }

  const key = config.tmdbApiKey;
  if (!key) {
    res.status(500).json({ error: "TMDb API key not configured" });
    return;
  }

  const result = await searchTmdb(q, page);
  if (!result) {
    res.json({
      results: [],
      totalResults: 0,
      totalPages: 0,
      page: 1,
      error: "Search failed",
    });
    return;
  }

  res.json({
    results: result.results,
    totalResults: result.totalResults,
    totalPages: result.totalPages,
    page,
    error: null,
  });
});

// POST /watched (requireAuth)
moviesRouter.post("/watched", requireAuth, async (req: AuthRequest, res: Response) => {
  const { imdbId, title, year, posterUrl, rating, note } = req.body;
  const userId = req.user!.id;

  // Find or create movie
  const movie = await findOrCreateMovie({ imdbId, title, year, posterUrl });
  if (!movie) {
    res.status(400).json({ error: "Failed to fetch movie details" });
    return;
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

  // Append to the end of the user's custom order
  const [maxRow] = await db
    .select({ max: sql<number>`MAX(${watchedEntries.position})` })
    .from(watchedEntries)
    .where(eq(watchedEntries.userId, userId));
  const position = (Number(maxRow?.max) || -1) + 1;

  // Insert watchedEntry
  const entry = await db
    .insert(watchedEntries)
    .values({
      id: uuidv4(),
      userId,
      movieId: movie.id,
      rating,
      note: note || null,
      position,
    })
    .returning()
    .then((r) => r[0]);

  await invalidateTasteScore(userId);

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
  await invalidateTasteScore(userId);
  res.json({ success: true });
});

// PATCH /watched/:entryId (requireAuth)
moviesRouter.patch("/watched/:entryId", requireAuth, async (req: AuthRequest, res: Response) => {
  const entryId = req.params.entryId as string;
  const userId = req.user!.id;
  const { rating, note } = req.body;

  const entry = await db
    .select()
    .from(watchedEntries)
    .where(eq(watchedEntries.id, entryId))
    .then((r) => r[0]);

  if (!entry || entry.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  const changes: { rating?: number; note?: string | null } = {};

  if (rating !== undefined) {
    const ratingVal = Number(rating);
    if (!Number.isInteger(ratingVal) || ratingVal < 1 || ratingVal > 10) {
      res.status(400).json({ error: "Rating must be an integer between 1 and 10" });
      return;
    }
    changes.rating = ratingVal;
  }

  if (note !== undefined) {
    if (typeof note !== "string" && note !== null) {
      res.status(400).json({ error: "Note must be a string" });
      return;
    }
    changes.note = typeof note === "string" && note.trim() !== "" ? note.trim() : null;
  }

  if (Object.keys(changes).length === 0) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  const updated = await db
    .update(watchedEntries)
    .set(changes)
    .where(eq(watchedEntries.id, entryId))
    .returning()
    .then((r) => r[0]);

  if (changes.rating !== undefined) {
    await invalidateTasteScore(userId);
  }

  res.json({ entry: updated });
});

// PUT /watched/reorder (requireAuth) — persist the user's custom film order
moviesRouter.put("/watched/reorder", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { entryIds } = req.body ?? {};

  if (!Array.isArray(entryIds) || new Set(entryIds).size !== entryIds.length) {
    res.status(400).json({ error: "entryIds must be an array of unique entry ids" });
    return;
  }

  const userEntries = await db
    .select({ id: watchedEntries.id })
    .from(watchedEntries)
    .where(eq(watchedEntries.userId, userId))
    .then((r) => r);

  const owned = new Set(userEntries.map((e) => e.id));
  if (owned.size !== entryIds.length || !entryIds.every((id) => owned.has(id))) {
    res.status(400).json({ error: "entryIds must cover all of your watched entries" });
    return;
  }

  for (let i = 0; i < entryIds.length; i++) {
    await db
      .update(watchedEntries)
      .set({ position: i })
      .where(and(eq(watchedEntries.id, entryIds[i]), eq(watchedEntries.userId, userId)));
  }

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
    .orderBy(asc(watchedEntries.position), asc(watchedEntries.watchedAt))
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
