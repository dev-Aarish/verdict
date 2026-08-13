import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const movies = pgTable("movies", {
  id: text("id").primaryKey(),
  imdbId: text("imdb_id").notNull().unique(),
  title: text("title").notNull(),
  year: text("year"),
  posterUrl: text("poster_url"),
  genres: text("genres"),
  country: text("country"),
  director: text("director"),
  plot: text("plot"),
  actors: text("actors"),
});

export const watchedEntries = pgTable("watched_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  movieId: text("movie_id")
    .notNull()
    .references(() => movies.id),
  rating: integer("rating").notNull(),
  watchedAt: timestamp("watched_at", { withTimezone: true }).defaultNow(),
  note: text("note"),
});

export const watchlistEntries = pgTable("watchlist_entries", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  movieId: text("movie_id")
    .notNull()
    .references(() => movies.id),
  addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
});

export const verdicts = pgTable("verdicts", {
  id: text("id").primaryKey(),
  fromUserId: text("from_user_id")
    .notNull()
    .references(() => users.id),
  toUserId: text("to_user_id")
    .notNull()
    .references(() => users.id),
  score: integer("score").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const follows = pgTable("follows", {
  followerId: text("follower_id")
    .notNull()
    .references(() => users.id),
  followeeId: text("followee_id")
    .notNull()
    .references(() => users.id),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const tasteScores = pgTable("taste_scores", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
    .primaryKey(),
  score: integer("score").notNull(),
  breakdownJson: text("breakdown_json").notNull(),
  lastComputed: timestamp("last_computed", { withTimezone: true }).defaultNow(),
});
