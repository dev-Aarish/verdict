export interface Verdict {
  id: string;
  from: string;
  score: number;
  quote: string;
  when: string;
}

export interface Film {
  id: string;
  title: string;
  year: number;
  rating: number;
}

export interface Profile {
  username: string;
  joined: string;
  filmCount: number;
  tasteScore: number;
  breakdown: { diversity: number; obscurity: number; consistency: number };
  verdicts: Verdict[];
  watched: Film[];
}

export const sampleProfile: Profile = {
  username: "you",
  joined: "Mar 2026",
  filmCount: 127,
  tasteScore: 87,
  breakdown: { diversity: 82, obscurity: 91, consistency: 78 },
  verdicts: [
    { id: "1", from: "mira_k", score: 9, quote: "Deep cuts but no heart.", when: "2h" },
    { id: "2", from: "otto", score: 6, quote: "Solid but predictable.", when: "6h" },
    { id: "3", from: "june.b", score: 8, quote: "Reveres directors, ignores actors.", when: "1d" },
    { id: "4", from: "s_park", score: 4, quote: "Confuses long with important.", when: "2d" },
    { id: "5", from: "annika", score: 10, quote: "Genuine. Rare.", when: "3d" },
    { id: "6", from: "leo.v", score: 7, quote: "Would benefit from more silence.", when: "5d" },
  ],
  watched: Array.from({ length: 24 }).map((_, i) => ({
    id: String(i),
    title: [
      "Stalker",
      "Chungking Express",
      "Persona",
      "In the Mood for Love",
      "The Third Man",
      "Céline and Julie Go Boating",
      "Barry Lyndon",
      "Days of Being Wild",
      "Punch-Drunk Love",
      "Yi Yi",
      "L'Avventura",
      "Mulholland Drive",
      "The Long Goodbye",
      "Fanny and Alexander",
      "Playtime",
      "Le Samouraï",
      "Andrei Rublev",
      "Vagabond",
      "Werckmeister Harmonies",
      "Sátántangó",
      "Close-Up",
      "Taste of Cherry",
      "Wings of Desire",
      "Beau Travail",
    ][i],
    year: 1960 + ((i * 7) % 45),
    rating: 6 + ((i * 3) % 5),
  })),
};

export const globalFeed: Verdict[] = [
  { id: "a", from: "mira_k → dev.t", score: 9, quote: "Deep cuts but no heart.", when: "2m" },
  { id: "b", from: "otto → sam", score: 6, quote: "Solid but predictable.", when: "8m" },
  {
    id: "c",
    from: "june.b → leo.v",
    score: 8,
    quote: "Reveres directors, ignores actors.",
    when: "14m",
  },
  {
    id: "d",
    from: "s_park → mira_k",
    score: 4,
    quote: "Confuses long with important.",
    when: "22m",
  },
  { id: "e", from: "annika → otto", score: 10, quote: "Genuine. Rare.", when: "31m" },
  {
    id: "f",
    from: "leo.v → annika",
    score: 7,
    quote: "Would benefit from more silence.",
    when: "44m",
  },
  { id: "g", from: "dev.t → june.b", score: 3, quote: "Watches films, sees posters.", when: "1h" },
  { id: "h", from: "sam → s_park", score: 8, quote: "A generous critic. Suspicious.", when: "1h" },
];

export const leaderboard = [
  { rank: 1, user: "annika", score: 94 },
  { rank: 2, user: "mira_k", score: 91 },
  { rank: 3, user: "june.b", score: 89 },
  { rank: 4, user: "you", score: 87 },
  { rank: 5, user: "leo.v", score: 82 },
  { rank: 6, user: "otto", score: 78 },
  { rank: 7, user: "sam", score: 71 },
  { rank: 8, user: "s_park", score: 64 },
  { rank: 9, user: "dev.t", score: 52 },
];
