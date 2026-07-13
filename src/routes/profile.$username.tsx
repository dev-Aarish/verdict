import { createFileRoute } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";
import { getUserWatchedFn, removeWatchedFn } from "@/api/movies";
import { getTasteScoreFn, type TasteBreakdown } from "@/api/taste-score";
import { useUser } from "@/lib/user-context";
import { useState } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();
  const { user } = useUser();
  const router = useRouter();
  const isOwn = user?.username === username;
  const [entries, setEntries] = useState<any[] | null>(null);
  const [profileUser, setProfileUser] = useState<any>(null);
  const [tasteScore, setTasteScore] = useState<{ score: number; breakdown: TasteBreakdown } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useState(() => {
    Promise.all([
      getUserWatchedFn({ data: { username } }),
      getTasteScoreFn({ data: { username } }).catch(() => null),
    ])
      .then(([data, taste]) => {
        setProfileUser(data.user);
        setEntries(data.entries);
        setTasteScore(taste);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  });

  const handleRemove = async (entryId: string) => {
    try {
      await removeWatchedFn({ data: { entryId } });
      setEntries((prev) => prev?.filter((e) => e.id !== entryId) || []);
      router.invalidate();
    } catch (e) {
      console.error("Failed to remove", e);
    }
  };

  const posterSrc = (url: string | null) => (url && url !== "N/A" ? url : "/film-placeholder.svg");

  if (loading) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-caption text-dust text-center py-24">Loading...</p>
        </main>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen">
        <TopBar />
        <main className="mx-auto max-w-6xl px-6 py-12">
          <p className="text-caption text-dust text-center py-24">User not found.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUser.username}`}
                alt={profileUser.username}
              />
            </div>
          </div>
          <div>
            <h1 className="text-section text-paper">{profileUser.username}</h1>
            <p className="text-caption text-dust">
              {entries?.length || 0} film{(entries?.length || 0) !== 1 ? "s" : ""} logged
            </p>
          </div>
        </div>

        {tasteScore && (
          <div className="hairline mt-10 pt-8 w-full max-w-md mx-auto">
            <div className="flex items-center justify-center gap-8 mb-6">
              <div className="flex flex-col items-center">
                <span className="text-[2.5rem] font-bold text-brass leading-none">
                  {tasteScore.score}
                </span>
                <span className="text-caption text-dust mt-1">Taste Score</span>
              </div>
              <div className="flex gap-6">
                {(
                  [
                    { label: "Diversity", value: tasteScore.breakdown.diversity },
                    { label: "Obscurity", value: tasteScore.breakdown.obscurity },
                    { label: "Consistency", value: tasteScore.breakdown.consistency },
                  ] as const
                ).map((item) => (
                  <div key={item.label} className="flex flex-col items-center">
                    <span className="text-lg font-semibold text-brass">{item.value}</span>
                    <span className="text-caption text-dust text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <section className="hairline mt-10 pt-8">
          <h2 className="text-card-title text-paper mb-6">Watched Films</h2>

          {(!entries || entries.length === 0) && (
            <p className="text-caption text-dust text-center py-12">
              No films logged yet.
              {isOwn && " Search for films to add to your list."}
            </p>
          )}

          {entries && entries.length > 0 && (
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {entries.map((entry) => {
                const movie = entry.movie;
                if (!movie) return null;
                return (
                  <div key={entry.id} className="group relative flex flex-col">
                    <div className="relative aspect-[2/3] overflow-hidden bg-velvet ring-1 ring-white/5">
                      <img
                        src={posterSrc(movie.posterUrl)}
                        alt={movie.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.src = "/film-placeholder.svg"; }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Stamp size="sm" rotation={-2}>
                          {entry.rating}
                        </Stamp>
                      </div>
                    </div>
                    <div className="mt-2 flex-1">
                      <h3 className="text-sm font-medium text-paper leading-tight">
                        {movie.title}
                      </h3>
                      <p className="text-caption text-dust text-xs">
                        {movie.year} · <span className="text-brass">{entry.rating}/10</span>
                      </p>
                      {movie.director && (
                        <p className="text-caption text-dust text-[0.6rem] mt-0.5">
                          {movie.director}
                        </p>
                      )}
                    </div>
                    {isOwn && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <button className="mt-1 w-full py-1 border border-marquee-red/40 text-marquee-red text-caption text-[0.6rem] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-marquee-red/10 cursor-pointer">
                            Remove
                          </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-velvet border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-paper">Remove film?</AlertDialogTitle>
                            <AlertDialogDescription className="text-dust">
                              Remove "{movie.title}" from your watched list? This cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/10 text-paper bg-transparent hover:bg-white/5">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRemove(entry.id)}
                              className="bg-marquee-red text-white hover:bg-marquee-red/80"
                            >
                              Remove
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
