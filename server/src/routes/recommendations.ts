import { Router, Response } from "express";
import { db } from "../db/index.js";
import { recommendations, users, movies, watchlistEntries } from "../db/schema.js";
import { eq, and, or, inArray, desc } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { findOrCreateMovie } from "../lib/movie-store.js";
import { toSafeUser } from "../lib/safe-user.js";

export const recommendationsRouter = Router();

async function populateRecommendations(rows: Array<typeof recommendations.$inferSelect>) {
  if (rows.length === 0) return [];

  const userIds = new Set<string>();
  const movieIds = new Set<string>();

  for (const r of rows) {
    userIds.add(r.fromUserId);
    userIds.add(r.toUserId);
    movieIds.add(r.movieId);
  }

  const [userList, movieList] = await Promise.all([
    db
      .select()
      .from(users)
      .where(inArray(users.id, Array.from(userIds))),
    db
      .select()
      .from(movies)
      .where(or(inArray(movies.id, Array.from(movieIds)), inArray(movies.imdbId, Array.from(movieIds)))),
  ]);

  const userMap = new Map<string, ReturnType<typeof toSafeUser>>();
  for (const u of userList) {
    userMap.set(u.id, toSafeUser(u));
  }

  const movieMap = new Map<string, typeof movies.$inferSelect>();
  for (const m of movieList) {
    movieMap.set(m.id, m);
    if (m.imdbId) movieMap.set(m.imdbId, m);
  }

  return rows.map((r) => ({
    ...r,
    fromUser: userMap.get(r.fromUserId) || null,
    toUser: userMap.get(r.toUserId) || null,
    movie: movieMap.get(r.movieId) || null,
  }));
}

// POST /api/recommendations — recommend a movie to another user
recommendationsRouter.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const fromUserId = req.user!.id;
  const { toUserId, toUsername, imdbId, title, year, posterUrl, note } = req.body;

  if (!imdbId) {
    res.status(400).json({ error: "Movie imdbId is required" });
    return;
  }

  // Resolve target user
  let targetUser = null;
  if (toUserId) {
    targetUser = await db
      .select()
      .from(users)
      .where(eq(users.id, toUserId))
      .then((r) => r[0]);
  } else if (toUsername) {
    targetUser = await db
      .select()
      .from(users)
      .where(eq(users.username, toUsername.trim()))
      .then((r) => r[0]);
  }

  if (!targetUser) {
    res.status(404).json({ error: "Recipient user not found" });
    return;
  }

  if (targetUser.id === fromUserId) {
    res.status(400).json({ error: "You cannot recommend a movie to yourself" });
    return;
  }

  // Find or create movie
  const movie = await findOrCreateMovie({ imdbId, title, year, posterUrl });
  if (!movie) {
    res.status(400).json({ error: "Failed to resolve movie details" });
    return;
  }

  // Check if an existing pending recommendation already exists from this user to that user for this movie
  const existing = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.fromUserId, fromUserId),
        eq(recommendations.toUserId, targetUser.id),
        eq(recommendations.movieId, movie.id),
        eq(recommendations.status, "pending")
      )
    )
    .then((r) => r[0]);

  const sanitizedNote = typeof note === "string" ? note.trim().slice(0, 500) : null;

  if (existing) {
    // Update note if changed
    if (sanitizedNote !== existing.note) {
      const updated = await db
        .update(recommendations)
        .set({ note: sanitizedNote })
        .where(eq(recommendations.id, existing.id))
        .returning()
        .then((r) => r[0]);

      res.json({
        recommendation: {
          ...updated,
          fromUser: toSafeUser(req.user!),
          toUser: toSafeUser(targetUser),
          movie,
        },
      });
      return;
    }

    res.status(409).json({ error: "You have already recommended this movie to this user" });
    return;
  }

  const newRec = await db
    .insert(recommendations)
    .values({
      id: uuidv4(),
      fromUserId,
      toUserId: targetUser.id,
      movieId: movie.id,
      note: sanitizedNote,
      status: "pending",
    })
    .returning()
    .then((r) => r[0]);

  res.status(201).json({
    recommendation: {
      ...newRec,
      fromUser: toSafeUser(req.user!),
      toUser: toSafeUser(targetUser),
      movie,
    },
  });
});

