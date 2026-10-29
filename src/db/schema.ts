import { pgTable, text, integer, timestamp, boolean, primaryKey, index } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  isTest: boolean("is_test").default(false),
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
  castJson: text("cast_json"),
  runtime: integer("runtime"),
  rated: text("rated"),
  released: text("released"),
  writer: text("writer"),
  language: text("language"),
  awards: text("awards"),
  boxOffice: text("box_office"),
  production: text("production"),
  dvd: text("dvd"),
  website: text("website"),
});

export const watchedEntries = pgTable(
  "watched_entries",
  {
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
    position: integer("position").notNull().default(0),
  },
  (table) => [
    index("watched_entries_user_id_idx").on(table.userId),
    index("watched_entries_movie_id_idx").on(table.movieId),
    index("watched_entries_user_pos_idx").on(table.userId, table.position),
  ],
);

export const watchlistEntries = pgTable(
  "watchlist_entries",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    movieId: text("movie_id")
      .notNull()
      .references(() => movies.id),
    addedAt: timestamp("added_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index("watchlist_entries_user_id_idx").on(table.userId),
    index("watchlist_entries_movie_id_idx").on(table.movieId),
  ],
);

export const verdicts = pgTable(
  "verdicts",
  {
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
  },
  (table) => [
    index("verdicts_to_user_id_idx").on(table.toUserId),
    index("verdicts_from_user_id_idx").on(table.fromUserId),
  ],
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id")
      .notNull()
      .references(() => users.id),
    followeeId: text("followee_id")
      .notNull()
      .references(() => users.id),
  },
  (table) => [
    index("follows_follower_id_idx").on(table.followerId),
    index("follows_followee_id_idx").on(table.followeeId),
  ],
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    index("sessions_user_id_idx").on(table.userId),
  ],
);

export const tasteScores = pgTable("taste_scores", {
  userId: text("user_id")
    .notNull()
    .references(() => users.id)
    .primaryKey(),
  score: integer("score").notNull(),
  breakdownJson: text("breakdown_json").notNull(),
  lastComputed: timestamp("last_computed", { withTimezone: true }).defaultNow(),
});
