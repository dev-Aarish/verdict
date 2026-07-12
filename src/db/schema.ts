import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const movies = sqliteTable("movies", {
  id: text("id").primaryKey(),
  imdbId: text("imdb_id").notNull().unique(),
  title: text("title").notNull(),
  year: text("year"),
  posterUrl: text("poster_url"),
  genres: text("genres"),
  country: text("country"),
  director: text("director"),
});

export const watchedEntries = sqliteTable("watched_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  movieId: text("movie_id").notNull().references(() => movies.id),
  rating: integer("rating").notNull(), // 1-10
  watchedAt: integer("watched_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
  note: text("note"),
});

export const verdicts = sqliteTable("verdicts", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id").notNull().references(() => users.id),
  toUserId: text("to_user_id").notNull().references(() => users.id),
  score: integer("score").notNull(), // 1-10
  comment: text("comment"),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});

export const follows = sqliteTable("follows", {
  followerId: text("follower_id").notNull().references(() => users.id),
  followeeId: text("followee_id").notNull().references(() => users.id),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});


export const tasteScores = sqliteTable("taste_scores", {
  userId: text("user_id").notNull().references(() => users.id),
  score: integer("score").notNull(),
  breakdownJson: text("breakdown_json").notNull(),
  lastComputed: integer("last_computed", { mode: "timestamp" }).default(sql`CURRENT_TIMESTAMP`),
});
