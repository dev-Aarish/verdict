import { db } from "../db/index.js";
import { movies } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";

export interface OmdbDetailResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Genre: string;
  Director: string;
  Country: string;
  Plot: string;
  Actors: string;
}

type MovieModel = typeof movies.$inferSelect;

export async function fetchOmdbDetail(imdbId: string): Promise<OmdbDetailResult | null> {
  const key = config.omdbApiKey;
  if (!key) return null;

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", key);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("type", "movie");

  const fetchRes = await fetch(url.toString());
  const detail = (await fetchRes.json()) as OmdbDetailResult & {
    Response?: string;
    Error?: string;
  };

  if (detail.Response === "False") return null;
  return detail;
}

export function fromDetail(imdbId: string, detail: OmdbDetailResult) {
  return {
    imdbId,
    title: detail.Title,
    year: detail.Year && detail.Year !== "N/A" ? detail.Year : null,
    posterUrl: detail.Poster && detail.Poster !== "N/A" ? detail.Poster : null,
    genres: detail.Genre && detail.Genre !== "N/A" ? detail.Genre : null,
    director: detail.Director && detail.Director !== "N/A" ? detail.Director : null,
    country: detail.Country && detail.Country !== "N/A" ? detail.Country : null,
    plot: detail.Plot && detail.Plot !== "N/A" ? detail.Plot : null,
    actors: detail.Actors && detail.Actors !== "N/A" ? detail.Actors : null,
  };
}

// Returns an existing movie by imdbId, or creates it (enriched from OMDb when
// the supplied minimal fields are missing). Returns null when the movie cannot
// be resolved against OMDb.
export async function findOrCreateMovie(fields: {
  imdbId: string;
  title?: string;
  year?: string;
  posterUrl?: string | null;
}): Promise<MovieModel | null> {
  const existing = await db
    .select()
    .from(movies)
    .where(eq(movies.imdbId, fields.imdbId))
    .then((r) => r[0]);

  if (existing) return existing;

  const detail = await fetchOmdbDetail(fields.imdbId);
  if (!detail) return null;

  const detailFields = fromDetail(fields.imdbId, detail);
  const inserted = await db
    .insert(movies)
    .values({
      id: uuidv4(),
      imdbId: fields.imdbId,
      title: detailFields.title || fields.title || "Unknown",
      year: detailFields.year || fields.year || null,
      posterUrl: detailFields.posterUrl || fields.posterUrl || null,
      genres: detailFields.genres,
      director: detailFields.director,
      country: detailFields.country,
      plot: detailFields.plot,
      actors: detailFields.actors,
    })
    .returning();

  return inserted[0];
}
