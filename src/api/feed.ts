import { createServerFn } from "@tanstack/react-start";
import { verdicts, users, tasteScores } from "@/db/schema";
import { db } from "@/db";
import { eq, desc, inArray } from "drizzle-orm";

export const getFeedVerdictsFn = createServerFn({ method: "GET" })
  .validator((data: { limit?: number }) => data)
  .handler(async ({ data }) => {
    const limit = data.limit || 50;

    const rows = await db.select().from(verdicts).orderBy(desc(verdicts.createdAt)).limit(limit);

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
