import { createServerFn } from "@tanstack/react-start";
import { getCookie } from "@tanstack/react-start/server";
import { verdicts, users, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const submitVerdictFn = createServerFn({ method: "POST" })
  .validator((data: { toUsername: string; score: number; comment: string }) => data)
  .handler(async ({ data }) => {
    const sessionId = getCookie("auth_session");
    if (!sessionId) throw new Error("Not authenticated");

    const session = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .then((r) => r[0]);
    if (!session) throw new Error("Invalid session");

    const target = await db
      .select()
      .from(users)
      .where(eq(users.username, data.toUsername))
      .then((r) => r[0]);
    if (!target) throw new Error("User not found");
    if (target.id === session.userId) throw new Error("Cannot verdict yourself");

    const existing = await db
      .select()
      .from(verdicts)
      .where(and(eq(verdicts.fromUserId, session.userId), eq(verdicts.toUserId, target.id)))
      .then((r) => r[0]);
    if (existing) throw new Error("Already left a verdict on this user");

    const entry = await db
      .insert(verdicts)
      .values({
        id: uuidv4(),
        fromUserId: session.userId,
        toUserId: target.id,
        score: data.score,
        comment: data.comment,
      })
      .returning()
      .then((r) => r[0]);

    return { verdict: entry };
  });

export const getUserVerdictsFn = createServerFn({ method: "GET" })
  .validator((data: { username: string }) => data)
  .handler(async ({ data }) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .then((r) => r[0]);
    if (!user) throw new Error("User not found");

    const rows = await db
      .select()
      .from(verdicts)
      .where(eq(verdicts.toUserId, user.id))
      .orderBy(verdicts.createdAt)
      .then((r) => r);

    if (rows.length === 0) return { verdicts: [] };

    const fromIds = [...new Set(rows.map((v) => v.fromUserId))];
    const fromUsers = await db
      .select()
      .from(users)
      .where(inArray(users.id, fromIds))
      .then((r) => r);

    const userMap = new Map(fromUsers.map((u) => [u.id, u]));

    const result = rows.map((v) => ({
      ...v,
      fromUser: userMap.get(v.fromUserId) || null,
    }));

    return { verdicts: result };
  });
