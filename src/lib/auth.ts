import { db } from "@/db";
import { users, sessions } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export async function createUser(data: {
  username: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
}) {
  const id = uuidv4();
  const newUser = await db
    .insert(users)
    .values({
      id,
      ...data,
    })
    .returning();
  return newUser[0];
}

export async function getUserByUsername(username: string) {
  const result = await db.select().from(users).where(eq(users.username, username));
  return result[0] || null;
}

export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email));
  return result[0] || null;
}

export async function createSession(userId: string) {
  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await db.insert(sessions).values({
    id: sessionId,
    userId,
    expiresAt,
  });
  return sessionId;
}

export async function getSession(sessionId: string) {
  const result = await db
    .select()
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())));
  return result[0]?.sessions || null;
}

export async function deleteSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}
