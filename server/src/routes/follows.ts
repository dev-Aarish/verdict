import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { follows, users } from "../db/schema.js";
import { eq, and, sql, inArray } from "drizzle-orm";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";

export const followsRouter = Router();

async function findUserByUsername(username: string) {
  return db.select().from(users).where(eq(users.username, username)).then((r) => r[0]);
}

followsRouter.post("/:username", requireAuth, async (req: AuthRequest, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (targetUser.id === req.user!.id) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }

  const existing = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, req.user!.id),
        eq(follows.followeeId, targetUser.id)
      )
    )
    .then((r) => r[0]);

  if (existing) {
    res.status(409).json({ error: "Already following" });
    return;
  }

  await db.insert(follows).values({
    followerId: req.user!.id,
    followeeId: targetUser.id,
  });

  res.json({ success: true });
});

followsRouter.delete("/:username", requireAuth, async (req: AuthRequest, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, req.user!.id),
        eq(follows.followeeId, targetUser.id)
      )
    );

  res.json({ success: true });
});

followsRouter.get("/:username/status", optionalAuth, async (req: AuthRequest, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (!req.user) {
    res.json({ isFollowing: false });
    return;
  }

  const existing = await db
    .select()
    .from(follows)
    .where(
      and(
        eq(follows.followerId, req.user.id),
        eq(follows.followeeId, targetUser.id)
      )
    )
    .then((r) => r[0]);

  res.json({ isFollowing: !!existing });
});

followsRouter.get("/:username/counts", async (req: Request, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const followerCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followeeId, targetUser.id))
    .then((r) => Number(r[0].count));

  const followingCount = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(follows)
    .where(eq(follows.followerId, targetUser.id))
    .then((r) => Number(r[0].count));

  res.json({ followers: followerCount, following: followingCount });
});

followsRouter.get("/:username/followers", async (req: Request, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const followerRelations = await db
    .select()
    .from(follows)
    .where(eq(follows.followeeId, targetUser.id));

  if (followerRelations.length === 0) {
    res.json({ users: [] });
    return;
  }

  const followerIds = followerRelations.map((f) => f.followerId);
  const followerUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, followerIds));

  const userMap = new Map(followerUsers.map((u) => [u.id, u]));
  const result = followerIds
    .map((id) => (userMap.get(id) ? toSafeUser(userMap.get(id)!) : null))
    .filter(Boolean);

  res.json({ users: result });
});

followsRouter.get("/:username/following", async (req: Request, res: Response) => {
  const targetUser = await findUserByUsername(req.params.username as string);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const followingRelations = await db
    .select()
    .from(follows)
    .where(eq(follows.followerId, targetUser.id));

  if (followingRelations.length === 0) {
    res.json({ users: [] });
    return;
  }

  const followingIds = followingRelations.map((f) => f.followeeId);
  const followingUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, followingIds));

  const userMap = new Map(followingUsers.map((u) => [u.id, u]));
  const result = followingIds
    .map((id) => (userMap.get(id) ? toSafeUser(userMap.get(id)!) : null))
    .filter(Boolean);

  res.json({ users: result });
});
