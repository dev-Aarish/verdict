import { Database } from "bun:sqlite";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const SQLITE_PATH = process.env.SQLITE_PATH || "data/sqlite.db";
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required. Set it in .env");
  process.exit(1);
}

const sqlite = new Database(SQLITE_PATH, { readonly: true });
const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

function parseTimestamp(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string") return new Date(value.replace(" ", "T") + "Z");
  if (value instanceof Date) return value;
  return null;
}

interface SqliteRow {
  id?: string;
  username?: string;
  email?: string;
  avatar_url?: string;
  bio?: string;
  password_hash?: string;
  created_at?: string | number;
  imdb_id?: string;
  title?: string;
  year?: string;
  poster_url?: string;
  genres?: string;
  country?: string;
  director?: string;
  user_id?: string;
  movie_id?: string;
  rating?: number;
  watched_at?: string | number;
  note?: string;
  from_user_id?: string;
  to_user_id?: string;
  score?: number;
  comment?: string;
  follower_id?: string;
  followee_id?: string;
  expires_at?: string | number;
  breakdown_json?: string;
  last_computed?: string | number;
}

async function migrate() {
  console.log(`Reading from ${SQLITE_PATH}...`);

  // --- users ---
  const sqliteUsers = sqlite.prepare("SELECT * FROM users").all() as SqliteRow[];
  console.log(`Migrating ${sqliteUsers.length} users...`);
  for (const u of sqliteUsers) {
    await db
      .insert(schema.users)
      .values({
        id: u.id,
        username: u.username,
        email: u.email,
        avatarUrl: u.avatar_url,
        bio: u.bio,
        passwordHash: u.password_hash,
        createdAt: parseTimestamp(u.created_at),
      })
      .onConflictDoNothing();
  }

  // --- movies ---
  const sqliteMovies = sqlite.prepare("SELECT * FROM movies").all() as SqliteRow[];
  console.log(`Migrating ${sqliteMovies.length} movies...`);
  for (const m of sqliteMovies) {
    await db
      .insert(schema.movies)
      .values({
        id: m.id,
        imdbId: m.imdb_id,
        title: m.title,
        year: m.year,
        posterUrl: m.poster_url,
        genres: m.genres,
        country: m.country,
        director: m.director,
      })
      .onConflictDoNothing();
  }

  // --- watched_entries ---
  const sqliteWatched = sqlite.prepare("SELECT * FROM watched_entries").all() as SqliteRow[];
  console.log(`Migrating ${sqliteWatched.length} watched entries...`);
  for (const w of sqliteWatched) {
    await db
      .insert(schema.watchedEntries)
      .values({
        id: w.id,
        userId: w.user_id,
        movieId: w.movie_id,
        rating: w.rating,
        watchedAt: parseTimestamp(w.watched_at),
        note: w.note,
      })
      .onConflictDoNothing();
  }

  // --- verdicts ---
  const sqliteVerdicts = sqlite.prepare("SELECT * FROM verdicts").all() as SqliteRow[];
  console.log(`Migrating ${sqliteVerdicts.length} verdicts...`);
  for (const v of sqliteVerdicts) {
    await db
      .insert(schema.verdicts)
      .values({
        id: v.id,
        fromUserId: v.from_user_id,
        toUserId: v.to_user_id,
        score: v.score,
        comment: v.comment,
        createdAt: parseTimestamp(v.created_at),
      })
      .onConflictDoNothing();
  }

  // --- follows ---
  const sqliteFollows = sqlite.prepare("SELECT * FROM follows").all() as SqliteRow[];
  console.log(`Migrating ${sqliteFollows.length} follows...`);
  for (const f of sqliteFollows) {
    await db
      .insert(schema.follows)
      .values({
        followerId: f.follower_id,
        followeeId: f.followee_id,
      })
      .onConflictDoNothing();
  }

  // --- sessions ---
  const sqliteSessions = sqlite.prepare("SELECT * FROM sessions").all() as SqliteRow[];
  console.log(`Migrating ${sqliteSessions.length} sessions...`);
  for (const s of sqliteSessions) {
    await db
      .insert(schema.sessions)
      .values({
        id: s.id,
        userId: s.user_id,
        expiresAt: parseTimestamp(s.expires_at)!,
      })
      .onConflictDoNothing();
  }

  // --- taste_scores ---
  const sqliteScores = sqlite.prepare("SELECT * FROM taste_scores").all() as SqliteRow[];
  console.log(`Migrating ${sqliteScores.length} taste scores...`);
  for (const t of sqliteScores) {
    await db
      .insert(schema.tasteScores)
      .values({
        userId: t.user_id,
        score: t.score,
        breakdownJson: t.breakdown_json,
        lastComputed: parseTimestamp(t.last_computed),
      })
      .onConflictDoNothing();
  }

  sqlite.close();
  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
