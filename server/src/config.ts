export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  databaseUrl: process.env.DATABASE_URL!,
  omdbApiKey: process.env.OMDB_API_KEY || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:3000",
  cookieSecure: process.env.COOKIE_SECURE === "true",
  nodeEnv: process.env.NODE_ENV || "development",
};
