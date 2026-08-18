import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { avatarUrlFor, dicebearAvatar, AVATAR_PRESET_SEEDS, randomSeeds } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";

interface AvatarPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  username: string;
  currentAvatarUrl: string | null;
  onSave: (avatarUrl: string | null) => Promise<void>;
  saving: boolean;
  error: string | null;
}

export function AvatarPickerDialog({
  open,
  onOpenChange,
  username,
  currentAvatarUrl,
  onSave,
  saving,
  error,
}: AvatarPickerDialogProps) {
  const [selected, setSelected] = useState<string | null>(currentAvatarUrl);
  const [gridSeeds, setGridSeeds] = useState<string[]>(AVATAR_PRESET_SEEDS);

  useEffect(() => {
    if (open) {
      setSelected(currentAvatarUrl);
      setGridSeeds(AVATAR_PRESET_SEEDS);
    }
  }, [open, currentAvatarUrl]);

  const defaultAvatar = avatarUrlFor(username, null);
  const preview = avatarUrlFor(username, selected);
  const isSelected = (url: string) => selected === url;

  const handleShuffle = () => {
    setGridSeeds(randomSeeds(AVATAR_PRESET_SEEDS.length));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl bg-velvet border-white/10">
        <DialogHeader>
          <DialogTitle className="text-paper">Choose your avatar</DialogTitle>
          <DialogDescription className="text-dust">
            Pick a look, shuffle for more, or keep the auto-generated one tied to your username.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          <div className="h-20 w-20 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass">
            <img src={preview} alt="Avatar preview" className="h-full w-full object-cover" />
          </div>

          <div className="max-h-[50vh] w-full overflow-y-auto pr-1">
            <div className="grid w-full grid-cols-6 gap-2.5 sm:grid-cols-8 sm:gap-3">
              <button
                type="button"
                onClick={() => setSelected(null)}
                title="Auto (based on your username)"
                className={cn(
                  "aspect-square cursor-pointer overflow-hidden rounded-full bg-dust/20 ring-1 ring-white/10 transition-colors hover:ring-brass/60",
                  selected === null && "ring-2 ring-brass ring-offset-2 ring-offset-velvet",
                )}
              >
                <img src={defaultAvatar} alt="Auto avatar" className="h-full w-full object-cover" />
              </button>
              {gridSeeds.map((seed) => {
                const url = dicebearAvatar(seed);
                return (
                  <button
                    key={seed}
                    type="button"
                    onClick={() => setSelected(url)}
                    title={seed}
                    className={cn(
                      "aspect-square cursor-pointer overflow-hidden rounded-full bg-dust/20 ring-1 ring-white/10 transition-colors hover:ring-brass/60",
                      isSelected(url) && "ring-2 ring-brass ring-offset-2 ring-offset-velvet",
                    )}
                  >
                    <img src={url} alt={`Avatar ${seed}`} className="h-full w-full object-cover" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleShuffle}
              className="flex cursor-pointer items-center gap-1.5 text-caption text-brass/60 text-xs transition-colors hover:text-brass"
            >
              <Shuffle className="h-3.5 w-3.5" />
              Shuffle
            </button>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="cursor-pointer text-caption text-brass/60 text-xs transition-colors hover:text-brass"
            >
              Reset to auto avatar
            </button>
          </div>
        </div>

        <DialogFooter>
          {error && <span className="text-caption text-marquee-red text-xs mr-auto">{error}</span>}
          <DialogClose
            type="button"
            disabled={saving}
            className="border border-dust/30 px-4 py-2 text-caption text-dust transition-colors hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
          >
            Cancel
          </DialogClose>
          <button
            type="button"
            onClick={() => onSave(selected)}
            disabled={saving}
            className="cursor-pointer border border-brass px-4 py-2 text-caption text-brass transition-colors hover:bg-brass hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
