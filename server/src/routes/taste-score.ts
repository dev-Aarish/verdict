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
  allMovies: {
    genres?: string | null;
    director?: string | null;
    country?: string | null;
    year?: string | null;
  }[],
): number {
  const total = allMovies.length;
  if (total === 0) return 0;
  if (total === 1) return 30; // A single film has baseline diversity, not 100%

  // 1. Genre distribution & entropy (40% weight)
  const genreCounts: Record<string, number> = {};
  let totalGenreTags = 0;
  for (const m of allMovies) {
    const tags = (m.genres || "")
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);
    for (const tag of tags) {
      genreCounts[tag] = (genreCounts[tag] || 0) + 1;
      totalGenreTags++;
    }
  }

  let genreEntropy = 0;
  if (totalGenreTags > 0) {
    for (const tag in genreCounts) {
      const p = genreCounts[tag] / totalGenreTags;
      genreEntropy -= p * Math.log(p);
    }
  }
  // Max entropy across ~16 common genres is ln(16) ≈ 2.77
  const maxPossibleEntropy = Math.log(16);
  const genreSpread = Math.min(
    100,
    Math.round(
      (genreEntropy / maxPossibleEntropy) *
        100 *
        Math.min(1, Object.keys(genreCounts).length / 5),
    ),
  );

  // 2. Director variety (30% weight)
  const uniqueDirectors = new Set(
    allMovies.map((m) => m.director?.trim().toLowerCase()).filter(Boolean),
  );
  const directorRatio = uniqueDirectors.size / total;
  const directorScore = Math.min(100, Math.round(directorRatio * 100));

  // 3. Era / Decade breadth (15% weight)
  const uniqueDecades = new Set(
    allMovies
      .map((m) => {
        const yr = parseInt(m.year || "", 10);
        return Number.isFinite(yr) && yr > 1900 ? Math.floor(yr / 10) * 10 : null;
      })
      .filter((d): d is number => d !== null),
  );
  const decadeScore = Math.min(
    100,
    Math.round((uniqueDecades.size / Math.min(Math.max(total, 2), 6)) * 100),
  );

  // 4. Country / International breadth (15% weight)
  const uniqueCountries = new Set(
    allMovies.flatMap((m) =>
      (m.country || "")
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const countryScore = Math.min(
    100,
    Math.round((uniqueCountries.size / Math.min(Math.max(total, 2), 5)) * 100),
  );

  return Math.round(
    genreSpread * 0.4 + directorScore * 0.3 + decadeScore * 0.15 + countryScore * 0.15,
  );
}

export function parseBoxOffice(bo: string | null | undefined): number {
  if (!bo) return 0;
  const num = parseInt(bo.replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(num) ? num : 0;
}

export function parseAwardsCount(awards: string | null | undefined): number {
  if (!awards) return 0;
  let count = 0;
  const wins = awards.match(/(\d+)\s+win/i);
  const noms = awards.match(/(\d+)\s+nom/i);
  const oscar = awards.match(/won\s+(\d+)\s+oscar/i);
  if (wins) count += parseInt(wins[1], 10);
  if (noms) count += parseInt(noms[1], 10) * 0.5;
  if (oscar) count += parseInt(oscar[1], 10) * 10;
  return count;
}

export async function computeObscurity(
  userId: string,
  movieList: {
    id: string;
    boxOffice?: string | null;
    awards?: string | null;
    country?: string | null;
  }[],
): Promise<number> {
  if (movieList.length === 0) return 0;

  const movieIds = movieList.map((m) => m.id);

  // Platform watcher counts for these movies
  const watcherCounts = await db
    .select({
      movieId: watchedEntries.movieId,
      count: sql<number>`COUNT(DISTINCT ${watchedEntries.userId})`,
    })
    .from(watchedEntries)
    .where(inArray(watchedEntries.movieId, movieIds))
    .groupBy(watchedEntries.movieId);

  const countMap = new Map(watcherCounts.map((r) => [r.movieId, Number(r.count)]));

  const obscurityScores = movieList.map((m) => {
    const bo = parseBoxOffice(m.boxOffice);
    const awardsScore = parseAwardsCount(m.awards);
    const isForeign = m.country ? !m.country.toLowerCase().includes("united states") : false;

    // Real-world commercial footprint:
    // >$300M => 10, >$100M => 25, >$40M => 45, >$10M => 65, >$1M => 80, small/niche => 92
    let boScore: number;
    if (bo > 300_000_000) boScore = 10;
    else if (bo > 100_000_000) boScore = 25;
    else if (bo > 40_000_000) boScore = 45;
    else if (bo > 10_000_000) boScore = 65;
    else if (bo > 1_000_000) boScore = 80;
    else boScore = 92;

    // Awards discount: highly awarded cultural staples are well known
    const awardsDiscount = Math.min(25, Math.round(awardsScore * 0.3));
    let realWorldObscurity = Math.max(
      10,
      Math.min(98, boScore - awardsDiscount + (isForeign ? 8 : 0)),
    );

    // Platform rarity modifier: if multiple Verdict members have watched it, it's popular in community
    const watchers = countMap.get(m.id) || 1;
    if (watchers > 5) {
      realWorldObscurity = Math.max(10, realWorldObscurity - Math.min(20, (watchers - 1) * 3));
    }

    return realWorldObscurity;
  });

  return Math.round(obscurityScores.reduce((a, b) => a + b, 0) / obscurityScores.length);
}

export function computeConsistency(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  if (ratings.length === 1) return 100;

  const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length;
  const variance = ratings.reduce((acc, r) => acc + (r - mean) ** 2, 0) / ratings.length;
  const stddev = Math.sqrt(variance);
  const maxStddev = 4.2;
  return Math.round(Math.max(0, 1 - stddev / maxStddev) * 100);
}

export async function computeTasteScoreFromEntries(
  userId: string,
  entries: {
    rating: number;
    movieId: string;
    movie?: {
      id?: string;
      genres?: string | null;
      director?: string | null;
      country?: string | null;
      year?: string | null;
      boxOffice?: string | null;
      awards?: string | null;
    } | null;
  }[],
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

  const allMovies = entries
    .map((e) => e.movie)
    .filter(Boolean) as {
    id: string;
    genres?: string | null;
    director?: string | null;
    country?: string | null;
    year?: string | null;
    boxOffice?: string | null;
    awards?: string | null;
  }[];

  const diversity = computeDiversity(allMovies);
  const obscurity = await computeObscurity(userId, allMovies.map((m, i) => ({
    id: m.id || entries[i].movieId,
    boxOffice: m.boxOffice,
    awards: m.awards,
    country: m.country,
  })));
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
