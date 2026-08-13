import type { TasteMatch } from "@/api/taste-match";

interface TasteMatchCardProps {
  username: string;
  match: TasteMatch;
}

export function TasteMatchCard({ username, match }: TasteMatchCardProps) {
  const agreement = Math.round(match.agreement);
  const filmWord = match.sharedFilms === 1 ? "film" : "films";

  return (
    <section className="hairline mt-10 pt-8 w-full max-w-md mx-auto text-center">
      <p className="text-caption tracking-[0.3em] text-dust mb-3">TASTE MATCH</p>
      <p className="text-paper leading-snug">
        You and <span className="text-brass">@{username}</span> share{" "}
        <span className="text-brass font-semibold">{match.sharedFilms}</span> {filmWord}, with{" "}
        <span className="text-brass font-semibold">{agreement}%</span> rating agreement.
      </p>
      {match.correlation !== null && (
        <p className="text-caption text-dust mt-2">
          Correlation <span className="text-brass">{match.correlation.toFixed(2)}</span>
        </p>
      )}
    </section>
  );
}
