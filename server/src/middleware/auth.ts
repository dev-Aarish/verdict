import { Request, Response, NextFunction } from "express";
import { db } from "../db/index.js";
import { sessions, users } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";

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

async function resolveSession(sessionId: string): Promise<AuthUser | null> {
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

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bio: user.bio,
    createdAt: user.createdAt,
  };
}

export async function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const sessionId = (req as any).cookies?.auth_session;
  if (sessionId) {
    req.user = (await resolveSession(sessionId)) ?? undefined;
  }
  next();
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = (req as any).cookies?.auth_session;
  if (!sessionId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await resolveSession(sessionId);
  if (!user) {
    res.status(401).json({ error: "Invalid session" });
    return;
  }

  req.user = user;
  next();
}
