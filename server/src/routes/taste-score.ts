import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { movies, watchedEntries, users, tasteScores } from "../db/schema.js";
import { eq, inArray, sql } from "drizzle-orm";

export const tasteScoreRouter = Router();

interface TasteBreakdown {
  diversity: number;
  obscurity: number;
  consistency: number;
}

interface TasteScoreResult {
  score: number;
  breakdown: TasteBreakdown;
}

function computeDiversity(
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

async function computeObscurity(userId: string, movieIds: string[]): Promise<number> {
  if (movieIds.length === 0) return 0;

  const totalUsers = await db
    .select({ count: sql<number>`COUNT(DISTINCT ${watchedEntries.userId})` })
    .from(watchedEntries)
    .then((r) => Number(r[0].count));

  if (totalUsers <= 1) return 100;

  const watcherCounts = await db
    .select({
      movieId: watchedEntries.movieId,
      count: sql<number>`COUNT(DISTINCT ${watchedEntries.userId})`,
    })
    .from(watchedEntries)
    .where(inArray(watchedEntries.movieId, movieIds))
    .groupBy(watchedEntries.movieId);

  const countMap = new Map(watcherCounts.map((r) => [r.movieId, Number(r.count)]));

  const obscuritySum = movieIds.reduce((sum, mid) => {
    const watchers = countMap.get(mid) || 1;
    return sum + (1 - (watchers - 1) / (totalUsers - 1));
  }, 0);

  return Math.round((obscuritySum / movieIds.length) * 100);
}

function computeConsistency(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((acc, r) => acc + (r - mean) ** 2, 0) / ratings.length;
  const stddev = Math.sqrt(variance);
  const maxStddev = 4.5;
  return Math.round(Math.max(0, 1 - stddev / maxStddev) * 100);
}

async function computeTasteScore(userId: string): Promise<TasteScoreResult> {
  const entries = await db.select().from(watchedEntries).where(eq(watchedEntries.userId, userId));

  if (entries.length === 0) {
    const result: TasteScoreResult = {
      score: 0,
      breakdown: { diversity: 0, obscurity: 0, consistency: 0 },
    };
    await db
      .insert(tasteScores)
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
      });
    return result;
  }

  const movieIds = entries.map((e) => e.movieId);
  const movieList = await db.select().from(movies).where(inArray(movies.id, movieIds));

  const movieMap = new Map(movieList.map((m) => [m.id, m]));
  const allMovies = entries.map((e) => movieMap.get(e.movieId)).filter(Boolean) as typeof movieList;

  const diversity = computeDiversity(allMovies);
  const obscurity = await computeObscurity(userId, movieIds);
  const consistency = computeConsistency(entries.map((e) => e.rating));

  const breakdown: TasteBreakdown = { diversity, obscurity, consistency };
  const score = Math.round(diversity * 0.4 + obscurity * 0.4 + consistency * 0.2);

  await db
    .insert(tasteScores)
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
    });

  return { score, breakdown };
}

// Invalidates a user's cached taste score so it is recomputed on next fetch.
// Called whenever the underlying watched entries change (add/remove a film).
export async function invalidateTasteScore(userId: string): Promise<void> {
  await db.delete(tasteScores).where(eq(tasteScores.userId, userId));
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

  const staleThreshold = Date.now() - 1000 * 60 * 60;
  if (existing && existing.lastComputed && existing.lastComputed.getTime() > staleThreshold) {
    res.json({
      score: existing.score,
      breakdown: JSON.parse(existing.breakdownJson) as TasteBreakdown,
    });
    return;
  }

  const result = await computeTasteScore(user.id);
  res.json(result);
});
