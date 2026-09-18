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
  overview?: string | null;
  genre_ids?: number[];
  vote_average?: number;
  vote_count?: number;
  original_language?: string;
}

export interface OmdbShapedSearchResult {
  imdbID: string;
  Title: string;
  Year: string;
  Poster: string;
  Type: string;
  releaseDate: string | null;
  plot: string | null;
  genres: string | null;
  imdbRating: string | null;
  voteCount: number | null;
  language: string | null;
}

export const TMDB_GENRE_MAP: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Sci-Fi",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

// TMDb official genre IDs and common cinephile category mappings
export const TMDB_GENRES: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  anime: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  historical: 36,
  horror: 27,
  music: 10402,
  musical: 10402,
  mystery: 9648,
  romance: 10749,
  romantic: 10749,
  scifi: 878,
  "sci-fi": 878,
  "science fiction": 878,
  thriller: 53,
  war: 10752,
  western: 37,
};

// Known cinematic keywords / niche categories in TMDb (keyword IDs)
export const TMDB_CATEGORY_KEYWORDS: Record<string, number> = {
  noir: 3170,
  "film noir": 3170,
  "neo-noir": 9976,
  cyberpunk: 10084,
  cult: 9799,
  "cult classic": 9799,
  dystopia: 4565,
  dystopian: 4565,
  arthouse: 187056,
  indie: 10183,
  "independent film": 10183,
  psychological: 12565,
  "psychological thriller": 12565,
  superhero: 9715,
};

function matchGenreOrCategory(query: string): { genreId?: number; keywordId?: number } | null {
  const normalized = query.trim().toLowerCase();
  
  if (TMDB_GENRES[normalized]) {
    return { genreId: TMDB_GENRES[normalized] };
  }

  if (TMDB_CATEGORY_KEYWORDS[normalized]) {
    return { keywordId: TMDB_CATEGORY_KEYWORDS[normalized] };
  }

  // Partial phrase matching
  for (const [key, id] of Object.entries(TMDB_GENRES)) {
    if (normalized === key || normalized === `${key} movies` || normalized === `${key} films`) {
      return { genreId: id };
    }
  }

  for (const [key, id] of Object.entries(TMDB_CATEGORY_KEYWORDS)) {
    if (normalized === key || normalized === `${key} movies` || normalized === `${key} films`) {
      return { keywordId: id };
    }
  }

  return null;
}

/**
 * Search movies via TMDb with smart Genre/Category discovery support.
 * If the search query matches a genre or category/style (or if discover parameters are passed),
 * TMDb discover endpoint is utilized to surface canonical films rather than just literal title matches.
 */
export async function searchTmdb(
  query: string,
  page: number,
  genreId?: number,
): Promise<{ results: OmdbShapedSearchResult[]; totalResults: number; totalPages: number } | null> {
  const categoryMatch = genreId ? { genreId } : matchGenreOrCategory(query);

  let rawItems: TmdbSearchItem[] = [];
  let totalResults = 0;
  let totalPages = 1;

  if (categoryMatch) {
    // If it's a recognized genre or keyword, query TMDb /discover/movie for popular/highly rated films
    let discoverUrl = `/discover/movie?page=${page}&include_adult=false&sort_by=vote_count.desc`;
    if (categoryMatch.genreId) {
      discoverUrl += `&with_genres=${categoryMatch.genreId}`;
    }
    if (categoryMatch.keywordId) {
      discoverUrl += `&with_keywords=${categoryMatch.keywordId}`;
    }

    // Also run title search in parallel if it's not a generic word to ensure direct titles aren't missed
    const [discoverData, titleData] = await Promise.all([
      tmdbFetch(discoverUrl),
      tmdbFetch(`/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`),
    ]);

    const titleResults = titleData?.results || [];
    const discoverResults = discoverData?.results || [];

    // Prioritize discover results for clear genre queries, and mix in title matches
    const combined = [...discoverResults, ...titleResults];
    const seen = new Set<number>();
    for (const item of combined) {
      if (item.id && !seen.has(item.id)) {
        seen.add(item.id);
        rawItems.push(item);
      }
    }

    totalResults = Math.max(discoverData?.total_results || 0, titleData?.total_results || 0);
    totalPages = Math.min(Math.max(discoverData?.total_pages || 1, titleData?.total_pages || 1), 500);
  } else {
    // Standard title search
    const data = await tmdbFetch(
      `/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`,
    );
    if (!data?.results) return null;

    rawItems = data.results;
    totalResults = data.total_results || 0;
    totalPages = Math.min(data.total_pages || 1, 500);
  }

  const resolved = await Promise.all(
    rawItems.map(async (item) => {
      const ext = await tmdbFetch(`/movie/${item.id}/external_ids`);
      const imdbID = ext?.imdb_id;
      if (!imdbID) return null;

      const genresStr =
        item.genre_ids && item.genre_ids.length > 0
          ? item.genre_ids
              .map((id) => TMDB_GENRE_MAP[id])
              .filter(Boolean)
              .join(", ")
          : null;

      return {
        imdbID,
        Title: item.title || item.original_title || "Unknown",
        Year: item.release_date ? item.release_date.slice(0, 4) : "",
        Poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : "N/A",
        Type: "movie",
        releaseDate: item.release_date || null,
        plot: item.overview && item.overview.trim() !== "" ? item.overview.trim() : null,
        genres: genresStr,
        imdbRating:
          item.vote_average && item.vote_average > 0
            ? item.vote_average.toFixed(1)
            : null,
        voteCount: item.vote_count || null,
        language: item.original_language ? item.original_language.toUpperCase() : null,
      };
    }),
  );

  return {
    results: resolved.filter((r): r is OmdbShapedSearchResult => r !== null),
    totalResults,
    totalPages,
  };
}

