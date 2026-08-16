import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like } from "drizzle-orm";
import { users } from "./schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function markTestUsers() {
  const result = await db.update(users).set({ isTest: true }).where(like(users.email, "%@test.com"));
  console.log(`Marked ${result.rowCount ?? 0} test user(s) as isTest=true`);
}

markTestUsers()
  .catch((err) => {
    console.error("Mark test users failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));