export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  passwordHash: string | null;
  createdAt: Date | null;
}

export interface UserSafe {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: Date | null;
}

export interface Movie {
  id: string;
  imdbId: string;
  title: string;
  year: string | null;
  posterUrl: string | null;
  genres: string | null;
  country: string | null;
  director: string | null;
}

export interface WatchedEntry {
  id: string;
  userId: string;
  movieId: string;
  rating: number;
  watchedAt: Date | null;
  note: string | null;
}

export interface WatchedEntryWithMovie extends WatchedEntry {
  movie: Movie | null;
}

export interface Verdict {
  id: string;
  fromUserId: string;
  toUserId: string;
  score: number;
  comment: string | null;
  createdAt: Date | null;
}

export interface VerdictWithUser extends Verdict {
  fromUser: UserSafe | null;
  toUser?: UserSafe | null;
}

export interface LeaderboardRow {
  rank: number;
  user: UserSafe;
  score: number;
}
