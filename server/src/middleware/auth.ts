import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { config } from "../config.js";

export const COOKIE_NAME = "auth_session";
export const SESSION_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes throttle for sliding updates
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory cache

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date | null;
}

interface CachedSession {
  user: AuthUser;
  expiresAt: number;
  cachedAt: number;
}

const sessionCache = new Map<string, CachedSession>();

export function cacheSession(sessionId: string, user: AuthUser, expiresAt: Date) {
  sessionCache.set(sessionId, {
    user,
    expiresAt: expiresAt.getTime(),
    cachedAt: Date.now(),
  });
}

export function invalidateSession(sessionId: string) {
  sessionCache.delete(sessionId);
}

export function updateCachedUser(userId: string, updates: Partial<AuthUser>) {
  for (const entry of sessionCache.values()) {
    if (entry.user.id === userId) {
      entry.user = { ...entry.user, ...updates };
    }
  }
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  params: Record<string, string>;
  body: any;
  query: Record<string, string | string[] | undefined>;
}

export function setSessionCookie(res: Response, sessionId: string) {
  const isProd = config.nodeEnv === "production";
  res.cookie(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd ? true : config.cookieSecure,
    maxAge: SESSION_DURATION_MS,
    path: "/",
  });
}

export function clearSessionCookie(res: Response) {
  const isProd = config.nodeEnv === "production";
  res.clearCookie(COOKIE_NAME, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: isProd ? true : config.cookieSecure,
  });
}

export async function resolveSession(sessionId: string, res?: Response): Promise<AuthUser | null> {
  const now = Date.now();
  const cached = sessionCache.get(sessionId);
  if (cached) {
    if (cached.expiresAt > now && now - cached.cachedAt < CACHE_TTL_MS) {
      return cached.user;
    }
    sessionCache.delete(sessionId);
  }

  // Single JOIN query to fetch both session and user in one round-trip
  const row = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .then((res) => res[0]);

  if (!row) return null;

  const authUser: AuthUser = {
    id: row.user.id,
    username: row.user.username,
    email: row.user.email,
    avatarUrl: row.user.avatarUrl,
    bio: row.user.bio,
    createdAt: row.user.createdAt,
  };

  cacheSession(sessionId, authUser, row.session.expiresAt);

  // Sliding session extension: if at least 15 mins have elapsed since last extension, extend by 72 hours
  const remaining = row.session.expiresAt.getTime() - now;
  if (remaining < SESSION_DURATION_MS - REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(now + SESSION_DURATION_MS);
    db.update(sessions)
      .set({ expiresAt: newExpiresAt })
      .where(eq(sessions.id, sessionId))
      .catch(() => {});
    if (res && !res.headersSent) {
      setSessionCookie(res, sessionId);
    }
  }

  return authUser;
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = (req as any).cookies?.[COOKIE_NAME];
  if (sessionId) {
    req.user = (await resolveSession(sessionId, res)) ?? undefined;
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = (req as any).cookies?.[COOKIE_NAME];
  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await resolveSession(sessionId, res);
  if (!user) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  req.user = user;
  next();
}
