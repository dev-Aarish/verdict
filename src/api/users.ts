import { createServerFn } from "@tanstack/react-start";
import { users, watchedEntries } from "@/db/schema";
import { db } from "@/db";
import { eq, like, sql, inArray } from "drizzle-orm";

export const searchUsersFn = createServerFn({ method: "GET" })
  .validator((data: { query: string }) => data)
  .handler(async ({ data }) => {
    const q = data.query.trim();
    if (q.length < 1) return { users: [] };

    const userRows = await db
      .select()
      .from(users)
      .where(like(users.username, `%${q}%`))
      .limit(20);

    if (userRows.length === 0) return { users: [] };

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

    return { users: result };
  });
