import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { verdicts, users, tasteScores, follows, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, desc, inArray, or, and } from "drizzle-orm";

async function getCurrentUserId(): Promise<string | null> {
  const sessionId = getCookie("auth_session");
  if (!sessionId) return null;
  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .then((r) => r[0]);
  return session?.userId ?? null;
}

export const getFeedVerdictsFn = createServerFn({ method: "GET" })
  .validator((data: { limit?: number; filter?: "all" | "following" }) => data)
  .handler(async ({ data }) => {
    const limit = data.limit || 50;
    const filter = data.filter || "all";

    let rows;

    if (filter === "following") {
      const currentUserId = await getCurrentUserId();
      if (!currentUserId) {
        rows = await db
          .select()
          .from(verdicts)
          .orderBy(desc(verdicts.createdAt))
          .limit(limit);
      } else {
        const followingRows = await db
          .select({ followeeId: follows.followeeId })
          .from(follows)
          .where(eq(follows.followerId, currentUserId));
        const followingIds = followingRows.map((r) => r.followeeId);

        if (followingIds.length === 0) return { verdicts: [] };

        rows = await db
          .select()
          .from(verdicts)
          .where(
            or(
              inArray(verdicts.fromUserId, followingIds),
              inArray(verdicts.toUserId, followingIds),
            ),
          )
          .orderBy(desc(verdicts.createdAt))
          .limit(limit);
      }
    } else {
      rows = await db.select().from(verdicts).orderBy(desc(verdicts.createdAt)).limit(limit);
    }

    if (rows.length === 0) return { verdicts: [] };

    const userIds = [...new Set(rows.flatMap((v) => [v.fromUserId, v.toUserId]))];
    const userRows = await db.select().from(users).where(inArray(users.id, userIds));
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    const result = rows.map((v) => ({
      id: v.id,
      fromUser: userMap.get(v.fromUserId) || null,
      toUser: userMap.get(v.toUserId) || null,
      score: v.score,
      comment: v.comment,
      createdAt: v.createdAt,
    }));

    return { verdicts: result };
  });

export const getLeaderboardFn = createServerFn({ method: "GET" }).handler(async () => {
  const rows = await db
    .select({
      score: tasteScores.score,
      username: users.username,
    })
    .from(tasteScores)
    .innerJoin(users, eq(users.id, tasteScores.userId))
    .orderBy(desc(tasteScores.score))
    .limit(50);

  return rows.map((r, i) => ({ rank: i + 1, user: r.username, score: r.score }));
});
