import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { movies, users, watchlistEntries } from "../db/schema.js";
import { eq, and, inArray, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { findOrCreateMovie } from "../lib/movie-store.js";
import { toSafeUser } from "../lib/safe-user.js";

export const watchlistRouter = Router();

async function loadWatchlistEntries(userId: string) {
  const entries = await db
    .select()
    .from(watchlistEntries)
    .where(eq(watchlistEntries.userId, userId))
    .orderBy(desc(watchlistEntries.addedAt))
    .then((r) => r);

  if (entries.length === 0) return [];

  const movieIds = entries.map((e) => e.movieId);
  const movieList = await db
    .select()
    .from(movies)
    .where(inArray(movies.id, movieIds))
    .then((r) => r);

  const movieMap = new Map(movieList.map((m) => [m.id, m]));

  return entries.map((entry) => ({
    ...entry,
    movie: movieMap.get(entry.movieId) || null,
  }));
}

// POST /api/watchlist (requireAuth) — add a film to your watchlist
watchlistRouter.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { imdbId, title, year, posterUrl } = req.body;
  const userId = req.user!.id;

  const movie = await findOrCreateMovie({ imdbId, title, year, posterUrl });
  if (!movie) {
    res.status(400).json({ error: "Failed to fetch movie details" });
    return;
  }

  const existing = await db
    .select()
    .from(watchlistEntries)
    .where(and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, movie.id)))
    .then((r) => r[0]);

  if (existing) {
    res.status(409).json({ error: "Movie already on your watchlist" });
    return;
  }

  const entry = await db
    .insert(watchlistEntries)
    .values({ id: uuidv4(), userId, movieId: movie.id })
    .returning()
    .then((r) => r[0]);

  res.json({ entry, movie });
});

// DELETE /api/watchlist/:entryId (requireAuth) — remove from your watchlist
watchlistRouter.delete("/:entryId", requireAuth, async (req: AuthRequest, res: Response) => {
  const entryId = req.params.entryId as string;
  const userId = req.user!.id;

  const entry = await db
    .select()
    .from(watchlistEntries)
    .where(eq(watchlistEntries.id, entryId))
    .then((r) => r[0]);

  if (!entry || entry.userId !== userId) {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  await db.delete(watchlistEntries).where(eq(watchlistEntries.id, entryId));
  res.json({ success: true });
});

// GET /api/watchlist/me (requireAuth) — current user's watchlist
watchlistRouter.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const entries = await loadWatchlistEntries(userId);
  res.json({ entries });
});

// GET /api/watchlist/user/:username (public) — a user's watchlist
watchlistRouter.get("/user/:username", async (req: Request, res: Response) => {
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

  const entries = await loadWatchlistEntries(user.id);
  res.json({ user: toSafeUser(user), entries });
});
