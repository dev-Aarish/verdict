import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema.js";

neonConfig.fetchFunction = async (url: any, options: any) => {
  let lastError;
  for (let i = 0; i < 3; i++) {
    try {
      return await fetch(url, options);
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 150 * (i + 1)));
    }
  }
  throw lastError;
};

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
