// Genre DNA — the six-axis fingerprint next to the Taste Score.
//
// Every film contributes genre signal, distributed across the axes that its
// genre tags map onto. Tags are weighted by prominence: primary genre counts
// most, secondary tags count less.
// Major genres (including Sci-Fi, Fantasy, Animation, and Documentary) are
// mapped onto the 6 primary axes so no film signal is lost.
// For active accounts, recent films carry a gentle recency multiplier so that
// newly logged movies visibly shift the radar rather than getting buried.

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

// Genre tags → axis mappings (lowercased, trimmed).
// Every tag maps to at most one axis.
// - Fantasy & martial arts join action/adventure
// - Romance, biography, history, documentary & music join drama
// - Animation and family join comedy
// - Crime, film-noir & suspense join thriller
// - Sci-Fi, science fiction & psychological join mystery
const AXIS_SETS: Record<keyof GenreDna, Set<string>> = {
  action: new Set(["action", "adventure", "war", "western", "fantasy", "martial arts", "superhero"]),
  drama: new Set([
    "drama",
    "romance",
    "biography",
    "history",
    "sport",
    "music",
    "musical",
    "documentary",
    "short",
  ]),
  comedy: new Set(["comedy", "family", "animation"]),
  horror: new Set(["horror"]),
  thriller: new Set(["thriller", "crime", "film-noir", "suspense"]),
  mystery: new Set(["mystery", "sci-fi", "science fiction", "psychological"]),
};

const AXIS_ORDER: (keyof GenreDna)[] = [
  "action",
  "drama",
  "comedy",
  "horror",
  "thriller",
  "mystery",
];

// Weights for the 1st, 2nd, 3rd, … genre tag of a film (order of prominence).
const TAG_WEIGHTS = [1, 0.6, 0.4, 0.25, 0.15, 0.1];

/**
 * Compute genre affinities (0–100) for a list of watched entries.
 * Normalizes signal across matched axes so unrepresented tags don't discard
 * signal. Applies a gentle recency boost to the most recent films so new
 * watches visibly influence the radar.
 */
export function computeGenreDna(
  entries: { movie: { genres: string | null } | null }[],
): GenreDna {
  const withMovie = entries.filter((e) => e.movie);
  if (withMovie.length === 0) return { ...ZERO_DNA };

  const weighted: GenreDna = { ...ZERO_DNA };
  let totalSignal = 0;
  const n = withMovie.length;
  // Recent films (last 20 films or up to 25% of list) get 1.5x weight
  const recentThreshold = n > 5 ? n - Math.min(20, Math.max(5, Math.floor(n * 0.25))) : n;

  for (let idx = 0; idx < n; idx++) {
    const entry = withMovie[idx];
    const tags = (entry.movie?.genres || "")
      .split(",")
      .map((g) => g.trim().toLowerCase())
      .filter(Boolean);
    if (tags.length === 0) continue;

    const multiplier = idx >= recentThreshold ? 1.5 : 1.0;

    // Map each tag to its designated axis
    const matched: { axis: keyof GenreDna; weight: number }[] = [];
    tags.forEach((tag, i) => {
      for (const axis of AXIS_ORDER) {
        if (AXIS_SETS[axis].has(tag)) {
          matched.push({
            axis,
            weight: TAG_WEIGHTS[Math.min(i, TAG_WEIGHTS.length - 1)],
          });
          break; // each tag maps to at most one axis
        }
      }
    });

    if (matched.length === 0) continue;

    const matchedWeightSum = matched.reduce((sum, m) => sum + m.weight, 0);
    matched.forEach((m) => {
      const share = (m.weight / matchedWeightSum) * multiplier;
      weighted[m.axis] += share;
    });

    totalSignal += multiplier;
  }

  if (totalSignal === 0) return { ...ZERO_DNA };

  const result = {} as GenreDna;
  let sum = 0;
  let maxAxis: keyof GenreDna = "action";
  let maxVal = -1;

  for (const axis of AXIS_ORDER) {
    const pct = Math.round((weighted[axis] / totalSignal) * 100);
    result[axis] = pct;
    sum += pct;
    if (pct > maxVal) {
      maxVal = pct;
      maxAxis = axis;
    }
  }

  // Ensure integers sum to exactly 100% when there is signal
  if (sum !== 100 && sum > 0) {
    result[maxAxis] += 100 - sum;
  }

  return result;
}
