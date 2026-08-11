import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { users, watchedEntries } from "../db/schema.js";
import { like, sql, inArray } from "drizzle-orm";

export const usersRouter = Router();

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
    .where(like(users.username, `%${q}%`))
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
