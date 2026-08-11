import { Request, Response, NextFunction } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error(err);

  const message = err.message || "Internal Server Error";
  let status = 500;

  if (
    message === "Not authenticated" ||
    message === "Invalid session"
  ) {
    status = 401;
  } else if (message === "Not authorized") {
    status = 403;
  } else if (message === "User not found") {
    status = 404;
  } else if (
    message === "Email already in use" ||
    message === "Username already in use" ||
    message === "Movie already in watched list" ||
    message === "Already following" ||
    message === "Already left a verdict on this user" ||
    message === "Cannot follow yourself" ||
    message === "Cannot verdict yourself" ||
    message === "Password must be at least 8 characters"
  ) {
    status = 400;
  }

  res.status(status).json({ error: message });
}
