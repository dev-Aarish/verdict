import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { verdicts, users, follows, tasteScores } from "../db/schema.js";
import { eq, and, desc, inArray } from "drizzle-orm";
import { optionalAuth, AuthRequest } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";

export const feedRouter = Router();

feedRouter.get("/verdicts", optionalAuth, async (req: AuthRequest, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const filter = (req.query.filter as string) || "all";

  let whereClause = undefined;

  if (filter === "following" && req.user) {
    const userFollows = await db
      .select()
      .from(follows)
      .where(eq(follows.followerId, req.user.id));

    const followingIds = userFollows.map((f) => f.followeeId);

    if (followingIds.length === 0) {
      res.json({ verdicts: [] });
      return;
    }

    whereClause = inArray(verdicts.toUserId, followingIds);
  }

  const recentVerdicts = await db
    .select()
    .from(verdicts)
    .where(whereClause)
    .orderBy(desc(verdicts.createdAt))
    .limit(limit);

  if (recentVerdicts.length === 0) {
    res.json({ verdicts: [] });
    return;
  }

  const allUserIdsSet = new Set<string>();
  recentVerdicts.forEach((v) => {
    allUserIdsSet.add(v.fromUserId);
    allUserIdsSet.add(v.toUserId);
  });

  const allUserIds = [...allUserIdsSet];
  const allUsers = await db
    .select()
    .from(users)
    .where(and(inArray(users.id, allUserIds), eq(users.isTest, false)));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const result = recentVerdicts.map((v) => ({
    id: v.id,
    fromUser: userMap.get(v.fromUserId) ? toSafeUser(userMap.get(v.fromUserId)!) : null,
    toUser: userMap.get(v.toUserId) ? toSafeUser(userMap.get(v.toUserId)!) : null,
    score: v.score,
    comment: v.comment,
    createdAt: v.createdAt,
  }));

  res.json({ verdicts: result });
});

feedRouter.get("/leaderboard", async (_req: Request, res: Response) => {
  const scores = await db
    .select()
    .from(tasteScores)
    .orderBy(desc(tasteScores.score))
    .limit(50);

  if (scores.length === 0) {
    res.json([]);
    return;
  }

  const userIds = scores.map((s) => s.userId);
  const allUsers = await db
    .select()
    .from(users)
    .where(and(inArray(users.id, userIds), eq(users.isTest, false)));
  const userMap = new Map(allUsers.map((u) => [u.id, u]));

  const result = scores.map((s, index) => ({
    rank: index + 1,
    user: userMap.get(s.userId) ? toSafeUser(userMap.get(s.userId)!) : null,
    score: s.score,
  }));

  res.json(result);
});
