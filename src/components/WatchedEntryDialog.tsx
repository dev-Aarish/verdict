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

function ratingDescriptor(rating: number): string {
  if (rating <= 2) return "Abysmal";
  if (rating <= 4) return "Forgettable";
  if (rating <= 6) return "Middling";
  if (rating <= 8) return "Commendable";
  if (rating <= 9) return "Exceptional";
  return "Masterpiece";
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
      <DialogContent className="border border-dust/30 bg-velvet/95 backdrop-blur-md w-[calc(100vw-2rem)] max-w-sm rounded-none p-6 shadow-2xl">
        <DialogHeader className="text-left">
          <p className="text-caption text-brass text-xs uppercase tracking-widest">Archive Record</p>
          <DialogTitle className="text-card-title text-paper mt-1 font-serif line-clamp-1">{title}</DialogTitle>
          <DialogDescription className="text-caption text-dust">{subtitle}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-5 pt-2 pb-1">
          <div className="h-44 w-28 overflow-hidden bg-ink shadow-lg ring-1 ring-white/10 flex-shrink-0">
            <img
              src={posterSrc(posterUrl)}
              alt={posterAlt}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.src = "/film-placeholder.svg";
              }}
            />
          </div>

          <div className="w-full">
            <div className="flex items-baseline justify-between mb-2">
              <div className="flex flex-col">
                <span className="text-caption text-dust text-xs">Your Rating</span>
                <span className="text-xs font-mono text-brass/80">{ratingDescriptor(rating)}</span>
              </div>
              <span className="font-serif text-3xl font-bold text-brass">{rating}<span className="text-sm font-normal text-dust">/10</span></span>
            </div>
            <Slider
              value={[rating]}
              onValueChange={(v) => onRatingChange(v[0])}
              min={1}
              max={10}
              step={1}
              className="[&_[data-orientation=horizontal]]:h-2.5 my-2 cursor-pointer"
            />
            <div className="flex justify-between text-caption text-dust text-[0.65rem]">
              <span>1 · Flawed</span>
              <span>5 · Middling</span>
              <span>10 · Essential</span>
            </div>
          </div>

          <div className="w-full">
            <label className="text-caption text-dust text-xs mb-1.5 block">
              Personal Note <span className="opacity-60">· optional</span>
            </label>
            <Textarea
              value={note}
              onChange={(e) => onNoteChange(e.target.value)}
              placeholder="A line on why it struck or missed you…"
              rows={2}
              className="border border-dust/30 bg-ink/60 text-paper placeholder:text-dust/40 focus-visible:ring-1 focus-visible:ring-brass resize-none text-sm font-sans rounded-none transition-colors"
            />
          </div>

          {error && <p className="text-caption text-marquee-red text-xs text-center">{error}</p>}

          <div className="flex gap-3 w-full pt-1">
            <DialogClose asChild>
              <button
                type="button"
                className="flex-1 min-h-[44px] border border-dust/30 py-2.5 text-caption text-dust text-xs hover:text-paper hover:border-dust/60 active:scale-[0.98] transition-all cursor-pointer"
              >
                Cancel
              </button>
            </DialogClose>
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting}
              className="flex-1 min-h-[44px] border-2 border-brass bg-brass py-2.5 text-caption text-ink text-xs font-semibold hover:bg-transparent hover:text-brass active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {submitting ? submitBusyLabel : submitLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
