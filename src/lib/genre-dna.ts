// Genre DNA — the six-axis fingerprint next to the Taste Score.
//
// Every film contributes exactly 1.0 of genre signal, split across the axes
// that its OMDb genre tags map onto. OMDb lists a film's genres roughly in
// order of prominence, so tags are weighted by position: the primary genre
// counts most, and a "Drama" tacked on as the 3rd tag of a crime film counts
// for little. Each axis is the film's share of the position-weighted genre
// emphasis, averaged across the watch list (0–100). Values do not sum to 100,
// and tags that map to no axis (e.g. sci-fi, fantasy) simply go unrepresented.

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

// OMDb genre tags → axis. Lowercased, exact match after trimming. Every tag
// maps to at most one axis. Crime and film-noir live on the thriller axis
// (not action/drama) so that crime-heavy watch lists surface as a thriller
// lobe instead of being swallowed by Action and Drama.
const AXIS_SETS: Record<keyof GenreDna, Set<string>> = {
  action: new Set(["action", "adventure", "war", "western"]),
  drama: new Set(["drama", "romance", "biography", "history", "sport", "music"]),
  comedy: new Set(["comedy", "family", "animation", "musical"]),
  horror: new Set(["horror"]),
  thriller: new Set(["thriller", "crime", "film-noir"]),
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

// Weights for the 1st, 2nd, 3rd, … genre tag of a film (OMDb's ordering is
// roughly by prominence). Tags beyond the list keep the last weight.
const TAG_WEIGHTS = [1, 0.6, 0.4, 0.25, 0.15, 0.1];

/**
 * Compute genre affinities (0–100) for a list of watched entries. Each film
 * contributes 1.0 of signal, distributed across the axes its genre tags map
 * onto in proportion to tag position. Entries without a movie record are
 * ignored.
 */
export function computeGenreDna(entries: { movie: { genres: string | null } | null }[]): GenreDna {
  const withMovie = entries.filter((e) => e.movie);
  if (withMovie.length === 0) return { ...ZERO_DNA };

  const weighted: GenreDna = { ...ZERO_DNA };
  let filmCount = 0;

  for (const entry of withMovie) {
    const tags = (entry.movie?.genres || "")
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) continue;

    const weights = tags.map((_, i) => TAG_WEIGHTS[Math.min(i, TAG_WEIGHTS.length - 1)]);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    if (totalWeight === 0) continue;

    const shares: GenreDna = { ...ZERO_DNA };
    tags.forEach((tag, i) => {
      for (const axis of AXIS_ORDER) {
        if (AXIS_SETS[axis].has(tag)) {
          shares[axis] += weights[i] / totalWeight;
          break; // each tag maps to at most one axis
        }
      }
    });

    for (const axis of AXIS_ORDER) {
      weighted[axis] += shares[axis];
    }
    filmCount += 1;
  }

  if (filmCount === 0) return { ...ZERO_DNA };

  const result = {} as GenreDna;
  for (const axis of AXIS_ORDER) {
    result[axis] = Math.round((weighted[axis] / filmCount) * 100);
  }
  return result;
}
