import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import {
  users,
  watchedEntries,
  watchlistEntries,
  movies,
  verdicts,
  follows,
  tasteScores,
} from "../db/schema.js";
import { like, sql, inArray, eq, and, or, asc, desc } from "drizzle-orm";
import { requireAuth, optionalAuth, AuthRequest, updateCachedUser } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";
import { computeTasteScoreFromEntries, type TasteBreakdown } from "./taste-score.js";
import { computeTasteMatch, type TasteMatchResult } from "../lib/taste-match.js";

export const usersRouter = Router();

const MAX_ABOUT_LENGTH = 200;
const MAX_AVATAR_URL_LENGTH = 512;

// GET /:username/profile (optionalAuth) — consolidated profile data in a single request
usersRouter.get("/:username/profile", optionalAuth, async (req: AuthRequest, res: Response) => {
  const username = req.params.username as string;
  const viewer = req.user;

  const targetUser =
    viewer && viewer.username === username
      ? viewer
      : await db
          .select()
          .from(users)
          .where(eq(users.username, username))
          .then((r) => r[0]);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const isOwn = viewer?.id === targetUser.id;

  const [
    watchedRows,
    watchlistRows,
    verdictRows,
    followCountRows,
    tasteScoreRow,
    followRow,
    viewerWatchedRows,
  ] = await Promise.all([
    // 1. Watched entries with movie
    db
      .select({
        id: watchedEntries.id,
        userId: watchedEntries.userId,
        movieId: watchedEntries.movieId,
        rating: watchedEntries.rating,
        note: watchedEntries.note,
        position: watchedEntries.position,
        watchedAt: watchedEntries.watchedAt,
        movie: movies,
      })
      .from(watchedEntries)
      .innerJoin(movies, eq(movies.id, watchedEntries.movieId))
      .where(eq(watchedEntries.userId, targetUser.id))
      .orderBy(asc(watchedEntries.position), asc(watchedEntries.watchedAt)),

    // 2. Watchlist entries with movie
    db
      .select({
        id: watchlistEntries.id,
        userId: watchlistEntries.userId,
        movieId: watchlistEntries.movieId,
        addedAt: watchlistEntries.addedAt,
        movie: movies,
      })
      .from(watchlistEntries)
      .innerJoin(movies, eq(movies.id, watchlistEntries.movieId))
      .where(eq(watchlistEntries.userId, targetUser.id))
      .orderBy(desc(watchlistEntries.addedAt)),

    // 3. Verdicts with fromUser
    db
      .select({
        verdict: verdicts,
        fromUser: users,
      })
      .from(verdicts)
      .innerJoin(users, eq(users.id, verdicts.fromUserId))
      .where(eq(verdicts.toUserId, targetUser.id))
      .orderBy(desc(verdicts.createdAt)),

    // 4. Follower & following count in a single query
    db
      .select({
        followers: sql<number>`COUNT(CASE WHEN ${follows.followeeId} = ${targetUser.id} THEN 1 END)`,
        following: sql<number>`COUNT(CASE WHEN ${follows.followerId} = ${targetUser.id} THEN 1 END)`,
      })
      .from(follows)
      .where(
        or(
          eq(follows.followeeId, targetUser.id),
          eq(follows.followerId, targetUser.id),
        ),
      ),

    // 5. Cached taste score
    db
      .select()
      .from(tasteScores)
      .where(eq(tasteScores.userId, targetUser.id))
      .then((r) => r[0]),

    // 6. Follow status (if viewer is logged in and not self)
    viewer && !isOwn
      ? db
          .select()
          .from(follows)
          .where(
            and(
              eq(follows.followerId, viewer.id),
              eq(follows.followeeId, targetUser.id),
            ),
          )
          .then((r) => r[0])
      : Promise.resolve(null),

    // 7. Viewer ratings for taste match (if viewer is logged in and not self)
    viewer && !isOwn
      ? db
          .select({ imdbId: movies.imdbId, rating: watchedEntries.rating })
          .from(watchedEntries)
          .innerJoin(movies, eq(movies.id, watchedEntries.movieId))
          .where(eq(watchedEntries.userId, viewer.id))
      : Promise.resolve(null),
  ]);

  // Resolve taste score
  let tasteScore: { score: number; breakdown: TasteBreakdown } | null = null;
  if (tasteScoreRow) {
    try {
      tasteScore = {
        score: tasteScoreRow.score,
        breakdown: JSON.parse(tasteScoreRow.breakdownJson) as TasteBreakdown,
      };
    } catch {
      tasteScore = null;
    }
  }

  if (!tasteScore) {
    try {
      tasteScore = await computeTasteScoreFromEntries(targetUser.id, watchedRows);
    } catch {
      tasteScore = null;
    }
  }

  // Resolve taste match
  let tasteMatch: TasteMatchResult | null = null;
  if (viewerWatchedRows && viewerWatchedRows.length > 0 && watchedRows.length > 0) {
    const targetFilms = watchedRows.map((r) => ({
      imdbId: r.movie.imdbId,
      rating: r.rating,
    }));
    tasteMatch = computeTasteMatch(viewerWatchedRows, targetFilms);
  }

  const entries = watchedRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    movieId: r.movieId,
    rating: r.rating,
    note: r.note,
    position: r.position,
    watchedAt: r.watchedAt,
    movie: r.movie,
  }));

  const watchlist = watchlistRows.map((r) => ({
    id: r.id,
    userId: r.userId,
    movieId: r.movieId,
    addedAt: r.addedAt,
    movie: r.movie,
  }));

  const formattedVerdicts = verdictRows.map((r) => ({
    ...r.verdict,
    fromUser: r.fromUser ? toSafeUser(r.fromUser) : null,
  }));

  const followers = Number(followCountRows[0]?.followers || 0);
  const following = Number(followCountRows[0]?.following || 0);

  if (!viewer) {
    res.setHeader("Cache-Control", "public, max-age=15, stale-while-revalidate=60");
  }

  res.json({
    user: toSafeUser(targetUser),
    entries,
    watchlist,
    tasteScore,
    verdicts: formattedVerdicts,
    isFollowing: !!followRow,
    followCounts: { followers, following },
    tasteMatch,
  });
});

