import cors from "cors";
import { config } from "../config.js";

export function corsMiddleware() {
  return cors({
    origin: config.corsOrigin,
    credentials: true,
  });
}
