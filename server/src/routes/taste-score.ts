import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { movies, watchedEntries, users, tasteScores } from "../db/schema.js";
import { eq, inArray, sql } from "drizzle-orm";

export const tasteScoreRouter = Router();

export interface TasteBreakdown {
  diversity: number;
  obscurity: number;
  consistency: number;
}

export interface TasteScoreResult {
  score: number;
  breakdown: TasteBreakdown;
}

export function computeDiversity(
  allMovies: { genres: string | null; director: string | null; country: string | null }[],
): number {
  const total = allMovies.length;
  if (total === 0) return 0;

  const allGenres = allMovies.flatMap((m) =>
    (m.genres || "")
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean),
  );
  const uniqueGenres = new Set(allGenres);

  const uniqueDirectors = new Set(
    allMovies.map((m) => m.director?.trim().toLowerCase()).filter(Boolean),
  );

  const allCountries = allMovies.flatMap((m) =>
    (m.country || "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean),
  );
  const uniqueCountries = new Set(allCountries);

  const cap = Math.min(total, 20);

  const genreScore = Math.min(uniqueGenres.size / Math.min(cap, 8), 1) * 100;
  const directorScore = Math.min(uniqueDirectors.size / Math.min(cap, 6), 1) * 100;
  const countryScore = Math.min(uniqueCountries.size / Math.min(cap, 5), 1) * 100;

  return Math.round(genreScore * 0.5 + directorScore * 0.3 + countryScore * 0.2);
}

export async function computeObscurity(userId: string, movieIds: string[]): Promise<number> {
  if (movieIds.length === 0) return 0;

  const [totalUsers, watcherCounts] = await Promise.all([
    db
      .select({ count: sql<number>`COUNT(DISTINCT ${watchedEntries.userId})` })
      .from(watchedEntries)
      .then((r) => Number(r[0].count)),
    db
      .select({
        movieId: watchedEntries.movieId,
        count: sql<number>`COUNT(DISTINCT ${watchedEntries.userId})`,
      })
      .from(watchedEntries)
      .where(inArray(watchedEntries.movieId, movieIds))
      .groupBy(watchedEntries.movieId),
  ]);

  if (totalUsers <= 1) return 100;

  const countMap = new Map(watcherCounts.map((r) => [r.movieId, Number(r.count)]));

  const obscuritySum = movieIds.reduce((sum, mid) => {
    const watchers = countMap.get(mid) || 1;
    return sum + (1 - (watchers - 1) / (totalUsers - 1));
  }, 0);

  return Math.round((obscuritySum / movieIds.length) * 100);
}

export function computeConsistency(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((acc, r) => acc + (r - mean) ** 2, 0) / ratings.length;
  const stddev = Math.sqrt(variance);
  const maxStddev = 4.5;
  return Math.round(Math.max(0, 1 - stddev / maxStddev) * 100);
}

export async function computeTasteScoreFromEntries(
  userId: string,
  entries: { rating: number; movieId: string; movie?: typeof movies.$inferSelect | null }[],
): Promise<TasteScoreResult> {
  if (entries.length === 0) {
    const result: TasteScoreResult = {
      score: 0,
      breakdown: { diversity: 0, obscurity: 0, consistency: 0 },
    };
    db.insert(tasteScores)
      .values({
        userId,
        score: 0,
        breakdownJson: JSON.stringify(result.breakdown),
      })
      .onConflictDoUpdate({
        target: tasteScores.userId,
        set: {
          score: 0,
          breakdownJson: JSON.stringify(result.breakdown),
          lastComputed: sql`CURRENT_TIMESTAMP`,
        },
      })
      .catch(() => {});
    return result;
  }

  const movieIds = entries.map((e) => e.movieId);
  const allMovies = entries
    .map((e) => e.movie)
    .filter(Boolean) as (typeof movies.$inferSelect)[];

  const diversity = computeDiversity(allMovies);
  const obscurity = await computeObscurity(userId, movieIds);
  const consistency = computeConsistency(entries.map((e) => e.rating));

  const breakdown: TasteBreakdown = { diversity, obscurity, consistency };
  const score = Math.round(diversity * 0.4 + obscurity * 0.4 + consistency * 0.2);

  db.insert(tasteScores)
    .values({
      userId,
      score,
      breakdownJson: JSON.stringify(breakdown),
    })
    .onConflictDoUpdate({
      target: tasteScores.userId,
      set: {
        score,
        breakdownJson: JSON.stringify(breakdown),
        lastComputed: sql`CURRENT_TIMESTAMP`,
      },
    })
    .catch(() => {});

  return { score, breakdown };
}

export async function computeTasteScore(userId: string): Promise<TasteScoreResult> {
  const entries = await db
    .select({
      id: watchedEntries.id,
      userId: watchedEntries.userId,
      movieId: watchedEntries.movieId,
      rating: watchedEntries.rating,
      movie: movies,
    })
    .from(watchedEntries)
    .innerJoin(movies, eq(movies.id, watchedEntries.movieId))
    .where(eq(watchedEntries.userId, userId));

  return computeTasteScoreFromEntries(userId, entries);
}

// Invalidates a user's cached taste score so it is recomputed on next fetch.
// Called whenever the underlying watched entries change (add/remove a film).
export async function invalidateTasteScore(userId: string): Promise<void> {
  await db.delete(tasteScores).where(eq(tasteScores.userId, userId)).catch(() => {});
}

// GET /:username/taste-score (public)
tasteScoreRouter.get("/:username/taste-score", async (req: Request, res: Response) => {
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

  const existing = await db
    .select()
    .from(tasteScores)
    .where(eq(tasteScores.userId, user.id))
    .then((r) => r[0]);

  if (existing) {
    try {
      const breakdown = JSON.parse(existing.breakdownJson) as TasteBreakdown;
      res.json({
        score: existing.score,
        breakdown,
      });
      return;
    } catch {
      // recompute if corrupt
    }
  }

  const result = await computeTasteScore(user.id);
  res.json(result);
});
