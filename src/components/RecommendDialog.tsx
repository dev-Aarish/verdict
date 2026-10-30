import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { searchUsersFn } from "@/api/users";
import { searchMoviesFn } from "@/api/movies";
import { sendRecommendationFn } from "@/api/recommendations";
import { avatarUrlFor } from "@/lib/avatar";
import { useUser } from "@/lib/user-context";
import { toast } from "sonner";
import { Search, Film, User, Check, Loader2, Sparkles, X } from "lucide-react";

interface RecommendMovie {
  imdbId: string;
  title: string;
  year?: string | null;
  posterUrl?: string | null;
}

interface RecommendTargetUser {
  id?: string;
  username: string;
  avatarUrl?: string | null;
}

interface RecommendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  movie?: RecommendMovie | null;
  targetUser?: RecommendTargetUser | null;
  onSuccess?: () => void;
}

export function RecommendDialog({
  open,
  onOpenChange,
  movie: initialMovie,
  targetUser: initialTargetUser,
  onSuccess,
}: RecommendDialogProps) {
  const { user: currentUser } = useUser();

  const [selectedMovie, setSelectedMovie] = useState<RecommendMovie | null>(initialMovie || null);
  const [selectedUser, setSelectedUser] = useState<RecommendTargetUser | null>(
    initialTargetUser || null,
  );
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // User search state
  const [userQuery, setUserQuery] = useState("");
  const [userResults, setUserResults] = useState<any[]>([]);
  const [userSearching, setUserSearching] = useState(false);

  // Movie search state
  const [movieQuery, setMovieQuery] = useState("");
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [movieSearching, setMovieSearching] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedMovie(initialMovie || null);
      setSelectedUser(initialTargetUser || null);
      setNote("");
      setUserQuery("");
      setUserResults([]);
      setMovieQuery("");
      setMovieResults([]);
    }
  }, [open, initialMovie, initialTargetUser]);

  // Debounced user search
  useEffect(() => {
    if (!open || selectedUser || initialTargetUser) return;
    const trimmed = userQuery.trim();
    if (trimmed.length < 1) {
      setUserResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setUserSearching(true);
      try {
        const res = await searchUsersFn({ data: { query: trimmed } });
        // filter out current user
        const filtered = (res.users || []).filter(
          (u: any) => u.username.toLowerCase() !== currentUser?.username.toLowerCase(),
        );
        setUserResults(filtered);
      } catch (err) {
        console.error("User search error:", err);
      } finally {
        setUserSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [userQuery, open, selectedUser, initialTargetUser, currentUser]);

  // Debounced movie search
  useEffect(() => {
    if (!open || selectedMovie || initialMovie) return;
    const trimmed = movieQuery.trim();
    if (trimmed.length < 2) {
      setMovieResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setMovieSearching(true);
      try {
        const res = await searchMoviesFn({ data: { query: trimmed } });
        setMovieResults(res.results || []);
      } catch (err) {
        console.error("Movie search error:", err);
      } finally {
        setMovieSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [movieQuery, open, selectedMovie, initialMovie]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMovie) {
      toast.error("Please choose a movie to recommend");
      return;
    }
    if (!selectedUser) {
      toast.error("Please choose a recipient");
      return;
    }

    setSubmitting(true);
    try {
      await sendRecommendationFn({
        data: {
          toUserId: selectedUser.id,
          toUsername: selectedUser.username,
          imdbId: selectedMovie.imdbId,
          title: selectedMovie.title,
          year: selectedMovie.year || undefined,
          posterUrl: selectedMovie.posterUrl || undefined,
          note: note.trim() || undefined,
        },
      });

      toast.success(`Recommended "${selectedMovie.title}" to @${selectedUser.username}`);
      onOpenChange(false);
      onSuccess?.();
    } catch (err: any) {
      const msg = err?.message || "Failed to send recommendation";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const posterSrc = (url?: string | null) =>
    url && url !== "N/A" ? url : "/film-placeholder.svg";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-ink border border-dust/20 text-paper p-6 sm:rounded-lg">
        <DialogHeader className="text-left space-y-1">
          <DialogTitle className="text-section font-serif text-paper flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brass" />
            Recommend a Film
          </DialogTitle>
          <DialogDescription className="text-caption text-dust text-xs">
            Pass a movie to a fellow cinephile with a personal pitch.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Movie Selection / Preview */}
          <div className="space-y-1.5">
            <label className="text-caption text-dust text-[0.65rem] uppercase font-mono tracking-wider">
              Film
            </label>

            {selectedMovie ? (
              <div className="flex items-center justify-between p-2.5 rounded border border-brass/40 bg-velvet/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-12 w-8 shrink-0 overflow-hidden rounded bg-black/40 ring-1 ring-white/10">
                    <img
                      src={posterSrc(selectedMovie.posterUrl)}
                      alt={selectedMovie.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-paper truncate">{selectedMovie.title}</p>
                    <p className="text-caption text-dust text-xs">{selectedMovie.year || ""}</p>
                  </div>
                </div>
                {!initialMovie && (
                  <button
                    type="button"
                    onClick={() => setSelectedMovie(null)}
                    className="p-1 text-dust hover:text-paper transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex items-center">
                  <Film className="absolute left-3 h-4 w-4 text-dust" />
                  <input
                    type="text"
                    value={movieQuery}
                    onChange={(e) => setMovieQuery(e.target.value)}
                    placeholder="Search movie title..."
                    className="w-full bg-velvet/60 border border-dust/20 rounded pl-9 pr-3 py-2 text-sm text-paper placeholder:text-dust/50 focus:outline-none focus:border-brass/70 font-sans"
                    autoFocus
                  />
                  {movieSearching && (
                    <Loader2 className="absolute right-3 h-4 w-4 text-dust animate-spin" />
                  )}
                </div>

                {movieResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded border border-dust/30 bg-ink/95 shadow-2xl divide-y divide-dust/10">
                    {movieResults.map((m: any) => (
                      <button
                        key={m.imdbId}
                        type="button"
                        onClick={() => {
                          setSelectedMovie({
                            imdbId: m.imdbId,
                            title: m.title,
                            year: m.year,
                            posterUrl: m.posterUrl,
                          });
                          setMovieQuery("");
                          setMovieResults([]);
                        }}
                        className="w-full flex items-center gap-3 p-2 text-left hover:bg-velvet/80 transition-colors"
                      >
                        <img
                          src={posterSrc(m.posterUrl)}
                          alt={m.title}
                          className="h-9 w-6 shrink-0 object-cover rounded ring-1 ring-white/10"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-paper truncate">{m.title}</p>
                          <p className="text-[0.65rem] text-dust font-mono">{m.year}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Recipient Selection / Preview */}
          <div className="space-y-1.5">
            <label className="text-caption text-dust text-[0.65rem] uppercase font-mono tracking-wider">
              Recommend To
            </label>

            {selectedUser ? (
              <div className="flex items-center justify-between p-2.5 rounded border border-brass/40 bg-velvet/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-dust/20 ring-1 ring-white/10">
                    <img
                      src={avatarUrlFor(selectedUser.username, selectedUser.avatarUrl)}
                      alt={selectedUser.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-sm font-medium text-brass truncate">
                    @{selectedUser.username}
                  </span>
                </div>
                {!initialTargetUser && (
                  <button
                    type="button"
                    onClick={() => setSelectedUser(null)}
                    className="p-1 text-dust hover:text-paper transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ) : (
              <div className="relative">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-dust" />
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full bg-velvet/60 border border-dust/20 rounded pl-9 pr-3 py-2 text-sm text-paper placeholder:text-dust/50 focus:outline-none focus:border-brass/70 font-sans"
                  />
                  {userSearching && (
                    <Loader2 className="absolute right-3 h-4 w-4 text-dust animate-spin" />
                  )}
                </div>

                {userResults.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded border border-dust/30 bg-ink/95 shadow-2xl divide-y divide-dust/10">
                    {userResults.map((u: any) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser({
                            id: u.id,
                            username: u.username,
                            avatarUrl: u.avatarUrl,
                          });
                          setUserQuery("");
                          setUserResults([]);
                        }}
                        className="w-full flex items-center justify-between p-2 text-left hover:bg-velvet/80 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={avatarUrlFor(u.username, u.avatarUrl)}
                            alt={u.username}
                            className="h-7 w-7 rounded-full object-cover shrink-0"
                          />
                          <span className="text-xs font-medium text-paper truncate">
                            @{u.username}
                          </span>
                        </div>
                        {u.filmCount !== undefined && (
                          <span className="text-[0.65rem] text-dust font-mono">
                            {u.filmCount} film{u.filmCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Personal Note */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-caption text-dust text-[0.65rem] uppercase font-mono tracking-wider">
                Personal Pitch / Note (Optional)
              </label>
              <span className="text-[0.65rem] text-dust/60 font-mono">{note.length}/500</span>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 500))}
              placeholder="e.g. Because you loved Parasite, you have to watch this..."
              rows={3}
              className="w-full bg-velvet/60 border border-dust/20 rounded p-2.5 text-xs text-paper placeholder:text-dust/50 focus:outline-none focus:border-brass/70 resize-none font-sans"
            />
          </div>

          {/* Submit Footer */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-dust hover:text-paper transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedMovie || !selectedUser}
              className="flex items-center gap-2 px-5 py-2 text-xs font-mono uppercase tracking-widest bg-brass text-ink font-semibold rounded hover:bg-brass/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Send Recommendation
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