// PATCH /me (requireAuth) — update the current user's profile (About/bio, avatar)
usersRouter.patch("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { bio, avatarUrl } = req.body ?? {};

  if (bio === undefined && avatarUrl === undefined) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  if (bio !== undefined && typeof bio !== "string") {
    res.status(400).json({ error: "About must be a string" });
    return;
  }

  if (bio !== undefined && bio.length > MAX_ABOUT_LENGTH) {
    res.status(400).json({ error: `About must be ${MAX_ABOUT_LENGTH} characters or fewer` });
    return;
  }

  if (avatarUrl !== undefined && avatarUrl !== null) {
    if (typeof avatarUrl !== "string" || avatarUrl.length > MAX_AVATAR_URL_LENGTH) {
      res.status(400).json({ error: "Avatar URL must be a valid string" });
      return;
    }
    try {
      const url = new URL(avatarUrl);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
    } catch {
      res.status(400).json({ error: "Avatar URL must be a valid http(s) URL" });
      return;
    }
  }

  const updates: Partial<typeof users.$inferInsert> = {};
  if (bio !== undefined) {
    const trimmed = bio.trim();
    updates.bio = trimmed === "" ? null : trimmed;
  }
  if (avatarUrl !== undefined) {
    updates.avatarUrl = avatarUrl;
  }

  const updated = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, userId))
    .returning()
    .then((r) => r[0]);

  if (updated) {
    updateCachedUser(userId, { bio: updated.bio, avatarUrl: updated.avatarUrl });
  }

  res.json({ user: toSafeUser(updated) });
});

// GET /search?q=
usersRouter.get("/search", async (req: Request, res: Response) => {
  const q = ((req.query.q as string) || "").trim();
  if (q.length < 1) {
    res.json({ users: [] });
    return;
  }

  const userRows = await db
    .select()
    .from(users)
    .where(and(like(users.username, `%${q}%`), eq(users.isTest, false)))
    .limit(20);

  if (userRows.length === 0) {
    res.json({ users: [] });
    return;
  }

  const userIds = userRows.map((u) => u.id);

  const counts = await db
    .select({
      userId: watchedEntries.userId,
      count: sql<number>`COUNT(*)`.as("count"),
    })
    .from(watchedEntries)
    .where(inArray(watchedEntries.userId, userIds))
    .groupBy(watchedEntries.userId);

  const countMap = new Map(counts.map((c) => [c.userId, Number(c.count)]));

  const result = userRows.map((u) => ({
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    filmCount: countMap.get(u.id) || 0,
  }));

  res.json({ users: result });
});
