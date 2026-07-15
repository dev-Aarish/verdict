import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { follows, users, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, and, sql } from "drizzle-orm";

export const followUserFn = createServerFn({ method: "POST" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) throw new Error("Not authenticated");

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) throw new Error("Invalid session");

    const target = await db.select().from(users).where(eq(users.username, data.username)).then(r => r[0]);
    if (!target) throw new Error("User not found");
    if (target.id === session.userId) throw new Error("Cannot follow yourself");

    const existing = await db.select().from(follows).where(
      and(eq(follows.followerId, session.userId), eq(follows.followeeId, target.id))
    ).then(r => r[0]);

    if (existing) throw new Error("Already following");

    await db.insert(follows).values({ followerId: session.userId, followeeId: target.id });
    return { success: true };
  });

export const unfollowUserFn = createServerFn({ method: "POST" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) throw new Error("Not authenticated");

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) throw new Error("Invalid session");

    const target = await db.select().from(users).where(eq(users.username, data.username)).then(r => r[0]);
    if (!target) throw new Error("User not found");

    await db.delete(follows).where(
      and(eq(follows.followerId, session.userId), eq(follows.followeeId, target.id))
    );

    return { success: true };
  });

export const getFollowStatusFn = createServerFn({ method: "GET" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) return { isFollowing: false };

    const session = await db.select().from(sessions).where(eq(sessions.id, sessionId)).then(r => r[0]);
    if (!session) return { isFollowing: false };

    const target = await db.select().from(users).where(eq(users.username, data.username)).then(r => r[0]);
    if (!target) return { isFollowing: false };

    const existing = await db.select().from(follows).where(
      and(eq(follows.followerId, session.userId), eq(follows.followeeId, target.id))
    ).then(r => r[0]);

    return { isFollowing: !!existing };
  });

export const getFollowCountsFn = createServerFn({ method: "GET" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const user = await db.select().from(users).where(eq(users.username, data.username)).then(r => r[0]);
    if (!user) throw new Error("User not found");

    const [followers] = await db.select({ count: sql<number>`COUNT(*)` }).from(follows)
      .where(eq(follows.followeeId, user.id));

    const [following] = await db.select({ count: sql<number>`COUNT(*)` }).from(follows)
      .where(eq(follows.followerId, user.id));

    return { followers: Number(followers.count), following: Number(following.count) };
  });
