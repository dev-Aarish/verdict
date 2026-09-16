import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, sessions } from "./schema";
import { v4 as uuidv4 } from "uuid";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

import { randomBytes, scrypt } from "node:crypto";
import { promisify } from "node:util";
import { eq } from "drizzle-orm";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function seed() {
  const passwordHash = await hashPassword("password123");

  const existingAlice = await db.select().from(users).where(eq(users.email, "alice@example.com")).then(r => r[0]);
  const existingBob = await db.select().from(users).where(eq(users.email, "bob@example.com")).then(r => r[0]);

  let aliceId = existingAlice?.id || uuidv4();
  let bobId = existingBob?.id || uuidv4();

  if (existingAlice) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, aliceId));
  } else {
    await db.insert(users).values({
      id: aliceId,
      username: "alice",
      email: "alice@example.com",
      passwordHash,
      bio: "I like movies with substance. Preferably foreign.",
    });
  }

  if (existingBob) {
    await db.update(users).set({ passwordHash }).where(eq(users.id, bobId));
  } else {
    await db.insert(users).values({
      id: bobId,
      username: "bob",
      email: "bob@example.com",
      passwordHash,
      bio: "Blockbuster or bust. If it didn't gross $500M, I haven't seen it.",
    });
  }

  console.log("Seeded: alice (alice@example.com / password123), bob (bob@example.com / password123)");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
