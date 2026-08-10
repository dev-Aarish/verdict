import { createServerFn } from "@tanstack/react-start";
import { setCookie, getCookie } from "@tanstack/react-start/server";
import { users, sessions } from "@/db/schema";
import { db } from "@/db";
import { eq, and, gt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import * as jose from "jose";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return timingSafeEqual(Buffer.from(derived), Buffer.from(hash));
}

export const getCurrentUserFn = createServerFn({ method: "GET" }).handler(async () => {
  const sessionId = getCookie("auth_session");
  if (!sessionId) return null;

  const session = await db
    .select()
    .from(sessions)
    .where(eq(sessions.id, sessionId))
    .then((res) => res[0]);

  if (!session) return null;

  if (session.expiresAt < new Date()) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    return null;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .then((res) => res[0]);
  return user || null;
});

export const signupFn = createServerFn({ method: "POST" })
  .validator((data: { username: string; email: string; password: string; bio?: string }) => data)
  .handler(async ({ data }) => {
    if (!data.password || data.password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .then((res) => res[0]);
    if (existingUser) {
      throw new Error("Email already in use");
    }

    const existingUsername = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .then((res) => res[0]);
    if (existingUsername) {
      throw new Error("Username already in use");
    }

    const id = uuidv4();
    const passwordHash = hashPassword(data.password);
    const newUser = await db
      .insert(users)
      .values({
        id,
        username: data.username,
        email: data.email,
        bio: data.bio,
        passwordHash,
      })
      .returning();

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId: id,
      expiresAt,
    });

    setCookie("auth_session", sessionId, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    const { passwordHash: _, ...safeUser } = newUser[0];
    return { user: safeUser };
  });

export const loginFn = createServerFn({ method: "POST" })
  .validator((data: { email: string; password: string }) => data)
  .handler(async ({ data }) => {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .then((res) => res[0]);
    if (!user) {
      throw new Error("Invalid email or password");
    }

    if (!user.passwordHash || !verifyPassword(data.password, user.passwordHash)) {
      throw new Error("Invalid email or password");
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    setCookie("auth_session", sessionId, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser };
  });

export const googleAuthFn = createServerFn({ method: "POST" })
  .validator((data: { credential: string }) => data)
  .handler(async ({ data }) => {
    const JWKS = jose.createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

    let payload: jose.JWTPayload;
    try {
      const result = await jose.jwtVerify(data.credential, JWKS, {
        issuer: ["accounts.google.com", "https://accounts.google.com"],
      });
      payload = result.payload;
    } catch (err) {
      throw new Error(
        `Google verification failed: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }

    const email = payload.email as string | undefined;
    const picture = payload.picture as string | undefined;
    const name = payload.name as string | undefined;

    if (!email) {
      throw new Error("Email is required for Google sign-in");
    }

    let user = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .then((res) => res[0]);

    if (!user) {
      const id = uuidv4();
      let username = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
      const existing = await db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .then((res) => res[0]);
      if (existing) {
        username = `${username}_${Math.random().toString(36).slice(2, 6)}`;
      }

      user = await db
        .insert(users)
        .values({
          id,
          username,
          email,
          bio: "",
          avatarUrl: picture,
        })
        .returning()
        .then((res) => res[0]);
    }

    const sessionId = uuidv4();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    setCookie("auth_session", sessionId, {
      path: "/",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60,
    });

    return { user };
  });

export const logoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const sessionId = getCookie("auth_session");
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    setCookie("auth_session", "", {
      path: "/",
      httpOnly: true,
      maxAge: 0,
    });
  }
});