// GET /api/recommendations/received — get incoming recommendations
recommendationsRouter.get("/received", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const statusFilter = typeof req.query.status === "string" ? req.query.status : null;

  let queryCondition = eq(recommendations.toUserId, userId);
  if (statusFilter) {
    queryCondition = and(queryCondition, eq(recommendations.status, statusFilter)) as any;
  }

  const rawRows = await db
    .select()
    .from(recommendations)
    .where(queryCondition)
    .orderBy(desc(recommendations.createdAt));

  const items = await populateRecommendations(rawRows);

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const unreadCount = items.filter((i) => i.status === "pending" && !i.viewedAt).length;

  res.json({
    recommendations: items,
    unreadCount,
    pendingCount,
  });
});

// GET /api/recommendations/sent — get sent recommendations
recommendationsRouter.get("/sent", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;

  const rawRows = await db
    .select()
    .from(recommendations)
    .where(eq(recommendations.fromUserId, userId))
    .orderBy(desc(recommendations.createdAt));

  const items = await populateRecommendations(rawRows);

  res.json({
    recommendations: items,
  });
});

// PATCH /api/recommendations/:id/view — mark recommendation as viewed/checked out
recommendationsRouter.patch("/:id/view", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const recId = req.params.id as string;

  const rec = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.id, recId),
        or(eq(recommendations.toUserId, userId), eq(recommendations.fromUserId, userId))
      )
    )
    .then((r) => r[0]);

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  const viewedAt = rec.viewedAt || new Date();
  if (!rec.viewedAt) {
    await db
      .update(recommendations)
      .set({ viewedAt })
      .where(eq(recommendations.id, rec.id));
  }

  res.json({ success: true, viewedAt });
});

// PATCH /api/recommendations/:id/accept — accept recommendation (adds movie to watchlist)
recommendationsRouter.patch("/:id/accept", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const recId = req.params.id as string;

  const rec = await db
    .select()
    .from(recommendations)
    .where(and(eq(recommendations.id, recId), eq(recommendations.toUserId, userId)))
    .then((r) => r[0]);

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  // Ensure movie is on user's watchlist
  const existingWatchlist = await db
    .select()
    .from(watchlistEntries)
    .where(and(eq(watchlistEntries.userId, userId), eq(watchlistEntries.movieId, rec.movieId)))
    .then((r) => r[0]);

  let watchlistEntry = existingWatchlist;
  if (!existingWatchlist) {
    watchlistEntry = await db
      .insert(watchlistEntries)
      .values({
        id: uuidv4(),
        userId,
        movieId: rec.movieId,
      })
      .returning()
      .then((r) => r[0]);
  }

  // Update status to accepted and ensure viewedAt is set
  const updated = await db
    .update(recommendations)
    .set({
      status: "accepted",
      viewedAt: rec.viewedAt || new Date(),
    })
    .where(eq(recommendations.id, rec.id))
    .returning()
    .then((r) => r[0]);

  res.json({ success: true, recommendation: updated, watchlistEntry });
});

// PATCH /api/recommendations/:id/dismiss — dismiss recommendation
recommendationsRouter.patch("/:id/dismiss", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const recId = req.params.id as string;

  const rec = await db
    .select()
    .from(recommendations)
    .where(and(eq(recommendations.id, recId), eq(recommendations.toUserId, userId)))
    .then((r) => r[0]);

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  const updated = await db
    .update(recommendations)
    .set({
      status: "dismissed",
      viewedAt: rec.viewedAt || new Date(),
    })
    .where(eq(recommendations.id, rec.id))
    .returning()
    .then((r) => r[0]);

  res.json({ success: true, recommendation: updated });
});

// DELETE /api/recommendations/:id — delete recommendation
recommendationsRouter.delete("/:id", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const recId = req.params.id as string;

  const rec = await db
    .select()
    .from(recommendations)
    .where(
      and(
        eq(recommendations.id, recId),
        or(eq(recommendations.toUserId, userId), eq(recommendations.fromUserId, userId))
      )
    )
    .then((r) => r[0]);

  if (!rec) {
    res.status(404).json({ error: "Recommendation not found" });
    return;
  }

  await db.delete(recommendations).where(eq(recommendations.id, rec.id));
  res.json({ success: true });
});
