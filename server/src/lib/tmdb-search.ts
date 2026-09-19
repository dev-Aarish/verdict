import { config } from "../config.js";

const TMDB_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE = "https://image.tmdb.org/t/p/w500";

export async function tmdbFetch(path: string): Promise<any | null> {
  const key = config.tmdbApiKey;
  if (!key) return null;
  try {
    const url = new URL(`${TMDB_BASE}${path}`);
    url.searchParams.set("api_key", key);
    if (!url.searchParams.has("language")) {
      url.searchParams.set("language", "en-US");
    }
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export interface TmdbSearchItem {
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
  popularity?: number;
}

export interface TmdbPersonResult {
  id: number;
  name: string;
  original_name?: string;
  known_for_department?: string;
  popularity?: number;
  profile_path?: string | null;
  known_for?: TmdbSearchItem[];
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
  "sci fi": 878,
  "sci-fi": 878,
  "science fiction": 878,
  thriller: 53,
  war: 10752,
  western: 37,
  "tv movie": 10770,
};

// Known cinematic keywords / niche categories in TMDb (keyword IDs)
export const TMDB_CATEGORY_KEYWORDS: Record<string, number> = {
  noir: 9807,
  "film noir": 9807,
  "neo noir": 207268,
  "neo-noir": 207268,
  neonoir: 207268,
  cyberpunk: 12190,
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
  surrealism: 156176,
  "time travel": 4379,
  "post apocalyptic": 2853,
  "post-apocalyptic": 2853,
  slasher: 12339,
  zombie: 12377,
  spy: 470,
  heist: 10051,
  space: 9882,
  "martial arts": 779,
};

export function normalizeText(text: string): string {
  return (text || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchGenreOrCategory(query: string): { genreId?: number; keywordId?: number } | null {
  const normalized = normalizeText(query);
  if (!normalized) return null;

  if (TMDB_GENRES[normalized]) {
    return { genreId: TMDB_GENRES[normalized] };
  }

  if (TMDB_CATEGORY_KEYWORDS[normalized]) {
    return { keywordId: TMDB_CATEGORY_KEYWORDS[normalized] };
  }

  // Exact matching for "X movies" or "X films" or "X cinema"
  const stripped = normalized
    .replace(/\s+(movies|films|film|movie|cinema|genre)$/i, "")
    .trim();

  if (stripped && TMDB_GENRES[stripped]) {
    return { genreId: TMDB_GENRES[stripped] };
  }

  if (stripped && TMDB_CATEGORY_KEYWORDS[stripped]) {
    return { keywordId: TMDB_CATEGORY_KEYWORDS[stripped] };
  }

  return null;
}

export interface PersonCreditCandidate {
  item: TmdbSearchItem;
  personName: string;
  role: "Director" | "Actor";
  personPopularity: number;
}

/**
 * Search people (Directors and Actors) and fetch their top canonical filmography credits.
 */
export async function searchTmdbPeopleCredits(
  query: string,
): Promise<PersonCreditCandidate[]> {
  const normQuery = normalizeText(query);
  if (normQuery.length < 2) return [];

  const data = await tmdbFetch(
    `/search/person?query=${encodeURIComponent(query)}&page=1&include_adult=false`,
  );
  const results: TmdbPersonResult[] = data?.results || [];
  if (results.length === 0) return [];

  // Filter and prioritize high-relevance persons (e.g. Directors, Actors)
  const scoredPersons = results
    .map((person) => {
      const normName = normalizeText(person.name || person.original_name || "");
      const isExactName = normName === normQuery;
      const isNameMatch =
        normName.includes(normQuery) ||
        normQuery.split(" ").some((w) => w.length >= 3 && normName.includes(w));

      if (!isNameMatch && (person.popularity || 0) < 3.0) {
        return null;
      }

      const isDirector = person.known_for_department === "Directing";
      const isActor = person.known_for_department === "Acting";

      // Department & name priority score
      let personScore = (person.popularity || 0);
      if (isExactName) personScore += 50;
      if (isDirector) personScore += 20;
      else if (isActor) personScore += 10;

      return { person, personScore };
    })
    .filter((p): p is { person: TmdbPersonResult; personScore: number } => p !== null)
    .sort((a, b) => b.personScore - a.personScore);

  // Take top 2 most prominent matching persons
  const topPersons = scoredPersons.slice(0, 2).map((p) => p.person);
  const candidates: PersonCreditCandidate[] = [];

  await Promise.all(
    topPersons.map(async (person) => {
      const credits = await tmdbFetch(
        `/person/${person.id}/movie_credits?language=en-US`,
      );
      if (!credits) return;

      const isActingDept = person.known_for_department === "Acting";

      // 1. Directed films
      const directedList: TmdbSearchItem[] = (credits.crew || [])
        .filter((c: any) => c.job === "Director" && c.id)
        .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0));

      for (const item of directedList.slice(0, 15)) {
        candidates.push({
          item,
          personName: person.name,
          role: "Director",
          personPopularity: person.popularity || 1,
        });
      }

      // 2. If actor or if no director credits, also include top acting credits
      if (isActingDept || directedList.length === 0) {
        const actingList: TmdbSearchItem[] = (credits.cast || [])
          .filter((c: any) => (c.vote_count || 0) >= 30 && c.id)
          .sort((a: any, b: any) => (b.vote_count || 0) - (a.vote_count || 0));

        for (const item of actingList.slice(0, 12)) {
          candidates.push({
            item,
            personName: person.name,
            role: "Actor",
            personPopularity: person.popularity || 1,
          });
        }
      }
    }),
  );

  return candidates;
}

interface CandidateMovie {
  item: TmdbSearchItem;
  score: number;
  sources: Set<string>;
}

/**
 * Resolves TMDb items by fetching external IDs (IMDb ID) and formatting to OmdbShapedSearchResult.
 */
export async function resolveTmdbItems(
  rawItems: TmdbSearchItem[],
): Promise<OmdbShapedSearchResult[]> {
  const seenIds = new Set<number>();
  const uniqueItems = rawItems.filter((item) => {
    if (!item.id || seenIds.has(item.id)) return false;
    seenIds.add(item.id);
    return true;
  });

  const resolved = await Promise.all(
    uniqueItems.map(async (item) => {
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

  return resolved.filter((r): r is OmdbShapedSearchResult => r !== null);
}

/**
 * Multi-Dimensional TMDb Search Engine:
 * 1. Title Match: /search/movie?query=...
 * 2. Genre & Keyword Discovery: /discover/movie with genre/keyword IDs
 * 3. People / Director / Actor Discovery: /search/person & /person/{id}/movie_credits
 * 4. Smart Fusion & De-duplication: Multi-dimensional scoring with priority to exact title matches.
 */
export async function searchTmdb(
  query: string,
  page: number = 1,
  genreId?: number,
  keywordId?: number,
): Promise<{ results: OmdbShapedSearchResult[]; totalResults: number; totalPages: number } | null> {
  const trimmedQuery = query.trim();
  const categoryMatch =
    genreId || keywordId
      ? { genreId, keywordId }
      : matchGenreOrCategory(trimmedQuery);

  // If ONLY genre/keyword filter is active and text query is empty:
  if (!trimmedQuery && categoryMatch) {
    let discoverUrl = `/discover/movie?page=${page}&include_adult=false&sort_by=vote_count.desc`;
    if (categoryMatch.genreId) {
      discoverUrl += `&with_genres=${categoryMatch.genreId}`;
    }
    if (categoryMatch.keywordId) {
      discoverUrl += `&with_keywords=${categoryMatch.keywordId}`;
    }

    const discoverData = await tmdbFetch(discoverUrl);
    const rawItems: TmdbSearchItem[] = discoverData?.results || [];
    const totalResults = discoverData?.total_results || 0;
    const totalPages = Math.min(discoverData?.total_pages || 1, 500);

    const resolved = await resolveTmdbItems(rawItems);
    return {
      results: resolved,
      totalResults,
      totalPages,
    };
  }

  if (!trimmedQuery && !categoryMatch) {
    return { results: [], totalResults: 0, totalPages: 0 };
  }

  const normQuery = normalizeText(trimmedQuery);

  // On page > 1 with normal text search, standard paginated search:
  if (page > 1 && !categoryMatch) {
    const data = await tmdbFetch(
      `/search/movie?query=${encodeURIComponent(trimmedQuery)}&page=${page}&include_adult=false`,
    );
    if (!data?.results) return null;
    const resolved = await resolveTmdbItems(data.results);
    return {
      results: resolved,
      totalResults: data.total_results || 0,
      totalPages: Math.min(data.total_pages || 1, 500),
    };
  }

  // Parallel dimensional discovery for page 1 (or category-matched paginated searches):
  const [titleData, personCandidates, discoverData] = await Promise.all([
    trimmedQuery
      ? tmdbFetch(
          `/search/movie?query=${encodeURIComponent(trimmedQuery)}&page=${page}&include_adult=false`,
        )
      : Promise.resolve(null),
    trimmedQuery ? searchTmdbPeopleCredits(trimmedQuery) : Promise.resolve([]),
    categoryMatch
      ? (async () => {
          let discoverUrl = `/discover/movie?page=${page}&include_adult=false&sort_by=vote_count.desc`;
          if (categoryMatch.genreId) {
            discoverUrl += `&with_genres=${categoryMatch.genreId}`;
          }
          if (categoryMatch.keywordId) {
            discoverUrl += `&with_keywords=${categoryMatch.keywordId}`;
          }
          return await tmdbFetch(discoverUrl);
        })()
      : Promise.resolve(null),
  ]);

  const candidateMap = new Map<number, CandidateMovie>();

  function getOrCreate(item: TmdbSearchItem): CandidateMovie {
    let existing = candidateMap.get(item.id);
    if (!existing) {
      existing = {
        item,
        score: 0,
        sources: new Set(),
      };
      candidateMap.set(item.id, existing);
    }
    if (!existing.item.overview && item.overview) existing.item.overview = item.overview;
    if (!existing.item.poster_path && item.poster_path) existing.item.poster_path = item.poster_path;
    if (!existing.item.vote_count && item.vote_count) existing.item.vote_count = item.vote_count;
    if (!existing.item.vote_average && item.vote_average) existing.item.vote_average = item.vote_average;
    return existing;
  }

  // 1. Process Title Match Candidates
  const titleResults: TmdbSearchItem[] = titleData?.results || [];
  for (let i = 0; i < titleResults.length; i++) {
    const item = titleResults[i];
    if (!item.id) continue;
    const candidate = getOrCreate(item);
    candidate.sources.add("title");

    const positionBoost = Math.max(0, 500 - i * 20);
    const votesBoost = Math.min(1000, Math.log10((item.vote_count || 1) + 1) * 200);
    const popBoost = Math.min(300, (item.popularity || 0) * 3);
    candidate.score += 1000 + positionBoost + votesBoost + popBoost;
  }

  // 2. Process Person Credits (Directors & Actors)
  for (const pc of personCandidates) {
    const item = pc.item;
    if (!item.id) continue;
    const candidate = getOrCreate(item);
    candidate.sources.add(`person_${pc.role.toLowerCase()}`);

    const voteWeight = Math.min(2500, Math.log10((item.vote_count || 1) + 1) * 500);
    const ratingWeight = (item.vote_average || 0) * 50;
    const personPopWeight = Math.min(500, pc.personPopularity * 10);

    if (pc.role === "Director") {
      candidate.score += 6500 + voteWeight + ratingWeight + personPopWeight;
    } else {
      candidate.score += 2500 + voteWeight * 0.7 + ratingWeight * 0.5 + personPopWeight;
    }
  }

  // 3. Process Genre / Keyword Discover Candidates
  const discoverResults: TmdbSearchItem[] = discoverData?.results || [];
  for (let i = 0; i < discoverResults.length; i++) {
    const item = discoverResults[i];
    if (!item.id) continue;
    const candidate = getOrCreate(item);
    candidate.sources.add("genre_discover");

    const voteWeight = Math.min(2500, Math.log10((item.vote_count || 1) + 1) * 450);
    const ratingWeight = (item.vote_average || 0) * 50;
    candidate.score += 2500 + voteWeight + ratingWeight;
  }

  // 4. Exact Title Match Boosting & Precision Calibration
  if (normQuery.length > 0) {
    for (const candidate of candidateMap.values()) {
      const normTitle = normalizeText(candidate.item.title || "");
      const normOrigTitle = normalizeText(candidate.item.original_title || "");

      // Exact title match gets supreme priority (+10,000)
      if (normTitle === normQuery || normOrigTitle === normQuery) {
        candidate.score += 10000;
        candidate.sources.add("exact_title");
      } else if (
        normTitle.startsWith(normQuery + " ") ||
        normTitle.startsWith(normQuery + ":") ||
        normTitle.startsWith(normQuery + " -")
      ) {
        candidate.score += 2000;
      } else if (
        new RegExp(`\\b${normQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(normTitle)
      ) {
        candidate.score += 1000;
      }
    }
  }

  // Sort candidates by total composite score descending
  const sortedCandidates = Array.from(candidateMap.values()).sort(
    (a, b) => b.score - a.score,
  );

  if (sortedCandidates.length === 0) {
    return {
      results: [],
      totalResults: 0,
      totalPages: 0,
    };
  }

  const PAGE_SIZE = 20;
  const startIndex = (page - 1) * PAGE_SIZE;
  const pageCandidates = sortedCandidates.slice(startIndex, startIndex + PAGE_SIZE + 10);

  const resolved = await resolveTmdbItems(pageCandidates.map((c) => c.item));
  const pageResults = resolved.slice(0, PAGE_SIZE);

  const totalResults = Math.max(
    sortedCandidates.length,
    titleData?.total_results || 0,
    discoverData?.total_results || 0,
  );
  const totalPages = Math.min(
    Math.max(
      Math.ceil(sortedCandidates.length / PAGE_SIZE),
      titleData?.total_pages || 1,
      discoverData?.total_pages || 1,
    ),
    500,
  );

  return {
    results: pageResults,
    totalResults,
    totalPages,
  };
}
