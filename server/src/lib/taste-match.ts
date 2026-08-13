export interface RatedFilm {
  imdbId: string;
  rating: number;
}

export interface TasteMatchResult {
  sharedFilms: number;
  agreement: number;
  correlation: number | null;
}

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  const mx = x.reduce((s, v) => s + v, 0) / n;
  const my = y.reduce((s, v) => s + v, 0) / n;

  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < n; i++) {
    const xd = x[i] - mx;
    const yd = y[i] - my;
    num += xd * yd;
    dx += xd * xd;
    dy += yd * yd;
  }

  const denom = Math.sqrt(dx * dy);
  return denom === 0 ? 0 : num / denom;
}

export function computeTasteMatch(
  viewerFilms: RatedFilm[],
  targetFilms: RatedFilm[],
): TasteMatchResult {
  const shared: { a: number; b: number }[] = [];

  const viewerMap = new Map(viewerFilms.map((f) => [f.imdbId, f.rating]));
  for (const { imdbId, rating } of targetFilms) {
    const viewerRating = viewerMap.get(imdbId);
    if (viewerRating !== undefined) shared.push({ a: viewerRating, b: rating });
  }

  const n = shared.length;
  if (n === 0) {
    return { sharedFilms: 0, agreement: 0, correlation: null };
  }

  const closeness = shared.reduce((sum, { a, b }) => sum + (1 - Math.abs(a - b) / 9), 0);
  const agreement = Math.round((closeness / n) * 100);

  const correlation =
    n >= 2
      ? pearson(
          shared.map((s) => s.a),
          shared.map((s) => s.b),
        )
      : null;

  return { sharedFilms: n, agreement, correlation };
}
