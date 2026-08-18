import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { users, watchedEntries } from "../db/schema.js";
import { like, sql, inArray, eq, and } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";

export const usersRouter = Router();

const MAX_ABOUT_LENGTH = 200;
const MAX_AVATAR_URL_LENGTH = 512;

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
