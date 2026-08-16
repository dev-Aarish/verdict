import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface WatchedEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  posterUrl: string | null;
  posterAlt: string;
  rating: number;
  onRatingChange: (rating: number) => void;
  note: string;
  onNoteChange: (note: string) => void;
  error: string | null;
  submitting: boolean;
  submitLabel: string;
  submitBusyLabel: string;
  onSubmit: () => void;
}

function posterSrc(url: string | null) {
  return url && url !== "N/A" ? url : "/film-placeholder.svg";
}

export function WatchedEntryDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  posterUrl,
  posterAlt,
  rating,
  onRatingChange,
  note,
  onNoteChange,
  error,
  submitting,
  submitLabel,
  submitBusyLabel,
  onSubmit,
}: WatchedEntryDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onOpenChange(o)}>
      <DialogContent className="border border-dust/30 bg-velvet w-[calc(100vw-2rem)] max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-card-title text-paper">{title}</DialogTitle>
          <DialogDescription className="text-caption text-dust">{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          <div className="h-48 w-32 overflow-hidden bg-ink ring-1 ring-white/10">
            <img
              src={posterSrc(posterUrl)}
              alt={posterAlt}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/film-placeholder.svg";
              }}
            />
          </div>

          <div className="w-full max-w-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-caption text-dust text-xs">Your rating</span>
              <span className="text-score text-brass text-4xl">{rating}</span>
            </div>
            <Slider
              value={[rating]}
              onValueChange={(v) => onRatingChange(v[0])}
              min={1}
              max={10}
              step={1}
              className="[&_[data-orientation=horizontal]]:h-2"
            />
            <div className="flex justify-between text-caption text-dust text-[0.6rem] mt-1">
              <span>Miss</span>
              <span>Masterpiece</span>
            </div>
          </div>

          <div className="w-full max-w-xs">
            <span className="text-caption text-dust text-xs mb-2 block">
              Note <span className="opacity-60">· optional · shown on your profile</span>
            </span>
            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="Why you'll never trust them again…"
              rows={2}
              className="border-dust/30 bg-ink/40 text-paper placeholder:text-dust/50 focus-visible:ring-brass resize-none"
            />
          </div>

          {error && <p className="text-caption text-marquee-red text-xs">{error}</p>}

          <div className="flex gap-3 w-full">
            <DialogClose asChild>
              <button className="flex-1 border border-dust/40 py-2 text-caption text-dust text-xs hover:text-paper transition-colors cursor-pointer">
                Cancel
              </button>
            </DialogClose>
            <button
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 bg-brass py-2 text-caption text-ink text-xs hover:bg-brass/90 transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? submitBusyLabel : submitLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
