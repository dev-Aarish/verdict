import { Database } from "bun:sqlite";
import { v4 as uuidv4 } from "uuid";

const dbPath = process.env.DB_PATH || "data/sqlite.db";
const sqlite = new Database(dbPath);

function seed() {
  const aliceId = uuidv4();
  const bobId = uuidv4();
  const now = Math.floor(Date.now() / 1000);

  sqlite.run(
    "INSERT INTO users (id, username, email, bio, created_at) VALUES (?, ?, ?, ?, ?)",
    [aliceId, "alice", "alice@example.com", "I like movies with substance. Preferably foreign.", now],
  );

  sqlite.run(
    "INSERT INTO users (id, username, email, bio, created_at) VALUES (?, ?, ?, ?, ?)",
    [bobId, "bob", "bob@example.com", "Blockbuster or bust. If it didn't gross $500M, I haven't seen it.", now],
  );

  const expiresAt = now + 7 * 24 * 60 * 60;
  sqlite.run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [uuidv4(), aliceId, expiresAt]);
  sqlite.run("INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)", [uuidv4(), bobId, expiresAt]);

  console.log("Seeded: alice (alice@example.com), bob (bob@example.com)");
  console.log("Sessions created — open the app and you're already logged in.");
}

seed();