export async function getTrendingTmdb(
  page: number = 1,
): Promise<{ results: OmdbShapedSearchResult[]; totalResults: number; totalPages: number } | null> {
  const today = new Date().toISOString().slice(0, 10);
  const [trendingData, nowPlayingData] = await Promise.all([
    tmdbFetch(`/trending/movie/week?page=${page}&language=en-US`),
    tmdbFetch(`/movie/now_playing?page=${page}&language=en-US`),
  ]);

  const rawList: TmdbSearchItem[] = [
    ...(trendingData?.results || []),
    ...(nowPlayingData?.results || []),
  ];

  if (rawList.length === 0) return null;

  // Deduplicate and filter: ONLY released movies (release_date <= today)
  const seenTmdbIds = new Set<number>();
  const releasedItems: TmdbSearchItem[] = [];

  for (const item of rawList) {
    if (!item.id || seenTmdbIds.has(item.id)) continue;
    seenTmdbIds.add(item.id);

    if (item.release_date && item.release_date <= today) {
      releasedItems.push(item);
    }
  }

  const resolved = await Promise.all(
    releasedItems.map(async (item) => {
      const ext = await tmdbFetch(`/movie/${item.id}/external_ids`);
      const imdbID = ext?.imdb_id;
      if (!imdbID) return null;

      const genresStr =
        item.genre_ids && item.genre_ids.length > 0
          ? item.genre_ids
              .map((id) => TMDB_GENRE_MAP[id])
              .filter(Boolean)
              .join(", ")
          : null;

      return {
        imdbID,
        Title: item.title || item.original_title || "Unknown",
        Year: item.release_date ? item.release_date.slice(0, 4) : "",
        Poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : "N/A",
        Type: "movie",
        releaseDate: item.release_date || null,
        plot: item.overview && item.overview.trim() !== "" ? item.overview.trim() : null,
        genres: genresStr,
        imdbRating:
          item.vote_average && item.vote_average > 0
            ? item.vote_average.toFixed(1)
            : null,
        voteCount: item.vote_count || null,
        language: item.original_language ? item.original_language.toUpperCase() : null,
      };
    }),
  );

  const results = resolved.filter((r): r is OmdbShapedSearchResult => r !== null);

  return {
    results,
    totalResults: results.length,
    totalPages: Math.max(trendingData?.total_pages || 1, nowPlayingData?.total_pages || 1),
  };
}

export async function getUpcomingTmdb(
  page: number = 1,
): Promise<{ results: OmdbShapedSearchResult[]; totalResults: number; totalPages: number } | null> {
  const today = new Date().toISOString().slice(0, 10);

  const [discoverData, upcomingData] = await Promise.all([
    tmdbFetch(
      `/discover/movie?include_adult=false&language=en-US&sort_by=popularity.desc&primary_release_date.gte=${today}&page=${page}`,
    ),
    tmdbFetch(`/movie/upcoming?page=${page}&language=en-US`),
  ]);

  const rawList: TmdbSearchItem[] = [
    ...(discoverData?.results || []),
    ...(upcomingData?.results || []),
  ];

  if (rawList.length === 0) return null;

  // Deduplicate and filter: STRICTLY unreleased movies (release_date > today)
  const seenTmdbIds = new Set<number>();
  const upcomingItems: TmdbSearchItem[] = [];

  for (const item of rawList) {
    if (!item.id || seenTmdbIds.has(item.id)) continue;
    seenTmdbIds.add(item.id);

    if (item.release_date && item.release_date > today) {
      upcomingItems.push(item);
    }
  }

  const resolved = await Promise.all(
    upcomingItems.map(async (item) => {
      const ext = await tmdbFetch(`/movie/${item.id}/external_ids`);
      const imdbID = ext?.imdb_id;
      if (!imdbID) return null;

      const genresStr =
        item.genre_ids && item.genre_ids.length > 0
          ? item.genre_ids
              .map((id) => TMDB_GENRE_MAP[id])
              .filter(Boolean)
              .join(", ")
          : null;

      return {
        imdbID,
        Title: item.title || item.original_title || "Unknown",
        Year: item.release_date ? item.release_date.slice(0, 4) : "",
        Poster: item.poster_path ? `${TMDB_IMAGE}${item.poster_path}` : "N/A",
        Type: "movie",
        releaseDate: item.release_date || null,
        plot: item.overview && item.overview.trim() !== "" ? item.overview.trim() : null,
        genres: genresStr,
        imdbRating:
          item.vote_average && item.vote_average > 0
            ? item.vote_average.toFixed(1)
            : null,
        voteCount: item.vote_count || null,
        language: item.original_language ? item.original_language.toUpperCase() : null,
      };
    }),
  );

  const results = resolved.filter((r): r is OmdbShapedSearchResult => r !== null);

  return {
    results,
    totalResults: results.length,
    totalPages: Math.max(discoverData?.total_pages || 1, upcomingData?.total_pages || 1),
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
