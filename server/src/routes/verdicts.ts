import { Router, Request, Response } from "express";
import { db } from "../db/index.js";
import { verdicts, users } from "../db/schema.js";
import { eq, and, inArray } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { requireAuth, optionalAuth, AuthRequest } from "../middleware/auth.js";
import { toSafeUser } from "../lib/safe-user.js";

export const verdictsRouter = Router();

verdictsRouter.post("/", requireAuth, async (req: AuthRequest, res: Response) => {
  const { toUsername, score, comment } = req.body;

  if (!toUsername || score === undefined) {
    res.status(400).json({ error: "toUsername and score are required" });
    return;
  }

  const numericScore = Number(score);
  if (Number.isNaN(numericScore) || numericScore < 1 || numericScore > 10) {
    res.status(400).json({ error: "score must be a number between 1 and 10" });
    return;
  }

  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.username, toUsername))
    .then((r) => r[0]);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  if (targetUser.id === req.user!.id) {
    res.status(400).json({ error: "Cannot verdict yourself" });
    return;
  }

  const existing = await db
    .select()
    .from(verdicts)
    .where(
      and(
        eq(verdicts.fromUserId, req.user!.id),
        eq(verdicts.toUserId, targetUser.id)
      )
    )
    .then((r) => r[0]);

  if (existing) {
    res.status(409).json({ error: "Already verdicted this user" });
    return;
  }

  const id = uuidv4();
  await db.insert(verdicts).values({
    id,
    fromUserId: req.user!.id,
    toUserId: targetUser.id,
    score: numericScore,
    comment: comment || null,
  });

  const inserted = await db
    .select()
    .from(verdicts)
    .where(eq(verdicts.id, id))
    .then((r) => r[0]);

  res.status(201).json({ verdict: inserted });
});

verdictsRouter.get("/user/:username", optionalAuth, async (req: Request, res: Response) => {
  const username = req.params.username as string;

  const targetUser = await db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .then((r) => r[0]);

  if (!targetUser) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const userVerdicts = await db
    .select()
    .from(verdicts)
    .where(eq(verdicts.toUserId, targetUser.id));

  if (userVerdicts.length === 0) {
    res.json({ verdicts: [] });
    return;
  }

  const fromUserIds = [...new Set(userVerdicts.map((v) => v.fromUserId))];
  const fromUsers = await db
    .select()
    .from(users)
    .where(inArray(users.id, fromUserIds));

  const fromUserMap = new Map(fromUsers.map((u) => [u.id, u]));

  const result = userVerdicts.map((v) => ({
    ...v,
    fromUser: fromUserMap.get(v.fromUserId) ? toSafeUser(fromUserMap.get(v.fromUserId)!) : null,
  }));

  res.json({ verdicts: result });
});
