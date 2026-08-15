import { db } from "../db/index.js";
import { movies } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { config } from "../config.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

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
  Runtime: string;
  Rated: string;
  Released: string;
  Writer: string;
  Language: string;
  Awards: string;
  BoxOffice: string;
  Production: string;
  DVD: string;
  Website: string;
}

/** The normalized movie detail shape both OMDb and TMDb map into. */
export interface MovieDetailFields {
  imdbId: string;
  title: string | null;
  year: string | null;
  posterUrl: string | null;
  genres: string | null;
  director: string | null;
  country: string | null;
  plot: string | null;
  actors: string | null;
  runtime: number | null;
  rated: string | null;
  released: string | null;
  writer: string | null;
  language: string | null;
  awards: string | null;
  boxOffice: string | null;
  production: string | null;
  dvd: string | null;
  website: string | null;
}

type MovieModel = typeof movies.$inferSelect;

// ---------------------------------------------------------------------------
// TMDb
// ---------------------------------------------------------------------------

async function tmdbFetch(path: string): Promise<any | null> {
  const key = config.tmdbApiKey;
  if (!key) return null;
  try {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set("api_key", key);
    url.searchParams.set("language", "en-US");
    const res = await fetch(url.toString());
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

interface TmdbSearchItem {
  id: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
}

export interface OmdbShapedSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
}

/**
 * Search movies via TMDb, resolving each result's IMDb id so the rest of the
 * app can keep keying everything off imdbId. Returns results in the same
 * shape OMDb used to provide, so the client needs no changes.
 */
export async function searchTmdb(
  query: string,
  page: number,
): Promise<{ results: OmdbShapedSearchResult[]; totalResults: number; totalPages: number } | null> {
  const data = await tmdbFetch(
    `/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
  );
  if (!data?.results) return null;

  const items: TmdbSearchItem[] = data.results;
  const resolved = await Promise.all(
    items.map(async (item) => {
      const ext = await tmdbFetch(`/movie/${item.id}/external_ids`);
      const imdbID = ext?.imdb_id;
      if (!imdbID) return null;
      return {
        imdbID,
        Title: item.title || item.original_title || "Unknown",
        Year: item.release_date ? item.release_date.slice(0, 4) : "",
        Poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : "N/A",
        Type: "movie",
      };
    }),
  );

  return {
    results: resolved.filter((r): r is OmdbShapedSearchResult => r !== null),
    totalResults: data.total_results || 0,
    totalPages: Math.min(data.total_pages || 1, 500),
  };
}

function formatReleaseDate(iso: string | undefined | null): string | null {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const d = new Date(`${iso}T00:00:00Z`);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function formatBoxOffice(revenue: number | undefined): string | null {
  if (!revenue || revenue <= 0) return null;
  return `$${revenue.toLocaleString("en-US")}`;
}

/**
 * Map a TMDb movie detail (with credits + release_dates appended) into our
 * normalized detail shape. TMDb has no awards data — that's filled in later
 * from OMDb by fetchEnrichedDetail.
 */
export function fromTmdbDetail(imdbId: string, detail: any): MovieDetailFields {
  const crew = detail.credits?.crew || [];
  const cast = detail.credits?.cast || [];
  const director = crew.find((c: any) => c.job === "Director")?.name || null;
  const writer = [
    ...new Set(
      crew
        .filter((c: any) => ["Screenplay", "Writer", "Story", "Novel"].includes(c.job))
        .map((c: any) => c.name),
    ),
  ].join(", ") || null;
  const usRelease = (detail.release_dates?.results || []).find(
    (r: any) => r.iso_3166_1 === "US",
  );
  const usDates = usRelease?.release_dates || [];
  const rated =
    usDates.find((d: any) => d.certification && d.certification.trim() !== "")?.certification ||
    null;
  // TMDb release types: 5 = physical (DVD/Blu-ray), 4 = digital
  const dvdDate = usDates.find((d: any) => d.type === 5)?.release_date ||
    usDates.find((d: any) => d.type === 4)?.release_date ||
    null;

  return {
    imdbId,
    title: detail.title || detail.original_title || null,
    year: detail.release_date ? detail.release_date.slice(0, 4) : null,
    posterUrl: detail.poster_path ? `${TMDB_IMAGE}${detail.poster_path}` : null,
    genres: (detail.genres || []).map((g: any) => g.name).join(", ") || null,
    director,
    country: detail.production_countries?.[0]?.name || null,
    plot: detail.overview || null,
    actors: cast.slice(0, 10).map((c: any) => c.name).join(", ") || null,
    runtime: typeof detail.runtime === "number" && detail.runtime > 0 ? detail.runtime : null,
    rated,
    released: formatReleaseDate(detail.release_date),
    writer,
    language:
      (detail.spoken_languages || []).map((l: any) => l.english_name || l.name).join(", ") ||
      null,
    awards: null, // TMDb has no awards — backfilled from OMDb by fetchEnrichedDetail
    boxOffice: formatBoxOffice(detail.revenue),
    production: detail.production_companies?.[0]?.name || null,
    dvd: formatReleaseDate(dvdDate),
    website: detail.homepage || null,
  };
}

/**
 * Resolve an IMDb id against TMDb and return the full mapped detail.
 * Returns null when TMDb doesn't know the film (or no key is configured).
 */
export async function fetchTmdbDetailByImdbId(
  imdbId: string,
): Promise<MovieDetailFields | null> {
  const found = await tmdbFetch(`/find/${imdbId}?external_source=imdb_id`);
  const match = found?.movie_results?.[0];
  if (!match?.id) return null;

  const detail = await tmdbFetch(
    `/movie/${match.id}?append_to_response=credits,release_dates`,
  );
  if (!detail) return null;

  return fromTmdbDetail(imdbId, detail);
}

/**
 * Best-effort full detail: TMDb first (longer overviews, richer metadata),
 * then OMDb to fill in awards, which TMDb doesn't provide.
 */
export async function fetchEnrichedDetail(imdbId: string): Promise<MovieDetailFields | null> {
  const tmdb = await fetchTmdbDetailByImdbId(imdbId);
  if (!tmdb) return null;

  if (!tmdb.awards) {
    const omdb = await fetchOmdbDetail(imdbId);
    if (omdb?.Awards && omdb.Awards !== "N/A") tmdb.awards = omdb.Awards;
  }
  return tmdb;
}

// ---------------------------------------------------------------------------
// OMDb (kept as a fallback source)
// ---------------------------------------------------------------------------

export async function fetchOmdbDetail(imdbId: string): Promise<OmdbDetailResult | null> {
  const key = config.omdbApiKey;
  if (!key) return null;

  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", key);
  url.searchParams.set("i", imdbId);
  url.searchParams.set("type", "movie");
  // OMDb defaults to a short one-sentence synopsis; we want the full plot.
  url.searchParams.set("plot", "full");

  const fetchRes = await fetch(url.toString());
  const detail = (await fetchRes.json()) as OmdbDetailResult & {
    Response?: string;
    Error?: string;
  };

  if (detail.Response === "False") return null;
  return detail;
}

function parseRuntime(raw: string): number | null {
  if (!raw || raw === "N/A") return null;
  const minutes = parseInt(raw, 10);
  return Number.isFinite(minutes) && minutes > 0 ? minutes : null;
}

function clean(value: string | undefined | null): string | null {
  return value && value !== "N/A" ? value : null;
}

export function fromDetail(imdbId: string, detail: OmdbDetailResult): MovieDetailFields {
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
    runtime: parseRuntime(detail.Runtime),
    rated: clean(detail.Rated),
    released: clean(detail.Released),
    writer: clean(detail.Writer),
    language: clean(detail.Language),
    awards: clean(detail.Awards),
    boxOffice: clean(detail.BoxOffice),
    production: clean(detail.Production),
    dvd: clean(detail.DVD),
    website: clean(detail.Website),
  };
}

// Returns an existing movie by imdbId, or creates it (enriched from TMDb,
// falling back to OMDb when TMDb can't resolve it). Returns null when the
// movie cannot be resolved against either source.
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

  let detail = await fetchEnrichedDetail(fields.imdbId);
  if (!detail) {
    const omdb = await fetchOmdbDetail(fields.imdbId);
    detail = omdb ? fromDetail(fields.imdbId, omdb) : null;
  }
  if (!detail) return null;

  const inserted = await db
    .insert(movies)
    .values({
      id: uuidv4(),
      imdbId: fields.imdbId,
      title: detail.title || fields.title || "Unknown",
      year: detail.year || fields.year || null,
      posterUrl: detail.posterUrl || fields.posterUrl || null,
      genres: detail.genres,
      director: detail.director,
      country: detail.country,
      plot: detail.plot,
      actors: detail.actors,
      runtime: detail.runtime,
      rated: detail.rated,
      released: detail.released,
      writer: detail.writer,
      language: detail.language,
      awards: detail.awards,
      boxOffice: detail.boxOffice,
      production: detail.production,
      dvd: detail.dvd,
      website: detail.website,
    })
    .returning();

  return inserted[0];
}
