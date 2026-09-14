import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq, like, or } from "drizzle-orm";
import { users } from "./schema.js";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function markTestUsers() {
  const testPattern = or(
    like(users.email, "%@test.com"),
    like(users.email, "%@example.com"),
    like(users.email, "test_%"),
    like(users.email, "%@verdict.internal"),
    like(users.username, "testuser_%"),
    like(users.username, "test_%"),
    eq(users.username, "alice"),
    eq(users.username, "bob"),
  );
  const result = await db.update(users).set({ isTest: true }).where(testPattern);
  console.log(`Marked test user(s) as isTest=true`);
}

markTestUsers()
  .catch((err) => {
    console.error("Mark test users failed:", err);
    process.exit(1);
  })
  .finally(() => process.exit(0));