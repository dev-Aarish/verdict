import { Router, Response } from "express";
import { db } from "../db/index.js";
import { movies, users, watchedEntries } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { optionalAuth, AuthRequest } from "../middleware/auth.js";
import { computeTasteMatch, type RatedFilm, type TasteMatchResult } from "../lib/taste-match.js";

export const tasteMatchRouter = Router();

async function getWatchedRatings(userId: string): Promise<RatedFilm[]> {
  return db
    .select({ imdbId: movies.imdbId, rating: watchedEntries.rating })
    .from(watchedEntries)
    .innerJoin(movies, eq(movies.id, watchedEntries.movieId))
    .where(eq(watchedEntries.userId, userId));
}

// GET /:username/taste-match (optionalAuth)
tasteMatchRouter.get(
  "/:username/taste-match",
  optionalAuth,
  async (req: AuthRequest, res: Response) => {
    const username = req.params.username as string;

    const target = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .then((r) => r[0]);

    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const viewer = req.user;
    if (!viewer || viewer.id === target.id) {
      res.json({ match: null });
      return;
    }

    const [viewerFilms, targetFilms] = await Promise.all([
      getWatchedRatings(viewer.id),
      getWatchedRatings(target.id),
    ]);

    const match: TasteMatchResult = computeTasteMatch(viewerFilms, targetFilms);
    res.json({ match });
  },
);
