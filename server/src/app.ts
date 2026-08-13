import express from "express";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import { corsMiddleware } from "./middleware/cors.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { moviesRouter } from "./routes/movies.js";
import { usersRouter } from "./routes/users.js";
import { tasteScoreRouter } from "./routes/taste-score.js";
import { tasteMatchRouter } from "./routes/taste-match.js";
import { verdictsRouter } from "./routes/verdicts.js";
import { followsRouter } from "./routes/follows.js";
import { feedRouter } from "./routes/feed.js";
import { watchlistRouter } from "./routes/watchlist.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(cookieParser());
  app.use(corsMiddleware());

  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/movies", moviesRouter);
  app.use("/api/users", usersRouter);
  app.use("/api/users", tasteScoreRouter);
  app.use("/api/users", tasteMatchRouter);
  app.use("/api/verdicts", verdictsRouter);
  app.use("/api/follows", followsRouter);
  app.use("/api/feed", feedRouter);
  app.use("/api/watchlist", watchlistRouter);

  app.use(errorHandler);

  return app;
}
