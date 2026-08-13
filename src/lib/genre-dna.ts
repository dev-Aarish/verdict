// Genre DNA — the six-axis fingerprint next to the Taste Score.
//
// Each axis is the share of a user's watched films whose OMDb genre tags map
// onto that axis. A film can count toward several axes (e.g. "Action, Comedy"),
// so the percentages do not need to sum to 100.

export interface GenreDna {
  action: number;
  drama: number;
  comedy: number;
  horror: number;
  thriller: number;
  mystery: number;
}

export const ZERO_DNA: GenreDna = {
  action: 0,
  drama: 0,
  comedy: 0,
  horror: 0,
  thriller: 0,
  mystery: 0,
};

// OMDb genre tags → axis. Lowercased, exact match after trimming.
const AXIS_SETS: Record<keyof GenreDna, Set<string>> = {
  action: new Set(["action", "adventure", "crime", "war", "western"]),
  drama: new Set(["drama", "romance", "biography", "history", "sport", "music", "film-noir"]),
  comedy: new Set(["comedy", "family", "animation", "musical"]),
  horror: new Set(["horror"]),
  thriller: new Set(["thriller"]),
  mystery: new Set(["mystery"]),
};

const AXIS_ORDER: (keyof GenreDna)[] = [
  "action",
  "drama",
  "comedy",
  "horror",
  "thriller",
  "mystery",
];

/**
 * Compute genre affinities (0–100) for a list of watched entries. Entries
 * without a movie record are ignored; films whose tags match no axis simply
 * contribute to none.
 */
export function computeGenreDna(entries: { movie: { genres: string | null } | null }[]): GenreDna {
  const withMovie = entries.filter((e) => e.movie);
  const total = withMovie.length;
  if (total === 0) return { ...ZERO_DNA };

  const counts: GenreDna = { ...ZERO_DNA };
  for (const entry of withMovie) {
    const tags = (entry.movie?.genres || "")
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);

    for (const axis of AXIS_ORDER) {
      if (tags.some((g) => AXIS_SETS[axis].has(g))) {
        counts[axis] += 1;
      }
    }
  }

  const result = {} as GenreDna;
  for (const axis of AXIS_ORDER) {
    result[axis] = Math.round((counts[axis] / total) * 100);
  }
  return result;
}
