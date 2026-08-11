import cors from "cors";
import { config } from "../config.js";

export function corsMiddleware() {
  return cors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }
      const allowed = (config.corsOrigin || "")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
      if (allowed.length === 0 || allowed.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
  });
}
