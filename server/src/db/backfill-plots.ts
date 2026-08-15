import { db } from "./index.js";
import { movies } from "./schema.js";
import { eq, sql } from "drizzle-orm";
import { fetchOmdbDetail } from "../lib/movie-store.js";

/**
 * One-time backfill: movies created before the OMDb request started passing
 * plot=full only have the short one-sentence synopsis stored. Re-fetch the
 * full plot for those and update the rows. Safe to re-run (idempotent).
 */
async function backfillPlots() {
  const rows = await db
    .select({ id: movies.id, imdbId: movies.imdbId, plot: movies.plot })
    .from(movies)
    .where(sql`${movies.plot} IS NULL OR length(${movies.plot}) < 300`);

  console.log(`Found ${rows.length} movie(s) with a short or missing plot.`);

  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    const detail = await fetchOmdbDetail(row.imdbId);
    const fullPlot = detail?.Plot && detail.Plot !== "N/A" ? detail.Plot : null;

    if (!fullPlot || fullPlot.length <= (row.plot?.length ?? 0)) {
      failed++;
      console.log(`  - ${row.imdbId}: no longer plot available, skipped`);
      continue;
    }

    await db.update(movies).set({ plot: fullPlot }).where(eq(movies.id, row.id));
    updated++;
    console.log(`  - ${row.imdbId}: ${(row.plot ?? "").length} -> ${fullPlot.length} chars`);
  }

  console.log(`Done. Updated ${updated}, skipped ${failed}.`);
  process.exit(0);
}

backfillPlots().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
