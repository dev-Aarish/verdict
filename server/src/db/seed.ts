import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, sessions } from "./schema";
import { v4 as uuidv4 } from "uuid";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function seed() {
  const aliceId = uuidv4();
  const bobId = uuidv4();

  await db.insert(users).values([
    {
      id: aliceId,
      username: "alice",
      email: "alice@example.com",
      bio: "I like movies with substance. Preferably foreign.",
    },
    {
      id: bobId,
      username: "bob",
      email: "bob@example.com",
      bio: "Blockbuster or bust. If it didn't gross $500M, I haven't seen it.",
    },
  ]);

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await db.insert(sessions).values([
    { id: uuidv4(), userId: aliceId, expiresAt },
    { id: uuidv4(), userId: bobId, expiresAt },
  ]);

  console.log("Seeded: alice (alice@example.com), bob (bob@example.com)");
  console.log("Sessions created — open the app and you're already logged in.");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
