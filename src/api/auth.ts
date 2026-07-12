import { createServerFn } from "@tanstack/react-start";
import { users, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, and } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const getCurrentUserFn = createServerFn({ method: "GET" })
  .handler(async ({ context }) => {
    const ctx = context as any;
    const request = ctx.request;
    if (!request) return null;

    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const sessionId = cookies["auth_session"];
    if (!sessionId) return null;

    const session = await db.select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .then(res => res[0]);

    if (!session) return null;

    const user = await db.select().from(users).where(eq(users.id, session.userId)).then(res => res[0]);
    return user || null;
  });

export const signupFn = createServerFn({ method: "POST" })
  .validator((data: { username: string; email: string; bio?: string }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    console.log("Context keys:", Object.keys(ctx));
    
    const existingUser = await db.select().from(users).where(eq(users.email, data.email)).then(res => res[0]);
    if (existingUser) {
      throw new Error("Email already in use");
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, data.username)).then(res => res[0]);
    if (existingUsername) {
      throw new Error("Username already in use");
    }

    const id = uuidv4();
    const newUser = await db.insert(users).values({
      id,
      username: data.username,
      email: data.email,
      bio: data.bio,
    }).returning();

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId: id,
      expiresAt,
    });

    if (ctx.response) {
      const cookie = `auth_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
      ctx.response.headers.append("Set-Cookie", cookie);
    } else {
      console.warn("Response object not found in context");
    }

    return { user: newUser[0] };
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { email: string }) => data)
  .handler(async ({ data, context }) => {
    const ctx = context as any;
    console.log("Context keys:", Object.keys(ctx));

    const user = await db.select().from(users).where(eq(users.email, data.email)).then(res => res[0]);
    if (!user) {
      throw new Error("User not found");
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    if (ctx.response) {
      const cookie = `auth_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`;
      ctx.response.headers.append("Set-Cookie", cookie);
    } else {
      console.warn("Response object not found in context");
    }

    return { user };
  });

export const logoutFn = createServerFn({ method: "POST" })
  .handler(async ({ context }) => {
    const ctx = context as any;
    const request = ctx.request;
    const response = ctx.response;

    if (!request || !response) {
      console.warn("Request or Response not found in context");
      return;
    }

    const cookieHeader = request.headers.get("Cookie");
    if (!cookieHeader) return;

    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const sessionId = cookies["auth_session"];
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
      response.headers.append("Set-Cookie", "auth_session=; Path=/; HttpOnly; Max-Age=0");
    }
  });
