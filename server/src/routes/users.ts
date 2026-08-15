import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { users, watchedEntries } from "../db/schema.js";
import { like, sql, inArray, eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";

export const usersRouter = Router();

const MAX_ABOUT_LENGTH = 200;

// PATCH /me (requireAuth) — update the current user's profile (About/bio)
usersRouter.patch("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const { bio } = req.body ?? {};

  if (bio === undefined) {
    res.status(400).json({ error: "Nothing to update" });
    return;
  }

  if (typeof bio !== "string") {
    res.status(400).json({ error: "About must be a string" });
    return;
  }

  if (bio.length > MAX_ABOUT_LENGTH) {
    res.status(400).json({ error: `About must be ${MAX_ABOUT_LENGTH} characters or fewer` });
    return;
  }

  const trimmed = bio.trim();
  const updated = await db
    .update(users)
    .set({ bio: trimmed === "" ? null : trimmed })
    .where(eq(users.id, userId))
    .returning()
    .then((r) => r[0]);

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
