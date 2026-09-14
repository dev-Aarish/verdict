import { Router, Request, Response } from "express";
import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { v4 as uuidv4 } from "uuid";
import * as jose from "jose";

const scryptAsync = promisify(scrypt);
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { config } from "../config.js";

import {
  COOKIE_NAME,
  SESSION_DURATION_MS,
  setSessionCookie,
  clearSessionCookie,
  resolveSession,
} from "../middleware/auth.js";

export const authRouter = Router();

function sanitizeUsername(email: string): string {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!base) base = "user";
  return base;
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  const buf = Buffer.from(hash, "hex");
  const computed = (await scryptAsync(password, salt, 64)) as Buffer;
  return timingSafeEqual(buf, computed);
}

// GET /me
authRouter.get("/me", async (req: Request, res: Response) => {
  const sessionId = (req as any).cookies?.[COOKIE_NAME];
  if (!sessionId) {
    res.json({ user: null });
    return;
  }

  const user = await resolveSession(sessionId, res);
  res.json({ user });
});

// POST /signup
authRouter.post("/signup", async (req: Request, res: Response) => {
  const { username, email, password, bio } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ error: "Username, email, and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(400).json({ error: "Password must be at least 8 characters" });
    return;
  }

  const existingEmail = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((res) => res[0]);

  if (existingEmail) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const existingUsername = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .then((res) => res[0]);

  if (existingUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const id = uuidv4();
  const passwordHash = await hashPassword(password);

  await db.insert(users).values({
    id,
    username,
    email,
    passwordHash,
    bio: bio || null,
    isTest: email.endsWith("@test.com"),
  });

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId: id,
    expiresAt,
  });

  setSessionCookie(res, sessionId);

  res.status(201).json({
    user: { id, username, email, avatarUrl: null, bio: bio || null, createdAt: new Date() },
  });
});

// POST /login
authRouter.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required" });
    return;
  }

  const user = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .then((res) => res[0]);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    expiresAt,
  });

  setSessionCookie(res, sessionId);

  res.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      createdAt: user.createdAt,
    },
  });
});

// POST /google
authRouter.post("/google", async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({ error: "Google credential is required" });
    return;
  }

  const JWKS = jose.createRemoteJWKSet(
    new URL("https://www.googleapis.com/oauth2/v3/certs")
  );

  const { payload } = await jose.jwtVerify(credential, JWKS, {
    issuer: ["accounts.google.com", "https://accounts.google.com"],
  });

  const googleEmail = payload.email as string;
  if (!googleEmail) {
    res.status(400).json({ error: "No email in Google token" });
    return;
  }

  let existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, googleEmail))
    .then((res) => res[0]);

  if (!existingUser) {
    let baseUsername = sanitizeUsername(googleEmail);

    const taken = await db
      .select()
      .from(users)
      .where(eq(users.username, baseUsername))
      .then((res) => res[0]);

    let username = baseUsername;
    if (taken) {
      username = `${baseUsername}${uuidv4().slice(0, 6)}`;
    }

    const id = uuidv4();

    await db.insert(users).values({
      id,
      username,
      email: googleEmail,
      avatarUrl: (payload.picture as string) || null,
    });

    existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .then((res) => res[0]);
  }

  const sessionId = uuidv4();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await db.insert(sessions).values({
    id: sessionId,
    userId: existingUser!.id,
    expiresAt,
  });

  setSessionCookie(res, sessionId);

  res.json({
    user: {
      id: existingUser!.id,
      username: existingUser!.username,
      email: existingUser!.email,
      avatarUrl: existingUser!.avatarUrl,
      bio: existingUser!.bio,
      createdAt: existingUser!.createdAt,
    },
  });
});

// POST /logout
authRouter.post("/logout", async (req: Request, res: Response) => {
  const sessionId = (req as any).cookies?.[COOKIE_NAME];

  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId));
  }

  clearSessionCookie(res);
  res.json({ ok: true });
});
