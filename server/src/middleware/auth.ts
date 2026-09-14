import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { config } from "../config.js";

export const COOKIE_NAME = "auth_session";
export const SESSION_DURATION_MS = 72 * 60 * 60 * 1000; // 72 hours
const REFRESH_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes throttle for sliding updates

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date | null;
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
  const session = await db
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, new Date())))
    .then((res) => res[0]);

  if (!session) return null;

  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, session.userId))
    .then((res) => res[0]);

  if (!user) return null;

  // Sliding session extension: if at least 15 mins have elapsed since last extension, extend by 72 hours
  const now = Date.now();
  const remaining = session.expiresAt.getTime() - now;
  if (remaining < SESSION_DURATION_MS - REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(now + SESSION_DURATION_MS);
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, sessionId));
    if (res && !res.headersSent) {
      setSessionCookie(res, sessionId);
    }
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };
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
