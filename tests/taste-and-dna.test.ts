import { describe, expect, it } from "bun:test";
import { computeGenreDna, ZERO_DNA } from "../src/lib/genre-dna";
import {
  computeDiversity,
  computeConsistency,
  parseBoxOffice,
  parseAwardsCount,
} from "../server/src/routes/taste-score";

describe("Genre DNA Engine", () => {
  it("returns ZERO_DNA when entries are empty", () => {
    expect(computeGenreDna([])).toEqual(ZERO_DNA);
  });

  it("handles Sci-Fi properly (maps to mystery axis)", () => {
    const res = computeGenreDna([{ movie: { genres: "Sci-Fi" } }]);
    expect(res.mystery).toBe(100);
    expect(res.action).toBe(0);
  });

  it("handles Action and Sci-Fi together with exact 100% sum", () => {
    const res = computeGenreDna([{ movie: { genres: "Action, Sci-Fi" } }]);
    expect(res.action).toBeGreaterThan(50);
    expect(res.mystery).toBeGreaterThan(30);
    const sum = res.action + res.drama + res.comedy + res.horror + res.thriller + res.mystery;
    expect(sum).toBe(100);
  });

  it("handles Fantasy & Adventure (maps to action axis)", () => {
    const res = computeGenreDna([{ movie: { genres: "Fantasy, Adventure" } }]);
    expect(res.action).toBe(100);
  });

  it("handles Documentary (maps to drama axis)", () => {
    const res = computeGenreDna([{ movie: { genres: "Documentary" } }]);
    expect(res.drama).toBe(100);
  });

  it("distributes across multiple movies with recency sensitivity", () => {
    const entries = [
      { movie: { genres: "Drama" } },
      { movie: { genres: "Drama" } },
      { movie: { genres: "Drama" } },
      { movie: { genres: "Drama" } },
      { movie: { genres: "Drama" } },
      { movie: { genres: "Drama" } },
      { movie: { genres: "Horror" } },
    ];
    const res = computeGenreDna(entries);
    expect(res.horror).toBeGreaterThan(15);
    const sum = res.action + res.drama + res.comedy + res.horror + res.thriller + res.mystery;
    expect(sum).toBe(100);
  });
});

describe("Taste Score Engine", () => {
  it("computeDiversity returns 0 for empty list and baseline for 1 film", () => {
    expect(computeDiversity([])).toBe(0);
    expect(computeDiversity([{ genres: "Drama", director: "Nolan", country: "USA", year: "2020" }])).toBe(30);
  });

  it("computeDiversity scales sensibly with entropy and distinct directors", () => {
    const diverseList = [
      { genres: "Drama", director: "Director A", country: "France", year: "1960" },
      { genres: "Horror", director: "Director B", country: "Japan", year: "1980" },
      { genres: "Sci-Fi", director: "Director C", country: "UK", year: "2000" },
      { genres: "Comedy", director: "Director D", country: "USA", year: "2010" },
      { genres: "Thriller", director: "Director E", country: "Korea", year: "2020" },
    ];
    const score = computeDiversity(diverseList);
    expect(score).toBeGreaterThan(60);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("computeConsistency scores 100 for single film or identical ratings", () => {
    expect(computeConsistency([8])).toBe(100);
    expect(computeConsistency([8, 8, 8, 8])).toBe(100);
  });

  it("computeConsistency penalizes chaotic swings", () => {
    const clustered = computeConsistency([7, 8, 7, 8, 7, 8]);
    const chaotic = computeConsistency([1, 10, 1, 10, 1, 10]);
    expect(clustered).toBeGreaterThan(chaotic);
  });

  it("parseBoxOffice extracts correct numeric values", () => {
    expect(parseBoxOffice("$162,517,900")).toBe(162517900);
    expect(parseBoxOffice(null)).toBe(0);
    expect(parseBoxOffice("N/A")).toBe(0);
  });

  it("parseAwardsCount scores awards correctly", () => {
    expect(parseAwardsCount("Won 1 Oscar. 71 wins & 268 nominations total")).toBeGreaterThan(50);
    expect(parseAwardsCount(null)).toBe(0);
  });
});
