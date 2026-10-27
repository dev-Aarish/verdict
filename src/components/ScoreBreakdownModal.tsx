import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { TasteBreakdown } from "@/api/taste-score";
import type { GenreDna } from "@/lib/genre-dna";

interface ScoreBreakdownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasteScore: { score: number; breakdown: TasteBreakdown } | null;
  dna: GenreDna | null;
  username: string;
}

export function ScoreBreakdownModal({
  open,
  onOpenChange,
  tasteScore,
  dna,
  username,
}: ScoreBreakdownModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border border-dust/30 bg-velvet text-paper w-[calc(100vw-2rem)] max-w-lg max-h-[85vh] overflow-y-auto no-scrollbar"
        style={{ scrollbarWidth: "none" }}
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-card-title text-paper">
            Taste Metrics & Parameters
          </DialogTitle>
          <DialogDescription className="text-caption text-dust">
            How Verdict analyzes @{username}’s cinematic fingerprint.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-2 pb-1 text-sm text-paper/90">
          {/* Taste Score Formula */}
          {tasteScore && (
            <div className="rounded-lg border border-brass/30 bg-ink/50 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption uppercase tracking-wider text-brass font-semibold">
                  Taste Score: {tasteScore.score}/100
                </span>
                <span className="mono text-xs text-dust">Weighted Index</span>
              </div>
              <p className="text-xs text-dust mb-3">
                Calculated from three weighted parameters:
              </p>
              <div className="mono text-xs bg-ink/70 p-2.5 rounded border border-white/5 text-brass/90 text-center">
                Score = (Diversity × 40%) + (Obscurity × 40%) + (Consistency × 20%)
              </div>

              {/* 3 Parameter Cards */}
              <div className="mt-4 space-y-3">
                {/* Diversity */}
                <div className="rounded border border-dust/20 bg-ink/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brass">
                      Diversity · {tasteScore.breakdown.diversity}%
                    </span>
                    <span className="text-xs text-dust">40% weight</span>
                  </div>
                  <p className="text-xs text-dust mt-1 leading-relaxed">
                    Measures the variety and evenness of your watch history using genre distribution
                    entropy, distinct director ratio, release decade breadth (from classic to contemporary),
                    and international cinema representation.
                  </p>
                </div>

                {/* Obscurity */}
                <div className="rounded border border-dust/20 bg-ink/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brass">
                      Obscurity · {tasteScore.breakdown.obscurity}%
                    </span>
                    <span className="text-xs text-dust">40% weight</span>
                  </div>
                  <p className="text-xs text-dust mt-1 leading-relaxed">
                    Measures how far off the beaten path your watchlist ventures. Calibrated by real-world
                    global box office, major award recognition (Oscars/BAFTAs/festivals), and rarity within
                    the Verdict community. High-budget blockbusters lower obscurity, while art-house and indie
                    films raise it.
                  </p>
                </div>

                {/* Consistency */}
                <div className="rounded border border-dust/20 bg-ink/40 p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-brass">
                      Consistency · {tasteScore.breakdown.consistency}%
                    </span>
                    <span className="text-xs text-dust">20% weight</span>
                  </div>
                  <p className="text-xs text-dust mt-1 leading-relaxed">
                    Measures rating discernment based on standard deviation. Clustered, thoughtful
                    evaluations score higher than erratic, extreme swings between 1s and 10s.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Genre DNA Breakdown */}
          {dna && (
            <div className="rounded-lg border border-dust/20 bg-ink/40 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-caption uppercase tracking-wider text-brass font-semibold">
                  Genre DNA Radar
                </span>
                <span className="mono text-xs text-dust">6 Core Axes</span>
              </div>
              <p className="text-xs text-dust mb-3 leading-relaxed">
                Represents your proportional affinity across 6 cinematic lobes. Each film splits its signal
                across its genre tags in order of prominence:
              </p>

              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">ACTION ({dna.action}%):</span>
                  <span className="text-dust block text-[11px]">Adventure, War, Western, Fantasy</span>
                </div>
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">DRAMA ({dna.drama}%):</span>
                  <span className="text-dust block text-[11px]">Romance, Biography, History, Docs</span>
                </div>
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">COMEDY ({dna.comedy}%):</span>
                  <span className="text-dust block text-[11px]">Family, Animation, Satire</span>
                </div>
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">HORROR ({dna.horror}%):</span>
                  <span className="text-dust block text-[11px]">Supernatural, Slasher, Creature</span>
                </div>
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">THRILLER ({dna.thriller}%):</span>
                  <span className="text-dust block text-[11px]">Crime, Film-Noir, Suspense</span>
                </div>
                <div className="p-2 rounded bg-ink/60 border border-white/5">
                  <span className="text-brass font-mono">MYSTERY ({dna.mystery}%):</span>
                  <span className="text-dust block text-[11px]">Sci-Fi, Psychological, Whodunnit</span>
                </div>
              </div>

              <p className="text-[11px] text-dust italic">
                * Dynamic Sensitivity: Your recent watches carry a 1.5× recency weighting so the radar actively
                evolves as you log new movies instead of staying frozen.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
